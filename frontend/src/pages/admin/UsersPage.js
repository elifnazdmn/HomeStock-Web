import { useState } from "react";
import AdminModal from "../../components/AdminModal";

export default function UsersPage() {
    const [users, setUsers] = useState([
        { id: 1, name: "John Doe", email: "john@example.com", phone: "+90 500 000 00 01", role: "user" },
        { id: 2, name: "Jane Admin", email: "admin@example.com", phone: "+90 500 000 00 02", role: "admin" },
        { id: 3, name: "Alice Smith", email: "alice@example.com", phone: "+90 500 000 00 03", role: "user" },
    ]);

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "user",
    });

    const openAddModal = () => {
        setEditItem(null);
        setForm({ name: "", email: "", phone: "", role: "user" });
        setModalOpen(true);
    };

    const openEditModal = (u) => {
        setEditItem(u);
        setForm(u);
        setModalOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim() || !form.email.trim()) {
            alert("Ad ve e-posta zorunludur.");
            return;
        }

        if (editItem) {
            setUsers((prev) =>
                prev.map((u) => (u.id === editItem.id ? { ...u, ...form } : u))
            );
        } else {
            setUsers((prev) => [...prev, { ...form, id: Date.now() }]);
        }

        setModalOpen(false);
    };

    const handleDelete = (id) => {
        const u = users.find((x) => x.id === id);
        if (u.role === "admin") {
            alert("Admin cannot be deleted.");
            return;
        }

        const ok = window.confirm("Are you sure you want to delete this user?");
        if (!ok) return;

        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Users</h1>

                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <i className="fas fa-user-plus"></i> New User
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Search user..."
                    className="px-3 py-2 border rounded-lg shadow-sm w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Full Name</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Phone</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {filtered.map((u) => (
                            <tr key={u.id}>
                                <td className="px-4 py-3">{u.name}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">{u.phone}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            u.role === "admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 flex gap-4">
                                    <button
                                        onClick={() => openEditModal(u)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>

                                    {u.role !== "admin" && (
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {modalOpen && (
                <AdminModal
                    title={editItem ? "Edit User" : "New user"}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                >
                    <div className="space-y-3">

                        <div>
                            <label>Full Name</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Phone</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label>Role</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                disabled={editItem && editItem.role === "admin"}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                    </div>
                </AdminModal>
            )}
        </div>
    );
}
