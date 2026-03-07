import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, Plus, AlertCircle, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { showToast } from '../components/Toast';

const PAYMENT_METHODS_QUERY = gql`
  query GetPaymentMethods {
    paymentMethods {
      id
      type
      lastFour
    }
  }
`;

const ADD_PAYMENT_METHOD_MUTATION = gql`
  mutation AddPaymentMethod($type: String!, $lastFour: String!) {
    addPaymentMethod(type: $type, lastFour: $lastFour) {
      id
      type
      lastFour
    }
  }
`;

const PAYMENT_TYPES = ['CREDIT', 'DEBIT', 'PAYPAL'];

interface PaymentMethod {
  id: string;
  type: string;
  lastFour: string;
}

export default function Payments() {
  const [type, setType] = useState('CREDIT');
  const [lastFour, setLastFour] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, loading, error, refetch } = useQuery(PAYMENT_METHODS_QUERY);

  const [addPaymentMethod, { loading: adding }] = useMutation(ADD_PAYMENT_METHOD_MUTATION, {
    onCompleted: () => {
      showToast('Payment method added successfully!', 'success');
      setLastFour('');
      setType('CREDIT');
      setShowForm(false);
      refetch();
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    addPaymentMethod({ variables: { type, lastFour } });
  };

  if (loading) return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-stone-200 rounded-[2rem] animate-pulse"></div>)}
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 text-red-600 rounded-3xl flex items-center gap-3">
      <AlertCircle size={24} />
      {error.message}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">Payment Methods</h1>
          <p className="text-stone-500 font-medium">Manage your saved payment methods</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-100 transition-all"
        >
          <Plus size={18} />
          Add Method
        </button>
      </header>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm"
        >
          <h2 className="text-lg font-bold text-stone-900 mb-6">Add Payment Method</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Last 4 Digits</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={lastFour}
                    onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-all disabled:opacity-50"
              >
                <Plus size={16} />
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-2xl font-bold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {data?.paymentMethods.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-stone-100 shadow-sm text-center">
          <CreditCard size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-400 font-medium italic">No payment methods saved yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.paymentMethods.map((pm: PaymentMethod, i: number) => (
            <motion.div
              key={pm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-5"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <CreditCard size={22} />
              </div>
              <div>
                <p className="font-bold text-stone-900">{pm.type}</p>
                <p className="text-stone-500 text-sm">•••• •••• •••• {pm.lastFour}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
