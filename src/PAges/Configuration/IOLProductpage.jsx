import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Tag, ArrowLeft } from "lucide-react";

const IOLProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    IOLCompanyId: "",
    ProductName: "",
    productType: "Monofocal",
    materialType: "Hydrophobic",
    opticDesign: "Aspheric",
    hapticDesign: "",
    IsAsheric: false,
    IsToric: false,
    IsMultifocal: false,
    isMonofocal: false,
    isTrifocal: false,
    isHydrophobic: false,
    isHydrophilic: false,
    isPreloaded: false,
    AConstant: "",
    priceTOStockist: 0,
    sellingPrice: 0,
    gst: 0,
    HSNCode: "",
    remarks: "",
  });
  const [companyData, setCompanyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!id;

  // Enum options
  const productTypeOptions = [
    "Monofocal",
    "Multifocal",
    "Toric",
    "Trifocal",
    "EDOF",
    "Pinhole IOL",
  ];

  const materialTypeOptions = ["Hydrophobic", "Hydrophilic"];
  const opticDesignOptions = [
    "Aspheric",
    "Spherical",
    "Trifocal",
    "EDOF",
    "Pinhole",
  ];
  const apiUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = `${apiUrl}/iol-products/`;
  const COMPANY_API_URL = `${apiUrl}/iol-masters/`;

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      const response = await fetch(COMPANY_API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  };

  // Fetch single product
  const fetchProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  };

  const getallProductData = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch all product data");
      }
      const data = await response.json();
    } catch (error) {
      console.error("Error fetching all product data:", error);
    }
  };
  useEffect(() => {
    getallProductData();
    // greet();
  }, []);
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
          `Failed to create product: ${response.status} ${
            response.statusText
          }. ${errorData.message || ""}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };

  // Update an existing product
  const updateProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error("Failed to update product");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companies = await fetchCompanies();
        setCompanyData(companies);

        if (isEditMode) {
          const product = await fetchProduct(id);
          setFormData({
            IOLCompanyId: product.IOLCompanyId._id || product.IOLCompanyId,
            ProductName: product.ProductName,
            productType: product.productType,
            materialType: product.materialType,
            opticDesign: product.opticDesign,
            hapticDesign: product.hapticDesign,
            IsAsheric: product.IsAsheric,
            IsToric: product.IsToric,
            IsMultifocal: product.IsMultifocal,
            isMonofocal: product.isMonofocal,
            isTrifocal: product.isTrifocal,
            isHydrophobic: product.isHydrophobic,
            isHydrophilic: product.isHydrophilic,
            isPreloaded: product.isPreloaded,
            AConstant: product.AConstant,
            priceTOStockist: product.priceTOStockist,
            sellingPrice: product.sellingPrice,
            gst: product.gst,
            HSNCode: product.HSNCode,
            remarks: product.remarks || "",
          });
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      // Navigate to /IOLprodoctpage after both create and update
      navigate("/IOLprodoctpage");
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/IOLprodoctpage")}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Products
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? "Edit Product Information" : "Add New Product"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode
                ? "Update the product details below"
                : "Fill in the form below to add a new product"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Basic Information
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the basic details of the product
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="IOLCompanyId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="IOLCompanyId"
                      name="IOLCompanyId"
                      value={formData.IOLCompanyId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      <option value="">Select Company</option>
                      {companyData.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.IOLCompanyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ProductName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="ProductName"
                      name="ProductName"
                      value={formData.ProductName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="productType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Product Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="productType"
                      name="productType"
                      value={formData.productType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      {productTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="materialType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Material Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="materialType"
                      name="materialType"
                      value={formData.materialType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      {materialTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="opticDesign"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Optic Design <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="opticDesign"
                      name="opticDesign"
                      value={formData.opticDesign}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      {opticDesignOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="hapticDesign"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Haptic Design <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="hapticDesign"
                      name="hapticDesign"
                      value={formData.hapticDesign}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter haptic design"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Tag size={18} className="text-blue-600" />
                    Features
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the features of the product
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="IsAsheric"
                        name="IsAsheric"
                        checked={formData.IsAsheric}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="IsAsheric"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Aspheric
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="IsToric"
                        name="IsToric"
                        checked={formData.IsToric}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="IsToric"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Toric
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="IsMultifocal"
                        name="IsMultifocal"
                        checked={formData.IsMultifocal}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="IsMultifocal"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Multifocal
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isMonofocal"
                        name="isMonofocal"
                        checked={formData.isMonofocal}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isMonofocal"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Monofocal
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isTrifocal"
                        name="isTrifocal"
                        checked={formData.isTrifocal}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isTrifocal"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Trifocal
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isHydrophobic"
                        name="isHydrophobic"
                        checked={formData.isHydrophobic}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isHydrophobic"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Hydrophobic
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isHydrophilic"
                        name="isHydrophilic"
                        checked={formData.isHydrophilic}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isHydrophilic"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Hydrophilic
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPreloaded"
                        name="isPreloaded"
                        checked={formData.isPreloaded}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPreloaded"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Preloaded
                      </label>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="AConstant"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      A-Constant <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="AConstant"
                      name="AConstant"
                      value={formData.AConstant}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter A-Constant"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Tag size={18} className="text-blue-600" />
                    Pricing Information
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the pricing details
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="priceTOStockist"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Price to Stockist (₹){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="priceTOStockist"
                      name="priceTOStockist"
                      value={formData.priceTOStockist}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sellingPrice"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="sellingPrice"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter selling price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gst"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      GST (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="gst"
                      name="gst"
                      value={formData.gst}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter GST percentage"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="HSNCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      HSN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="HSNCode"
                      name="HSNCode"
                      value={formData.HSNCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter HSN code"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Additional Information
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Add any additional remarks or notes
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="remarks"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter any additional remarks"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/IOLprodoctpage")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </>
                ) : isEditMode ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IOLProductFormPage;
