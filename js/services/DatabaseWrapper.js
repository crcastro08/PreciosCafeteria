/**
 * Database Wrapper Interface
 * Acts as the contract for any data layer implementation.
 */
export class DatabaseWrapper {
  async getProducts() { throw new Error("Method not implemented."); }
  async addProduct(product) { throw new Error("Method not implemented."); }
  async updateProduct(id, product) { throw new Error("Method not implemented."); }
  async deleteProduct(id) { throw new Error("Method not implemented."); }
  async getInventory() { throw new Error("Method not implemented."); }
  async updateInventory(productId, quantity) { throw new Error("Method not implemented."); }
  async registerSale(saleData) { throw new Error("Method not implemented."); }

  // Users
  async getUsers() { throw new Error("Method not implemented."); }
  async addUser(user) { throw new Error("Method not implemented."); }
  async updateUser(id, changes) { throw new Error("Method not implemented."); }
  async deleteUser(id) { throw new Error("Method not implemented."); }
}
