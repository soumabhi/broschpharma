import React, { useState, useEffect } from "react";
import { Plus, Edit3, X, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const IOLCompanyPage = () => {
  const [companyData, setCompanyData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    IOLCompanyName: "",
    IOLCompanyAddress: "",
    IOLCompanyGstNo: "",
    IOLCompanyPhone: "",
    IOLCompanyEmail: "",
    IOlCompanyStateCode: "",
    creditDays: 30,
  });
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSizeOptions = [10, 25, 50, 100, 200];
  const apiUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = `${apiUrl}/iol-masters`;

  const fetchCompanies = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json();
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  };

  const createCompany = async (companyData) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });
      if (!response.ok) throw new Error("Failed to create company");
      toast.success("added Company successful!");
      return await response.json();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("Error creating company:", error);
      throw error;
    }
  };

  const updateCompany = async (id, companyData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });
      if (!response.ok) throw new Error("Failed to update company");
      toast.success("update Company successful!");
      return await response.json();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("Error updating company:", error);
      throw error;
    }
  };



  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCompanies();
        setCompanyData(data);
      } catch (error) {
        console.error("Error fetching company data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFieldErrors = { ...fieldErrors };
    // GST validation regex
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (name === "IOLCompanyGstNo") {
      let stateCode = "";
      if (value && value.length >= 2 && /^\d{2}/.test(value)) {
        stateCode = value.slice(0, 2);
      }
      // Validate GST (show error only if not empty and length is 15)
      if (value && value.length === 15 && !gstRegex.test(value)) {
        newFieldErrors.IOLCompanyGstNo = "GST number is incorrect";
      } else {
        delete newFieldErrors.IOLCompanyGstNo;
      }
      setFormData((prev) => ({
        ...prev,
        IOLCompanyGstNo: value,
        IOlCompanyStateCode: stateCode,
      }));
    } else if (name === "IOLCompanyEmail") {
      // Email validation
      if (value && !/^\S+@\S+\.\S+$/.test(value)) {
        newFieldErrors.IOLCompanyEmail = "Email is not valid";
      } else {
        delete newFieldErrors.IOLCompanyEmail;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "IOLCompanyPhone") {
      // Phone validation
      if (value && !/^\d{10}$/.test(value)) {
        newFieldErrors.IOLCompanyPhone =
          "Phone must be a valid 10-digit number";
      } else {
        delete newFieldErrors.IOLCompanyPhone;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setFieldErrors(newFieldErrors);
  };

  const resetForm = () => {
    setFormData({
      IOLCompanyName: "",
      IOLCompanyAddress: "",
      IOLCompanyGstNo: "",
      IOLCompanyPhone: "",
      IOLCompanyEmail: "",
      IOlCompanyStateCode: "",
      creditDays: 30,
    });
    setIsEditMode(false);
    setCurrentCompanyId(null);
    setError(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    let newFieldErrors = {};
    // Field validation
    const errors = [];
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!formData.IOLCompanyName.trim())
      errors.push("Company Name is required.");
    if (!formData.IOLCompanyAddress.trim())
      errors.push("Company Address is required.");
    if (!formData.IOLCompanyGstNo.trim()) {
      errors.push("GST Number is required.");
    } else if (
      formData.IOLCompanyGstNo.length === 15 &&
      !gstRegex.test(formData.IOLCompanyGstNo)
    ) {
      errors.push("GST number is incorrect.");
      newFieldErrors.IOLCompanyGstNo = "GST number is incorrect";
    }
    if (
      !formData.IOlCompanyStateCode ||
      isNaN(formData.IOlCompanyStateCode) ||
      formData.IOlCompanyStateCode < 1 ||
      formData.IOlCompanyStateCode > 99
    )
      errors.push("State Code must be a number between 1 and 99.");
    if (
      !formData.IOLCompanyEmail.trim() ||
      !/^\S+@\S+\.\S+$/.test(formData.IOLCompanyEmail.trim())
    )
      errors.push("Email must be a valid email address.");
    if (
      !formData.IOLCompanyPhone.trim() ||
      !/^\d{10}$/.test(formData.IOLCompanyPhone.trim())
    )
      errors.push("Phone must be a valid 10-digit number.");
    if (
      formData.creditDays == null ||
      isNaN(formData.creditDays) ||
      formData.creditDays < 0
    )
      errors.push("Credit Days must be a non-negative number.");

    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(" "));
      setSubmitting(false);
      return;
    }

    try {
      if (isEditMode) {
        await updateCompany(currentCompanyId, formData);
      } else {
        await createCompany(formData);
      }
      const data = await fetchCompanies();
      setCompanyData(data);
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving company:", error);
      setError(
        error.message ||
        "Failed to save company. Please check all fields and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      IOLCompanyName: company.IOLCompanyName,
      IOLCompanyAddress: company.IOLCompanyAddress,
      IOLCompanyGstNo: company.IOLCompanyGstNo,
      IOLCompanyPhone: company.IOLCompanyPhone,
      IOLCompanyEmail: company.IOLCompanyEmail,
      IOlCompanyStateCode: company.IOlCompanyStateCode,
      creditDays: company.creditDays,
    });
    setCurrentCompanyId(company._id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Reset to first page if companyData changes
  useEffect(() => {
    setCurrentPage(1);
  }, [companyData.length, pageSize]);

  const handlePaginationChange = (newPage, newPageSize) => {
    setCurrentPage(newPage);
    setPageSize(newPageSize);
  };

  // Filter companies by search term
  const filteredCompanies = companyData.filter((company) => {
    const term = searchTerm.toLowerCase();
    return (
      company.IOLCompanyName?.toLowerCase().includes(term) ||
      company.IOLCompanyGstNo?.toLowerCase().includes(term) ||
      company.IOLCompanyEmail?.toLowerCase().includes(term)
    );
  });
  const paginatedFilteredCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalFilteredPages = Math.ceil(filteredCompanies.length / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          IOL Vendor Master
        </h1>
      </div>

      {/* Header Section with Search and Actions */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-4">
            {/* Left Side - Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search vendors, GST, email..."
                  className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Total Vendors and Add Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Total Vendors</span>
                {/* Dynamic pill/circle for count */}
                <div
                  className={
                    `flex items-center justify-center font-bold text-white text-[10px] bg-green-800 
                    ${companyData.length < 10
                      ? "w-5 h-5 rounded-full"
                      : "px-3 h-5 rounded-full"
                    }`
                  }
                  style={{
                    minWidth: companyData.length < 10 ? "1.25rem" : "2rem",
                    borderRadius: companyData.length < 10 ? "9999px" : "9999px",
                  }}
                >
                  {companyData.length}
                </div>
              </div>
              <button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full mx-auto mb-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '500px' }}>
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                  <p className="text-gray-600 font-medium">Loading vendors...</p>
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
                      Vendor Name
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Address
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      GST No
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      State
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Email
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Phone
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Credit Days
                    </th>
                    <th className="px-2 py-1 text-center font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedFilteredCompanies.map((company, index) => (
                    <tr key={company._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs font-medium text-gray-900 text-left">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs font-semibold text-gray-900 text-left">
                        {company.IOLCompanyName}
                      </td>
                      <td className="px-2 py-0.5 text-xs text-gray-900 max-w-xs truncate text-left" title={company.IOLCompanyAddress}>
                        {company.IOLCompanyAddress}
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {company.IOLCompanyGstNo}
                        </span>
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          {company.IOlCompanyStateCode}
                        </span>
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                        {company.IOLCompanyEmail}
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                        {company.IOLCompanyPhone}
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                          {company.creditDays} days
                        </span>
                      </td>
                      <td className="px-2 py-0.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit(company)}
                          className="py-1 transition-all duration-300 hover:scale-110"
                          title="Edit Vendor"
                        >
                          <Edit3 className="w-4 h-4 text-black hover:text-gray-800" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedFilteredCompanies.length === 0 && !loading && (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Vendors Found</h3>
                            <p className="text-gray-600 text-xs">No IOL vendors found matching your criteria</p>
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
        {filteredCompanies.length > 0 && (
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
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                  Showing <span className="font-bold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, filteredCompanies.length)}</span> of{" "}
                  <span className="font-bold text-gray-900">{filteredCompanies.length}</span> entries
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
                  {totalFilteredPages > 0 && [...Array(totalFilteredPages)].map((_, i) => {
                    const pageNum = i + 1;
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
                  disabled={currentPage === totalFilteredPages || totalFilteredPages <= 1}
                  aria-label="Go to next page"
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === totalFilteredPages || totalFilteredPages <= 1
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
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
            {/* Compact Modal Header */}
            <div className="bg-black p-3 rounded-t-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="w-4 h-4 text-gray-800" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {isEditMode ? (
                        <>Edit <span className="font-bold text-yellow-400">Vendor</span></>
                      ) : (
                        <>Add New <span className="font-bold text-green-400">Vendor</span></>
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
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-white transform rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
              <div className="space-y-4">
                {error && (
                  <div className="mb-4 p-2 bg-gradient-to-r from-red-100 to-red-200 rounded border-l-4 border-red-500 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-800">Validation Error</p>
                        <p className="text-[10px] text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Vendor Information Section */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Vendor Information</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="IOLCompanyName"
                          className="block text-[10px] font-medium text-gray-800 mb-0.5"
                        >
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="IOLCompanyName"
                          name="IOLCompanyName"
                          value={formData.IOLCompanyName}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                          placeholder="Enter vendor name"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="IOLCompanyAddress"
                          className="block text-[10px] font-medium text-gray-800 mb-0.5"
                        >
                          Company Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="IOLCompanyAddress"
                          name="IOLCompanyAddress"
                          value={formData.IOLCompanyAddress}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 resize-none"
                          placeholder="Enter complete address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* GST & State Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <FileText className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">GST Details</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="IOLCompanyGstNo"
                            className="block text-[10px] font-medium text-gray-800 mb-0.5"
                          >
                            GST Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="IOLCompanyGstNo"
                            name="IOLCompanyGstNo"
                            value={formData.IOLCompanyGstNo}
                            onChange={handleInputChange}
                            className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 font-mono ${fieldErrors.IOLCompanyGstNo
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            placeholder="Enter 15-digit GST number"
                            maxLength={15}
                            required
                          />
                          {fieldErrors.IOLCompanyGstNo && (
                            <p className="text-[10px] text-red-600 mt-1">
                              {fieldErrors.IOLCompanyGstNo}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="IOlCompanyStateCode"
                            className="block text-[10px] font-medium text-gray-800 mb-0.5"
                          >
                            State Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="IOlCompanyStateCode"
                            name="IOlCompanyStateCode"
                            value={formData.IOlCompanyStateCode}
                            onChange={handleInputChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                            placeholder="Auto from GST (first 2 digits)"
                            required
                            min="1"
                            max="99"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <FileText className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Contact Information</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="IOLCompanyEmail"
                            className="block text-[10px] font-medium text-gray-800 mb-0.5"
                          >
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="IOLCompanyEmail"
                            name="IOLCompanyEmail"
                            value={formData.IOLCompanyEmail}
                            onChange={handleInputChange}
                            className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 ${fieldErrors.IOLCompanyEmail
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            placeholder="Enter email"
                            required
                          />
                          {fieldErrors.IOLCompanyEmail && (
                            <p className="text-[10px] text-red-600 mt-1">
                              {fieldErrors.IOLCompanyEmail}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="IOLCompanyPhone"
                            className="block text-[10px] font-medium text-gray-800 mb-0.5"
                          >
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            id="IOLCompanyPhone"
                            name="IOLCompanyPhone"
                            value={formData.IOLCompanyPhone}
                            onChange={handleInputChange}
                            className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 ${fieldErrors.IOLCompanyPhone
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            placeholder="Enter phone"
                            maxLength={10}
                            required
                          />
                          {fieldErrors.IOLCompanyPhone && (
                            <p className="text-[10px] text-red-600 mt-1">
                              {fieldErrors.IOLCompanyPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credit Days */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center mr-2">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-blue-900 text-sm">Payment Terms</h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label
                        htmlFor="creditDays"
                        className="text-[10px] font-medium text-blue-800 whitespace-nowrap"
                      >
                        Credit Days <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="creditDays"
                        name="creditDays"
                        value={formData.creditDays}
                        onChange={handleInputChange}
                        className="w-20 px-2 py-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                        placeholder="Days"
                        required
                        min="0"
                      />
                    </div>
                  </div>                  {/* Compact Modal Footer */}
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
                      className="px-4 py-1.5 rounded font-semibold transition-all duration-200 flex items-center space-x-1 text-xs shadow-sm hover:shadow-lg bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-700 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{isEditMode ? "Updating..." : "Adding..."}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>{isEditMode ? "Update" : "Add"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IOLCompanyPage;
