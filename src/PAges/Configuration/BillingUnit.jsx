import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, X, FileText, Eye, Search, Building2, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const BillerPage = () => {
  const navigate = useNavigate();
  const [billerData, setBillerData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBillerId, setCurrentBillerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showShippingSection, setShowShippingSection] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastState, setToastState] = useState({ show: false, message: "", type: "" });
  const [formData, setFormData] = useState({
    billerName: "",
    billerAddress: "",
    billerGst: "",
    billerPhone: "",
    billerEmail: "",
    stateCode: "",
    shippingUnit: [],
  });

  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100, 200];
  const totalPages = Math.ceil(billerData.length / pageSize);
  const filteredBillers = billerData.filter(biller =>
    biller.billerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    biller.billerAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    biller.billerGst?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    biller.billerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedBillers = filteredBillers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const apiUrl = import.meta.env.VITE_API_URL;

  const API_BASE_URL = `${apiUrl}/billers`;

  // Toast notification function
  const showToast = useCallback((message, type = "error") => {
    setToastState({ show: true, message, type });
    setTimeout(() => {
      setToastState({ show: false, message: "", type: "" });
    }, 5000);
  }, []);

  const fetchBillers = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch billers");
      return await response.json();
    } catch (error) {
      console.error("Error fetching billers:", error);
      throw error;
    }
  };

  const createBiller = async (billerData) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billerData),
      });
      if (!response.ok) throw new Error("Failed to create biller");
      toast.success("BillingUnit successful!");
      return await response.json();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("Error creating biller:", error);
      throw error;
    }
  };

  const updateBiller = async (id, billerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billerData),
      });
      if (!response.ok) throw new Error("Failed to update biller");
      toast.success("BillingUnit update successful!");
      return await response.json();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("Error updating biller:", error);
      throw error;
    }
  };


  // Fetch data when dependencies change
  useEffect(() => {
    const fetchBillerData = async () => {
      try {
        setLoading(true);
        const data = await fetchBillers();
        setBillerData(data);
      } catch (error) {
        console.error("Error fetching biller data:", error);
        showToast("Failed to load billing data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchBillerData();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Reset to first page if billerData or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [billerData.length, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // If GST number is changed, auto-update stateCode from first two digits
    if (name === "billerGst") {
      let stateCode = "";
      if (value && value.length >= 2 && /^\d{2}/.test(value)) {
        stateCode = value.slice(0, 2);
      }
      setFormData((prev) => ({
        ...prev,
        billerGst: value,
        stateCode: stateCode,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddShippingUnit = () => {
    setFormData((prev) => ({
      ...prev,
      shippingUnit: [
        ...prev.shippingUnit,
        {
          shippingUnitName: "",
          shippingUnitAddress: "",
          shippingEmail: "",
          shippingPhone: "",
        },
      ],
    }));
  };

  const handleRemoveShippingUnit = (index) => {
    setFormData((prev) => ({
      ...prev,
      shippingUnit: prev.shippingUnit.filter((_, i) => i !== index),
    }));
  };

  const handleShippingUnitChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedshippingUnit = [...prev.shippingUnit];
      updatedshippingUnit[index] = {
        ...updatedshippingUnit[index],
        [name]: value,
      };
      return {
        ...prev,
        shippingUnit: updatedshippingUnit,
      };
    });
  };

  const resetForm = () => {
    setFormData({
      billerName: "",
      billerAddress: "",
      billerGst: "",
      billerPhone: "",
      billerEmail: "",
      stateCode: "",
      shippingUnit: [],
    });
    setIsEditMode(false);
    setCurrentBillerId(null);
    setShowShippingSection(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        // shippingUnit: formData.shippingUnit
      };

      if (isEditMode) {
        await updateBiller(currentBillerId, payload);
      } else {
        await createBiller(payload);
      }

      const data = await fetchBillers();
      setBillerData(data);
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving biller:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (biller) => {
    setFormData({
      billerName: biller.billerName,
      billerAddress: biller.billerAddress,
      billerGst: biller.billerGst,
      billerPhone: biller.billerPhone,
      billerEmail: biller.billerEmail,
      stateCode: biller.stateCode || "",
      shippingUnit: biller.shippingUnit || [],
    });
    setCurrentBillerId(biller._id); // <-- Fixed line
    setIsEditMode(true);
    setIsModalOpen(true);
    setShowShippingSection(biller.shippingUnit?.length > 0);
  };

  const handleView = (biller) => {
    navigate(`/ShippingpageDetails`, {
      state: {
        shippingUnit: biller.shippingUnit,
        billerId: biller._id, // ✅ Pass the Biller ID properly
      },
    });
  };

  const handlePaginationChange = (newPage, newPageSize) => {
    setCurrentPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          IOL Billing Entity Management
        </h1>
      </div>

      {/* Filters and Search Section */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 ${loading ? "text-blue-500 animate-pulse" : "text-gray-500"}`} />
                <input
                  type="text"
                  placeholder="Search billers by name, address, GST, or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search billing entities"
                  className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-none focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-72 transition-all duration-200"
                />
                {searchInput &&(
                   <button
                    onClick={() => setSearchInput("")}
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}
                {loading && searchInput && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Total Billers</span>
                {/* Dynamic pill/circle for count */}
                <div
                  className={
                    `flex items-center justify-center font-bold text-white text-[10px] bg-green-800 
                    ${billerData.length < 10
                      ? "w-5 h-5 rounded-full"
                      : "px-3 h-5 rounded-full"
                    }`
                  }
                  style={{
                    minWidth: billerData.length < 10 ? "1.25rem" : "2rem",
                    borderRadius: billerData.length < 10 ? "9999px" : "9999px",
                  }}
                >
                  {billerData.length}
                </div>
              </div>
              <button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Add Biller
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Biller Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '500px' }}>
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                  <p className="text-gray-600 font-medium">Loading billing data...</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      #
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Biller Name
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Address
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      GST Number
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Email
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      State Code
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Phone
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Shipping
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBillers.length > 0 ? (
                    paginatedBillers.map((biller, index) => (
                      <tr
                        key={biller._id}
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 border-b border-gray-100"
                      >
                        <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs text-left">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900 max-w-[180px] break-words">
                            {biller.billerName}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-900">
                          <div className="text-left">
                            <div className="relative group">
                              <span className="cursor-help hover:text-green-600 transition-colors duration-200">
                                {biller.billerAddress && biller.billerAddress.length > 10
                                  ? `${biller.billerAddress.substring(0, 10)}...`
                                  : biller.billerAddress}
                              </span>
                              {biller.billerAddress && biller.billerAddress.length > 10 && (
                                <div className="absolute z-20 invisible group-hover:visible w-64 p-4 text-xs bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl shadow-2xl top-8 left-0 transform transition-all duration-300">
                                  <div className="flex items-center mb-3">
                                    <div className="w-6 h-6 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center mr-2">
                                      <Building2 className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900 text-sm">Full Address</h4>
                                      <p className="text-gray-600 text-[10px]">Complete billing address</p>
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-gray-900 font-medium text-xs leading-relaxed break-words">
                                      {biller.billerAddress}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-left">
                          <span className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded inline-block">
                            {biller.billerGst}
                          </span>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="flex items-center text-xs text-gray-900">
                            <span className="break-words max-w-[120px]">
                              {biller.billerEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left">
                          <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded">
                            {biller.stateCode}
                          </span>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left">
                          <div className="flex items-center font-mono">
                            {biller.billerPhone}
                          </div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-left">
                          <button
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="View Shipping Details"
                            onClick={() => handleView(biller)}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-left">
                          <button
                            onClick={() => handleEdit(biller)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="Edit Biller"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Billers Found</h3>
                            <p className="text-gray-600 text-xs">No billing entities match your current search criteria.</p>
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
        <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-gray-700">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePaginationChange(1, parseInt(e.target.value))}
                  aria-label="Select rows per page"
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                >
                  {pageSizeOptions.map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                Showing <span className="font-bold text-gray-900">{filteredBillers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, filteredBillers.length)}</span> of{" "}
                <span className="font-bold text-gray-900">{filteredBillers.length}</span> entries
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePaginationChange(currentPage - 1, pageSize)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {[...Array(Math.ceil(filteredBillers.length / pageSize))].map((_, i) => {
                  const pageNum = i + 1;
                  const totalFilteredPages = Math.ceil(filteredBillers.length / pageSize);
                  if (
                    pageNum === 1 ||
                    pageNum === totalFilteredPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePaginationChange(pageNum, pageSize)}
                        aria-label={`Go to page ${pageNum}`}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === pageNum
                          ? "bg-gradient-to-r from-gray-800 to-black text-white shadow-md transform -translate-y-0.5"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNum}
                        className="px-1 py-1 text-xs text-gray-500 font-bold"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePaginationChange(currentPage + 1, pageSize)}
                disabled={currentPage === Math.ceil(filteredBillers.length / pageSize)}
                aria-label="Go to next page"
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === Math.ceil(filteredBillers.length / pageSize)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
            {/* Compact Modal Header */}
            <div className="bg-black p-3 rounded-t-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                    <Building2 className="w-4 h-4 text-gray-800" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {isEditMode ? (
                        <>Edit Billing Entity <span className="font-bold text-green-400">{formData.billerName}</span></>
                      ) : (
                        <>Add New <span className="font-bold text-green-400">Billing Entity</span></>
                      )}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information - Ultra Compact Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                  {/* Biller Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <Building2 className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Biller Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          Biller Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="billerName"
                          value={formData.billerName}
                          onChange={handleInputChange}
                          placeholder="Enter biller name"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          Biller Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="billerAddress"
                          value={formData.billerAddress}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Enter complete address"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 resize-none"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="billerEmail"
                            value={formData.billerEmail}
                            onChange={handleInputChange}
                            placeholder="Enter email"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="billerPhone"
                            value={formData.billerPhone}
                            onChange={handleInputChange}
                            placeholder="Enter phone"
                            maxLength={10}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GST & State Information */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">GST & State Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          GST Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="billerGst"
                          value={formData.billerGst}
                          onChange={handleInputChange}
                          placeholder="Enter 15-digit GST number"
                          maxLength={15}
                          pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                          title="Enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          State Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="stateCode"
                          value={formData.stateCode}
                          onChange={handleInputChange}
                          placeholder="Auto from GST (first 2 digits)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-gray-100 shadow-sm transition-all duration-200"
                          required
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Section */}
                {showShippingSection && (
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <Building2 className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Shipping Addresses</h3>
                      </div>
                    </div>

                    {formData.shippingUnit.map((unit, index) => (
                      <div key={index} className="space-y-3 p-3 bg-white rounded-md border border-gray-300 shadow-sm mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">
                            Shipping Address #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveShippingUnit(index)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-all duration-200"
                          >
                            <X size={14} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Unit Name</label>
                            <input
                              type="text"
                              name="shippingUnitName"
                              value={unit.shippingUnitName}
                              onChange={(e) => handleShippingUnitChange(index, e)}
                              placeholder="Enter unit name"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Address</label>
                            <textarea
                              name="shippingUnitAddress"
                              value={unit.shippingUnitAddress}
                              onChange={(e) => handleShippingUnitChange(index, e)}
                              rows={2}
                              placeholder="Enter shipping address"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Email</label>
                            <input
                              type="email"
                              name="shippingEmail"
                              value={unit.shippingEmail}
                              onChange={(e) => handleShippingUnitChange(index, e)}
                              placeholder="Enter email"
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-800 mb-0.5">Phone</label>
                            <input
                              type="tel"
                              name="shippingPhone"
                              value={unit.shippingPhone}
                              onChange={(e) => handleShippingUnitChange(index, e)}
                              placeholder="Enter phone"
                              maxLength={10}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddShippingUnit}
                      className="w-full py-2 text-xs font-medium text-gray-600 border border-dashed border-gray-400 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 hover:border-gray-500"
                    >
                      <Plus size={16} /> Add Shipping Address
                    </button>
                  </div>
                )}

                {/* Toggle Shipping Section Button */}
                {!showShippingSection && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowShippingSection(true)}
                      className="w-full py-2 text-xs font-medium text-blue-600 border border-dashed border-blue-300 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 hover:border-blue-400"
                    >
                      <Plus size={16} /> Add Shipping Addresses (Optional)
                    </button>
                  </div>
                )}

                {/* Ultra Compact Warning */}
                <div className="mb-4 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded border-l-4 border-gray-500 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">Important Notice</p>
                      <p className="text-[10px] text-gray-700">
                        {isEditMode
                          ? "Please verify all information before updating the billing entity."
                          : "Please verify all information. GST number will auto-generate the state code."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact Modal Footer */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-1.5 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded transition-all duration-200 font-medium border border-gray-300 text-xs shadow-sm hover:shadow-md"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-1.5 rounded font-semibold transition-all duration-200 flex items-center space-x-1 text-xs shadow-sm hover:shadow-lg ${submitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                      : "bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-700 border border-gray-600"
                      }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isEditMode ? "Updating..." : "Adding..."}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>{isEditMode ? "Update Biller" : "Add Biller"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillerPage;
