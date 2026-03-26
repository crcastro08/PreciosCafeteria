import { createTicketCard } from '../components/TicketCard.js';
import { renderLoader, renderError, renderEmpty } from '../components/Feedback.js';

/**
 * Controller for the main Catalog view.
 * Connects the dumb UI to the Store state.
 */
export class CatalogView {
  constructor(store, db) {
    this.store = store;
    this.db = db;
    this.grid = document.getElementById('product-grid');
    this.feedback = document.getElementById('feedback-container');
    this.tabs = document.querySelectorAll('.tab-btn');
    
    // Subscribe to store updates
    this.store.subscribe(this.render.bind(this));
    this.setupListeners();
  }

  setupListeners() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.store.setState({ activeCategory: category });
      });
    });
  }

  async fetchProducts() {
    this.store.setState({ loading: true, error: null });
    try {
      const data = await this.db.getProducts();
      // Immutable update
      this.store.setState({ products: data, loading: false });
    } catch (err) {
      this.store.setState({ error: err.message, loading: false });
    }
  }

  render(state) {
    // 1. Sync Tabs UI
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === state.activeCategory);
    });

    // 2. Early Returns for Edge States
    if (state.loading) {
      this.grid.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderLoader(this.feedback);
      return;
    }

    if (state.error) {
      this.grid.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderError(this.feedback, state.error);
      return;
    }

    // 3. Filter Data (Business Logic in View layer is fine for display purposes)
    const filtered = state.activeCategory === 'Todos' 
      ? state.products 
      : state.products.filter(p => p.categoria === state.activeCategory);

    // 4. Edge State: Empty
    if (filtered.length === 0) {
      this.grid.innerHTML = '';
      this.feedback.style.display = 'flex';
      renderEmpty(this.feedback);
      return;
    }

    // 5. Render Data
    this.feedback.style.display = 'none';
    this.grid.innerHTML = '';
    
    // Use DocumentFragment for atomic DOM appending (performance)
    const fragment = document.createDocumentFragment();
    filtered.forEach(product => {
      fragment.appendChild(createTicketCard(product));
    });
    this.grid.appendChild(fragment);

    // Attach menu listeners to grid
    this.grid.querySelectorAll('.three-dots-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Stop propagation to prevent global click listener from immediately closing it
        e.stopPropagation();
        const dropdown = btn.nextElementSibling;
        const isHidden = dropdown.classList.contains('hidden');
        document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.add('hidden'));
        if (isHidden) {
          dropdown.classList.remove('hidden');
        }
      });
    });

    this.grid.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.add('hidden'));
        this.handleEdit(e.target.dataset.id);
      });
    });

    this.grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.add('hidden'));
        this.handleDelete(e.target.dataset.id);
      });
    });
  }

  handleEdit(id) {
    const product = this.store.getState().products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.nombre;
    document.getElementById('product-category').value = product.categoria;
    document.getElementById('product-price').value = product.precio;
    
    document.getElementById('admin-form').querySelector('button[type="submit"]').textContent = 'Actualizar Producto';
    
    // Switch to admin view programmatically
    document.getElementById('catalog-view').classList.replace('view-active', 'view-hidden');
    document.getElementById('admin-view').classList.replace('view-hidden', 'view-active');
    document.getElementById('fab-add').style.display = 'none';
    document.getElementById('nav-admin').classList.add('active');
    document.getElementById('nav-catalog').classList.remove('active');
  }

  async handleDelete(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    
    try {
      await this.db.deleteProduct(id);
      const currentState = this.store.getState();
      const newProducts = currentState.products.filter(p => p.id !== id);
      this.store.setState({ products: newProducts });
      alert("Producto eliminado exitosamente");
      
      // If currently editing the deleted product, reset form
      if (document.getElementById('product-id').value === id) {
        document.getElementById('admin-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('admin-form').querySelector('button[type="submit"]').textContent = 'Guardar Producto';
      }
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }
}
