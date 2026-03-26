/**
 * Pure function to generate a TicketCard DOM element.
 * UI is dumb: it only receives data and maps it to a view.
 * 
 * @param {Object} product The product data
 * @returns {HTMLElement} The generated ticket card
 */
export function createTicketCard(product) {
  const card = document.createElement('article');
  card.className = 'ticket-card';
  
  // Theme logic based on Design Vibe
  let theme = 'green';
  const cat = product.categoria.toLowerCase();
  if (cat === 'bebidas') theme = 'green';
  if (cat === 'otros') theme = 'blue';
  if (cat === 'galletas' || product.nombre.toLowerCase().includes('nesquick')) theme = 'yellow';
  
  card.setAttribute('data-theme', theme);
  card.setAttribute('data-id', product.id);
  
  const price = typeof product.precio === 'number' ? product.precio.toFixed(2) : parseFloat(product.precio).toFixed(2);
  
  card.innerHTML = `
    <div class="card-actions menu-container">
      <button type="button" class="btn-icon three-dots-btn" aria-label="Opciones" data-id="${product.id}">
        <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="12" cy="19" r="2"></circle>
        </svg>
      </button>
      <div class="menu-dropdown hidden" id="dropdown-${product.id}">
        <button type="button" class="menu-item edit-btn" data-id="${product.id}">Editar</button>
        <button type="button" class="menu-item delete-btn" data-id="${product.id}">Eliminar</button>
      </div>
    </div>
    <div class="card-img-container">
      <img src="${product.imagen_url}" alt="${product.nombre}" loading="lazy" onerror="this.src='https://via.placeholder.com/150/FFFFFF/CCCCCC?text=Error'">
    </div>
    <div class="ticket-divider"></div>
    <div class="card-content">
      <h3 class="card-title">${product.nombre}</h3>
      <p class="card-subtitle">${product.categoria}</p>
      <div class="card-footer">
        <p class="card-price"><span>$</span>${price}</p>
        <span class="card-badge">Disp.</span>
      </div>
    </div>
  `;
  return card;
}
