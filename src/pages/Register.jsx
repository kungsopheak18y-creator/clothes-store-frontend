import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await api.post('/register', {
        name: form.first_name + ' ' + form.last_name,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirm_password: form.confirmPassword,
        password_confirmation: form.confirmPassword,
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/redirect`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-3xl shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit}>
          <input name="first_name" placeholder="First Name" className="w-full border p-2 mb-3 rounded" onChange={handleChange} required />
          <input name="last_name" placeholder="Last Name" className="w-full border p-2 mb-3 rounded" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" className="w-full border p-2 mb-3 rounded" onChange={handleChange} required />
          <input name="phone" placeholder="Phone Number" className="w-full border p-2 mb-3 rounded" onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" className="w-full border p-2 mb-3 rounded" onChange={handleChange} required />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" className="w-full border p-2 mb-4 rounded" onChange={handleChange} required />
          <button className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700">Register</button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
          Continue with Google
        </button>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <p className="text-center text-sm mt-4">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  );
}