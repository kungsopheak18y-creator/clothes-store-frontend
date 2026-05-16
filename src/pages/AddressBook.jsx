import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, MapPin, Phone, X } from 'lucide-react';
import api from '../lib/api';

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  // ✅ Fixed: use snake_case to match Laravel API
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address_line: '',
    city: '',
    country: 'Cambodia',
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      // ✅ Fixed: Laravel returns { addresses: [...] }
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setForm({
        first_name: address.first_name,
        last_name: address.last_name,
        phone: address.phone,
        address_line: address.address_line,
        city: address.city,
        country: address.country,
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setForm({ first_name: '', last_name: '', phone: '', address_line: '', city: '', country: 'Cambodia', is_default: false });
    }
    setShowModal(true);
  };

  const saveAddress = async () => {
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, form);
      } else {
        await api.post('/addresses', form);
      }
      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const deleteAddress = async (id) => {
    if (confirm('Delete this address?')) {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    }
  };

  const setDefault = async (id) => {
    await api.patch(`/addresses/${id}/default`);
    fetchAddresses();
  };

  if (loading) return <div className="py-20 text-center">Loading addresses...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light text-gray-900">Address Book</h1>
        <button onClick={() => openModal()} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
          No saved addresses. Click "Add Address" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* ✅ Fixed: snake_case field names */}
                    <p className="font-medium text-gray-900">{addr.first_name} {addr.last_name}</p>
                    {addr.is_default && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                    <MapPin className="w-3.5 h-3.5" /> {addr.address_line}, {addr.city}, {addr.country}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {addr.phone}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(addr)} className="p-1 text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteAddress(addr.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  {!addr.is_default && <button onClick={() => setDefault(addr.id)} className="p-1 text-gray-400 hover:text-yellow-500"><Star className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">{editingAddress ? 'Edit Address' : 'Add Address'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="First name" className="w-full border rounded-lg px-3 py-2" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
              <input type="text" placeholder="Last name" className="w-full border rounded-lg px-3 py-2" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
              <input type="tel" placeholder="Phone number" className="w-full border rounded-lg px-3 py-2" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              {/* ✅ Fixed: address_line not address */}
              <input type="text" placeholder="Street address" className="w-full border rounded-lg px-3 py-2" value={form.address_line} onChange={e => setForm({...form, address_line: e.target.value})} />
              <input type="text" placeholder="City" className="w-full border rounded-lg px-3 py-2" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              <select className="w-full border rounded-lg px-3 py-2" value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                <option>Cambodia</option><option>Thailand</option><option>Vietnam</option>
              </select>
              {/* ✅ Fixed: is_default not isDefault */}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} />
                Set as default address
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-full">Cancel</button>
              <button onClick={saveAddress} className="px-4 py-2 bg-gray-900 text-white rounded-full">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}