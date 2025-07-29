import React, { createContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  Box,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Add, LocationOn, ShoppingCart, LocalOffer, Storefront } from "@mui/icons-material";
import SensorOccupiedIcon from "@mui/icons-material/SensorOccupied";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:8000/api/v1";

const fetchRegions = async () => {
  const res = await fetch("https://psgc.gitlab.io/api/regions/");
  const data = await res.json();
  return data;
};

const fetchProvinces = async (regionCode) => {
  const res = await fetch(
    `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`
  );
  const provinces = await res.json();

  if (provinces.length === 0 && regionCode === "130000000") {
    const cityRes = await fetch(
      `https://psgc.gitlab.io/api/regions/${regionCode}/cities-municipalities/`
    );
    const cities = await cityRes.json();
    return { isNCR: true, cities };
  }

  return { isNCR: false, provinces };
};

const fetchCities = async (provinceCode) => {
  const res = await fetch(
    `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
  );
  const data = await res.json();
  return data;
};

const fetchBarangays = async (cityCode) => {
  const res = await fetch(
    `https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`
  );
  const data = await res.json();
  return data;
};

const AddressManagement = ({ onAddressSelect }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false); // New state for toggling view
  const [showAddressModal, setShowAddressModal] = useState(false); // New state for address modal
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [formData, setFormData] = useState({
    recipient_name: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    postal_code: "",
    country: "Philippines",
    is_default: false,
    contact_number: "",
    address_type: "Home",
  });

  const [options, setOptions] = useState({
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  });

  const [loadingStates, setLoadingStates] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });

  const [isNCR, setIsNCR] = useState(false);

  // Quick Actions Configuration
  const quickActions = [
    {
      title: "Browse Products",
      description: "Explore our eco-friendly product collection",
      icon: <Storefront sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/products"),
      gradient: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
    },
    {
      title: "View Discounts",
      description: "Check out available offers and discounts",
      icon: <LocalOffer sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/discounts"),
      gradient: "linear-gradient(135deg, #7a956a 0%, #6b8459 100%)",
    },
    {
      title: "Shopping Cart",
      description: "Review items in your cart",
      icon: <ShoppingCart sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/cart"),
      gradient: "linear-gradient(135deg, #6b8459 0%, #5c7349 100%)",
    },
    {
      title: "3D Body Scan",
      description: "Explore the Modern way of Shopping",
      icon: <SensorOccupiedIcon sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/bodyscan"),
      gradient: "linear-gradient(135deg, #5c7349 0%, #4a5d3a 100%)",
    },
  ];

  // Enhanced authentication check
  const checkAuth = () => {
    if (!user?.username || !token) {
      showNotification("Please log in to manage addresses", "error");
      return false;
    }
    return true;
  };

  // Fetch saved addresses
  const fetchSavedAddresses = async () => {
    if (!checkAuth()) return;

    try {
      setLoading(true);
      console.log("Fetching addresses for user:", user.username); // Debug log
      const response = await fetch(
        `${API_BASE_URL}/users/${user.username}/addresses`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status); // Debug log

      if (response.ok) {
        const addresses = await response.json();
        console.log("Addresses received:", addresses); // Debug log
        setSavedAddresses(addresses);

        // Auto-select default address if available
        const defaultAddress = addresses.find((addr) => addr.is_default);
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress._id);
          if (onAddressSelect) {
            onAddressSelect(defaultAddress);
          }
        }
      } else if (response.status === 401) {
        showNotification(
          "Authentication expired. Please log in again.",
          "error"
        );
      } else if (response.status === 404) {
        // User exists but no addresses found - this is normal
        setSavedAddresses([]);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData); // Debug log
        showNotification(
          errorData.detail || "Failed to fetch addresses",
          "error"
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      showNotification("Network error. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000
    );
  };

  // Load regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingStates((prev) => ({ ...prev, regions: true }));
      try {
        const regions = await fetchRegions();
        setOptions((prev) => ({ ...prev, regions }));
      } catch (error) {
        console.error("Error loading regions:", error);
        showNotification("Failed to load regions", "error");
      } finally {
        setLoadingStates((prev) => ({ ...prev, regions: false }));
      }
    };

    loadRegions();

    // Only fetch addresses if user and token are available
    if (user?.username && token) {
      fetchSavedAddresses();
    }
  }, [user?.username, token]);

  // Handle region change
  useEffect(() => {
    if (!formData.region) return;

    const loadProvincesOrCities = async () => {
      setLoadingStates((prev) => ({ ...prev, provinces: true, cities: true }));

      const result = await fetchProvinces(formData.region);

      if (result.isNCR) {
        setIsNCR(true);
        setOptions((prev) => ({
          ...prev,
          provinces: [],
          cities: result.cities,
          barangays: [],
        }));
        setFormData((f) => ({
          ...f,
          province: "",
          city: "",
          barangay: "",
        }));
      } else {
        setIsNCR(false);
        setOptions((prev) => ({
          ...prev,
          provinces: result.provinces,
          cities: [],
          barangays: [],
        }));
        setFormData((f) => ({
          ...f,
          province: "",
          city: "",
          barangay: "",
        }));
      }

      setLoadingStates((prev) => ({
        ...prev,
        provinces: false,
        cities: false,
      }));
    };

    loadProvincesOrCities();
  }, [formData.region]);

  // Handle province change
  useEffect(() => {
    if (!formData.province || isNCR) return;

    const loadCities = async () => {
      setLoadingStates((prev) => ({ ...prev, cities: true }));
      const cities = await fetchCities(formData.province);
      setOptions((prev) => ({ ...prev, cities }));
      setFormData((f) => ({ ...f, city: "", barangay: "" }));
      setLoadingStates((prev) => ({ ...prev, cities: false }));
    };

    loadCities();
  }, [formData.province, isNCR]);

  // Handle city change
  useEffect(() => {
    if (!formData.city) return;
    const loadBarangays = async () => {
      setLoadingStates((prev) => ({ ...prev, barangays: true }));
      const barangays = await fetchBarangays(formData.city);
      setOptions((prev) => ({ ...prev, barangays }));
      setFormData((f) => ({ ...f, barangay: "" }));
      setLoadingStates((prev) => ({ ...prev, barangays: false }));
    };
    loadBarangays();
  }, [formData.city]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radiobox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      recipient_name: "",
      street: "",
      barangay: "",
      city: "",
      province: "",
      region: "",
      postal_code: "",
      country: "Philippines",
      is_default: false,
      contact_number: "",
      address_type: "Home",
    });
    setIsNCR(false);
    setOptions((prev) => ({
      ...prev,
      provinces: [],
      cities: [],
      barangays: [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkAuth()) return;

    // Validate required fields
    if (
      !formData.recipient_name ||
      !formData.street ||
      !formData.region ||
      !formData.city ||
      !formData.barangay ||
      !formData.postal_code ||
      !formData.contact_number
    ) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);

    try {
      const url = editingAddress
        ? `${API_BASE_URL}/users/${user.username}/addresses/${editingAddress._id}`
        : `${API_BASE_URL}/users/${user.username}/addresses`;

      const method = editingAddress ? "PUT" : "POST";

      // Prepare form data with proper structure
      const addressData = {
        ...formData,
        region: getRegionName(formData.region),
        province: isNCR ? "" : getProvinceName(formData.province),
        city: getCityName(formData.city),
        barangay: getBarangayName(formData.barangay),
      };

      console.log("Submitting address data:", addressData); // Debug log

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(
          editingAddress
            ? "Address updated successfully!"
            : "Address added successfully!"
        );

        await fetchSavedAddresses(); // Refresh the addresses list
        setShowAddForm(false);
        setEditingAddress(null);
        resetForm();
      } else if (response.status === 401) {
        showNotification(
          "Authentication expired. Please log in again.",
          "error"
        );
      } else {
        const errorData = await response.json();
        console.error("Submit error:", errorData);
        throw new Error(errorData.detail || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      showNotification(error.message || "Failed to save address", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);

    // Find the codes for the address data
    const regionCode =
      options.regions.find((r) => r.name === address.region)?.code ||
      address.region;

    setFormData({
      recipient_name: address.recipient_name,
      street: address.street,
      barangay: address.barangay,
      city: address.city,
      province: address.province,
      region: regionCode, // Use the found code or fallback to stored value
      postal_code: address.postal_code,
      country: address.country || "Philippines",
      is_default: address.is_default,
      contact_number: address.contact_number,
      address_type: address.address_type || "Home",
    });

    // Load provinces/cities for the selected region
    if (regionCode) {
      loadProvincesForEdit(regionCode, address);
    }

    setShowAddForm(true);
  };

  // Helper function to load provinces when editing
  const loadProvincesForEdit = async (regionCode, address) => {
    try {
      setLoadingStates((prev) => ({ ...prev, provinces: true, cities: true }));

      const result = await fetchProvinces(regionCode);

      if (result.isNCR) {
        setIsNCR(true);
        setOptions((prev) => ({
          ...prev,
          provinces: [],
          cities: result.cities,
        }));

        // Find city code for NCR
        const cityCode =
          result.cities.find((c) => c.name === address.city)?.code ||
          address.city;
        setFormData((prev) => ({ ...prev, city: cityCode, province: "" }));

        // Load barangays for the city
        if (cityCode) {
          loadBarangaysForEdit(cityCode, address.barangay);
        }
      } else {
        setIsNCR(false);
        setOptions((prev) => ({
          ...prev,
          provinces: result.provinces,
          cities: [],
        }));

        // Find province code
        const provinceCode =
          result.provinces.find((p) => p.name === address.province)?.code ||
          address.province;
        setFormData((prev) => ({ ...prev, province: provinceCode }));

        // Load cities for the province
        if (provinceCode) {
          loadCitiesForEdit(provinceCode, address);
        }
      }
    } catch (error) {
      console.error("Error loading provinces for edit:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, provinces: false }));
    }
  };

  // Helper function to load cities when editing
  const loadCitiesForEdit = async (provinceCode, address) => {
    try {
      setLoadingStates((prev) => ({ ...prev, cities: true }));
      const cities = await fetchCities(provinceCode);
      setOptions((prev) => ({ ...prev, cities }));

      // Find city code
      const cityCode =
        cities.find((c) => c.name === address.city)?.code || address.city;
      setFormData((prev) => ({ ...prev, city: cityCode }));

      // Load barangays for the city
      if (cityCode) {
        loadBarangaysForEdit(cityCode, address.barangay);
      }
    } catch (error) {
      console.error("Error loading cities for edit:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, cities: false }));
    }
  };

  // Helper function to load barangays when editing
  const loadBarangaysForEdit = async (cityCode, barangayName) => {
    try {
      setLoadingStates((prev) => ({ ...prev, barangays: true }));
      const barangays = await fetchBarangays(cityCode);
      setOptions((prev) => ({ ...prev, barangays }));

      // Set the barangay name (not code)
      setFormData((prev) => ({ ...prev, barangay: barangayName }));
    } catch (error) {
      console.error("Error loading barangays for edit:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, barangays: false }));
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    if (!checkAuth()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${user.username}/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showNotification("Address deleted successfully!");
        await fetchSavedAddresses(); // Refresh the addresses list
        if (selectedAddressId === addressId) {
          setSelectedAddressId("");
          if (onAddressSelect) {
            onAddressSelect(null);
          }
        }
      } else if (response.status === 401) {
        showNotification(
          "Authentication expired. Please log in again.",
          "error"
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showNotification(error.message || "Failed to delete address", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    if (!checkAuth()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${user.username}/addresses/${addressId}/set-default`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showNotification("Default address updated!");
        await fetchSavedAddresses(); // Refresh the addresses list
      } else if (response.status === 401) {
        showNotification(
          "Authentication expired. Please log in again.",
          "error"
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      showNotification(
        error.message || "Failed to set default address",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to get names from codes
  const getRegionName = (code) => {
    const region = options.regions.find((r) => r.code === code);
    return region ? region.name : code;
  };

  const getProvinceName = (code) => {
    const province = options.provinces.find((p) => p.code === code);
    return province ? province.name : code;
  };

  const getCityName = (code) => {
    const city = options.cities.find((c) => c.code === code);
    return city ? city.name : code;
  };

  const getBarangayName = (name) => {
    return name; // Barangay is stored as name, not code
  };

  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.barangay.match(/^\d+$/)
        ? `Barangay ${address.barangay}`
        : address.barangay,
      address.city,
      address.province,
      address.region,
    ].filter(Boolean);

    return parts.join(", ");
  };

  // Enhanced address selection handler
  const handleAddressSelection = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(
      (addr) => addr._id === addressId
    );

    console.log("Found address object:", selectedAddress);

    if (selectedAddress && onAddressSelect) {
      // Ensure all required fields are available and clean
      const addressForWeather = {
        _id: selectedAddress._id,
        street: selectedAddress.street?.trim() || "",
        barangay: selectedAddress.barangay?.trim() || "",
        city: selectedAddress.city?.trim() || "",
        province: selectedAddress.province?.trim() || "",
        region: selectedAddress.region?.trim() || "",
        postal_code: selectedAddress.postal_code?.trim() || "",
        country: selectedAddress.country || "Philippines",
        recipient_name: selectedAddress.recipient_name?.trim() || "",
        contact_number: selectedAddress.contact_number?.trim() || "",
        address_type: selectedAddress.address_type || "Home",
        is_default: selectedAddress.is_default || false,
        // Add timestamp to ensure change detection
        _selected_at: Date.now(),
      };

      console.log(
        "Clean address being passed to weather component:",
        addressForWeather
      );
      console.log("Key weather lookup fields:", {
        city: addressForWeather.city,
        postal_code: addressForWeather.postal_code,
        region: addressForWeather.region,
        _id: addressForWeather._id,
      });

      // Force the parent component to re-render by passing new object
      onAddressSelect(addressForWeather);
    } else if (!selectedAddress && onAddressSelect) {
      // Clear selection
      console.log("Clearing address selection");
      onAddressSelect(null);
    }
  };

  // Add authentication check at the beginning of the component
  if (!user || !token) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          Please log in to manage your addresses.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: "flex",
      gap: 3,
      width: "100%",
      p: 2,
      mt: 2,
      backgroundColor: "transparent"
    }}>
    <Box sx={{ 
      display: "flex",
      gap: 3,
      width: "100%",
      p: 2,
      mt: 2,
      backgroundColor: "transparent"
    }}>
      {notification.show && (
        <Alert
          severity={notification.type}
          sx={{ 
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(74, 93, 58, 0.1)",
          }}
          onClose={() =>
            setNotification({ show: false, message: "", type: "success" })
          }
        >
          {notification.message}
        </Alert>
      )}

      {/* Left Side - Address Management (1/4 of screen) */}
      <Box sx={{ 
        width: "25%", 
        minWidth: "300px",
        flexShrink: 0 
      }}>
        {/* Compact Address Management Section */}
        <Card sx={{ 
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 4px 15px rgba(74, 93, 58, 0.1)",
          border: "1px solid rgba(74, 93, 58, 0.1)"
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: "#4a5d3a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <LocationOn sx={{ color: "#4a5d3a" }} />
                Delivery Address
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  resetForm();
                  setEditingAddress(null);
                  setShowAddForm(true);
                }}
                sx={{
                  color: "#4a5d3a",
                  borderColor: "#4a5d3a",
                  borderRadius: "20px",
                  px: 2,
                  py: 0.5,
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "rgba(74, 93, 58, 0.05)",
                    borderColor: "#3a4d2a"
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Add New
              </Button>
            </Box>

            {loading && savedAddresses.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} sx={{ color: "#4a5d3a" }} />
              </Box>
            ) : savedAddresses.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" sx={{ py: 2 }}>
                No saved addresses. Add your first address to get started.
              </Typography>
            ) : (
              <RadioGroup
                value={selectedAddressId}
                onChange={(e) => handleAddressSelection(e.target.value)}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* Show first 2 addresses, but ensure selected address is visible */}
                  {(() => {
                    const firstTwo = savedAddresses.slice(0, 2);
                    const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);
                    
                    let addressesToShow;
                    if (selectedAddress && !firstTwo.some(addr => addr._id === selectedAddressId)) {
                      // Replace the second address with the selected one if selected is not in first 2
                      addressesToShow = [firstTwo[0], selectedAddress].filter(Boolean);
                    } else {
                      addressesToShow = firstTwo;
                    }
                    
                    return addressesToShow.map((address) => (
                    <Card
                      key={address._id}
                      variant="outlined"
                      sx={{
                        border:
                          selectedAddressId === address._id
                            ? "1.5px solid #4a5d3a"
                            : "1px solid #e0e0e0",
                        borderRadius: "8px",
                        transition: "all 0.2s ease",
                        background: selectedAddressId === address._id ? "rgba(74, 93, 58, 0.03)" : "#ffffff",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(74, 93, 58, 0.1)",
                          borderColor: "#4a5d3a"
                        },
                      }}
                    >
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <Radio
                            value={address._id}
                            size="small"
                            sx={{ 
                              mt: -0.5,
                              color: "#4a5d3a",
                              "&.Mui-checked": { color: "#4a5d3a" }
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight="600">
                                {address.recipient_name}
                              </Typography>
                              {address.is_default && (
                                <Chip
                                  label="Default"
                                  size="small"
                                  sx={{ 
                                    height: 20,
                                    backgroundColor: "#4a5d3a",
                                    color: "#ffffff"
                                  }}
                                />
                              )}
                              <Chip
                                label={address.address_type || "Home"}
                                variant="outlined"
                                size="small"
                                sx={{
                                  height: 20,
                                  borderColor: "#4a5d3a",
                                  color: "#4a5d3a"
                                }}
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 0.5
                              }}
                            >
                              {formatAddress(address)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              📞 {address.contact_number} • 📮 {address.postal_code}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(address)}
                              sx={{
                                color: "#4a5d3a",
                                p: 0.5,
                                "&:hover": { backgroundColor: "rgba(74, 93, 58, 0.1)" }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(address._id)}
                              sx={{
                                color: "#d32f2f",
                                p: 0.5,
                                "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.1)" }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        {!address.is_default && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefault(address._id)}
                            sx={{
                              mt: 1,
                              ml: 4,
                              textTransform: "none",
                              color: "#4a5d3a",
                              p: 0.5,
                              minHeight: "auto",
                              "&:hover": { backgroundColor: "rgba(74, 93, 58, 0.05)" }
                            }}
                          >
                            Set as Default
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ));
                  })()}
                  
                  {/* Show more button when there are more than 2 addresses */}
                  {savedAddresses.length > 2 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setShowAddressModal(true)}
                        sx={{
                          textTransform: "none",
                          color: "#4a5d3a",
                          fontWeight: 500,
                          minHeight: "auto",
                          py: 0.5,
                          px: 2,
                          "&:hover": { backgroundColor: "rgba(74, 93, 58, 0.05)" }
                        }}
                      >
                        View All {savedAddresses.length} Address{savedAddresses.length > 1 ? 'es' : ''}
                      </Button>
                    </Box>
                  )}
                </Box>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Right Side - Quick Actions (3/4 of screen) */}
      <Box sx={{ 
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <Typography 
          variant="h4"
          sx={{ 
            fontWeight: 700,
            color: "#4a5d3a",
            mb: 4,
            fontSize: "1.5rem",
            letterSpacing: 1,
          }}
        >
          QUICK ACTIONS
        </Typography>

        {/* Quick Actions Cards in One Row */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            justifyContent: "center",
            flexWrap: "nowrap", // Ensure cards stay in one line
            width: "100%",
            maxWidth: "1000px"
          }}
        >
          {quickActions.map((action, index) => (
            <Box
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.97 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                hover: { duration: 0.2 },
              }}
              onClick={action.action}
              sx={{
                borderRadius: "20px",
                background: action.gradient,
                boxShadow: "0 8px 25px rgba(74, 93, 58, 0.25)",
                cursor: "pointer",
                p: 3,
                flex: "1", // Equal width for all cards
                minWidth: 0, // Allow shrinking if needed
                maxWidth: "220px", // Maximum width to maintain proportion
                height: "240px", // Fixed height for all cards
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "center",
                "&:hover": {
                  boxShadow: "0 12px 35px rgba(74, 93, 58, 0.35)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {/* Icon Container */}
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  width: 70,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                  mb: 2,
                }}
              >
                {React.cloneElement(action.icon, {
                  sx: { fontSize: 35, color: "#ffffff" },
                })}
              </Box>

              {/* Content */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    mb: 1,
                    fontSize: "1.1rem",
                  }}
                >
                  {action.title}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "0.85rem",
                    lineHeight: 1.3,
                    mb: 2,
                  }}
                >
                  {action.description}
                </Typography>
              </Box>

              {/* Action Button */}
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "16px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.85rem",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  minWidth: "120px",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Get Started
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>

      {/* Add/Edit Address Dialog */}
      <Dialog
        open={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingAddress(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)",
            minWidth: "900px",
            width: "90vw"
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#4a5d3a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            py: 2
          }}
        >
          {editingAddress ? "✏️ Edit Address" : "📍 Add New Address"}
        </DialogTitle>
        <DialogContent
          sx={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fdf8 100%)",
            px: 4,
            py: 3
          }}
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Recipient Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="recipient_name"
                  label="Recipient Name"
                  value={formData.recipient_name}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a5d3a',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4a5d3a',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#4a5d3a',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Region Dropdown */}
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel 
                    sx={{ 
                      color: '#4a5d3a', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': { color: '#4a5d3a' } 
                    }}
                  >
                    Region
                  </InputLabel>
                  <Select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    disabled={loadingStates.regions}
                    required
                    sx={{
                      borderRadius: '12px',
                      minWidth: '300px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                    }}
                  >
                    {options.regions.map((r) => (
                      <MenuItem key={r.code} value={r.code}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingStates.regions && <CircularProgress size={24} />}
                </FormControl>
              </Grid>

              {/* Province Dropdown - only show if region is not NCR */}
              {!isNCR && (
                <Grid item xs={12} md={8}>
                  <FormControl fullWidth>
                    <InputLabel 
                      sx={{ 
                        color: '#4a5d3a', 
                        fontWeight: 600,
                        fontSize: '1rem',
                        '&.Mui-focused': { color: '#4a5d3a' } 
                      }}
                    >
                      Province
                    </InputLabel>
                    <Select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      disabled={!formData.region || loadingStates.provinces}
                      required
                      sx={{
                        borderRadius: '12px',
                        minWidth: '300px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(74, 93, 58, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4a5d3a',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4a5d3a',
                        },
                      }}
                    >
                      {options.provinces.map((p) => (
                        <MenuItem key={p.code} value={p.code}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {loadingStates.provinces && <CircularProgress size={24} />}
                  </FormControl>
                </Grid>
              )}

              {/* City Dropdown */}
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel 
                    sx={{ 
                      color: '#4a5d3a', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': { color: '#4a5d3a' } 
                    }}
                  >
                    City/Municipality
                  </InputLabel>
                  <Select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={
                      loadingStates.cities ||
                      !formData.region ||
                      (!isNCR && !formData.province)
                    }
                    required
                    sx={{
                      borderRadius: '12px',
                      minWidth: '300px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                    }}
                  >
                    {options.cities.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingStates.cities && <CircularProgress size={24} />}
                </FormControl>
              </Grid>

              {/* Barangay Dropdown */}
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel 
                    sx={{ 
                      color: '#4a5d3a', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': { color: '#4a5d3a' } 
                    }}
                  >
                    Barangay
                  </InputLabel>
                  <Select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    disabled={!formData.city || loadingStates.barangays}
                    required
                    sx={{
                      borderRadius: '12px',
                      minWidth: '300px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                    }}
                  >
                    {options.barangays.map((b) => {
                      const displayName = b.name.match(/^\d+$/)
                        ? `Barangay ${b.name}`
                        : b.name;

                      return (
                        <MenuItem key={b.code} value={b.name}>
                          {displayName}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {loadingStates.barangays && <CircularProgress size={24} />}
                </FormControl>
              </Grid>

              {/* Street Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="street"
                  label="Street Address"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a5d3a',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4a5d3a',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#4a5d3a',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Postal Code */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="postal_code"
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a5d3a',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4a5d3a',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#4a5d3a',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Contact Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="contact_number"
                  label="Contact Number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a5d3a',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4a5d3a',
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        color: '#4a5d3a',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Address Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel 
                    sx={{ 
                      color: '#4a5d3a', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&.Mui-focused': { color: '#4a5d3a' } 
                    }}
                  >
                    Address Type
                  </InputLabel>
                  <Select
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleChange}
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(74, 93, 58, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a5d3a',
                      },
                    }}
                  >
                    <MenuItem value="Home">Home</MenuItem>
                    <MenuItem value="Work">Work</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Default Address Checkbox */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      sx={{
                        color: '#4a5d3a',
                        '&.Mui-checked': {
                          color: '#4a5d3a',
                        },
                      }}
                    />
                  }
                  label="Set as default address"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      color: '#2c3e2c',
                      fontWeight: 500,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            backgroundColor: "#f8f8f8"
          }}
        >
          <Button
            onClick={() => {
              setShowAddForm(false);
              setEditingAddress(null);
              resetForm();
            }}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#4a5d3a",
              color: "#4a5d3a",
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(74, 93, 58, 0.05)",
                borderColor: "#3a4d2a"
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            size="small"
            disabled={loading}
            sx={{
              backgroundColor: "#4a5d3a",
              color: "#ffffff",
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#3a4d2a"
              },
              "&:disabled": {
                backgroundColor: "#a0a0a0",
                color: "#ffffff"
              }
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: "#ffffff" }} />
            ) : editingAddress ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Addresses Modal */}
      <Dialog
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)",
            maxHeight: "80vh"
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#4a5d3a",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "1.2rem",
            textAlign: "center",
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: 600 }}>
            All Saved Addresses ({savedAddresses.length})
          </Typography>
          <IconButton
            onClick={() => setShowAddressModal(false)}
            sx={{ color: "#ffffff", p: 1 }}
          >
            <Delete sx={{ transform: "rotate(45deg)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2, maxHeight: "60vh", overflowY: "auto" }}>
          <RadioGroup
            value={selectedAddressId}
            onChange={(e) => {
              handleAddressSelection(e.target.value);
              setShowAddressModal(false); // Close modal after selection
            }}
            sx={{ gap: 2 }}
          >
            {savedAddresses.map((address) => (
              <Card
                key={address._id}
                variant="outlined"
                sx={{
                  border:
                    selectedAddressId === address._id
                      ? "2px solid #4a5d3a"
                      : "1px solid #e0e0e0",
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                  background: selectedAddressId === address._id ? "rgba(74, 93, 58, 0.05)" : "#ffffff",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(74, 93, 58, 0.15)",
                    borderColor: "#4a5d3a"
                  },
                  cursor: "pointer"
                }}
                onClick={() => {
                  handleAddressSelection(address._id);
                  setShowAddressModal(false);
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Radio
                      value={address._id}
                      sx={{ 
                        mt: -0.5,
                        color: "#4a5d3a",
                        "&.Mui-checked": { color: "#4a5d3a" }
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Header with name and badges */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight="600" sx={{ color: "#4a5d3a" }}>
                          {address.recipient_name}
                        </Typography>
                        {address.is_default && (
                          <Chip
                            label="Default"
                            size="small"
                            sx={{ 
                              backgroundColor: "#4a5d3a",
                              color: "#ffffff",
                              fontWeight: 600
                            }}
                          />
                        )}
                        <Chip
                          label={address.address_type || "Home"}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: "#4a5d3a",
                            color: "#4a5d3a"
                          }}
                        />
                      </Box>

                      {/* Full Address */}
                      <Typography
                        variant="body1"
                        color="textPrimary"
                        sx={{ mb: 1, lineHeight: 1.4 }}
                      >
                        {formatAddress(address)}
                      </Typography>

                      {/* Contact Info */}
                      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          📞 {address.contact_number}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          📮 {address.postal_code}
                        </Typography>
                      </Box>

                      {/* Action buttons */}
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(address);
                            setShowAddressModal(false);
                          }}
                          sx={{
                            color: "#4a5d3a",
                            borderColor: "#4a5d3a",
                            textTransform: "none",
                            "&:hover": {
                              backgroundColor: "rgba(74, 93, 58, 0.05)",
                              borderColor: "#3a4d2a"
                            }
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(address._id);
                            if (savedAddresses.length <= 3) {
                              setShowAddressModal(false);
                            }
                          }}
                          sx={{
                            color: "#d32f2f",
                            borderColor: "#d32f2f",
                            textTransform: "none",
                            "&:hover": {
                              backgroundColor: "rgba(211, 47, 47, 0.05)",
                              borderColor: "#b71c1c"
                            }
                          }}
                        >
                          Delete
                        </Button>
                        {!address.is_default && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address._id);
                            }}
                            sx={{
                              backgroundColor: "#4a5d3a",
                              color: "#ffffff",
                              textTransform: "none",
                              "&:hover": {
                                backgroundColor: "#3a4d2a"
                              }
                            }}
                          >
                            Set as Default
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            backgroundColor: "#f8f8f8",
            justifyContent: "space-between"
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setEditingAddress(null);
              setShowAddForm(true);
              setShowAddressModal(false);
            }}
            sx={{
              color: "#4a5d3a",
              borderColor: "#4a5d3a",
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(74, 93, 58, 0.05)",
                borderColor: "#3a4d2a"
              }
            }}
          >
            Add New Address
          </Button>
          <Button
            onClick={() => setShowAddressModal(false)}
            variant="contained"
            sx={{
              backgroundColor: "#4a5d3a",
              color: "#ffffff",
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#3a4d2a"
              }
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Create a custom hook to get selected address
export const useAddressSelection = () => {
  const { user, token } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserAddresses = useCallback(async () => {
    if (!user?.username || !token) return;

    try {
      setLoading(true);
      console.log("Fetching addresses for address selection hook...");
      const response = await fetch(
        `${API_BASE_URL}/users/${user.username}/addresses`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const addressList = await response.json();
        console.log("Addresses fetched for hook:", addressList);
        setAddresses(addressList);

        // Auto-select default address or first address
        const defaultAddress =
          addressList.find((addr) => addr.is_default) || addressList[0];
        if (defaultAddress) {
          console.log("Auto-selecting address for weather:", defaultAddress);
          setSelectedAddress(defaultAddress);
        }
      } else {
        console.log("No addresses found or error in hook");
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error("Error in address selection hook:", error);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  }, [user?.username, token]);

  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]);

  return {
    selectedAddress,
    addresses,
    loading,
    refreshAddresses: fetchUserAddresses,
    setSelectedAddress,
  };
};

export default AddressManagement;




//AddressForm.jsx