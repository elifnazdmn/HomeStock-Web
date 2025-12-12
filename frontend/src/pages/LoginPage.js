import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const cleanEmail = form.email.trim().toLowerCase();
        const cleanPassword = form.password;

        // RESET previous role
        localStorage.removeItem("hs_role");

        // === ADMIN LOGIN ===
        if (cleanEmail === "admin@demo.com" && cleanPassword === "123456") {
            localStorage.setItem("hs_role", "admin");
            onLogin("admin");
            navigate("/admin/products", { replace: true });
            return;
        }

        // === USER LOGIN ===
        if (cleanEmail === "user@demo.com" && cleanPassword === "123456") {
            localStorage.setItem("hs_role", "user");
            onLogin("user");
            navigate("/home", { replace: true });
            return;
        }

        // === WRONG LOGIN ===
        setError("Email or Password is wrong!");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow max-w-md w-full space-y-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center">
                    HomeStock
                </h1>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="example@mail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="••••••"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
