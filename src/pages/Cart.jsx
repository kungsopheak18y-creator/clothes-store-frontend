import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const total = getTotal();

  const handleRemove = (variantId, productName) => {
    removeItem(variantId);
    toast.success(`Removed ${productName} from cart`);
  };

  const handleUpdateQuantity = (variantId, newQuantity, productName) => {
    updateQuantity(variantId, newQuantity);
    if (newQuantity > 0) toast.info(`Updated ${productName} quantity to ${newQuantity}`);
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any items to your cart yet.</p>
        <Link to="/shop" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-6">Product</div><div className="col-span-2 text-center">Price</div><div className="col-span-2 text-center">Quantity</div><div className="col-span-2 text-right">Total</div>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.variantId} className="py-6 transition hover:bg-gray-50/50 -mx-4 px-4 rounded-xl">
                <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 gap-4">
                  <div className="col-span-6 flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                    <div className="flex flex-col justify-center"><h3 className="font-medium text-gray-900">{item.name}</h3><p className="text-sm text-gray-500 mt-0.5">{item.size} / {item.color}</p><p className="text-sm text-gray-400 md:hidden mt-1">${item.price.toFixed(2)} each</p></div>
                  </div>
                  <div className="col-span-2 hidden md:flex items-center justify-center"><span className="text-gray-700">${item.price.toFixed(2)}</span></div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-gray-200 rounded-full bg-white shadow-sm">
                      <button onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1, item.name)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition disabled:opacity-40"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-10 text-center text-sm font-medium text-gray-800">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1, item.name)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between md:justify-end gap-4">
                    <span className="font-semibold text-gray-900 md:hidden">Total:</span>
                    <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => handleRemove(item.variantId, item.name)} className="text-gray-400 hover:text-red-500 transition p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-24 shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-900 mb-5">Order Summary</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
              <div className="border-t border-gray-200 pt-3 mt-3"><div className="flex justify-between text-lg font-semibold text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div><p className="text-xs text-gray-500 mt-2">Taxes and discounts calculated at checkout.</p></div>
            </div>
            <Link to="/checkout" className="block w-full bg-gray-900 text-white text-center py-3 rounded-full font-medium hover:bg-gray-800 transition mt-6">Proceed to Checkout</Link>
            <p className="text-center text-xs text-gray-500 mt-4"><Link to="/shop" className="underline hover:text-gray-800">Continue Shopping</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}