
import { GoogleGenAI, Type, Modality, LiveSession } from "@google/genai";
import type { GeneratedFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAppCode(prompt: string, existingFiles?: GeneratedFile[], signal?: AbortSignal): Promise<GeneratedFile[]> {
    const model = "gemini-2.5-pro";
    let systemInstruction: string;
    let userContent: string;

    if (existingFiles && existingFiles.length > 0) {
        // This is an EDIT request
        systemInstruction = `You are a world-class senior frontend React engineer. Your task is to modify the provided existing application source code based on the user's edit request.

Strict Requirements:
1.  **Analyze the User's Request:** Carefully examine the user's prompt and the provided source code.
2.  **Apply Changes:** Apply the requested changes logically and efficiently to the relevant files.
3.  **Return All Files:** You MUST return the COMPLETE and UPDATED full set of application files, including the crucial 'preview.html', even if some files were not changed.
4.  **Maintain Stack:** The technology stack is React 18+, TypeScript, and Tailwind CSS. Do not introduce other technologies.
5.  **Self-Contained Preview:** The 'preview.html' file MUST remain a self-contained, monolithic file with all necessary CDN links and an inline babel script for live previewing.
6.  **JSON Output:** Your entire response MUST be a single, valid JSON object that conforms to the provided schema. Do not add any text, markdown, or explanation outside of the JSON object.`;
        
        const filesString = existingFiles
            .filter(f => f.path !== 'preview.html') // Don't send the preview file back, it's just a build artifact
            .map(f => `--- START OF FILE: ${f.path} ---\n${f.content}\n--- END OF FILE: ${f.path} ---`)
            .join('\n\n');
            
        userContent = `Apply the following changes to the application: "${prompt}"\n\nHere is the current code:\n${filesString}`;
    } else {
        // This is a GENERATE request
        systemInstruction = `You are a world-class senior frontend React engineer. Your task is to generate a complete, functional, and aesthetically pleasing single-page React web application based on the user's request.

Strict Requirements:
1.  **Technology Stack:** React 18+, TypeScript, Tailwind CSS.
2.  **File Structure:** Generate all necessary files, including \`index.html\`, \`index.tsx\`, \`App.tsx\`, and any additional components in a \`components/\` directory.
3.  **Styling:** Use Tailwind CSS exclusively. Load it from the CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`. Do not use any other CSS files, CSS-in-JS, or inline styles.
4.  **Preview Generation:** You must generate two sets of files:
    a. **Source Code Files:** Clean, well-structured source files (\`.tsx\`, \`.html\`) as a developer would write them.
    b. **A single \`preview.html\` file:** This is a monolithic, self-contained HTML file for live previewing. It must include all necessary CDN links (Tailwind, React, ReactDOM, Babel Standalone) and have all React components (including App and any sub-components) and rendering logic inside a single \`<script type='text/babel'>\` tag. This file is crucial for the live preview functionality.
5. **Output Format:** Your entire response MUST be a single, valid JSON object that conforms to the provided schema. Do not add any text, markdown, or explanation outside of the JSON object.
`;
        userContent = `Generate a web application based on this user request: "${prompt}"`;
    }

    const generationPromise = ai.models.generateContent({
        model,
        contents: userContent,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    files: {
                        type: Type.ARRAY,
                        description: "An array of file objects representing the complete and updated application.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                path: { type: Type.STRING, description: 'The full path of the file (e.g., "App.tsx", "components/Button.tsx", "preview.html").' },
                                content: { type: Type.STRING, description: 'The full source code or content of the file.' },
                            },
                            required: ['path', 'content'],
                        },
                    },
                },
                required: ['files'],
            },
        },
    });

    const abortPromise = new Promise((_, reject) => {
        if (signal) {
            signal.onabort = () => reject(new DOMException('The user aborted a request.', 'AbortError'));
        }
    });

    // The result will be of type GenerateContentResponse, but Promise.race returns Promise<unknown>
    const response = await Promise.race([generationPromise, abortPromise]) as any;

    const responseText = response.text.trim();
    try {
        const parsed = JSON.parse(responseText);
        if (parsed.files && Array.isArray(parsed.files)) {
            return parsed.files as GeneratedFile[];
        }
        throw new Error('Invalid JSON structure received from API.');
    } catch (e) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Could not understand the AI's response. Please try again.");
    }
}

export async function explainCode(code: string, fileName: string): Promise<string> {
    const model = "gemini-2.5-flash"; // A fast model is fine for this
    const systemInstruction = `You are an expert software engineer and code reviewer. Your task is to provide a clear, concise, and easy-to-understand explanation for the provided code snippet.

Strict Rules:
1. Start with a high-level summary of the file's purpose.
2. Break down the code into logical sections and explain each one.
3. Explain complex lines or functions in more detail.
4. Use markdown for formatting, including code blocks for snippets and bullet points for lists.
5. The tone should be helpful and educational.`;

    const userContent = `Please explain the following code from the file \`${fileName}\`:\n\n\`\`\`\n${code}\n\`\`\``;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: userContent,
            config: {
                systemInstruction,
            },
        });
        return response.text;
    } catch (e) {
        console.error("Failed to get code explanation from Gemini:", e);
        throw new Error("Could not get code explanation. The AI service may be unavailable.");
    }
}


export function startTranscriptionSession(
    onTranscriptionUpdate: (text: string) => void,
    onError: (error: Error) => void
): Promise<LiveSession> {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            inputAudioTranscription: {},
            // The Live API needs to be initiated as an audio session, even if we only care about transcription.
            responseModalities: [Modality.AUDIO],
            // A speechConfig is required to satisfy the API for an audio modality session, even for transcription.
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
        },
        callbacks: {
            onopen: () => {
                console.log('Live session opened.');
            },
            onmessage: (message) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    if (text) {
                        onTranscriptionUpdate(text);
                    }
                }
            },
            onerror: (e) => {
                console.error('Live session error:', e);
                onError(new Error('Live session error. Please try again.'));
            },
            onclose: (e) => {
                console.log('Live session closed.');
            },
        },
    });
}