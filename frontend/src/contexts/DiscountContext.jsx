import React, { createContext, useContext, useState, useCallback } from "react";
import { discountAPI } from "../services/discountApi";

const DiscountContext = createContext();

export const useDiscount = () => {
  const context = useContext(DiscountContext);
  if (!context) {
    throw new Error("useDiscount must be used within a DiscountProvider");
  }
  return context;
};

export const DiscountProvider = ({ children }) => {
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyDiscount = useCallback(async (code, totalAmount) => {
    try {
      setIsApplying(true);

      // Try applying as regular discount first
      let discountResult;
      try {
        discountResult = await discountAPI.applyDiscount(code, totalAmount);
      } catch (error) {
        // If regular discount fails, try assigned discount
        discountResult = await discountAPI.applyAssignedDiscount(
          code,
          totalAmount
        );
      }

      setAppliedDiscount({
        code: discountResult.discount_code,
        percentage: discountResult.discount_percentage,
        discountAmount: discountResult.discount_amount,
        originalAmount: discountResult.original_amount,
        finalAmount: discountResult.final_amount,
        description: discountResult.description,
      });

      return discountResult;
    } catch (error) {
      throw error;
    } finally {
      setIsApplying(false);
    }
  }, []);

  const removeDiscount = useCallback(() => {
    setAppliedDiscount(null);
  }, []);

  const calculateDiscountedTotal = useCallback(
    (originalTotal) => {
      if (!appliedDiscount) return originalTotal;
      return appliedDiscount.finalAmount;
    },
    [appliedDiscount]
  );

  const value = {
    appliedDiscount,
    isApplying,
    applyDiscount,
    removeDiscount,
    calculateDiscountedTotal,
  };

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  );
};
