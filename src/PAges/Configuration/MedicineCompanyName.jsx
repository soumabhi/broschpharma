import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  X,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MedicineCompanyName = () => {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
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
  const totalPages = Math.ceil(companyData.length / pageSize);
  const paginatedCompanies = companyData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
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
      return await response.json();
    } catch (error) {
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
      return await response.json();
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  };

  const deleteCompany = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete company");
      return await response.json();
    } catch (error) {
      console.error("Error deleting company:", error);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await deleteCompany(id);
        const data = await fetchCompanies();
        setCompanyData(data);
      } catch (error) {
        console.error("Error deleting company:", error);
        setError(error.message);
      }
    }
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-left font-bold text-gray-900 mb-2">
            Medicine Company Master
          </h1>
          <p className="text-gray-600">
            Manage your Medicine company information and details
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 text-xs shadow-sm"
          style={{ minWidth: "110px", height: "32px" }}
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      {/* Search Bar - Left Aligned */}
      <div className="flex w-full mb-2">
        <div className="bg-white p-0 rounded-lg shadow-sm border border-gray-100 max-w-2xl mr-auto">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 items-center"
          >
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-2 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search companies, GST, email..."
                className="block w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md bg-white placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: 0 }}
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={16} />
            Company Information
          </h2>
        </div>

        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-xs text-gray-600">
                Loading company data...
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-[11px] text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-1.5 text-left w-8">#</th>
                  <th className="px-3 py-1.5 text-left min-w-[140px]">
                    Company Name
                  </th>
                  <th className="px-3 py-1.5 text-left min-w-[150px]">
                    Address
                  </th>
                  <th className="px-3 py-1.5 text-left">GST No</th>
                  <th className="px-3 py-1.5 text-left w-16">State</th>
                  <th className="px-3 py-1.5 text-left">E-mail</th>
                  <th className="px-3 py-1.5 text-left">Phone</th>
                  <th className="px-3 py-1.5 text-left w-20">Credit Days</th>
                  <th className="px-3 py-1.5 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs text-left">
                {paginatedFilteredCompanies.map((company, index) => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 w-8">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 min-w-[140px]">
                      {company.IOLCompanyName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 min-w-[150px]">
                      <div className="flex items-center">
                        <span className="truncate max-w-[140px]">
                          {company.IOLCompanyAddress}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-900 text-[11px] bg-gray-50 rounded">
                      {company.IOLCompanyGstNo}
                    </td>
                    <td className="px-3 py-2 text-gray-700 w-16">
                      {company.IOlCompanyStateCode}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      <div className="flex items-center">
                        <span className="truncate max-w-[120px]">
                          {company.IOLCompanyEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      <div className="flex items-center">
                        {company.IOLCompanyPhone}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 w-20">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-medium">
                        {company.creditDays} days
                      </span>
                    </td>
                    <td className="px-3 py-2 w-16 text-center">
                      <button
                        onClick={() => handleEdit(company)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit Company"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Pagination Row */}
                {filteredCompanies.length > 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600">
                          {filteredCompanies.length === 0
                            ? "0"
                            : (currentPage - 1) * pageSize + 1}
                          -
                          {Math.min(
                            currentPage * pageSize,
                            filteredCompanies.length
                          )}{" "}
                          of {filteredCompanies.length}
                        </span>
                        <select
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                          value={pageSize}
                          onChange={(e) =>
                            handlePaginationChange(1, parseInt(e.target.value))
                          }
                        >
                          {pageSizeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt} / page
                            </option>
                          ))}
                        </select>
                        <button
                          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                          onClick={() =>
                            handlePaginationChange(currentPage - 1, pageSize)
                          }
                          disabled={currentPage === 1}
                        >
                          Prev
                        </button>
                        <button
                          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                          onClick={() =>
                            handlePaginationChange(currentPage + 1, pageSize)
                          }
                          disabled={currentPage === totalFilteredPages}
                        >
                          Next
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && companyData.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <FileText size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium">No companies found</p>
            <p className="text-[11px] mt-0.5">
              Add your first Medicine company to get started
            </p>
          </div>
        )}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto ">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl my-8">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditMode ? "Edit Company" : "Add Company"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="IOLCompanyName"
                  className="block text-xs font-medium text-gray-700 mb-1 text-left"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="IOLCompanyName"
                  name="IOLCompanyName"
                  value={formData.IOLCompanyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="IOLCompanyAddress"
                  className="block text-xs font-medium text-gray-700 mb-1 text-left"
                >
                  Company Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="IOLCompanyAddress"
                  name="IOLCompanyAddress"
                  value={formData.IOLCompanyAddress}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="IOLCompanyGstNo"
                    className="block text-xs font-medium text-gray-700 mb-1 text-left"
                  >
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="IOLCompanyGstNo"
                    name="IOLCompanyGstNo"
                    value={formData.IOLCompanyGstNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                    placeholder="Enter 15-digit GST number"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="IOlCompanyStateCode"
                    className="block text-xs font-medium text-gray-700 mb-1 text-left"
                  >
                    State Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="IOlCompanyStateCode"
                    name="IOlCompanyStateCode"
                    value={formData.IOlCompanyStateCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter state code"
                    required
                    min="1"
                    max="99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="IOLCompanyEmail"
                    className="block text-xs font-medium text-gray-700 mb-1 text-left"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="IOLCompanyEmail"
                    name="IOLCompanyEmail"
                    value={formData.IOLCompanyEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="IOLCompanyPhone"
                    className="block text-xs font-medium text-gray-700 mb-1 text-left"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="IOLCompanyPhone"
                    name="IOLCompanyPhone"
                    value={formData.IOLCompanyPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="creditDays"
                  className="block text-xs font-medium text-gray-700 mb-1 text-left"
                >
                  Credit Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="creditDays"
                  name="creditDays"
                  value={formData.creditDays}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter credit days"
                  required
                  min="0"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      {isEditMode ? "Updating..." : "Submitting..."}
                    </>
                  ) : isEditMode ? (
                    "Update"
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineCompanyName;
