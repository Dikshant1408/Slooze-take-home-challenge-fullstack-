import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../App';
import { ShoppingBag, Utensils, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const DASHBOARD_QUERY = gql`
  query DashboardData {
    restaurants {
      id
      name
    }
    orders {
      id
      status
      totalAmount
      createdAt
    }
  }
`;

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useQuery(DASHBOARD_QUERY);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-stone-200 rounded-3xl"></div>
    <div className="grid grid-cols-3 gap-6">
      <div className="h-40 bg-stone-200 rounded-3xl"></div>
      <div className="h-40 bg-stone-200 rounded-3xl"></div>
      <div className="h-40 bg-stone-200 rounded-3xl"></div>
    </div>
  </div>;

  if (error) return <div className="bg-red-50 p-6 rounded-3xl text-red-600 flex items-center gap-3">
    <AlertCircle size={24} />
    {error.message}
  </div>;

  const stats = [
    { name: 'Total Orders', value: data.orders.length, icon: ShoppingBag, color: 'bg-blue-500' },
    { name: 'Restaurants', value: data.restaurants.length, icon: Utensils, color: 'bg-emerald-500' },
    { name: 'Total Spent', value: `$${data.orders.reduce((acc: number, o: any) => acc + o.totalAmount, 0).toFixed(2)}`, icon: TrendingUp, color: 'bg-amber-500' },
  ];

  const recentOrders = data.orders.slice(0, 5);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">
            Hello, {user.email.split('@')[0]}
          </h1>
          <p className="text-stone-500 font-medium">
            Welcome to your <span className="text-emerald-600 font-bold">{user.country.name}</span> dashboard.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Live System</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-stone-100 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-stone-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.name}</p>
            <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-stone-900">Recent Orders</h2>
            <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-stone-400 text-center py-10 italic">No orders yet</p>
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-500">{new Date(parseInt(order.createdAt)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-900">${order.totalAmount.toFixed(2)}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                      order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-stone-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Role Permissions</h2>
            <p className="text-stone-400 text-sm mb-8">Your current role is <span className="text-emerald-400 font-bold">{user.role}</span>. Here is what you can do:</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-emerald-400" />
                <span>View and browse restaurants in {user.country.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-emerald-400" />
                <span>Create new orders and add menu items</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {user.role !== 'MEMBER' ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={18} className="text-stone-600" />
                )}
                <span className={user.role === 'MEMBER' ? 'text-stone-600 line-through' : ''}>Checkout and pay for orders</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {user.role === 'ADMIN' ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={18} className="text-stone-600" />
                )}
                <span className={user.role !== 'ADMIN' ? 'text-stone-600 line-through' : ''}>Manage payment methods</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl"></div>
        </section>
      </div>
    </div>
  );
}
