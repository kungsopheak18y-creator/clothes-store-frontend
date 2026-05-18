import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Menu, X, User, LogOut, UserPlus, Package, Settings, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const items = useCartStore((state) => state.items) || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setAccountOpen(false);
    try { await api.post('/logout'); } catch {}
    clearUser();
    toast.success('See you soon!');
    navigate('/login');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home',     href: '/home',                 onClick: handleHomeClick },
    { label: 'Products', href: '/home#featured-products'                         },
    { label: 'Shop',     href: '/shop'                                           },
    { label: 'About',    href: '/home#about'                                     },
    { label: 'Contact',  href: '/home#contact'                                   },
  ];

  const firstName = user?.first_name || user?.firstName || user?.name?.split(' ')[0] || '';
  const lastName  = user?.last_name  || user?.lastName  || user?.name?.split(' ')[1] || '';
  const initial   = firstName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-link {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: #4a4a4a;
          text-decoration: none;
          padding-bottom: 2px;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #0a0a0a;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover { color: #0a0a0a; }
        .nav-link:hover::after { width: 100%; }

        .logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 22px;
          letter-spacing: 0.04em;
          color: #0a0a0a;
        }

        .dropdown-enter {
          animation: dropdownIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        .mobile-menu-enter {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }

        .cart-badge {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popIn {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        .nav-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: background 0.2s ease;
          color: #3a3a3a;
        }
        .nav-icon-btn:hover { background: #f5f0eb; color: #0a0a0a; }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,1)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #ebebeb' : '1px solid #f0f0f0',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* ── Logo ── */}
          <Link to="/home" onClick={handleHomeClick} className="logo-text" style={{ textDecoration: 'none' }}>
            Clothes Store
          </Link>

          {/* ── Desktop Nav ── */}
          <div style={{ display: 'none' }} className="md:flex" >
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} onClick={link.onClick} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right Side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

            {/* Wishlist */}
            <Link to="/wishlist" className="nav-icon-btn" style={{ textDecoration: 'none', position: 'relative' }}>
              <Heart style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="nav-icon-btn" style={{ textDecoration: 'none', position: 'relative' }}>
              <ShoppingCart style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span key={itemCount} className="cart-badge" style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  background: '#0a0a0a',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '700',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <div style={{ position: 'relative', marginLeft: '4px' }} ref={dropdownRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '999px',
                  border: '1px solid #e8e8e8',
                  background: accountOpen ? '#f5f0eb' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: user ? '#0a0a0a' : '#f0ede8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {user ? (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                      {initial}
                    </span>
                  ) : (
                    <User style={{ width: '14px', height: '14px', color: '#8c8c8c' }} strokeWidth={1.5} />
                  )}
                </div>
                <ChevronDown style={{
                  width: '13px',
                  height: '13px',
                  color: '#6a6a6a',
                  transform: accountOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }} />
              </button>

              {/* Dropdown */}
              {accountOpen && (
                <div className="dropdown-enter" style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: '220px',
                  background: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #ebebeb',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}>
                  {user ? (
                    <>
                      {/* User Info */}
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', background: '#faf9f7' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#0a0a0a', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                          {firstName} {lastName}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px', fontFamily: 'DM Sans, sans-serif' }}>
                          {user.email}
                        </p>
                      </div>
                      <div style={{ padding: '8px' }}>
                        {user.role === 'admin' && (
                          <DropdownItem icon={<Settings strokeWidth={1.5} />} label="Admin Panel" to="/admin" onClick={() => setAccountOpen(false)} />
                        )}
                        <DropdownItem icon={<Package strokeWidth={1.5} />}  label="My Orders"  to="/orders"   onClick={() => setAccountOpen(false)} />
                        <DropdownItem icon={<Heart strokeWidth={1.5} />}    label="Wishlist"   to="/wishlist"  onClick={() => setAccountOpen(false)} />
                        <DropdownItem icon={<User strokeWidth={1.5} />}     label="Profile"    to="/profile"   onClick={() => setAccountOpen(false)} />
                        <div style={{ borderTop: '1px solid #f5f5f5', marginTop: '4px', paddingTop: '4px' }}>
                          <button
                            onClick={handleLogout}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#e53e3e',
                              fontFamily: 'DM Sans, sans-serif',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <LogOut style={{ width: '15px', height: '15px' }} />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', background: '#faf9f7' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#0a0a0a', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Welcome</p>
                        <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px', fontFamily: 'DM Sans, sans-serif' }}>Sign in for a better experience</p>
                      </div>
                      <div style={{ padding: '8px' }}>
                        <DropdownItem icon={<User strokeWidth={1.5} />}     label="Sign in"        to="/login"    onClick={() => setAccountOpen(false)} />
                        <DropdownItem icon={<UserPlus strokeWidth={1.5} />} label="Create account" to="/register" onClick={() => setAccountOpen(false)} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                marginLeft: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#3a3a3a',
                transition: 'background 0.2s ease',
              }}
            >
              {mobileMenuOpen
                ? <X style={{ width: '20px', height: '20px' }} strokeWidth={1.5} />
                : <Menu style={{ width: '20px', height: '20px' }} strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="mobile-menu-enter md:hidden" style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff',
            overflowY: 'auto',
            zIndex: 49,
          }}>
            <div style={{ padding: '24px' }}>
              {/* Nav Links */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.12em', color: '#b0b0b0', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'DM Sans, sans-serif' }}>
                  Navigation
                </p>
                {navLinks.map((link, i) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => { link.onClick?.(); setMobileMenuOpen(false); }}
                    style={{
                      display: 'block',
                      padding: '14px 0',
                      fontSize: '24px',
                      fontFamily: 'Cormorant Garamond, serif',
                      fontWeight: '500',
                      color: '#0a0a0a',
                      textDecoration: 'none',
                      borderBottom: i < navLinks.length - 1 ? '1px solid #f5f5f5' : 'none',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Account Section */}
              <div>
                <p style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.12em', color: '#b0b0b0', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'DM Sans, sans-serif' }}>
                  Account
                </p>
                {user ? (
                  <>
                    <div style={{ padding: '14px 16px', background: '#faf9f7', borderRadius: '12px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{firstName} {lastName}</p>
                      <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px', fontFamily: 'DM Sans, sans-serif' }}>{user.email}</p>
                    </div>
                    {user.role === 'admin' && (
                      <MobileMenuItem label="Admin Panel" to="/admin" onClick={() => setMobileMenuOpen(false)} />
                    )}
                    <MobileMenuItem label="My Orders"  to="/orders"   onClick={() => setMobileMenuOpen(false)} />
                    <MobileMenuItem label="Wishlist"   to="/wishlist"  onClick={() => setMobileMenuOpen(false)} />
                    <MobileMenuItem label="Profile"    to="/profile"   onClick={() => setMobileMenuOpen(false)} />
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 0',
                        fontSize: '14px',
                        fontFamily: 'DM Sans, sans-serif',
                        color: '#e53e3e',
                        background: 'none',
                        border: 'none',
                        borderTop: '1px solid #f5f5f5',
                        marginTop: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <MobileMenuItem label="Sign in"        to="/login"    onClick={() => setMobileMenuOpen(false)} />
                    <MobileMenuItem label="Create account" to="/register" onClick={() => setMobileMenuOpen(false)} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// ── Helper Components ─────────────────────────────────────────
function DropdownItem({ icon, label, to, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '13px',
        color: '#2a2a2a',
        fontFamily: 'DM Sans, sans-serif',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f7f4f0'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ width: '15px', height: '15px', color: '#6a6a6a', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function MobileMenuItem({ label, to, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'block',
        padding: '12px 0',
        fontSize: '14px',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: '400',
        color: '#2a2a2a',
        textDecoration: 'none',
        borderBottom: '1px solid #f5f5f5',
      }}
    >
      {label}
    </Link>
  );
}