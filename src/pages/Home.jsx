import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faTruck, faHeadset, faEnvelope, faPhone, faLocationDot, faArrowRight, faStar, faShield } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import PageTransition from '../components/ui/PageTransition';

export default function Home() {
  const location = useLocation();
  const [featured, setFeatured] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/products?per_page=4'), api.get('/brands')])
      .then(([productsRes, brandsRes]) => {
        setFeatured(productsRes.data.products?.data || []);
        setBrands(brandsRes.data.brands || []);
      })
      .catch(err => console.error(err));
  }, []);


  useEffect(() => {
    if (location.hash === '#featured-products') document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
    else if (location.hash === '#about') document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    else if (location.hash === '#contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }, [location]);

  return (
    <PageTransition>

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 mix-blend-overlay" />
        <div className="container-premium py-24 md:py-32 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-mono font-light tracking-wide">Clothes Fashion Collection</h1>
          <p className="text-xl text-brand-100 mt-4 font-mono">Discover timeless elegance and modern style</p>
          {/* <Link to="/shop" className="inline-block bg-white text-brand-900 px-8 py-3 rounded-full font-mono font-medium font-semibold hover:bg-brand-50 transition mt-8 shadow-lg">Shop Now</Link> */}
        </div>
      </div>

      {/* Brand Strip */}
      {brands.length > 0 && (
        <div className="bg-premium-light py-12 border-b border-brand-100">
          <div className="container-premium">
            <p className="text-center text-xs font-semibold tracking-wider text-brand-400 uppercase mb-6">Shop by Brand</p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {brands.map((brand) => (
                <Link key={brand.id} to={`/shop?brand_id=${brand.id}`} className="px-6 py-2 text-sm font-medium text-brand-700 bg-white border border-brand-200 rounded-full shadow-sm hover:shadow-md transition">
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div id="featured-products" className="bg-white py-16">
        <div className="container-premium">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Curated Selection</span>
            <h2 className="text-3xl md:text-4xl font-light text-brand-800 mt-2">Featured Collection</h2>
            <div className="w-12 h-px bg-brand-300 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <div className="flex justify-center mt-12">
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 border-b border-brand-300 pb-1 hover:text-brand-800 hover:border-brand-800 transition">
              VIEW ALL PRODUCTS
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div id="about" className="bg-white py-24 border-t border-brand-100">
        <div className="container-premium">

          {/* Top label */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-px bg-brand-200 w-12" />
            <span className="text-xs tracking-[0.2em] uppercase text-brand-400 font-medium">About Us</span>
          </div>

          {/* Main 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

            {/* Left — headline + story */}
            <div>
              <h2 className="text-4xl md:text-5xl font-mono font-light text-brand-900 leading-[1.15] mb-8">
                Clothing that works<br />as hard as you do.
              </h2>
              <p className="text-brand-500 text-base leading-relaxed mb-5">
                Clothes Store was founded on one idea — that premium menswear shouldn't be complicated. We handpick every piece from brands that take quality seriously, so you can dress well without thinking too hard about it.
              </p>
              <p className="text-brand-400 text-sm leading-relaxed mb-10">
                Based in Phnom Penh, we serve customers across Cambodia who want clothing that actually lasts. No fast fashion. No shortcuts. Just good pieces, honestly priced.
              </p>

              {/* Stats row */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-8 border-t border-brand-100">
                {[
                  { num: '500+', label: 'Products', icon: faShield },
                  { num: '10K+', label: 'Customers', icon: faStar },
                  { num: '100%', label: 'Authentic', icon: faMedal },
                ].map((s, i) => (
                  <div key={i} className="flex-1 w-full bg-brand-50 border border-brand-100 rounded-2xl p-8 hover:shadow-md hover:bg-white transition group text-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-brand-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-50 transition">
                      <FontAwesomeIcon icon={s.icon} className="text-brand-500 text-base" />
                    </div>
                    <p className="text-4xl font-light text-brand-900 tracking-tight mb-1">{s.num}</p>
                    <p className="text-xs text-brand-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Right — 3 values */}
            <div className="space-y-0 divide-y divide-brand-100">
              {[
                {
                  icon: faMedal,
                  title: 'Premium Quality',
                  desc: "Every item passes our quality check. We only carry pieces we'd buy ourselves.",
                },
                {
                  icon: faTruck,
                  title: 'Fast Delivery',
                  desc: 'Orders packed and shipped the same day. We respect your time.',
                },
                {
                  icon: faHeadset,
                  title: 'Real Support',
                  desc: "Talk to an actual person. No chatbots, no automated replies — just help.",
                },
              ].map((v, i) => (
                <div key={i} className="flex items-start gap-5 py-7 group">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-100 transition">
                    <FontAwesomeIcon icon={v.icon} className="text-brand-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-800 mb-1">{v.title}</p>
                    <p className="text-sm text-brand-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}

              <h2 className="text-4xl md:text-5xl font-mono font-light text-brand-900 leading-[1.15] mb-8 pt-7 px-6">
                Dear customer<br />please enjoy your online shopping here.
              </h2>
            </div>

          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <div id="contact" className="bg-premium-light py-20 border-t border-brand-100">
        <div className="container-premium">

          {/* Header */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-px bg-brand-200 w-12" />
            <span className="text-xs tracking-[0.2em] uppercase text-brand-400 font-medium">Contact</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

            {/* Left */}
            <div>
              <h2 className="text-4xl md:text-5xl font-mono font-light text-brand-900 leading-[1.15] mb-6">
                We're here<br />whenever you need us.
              </h2>
              <p className="text-brand-500 text-base leading-relaxed max-w-sm">
                Got a question about sizing, an order, or just want to say hello — we're quick to respond and always happy to help.
              </p>

              {/* Bottom tag */}
              <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-100 rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-brand-500">Usually replies within a few hours</span>
              </div>
            </div>

            {/* Right — contact list */}
            <div className="divide-y divide-brand-100">
              {[
                {
                  icon: faEnvelope,
                  label: 'Email us',
                  value: 'support@clothesstore.com',
                  note: 'Reply within 24 hours',
                  bg: 'bg-brand-100',
                  color: 'text-blue-none',
                },
                {
                  icon: faPhone,
                  label: 'Call us',
                  value: '+855 96 365 9813',
                  note: 'Mon - Sat, 8am - 8pm',
                  bg: 'bg-brand-100',
                  color: 'text-green-none',
                },
                {
                  icon: faLocationDot,
                  label: 'Visit us',
                  value: 'Phnom Penh, Cambodia',
                  note: 'Come see us in store',
                  bg: 'bg-brand-100',
                  color: 'text-orange-none',
                },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-5 py-6 group">
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0 transition group-hover:scale-105`}>
                    <FontAwesomeIcon icon={c.icon} className={`${c.color} text-base`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-400 uppercase tracking-widest mb-0.5">{c.label}</p>
                    <p className="text-brand-900 text-sm font-medium">{c.value}</p>
                  </div>
                  <span className="text-xs text-brand-300 hidden md:block shrink-0">{c.note}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </PageTransition>
  );
}