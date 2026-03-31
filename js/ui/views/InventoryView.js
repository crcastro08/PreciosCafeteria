import { renderLoader, renderError, renderEmpty } from '../components/Feedback.js';

/**
 * Controller for the Inventory view.
 */
export class InventoryView {
  constructor(store, db) {
    this.store = store;
    this.db = db;
    this.listContainer = document.getElementById('inventory-list');
    this.feedback = document.getElementById('feedback-container');
    this.navInventory = document.getElementById('nav-inventory');
    this.navCatalog = document.getElementById('nav-catalog');
    this.navAdmin = document.getElementById('nav-admin');
    this.sections = {
      catalog: document.getElementById('catalog-view'),
      admin: document.getElementById('admin-view'),
      inventory: document.getElementById('inventory-view')
    };

    this.store.subscribe(this.render.bind(this));
    this.setupListeners();
  }

  setupListeners() {
    this.navInventory.addEventListener('click', () => {
      this.toggleView('inventory');
      this.fetchInventory();
    });
  }

  toggleView(viewName) {
    Object.keys(this.sections).forEach(name => {
      const section = this.sections[name];
      if (name === viewName) {
        section.classList.replace('view-hidden', 'view-active');
      } else {
        section.classList.replace('view-active', 'view-hidden');
      }
    });

    // Update nav icons
    this.navInventory.classList.toggle('active', viewName === 'inventory');
    this.navCatalog.classList.toggle('active', viewName === 'catalog');
    this.navAdmin.classList.toggle('active', viewName === 'admin');

    // Hide FAB in inventory
    const fab = document.getElementById('fab-add');
    if (fab) fab.style.display = (viewName === 'catalog') ? 'flex' : 'none';
  }

  async fetchInventory() {
    this.store.setState({ loading: true, error: null });
    try {
      const products = await this.db.getProducts();
      const inventory = await this.db.getInventory();
      this.store.setState({ products, inventory, loading: false });
    } catch (err) {
      this.store.setState({ error: err.message, loading: false });
    }
  }

  async updateStock(productId, newQuantity) {
    try {
      await this.db.updateInventory(productId, newQuantity);
      const currentInventory = this.store.getState().inventory;
      const updatedInventory = currentInventory.map(item => 
        item.producto_id === productId ? { ...item, cantidad: newQuantity } : item
      );
      
      // If the product wasn't in inventory yet, add it
      if (!updatedInventory.find(item => item.producto_id === productId)) {
        updatedInventory.push({ producto_id: productId, cantidad: newQuantity });
      }

      this.store.setState({ inventory: updatedInventory });
    } catch (err) {
      alert("Error actualizando inventario: " + err.message);
    }
  }

  render(state) {
    const isInventoryVisible = this.sections.inventory.classList.contains('view-active');
    if (!isInventoryVisible) return;

    if (state.loading) {
      this.listContainer.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderLoader(this.feedback);
      return;
    }

    if (state.error) {
      this.listContainer.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderError(this.feedback, state.error);
      return;
    }

    if (state.products.length === 0) {
      this.listContainer.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderEmpty(this.feedback);
      return;
    }

    this.feedback.style.display = 'none';
    this.listContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    state.products.forEach(product => {
      const invItem = state.inventory.find(i => i.producto_id === product.id);
      const quantity = invItem ? invItem.cantidad : 0;

      const itemEl = document.createElement('div');
      itemEl.className = 'inventory-item-card';

      itemEl.innerHTML = `
        <div class="inventory-item-info">
          <h4 class="inventory-item-name">${product.nombre}</h4>
          <p class="inventory-item-category">${product.categoria}</p>
        </div>
        <div class="inventory-controls">
          <button class="stock-btn minus" data-id="${product.id}">-</button>
          <input type="number" class="stock-input" data-id="${product.id}" value="${quantity}">
          <button class="stock-btn plus" data-id="${product.id}">+</button>
        </div>
      `;

      fragment.appendChild(itemEl);
    });

    this.listContainer.appendChild(fragment);

    // Add events
    this.listContainer.querySelectorAll('.stock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const input = this.listContainer.querySelector(`.stock-input[data-id="${id}"]`);
        let val = parseInt(input.value) || 0;
        if (btn.classList.contains('plus')) val++;
        else if (btn.classList.contains('minus')) val = Math.max(0, val - 1);
        
        input.value = val;
        this.updateStock(id, val);
      });
    });

    this.listContainer.querySelectorAll('.stock-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.dataset.id;
        let val = parseInt(input.value) || 0;
        if (val < 0) val = 0;
        input.value = val;
        this.updateStock(id, val);
      });
    });
  }
}
