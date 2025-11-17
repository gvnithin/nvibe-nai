
export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ProjectState {
    files: GeneratedFile[];
    projectName: string;
    projectDescription?: string;
}

export type DeviceView = 'desktop' | 'tablet' | 'mobile';
