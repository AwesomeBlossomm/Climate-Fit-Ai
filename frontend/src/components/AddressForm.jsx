import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
import { Edit, Delete, Add, LocationOn } from "@mui/icons-material";

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
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
      [name]: type === "checkbox" ? checked : value,
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

  // Add this function to handle address selection
  const handleAddressSelection = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(
      (addr) => addr._id === addressId
    );
    if (selectedAddress && onAddressSelect) {
      onAddressSelect(selectedAddress);
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
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {notification.show && (
        <Alert
          severity={notification.type}
          sx={{ mb: 2 }}
          onClose={() =>
            setNotification({ show: false, message: "", type: "success" })
          }
        >
          {notification.message}
        </Alert>
      )}

      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <LocationOn color="primary" />
        Address Management
      </Typography>

      {/* Saved Addresses Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Saved Addresses</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setEditingAddress(null);
                setShowAddForm(true);
              }}
            >
              Add New Address
            </Button>
          </Box>

          {loading && savedAddresses.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : savedAddresses.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" sx={{ py: 3 }}>
              No saved addresses found. Add your first address to get started.
            </Typography>
          ) : (
            <RadioGroup
              value={selectedAddressId}
              onChange={(e) => handleAddressSelection(e.target.value)}
            >
              <Grid container spacing={2}>
                {savedAddresses.map((address) => (
                  <Grid item xs={12} md={6} key={address._id}>
                    <Card
                      variant="outlined"
                      sx={{
                        position: "relative",
                        border:
                          selectedAddressId === address._id
                            ? "2px solid #1976d2"
                            : "1px solid #e0e0e0",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: 2,
                          borderColor: "#1976d2",
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Radio
                            value={address._id}
                            sx={{ mt: -1 }}
                            color="primary"
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {address.recipient_name}
                              </Typography>
                              {address.is_default && (
                                <Chip
                                  label="Default"
                                  color="primary"
                                  size="small"
                                  sx={{ fontWeight: "bold" }}
                                />
                              )}
                              <Chip
                                label={address.address_type || "Home"}
                                variant="outlined"
                                size="small"
                                color={
                                  address.address_type === "Work"
                                    ? "secondary"
                                    : "default"
                                }
                              />
                            </Box>

                            <Typography
                              variant="body2"
                              color="textSecondary"
                              gutterBottom
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              📍 {formatAddress(address)}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              📞 {address.contact_number}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              📮 {address.postal_code}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="Edit Address">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(address)}
                                color="primary"
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "#e3f2fd",
                                  },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Address">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(address._id)}
                                color="error"
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "#ffebee",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {!address.is_default && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefault(address._id)}
                            sx={{
                              mt: 1,
                              textTransform: "none",
                              "&:hover": {
                                backgroundColor: "#e8f5e8",
                              },
                            }}
                            startIcon={<LocationOn fontSize="small" />}
                          >
                            Set as Default
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Selected Address Summary */}
      {selectedAddressId && (
        <Card
          sx={{
            mb: 3,
            bgcolor: "linear-gradient(45deg, #f5f5f5 30%, #e8f5e8 90%)",
            borderLeft: "4px solid #4caf50",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LocationOn color="primary" />
              Selected Address for Weather & Delivery
            </Typography>
            {(() => {
              const selected = savedAddresses.find(
                (addr) => addr._id === selectedAddressId
              );
              return selected ? (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary"
                  >
                    {selected.recipient_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    📍 {formatAddress(selected)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    📞 {selected.contact_number}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Chip
                      label={selected.address_type || "Home"}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {selected.is_default && (
                      <Chip label="Default" size="small" color="success" />
                    )}
                  </Box>
                </Box>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

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
      >
        <DialogTitle>
          {editingAddress ? "Edit Address" : "Add New Address"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Recipient Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="recipient_name"
                  label="Recipient Name"
                  value={formData.recipient_name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* Region Dropdown */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    disabled={loadingStates.regions}
                    required
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Province</InputLabel>
                    <Select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      disabled={!formData.region || loadingStates.provinces}
                      required
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>City/Municipality</InputLabel>
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Barangay</InputLabel>
                  <Select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    disabled={!formData.city || loadingStates.barangays}
                    required
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
                />
              </Grid>

              {/* Address Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Address Type</InputLabel>
                  <Select
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleChange}
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
                    />
                  }
                  label="Set as default address"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddForm(false);
              setEditingAddress(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} />
            ) : editingAddress ? (
              "Update Address"
            ) : (
              "Add Address"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManagement;
