const API_BASE_URL = "http://localhost:8000/discounts";

export const discountAPI = {
  // Get all available discounts
  getDiscounts: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/discounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch discounts");
    }

    return response.json();
  },

  // Get user's assigned discounts
  getMyDiscounts: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/my-discounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user discounts");
    }

    return response.json();
  },

  // Apply discount code (validate and calculate discount)
  applyDiscount: async (code, totalAmount) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/apply-discount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        total_amount: totalAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to apply discount");
    }

    return response.json();
  },

  // Apply assigned discount
  applyAssignedDiscount: async (code, totalAmount) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/apply-assigned-discount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        total_amount: totalAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to apply assigned discount");
    }

    return response.json();
  },

  // Get available vouchers for collection
  getAvailableVouchers: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/available-vouchers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available vouchers");
    }

    return response.json();
  },

  // Collect a specific voucher
  collectVoucher: async (data) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/collect-voucher`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to collect voucher");
    }

    return response.json();
  },

  // Collect all available vouchers
  collectAllVouchers: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/collect-all-vouchers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to collect all vouchers");
    }

    return response.json();
  },

  // Collect all vouchers of a specific type
  collectAllVouchersOfType: async (voucherType) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/collect-all-vouchers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voucher_type: voucherType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.detail || `Failed to collect ${voucherType} vouchers`
      );
    }

    return response.json();
  },
};
