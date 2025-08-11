import React, { useState, useEffect } from "react";
import { Plus, Edit3, X, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MedBillerPage = () => {
  const navigate = useNavigate();
  const [billerData, setBillerData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBillerId, setCurrentBillerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showShippingSection, setShowShippingSection] = useState(false);
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
  const paginatedBillers = billerData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const apiUrl = import.meta.env.VITE_API_URL;
  const API_BASE_URL = `${apiUrl}/billers`;

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
      return await response.json();
    } catch (error) {
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
      return await response.json();
    } catch (error) {
      console.error("Error updating biller:", error);
      throw error;
    }
  };

  const deleteBiller = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete biller");
      return await response.json();
    } catch (error) {
      console.error("Error deleting biller:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchBillerData = async () => {
      try {
        setLoading(true);
        const data = await fetchBillers();
        setBillerData(data);
      } catch (error) {
        console.error("Error fetching biller data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillerData();
  }, []);

  // Reset to first page if billerData or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [billerData.length, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this biller?")) {
      try {
        await deleteBiller(id);
        const data = await fetchBillers();
        setBillerData(data);
      } catch (error) {
        console.error("Error deleting biller:", error);
      }
    }
  };

  const handlePaginationChange = (newPage, newPageSize) => {
    setCurrentPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-left font-bold text-gray-900 mb-2">
            Medicine Billing Entity
          </h1>
          <p className="text-gray-600">
            Manage your billing entity information and details
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Add Biller
        </button>
      </div>

      {/* Biller Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col text-left flex-grow">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={18} />
            Medicine Biller's Information
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-left flex items-center justify-center flex-col flex-grow">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading biller data...</p>
          </div>
        ) : (
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30px]">
                      #
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Biller Name
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State Code
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">
                      Shipping
                    </th>
                    <th className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBillers.map((biller, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-500 w-[30px]">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {biller.billerName}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-900">
                        <div className="flex items-center">
                          <span className="line-clamp-1">
                            {biller.billerAddress}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded text-left">
                          {biller.billerGst}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-900">
                          <span className="truncate max-w-[120px]">
                            {biller.billerEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {biller.stateCode}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center">
                          {biller.billerPhone}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap w-[70px] text-center">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="View Shipping Details"
                          onClick={() => handleView(biller)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap w-[100px] text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEdit(biller)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                            title="Edit Biller"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Custom Pagination Row */}
                  {billerData.length > 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-2">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-600">
                            {billerData.length === 0
                              ? "0"
                              : (currentPage - 1) * pageSize + 1}
                            -
                            {Math.min(
                              currentPage * pageSize,
                              billerData.length
                            )}{" "}
                            of {billerData.length}
                          </span>
                          <select
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                            value={pageSize}
                            onChange={(e) =>
                              handlePaginationChange(
                                1,
                                parseInt(e.target.value)
                              )
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
                            disabled={currentPage === totalPages}
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

            {!loading && billerData.length === 0 && (
              <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center flex-grow">
                <FileText size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No billers found</p>
                <p className="text-xs">Add your first biller to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditMode ? "Edit Biller" : "Add Biller"}
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

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label
                    htmlFor="billerName"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    Biller Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="billerName"
                    name="billerName"
                    value={formData.billerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter biller name"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="billerAddress"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    Biller Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="billerAddress"
                    name="billerAddress"
                    value={formData.billerAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter complete address"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="billerGst"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="billerGst"
                    name="billerGst"
                    value={formData.billerGst}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                    placeholder="Enter 15-digit GST number"
                    required
                    // pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                    // title="Enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="billerEmail"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="billerEmail"
                    name="billerEmail"
                    value={formData.billerEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="billerPhone"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    State Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="stateCode"
                    name="stateCode"
                    value={formData.stateCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter state code"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="billerPhone"
                    className="block text-sm font-medium text-gray-700 mb-1 text-left"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="billerPhone"
                    name="billerPhone"
                    value={formData.billerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address Section */}
              {showShippingSection && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">
                    Shipping Addresses
                  </h4>

                  {formData.shippingUnit.map((unit, index) => (
                    <div
                      key={index}
                      className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">
                          Shipping Address #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveShippingUnit(index)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <X size={14} /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
                            Unit Name
                          </label>
                          <input
                            type="text"
                            name="shippingUnitName"
                            value={unit.shippingUnitName}
                            onChange={(e) => handleShippingUnitChange(index, e)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter unit name"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
                            Address
                          </label>
                          <textarea
                            name="shippingUnitAddress"
                            value={unit.shippingUnitAddress}
                            onChange={(e) => handleShippingUnitChange(index, e)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                            placeholder="Enter shipping address"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
                            Email
                          </label>
                          <input
                            type="email"
                            name="shippingEmail"
                            value={unit.shippingEmail}
                            onChange={(e) => handleShippingUnitChange(index, e)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter email"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="shippingPhone"
                            value={unit.shippingPhone}
                            onChange={(e) => handleShippingUnitChange(index, e)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter phone"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddShippingUnit}
                    className="w-full py-2 text-sm font-medium text-blue-600 border border-dashed border-blue-200 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={16} /> Add Your Shipping Address
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditMode ? "Updating..." : "Submitting..."}
                    </>
                  ) : isEditMode ? (
                    "Update Biller"
                  ) : (
                    "Add Biller"
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

export default MedBillerPage;
