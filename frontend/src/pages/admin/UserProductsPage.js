import { useEffect, useState } from "react";
import { fetchProducts, fetchUserPantry } from "../../api/inventoryApi";
import { pantryItems as mockPantry } from "../../api/mockData";

export default function UserProductsPage() {
    const [users] = useState([
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane User" },
        { id: 3, name: "Mehmet User" },
    ]);

    const [selectedUser, setSelectedUser] = useState(1);
    const [products, setProducts] = useState([]);
    const [pantry, setPantry] = useState([]);

    const [typeFilter, setTypeFilter] = useState("all");

    useEffect(() => {
        loadAll();
    }, [selectedUser]);

    const loadAll = async () => {
        try {
            const p = await fetchProducts();
            setProducts(p);
        } catch (err) {
            console.log("Ürün API hata → mock kullanılacak");
        }

        try {
            const userPantry = await fetchUserPantry(selectedUser);
            setPantry(userPantry);
        } catch {
            setPantry(mockPantry.filter((x) => x.userId === selectedUser));
        }
    };

    const findProduct = (id) => products.find((p) => p.id === id);

    const filtered = pantry.filter((i) => {
        const p = findProduct(i.productId);
        if (!p) return false;

        if (typeFilter !== "all" && p.quantityType !== typeFilter) return false;

        return true;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Users' Products</h1>

            {/* Filters */}
            <div className="flex items-center gap-4">

                <select
                    className="px-3 py-2 border rounded-lg shadow-sm"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(Number(e.target.value))}
                >
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>

                <select
                    className="px-3 py-2 border rounded-lg shadow-sm"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">All Types</option>
                    <option value="unit">Unit</option>
                    <option value="weight">Kg</option>
                </select>

            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        There is no product that belongs to this user.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 text-left">Closed / Kg</th>
                                <th className="px-4 py-3 text-left">Open</th>
                                <th className="px-4 py-3 text-left">Min</th>
                                <th className="px-4 py-3 text-left">Expiration Date</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filtered.map((item) => {
                                const p = findProduct(item.productId);
                                if (!p) return null;

                                const isWeight = p.quantityType === "weight";

                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-medium">{p.name}</td>
                                        <td className="px-4 py-3">
                                            {isWeight
                                                ? `${item.quantityWeight} kg`
                                                : `${item.quantityClosed}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isWeight ? "-" : item.quantityOpen}
                                        </td>
                                        <td className="px-4 py-3">{item.minDesired}</td>
                                        <td className="px-4 py-3">{item.expiresAt}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
