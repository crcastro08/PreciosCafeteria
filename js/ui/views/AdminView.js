/**
 * Controller for Admin View.
 * Handles form submission and toggles view state.
 */
export class AdminView {
  constructor(store, db) {
    this.store = store;
    this.db = db;
    
    this.form = document.getElementById('admin-form');
    this.catalogSection = document.getElementById('catalog-view');
    this.adminSection = document.getElementById('admin-view');
    this.fabAdd = document.getElementById('fab-add');
    this.btnCancel = document.getElementById('btn-cancel-admin');
    
    this.navCatalog = document.getElementById('nav-catalog');
    this.navAdmin = document.getElementById('nav-admin');

    this.setupListeners();
  }

  setupListeners() {
    this.fabAdd.addEventListener('click', () => {
      this.resetForm();
      this.toggleView('admin');
    });
    this.navAdmin.addEventListener('click', () => {
      this.resetForm();
      this.toggleView('admin');
    });
    this.navCatalog.addEventListener('click', () => {
      this.toggleView('catalog');
    });
    this.btnCancel.addEventListener('click', () => {
      this.resetForm();
      this.toggleView('catalog');
    });

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  toggleView(view) {
    if (view === 'admin') {
      this.catalogSection.classList.replace('view-active', 'view-hidden');
      this.adminSection.classList.replace('view-hidden', 'view-active');
      this.fabAdd.style.display = 'none';
      this.navAdmin.classList.add('active');
      this.navCatalog.classList.remove('active');
    } else {
      this.adminSection.classList.replace('view-active', 'view-hidden');
      this.catalogSection.classList.replace('view-hidden', 'view-active');
      this.fabAdd.style.display = 'flex';
      this.navCatalog.classList.add('active');
      this.navAdmin.classList.remove('active');
    }
  }

  resetForm() {
    this.form.reset();
    document.getElementById('product-id').value = '';
    const submitBtn = this.form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Guardar Producto';
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Early Return Form Validation
    if (!this.form.checkValidity()) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const formData = new FormData(this.form);
    const imageFile = formData.get('imagen_file');
    const productId = formData.get('id');

    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      let imagenUrl = "";
      
      if (productId && (!imageFile || imageFile.size === 0)) {
        const existingProduct = this.store.getState().products.find(p => p.id === productId);
        if (!existingProduct) throw new Error("Producto no encontrado en estado actual.");
        imagenUrl = existingProduct.imagen_url;
      } else {
        if (imageFile && imageFile.size > 0) {
          submitBtn.textContent = 'Subiendo imagen...';
          imagenUrl = await this.db.uploadImage(imageFile);
        } else {
          throw new Error("Debe seleccionar una imagen o tomar una foto.");
        }
      }

      submitBtn.textContent = productId ? 'Actualizando...' : 'Guardando...';
      const productData = {
        nombre: formData.get('nombre'),
        categoria: formData.get('categoria'),
        precio: parseFloat(formData.get('precio')),
        imagen_url: imagenUrl
      };

      if (productId) {
        const result = await this.db.updateProduct(productId, productData);
        const currentState = this.store.getState();
        const updatedProducts = currentState.products.map(p => p.id === productId ? result : p);
        this.store.setState({ products: updatedProducts });
        alert("Producto actualizado exitosamente");
      } else {
        const result = await this.db.addProduct(productData);
        const currentState = this.store.getState();
        this.store.setState({ products: [...currentState.products, result] });
        alert("Producto guardado exitosamente");
      }
      
      this.resetForm();
      this.toggleView('catalog');

    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      submitBtn.disabled = false;
      // If form was reset, text will be 'Guardar Producto'. If it failed, restore original.
      if (document.getElementById('product-id').value !== "") {
        submitBtn.textContent = originalText;
      } else {
        submitBtn.textContent = 'Guardar Producto';
      }
    }
  }
}
