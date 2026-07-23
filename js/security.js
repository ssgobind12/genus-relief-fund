/**
 * Security module to deter casual inspection of the source code.
 */

export function initSecurity() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Disable common developer tools keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    
    // Ctrl+Shift+I (Inspector) / Ctrl+Shift+J (Console) / Ctrl+Shift+C (Element selection)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault();
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault();
    }
  });

  // Anti-debugging trap (freezes DevTools if opened)
  setInterval(() => {
    (function () {
      return false;
    }
      ['constructor']('debugger')
      ['call']());
  }, 2000);
}
