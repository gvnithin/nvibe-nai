
import type { GeneratedFile } from '../types';

declare const JSZip: any;

export const downloadCodeAsZip = async (files: GeneratedFile[], appName: string = 'n-vibe-app') => {
  if (typeof JSZip === 'undefined') {
    alert('Could not download zip. JSZip library is missing.');
    return;
  }
  
  const zip = new JSZip();

  // Don't include the monolithic preview file in the developer-facing zip download
  const filesToZip = files.filter(file => file.path !== 'preview.html');

  filesToZip.forEach(file => {
    zip.file(file.path, file.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${appName.replace(/\s+/g, '-')}.zip`; // Sanitize filename
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
