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
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

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