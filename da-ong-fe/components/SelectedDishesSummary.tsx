import React from 'react';
import { MENU_ITEMS } from '../data';
import { getMenuItem } from '../services/api';

interface Props {
  selectedDishes: { [id: string]: number };
  cartItems: { [id: string]: number };
  apiMenuItems: any[];
}

export const SelectedDishesSummary: React.FC<Props> = ({ selectedDishes, cartItems, apiMenuItems }) => {
  // Merge selectedDishes and cartItems for display
  const merged: { [id: string]: number } = { ...selectedDishes };
  Object.entries(cartItems).forEach(([id, qty]) => {
    const prev = typeof merged[id] === 'number' ? merged[id] : 0;
    merged[id] = Math.max(prev, typeof qty === 'number' ? qty : 0);
  });
  // Build dish info map for fast lookup
  const dishMap: { [id: string]: { name: string; price: number } } = {};
  if (apiMenuItems.length > 0) {
    apiMenuItems.forEach(item => {
      dishMap[String(item.id)] = { name: item.name, price: parseFloat(item.price) || 0 };
    });
  }
  MENU_ITEMS.forEach(item => {
    if (!dishMap[item.id]) dishMap[item.id] = { name: item.name, price: item.price };
  });

  // State to store fetched dish names
  const [fetchedNames, setFetchedNames] = React.useState<{ [id: string]: { name: string; price: number } }>({});

  React.useEffect(() => {
    const missingIds = Object.keys(merged).filter(id => !dishMap[id] && !fetchedNames[id]);
    if (missingIds.length > 0) {
      Promise.all(missingIds.map(id =>
        getMenuItem(Number(id)).then(
          item => ({ id, name: item.name, price: parseFloat(item.price) || 0 })
        ).catch(() => null)
      )).then(results => {
        const update: { [id: string]: { name: string; price: number } } = {};
        results.forEach(r => { if (r && r.id) update[r.id] = { name: r.name, price: r.price }; });
        if (Object.keys(update).length > 0) setFetchedNames(prev => ({ ...prev, ...update }));
      });
    }
    // eslint-disable-next-line
  }, [Object.keys(merged).join(), Object.keys(dishMap).join()]);

  if (Object.keys(merged).length === 0) return null;
  return (
    <div className="space-y-2 mb-4">
      <h4 className="font-bold text-gray-700">Món đã chọn:</h4>
      {Object.entries(merged).map(([id, qty]) => {
        const d = dishMap[id] || fetchedNames[id];
        return (
          <div key={id} className="flex justify-between text-sm">
            <span>{d && d.name ? d.name : `Món #${id}`} <span className="text-gray-500">x{qty}</span></span>
            <span>{d && d.price ? (d.price * (qty as number)).toLocaleString() + 'đ' : ''}</span>
          </div>
        );
      })}
    </div>
  );
};