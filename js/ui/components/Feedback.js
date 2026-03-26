/**
 * Resilient Visuals: Manage Edge States (Loading, Error, Empty).
 */

export function renderLoader(container) {
  container.innerHTML = `
    <div class="spinner"></div>
    <p>Cargando catálogo...</p>
  `;
}

export function renderError(container, message) {
  container.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" stroke-width="2" style="margin-bottom: 16px;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <p style="color: var(--color-red); font-weight: bold; margin-bottom: 8px;">Ocurrió un Error</p>
    <p style="font-size: var(--font-size-sm);">${message}</p>
  `;
}

export function renderEmpty(container) {
  container.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <p>No hay productos en esta categoría.</p>
  `;
}
