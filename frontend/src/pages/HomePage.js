// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

import {
    currentUser as initialUser,
    products as fallbackProducts,
    pantryItems as fallbackPantryItems,
} from "../api/mockData";
import {
    fetchProducts,
    fetchUserPantry,
    createPurchase as createPurchaseApi,
} from "../api/inventoryApi";

import { useNavigate } from "react-router-dom";


function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    const target = new Date(dateStr + "T00:00:00");
    const diffMs = target - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function HomePage() {
    // === DATA STATE ===
    const [user, setUser] = useState(initialUser);
    const [products, setProducts] = useState([]);
    const [pantry, setPantry] = useState([]);

    // === VIEW STATE ===
    const [activeView, setActiveView] = useState("home"); // home | all | open
    const [accountSection, setAccountSection] = useState("none"); // none | profile | password

    // === FILTER STATE ===
    const [searchAll, setSearchAll] = useState("");
       const [filterTypeAll, setFilterTypeAll] = useState("all");
    const [sortAll, setSortAll] = useState("name");

    const [searchOpen, setSearchOpen] = useState("");
    const [sortOpen, setSortOpen] = useState("expiry");

    // === PURCHASE MODAL STATE ===
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState({
        storeName: "",
        purchaseDate: "",
    });

    const emptyPurchaseItem = () => ({
        id: Date.now() + Math.random(),
        productId: "",
        quantity: "",
        unitType: "Quantity",
        expiryDate: "",
    });

    const [purchaseItems, setPurchaseItems] = useState([emptyPurchaseItem()]);
    const [purchaseError, setPurchaseError] = useState("");

    // === PROFILE / PASSWORD FORMS ===
    const [profileForm, setProfileForm] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
    });
    const [profileMessage, setProfileMessage] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordMessage, setPasswordMessage] = useState(null);

    // === LOAD DATA FROM BACKEND ===
    useEffect(() => {
        async function loadInitialData() {
            try {
                const [productsFromApi, pantryFromApi] = await Promise.all([
                    fetchProducts(),
                    fetchUserPantry(initialUser.id),
                ]);

                setProducts(productsFromApi);
                setPantry(pantryFromApi);
            } catch (err) {
                console.error("API error, using fallback data:", err);
                setProducts(fallbackProducts);
                setPantry(fallbackPantryItems);
            }
        }

        loadInitialData();
    }, []);

    // === HELPERS ===
    const findProduct = (productId) =>
        products.find((p) => p.id === Number(productId));

    const userPantry = pantry.filter((p) => p.userId === user.id);

    const getCurrentQuantity = (item) => {
        const product = findProduct(item.productId);
        if (!product) return 0;
        if (product.quantityType === "weight") {
            return item.quantityWeight || 0;
        }
        return (item.quantityClosed || 0) + (item.quantityOpen || 0);
    };

    // === DASHBOARD METRICS ===
    const lowStockItems = userPantry.filter(
        (i) => getCurrentQuantity(i) < i.minDesired
    );

    const expiringSoonItems = userPantry.filter((i) => {
        const d = daysUntil(i.expiresAt);
        return d !== null && d <= 5;
    });

    const openItemsCount = userPantry.reduce((sum, i) => {
        const product = findProduct(i.productId);
        if (product && product.quantityType === "unit") {
            return sum + (i.quantityOpen || 0);
        }
        return sum;
    }, 0);

    const totalProductsCount = userPantry.length;

    // === STOCK BAR CHART DATA ===
    const stockBars = (() => {
        const arr = userPantry.map((i) => ({
            item: i,
            product: findProduct(i.productId),
            qty: getCurrentQuantity(i),
        }));
        const max = Math.max(...arr.map((x) => x.qty), 1);
        return arr.map((x) => ({
            ...x,
            percent: Math.max(8, Math.round((x.qty / max) * 100)),
        }));
    })();

    // === CATEGORY PIE CHART DATA ===
    const categoryCounts = {};

    userPantry.forEach((item) => {
        const prod = findProduct(item.productId);
        if (!prod) return;
        const cat = prod.category || "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const chartData = Object.keys(categoryCounts).map((cat) => ({
        name: cat,
        value: categoryCounts[cat],
    }));

    const PIE_COLORS = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#6366f1",
        "#14b8a6",
    ];

        // === ALL PRODUCTS VIEW FILTER ===
    const filteredAll = (() => {
        let items = [...userPantry];

        if (searchAll.trim()) {
            const term = searchAll.toLowerCase();
            items = items.filter((item) => {
                const p = findProduct(item.productId);
                if (!p) return false;
                return (
                    p.name.toLowerCase().includes(term) ||
                    (p.brand || "").toLowerCase().includes(term)
                );
            });
        }

        if (filterTypeAll !== "all") {
            items = items.filter((item) => {
                const p = findProduct(item.productId);
                if (!p) return false;
                return p.quantityType === filterTypeAll;
            });
        }

        items.sort((a, b) => {
            const pa = findProduct(a.productId);
            const pb = findProduct(b.productId);

            if (sortAll === "name") {
                return (pa?.name || "").localeCompare(pb?.name || "");
            }
            if (sortAll === "quantity") {
                return getCurrentQuantity(b) - getCurrentQuantity(a);
            }
            if (sortAll === "expiry") {
                const da = a.expiresAt || "9999-12-31";
                const db = b.expiresAt || "9999-12-31";
                return da.localeCompare(db);
            }
            return 0;
        });

        return items;
    })();

    // === OPEN PRODUCTS VIEW ===
    const openItems = (() => {
        let items = userPantry.filter((i) => {
            const p = findProduct(i.productId);
            return p && p.quantityType === "unit" && i.quantityOpen > 0;
        });

        if (searchOpen.trim()) {
            const term = searchOpen.toLowerCase();
            items = items.filter((i) => {
                const p = findProduct(i.productId);
                return (
                    p &&
                    (p.name.toLowerCase().includes(term) ||
                        (p.brand || "").toLowerCase().includes(term))
                );
            });
        }

        items.sort((a, b) => {
            const pa = findProduct(a.productId);
            const pb = findProduct(b.productId);
            if (sortOpen === "name") {
                return (pa?.name || "").localeCompare(pb?.name || "");
            }
            if (sortOpen === "expiry") {
                const da = a.expiresAt || "9999-12-31";
                const db = b.expiresAt || "9999-12-31";
                return da.localeCompare(db);
            }
            return 0;
        });

        return items;
    })();

    // === INVENTORY ACTIONS ===
    const handleMarkOpened = (pantryId) => {
        setPantry((prev) =>
            prev.map((i) => {
                if (i.id !== pantryId) return i;
                if ((i.quantityClosed || 0) <= 0) {
                    alert("No closed items to open.");
                    return i;
                }
                return {
                    ...i,
                    quantityClosed: (i.quantityClosed || 0) - 1,
                    quantityOpen: (i.quantityOpen || 0) + 1,
                };
            })
        );
    };

    const handleUseQuantity = (pantryId, type, amount) => {
        if (!amount || amount <= 0) {
            alert("Enter a valid amount.");
            return;
        }

        setPantry((prev) =>
            prev.map((i) => {
                if (i.id !== pantryId) return i;
                if (type === "unit") {
                    const available = i.quantityOpen || 0;
                    if (available < amount) {
                        alert("Not enough open items. Open a closed item first.");
                        return i;
                    }
                    return { ...i, quantityOpen: available - amount };
                }
                if (type === "weight") {
                    const available = i.quantityWeight || 0;
                    if (available < amount) {
                        alert("Not enough kilograms available.");
                        return i;
                    }
                    return {
                        ...i,
                        quantityWeight: parseFloat((available - amount).toFixed(2)),
                    };
                }
                return i;
            })
        );
    };

    // === PURCHASE MODAL HANDLERS ===
    const openPurchaseModal = () => {
        setPurchaseForm({ storeName: "", purchaseDate: "" });
        setPurchaseItems([emptyPurchaseItem()]);
        setPurchaseError("");
        setIsPurchaseOpen(true);
    };

    const closePurchaseModal = () => setIsPurchaseOpen(false);

    const updatePurchaseItem = (id, field, value) => {
        setPurchaseItems((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const addPurchaseRow = () => setPurchaseItems((prev) => [...prev, emptyPurchaseItem()]);

    const removePurchaseRow = (id) => {
        setPurchaseItems((prev) =>
            prev.length === 1 ? prev : prev.filter((row) => row.id !== id)
        );
    };

    // === ACCOUNT MANAGEMENT ===
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
        setProfileMessage(null);
    };

    const saveProfile = (e) => {
        e.preventDefault();
        if (!profileForm.name.trim() || !profileForm.email.trim()) {
            setProfileMessage("Name, surname, and email are required.");
            return;
        }
        const updatedUser = {
            ...user,
            name: profileForm.name.trim(),
            email: profileForm.email.trim(),
            phone: profileForm.phone.trim(),
        };
        setUser(updatedUser);
        setProfileMessage("Updated successfully.");
    };

    const cancelProfile = () => {
        setProfileForm({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
        });
        setProfileMessage(null);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
        setPasswordMessage(null);
    };

    const savePassword = (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage("Passwords do not match.");
            return;
        }
        setPasswordMessage("Password updated.");
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    };

    const cancelPassword = () => {
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordMessage(null);
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        window.localStorage.removeItem("hs_role");
        navigate("/", { replace: true });
    };

    const handleSavePurchase = async (e) => {
    e.preventDefault();
    setPurchaseError("");

    if (!purchaseForm.storeName.trim() || !purchaseForm.purchaseDate) {
        setPurchaseError("Store name and purchase date are required.");
        return;
    }

    let hasValidItem = false;
    let newPantry = [...pantry];
    const purchasePayloadItems = [];

    purchaseItems.forEach((row) => {
        const productId = Number(row.productId);
        const product = findProduct(productId);
        let quantity = parseFloat(String(row.quantity).replace(",", "."));

        if (!product || !quantity || quantity <= 0) return;

        hasValidItem = true;

        if (product.quantityType === "weight") {
            if (row.unitType === "g") quantity = quantity / 1000;
        } else {
            quantity = Math.round(quantity);
        }

        const expiry = row.expiryDate || null;

        purchasePayloadItems.push({
            productId,
            quantity,
            unitType: row.unitType,
            expiryDate: expiry,
        });

        let pantryItem = newPantry.find(
            (i) => i.userId === user.id && i.productId === productId
        );

        if (!pantryItem) {
            pantryItem = {
                id: newPantry.length ? Math.max(...newPantry.map((i) => i.id)) + 1 : 1,
                userId: user.id,
                productId,
                quantityClosed: 0,
                quantityOpen: 0,
                quantityWeight: 0,
                minDesired: product.quantityType === "weight" ? 0.5 : 1,
                expiresAt: expiry,
            };
            newPantry.push(pantryItem);
        }

        if (product.quantityType === "weight") {
            pantryItem.quantityWeight = (pantryItem.quantityWeight || 0) + quantity;
        } else {
            pantryItem.quantityClosed = (pantryItem.quantityClosed || 0) + quantity;
        }

        if (expiry) {
            if (!pantryItem.expiresAt || expiry < pantryItem.expiresAt) {
                pantryItem.expiresAt = expiry;
            }
        }
    });

    if (!hasValidItem) {
        setPurchaseError("Please add at least one valid product.");
        return;
    }

    setPantry(newPantry);

    try {
        await createPurchaseApi({
            userId: user.id,
            storeName: purchaseForm.storeName.trim(),
            purchaseDate: purchaseForm.purchaseDate,
            items: purchasePayloadItems,
        });
    } catch (err) {
        console.error("Purchase API error:", err);
    }

    setIsPurchaseOpen(false);
    alert("Purchase added successfully.");
};


    const goView = (view) => {
        setActiveView(view);
        setAccountSection("none");
    };

    const showAccount = (section) => setAccountSection(section);

    const formatDate = (d) => d || "-";

    // === RENDER ===
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur shadow-sm border-b">
                <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <i className="fas fa-warehouse text-primary text-2xl" />
                        <span className="text-xl font-bold text-gray-800">HomeStock</span>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <details className="group">
                            <summary className="flex items-center space-x-2 text-gray-700 hover:text-primary cursor-pointer list-none">
                                <i className="fas fa-user-circle" />
                                <span>{user.name}</span>
                                <i className="fas fa-chevron-down text-xs" />
                            </summary>

                            <div
                                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                                <button
                                    type="button"
                                    onClick={() => showAccount("profile")}
                                    className="w-full text-left text-sm px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <i className="fas fa-id-card w-4"/>
                                    Profile
                                </button>

                                <button
                                    type="button"
                                    onClick={() => showAccount("password")}
                                    className="w-full text-left text-sm px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <i className="fas fa-key w-4"/>
                                    Change Password
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full text-left text-sm px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                    <i className="fas fa-sign-out-alt w-4"/>
                                    Logout
                                </button>
                            </div>
                        </details>
                    </div>
                </nav>
            </header>

            {/* MAIN CONTENT */}
            <main className="container mx-auto px-4 py-6">
                <div className="flex gap-6">
                {/* SIDEBAR */}
                    <aside className="w-64 bg-white/90 rounded-2xl shadow p-4 h-max">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                            MENU
                        </h2>

                        <nav className="space-y-2">
                            <button
                                type="button"
                                onClick={() => goView("home")}
                                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                                    activeView === "home" && accountSection === "none"
                                        ? "bg-blue-600 text-white shadow"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <i className="fas fa-home mr-2" />
                                Main Page
                            </button>
                            <button
                                type="button"
                                onClick={() => goView("all")}
                                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                                    activeView === "all" && accountSection === "none"
                                        ? "bg-blue-600 text-white shadow"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <i className="fas fa-list mr-2" />
                                All Products
                            </button>

                            <button
                                type="button"
                                onClick={() => goView("open")}
                                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                                    activeView === "open" && accountSection === "none"
                                        ? "bg-blue-600 text-white shadow"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <i className="fas fa-box-open mr-2" />
                                Opened Products
                            </button>
                        </nav>

                        <div className="mt-6 border-t pt-4">
                            <button
                                type="button"
                                onClick={openPurchaseModal}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow"
                            >
                                <i className="fas fa-cart-plus" />
                                Add Purchase
                            </button>
                        </div>
                    </aside>

                    {/* RIGHT PANEL */}
                    <div className="flex-1 space-y-6">

                        {/* ACCOUNT SECTIONS */}
                        {accountSection === "profile" && (
                            <section className="bg-white/90 rounded-2xl shadow p-6 max-w-xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Profile
                                </h2>

                                {profileMessage && (
                                    <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                        {profileMessage}
                                    </p>
                                )}

                                <form className="space-y-4" onSubmit={saveProfile}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ad Soyad
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profileForm.name}
                                            onChange={handleProfileChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profileForm.phone}
                                            onChange={handleProfileChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={cancelProfile}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 bg-white"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {accountSection === "password" && (
                            <section className="bg-white/90 rounded-2xl shadow p-6 max-w-md">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Change Password
                                </h2>

                                {passwordMessage && (
                                    <p className="mb-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                        {passwordMessage}
                                    </p>
                                )}

                                <form className="space-y-4" onSubmit={savePassword}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Old Password
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordForm.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordForm.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Repeat New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordForm.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={cancelPassword}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 bg-white"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                        
                                </form>
                            </section>
                        )}

                        {/* MAIN HOME VIEW */}
                        {accountSection === "none" && activeView === "home" && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                                </div>

                                {/* DASHBOARD CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-amber-400">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-amber-500 uppercase">Low Stock</p>
                                                <p className="text-2xl font-bold text-gray-800">{lowStockItems.length}</p>
                                            </div>
                                            <i className="fas fa-exclamation-triangle text-amber-400 text-xl" />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-red-400">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-red-500 uppercase">Expiring Soon</p>
                                                <p className="text-2xl font-bold text-gray-800">{expiringSoonItems.length}</p>
                                            </div>
                                            <i className="fas fa-clock text-red-400 text-xl" />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-blue-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-blue-500 uppercase">Total Products</p>
                                                <p className="text-2xl font-bold text-gray-800">{totalProductsCount}</p>
                                            </div>
                                            <i className="fas fa-boxes text-blue-500 text-xl" />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-emerald-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-emerald-500 uppercase">Open Items</p>
                                                <p className="text-2xl font-bold text-gray-800">{openItemsCount}</p>
                                            </div>
                                            <i className="fas fa-box-open text-emerald-500 text-xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* ===== PIE CHART: CATEGORY DISTRIBUTION ===== */}
                                <div className="bg-white rounded-2xl shadow p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">
                                        Product Category Distribution
                                    </h3>

                                    {chartData.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No Category to be shown.
                                        </p>
                                    ) : (
                                        <div style={{ width: "100%", height: 300 }}>
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        label={({ name, percent }) =>
                                                            `${name} (${Math.round(percent * 100)}%)`
                                                        }
                                                    >
                                                        {chartData.map((_, i) => (
                                                            <Cell
                                                                key={i}
                                                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>

                                {/* STOCK BAR CHART */}
                                <div className="bg-white rounded-2xl shadow p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">
                                        Stock Chart
                                    </h3>

                                    {stockBars.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No product to be shown.
                                        </p>
                                    ) : (
                                        <div className="flex items-end gap-6 h-64">
                                            {stockBars.map(({ item, product, qty, percent }) =>
                                                !product ? null : (
                                                    <div
                                                        key={item.id}
                                                        className="flex-1 flex flex-col items-center justify-end gap-2 min-w-[48px]"
                                                    >
                                                        <div className="w-8 bg-slate-100 rounded-xl overflow-hidden h-40 flex items-end">
                                                            <div
                                                                className={`w-full rounded-xl ${
                                                                    product.quantityType === "weight"
                                                                        ? "bg-emerald-500"
                                                                        : "bg-blue-500"
                                                                }`}
                                                                style={{ height: `${percent}%` }}
                                                            />
                                                        </div>

                                                        <div className="text-center text-xs text-gray-600">
                                                            <div className="font-medium truncate max-w-[72px]">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                {qty} {product.quantityType === "weight" ? "kg" : "Unit"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ===== ALL PRODUCTS VIEW ===== */}
                        {accountSection === "none" && activeView === "all" && (
                            <section className="bg-white/90 rounded-2xl shadow p-4 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        All Products
                                    </h2>

                                    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 shadow-sm">
                                            <i className="fas fa-search text-gray-400 mr-2 text-sm" />
                                            <input
                                                type="text"
                                                placeholder="Search product..."
                                                className="flex-1 border-0 focus:ring-0 text-sm text-gray-700 placeholder-gray-400"
                                                value={searchAll}
                                                onChange={(e) => setSearchAll(e.target.value)}
                                            />
                                        </div>

                                        <select
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                            value={filterTypeAll}
                                            onChange={(e) => setFilterTypeAll(e.target.value)}
                                        >
                                            <option value="all">All Types</option>
                                            <option value="unit">Unit</option>
                                            <option value="weight">Kg</option>
                                        </select>

                                        <select
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                            value={sortAll}
                                            onChange={(e) => setSortAll(e.target.value)}
                                        >
                                            <option value="name">According to name</option>
                                            <option value="quantity">According to amount</option>
                                            <option value="expiry">According to the expiration date</option>
                                        </select>
                                    </div>
                                </div>

                                {/* TABLE */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Product
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Closed / Kg
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Open
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Min
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Expiration date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200 text-sm">
                                                {filteredAll.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-4 py-4 text-center text-gray-500"
                                                        >
                                                            No product to be shown.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredAll.map((item) => {
                                                        const p = findProduct(item.productId);
                                                        if (!p) return null;

                                                        const isWeight = p.quantityType === "weight";
                                                        const closed = isWeight
                                                            ? `${(item.quantityWeight || 0).toFixed(2)} kg`
                                                            : `${item.quantityClosed || 0}`;
                                                        const open = isWeight
                                                            ? "-"
                                                            : `${item.quantityOpen || 0}`;

                                                        return (
                                                            <tr key={item.id}>
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">
                                                                            {p.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600">
                                                                            {p.brand}
                                                                            {p.brand ? ", " : ""}
                                                                            {p.unit}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {closed}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {open}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {item.minDesired}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {formatDate(item.expiresAt)}
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {isWeight ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0.01"
                                                                                placeholder="kg"
                                                                                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                                                                                id={`use-${item.id}`}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const input = document.getElementById(`use-${item.id}`);
                                                                                    const val = parseFloat(input.value.replace(",", "."));
                                                                                    handleUseQuantity(item.id, "weight", val);
                                                                                    input.value = "";
                                                                                }}
                                                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
                                                                            >
                                                                                Eksilt
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleMarkOpened(item.id)}
                                                                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs"
                                                                            >
                                                                                Opened
                                                                            </button>

                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    step="1"
                                                                                    min="1"
                                                                                    placeholder="adet"
                                                                                    className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                                                                                    id={`use-${item.id}`}
                                                                                />

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const input = document.getElementById(`use-${item.id}`);
                                                                                        const val = parseInt(input.value, 10);
                                                                                        handleUseQuantity(item.id, "unit", val);
                                                                                        input.value = "";
                                                                                    }}
                                                                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
                                                                                >
                                                                                    Decrease
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ===== OPEN ITEMS VIEW ===== */}
                        {accountSection === "none" && activeView === "open" && (
                            <section className="bg-white/90 rounded-2xl shadow p-4 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Opened Products
                                    </h2>

                                    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 shadow-sm">
                                            <i className="fas fa-search text-gray-400 mr-2 text-sm" />
                                            <input
                                                type="text"
                                                placeholder="Search product..."
                                                className="flex-1 border-0 focus:ring-0 text-sm text-gray-700 placeholder-gray-400"
                                                value={searchOpen}
                                                onChange={(e) => setSearchOpen(e.target.value)}
                                            />
                                        </div>

                                        <select
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                            value={sortOpen}
                                            onChange={(e) => setSortOpen(e.target.value)}
                                        >
                                            <option value="expiry">According to expiration date</option>
                                            <option value="name">According to name</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Product
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Opened Amount
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Expiration date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Days left
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200 text-sm">
                                                {openItems.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="px-4 py-4 text-center text-gray-500"
                                                        >
                                                            No opened products.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    openItems.map((i) => {
                                                        const p = findProduct(i.productId);
                                                        if (!p) return null;
                                                        const d = daysUntil(i.expiresAt);

                                                        return (
                                                            <tr key={i.id}>
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">
                                                                            {p.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600">
                                                                            {p.brand}
                                                                            {p.brand ? ", " : ""}
                                                                            {p.unit}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                                                                        {i.quantityOpen}
                                                                    </span>
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {formatDate(i.expiresAt)}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {d === null ? "-" : `${d} gün`}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* PURCHASE MODAL */}
            {isPurchaseOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Purchase</h3>

                            <button
                                type="button"
                                onClick={closePurchaseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <form className="p-6 space-y-6" onSubmit={handleSavePurchase}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        value={purchaseForm.storeName}
                                        onChange={(e) =>
                                            setPurchaseForm((prev) => ({
                                                ...prev,
                                                storeName: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        value={purchaseForm.purchaseDate}
                                        onChange={(e) =>
                                            setPurchaseForm((prev) => ({
                                                ...prev,
                                                purchaseDate: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-800">
                                        Purchase Items
                                    </h4>

                                    <button
                                        type="button"
                                        onClick={addPurchaseRow}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1"
                                    >
                                        <i className="fas fa-plus" />
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {purchaseItems.map((row) => (
                                        <div
                                            key={row.id}
                                            className="p-4 border border-gray-200 rounded-xl space-y-3"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Product
                                                    </label>

                                                    <select
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        value={row.productId}
                                                        onChange={(e) =>
                                                            updatePurchaseItem(
                                                                row.id,
                                                                "productId",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} - {p.brand}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        value={row.quantity}
                                                        onChange={(e) =>
                                                            updatePurchaseItem(
                                                                row.id,
                                                                "quantity",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Unit
                                                    </label>
                                                    <select
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        value={row.unitType}
                                                        onChange={(e) =>
                                                            updatePurchaseItem(
                                                                row.id,
                                                                "unitType",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="adet">Unit</option>
                                                        <option value="kg">kg</option>
                                                        <option value="g">g</option>
                                                        <option value="ml">ml</option>
                                                        <option value="L">L</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Expiry Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        value={row.expiryDate}
                                                        onChange={(e) =>
                                                            updatePurchaseItem(
                                                                row.id,
                                                                "expiryDate",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removePurchaseRow(row.id)}
                                                className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1"
                                            >
                                                <i className="fas fa-trash" />
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {purchaseError && (
                                    <p className="mt-2 text-sm text-red-600">{purchaseError}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closePurchaseModal}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 bg-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                                >
                                    Save Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;

