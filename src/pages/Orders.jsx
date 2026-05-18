import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, XCircle, X, MapPin, Phone, Package } from 'lucide-react';
import api from '../lib/api';
import { OrderSkeleton } from '../components/ui/Skeleton';

const TIMELINE_STEPS = ['pending', 'paid', 'shipped', 'delivered'];

function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 mt-4 px-1">
        <XCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-500">Order Cancelled</span>
      </div>
    );
  }
  const currentIndex = TIMELINE_STEPS.indexOf(status);
  return (
    <div className="mt-4 px-1">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-gray-900 z-0 transition-all duration-500"
          style={{ width: currentIndex === 0 ? '0%' : `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
        />
        {TIMELINE_STEPS.map((step, index) => {
          const isDone    = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isDone ? 'bg-gray-900 border-gray-900' : isCurrent ? 'bg-white border-gray-900' : 'bg-white border-gray-300'
              }`}>
                {isDone ? <CheckCircle className="w-5 h-5 text-white" /> : isCurrent ? <div className="w-3 h-3 bg-gray-900 rounded-full" /> : <Circle className="w-4 h-4 text-gray-300" />}
              </div>
              <p className={`text-xs mt-1 capitalize font-medium ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ✅ Order Detail Modal
function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  const formatDate = (d) => { if (!d) return 'N/A'; const dt = new Date(d); return isNaN(dt) ? 'N/A' : dt.toLocaleDateString() + ' at ' + dt.toLocaleTimeString(); };
  const formatPrice = (a) => { const n = parseFloat(a); return isNaN(n) ? '$0.00' : '$' + n.toFixed(2); };

  const statusStyles = {
    pending:   'bg-yellow-100 text-yellow-800',
    paid:      'bg-green-100 text-green-800',
    shipped:   'bg-blue-100 text-blue-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order #{order.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status}
            </span>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h3>
            <OrderTimeline status={order.status} />
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Items
            </h3>
            <div className="space-y-3">
              {order.items?.map(item => {
                const imageUrl = item.product?.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image';
                const itemPrice = parseFloat(item.price) || 0;
                return (
                  <div key={item.id} className="flex gap-4 items-center bg-gray-50 rounded-xl p-3">
                    <img src={imageUrl} alt={item.product?.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.product?.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.variant?.size} / {item.variant?.color}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">${(itemPrice * item.quantity).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">${itemPrice.toFixed(2)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Preference
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTimeline, setExpandedTimeline] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeline = (orderId) => {
    setExpandedTimeline(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:   'bg-yellow-100 text-yellow-800',
      paid:      'bg-green-100 text-green-800',
      shipped:   'bg-blue-100 text-blue-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const formatPrice = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return '$' + num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">My Orders</h1>
          <div className="space-y-6">{[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-light text-gray-800 mb-4">No orders yet</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
        <Link to="/shop" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">My Orders</h1>
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Track + View Details */}
              <div className="px-6 pt-4 pb-2 flex items-center gap-4">
                <button
                  onClick={() => toggleTimeline(order.id)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  {expandedTimeline[order.id] ? 'Hide tracking ▲' : 'Track order ▼'}
                </button>
                {/* ✅ View Details button */}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-xs text-gray-900 font-medium hover:underline"
                >
                  View details →
                </button>
              </div>

              {expandedTimeline[order.id] && (
                <div className="px-6 pb-4">
                  <OrderTimeline status={order.status} />
                </div>
              )}

              <div className="p-6 pt-2">
                <div className="space-y-4">
                  {order.items?.map((item) => {
                    const imageUrl = item.product?.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image';
                    const itemPrice = parseFloat(item.price) || 0;
                    return (
                      <div key={item.id} className="flex gap-4 items-center bg-gray-50/40 rounded-xl p-3 hover:bg-gray-100/50 transition">
                        <img src={imageUrl} alt={item.product?.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                              <p className="text-sm text-gray-500">{item.variant?.size} / {item.variant?.color}</p>
                              <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">${(itemPrice * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">${itemPrice.toFixed(2)} each</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-100 flex justify-end">
                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-1 rounded-full border border-gray-200 hover:border-gray-400">
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}