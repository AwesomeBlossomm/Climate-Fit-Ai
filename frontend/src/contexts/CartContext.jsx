import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("climateFitCart");
    const savedDiscount = localStorage.getItem("climateFitDiscount");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }

    if (savedDiscount) {
      try {
        setAppliedDiscount(JSON.parse(savedDiscount));
      } catch (error) {
        console.error("Error loading discount from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("climateFitCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Save discount to localStorage whenever it changes
  useEffect(() => {
    if (appliedDiscount) {
      localStorage.setItem(
        "climateFitDiscount",
        JSON.stringify(appliedDiscount)
      );
    } else {
      localStorage.removeItem("climateFitDiscount");
    }
  }, [appliedDiscount]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedDiscount(null);
  };

  const applyDiscount = (discount) => {
    setAppliedDiscount(discount);
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    return getCartTotal() * appliedDiscount.discount;
  };

  const getFinalTotal = () => {
    return getCartTotal() - getDiscountAmount();
  };

  const value = {
    cartItems,
    appliedDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
    getCartTotal,
    getCartItemsCount,
    getDiscountAmount,
    getFinalTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
