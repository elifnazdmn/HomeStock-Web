// src/api/mockData.js

// Demo kullanıcı
export const currentUser = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "+90 555 000 00 00",
};

// quantityType: "unit" (adet) | "weight" (kg)
export const products = [
    {
        id: 1,
        name: "Milk",
        brand: "Brand A",
        category: "dairy",
        barcode: "123456789",
        unit: "1L",
        quantityType: "unit",
    },
    {
        id: 2,
        name: "Eggs",
        brand: "Brand B",
        category: "dairy",
        barcode: "987654321",
        unit: "12 pieces",
        quantityType: "unit",
    },
    {
        id: 3,
        name: "Yogurt",
        brand: "Brand C",
        category: "dairy",
        barcode: "456789123",
        unit: "500g",
        quantityType: "unit",
    },
    {
        id: 4,
        name: "Bread",
        brand: "Brand D",
        category: "bakery",
        barcode: "321654987",
        unit: "1 loaf",
        quantityType: "unit",
    },
    {
        id: 5,
        name: "Beef",
        brand: "Butcher X",
        category: "meat",
        barcode: "",
        unit: "kg",
        quantityType: "weight",
    },
];

// Örnek envanter (pantry) kayıtları
export const pantryItems = [
    {
        id: 1,
        userId: 1,
        productId: 1,
        quantityClosed: 1,
        quantityOpen: 0,
        quantityWeight: 0,
        minDesired: 3,
        expiresAt: "2025-11-30",
    },
    {
        id: 2,
        userId: 1,
        productId: 2,
        quantityClosed: 2,
        quantityOpen: 0,
        quantityWeight: 0,
        minDesired: 6,
        expiresAt: "2025-12-05",
    },
    {
        id: 3,
        userId: 1,
        productId: 3,
        quantityClosed: 0,
        quantityOpen: 2,
        quantityWeight: 0,
        minDesired: 4,
        expiresAt: "2025-11-27",
    },
    {
        id: 4,
        userId: 1,
        productId: 5,
        quantityClosed: 0,
        quantityOpen: 0,
        quantityWeight: 1.0,
        minDesired: 0.5,
        expiresAt: "2025-11-26",
    },
];
