import { renderLoader, renderError, renderEmpty } from '../components/Feedback.js';

export class UsersView {
  constructor(store, db) {
    this.store = store;
    this.db = db;
    
    // UI Elements - Users Management View
    this.usersViewSection = document.getElementById('users-view');
    this.usersList = document.getElementById('users-list');
    this.feedback = document.getElementById('users-feedback');
    this.form = document.getElementById('user-form');
    this.btnShowAddUser = document.getElementById('btn-show-add-user');
    this.btnCancelUser = document.getElementById('btn-cancel-user');
    
    // UI Elements - Header Dropdown
    this.dropdownMenu = document.getElementById('user-dropdown-menu');
    this.dropdownBtn = document.querySelector('.user-dropdown-btn');
    this.currentUserNameDisplay = document.getElementById('current-user-name');
    
    // Set default user
    this.store.setState({ currentUser: { nombre: 'Economia', isSuperUser: true } });

    // Navigation Nodes
    this.navUsers = document.getElementById('nav-users');
    this.navCatalog = document.getElementById('nav-catalog');
    this.navAdmin = document.getElementById('nav-admin');
    this.navInventory = document.getElementById('nav-inventory');
    
    this.sections = {
      catalog: document.getElementById('catalog-view'),
      admin: document.getElementById('admin-view'),
      inventory: document.getElementById('inventory-view'),
      users: this.usersViewSection
    };

    // Store subscription
    this.store.subscribe(this.render.bind(this));
    
    this.setupListeners();
  }

  async fetchUsers() {
    this.store.setState({ loading: true, error: null });
    try {
      const data = await this.db.getUsers();
      
      // If we don't have a currentUser set, or if we want to ensure Economia is at least simulated
      let currentUser = this.store.getState().currentUser;
      
      // We keep the selected user if it still exists, else fallback to Economia
      if (currentUser && currentUser.nombre !== 'Economia') {
        const stillExists = data.find(u => u.id === currentUser.id);
        if (!stillExists) currentUser = { nombre: 'Economia', isSuperUser: true };
        else currentUser = stillExists;
      }
      
      this.store.setState({ 
        usuarios: data, 
        currentUser: currentUser, 
        loading: false 
      });
    } catch (err) {
      this.store.setState({ error: err.message, loading: false });
    }
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
    if (this.navUsers) this.navUsers.classList.toggle('active', viewName === 'users');
    if (this.navCatalog) this.navCatalog.classList.toggle('active', viewName === 'catalog');
    if (this.navAdmin) this.navAdmin.classList.toggle('active', viewName === 'admin');
    if (this.navInventory) this.navInventory.classList.toggle('active', viewName === 'inventory');

    // Hide FAB in users view
    const fab = document.getElementById('fab-add');
    if (fab) fab.style.display = (viewName === 'catalog') ? 'flex' : 'none';
  }

  setupListeners() {
    // ---- Navigation ----
    if (this.navUsers) {
      this.navUsers.addEventListener('click', () => {
        this.toggleView('users');
        this.fetchUsers();
      });
    }

    // ---- Management View Listeners ----
    this.btnShowAddUser.addEventListener('click', () => {
      this.form.reset();
      document.getElementById('user-id').value = '';
      this.form.classList.remove('hidden');
      this.btnShowAddUser.style.display = 'none';
      this.form.querySelector('button[type="submit"]').textContent = 'Guardar Usuario';
    });

    this.btnCancelUser.addEventListener('click', () => {
      this.form.classList.add('hidden');
      this.btnShowAddUser.style.display = 'flex';
      this.form.reset();
    });

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('user-id').value;
      const nombre = document.getElementById('user-name').value;
      const correo = document.getElementById('user-email').value;
      const saldo = parseFloat(document.getElementById('user-balance').value);

      const payload = { nombre, correo, saldo };

      try {
        const btnSubmit = this.form.querySelector('button[type="submit"]');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Guardando...';
        btnSubmit.disabled = true;

        if (id) {
          await this.db.updateUser(id, payload);
          alert('Usuario actualizado');
        } else {
          await this.db.addUser(payload);
          alert('Usuario creado');
        }
        
        await this.fetchUsers(); // Refresh list
        this.btnCancelUser.click(); // Hide form
        
      } catch (err) {
        alert("Error al guardar: " + err.message);
      } finally {
        const btnSubmit = this.form.querySelector('button[type="submit"]');
        btnSubmit.disabled = false;
        btnSubmit.textContent = id ? 'Actualizar Usuario' : 'Guardar Usuario';
      }
    });

    // ---- Header Dropdown Listeners ----
    this.dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      // Hide if clicked outside
      if (!this.dropdownBtn.contains(e.target) && !this.dropdownMenu.contains(e.target)) {
        this.dropdownMenu.classList.add('hidden');
      }
    });
  }

  render(state) {
    this.renderHeaderDropdown(state);
    
    // Only render the users list if we are currently on the users view
    if (this.usersViewSection.classList.contains('view-active')) {
      this.renderManagementList(state);
    }
  }

  renderHeaderDropdown(state) {
    if (state.currentUser) {
      this.currentUserNameDisplay.textContent = state.currentUser.nombre;
    }

    this.dropdownMenu.innerHTML = '';
    
    // Always append Economia manually as the default fallback option
    const economiaItem = document.createElement('button');
    economiaItem.className = 'user-dropdown-item';
    economiaItem.textContent = 'Economia (Default)';
    economiaItem.addEventListener('click', () => {
      this.store.setState({ currentUser: { nombre: 'Economia', isSuperUser: true } });
      this.dropdownMenu.classList.add('hidden');
    });
    this.dropdownMenu.appendChild(economiaItem);

    // List the rest of the dynamic users
    if (state.usuarios && state.usuarios.length > 0) {
      state.usuarios.forEach(user => {
        if (user.nombre === 'Economia') return; // Skip if it's already there theoretically
        
        const item = document.createElement('button');
        item.className = 'user-dropdown-item';
        // Show balance directly in the dropdown
        item.textContent = `${user.nombre} ($${parseFloat(user.saldo).toFixed(2)})`;
        
        item.addEventListener('click', () => {
          this.store.setState({ currentUser: user });
          this.dropdownMenu.classList.add('hidden');
        });
        
        this.dropdownMenu.appendChild(item);
      });
    }
  }

  renderManagementList(state) {
    this.usersList.innerHTML = '';
    
    if (state.loading) {
      this.feedback.style.display = 'flex';
      renderLoader(this.feedback);
      return;
    }

    if (state.error) {
      this.feedback.style.display = 'flex';
      renderError(this.feedback, state.error);
      return;
    }

    const filtered = state.usuarios.filter(u => u.nombre !== 'Economia'); // Optional: hide Economia from edits if preferred. But let's show all.
    // Actually, I'll allow edit of everything except maybe let's just show everything.

    if (state.usuarios.length === 0) {
      this.feedback.style.display = 'flex';
      renderEmpty(this.feedback);
      return;
    }

    this.feedback.style.display = 'none';

    state.usuarios.forEach(user => {
      const li = document.createElement('div');
      li.className = 'admin-list-item';
      
      const balance = parseFloat(user.saldo).toFixed(2);
      
      li.innerHTML = `
        <div class="admin-item-info">
          <strong>${user.nombre}</strong><br>
          <span style="color: var(--color-text-secondary); font-size: var(--font-size-xs)">Saldo: $${balance}</span>
        </div>
        <div class="admin-item-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${user.id}">Editar</button>
          ${user.nombre === 'Economia' ? '' : `<button class="btn btn-danger btn-sm" data-action="delete" data-id="${user.id}">X</button>`}
        </div>
      `;
      
      this.usersList.appendChild(li);
    });

    // Action listeners
    this.usersList.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => this.handleEdit(btn.dataset.id));
    });

    this.usersList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
    });
  }

  handleEdit(id) {
    const user = this.store.getState().usuarios.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-name').value = user.nombre;
    document.getElementById('user-email').value = user.correo || '';
    document.getElementById('user-balance').value = user.saldo;
    
    document.getElementById('user-form').querySelector('button[type="submit"]').textContent = 'Actualizar Usuario';
    
    this.form.classList.remove('hidden');
    this.btnShowAddUser.style.display = 'none';
    window.scrollTo(0, 0);
  }

  async handleDelete(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await this.db.deleteUser(id);
      
      // If deleted user was current user, reset to Economia
      const currentUser = this.store.getState().currentUser;
      if (currentUser && currentUser.id === id) {
        this.store.setState({ currentUser: { nombre: 'Economia', isSuperUser: true } });
      }
      
      alert("Usuario eliminado correctamente.");
      this.fetchUsers();
    } catch (err) {
      alert("Error eliminando usuario: " + err.message);
    }
  }
}
