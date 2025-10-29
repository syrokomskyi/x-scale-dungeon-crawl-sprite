declare global {
  interface Window {
    showToast: (message?: string) => void;
  }
}
