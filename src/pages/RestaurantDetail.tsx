import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Minus, ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle, Phone, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../components/Toast';

const RESTAURANT_QUERY = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      address
      phone
      hours
      menuItems {
        id
        name
        price
      }
    }
  }
`;

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($restaurantId: ID!, $items: [OrderItemInput!]!) {
    createOrder(restaurantId: $restaurantId, items: $items) {
      id
      status
    }
  }
`;

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data, loading, error } = useQuery(RESTAURANT_QUERY, {
    variables: { id },
  });

  const [createOrder] = useMutation(CREATE_ORDER_MUTATION, {
    onCompleted: () => {
      showToast('Order placed successfully!', 'success');
      setSuccess(true);
      setTimeout(() => navigate('/orders'), 2000);
    },
    onError: (err) => {
      showToast(err.message, 'error');
      setIsOrdering(false);
    },
  });

  if (loading) return <div className="space-y-6">
    <div className="h-48 bg-stone-200 rounded-[2rem] animate-pulse"></div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-stone-200 rounded-2xl animate-pulse"></div>)}
    </div>
  </div>;

  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-3xl flex items-center gap-3">
    <AlertCircle size={24} />
    {error.message}
  </div>;

  const { restaurant } = data;

  const updateCart = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartItems = Object.entries(cart).map(([itemId, quantity]) => ({
    menuItemId: itemId,
    quantity,
  }));

  const total = cartItems.reduce((acc: number, item: { menuItemId: string, quantity: number }) => {
    const menuItem = restaurant.menuItems.find((m: any) => m.id === item.menuItemId);
    const price = Number(menuItem?.price || 0);
    return acc + (price * Number(item.quantity));
  }, 0);

  const handleOrder = () => {
    setIsOrdering(true);
    createOrder({
      variables: {
        restaurantId: restaurant.id,
        items: cartItems,
      },
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Order Placed!</h1>
        <p className="text-stone-500">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <button
        onClick={() => navigate('/restaurants')}
        className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Restaurants
      </button>

      <header className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-stone-900 mb-6 tracking-tight">{restaurant.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 text-stone-500">
              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Address</p>
                <p className="text-sm font-medium">{restaurant.address || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-stone-500">
              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-600">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone</p>
                <p className="text-sm font-medium">{restaurant.phone || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-stone-500">
              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Hours</p>
                <p className="text-sm font-medium">{restaurant.hours || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Menu Items</h2>
        {restaurant.menuItems.map((item: any) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-1">{item.name}</h3>
              <p className="text-emerald-600 font-bold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-100">
              <button
                onClick={() => updateCart(item.id, -1)}
                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-400 hover:text-red-500 hover:shadow-sm transition-all"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-bold text-stone-900">{cart[item.id] || 0}</span>
              <button
                onClick={() => updateCart(item.id, 1)}
                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:shadow-sm transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50"
          >
            <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-lg">
              <div>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">{cartItems.length} items selected</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
              <button
                onClick={handleOrder}
                disabled={isOrdering}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all disabled:opacity-50"
              >
                {isOrdering ? 'Processing...' : (
                  <>
                    <ShoppingCart size={20} />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
