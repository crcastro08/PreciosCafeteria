import { DatabaseWrapper } from './DatabaseWrapper.js';

/**
 * In-memory Mock DB for development and testing.
 */
export class MockAdapter extends DatabaseWrapper {
  constructor() {
    super();
    this.data = [
      { id: '1', nombre: 'Nescafe Caffe Mocha', categoria: 'Bebidas', precio: 1.29, imagen_url: 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=300&h=300&fit=crop' },
      { id: '2', nombre: 'Nivea Creme Care', categoria: 'Otros', precio: 5.42, imagen_url: 'https://images.unsplash.com/photo-1608248593842-8021c6a81e9b?w=300&h=300&fit=crop' },
      { id: '3', nombre: 'Nesquick Chocolate', categoria: 'Bebidas', precio: 3.50, imagen_url: 'https://images.unsplash.com/photo-1549488497-246f1cb6f74a?w=300&h=300&fit=crop' },
      { id: '4', nombre: 'Galletas Oreo', categoria: 'Galletas', precio: 2.15, imagen_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop' },
      { id: '5', nombre: 'Agua Mineral', categoria: 'Bebidas', precio: 1.00, imagen_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop' }
    ];
  }

  async getProducts() {
    // Simulate network latency
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.data]), 600);
    });
  }

  async addProduct(product) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!product.nombre || !product.precio) {
          return reject(new Error("Missing required fields"));
        }
        const newProduct = { 
          ...product, 
          id: Date.now().toString(), 
          fecha_creacion: new Date().toISOString() 
        };
        this.data.push(newProduct);
        resolve(newProduct);
      }, 500);
    });
  }

  async updateProduct(id, changes) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.data.findIndex(p => p.id === id);
        if (index === -1) return reject(new Error("Producto no encontrado"));
        this.data[index] = { ...this.data[index], ...changes };
        resolve(this.data[index]);
      }, 500);
    });
  }

  async deleteProduct(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.data.findIndex(p => p.id === id);
        if (index === -1) return reject(new Error("Producto no encontrado"));
        this.data.splice(index, 1);
        resolve(true);
      }, 500);
    });
  }
}
