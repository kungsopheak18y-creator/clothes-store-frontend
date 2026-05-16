import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import api from '../lib/api'
import useWishlistStore from '../store/wishlistStore'
import toast from 'react-hot-toast'

export default function Wishlist() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [removing, setRemoving] = useState(null) // ✅ track which item is being removed
    const { remove } = useWishlistStore()

    useEffect(() => { fetchWishlist() }, [])

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/wishlist')
            setItems(res.data.wishlist || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (productId) => {
        setRemoving(productId) // ✅ show loading on that item
        try {
            const success = await remove(productId)
            if (success) {
                // ✅ Remove from UI only after confirmed removed from backend
                setItems(prev => prev.filter(item => item.product_id !== productId))
                toast.success('Removed from wishlist')
            } else {
                toast.error('Failed to remove. Please try again.')
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to remove from wishlist')
        } finally {
            setRemoving(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-10">
                <div className="max-w-5xl mx-auto px-4">
                    <h1 className="text-3xl font-light text-gray-900 mb-8">My Wishlist</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl animate-pulse">
                                <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Heart className="w-10 h-10 text-red-300" />
                </div>
                <h2 className="text-2xl font-light text-gray-800 mb-3">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon.</p>
                <Link
                    to="/shop"
                    className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition"
                >
                    Browse Products
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-5xl mx-auto px-4">

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-light text-gray-900">
                        My Wishlist{' '}
                        <span className="text-gray-400 text-xl">({items.length})</span>
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map(item => {
                        const product = item.product
                        let imageUrl = 'https://via.placeholder.com/600x750?text=No+Image';
                        try {
                            const imgs = typeof product?.images === 'string'
                                ? JSON.parse(product.images)
                                : product?.images;
                            if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
                        } catch { }

                        const isRemoving = removing === item.product_id

                        return (
                            <div
                                key={item.id}
                                className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition ${isRemoving ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {/* Remove button */}
                                <button
                                    onClick={() => handleRemove(item.product_id)}
                                    disabled={isRemoving}
                                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition disabled:opacity-50"
                                >
                                    {isRemoving ? (
                                        // ✅ Loading spinner while removing
                                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    )}
                                </button>

                                {/* Image */}
                                <Link to={`/product/${product?.id}`}>
                                    <img
                                        src={imageUrl}
                                        alt={product?.name}
                                        className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition duration-500"
                                    />
                                </Link>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                                        {product?.brand?.name}
                                    </p>
                                    <Link to={`/product/${product?.id}`}>
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-gray-600 transition">
                                            {product?.name}
                                        </h3>
                                    </Link>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        ${parseFloat(product?.price).toFixed(2)}
                                    </p>

                                    {/* View Product button */}
                                    <Link
                                        to={`/product/${product?.id}`}
                                        className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-xs font-medium py-2 rounded-full hover:bg-gray-700 transition"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        View Product
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>
    )
}