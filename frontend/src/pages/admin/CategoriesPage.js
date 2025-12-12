import { useState } from "react";
import AdminModal from "../../components/AdminModal";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([
        { id: 1, name: "Dairy", description: "Milk and dairy products" },
        { id: 2, name: "Meat", description: "Meat and poultry products" },
        { id: 3, name: "Bakery", description: "Bread and bakery products" },
        { id: 4, name: "Cleaning", description: "Cleaning products" },
    ]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const openAddModal = () => {
        setEditItem(null);
        setForm({ name: "", description: "" });
        setModalOpen(true);
    };

    const openEditModal = (c) => {
        setEditItem(c);
        setForm(c);
        setModalOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return alert("Category name is required.");

        if (editItem) {
            setCategories((prev) =>
                prev.map((c) => (c.id === editItem.id ? { ...c, ...form } : c))
            );
        } else {
            setCategories((prev) => [...prev, { ...form, id: Date.now() }]);
        }

        setModalOpen(false);
    };

    const handleDelete = (id) => {
        const ok = window.confirm("Do you want to delete this category?");
        if (!ok) return;

        setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Categories</h1>

                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> New Category
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Description</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {categories.map((c) => (
                            <tr key={c.id}>
                                <td className="px-4 py-3 font-medium">{c.name}</td>
                                <td className="px-4 py-3">{c.description}</td>
                                <td className="px-4 py-3 flex gap-3">
                                    <button
                                        onClick={() => openEditModal(c)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(c.id)}
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

            {/* MODAL */}
            {modalOpen && (
                <AdminModal
                    title={editItem ? "Edit Category" : "New Category"}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                >
                    <div className="space-y-3">

                        <div>
                            <label>Name</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Description</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                            />
                        </div>

                    </div>
                </AdminModal>
            )}
        </div>
    );
}
