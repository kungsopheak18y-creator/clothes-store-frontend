import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch first 4 products as featured (or you can add a `featured` flag in backend later)
    api.get('/api/products?limit=4')
      .then(res => setFeatured(res.data))
      .catch(err => console.error('Failed to load featured products', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading featured products...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Featured Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <img
              src={product.images?.[0] || 'https://via.placeholder.com/300'}
              alt={product.name}
              className="w-full h-56 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-500 text-sm">{product.category?.name}</p>
              <p className="text-xl font-bold mt-2">${product.price}</p>
              <Link to={`/product/${product.id}`} className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}