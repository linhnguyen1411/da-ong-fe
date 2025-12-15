import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BookingContextType {
  cartItems: { [id: string]: number };
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<{ [id: string]: number }>({});

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

  return (
    <BookingContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingCart = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookingCart must be used within a BookingProvider");
  return context;
};