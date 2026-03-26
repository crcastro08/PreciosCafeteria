/**
 * Database Wrapper Interface
 * Acts as the contract for any data layer implementation.
 */
export class DatabaseWrapper {
  async getProducts() { throw new Error("Method not implemented."); }
  async addProduct(product) { throw new Error("Method not implemented."); }
  async updateProduct(id, product) { throw new Error("Method not implemented."); }
  async deleteProduct(id) { throw new Error("Method not implemented."); }
}
