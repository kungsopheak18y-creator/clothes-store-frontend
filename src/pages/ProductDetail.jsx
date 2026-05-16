import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Minus, Plus, Truck, ShieldCheck, ArrowLeft, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';

// ─── Star Rating Component ───────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            className="w-5 h-5"
            fill={(hovered || value) >= star ? '#FBBF24' : 'none'}
            stroke={(hovered || value) >= star ? '#FBBF24' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Reviews Section Component ───────────────────────────────────────────────
function ReviewsSection({ productId }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) fetchEligibleOrders();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      setReviews(res.data.reviews);
      setAverage(res.data.average);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEligibleOrders = async () => {
    try {
      const res = await api.get('/orders');
      const orders = res.data.orders || [];
      const eligible = orders.filter(o =>
        o.status === 'delivered' &&
        o.items?.some(i => i.product_id === parseInt(productId))
      );
      setEligibleOrders(eligible);
      if (eligible.length > 0) setSelectedOrder(eligible[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        product_id: productId,
        order_id: selectedOrder,
        rating,
        comment,
      });
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      fetchReviews();
      fetchEligibleOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-brand-100 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-light text-brand-900">Customer Reviews</h2>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(average)} readonly />
            <span className="text-sm text-brand-400">{average} ({total} {total === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {/* Write a review — only for customers who received this product */}
      {user && eligibleOrders.length > 0 && (
        <div className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-100">
          <h3 className="font-medium text-brand-900 mb-4">Write a review</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-brand-400 uppercase tracking-widest mb-2">Your rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
              placeholder="Share your experience with this product... (optional)"
              className="w-full border border-brand-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white"
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button
              onClick={submitReview}
              disabled={submitting || !rating}
              className="bg-brand-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-brand-400 text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl p-5 border border-brand-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-brand-900 text-sm">
                    {review.user?.first_name} {review.user?.last_name}
                  </p>
                  <p className="text-xs text-brand-400 mt-0.5">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.comment && (
                <p className="text-sm text-brand-500 mt-2 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ProductDetail Component ────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      const prod = res.data.product;
      setProduct(prod);
      if (prod.variants?.length > 0) setSelectedVariant(prod.variants[0]);
    } catch (error) {
      console.error('Error fetching product', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem(product, selectedVariant, quantity);
    toast.success(`Added ${quantity} × ${product.name} (${selectedVariant.size} / ${selectedVariant.color}) to cart`);
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  if (loading) return <div className="py-20 text-center text-brand-400 text-sm tracking-widest uppercase">Loading...</div>;
  if (!product) return <div className="py-20 text-center text-brand-400 text-sm">Product not found</div>;

  const allImages = product.images?.length ? product.images : ['https://via.placeholder.com/800x1000?text=No+Image'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-900 transition mb-8 group uppercase tracking-widest font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">

        {/* ── LEFT: Image Gallery ── */}
        <div className="lg:w-[45%] flex gap-3">
          {allImages.length > 1 && (
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[500px]">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    borderRadius: 10, width: 72, height: 90, flexShrink: 0, overflow: 'hidden',
                    border: activeImage === idx ? '2px solid #d1ccc6' : '2px solid transparent',
                    opacity: activeImage === idx ? 1 : 0.55,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.9; }}
                  onMouseLeave={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.55; }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="relative group flex-1">
            <div className="relative bg-brand-50 overflow-hidden" style={{ borderRadius: 16, aspectRatio: '3/4', maxHeight: 500 }}>
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="w-4 h-4 text-brand-900" />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4 text-brand-900" />
                  </button>
                </>
              )}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {allImages.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveImage(idx)}
                      className={`rounded-full transition-all duration-300 ${activeImage === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div className="lg:w-[55%]">
          <div className="sticky top-24 space-y-5">
            <div className="flex items-center gap-2 text-xs text-brand-400 uppercase tracking-widest font-semibold">
              <span>{product.brand?.name}</span>
              <span className="w-1 h-1 bg-brand-300 rounded-full" />
              <span>{product.category?.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-brand-900 leading-snug">{product.name}</h1>
            <p className="text-2xl font-semibold text-brand-900">${product.price}</p>
            <div className="h-px bg-brand-100" />
            <p className="text-brand-500 text-sm leading-relaxed">
              {product.description || 'A timeless piece crafted for style and comfort. Perfect for any occasion.'}
            </p>

            {product.variants?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-brand-800 uppercase tracking-widest">Size & Color</h3>
                  {selectedVariant?.stock > 0 && (
                    <span className="text-xs text-brand-400">{selectedVariant.stock} in stock</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 text-xs font-medium rounded-full border transition-all duration-200 ${
                        selectedVariant?.id === variant.id
                          ? 'bg-brand-900 text-white border-brand-900'
                          : 'bg-white text-brand-700 border-brand-200 hover:border-brand-500'
                      } ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {variant.size} / {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <div className="flex items-center border border-brand-200 rounded-full overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                  className="w-10 h-11 flex items-center justify-center text-brand-600 hover:text-brand-900 disabled:opacity-30 transition">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-brand-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                  disabled={!selectedVariant || quantity >= (selectedVariant?.stock || 99)}
                  className="w-10 h-11 flex items-center justify-center text-brand-600 hover:text-brand-900 disabled:opacity-30 transition">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 bg-brand-900 text-white text-sm font-medium rounded-full hover:bg-brand-800 transition disabled:bg-brand-300 disabled:cursor-not-allowed"
              >
                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            <div className="border-t border-brand-100 pt-5">
              <div className="flex items-center gap-6 text-xs text-brand-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" /><span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /><span>2-year warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <ReviewsSection productId={id} />

    </div>
  );
}