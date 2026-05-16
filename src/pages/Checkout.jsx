import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, CreditCard, Truck, Phone, MessageCircle,
  Edit2, Trash2, Star, Plus, ChevronRight, X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const subtotal = getTotal();
  const deliveryFee = 1.0;
  const total = subtotal;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [addressForm, setAddressForm] = useState({
    first_name: '', last_name: '', phone: '',
    address_line: '', city: '', country: 'Cambodia', is_default: false,
  });

  const [contactMethod, setContactMethod] = useState('phone');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });

  const [order, setOrder] = useState(null);
  const [qrString, setQrString] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [manualChecking, setManualChecking] = useState(false);
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (items.length === 0 && !orderPlaced && paymentStatus !== 'waiting') {
      navigate('/shop');
    }
  }, [items, navigate, orderPlaced, paymentStatus]);

  useEffect(() => { fetchAddresses(); }, []);

  useEffect(() => {
    if (!order || !qrString) return;
    if (paymentStatus !== 'waiting') return;

    attemptsRef.current = 0;

    const poll = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > 200) {
        clearInterval(poll);
        setPaymentStatus('expired');
        return;
      }
      try {
        const res = await api.get('/payment/status/' + order.id);
        console.log('Poll response:', res.data);
        const status = res.data.paymentStatus;
        if (status === 'PAID') {
          clearInterval(poll);
          setPaymentStatus('paid');
          clearCart();
          toast.success('Payment confirmed!');
          setTimeout(() => navigate('/orders'), 2000);
        } else if (status === 'EXPIRED') {
          clearInterval(poll);
          setPaymentStatus('expired');
          toast.error('QR code expired. Please generate a new one.');
        }
      } catch (err) {
        console.warn('Poll attempt ' + attemptsRef.current + ' failed, retrying...');
      }
    }, 3000);

    intervalRef.current = poll;
    return () => clearInterval(poll);
  }, [order?.id, qrString]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/addresses');
      const data = res.data.addresses || [];
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const saveAddress = async () => {
    try {
      if (editingAddress) {
        await api.put('/addresses/' + editingAddress.id, addressForm);
      } else {
        await api.post('/addresses', addressForm);
      }
      setShowAddressForm(false);
      fetchAddresses();
      toast.success('Address saved!');
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const deleteAddress = async (id) => {
    if (addresses.length === 1) { toast.error('You need at least one address'); return; }
    if (confirm('Delete this address?')) {
      await api.delete('/addresses/' + id);
      fetchAddresses();
    }
  };

  const setDefaultAddress = async (id) => {
    await api.patch('/addresses/' + id + '/default');
    fetchAddresses();
  };

  const handleCancelPayment = async () => {
    try {
      clearInterval(intervalRef.current);
      await api.delete('/payment/cancel/' + order.id);
      toast.success('Order cancelled');
      navigate('/shop');
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const handleManualCheck = async () => {
    setManualChecking(true);
    try {
      const res = await api.get('/payment/status/' + order.id);
      const status = res.data.paymentStatus;
      if (status === 'PAID') {
        clearInterval(intervalRef.current);
        setPaymentStatus('paid');
        clearCart();
        toast.success('Payment confirmed!');
        setTimeout(() => navigate('/orders'), 2000);
      } else if (status === 'EXPIRED') {
        clearInterval(intervalRef.current);
        setPaymentStatus('expired');
        toast.error('QR expired. Please generate a new one.');
      } else {
        toast('Payment not received yet. Please wait a moment.', { icon: '⏳' });
      }
    } catch (err) {
      toast.error('Could not check payment status.');
    } finally {
      setManualChecking(false);
    }
  };

  const refreshQR = async () => {
    if (!order) return;
    try {
      setPaymentStatus('waiting');
      const paymentRes = await api.post('/payment/initiate/' + order.id);
      setQrString(paymentRes.data.qrString);
      setQrExpiresAt(paymentRes.data.expiresAt);
      toast.success('New QR generated!');
    } catch (err) {
      toast.error('Failed to refresh QR');
      setPaymentStatus('expired');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }
    if (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      toast.error('Please fill in your card details');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.productId,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: total,
        notes: `Contact via ${contactMethod}`,
      };

      const orderRes = await api.post('/orders', orderPayload);
      const newOrder = orderRes.data.order;
      setOrder(newOrder);

      if (paymentMethod === 'cod') {
        setOrderPlaced(true);
        clearCart();
        toast.success('Order placed! Redirecting...');
        setTimeout(() => navigate('/orders'), 2000);

      } else if (paymentMethod === 'khqr') {
        const paymentRes = await api.post('/payment/initiate/' + newOrder.id);
        const qs = paymentRes.data.qrString;
        const expiresAt = paymentRes.data.expiresAt;

        if (!qs) {
          toast.error('Failed to generate QR. Please try again.');
          return;
        }

        setQrString(qs);
        setQrExpiresAt(expiresAt);
        setPaymentStatus('waiting');

      } else if (paymentMethod === 'card') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await api.patch('/orders/' + newOrder.id + '/status', { status: 'paid' });
        setOrderPlaced(true);
        clearCart();
        toast.success('Order placed! Redirecting...');
        setTimeout(() => navigate('/orders'), 2000);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Order failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── SCREENS ──────────────────────────────────────────────

  if (paymentStatus === 'paid') {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-light text-gray-900">Payment Successful!</h2>
        <p className="text-gray-500 mt-2">Your order has been confirmed.</p>
        <button onClick={() => navigate('/orders')} className="mt-6 bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800">
          View Orders
        </button>
      </div>
    );
  }

  if (order && qrString && (paymentStatus === 'waiting' || paymentStatus === 'expired')) {
    return (
      <div className="py-12 max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-medium text-gray-900">Scan to Pay</h2>
          <p className="text-gray-500 text-sm mt-1 mb-2">Use ABA, Bakong, Wing or any KHQR app</p>
          <p className="text-2xl font-bold text-gray-900 mb-6">${total.toFixed(2)} USD</p>

          {paymentStatus === 'expired' ? (
            <div className="py-8">
              <p className="text-red-500 font-medium mb-4">QR code expired</p>
              <button onClick={refreshQR} className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800">
                Generate New QR
              </button>
            </div>
          ) : (
            <>
              <div className="inline-block bg-white p-3 rounded-xl shadow-md border border-gray-100">
                <QRCodeCanvas value={qrString} size={220} />
              </div>
              <p className="text-xs text-gray-400 mt-4">Order #{order.id}</p>
              {qrExpiresAt && (
                <p className="text-xs text-orange-400 mt-1">
                  Expires at {new Date(qrExpiresAt).toLocaleTimeString()}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-3 animate-pulse">Waiting for payment...</p>
              <button
                onClick={handleManualCheck}
                disabled={manualChecking}
                className="mt-4 w-full border border-gray-300 text-gray-600 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                {manualChecking ? 'Checking...' : 'I already paid — check now'}
              </button>
            </>
          )}

          <button
            onClick={handleCancelPayment}
            className="mt-3 w-full border border-red-200 text-red-500 py-2.5 rounded-full text-sm font-medium hover:bg-red-50 transition"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-light text-gray-900">Order placed successfully!</h2>
        <p className="text-gray-500 mt-2">Redirecting to your orders...</p>
      </div>
    );
  }

  if (loadingAddresses) return <div className="py-20 text-center">Loading addresses...</div>;

  return (
    <div className="bg-gray-50/40 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">Checkout</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-6">

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-medium text-gray-900">Delivery address</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({
                      first_name: user?.first_name || user?.name?.split(' ')[0] || '',
                      last_name: user?.last_name || user?.name?.split(' ')[1] || '',
                      phone: user?.phone || '',
                      address_line: '', city: '', country: 'Cambodia',
                      is_default: addresses.length === 0,
                    });
                    setShowAddressForm(true);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-800 transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add new
                </button>
              </div>
              <div className="p-6">
                {!showAddressForm ? (
                  <>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {addresses.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">No addresses yet. Add one above.</p>
                      )}
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={'relative cursor-pointer rounded-xl p-4 transition-all duration-200 ' +
                            (selectedAddressId === addr.id
                              ? 'bg-gray-50 ring-2 ring-gray-200 ring-offset-1'
                              : 'bg-white border border-gray-200 hover:border-gray-300')}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-900">{addr.firstName} {addr.lastName}</p>
                                {addr.isDefault && (
                                  <span className="text-[11px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Default</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{addr.addressLine}</p>
                              <p className="text-sm text-gray-600">{addr.city}, {addr.country}</p>
                              <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(addr);
                                setAddressForm({
                                  first_name: addr.firstName,
                                  last_name: addr.lastName,
                                  phone: addr.phone,
                                  address_line: addr.addressLine,
                                  city: addr.city,
                                  country: addr.country,
                                  is_default: addr.isDefault,
                                });
                                setShowAddressForm(true);
                              }} className="p-1 text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                              {!addr.isDefault && (
                                <button onClick={(e) => { e.stopPropagation(); setDefaultAddress(addr.id); }} className="p-1 text-gray-400 hover:text-gray-700"><Star className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Delivery: ${deliveryFee} – Clothes Store Bikers (1-3 days)
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">{editingAddress ? 'Edit address' : 'New address'}</h3>
                      <button onClick={() => setShowAddressForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="First name" className="border border-gray-200 rounded-lg px-4 py-2" value={addressForm.first_name} onChange={e => setAddressForm({ ...addressForm, first_name: e.target.value })} />
                      <input type="text" placeholder="Last name" className="border border-gray-200 rounded-lg px-4 py-2" value={addressForm.last_name} onChange={e => setAddressForm({ ...addressForm, last_name: e.target.value })} />
                      <input type="tel" placeholder="Phone number" className="border border-gray-200 rounded-lg px-4 py-2 md:col-span-2" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                      <input type="text" placeholder="Street address" className="border border-gray-200 rounded-lg px-4 py-2 md:col-span-2" value={addressForm.address_line} onChange={e => setAddressForm({ ...addressForm, address_line: e.target.value })} />
                      <input type="text" placeholder="City" className="border border-gray-200 rounded-lg px-4 py-2" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                      <select className="border border-gray-200 rounded-lg px-4 py-2" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}>
                        <option>Cambodia</option>
                        <option>Thailand</option>
                        <option>Vietnam</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 mt-4 text-sm">
                      <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                      Set as default address
                    </label>
                    <div className="flex gap-3 mt-5">
                      <button onClick={saveAddress} className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800">Save</button>
                      <button onClick={() => setShowAddressForm(false)} className="border border-gray-300 px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Bag */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">Shopping bag ({items.length})</h2>
              </div>
              <div className="p-6 divide-y divide-gray-100">
                {items.map(item => (
                  <div key={item.variantId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <img src={
                      item.image ||
                      (Array.isArray(item.images) ? item.images[0] : null) ||
                      'https://via.placeholder.com/800x1000?text=No+Image'
                    } alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-gray-100 shadow-sm" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.color} / {item.size}</p>
                      <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-medium text-gray-900">Payment</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="khqr" checked={paymentMethod === 'khqr'} onChange={() => { setPaymentMethod('khqr'); setShowCardForm(false); }} />
                  <span className="font-medium">KHQR (ABA / Bakong / Wing)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => { setPaymentMethod('card'); setShowCardForm(true); }} />
                  <span className="font-medium">Credit/Debit Card</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => { setPaymentMethod('cod'); setShowCardForm(false); }} />
                  <span className="font-medium">Cash on Delivery</span>
                </label>
                {showCardForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                    <input type="text" placeholder="Card number" className="w-full border border-gray-200 rounded-lg px-4 py-2" value={cardDetails.number} onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })} />
                    <div className="flex gap-3">
                      <input type="text" placeholder="MM/YY" className="w-1/2 border border-gray-200 rounded-lg px-4 py-2" value={cardDetails.expiry} onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })} />
                      <input type="text" placeholder="CVV" className="w-1/2 border border-gray-200 rounded-lg px-4 py-2" value={cardDetails.cvv} onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })} />
                    </div>
                    <p className="text-xs text-gray-500">Demo: any values work (mock payment)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preferred Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-medium text-gray-900">Preferred contact</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setContactMethod('phone')} className={'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ' + (contactMethod === 'phone' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                  <button onClick={() => setContactMethod('telegram')} className={'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ' + (contactMethod === 'telegram' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                    <MessageCircle className="w-4 h-4" /> Telegram
                  </button>
                  <button onClick={() => setContactMethod('whatsapp')} className={'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ' + (contactMethod === 'whatsapp' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-medium text-gray-900 mb-5">Order Summary</h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tax included. Shipping calculated at checkout.</p>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={loading}
                className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Checkout $' + total.toFixed(2)}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}