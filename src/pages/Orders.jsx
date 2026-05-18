import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, XCircle, ChevronDown, Package, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { OrderSkeleton } from '../components/ui/Skeleton';

const TIMELINE_STEPS = ['pending', 'paid', 'shipped', 'delivered'];

const STATUS_CONFIG = {
  pending:   { bg: '#fef9ed', text: '#92700a', dot: '#f5a623', label: 'Pending'   },
  paid:      { bg: '#edfaf3', text: '#1a6b3c', dot: '#34c777', label: 'Paid'      },
  shipped:   { bg: '#edf4fe', text: '#1a4a8a', dot: '#4a8ef5', label: 'Shipped'   },
  delivered: { bg: '#f4f4f4', text: '#4a4a4a', dot: '#9a9a9a', label: 'Delivered' },
  cancelled: { bg: '#fef0f0', text: '#8a1a1a', dot: '#e53e3e', label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.delivered;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '999px',
      background: cfg.bg,
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: cfg.text,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0 8px' }}>
        <XCircle style={{ width: '18px', height: '18px', color: '#e53e3e' }} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#e53e3e', fontFamily: 'DM Sans, sans-serif' }}>
          This order was cancelled
        </span>
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.indexOf(status);
  const progress = currentIndex <= 0 ? 0 : (currentIndex / (TIMELINE_STEPS.length - 1)) * 100;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          right: '14px',
          height: '1px',
          background: '#e8e8e8',
          zIndex: 0,
        }} />
        {/* Track fill */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          height: '1px',
          background: '#0a0a0a',
          width: `calc(${progress}% - ${progress > 0 ? 28 : 0}px)`,
          zIndex: 0,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />

        {TIMELINE_STEPS.map((step, index) => {
          const isDone    = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone ? '#0a0a0a' : isCurrent ? '#fff' : '#fff',
                border: isDone ? '2px solid #0a0a0a' : isCurrent ? '2px solid #0a0a0a' : '1.5px solid #d8d8d8',
                transition: 'all 0.4s ease',
              }}>
                {isDone ? (
                  <CheckCircle style={{ width: '16px', height: '16px', color: '#fff' }} strokeWidth={2.5} />
                ) : isCurrent ? (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0a0a0a' }} />
                ) : (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d8d8d8' }} />
                )}
              </div>
              <p style={{
                fontSize: '10px',
                marginTop: '8px',
                textTransform: 'capitalize',
                letterSpacing: '0.06em',
                fontWeight: isDone || isCurrent ? '600' : '400',
                color: isDone || isCurrent ? '#0a0a0a' : '#b0b0b0',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState({});
  const [expandedTimeline, setExpandedTimeline] = useState({});

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder    = (id) => setExpandedOrder(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleTimeline = (id) => setExpandedTimeline(prev => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d)) return 'N/A';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (amount) => {
    const n = parseFloat(amount);
    return isNaN(n) ? '$0.00' : '$' + n.toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ background: '#faf9f7', minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ height: '40px', width: '180px', background: '#ebebeb', borderRadius: '8px', marginBottom: '40px', animation: 'pulse 1.5s infinite' }} />
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '160px', background: '#fff', borderRadius: '20px', border: '1px solid #ebebeb', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#e53e3e', fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ background: '#faf9f7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#f0ede8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Package style={{ width: '32px', height: '32px', color: '#8c8c8c' }} strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: '500', color: '#0a0a0a', marginBottom: '8px' }}>
            No orders yet
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#8c8c8c' }}>
            Looks like you haven't placed any orders.
          </p>
        </div>
        <Link to="/shop" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          background: '#0a0a0a',
          color: '#fff',
          borderRadius: '999px',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: '500',
          letterSpacing: '0.06em',
          fontFamily: 'DM Sans, sans-serif',
          transition: 'background 0.2s ease',
        }}>
          Start Shopping <ArrowRight style={{ width: '14px', height: '14px' }} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#faf9f7', minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .order-card {
          animation: fadeUp 0.4s ease forwards;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #ebebeb;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        .order-card:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-family: DM Sans, sans-serif;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: #6a6a6a;
          padding: 0;
          transition: color 0.2s ease;
        }
        .expand-btn:hover { color: #0a0a0a; }
        .item-row {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.2s ease;
        }
        .item-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '42px',
            fontWeight: '500',
            color: '#0a0a0a',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            My Orders
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#8c8c8c', marginTop: '8px' }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
          </p>
        </div>

        {/* Orders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order, idx) => (
            <div key={order.id} className="order-card" style={{ animationDelay: `${idx * 60}ms` }}>

              {/* Card Header */}
              <div style={{
                padding: '20px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid #f5f5f5',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: '#0a0a0a', margin: 0 }}>
                      Order #{order.id}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9a9a9a', marginTop: '4px' }}>
                    {formatDate(order.createdAt || order.created_at)} · {formatTime(order.createdAt || order.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: '600', color: '#0a0a0a', margin: 0 }}>
                    {formatPrice(order.totalAmount || order.total_amount)}
                  </p>
                </div>
              </div>

              {/* Tracking + Items */}
              <div style={{ padding: '16px 24px 20px' }}>

                {/* Timeline Toggle */}
                <button className="expand-btn" onClick={() => toggleTimeline(order.id)} style={{ marginBottom: '4px' }}>
                  <ChevronDown style={{
                    width: '14px',
                    height: '14px',
                    transform: expandedTimeline[order.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }} />
                  {expandedTimeline[order.id] ? 'Hide tracking' : 'Track order'}
                </button>

                {expandedTimeline[order.id] && <OrderTimeline status={order.status} />}

                {/* Items Toggle */}
                <div style={{ marginTop: expandedTimeline[order.id] ? '16px' : '12px' }}>
                  <button className="expand-btn" onClick={() => toggleOrder(order.id)}>
                    <ChevronDown style={{
                      width: '14px',
                      height: '14px',
                      transform: expandedOrder[order.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }} />
                    {expandedOrder[order.id] ? 'Hide items' : `View items (${order.items?.length || 0})`}
                  </button>

                  {expandedOrder[order.id] && (
                    <div style={{ marginTop: '16px' }}>
                      {order.items?.map((item) => {
                        const imageUrl  = item.product?.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image';
                        const itemPrice = parseFloat(item.price) || 0;
                        return (
                          <div key={item.id} className="item-row">
                            <img
                              src={imageUrl}
                              alt={item.product?.name}
                              style={{
                                width: '64px',
                                height: '64px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                flexShrink: 0,
                                background: '#f5f5f5',
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '500', color: '#0a0a0a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.product?.name}
                              </p>
                              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
                                {item.variant?.size} · {item.variant?.color} · Qty {item.quantity}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', margin: 0 }}>
                                ${(itemPrice * item.quantity).toFixed(2)}
                              </p>
                              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#b0b0b0', marginTop: '2px' }}>
                                ${itemPrice.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <Link to="/shop" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            border: '1px solid #0a0a0a',
            borderRadius: '999px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.06em',
            color: '#0a0a0a',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0a0a0a'; }}
          >
            Continue Shopping <ArrowRight style={{ width: '14px', height: '14px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}