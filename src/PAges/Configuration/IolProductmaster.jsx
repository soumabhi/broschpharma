import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
// Custom Pagination Component
import { Plus, Edit3, X, Box, X as XIcon, Search, Eye } from "lucide-react";
import axios from "axios";

// --- Cloudinary Upload Function ---
const uploadToCloudinary = async (file) => {
  if (!file) throw new Error("No file provided for upload");

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  try {
    const response = await axios.post(
      import.meta.env.VITE_CLOUDINARY_UPLOAD_URL,
      formData
    );
    toast.success("Image uploaded successfully!");
    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    toast.error("Failed to upload image to Cloudinary");
    throw error;
  }
};
// --- End Cloudinary Upload Function ---

const IOLProductPage = () => {
  const [productData, setProductData] = useState([]);
  const [filterMaterialType, setFilterMaterialType] = useState("");
  const [filterOpticDesign, setFilterOpticDesign] = useState("");
  const [filterHapticDesign, setFilterHapticDesign] = useState("");
  // Search term state must be declared before any useEffect that uses it
  const [searchTerm, setSearchTerm] = useState("");
  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100, 200];
  // Reset to first page if filter/search changes
  const [companyData, setCompanyData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userPermissions = user?.permission || [];

  // --- State for handling file input ---
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  // --- State for image preview ---
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  // --- End State for handling file input ---

  const CustomPagination = ({
    totalItems,
    pageSize,
    currentPage,
    onPageChange,
    pageSizeOptions,
  }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);
    return (
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-600">
          {startIdx}-{endIdx} of {totalItems}
        </span>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
          value={pageSize}
          onChange={(e) => onPageChange(1, parseInt(e.target.value))}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / page
            </option>
          ))}
        </select>
        <button
          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
          onClick={() => onPageChange(currentPage - 1, pageSize)}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <button
          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
          onClick={() => onPageChange(currentPage + 1, pageSize)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };
  // Enum options
  const materialTypeOptions = ["Hydrophobic", "Hydrophilic", "Acrylic", "PMMA"];
  const opticDesignOptions = [
    "Aspheric",
    "Spherical",
    "Monofocal",
    "Multifocal",
    "Bifocal",
    "Trifocal",
    "EDOF",
    "Pinhole",
    "Toric",
  ];
  const hapticDesignOptions = [
    "Plate Haptic",
    "C-loop Haptic",
    "Angled Haptic",
    "Single Piece",
    "Three Piece",
    "Multi Piece",
    "Stable force haptic",
  ];
  const initialFormData = {
    IOLCompanyId: "",
    ProductName: "",
    materialType: "none",
    opticDesign: "none",
    hapticDesign: "",
    IsToric: false,
    isPreloaded: false,
    optical_AConstant: "",
    ultrasound_AConstant: "",
    priceTOStockist: "",
    sellingPrice: "",
    gst: "",
    HSNCode: "90213900",
    remarks: "",
    MRP: 0.0,
    productImage: "", // This will hold the Cloudinary URL
    description: "",
    manufacturerName: "",
    originCountry: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const apiUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = `${apiUrl}/iol-products`;
  const COMPANY_API_URL = `${apiUrl}/iol-masters/`;
  // Fetch all products
  const fetchProducts = async (term = "") => {
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage); // ✅ Add current page
      params.append("limit", pageSize); // ✅ Add limit per page
      if (term) params.append("search", term);
      if (filterMaterialType) params.append("materialType", filterMaterialType);
      if (filterOpticDesign) params.append("opticDesign", filterOpticDesign);
      if (filterHapticDesign) params.append("hapticDesign", filterHapticDesign);
      const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
      setProductData(response?.data || []);
      setLoading(false);
    } catch (error) {
      setError("Failed to load products. Please try again later.");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(searchTerm);
  }, [currentPage, pageSize]);
  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${COMPANY_API_URL}`);
      setCompanyData(response?.data || []);
    } catch (error) {
      setError("Failed to load companies. Please try again later.");
    }
  };
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterMaterialType, filterOpticDesign, filterHapticDesign]);
  // Create a new product
  const createProduct = async (productData) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create product: ${response.status} ${response.statusText
          }. ${errorData.message || ""}`
        );
      }
      toast.success("added Product successful!");
      return await response.json();
    } catch (error) {
      console.log(error);
      toast.error(error?.message || "something went wrong");
      setError(error.message || "Failed to create product");
      throw error;
    }
  };
  // Update an existing product
  const updateProduct = async (id, productData) => {
    try {
      // Ensure slash between endpoint and id
      const url = `${API_BASE_URL.endsWith("/") ? API_BASE_URL : API_BASE_URL + "/"
        }${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error("Failed to update product");
      }
      toast.success("added Product successful!");
      return await response.json();
    } catch (error) {
      setError(error.message || "Failed to update product");
      throw error;
    }
  };
  useEffect(() => {
    fetchCompanies();
    fetchProducts();
  }, []);
  useEffect(() => {
    fetchProducts(searchTerm);
    setCurrentPage(1);
  }, [filterMaterialType, filterOpticDesign, filterHapticDesign]);

  // --- Handle Image File Input Change ---
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      // Optional: Clear the URL input if a file is selected
      // setFormData(prev => ({ ...prev, productImage: '' }));
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    }
  };
  // --- End Handle Image File Input Change ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handlePageChange = (newPage, newPageSize) => {
    setCurrentPage(newPage);
    setPageSize(newPageSize);
  };
  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setCurrentProductId(null);
    setError(null);
    // --- Reset Image File State ---
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    // --- End Reset Image File State ---
  };

  // --- Handle Image Upload to Cloudinary ---
  const handleImageUpload = async () => {
    if (!selectedImageFile) return formData.productImage; // Return existing URL if no file

    try {
      const imageUrl = await uploadToCloudinary(selectedImageFile);
      return imageUrl;
    } catch (err) {
      // Error already handled by uploadToCloudinary
      throw new Error("Image upload failed. Please try again.");
    }
  };
  // --- End Handle Image Upload to Cloudinary ---

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let finalFormData = { ...formData };

      // If a file is selected, upload it and get the URL
      if (selectedImageFile) {
        try {
          const uploadedImageUrl = await handleImageUpload();
          finalFormData.productImage = uploadedImageUrl;
        } catch (uploadError) {
          toast.error(uploadError.message);
          setError(uploadError.message);
          setSubmitting(false);
          return; // Stop submission if upload fails
        }
      }

      if (isEditMode) {
        // Update existing product
        const updatedProduct = await updateProduct(
          currentProductId,
          finalFormData
        );
        // setProductData((prev) =>
        //   prev.map((item) =>
        //     item._id === currentProductId ? updatedProduct : item
        //   )
        // );
        setProductData((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item._id === currentProductId ? updatedProduct : item
          ),
        }));
      } else {
        // Create new product
        await createProduct(finalFormData);
        setCurrentPage(1);
        await fetchProducts(searchTerm);
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      // Error is already handled in create/update functions
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = (product) => {
    if (!product) return;
    setFormData({
      IOLCompanyId: product.IOLCompanyId?._id || product.IOLCompanyId || "",
      ProductName: product.ProductName || "",
      materialType: product.materialType || "none",
      opticDesign: product.opticDesign || "none",
      hapticDesign: product.hapticDesign || "",
      IsToric: product.IsToric || false,
      isPreloaded: product.isPreloaded || false,
      optical_AConstant: product.optical_AConstant || "",
      ultrasound_AConstant: product.ultrasound_AConstant || "",
      priceTOStockist: product.priceTOStockist || "",
      sellingPrice: product.sellingPrice || "",
      gst: product.gst || "",
      HSNCode: "90213900",
      remarks: product.remarks || "",
      MRP: product.MRP || 0.0,
      description: product.description || "",
      productImage: product.productImage || "", // Load existing image URL
      manufacturerName: product.manufacturerName || "",
      originCountry: product.originCountry || "",
    });
    setCurrentProductId(product._id || null);
    setIsEditMode(true);
    setIsModalOpen(true);
    // --- Reset Image File State on Edit ---
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    // --- End Reset Image File State on Edit ---
  };

  // --- View Image Preview ---
  const [previewImage, setPreviewImage] = useState(null);
  const handleViewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
  };
  // --- End View Image Preview ---

  const getCompanyName = (companyId) => {
    if (!companyId) return "Unknown Vendor";
    // If companyId is an object (populated reference)
    if (typeof companyId === "object" && companyId !== null) {
      return companyId.IOLCompanyName || "Unknown Vendor";
    }
    // If companyId is a string (ID)
    if (typeof companyId === "string") {
      const company = companyData.find((c) => c._id === companyId);
      return company?.IOLCompanyName || "Unknown Vendor";
    }
    return "Unknown Company";
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          IOL Product Master
        </h1>
      </div>

      {/* Header Section with Search and Actions */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-4">
            {/* Left Side - Search and Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="block w-[20rem] pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-none focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )

                }
              </div>
              <select
                value={filterMaterialType}
                onChange={(e) => setFilterMaterialType(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">All Materials</option>
                {materialTypeOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={filterOpticDesign}
                onChange={(e) => setFilterOpticDesign(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">All Optics</option>
                {opticDesignOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <select
                value={filterHapticDesign}
                onChange={(e) => setFilterHapticDesign(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">All Haptics</option>
                {hapticDesignOptions.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Right Side - Total Products and Add Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">
                  Total Products
                </span>
                {/* Dynamic pill/circle for count */}
                <div
                  className={`flex items-center justify-center font-bold text-white text-[10px] bg-green-800 
                    ${(productData?.total || 0) < 10
                      ? "w-5 h-5 rounded-full"
                      : "px-3 h-5 rounded-full"
                    }`}
                  style={{
                    minWidth:
                      (productData?.total || 0) < 10 ? "1.25rem" : "2rem",
                    borderRadius: "9999px",
                  }}
                >
                  {productData?.total || 0}
                </div>
              </div>
              {userPermissions?.includes("IolProductAction") && (
                <button
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="w-full mx-auto mb-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <XIcon className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      {/* Product Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 300px)", minHeight: "500px" }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                  <p className="text-gray-600 font-medium">
                    Loading products...
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs w-12">
                      #
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[120px]">
                      Name
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[100px]">
                      Manufacturer
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      Origin
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[100px]">
                      Vendor
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      Material
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[90px]">
                      Optic Design
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[90px]">
                      Haptic Design
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      Opt A-Const
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      Ult A-Const
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      MRP
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[90px]">
                      PTS (incl.GST)
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs min-w-[80px]">
                      SP
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {productData?.data?.map((product, index) => (
                    <tr
                      key={product._id || index}
                      className="h-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
                    >
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900 text-center w-12">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-semibold text-gray-900 text-left min-w-[120px]">
                        {product.ProductName || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left min-w-[100px]">
                        {product?.manufacturerName || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left min-w-[80px]">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          {product?.originCountry || "N/A"}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-semibold text-gray-900 text-left min-w-[100px]">
                        {product?.IOLCompanyId?.IOLCompanyName}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left min-w-[80px]">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {product.materialType || "N/A"}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left min-w-[90px]">
                        {product.opticDesign || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left min-w-[90px]">
                        {product.hapticDesign || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center min-w-[80px]">
                        {product.optical_AConstant || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center min-w-[80px]">
                        {product.ultrasound_AConstant || "N/A"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center min-w-[80px]">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                          {product?.MRP != null
                            ? `₹${Number(product.MRP).toFixed(2)}`
                            : "₹0.00"}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center min-w-[90px]">
                        {product.priceTOStockist
                          ? `₹${Number(product.priceTOStockist).toFixed(2)}`
                          : "0.00"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center min-w-[80px]">
                        {product.sellingPrice
                          ? `₹${Number(product.sellingPrice).toFixed(2)}`
                          : "0.00"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-center w-20">
                        <div className="flex items-center justify-center space-x-1">
                          {product.productImage && (
                            <button
                              onClick={() =>
                                handleViewImage(product.productImage)
                              }
                              className="py-1 transition-all duration-300 hover:scale-110"
                              title="View Image"
                            >
                              <Eye className="w-4 h-4 text-green-600 hover:text-green-800" />
                            </button>
                          )}
                          {userPermissions?.includes("IolProductAction") && (
                            <button
                              onClick={() => handleEdit(product)}
                              className="py-1 transition-all duration-300 hover:scale-110"
                              title="Edit Product"
                            >
                              <Edit3 className="w-4 h-4 text-black hover:text-gray-800" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productData?.data?.length === 0 && !loading && (
                    <tr>
                      <td colSpan="13" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <Box className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {searchTerm
                                ? "No matching products found"
                                : "No products found"}
                            </h3>
                            <p className="text-gray-600 text-xs">
                              {searchTerm
                                ? "Try a different search term"
                                : "Add your first IOL product to get started"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Professional Pagination Controls */}
        {productData?.data?.length > 0 && (
          <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left Side - Rows per page */}
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-700">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageChange(1, parseInt(e.target.value))
                    }
                    aria-label="Select rows per page"
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * pageSize, productData?.total || 0)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900">
                    {productData?.total || 0}
                  </span>{" "}
                  entries
                </div>
              </div>

              {/* Right Side - Pagination Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1, pageSize)}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                >
                  Previous
                </button>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                    Page{" "}
                    <span className="font-bold text-gray-900">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-900">
                      {Math.ceil((productData?.total || 0) / pageSize) || 1}
                    </span>
                  </span>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1, pageSize)}
                  disabled={
                    currentPage ===
                    Math.ceil((productData?.total || 0) / pageSize) ||
                    Math.ceil((productData?.total || 0) / pageSize) <= 1
                  }
                  aria-label="Go to next page"
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage ===
                    Math.ceil((productData?.total || 0) / pageSize) ||
                    Math.ceil((productData?.total || 0) / pageSize) <= 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal - Professional Monochrome Design */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide border border-gray-200 transform transition-all duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white p-6 rounded-t-xl sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl text-left font-bold tracking-wide uppercase">
                    {isEditMode ? "Edit Product" : "Add New Product"}
                  </h3>
                  <p className="text-gray-300 text-sm mt-1 opacity-90">
                    {isEditMode
                      ? "Update existing product information"
                      : "Create a new IOL product entry"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-300 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="ProductName"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="ProductName"
                      name="ProductName"
                      value={formData.ProductName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="manufacturerName"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Manufacturer
                    </label>
                    <input
                      type="string"
                      id="manufacturerName"
                      name="manufacturerName"
                      value={formData.manufacturerName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter manufacturer name"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="originCountry"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Country of Origin
                    </label>
                    <input
                      type="string"
                      id="originCountry"
                      name="originCountry"
                      value={formData.originCountry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter country"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="materialType"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Material Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="materialType"
                      name="materialType"
                      value={formData.materialType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      required
                    >
                      <option value="">Select material Type</option>
                      {materialTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="opticDesign"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Optic Design
                    </label>
                    <select
                      id="opticDesign"
                      name="opticDesign"
                      value={formData.opticDesign}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                    >
                      <option value="">Select optic Design</option>
                      {opticDesignOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="hapticDesign"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Haptic Design
                    </label>
                    <select
                      id="hapticDesign"
                      name="hapticDesign"
                      value={formData.hapticDesign}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                    >
                      <option value="">Select Haptic Design</option>
                      {hapticDesignOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="optical_AConstant"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Optical A-Constant
                    </label>
                    <input
                      type="text"
                      id="optical_AConstant"
                      name="optical_AConstant"
                      value={formData.optical_AConstant}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter A-Constant"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="ultrasound_AConstant"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Ultrasound A-Constant
                    </label>
                    <input
                      type="text"
                      id="ultrasound_AConstant"
                      name="ultrasound_AConstant"
                      value={formData.ultrasound_AConstant}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter A-Constant"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label
                  htmlFor="description"
                  className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm scrollbar-hide resize-none"
                  placeholder="Enter short description"
                />
              </div>

              {/* Vendor Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Vendor
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <label
                    htmlFor="IOLCompanyId"
                    className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                  >
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="IOLCompanyId"
                    name="IOLCompanyId"
                    value={formData.IOLCompanyId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {companyData.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.IOLCompanyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Features
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center bg-gray-50 p-3 rounded-md">
                      <input
                        type="checkbox"
                        id="IsToric"
                        name="IsToric"
                        checked={formData.IsToric}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="IsToric"
                        className="ml-2 block text-sm font-medium text-gray-700"
                      >
                        Toric
                      </label>
                    </div>
                    <div className="flex items-center bg-gray-50 p-3 rounded-md">
                      <input
                        type="checkbox"
                        id="isPreloaded"
                        name="isPreloaded"
                        checked={formData.isPreloaded}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPreloaded"
                        className="ml-2 block text-sm font-medium text-gray-700"
                      >
                        Preloaded
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Pricing Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="MRP"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="MRP"
                      name="MRP"
                      value={formData.MRP}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="priceTOStockist"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      PTS(Incl.GST) (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="priceTOStockist"
                      name="priceTOStockist"
                      value={formData.priceTOStockist}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="sellingPrice"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="sellingPrice"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter selling price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="gst"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      GST (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="gst"
                      name="gst"
                      value={formData.gst}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter GST percentage"
                      min="0"
                      max="99"
                      required
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label
                      htmlFor="HSNCode"
                      className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                    >
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="HSNCode"
                      name="HSNCode"
                      value={formData.HSNCode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                      placeholder="Enter HSN code"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label
                  htmlFor="productImageFile"
                  className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                >
                  Product Image
                </label>
                <input
                  type="file"
                  id="productImageFile"
                  name="productImageFile"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm"
                />
                {selectedImageFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {selectedImageFile.name}
                  </p>
                )}
                {/* {formData.productImage && !selectedImageFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Current URL: {formData.productImage.substring(0, 30)}...
                  </p>
                )} */}

                {/* Image Preview */}
                {imagePreviewUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <h4 className="text-md font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Additional Information
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <label
                    htmlFor="remarks"
                    className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide"
                  >
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all duration-200 text-sm scrollbar-hide resize-none"
                    placeholder="Enter any additional remarks"
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center">
                    <XIcon className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-md hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-md hover:from-gray-900 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditMode ? "Updating..." : "Saving..."}
                    </>
                  ) : isEditMode ? (
                    "Update Product"
                  ) : (
                    "Save Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={30} />
            </button>
            <img
              src={previewImage}
              alt="Product Preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default IOLProductPage;
