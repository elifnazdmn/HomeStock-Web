import { useEffect, useState } from "react";
import { fetchProducts, deleteProduct } from "../../api/inventoryApi";
import AdminModal from "../../components/AdminModal";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const [form, setForm] = useState({
        name: "",
        brand: "",
        category: "",
        barcode: "",
        unit: "",
        quantityType: "unit",
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setEditItem(null);
        setForm({
            name: "",
            brand: "",
            category: "",
            barcode: "",
            unit: "",
            quantityType: "unit",
        });
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setForm(item);
        setModalOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return alert("Product name is required.");

        if (editItem) {
            // local demo edit
            setProducts((prev) =>
                prev.map((p) => (p.id === editItem.id ? { ...p, ...form } : p))
            );
        } else {
            setProducts((prev) => [...prev, { ...form, id: Date.now() }]);
        }

        setModalOpen(false);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Do you want to delete this product?");
        if (!ok) return;

        try {
            await deleteProduct(id);
        } catch (err) {
            console.log("Backend yok → local silinecek.");
        }

        setProducts((prev) => prev.filter((p) => p.id !== id));
    };

    // Filter logic
    const filtered = products.filter((p) => {
        const s = search.toLowerCase();
        const matchSearch =
            p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s);
        const matchCat = categoryFilter === "all" || p.category === categoryFilter;
        const matchType = typeFilter === "all" || p.quantityType === typeFilter;
        return matchSearch && matchCat && matchType;
    });

    return (
        <div className="space-y-6">

            {/* Title + Add Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Products</h1>

                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Product
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">

                <input
                    type="text"
                    placeholder="Search product..."
                    className="px-3 py-2 border rounded-lg shadow-sm w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="px-3 py-2 border rounded-lg shadow-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="bakery">Bakery</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="beverages">Beverages</option>
                    <option value="cleaning">Cleaning</option>

                </select>

                <select
                    className="px-3 py-2 border rounded-lg shadow-sm"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">All Unit Types</option>
                    <option value="unit">Unit</option>
                    <option value="weight">Kg</option>
                </select>

            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Brand</th>
                            <th className="px-4 py-3 text-left">Category</th>
                            <th className="px-4 py-3 text-left">Unit</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td className="px-4 py-3">{p.name}</td>
                                <td className="px-4 py-3">{p.brand}</td>
                                <td className="px-4 py-3">{p.category}</td>
                                <td className="px-4 py-3">{p.unit}</td>
                                <td className="px-4 py-3">
                                    {p.quantityType === "unit" ? "Unit" : "Kg"}
                                </td>
                                <td className="px-4 py-3 flex gap-3">
                                    <button
                                        onClick={() => openEditModal(p)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <AdminModal
                    title={editItem ? "Edit Product" : "New Product"}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                >
                    <div className="space-y-3">
                        <div>
                            <label>Product Name</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Brand</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.brand}
                                onChange={(e) =>
                                    setForm({ ...form, brand: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Category</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.category}
                                onChange={(e) =>
                                    setForm({...form, category: e.target.value})
                                }
                            >
                                <option value="">Seç...</option>
                                <option value="dairy">Dairy</option>
                                <option value="meat">Meat</option>
                                <option value="bakery">Bakery</option>
                                <option value="vegetables">Vegetables</option>
                                <option value="fruits">Fruits</option>
                                <option value="beverages">Beverages</option>
                                <option value="cleaning">Cleaning</option>
                            </select>
                        </div>

                        <div>
                            <label>Barcode</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.barcode}
                                onChange={(e) =>
                                    setForm({ ...form, barcode: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Unit</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.unit}
                                onChange={(e) =>
                                    setForm({ ...form, unit: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Quantity Type</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={form.quantityType}
                                onChange={(e) =>
                                    setForm({ ...form, quantityType: e.target.value })
                                }
                            >
                                <option value="unit">Unit</option>
                                <option value="weight">Kg</option>
                            </select>
                        </div>
                    </div>
                </AdminModal>
            )}

        </div>
    );
}
