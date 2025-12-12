// src/pages/AddItemPage.jsx
import { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function AddItemPage() {
    // Form state
    const [form, setForm] = useState({
        name: "",
        brand: "",
        category: "",
        barcode: "",
        unit: "",
        quantityType: "unit",
    });

    // Hata mesajları
    const [errors, setErrors] = useState({});
    // Genel durum mesajı
    const [status, setStatus] = useState(null); // "success" | "error" | null
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Input değişince state günceller
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Bu field için eski hatayı temizler
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setStatus(null);
    };

    // Basit validation fonksiyonu
    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Product name is required.";
        if (!form.brand.trim()) newErrors.brand = "Brand is required.";
        if (!form.category.trim()) newErrors.category = "You must select a category.";
        if (!form.unit.trim()) newErrors.unit = "Unit is required.";
        if (!form.quantityType)
            newErrors.quantityType = "You must select a quantity type.";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1) Validation
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setStatus(null);
            return; // hata varsa backend'e gitme
        }

        setIsSubmitting(true);
        setStatus(null);

        try {
            // 2) Backend'e POST
            await axios.post(`${API_URL}/products`, {
                name: form.name,
                brand: form.brand,
                category: form.category,
                barcode: form.barcode || null,
                unit: form.unit,
                quantityType: form.quantityType,
            });

            // 3) Başarılı ise
            setStatus("success");
            setForm({
                name: "",
                brand: "",
                category: "",
                barcode: "",
                unit: "",
                quantityType: "unit",
            });
            setErrors({});
        } catch (err) {
            console.error("Product create error:", err);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    Add New Product
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    Bu form assignment için ana <strong>/add</strong> formumuz olacak.
                </p>

                {/* Genel durum mesajı */}
                {status === "success" && (
                    <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
                        Product added successfully 🎉
                    </div>
                )}
                {status === "error" && (
                    <div className="mb-4 rounded-lg bg-red-50 text-red-800 px-4 py-2 text-sm">
                        Ürün kaydedilirken bir hata oluştu. Backend çalışıyor mu kontrol
                        edin.
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    {/* Ürün Adı */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                errors.name ? "border-red-400" : "border-gray-300"
                            }`}
                            value={form.name}
                            onChange={handleChange}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Marka */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="brand"
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                errors.brand ? "border-red-400" : "border-gray-300"
                            }`}
                            value={form.brand}
                            onChange={handleChange}
                        />
                        {errors.brand && (
                            <p className="mt-1 text-xs text-red-500">{errors.brand}</p>
                        )}
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category<span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category"
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                errors.category ? "border-red-400" : "border-gray-300"
                            }`}
                            value={form.category}
                            onChange={handleChange}
                        >
                            <option value="">Kategori seçin</option>
                            <option value="dairy">Dairy</option>
                            <option value="meat">Meat</option>
                            <option value="vegetables">Vegetables</option>
                            <option value="fruits">Fruits</option>
                            <option value="beverages">Beverages</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="bakery">Bakery</option>
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-xs text-red-500">{errors.category}</p>
                        )}
                    </div>

                    {/* Barcode (opsiyonel) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Barcode
                        </label>
                        <input
                            type="text"
                            name="barcode"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            value={form.barcode}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="unit"
                            placeholder='Örn: "1L", "12 adet"'
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                errors.unit ? "border-red-400" : "border-gray-300"
                            }`}
                            value={form.unit}
                            onChange={handleChange}
                        />
                        {errors.unit && (
                            <p className="mt-1 text-xs text-red-500">{errors.unit}</p>
                        )}
                    </div>

                    {/* Takip Türü */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity Type<span className="text-red-500">*</span>
                        </label>
                        <select
                            name="quantityType"
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                errors.quantityType ? "border-red-400" : "border-gray-300"
                            }`}
                            value={form.quantityType}
                            onChange={handleChange}
                        >
                            <option value="unit">Unit</option>
                            <option value="weight">Kg</option>
                        </select>
                        {errors.quantityType && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.quantityType}
                            </p>
                        )}
                    </div>

                    {/* Submit butonu */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isSubmitting ? "Saving..." : "Save Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddItemPage;
