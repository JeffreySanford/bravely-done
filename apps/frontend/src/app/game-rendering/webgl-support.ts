/** Best-effort check so we can skip mounting Three.js entirely on unsupported browsers/environments. */
export function isWebglAvailable(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
