import { Store } from './store/Store.js';
import { MockAdapter } from './services/MockAdapter.js';
import { SupabaseAdapter } from './services/SupabaseAdapter.js';
import { CONFIG } from './core/config.js';
import { CatalogView } from './ui/views/CatalogView.js';
import { AdminView } from './ui/views/AdminView.js';
import { InventoryView } from './ui/views/InventoryView.js';

/**
 * Bootstrap Application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Manejo de Errores Global as per Architectural Rule IV
  window.addEventListener('unhandledrejection', (event) => {
    alert('Error global del sistema: ' + event.reason.message || 'Error inesperado');
  });
  window.addEventListener('error', (event) => {
    alert('Error de aplicación: ' + event.message);
  });

  // 1. Dependency Injection (SoC: logic doesn't care if it's mock or real Supabase)
  const db = CONFIG.USE_MOCK_DB ? new MockAdapter() : new SupabaseAdapter();
  
  // 2. Global State Initializer
  const store = new Store();

  // 3. View Controllers
  const catalogView = new CatalogView(store, db);
  const adminView = new AdminView(store, db);
  const inventoryView = new InventoryView(store, db);

  // 4. Kickstart Data Fetching
  catalogView.fetchProducts();
});
