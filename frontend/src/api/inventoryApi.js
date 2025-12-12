// src/api/inventoryApi.js
import api from "./apiClient";

// NOT: Endpoint yollarını kendi backend’ine göre ayarla

// Tüm ürünleri getir (Admin tarafında da kullanabiliriz)
export async function fetchProducts() {
    const res = await api.get("/products"); // örn: GET /api/products
    return res.data;
}

// Kullanıcının stok / pantry kayıtlarını getir
export async function fetchUserPantry(userId) {
    const res = await api.get(`/pantry/${userId}`); // örn: GET /api/pantry/1
    return res.data;
}

// Yeni satın alma kaydı ve stoğu güncelle
export async function createPurchase(payload) {
    // Örn. POST /api/purchases
    const res = await api.post("/purchases", payload);
    return res.data;
}

// Admin: yeni ürün ekle
export async function createProduct(payload) {
    const res = await api.post("/products", payload);
    return res.data;
}

// Admin: ürün güncelle
export async function updateProduct(id, payload) {
    const res = await api.put(`/products/${id}`, payload);
    return res.data;
}

// Admin: ürün sil
export async function deleteProduct(id) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
}
