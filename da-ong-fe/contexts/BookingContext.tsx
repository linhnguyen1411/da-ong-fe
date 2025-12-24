import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BookingContextType {
  cartItems: { [id: string]: number };
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<{ [id: string]: number }>(() => {
    try {
      const stored = localStorage.getItem('cartItems');
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      // Check if cartItems has timestamp and if it's expired (15 minutes)
      if (parsed._ts && Date.now() - parsed._ts > 15 * 60 * 1000) {
        localStorage.removeItem('cartItems');
        return {};
      }
      
      // Return cart items without timestamp
      const { _ts, ...items } = parsed;
      return items;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    // Save cartItems with timestamp
    if (Object.keys(cartItems).length > 0) {
      localStorage.setItem('cartItems', JSON.stringify({ ...cartItems, _ts: Date.now() }));
    } else {
      localStorage.removeItem('cartItems');
    }
  }, [cartItems]);

  // Auto-clear cart after 15 minutes
  useEffect(() => {
    const checkExpiry = () => {
      try {
        const stored = localStorage.getItem('cartItems');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed._ts && Date.now() - parsed._ts > 15 * 60 * 1000) {
            setCartItems({});
            localStorage.removeItem('cartItems');
          }
        }
      } catch {
        // Ignore errors
      }
    };

    // Check immediately
    checkExpiry();
    
    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const addToCart = (id: string) => {
    setCartItems(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
       const newCart = { ...prev };
       delete newCart[id];
       return newCart;
    });
  };

  const clearCart = () => setCartItems({});

  const updateCartItemQuantity = (id: string, quantity: number) => {
    setCartItems(prev => {
      if (quantity <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: quantity };
    });
  };

  return (
    <BookingContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, updateCartItemQuantity }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingCart = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookingCart must be used within a BookingProvider");
  return context;
};