import React, { useState, useEffect } from "react";
import { Trash2, Plus, Edit3, Key, Building2, AlertCircle, CheckCircle, User, FileText, ChevronLeft, ChevronRight } from "lucide-react"; // Added missing icons
import { useLocation, useNavigate } from "react-router-dom";

const ShippingUnitsPage = () => {
  const [shippingUnits, setShippingUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // --- State for main shipping unit details ---
  const [newShippingUnit, setNewShippingUnit] = useState({
    shippingUnitName: "",
    shippingUnitAddress: "",
    shippingEmail: "",
    shippingPhone: "",
  });
  // --- State for credentials ---
  const [credential, setCredential] = useState({
    userId: "",
    password: "",
  });
  // --- State to distinguish edit mode type ---
  const [editModeType, setEditModeType] = useState(null); // null, 'details', or 'credentials'
  const [editShippingUnitId, setEditShippingUnitId] = useState(null);
  // --- State to hold the name of the unit being edited (for credential modal) ---
  const [editingUnitName, setEditingUnitName] = useState("");
  // --- Pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [availableLimits] = useState([15, 25, 50, 100]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const billerId = location.state?.billerId;
  const [addingData,setAddingData]=useState(false)

  // Fetch shipping units
  const fetchShippingUnits = async () => {
    if (!billerId) {
      console.warn("No billerId provided. Navigating back.");
      navigate(-1);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/billers/${billerId}`);
      if (!response.ok) throw new Error("Failed to fetch biller data");
      const biller = await response.json();
      setShippingUnits(biller.shippingUnit || []);
    } catch (error) {
      console.error("Error fetching shipping units:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingUnits();
  }, [billerId]);

  // Reset pagination when shipping units change
  useEffect(() => {
    setCurrentPage(1);
  }, [shippingUnits.length]);

  // Delete shipping unit
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/billers/deleteShipper`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billerId, shippingUnitId: id }),
      });
      if (!response.ok) throw new Error("Failed to delete shipping unit");
      await fetchShippingUnits();
    } catch (error) {
      console.error("Error deleting shipping unit:", error);
    }
  };

  // Helper to check if credentials object has values
  const hasCredentials = (cred) => {
    return cred.userId.trim() !== "" || cred.password.trim() !== "";
  };

  // Add shipping unit (without initial credentials via main form)
  const handleAddShippingUnit = async () => {
    setAddingData(true)
    try {
      if (!billerId) {
        console.error("Biller ID not found");
        return;
      }

      const payload = {
        billerId,
        shippingUnit: newShippingUnit,
        // Credentials are NOT sent here for initial creation via main form
      };

      const response = await fetch(`${apiUrl}/billers/addShipper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add shipping unit");
      await fetchShippingUnits();

      // Reset form
      handleCloseModal();
    } catch (error) {
      console.error("Error adding shipping unit:", error);
    }
    finally{
      setAddingData(false)
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (
      [
        "shippingUnitName",
        "shippingUnitAddress",
        "shippingEmail",
        "shippingPhone",
      ].includes(name)
    ) {
      setNewShippingUnit((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (["userId", "password"].includes(name)) {
      setCredential((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // --- Handle click for normal details edit ---
  const handleEditDetails = (unit) => {
    setNewShippingUnit({
      shippingUnitName: unit.shippingUnitName || "",
      shippingUnitAddress: unit.shippingUnitAddress || "",
      shippingEmail: unit.shippingEmail || "",
      shippingPhone: unit.shippingPhone || "",
    });
    // Do not set credential state for details edit
    setCredential({ userId: "", password: "" }); // Ensure it's clean
    setEditShippingUnitId(unit._id);
    setEditingUnitName(unit.shippingUnitName || "");
    setEditModeType("details"); // Set mode to 'details'
    setShowAddModal(true);
  };

  // --- Handle click on "Key" icon to manage credentials only ---
  const handleManageCredentials = (unit) => {
    // For credential edit, only pre-fill the name for display and the userId
    setNewShippingUnit({ shippingUnitName: unit.shippingUnitName || "" }); // Just for display context
    setCredential({
      userId: unit.Credential?.userId || "",
      password: "", // Always empty - user must enter new password
    });
    setEditShippingUnitId(unit._id);
    setEditingUnitName(unit.shippingUnitName || "");
    setEditModeType("credentials"); // Set mode to 'credentials'
    setShowAddModal(true);
  };

  // Update the main shipping unit details (WITHOUT credentials)
  const handleUpdateDetails = async () => {
    try {
      if (!billerId || !editShippingUnitId || editModeType !== "details") {
        console.error("Invalid state for details update");
        return;
      }

      // Prepare payload for main shipping unit data update
      const payload = {
        billerId,
        shipperId: editShippingUnitId,
        shippingUnitData: newShippingUnit,
      };

      const response = await fetch(`${apiUrl}/billers/updateshipper`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error("Failed to update shipping unit details");
      await fetchShippingUnits();

      // Reset form and mode
      handleCloseModal();
    } catch (error) {
      console.error("Error updating shipping unit details:", error);
    }
  };

  // Update/Add credentials only
  const handleUpdateCredentials = async () => {
    try {
      if (!billerId || !editShippingUnitId || editModeType !== "credentials") {
        console.error("Invalid state for credential update");
        return;
      }

      // Check if both fields are filled for credential update/add
      if (!hasCredentials(credential)) {
        console.warn(
          "User ID and Password are required to update credentials."
        );
        // Optionally, show a user-friendly message here
        return;
      }

      // Prepare payload for credential modification
      const credPayload = {
        shipperId: editShippingUnitId,
        BillerId: billerId,
        Credential: credential, // Contains userId and password
      };

      const credResponse = await fetch(
        `${apiUrl}/billers/modifyShipperCredentials`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credPayload),
        }
      );

      if (!credResponse.ok) {
        const errorData = await credResponse.json();
        console.error("Credential update failed:", errorData.message);
        // Optionally, show a user-friendly error message
        return; // Stop if credential update fails
      }
      console.log(
        "Credentials updated/added successfully via modifyShipperCredentials"
      );
      await fetchShippingUnits(); // Refresh data after successful credential update

      // Reset form and mode
      handleCloseModal();
    } catch (error) {
      console.error("Error calling modifyShipperCredentials:", error);
    }
  };

  // Handle closing the modal and resetting all related states
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditModeType(null); // Reset mode type
    setEditShippingUnitId(null);
    setEditingUnitName(""); // Reset name
    setNewShippingUnit({
      shippingUnitName: "",
      shippingUnitAddress: "",
      shippingEmail: "",
      shippingPhone: "",
    });
    setCredential({
      userId: "",
      password: "",
    });
  };

  // Determine modal title based on mode
  const getModalTitle = () => {
    if (!editModeType) return "Add New Shipping Unit";
    if (editModeType === "details") return `Edit Details: ${editingUnitName}`;
    if (editModeType === "credentials")
      return `Edit Credentials: ${editingUnitName}`;
    return "Shipping Unit";
  };

  // Determine submit handler based on mode
  const getSubmitHandler = () => {
    if (!editModeType) return handleAddShippingUnit;
    if (editModeType === "details") return handleUpdateDetails;
    if (editModeType === "credentials") return handleUpdateCredentials;
    return handleCloseModal; // Default, should not happen
  };

  // Determine submit button text based on mode
  const getSubmitButtonText = () => {
    if (!editModeType) return "Add";
    return "Update";
  };

  // Pagination logic
  const totalPages = Math.ceil(shippingUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = shippingUnits.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(parseInt(newLimit));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      {/* Simple Centered Title */}
      <div className="w-full mx-auto mb-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center uppercase">
          Shipping Units Management
        </h1>
      </div>

      {/* Header Section */}
      <div className="w-full mx-auto mb-4">
        <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Total Units</span>
                <div className="w-5 h-5 bg-green-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {shippingUnits.length}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // Reset all fields for add
                setNewShippingUnit({
                  shippingUnitName: "",
                  shippingUnitAddress: "",
                  shippingEmail: "",
                  shippingPhone: "",
                });
                setCredential({ userId: "", password: "" });
                setEditModeType(null);
                setEditShippingUnitId(null);
                setEditingUnitName("");
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Add Shipping Unit
            </button>
          </div>
        </div>
      </div>

      {/* Shipping Units Table */}
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '500px' }}>
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                  <p className="text-gray-600 font-medium">Loading shipping units...</p>
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
                      Name
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Address
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Email
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Phone
                    </th>
                    <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {currentItems.length > 0 ? (
                    currentItems.map((unit, index) => (
                      <tr key={unit._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                        <td className="px-2 py-0.5 whitespace-nowrap text-xs font-medium text-gray-900 text-left">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-2 py-0.5 whitespace-nowrap text-xs font-semibold text-gray-900 text-left">
                          {unit.shippingUnitName}
                        </td>
                        <td className="px-2 py-0.5 text-xs text-gray-900 max-w-xs truncate text-left" title={unit.shippingUnitAddress}>
                          {unit.shippingUnitAddress}
                        </td>
                        <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                          {unit.shippingEmail}
                        </td>
                        <td className="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900 text-left">
                          {unit.shippingPhone}
                        </td>
                        <td className="px-2 py-0.5 whitespace-nowrap text-left">
                          <div className="flex items-center space-x-3">
                            {/* Button to manage credentials separately */}
                            <button
                              onClick={() => handleManageCredentials(unit)}
                              className="py-1 transition-all duration-300 hover:scale-110"
                              title="Manage Credentials"
                            >
                              <Key className="w-4 h-4 text-green-600 hover:text-green-700" />
                            </button>
                            {/* Edit main details button */}
                            <button
                              onClick={() => handleEditDetails(unit)}
                              className="py-1 transition-all duration-300 hover:scale-110"
                              title="Edit Details"
                            >
                              <Edit3 className="w-4 h-4 text-black hover:text-gray-800" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Shipping Units Found</h3>
                            <p className="text-gray-600 text-xs">No shipping units found for this biller</p>
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
        {shippingUnits.length > 0 && (
          <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-700">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    aria-label="Select rows per page"
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                  >
                    {availableLimits.map((limit) => (
                      <option key={limit} value={limit}>
                        {limit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-gray-900">{Math.min(endIndex, shippingUnits.length)}</span> of{" "}
                  <span className="font-bold text-gray-900">{shippingUnits.length}</span> entries
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePreviousPage}
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
                  {totalPages > 0 && [...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
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
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  aria-label="Go to next page"
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === totalPages || totalPages <= 1
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

      {/* Add/Edit Shipping Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
            {/* Compact Modal Header */}
            <div className="bg-black p-3 rounded-t-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                    {editModeType === "credentials" ? (
                      <Key className="w-4 h-4 text-gray-800" />
                    ) : (
                      <Building2 className="w-4 h-4 text-gray-800" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {!editModeType ? (
                        <>Add New <span className="font-bold text-green-400">Shipping Unit</span></>
                      ) : editModeType === "details" ? (
                        <>Edit Details: <span className="font-bold text-green-400">{editingUnitName}</span></>
                      ) : (
                        <>Edit Credentials: <span className="font-bold text-yellow-400">{editingUnitName}</span></>
                      )}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-white transform rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
              <div className="space-y-4">
                {/* Credentials Only Mode */}
                {editModeType === "credentials" && (
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                        <Key className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Login Credentials</h3>
                    </div>
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Shipping Unit:</strong> {editingUnitName}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          User ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="userId"
                          value={credential.userId}
                          onChange={handleInputChange}
                          placeholder="Enter User ID"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="password"
                          value={credential.password}
                          onChange={handleInputChange}
                          placeholder="Enter Password"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Details Mode (Add or Edit Details) */}
                {(!editModeType || editModeType === "details") && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                    {/* Shipping Unit Information */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <Building2 className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Shipping Unit Information</h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Shipping Unit Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="shippingUnitName"
                            value={newShippingUnit.shippingUnitName}
                            onChange={handleInputChange}
                            placeholder="Enter shipping unit name"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Address <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="shippingUnitAddress"
                            value={newShippingUnit.shippingUnitAddress}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Enter complete address"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center mr-2">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Contact Information</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="shippingEmail"
                            value={newShippingUnit.shippingEmail}
                            onChange={handleInputChange}
                            placeholder="Enter email address"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-800 mb-0.5">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="shippingPhone"
                            value={newShippingUnit.shippingPhone}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Credentials Section for Add Mode */}
                {!editModeType && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm p-3 mb-4">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center mr-2">
                        <Key className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-blue-900 text-sm">Login Credentials (Optional)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-blue-800 mb-0.5">User ID</label>
                        <input
                          type="text"
                          name="userId"
                          value={credential.userId}
                          onChange={handleInputChange}
                          placeholder="Enter User ID"
                          className="w-full px-2 py-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-blue-800 mb-0.5">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={credential.password}
                          onChange={handleInputChange}
                          placeholder="Enter Password"
                          className="w-full px-2 py-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ultra Compact Warning */}
                <div className="mb-4 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded border-l-4 border-gray-500 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">Important Notice</p>
                      <p className="text-[10px] text-gray-700">
                        {!editModeType
                          ? "Please verify all information. Credentials can be added later if needed."
                          : editModeType === "details"
                            ? "Please verify all information before updating the shipping unit details."
                            : "Both User ID and Password are required to update credentials."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact Modal Footer */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-1.5 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded transition-all duration-200 font-medium border border-gray-300 text-xs shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => getSubmitHandler()()}
                    disabled={editModeType === "credentials" && !hasCredentials(credential) || addingData}
                    className={`px-4 py-1.5 rounded font-semibold transition-all duration-200 flex items-center space-x-1 text-xs shadow-sm hover:shadow-lg ${editModeType === "credentials" && !hasCredentials(credential)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                      : "bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-700 border border-gray-600"
                      }`}
                  >
                    {addingData ? (
    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  ) : (
    <>
      <CheckCircle className="w-3 h-3" />
      <span>{getSubmitButtonText()}</span>
    </>
  )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingUnitsPage;
