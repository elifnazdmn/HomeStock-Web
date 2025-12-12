import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminLayout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        navigate("/", { replace: true });
        window.localStorage.removeItem("hs_role");
    };

    return (
        <div className="min-h-screen flex bg-gray-50">

            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-6 space-y-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                    ADMIN MENU
                </h2>

                <nav className="flex flex-col space-y-2">

                    <NavLink
                        to="/admin/products"
                        className={({ isActive }) =>
                            `px-3 py-2 rounded-lg flex items-center gap-2 
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`
                        }
                    >
                        <i className="fas fa-box"></i> Products
                    </NavLink>

                    <NavLink
                        to="/admin/categories"
                        className={({ isActive }) =>
                            `px-3 py-2 rounded-lg flex items-center gap-2 
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`
                        }
                    >
                        <i className="fas fa-tags"></i> Categories
                    </NavLink>

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `px-3 py-2 rounded-lg flex items-center gap-2 
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`
                        }
                    >
                        <i className="fas fa-users"></i> Users
                    </NavLink>

                    <NavLink
                        to="/admin/user-products"
                        className={({ isActive }) =>
                            `px-3 py-2 rounded-lg flex items-center gap-2 
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`
                        }
                    >
                        <i className="fas fa-clipboard-list"></i> Users' Products
                    </NavLink>

                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col">

                {/* Top Navbar */}
                <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-warehouse text-blue-600"></i>
                        HomeStock Admin
                    </h1>

                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="px-4 py-2 border rounded-lg flex items-center gap-2"
                        >
                            <i className="fas fa-user-circle"></i> Admin
                            <i className="fas fa-chevron-down"></i>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-48 py-2 text-sm z-50">

                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                    Profile
                                </button>

                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                    Change Password
                                </button>

                                <hr />

                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}
