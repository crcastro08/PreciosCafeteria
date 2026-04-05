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
    
    // Sale Modal Elements
    this.saleModal = document.getElementById('sale-dialog-backdrop');
    this.saleProductName = document.getElementById('sale-product-name');
    this.saleProductPrice = document.getElementById('sale-product-price');
    this.saleQuantityInput = document.getElementById('sale-quantity');
    this.saleTotalPrice = document.getElementById('sale-total-price');
    this.btnQtyMinus = document.getElementById('btn-qty-minus');
    this.btnQtyPlus = document.getElementById('btn-qty-plus');
    this.btnConfirmSale = document.getElementById('btn-confirm-sale');
    this.btnCloseSaleDialog = document.getElementById('close-sale-dialog');
    this.currentSaleProduct = null;
    
    // Subscribe to store updates
    this.store.subscribe(this.render.bind(this));
    this.setupListeners();
    this.setupSaleModalListeners();
  }

  setupSaleModalListeners() {
    this.btnCloseSaleDialog.addEventListener('click', () => this.closeSaleModal());
    
    // Close on backdrop click
    this.saleModal.addEventListener('click', (e) => {
      if (e.target === this.saleModal) this.closeSaleModal();
    });

    this.btnQtyMinus.addEventListener('click', () => {
      let qty = parseInt(this.saleQuantityInput.value) || 1;
      if (qty > 1) {
        this.saleQuantityInput.value = qty - 1;
        this.updateSaleTotal();
      }
    });

    this.btnQtyPlus.addEventListener('click', () => {
      let qty = parseInt(this.saleQuantityInput.value) || 1;
      this.saleQuantityInput.value = qty + 1;
      this.updateSaleTotal();
    });

    this.saleQuantityInput.addEventListener('input', () => {
      let qty = parseInt(this.saleQuantityInput.value) || 1;
      if (qty < 1) {
        this.saleQuantityInput.value = 1;
      }
      this.updateSaleTotal();
    });

    this.btnConfirmSale.addEventListener('click', () => this.confirmSale());
  }

  openSaleModal(productId) {
    const product = this.store.getState().products.find(p => p.id === productId);
    if (!product) return;

    this.currentSaleProduct = product;
    this.saleProductName.textContent = product.nombre;
    const price = typeof product.precio === 'number' ? product.precio : parseFloat(product.precio);
    this.saleProductPrice.textContent = `$${price.toFixed(2)}`;
    
    this.saleQuantityInput.value = 1;
    this.updateSaleTotal();
    
    this.saleModal.classList.remove('hidden');
  }

  closeSaleModal() {
    this.saleModal.classList.add('hidden');
    this.currentSaleProduct = null;
  }

  updateSaleTotal() {
    if (!this.currentSaleProduct) return;
    const qty = parseInt(this.saleQuantityInput.value) || 1;
    const price = typeof this.currentSaleProduct.precio === 'number' ? this.currentSaleProduct.precio : parseFloat(this.currentSaleProduct.precio);
    const total = qty * price;
    this.saleTotalPrice.textContent = `$${total.toFixed(2)}`;
  }

  async confirmSale() {
    if (!this.currentSaleProduct) return;
    
    const qty = parseInt(this.saleQuantityInput.value) || 1;
    const price = typeof this.currentSaleProduct.precio === 'number' ? this.currentSaleProduct.precio : parseFloat(this.currentSaleProduct.precio);
    const total = qty * price;
    
    const currentUser = this.store.getState().currentUser;
    if (!currentUser) {
      alert("Error: No se ha seleccionado un usuario activo.");
      return;
    }

    const saleData = {
      productId: this.currentSaleProduct.id,
      productName: this.currentSaleProduct.nombre,
      quantity: qty,
      price: price,
      total: total,
      usuario: currentUser
    };
    
    const originalText = this.btnConfirmSale.textContent;
    this.btnConfirmSale.textContent = 'Registrando...';
    this.btnConfirmSale.disabled = true;

    try {
      await this.db.registerSale(saleData);
      alert(`Venta de ${qty}x ${this.currentSaleProduct.nombre} registrada correctamente.`);
      this.closeSaleModal();
    } catch (err) {
      alert("Error al registrar venta: " + err.message);
    } finally {
      this.btnConfirmSale.textContent = originalText;
      this.btnConfirmSale.disabled = false;
    }
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

    // Handle generic ticket-card click for sales
    this.grid.querySelectorAll('.ticket-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-actions')) {
          this.openSaleModal(card.dataset.id);
        }
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
