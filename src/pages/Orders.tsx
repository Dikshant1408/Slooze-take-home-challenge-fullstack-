import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../App';
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { showToast } from '../components/Toast';

const ORDERS_QUERY = gql`
  query GetOrders($status: String) {
    orders(status: $status) {
      id
      status
      totalAmount
      createdAt
      items {
        id
        quantity
        menuItem {
          name
          price
        }
      }
    }
  }
`;

const CHECKOUT_MUTATION = gql`
  mutation CheckoutOrder($orderId: ID!) {
    checkoutOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

const CANCEL_MUTATION = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function Orders() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, refetch } = useQuery(ORDERS_QUERY, {
    variables: { status: statusFilter || undefined },
  });

  const [checkout] = useMutation(CHECKOUT_MUTATION, {
    onCompleted: () => {
      showToast('Order checked out successfully!', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message, 'error'),
  });
  const [cancel] = useMutation(CANCEL_MUTATION, {
    onCompleted: () => {
      showToast('Order cancelled.', 'info');
      refetch();
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  if (loading) return <div className="space-y-6">
    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-stone-200 rounded-[2rem] animate-pulse"></div>)}
  </div>;

  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-3xl flex items-center gap-3">
    <AlertCircle size={24} />
    {error.message}
  </div>;

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">Order History</h1>
          <p className="text-stone-500 font-medium">
            {canManage ? `Managing orders for ${user.country.name}` : 'View and track your recent orders'}
          </p>
        </div>
        {/* Order history filtering */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-sm">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === opt.value
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {data.orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-stone-100">
            <ShoppingBag size={48} className="text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">No orders found</p>
          </div>
        ) : (
          data.orders.map((order: any, i: number) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden"
            >
              <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                    order.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                    order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <ClipboardList size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-stone-900">Order #{order.id.slice(0, 8)}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 font-medium flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(parseInt(order.createdAt)).toLocaleString()}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.items.map((item: any) => (
                        <span key={item.id} className="text-[10px] font-bold bg-stone-50 text-stone-500 px-2 py-1 rounded-lg border border-stone-100">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-stone-900">${order.totalAmount.toFixed(2)}</p>
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cancel({ variables: { orderId: order.id } })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={18} />
                        Cancel
                      </button>
                      {canManage && (
                        <button
                          onClick={() => checkout({ variables: { orderId: order.id } })}
                          className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle size={18} />
                          Checkout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
