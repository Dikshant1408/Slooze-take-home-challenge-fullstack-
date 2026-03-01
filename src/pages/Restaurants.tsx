import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Utensils, ChevronRight, Search, MapPin } from 'lucide-react';
import { useState } from 'react';

const RESTAURANTS_QUERY = gql`
  query GetRestaurants {
    restaurants {
      id
      name
      address
      phone
      hours
      menuItems {
        id
        name
      }
    }
  }
`;

export default function Restaurants() {
  const { data, loading, error } = useQuery(RESTAURANTS_QUERY);
  const [search, setSearch] = useState('');

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-stone-200 rounded-3xl animate-pulse"></div>)}
  </div>;

  if (error) return <div className="p-6 bg-red-50 text-red-600 rounded-3xl">{error.message}</div>;

  const filtered = data.restaurants.filter((r: any) => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">Browse Restaurants</h1>
          <p className="text-stone-500 font-medium">Find the best food in your area</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((restaurant: any) => (
          <Link
            key={restaurant.id}
            to={`/restaurants/${restaurant.id}`}
            className="group bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                <Utensils size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors mb-1">{restaurant.name}</h2>
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2 text-stone-400 text-xs font-medium">
                    <MapPin size={12} />
                    <span>{restaurant.address || 'Local Area'}</span>
                  </div>
                  {restaurant.hours && (
                    <div className="flex items-center gap-2 text-stone-400 text-[10px] font-medium">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      <span>{restaurant.hours}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{restaurant.menuItems.length} items available</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
              <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-stone-100">
          <Utensils size={48} className="text-stone-200 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No restaurants found matching your search</p>
        </div>
      )}
    </div>
  );
}
