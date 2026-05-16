import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success("Welcome back!");
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-3xl shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        <p className="text-center text-sm mt-4">
          Do not have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
