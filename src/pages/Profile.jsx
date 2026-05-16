import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Package, Gift, MapPin, Key, Globe, ChevronRight, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, clearUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');

  // ✅ Fixed: read snake_case from Laravel response
  useEffect(() => {
    if (user) {
      setForm({
        firstName:   user.first_name || '',
        lastName:    user.last_name  || '',
        email:       user.email      || '',
        phone:       user.phone      || '',
        gender:      user.gender     || '',
        dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      // ✅ Fixed: correct URL + snake_case field names
      const res = await api.put('/profile', {
        first_name:    form.firstName,
        last_name:     form.lastName,
        phone:         form.phone,
        gender:        form.gender,
        date_of_birth: form.dateOfBirth || null,
      });
      // ✅ Fixed: Laravel returns { user: {...} }
      setUser(res.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: User,    label: 'Profile',         path: '/profile',         active: location.pathname === '/profile' },
    { icon: Package, label: 'My orders',        path: '/orders',          active: location.pathname === '/orders' },
    { icon: MapPin,  label: 'Address book',     path: '/address-book',    active: location.pathname === '/address-book' },
    { icon: Key,     label: 'Change password',  path: '/change-password', active: location.pathname === '/change-password' },
    { icon: Gift,    label: 'Gift Card',         path: '/gift-card',       active: false, soon: true },
  ];

  const handleLogout = async () => {
    // ✅ Fixed: correct logout URL
    await api.post('/logout');
    clearUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">

              {/* ✅ Fixed: use snake_case for user fields */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="py-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between px-5 py-3 text-sm transition ${
                      item.active
                        ? 'bg-gray-50 text-gray-900 border-r-2 border-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    } ${item.soon ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </nav>

              <div className="border-t border-gray-100 p-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition w-full justify-center py-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Language selector */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Languages</span>
              </div>
              <div className="space-y-2">
                {[{ value: 'english', label: 'English' }].map((lang) => (
                  <label key={lang.value} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="language"
                      value={lang.value}
                      checked={language === lang.value}
                      onChange={() => setLanguage(lang.value)}
                      className="w-3.5 h-3.5"
                    />
                    {lang.label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl font-light text-gray-900 mb-6">Profile Information</h1>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500 text-xs">(Required)</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="gender"
                      value="MALE"
                      checked={form.gender === 'MALE'}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-4 h-4"
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="gender"
                      value="FEMALE"
                      checked={form.gender === 'FEMALE'}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-4 h-4"
                    />
                    Female
                  </label>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email (disabled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                />
              </div>

              {/* Date of birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of birth (DD/MM/YYYY)
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add your birthday to unlock additional offering/reward!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-gray-900 text-white font-medium py-2.5 px-8 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>

              {message.text && (
                <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? '✓' : '⚠️'} {message.text}
                </div>
              )}
            </form>
          </main>

        </div>
      </div>
    </div>
  );
}