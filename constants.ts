import type { GeneratedFile } from './types';

export const initialFiles: GeneratedFile[] = [
  {
    path: 'preview.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-gray-100">
    <div id="root"></div>
    <script type="text/babel">
        const App = () => {
            return (
                <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center text-white p-4">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Welcome to N Vibe</h1>
                    <p className="text-xl text-gray-300">Enter a prompt above and click 'Generate' to create your app.</p>
                </div>
            );
        };

        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    </script>
</body>
</html>`
  },
  {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="index.tsx"></script>
</body>
</html>`
  },
  {
    path: 'App.tsx',
    content: `import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Welcome to N Vibe</h1>
        <p className="text-xl text-gray-300">This is a placeholder for your generated app.</p>
    </div>
  );
};

export default App;
`
  },
  {
    path: 'index.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
  }
];