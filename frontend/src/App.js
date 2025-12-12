import { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AddItemPage from "./pages/AddItemPage";

import AdminLayout from "./layouts/AdminLayout";
import ProductsPage from "./pages/admin/ProductsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import UsersPage from "./pages/admin/UsersPage";
import UserProductsPage from "./pages/admin/UserProductsPage";

// Route koruma
function PrivateRoute({ role, allow, children }) {
    return allow.includes(role) ? children : <Navigate to="/" replace />;
}

export default function App() {
    // Uygulama açılırken rolü localStorage'dan yükle
    const [role, setRole] = useState(() => {
        return window.localStorage.getItem("hs_role") || "none";
    });

    const handleLogin = (newRole) => {
        setRole(newRole);
        window.localStorage.setItem("hs_role", newRole);
    };

    return (
        <Router>
            <Routes>

                {/* LOGIN PAGE */}
                <Route path="/" element={<LoginPage onLogin={handleLogin} />} />

                {/* USER HOME (KULLANICI + ADMİN GÖREBİLİR) */}
                <Route
                    path="/home"
                    element={
                        <PrivateRoute role={role} allow={["user", "admin"]}>
                            <HomePage />
                        </PrivateRoute>
                    }
                />

                {/* ADMIN — ürün ekleme */}
                <Route
                    path="/add"
                    element={
                        <PrivateRoute role={role} allow={["admin"]}>
                            <AddItemPage />
                        </PrivateRoute>
                    }
                />

                {/* ADMIN PANEL */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute role={role} allow={["admin"]}>
                            <AdminLayout />
                        </PrivateRoute>
                    }
                >
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="user-products" element={<UserProductsPage />} />
                </Route>

                {/* Geçersiz URL → Login */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
