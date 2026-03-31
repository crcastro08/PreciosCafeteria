import { DatabaseWrapper } from './DatabaseWrapper.js';
import { CONFIG } from '../core/config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

/**
 * Real Supabase Adapter
 * Interacts with Supabase using CDN ES modules to keep the project bundler-free.
 */
export class SupabaseAdapter extends DatabaseWrapper {
  constructor() {
    super();
    if (CONFIG.SUPABASE_URL === 'PLACEHOLDER_URL' || !CONFIG.SUPABASE_URL) {
      console.warn("SupabaseAdapter: Missing Credentials. API calls will fail.");
    }
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  }

  async getProducts() {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .order('fecha_creacion', { ascending: false });
      
    if (error) throw new Error(error.message);
    return data || [];
  }

  async addProduct(product) {
    const { data, error } = await this.supabase
      .from('productos')
      .insert([{
        nombre: product.nombre,
        categoria: product.categoria,
        precio: product.precio,
        imagen_url: product.imagen_url
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Initialize inventory for the new product
    await this.supabase
      .from('inventario')
      .insert([{ producto_id: data.id, cantidad: 0 }]);

    return data;
  }

  async updateProduct(id, changes) {
    const { data, error } = await this.supabase
      .from('productos')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteProduct(id) {
    const { error } = await this.supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  async uploadImage(file) {
    // Generate a unique filename using timestamp and original name footprint
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('productos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw new Error("Error subiendo imagen: " + error.message);

    // Get public url
    const { data: publicURLData } = this.supabase.storage
      .from('productos')
      .getPublicUrl(filePath);
      
    return publicURLData.publicUrl;
  }

  async getInventory() {
    const { data, error } = await this.supabase
      .from('inventario')
      .select('*');
      
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateInventory(productId, quantity) {
    const { error } = await this.supabase
      .from('inventario')
      .upsert({ 
        producto_id: productId, 
        cantidad: quantity,
        ultima_actualizacion: new Date().toISOString()
      }, { onConflict: 'producto_id' });

    if (error) throw new Error(error.message);
    return true;
  }
}
