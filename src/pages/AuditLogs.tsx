import { useQuery, gql } from '@apollo/client';
import { Shield, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const AUDIT_LOGS_QUERY = gql`
  query GetAuditLogs {
    auditLogs {
      id
      action
      userId
      countryId
      resourceId
      resourceType
      createdAt
    }
  }
`;

const ACTION_COLORS: Record<string, string> = {
  CREATE_ORDER: 'bg-blue-100 text-blue-700',
  CHECKOUT_ORDER: 'bg-emerald-100 text-emerald-700',
  CANCEL_ORDER: 'bg-red-100 text-red-700',
};

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  countryId: string;
  resourceId: string;
  resourceType: string;
  createdAt: string;
}

export default function AuditLogs() {
  const { data, loading, error } = useQuery(AUDIT_LOGS_QUERY);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-stone-200 rounded-[2rem] animate-pulse"></div>)}
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
      <header>
        <h1 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">Audit Logs</h1>
        <p className="text-stone-500 font-medium">Recent activity in your country (last 100 entries)</p>
      </header>

      {data?.auditLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-stone-100 shadow-sm text-center">
          <Shield size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-400 font-medium italic">No audit logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.auditLogs.map((log: AuditLog, i: number) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-lg ${ACTION_COLORS[log.action] ?? 'bg-stone-100 text-stone-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">{log.resourceType} #{log.resourceId.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-stone-500">User: <span className="font-mono">{log.userId.slice(0, 8)}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400 shrink-0">
                <Clock size={13} />
                {new Date(parseInt(log.createdAt)).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
