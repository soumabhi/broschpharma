import React, { useState, useRef, useEffect } from "react";
import { X, Pencil, Filter } from "lucide-react";

const MedicineProductMaster = () => {
  // State declarations
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([
    "medicineName",
    "brandName",
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    medicineName: "",
    brandName: "",
    schedule: "",
    type: "Tablet",
    pts: "",
    MRP: "",
    packingUnit: "",
    sp: "",
    gst: "",
    hsnCode: "",
    composition: "",
    description: "",
  });

  const filterRef = useRef(null);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Enforce 2-digit decimal for pts and sp
    if ((name === "pts" || name === "sp") && value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      if (decPart.length > 2) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (editIndex !== null) {
      const updated = [...products];
      updated[editIndex] = formData;
      setProducts(updated);
    } else {
      setProducts([...products, formData]);
    }

    setFormData({
      medicineName: "",
      brandName: "",
      type: "",
      schedule: "",
      description: "",
      pts: "",
      MRP: "",
      packingUnit: "",
      sp: "",
      gst: "",
      hsnCode: "",
      composition: "",
    });
    setEditIndex(null);
    setModalOpen(false);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData(products[index]);
    setModalOpen(true);
  };

  // Filter products based on search term and selected filters
  const filteredProducts = products.filter((product) => {
    const lowerSearch = searchTerm.toLowerCase();

    if (!searchTerm) return true;

    return selectedFilters.some((filter) => {
      const value = product[filter]?.toString().toLowerCase() || "";
      return value.includes(lowerSearch);
    });
  });

  // Available filter options
  const filterOptions = [
    { id: "medicineName", label: "Medicine Name" },
    { id: "brandName", label: "Brand Name" },
    { id: "type", label: "Type" },
    { id: "hsnCode", label: "HSN Code" },
    { id: "composition", label: "Composition" },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Medicine Product Master</h1>
          <p className="text-sm text-gray-600">
            Manage all medicines product specifications and pricing information
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          + Add Medicine
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-2 px-3 py-2 rounded-md flex-grow border-gray-300 focus:border-blue-500 focus:outline-none"
        />

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="p-2 border bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>

          {showFilter && (
            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Filter Options</h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {filterOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(option.id)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...selectedFilters, option.id]
                          : selectedFilters.filter(
                              (item) => item !== option.id
                            );
                        setSelectedFilters(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setSelectedFilters([])}
                  className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicine Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HSN Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Composition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PTS (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MRP (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SP (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GST (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.medicineName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.brandName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.hsnCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.schedule}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    <div className="relative group">
                      <span className="truncate block">
                        {item.composition?.length > 30
                          ? `${item.composition.substring(0, 30)}...`
                          : item.composition}
                      </span>
                      {item.composition?.length > 30 && (
                        <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 w-64 top-full left-0 mt-1 shadow-lg">
                          {item.composition}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.pts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.MRP}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.sp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.gst}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No medicines found.{" "}
                  {searchTerm && `No results for "${searchTerm}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setModalOpen(false);
                setEditIndex(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-semibold mb-6">
              {editIndex !== null ? "Edit Product" : "Add New Medicine"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Name */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  Brand Name
                </label>
                <select
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">-- Select Brand Name --</option>
                  <option value="Cipla">Cipla</option>
                  <option value="Sun Pharma">Sun Pharma</option>
                  <option value="Dr. Reddy's">Dr. Reddy's</option>
                  <option value="Mankind">Mankind</option>
                  <option value="Abbott">Abbott</option>
                </select>
              </div>

              {/* Medicine Name */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  Medicine Name
                </label>
                <input
                  type="text"
                  name="medicineName"
                  value={formData.medicineName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter medicine name"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium mb-1 text-left">
                  Schedule
                </label>
                <select
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Schedule --</option>
                  <option
                    value="Schedule H"
                    title="Prescription drugs: Cannot be sold without a prescription from a registered medical practitioner. Antibiotics, anti-depressants, steroids, etc."
                  >
                    Schedule H
                  </option>
                  <option
                    value="Schedule H1"
                    title="Highly regulated prescription drugs. Sale must be recorded in a register. Includes anti-TB drugs, cefixime, Zolpidem, etc."
                  >
                    Schedule H1
                  </option>
                  <option
                    value="Schedule X"
                    title="Narcotic & psychotropic substances. Requires duplicate prescription, license to sell, and recordkeeping."
                  >
                    Schedule X
                  </option>
                  <option
                    value="Schedule G"
                    title="Drugs to be taken under medical supervision. Must carry a cautionary label."
                  >
                    Schedule G
                  </option>
                  <option
                    value="Schedule M"
                    title="GMP guidelines for pharmaceuticals and medical devices."
                  >
                    Schedule M
                  </option>
                  <option
                    value="Schedule M1"
                    title="GMP guidelines for cosmetics."
                  >
                    Schedule M1
                  </option>
                  <option
                    value="Schedule K"
                    title="Exemptions for some drugs and dealers from certain manufacturing/sale provisions."
                  >
                    Schedule K
                  </option>
                  <option
                    value="Schedule P"
                    title="Specifies the life period (shelf life) of drugs."
                  >
                    Schedule P
                  </option>
                  <option
                    value="Schedule P1"
                    title="Preservation conditions and storage requirements."
                  >
                    Schedule P1
                  </option>
                  <option
                    value="Schedule C & C1"
                    title="Biological products like vaccines, sera, toxins, requiring special conditions."
                  >
                    Schedule C & C1
                  </option>
                  <option
                    value="Schedule D"
                    title="Import requirements for drugs, including bulk drugs."
                  >
                    Schedule D
                  </option>
                  <option
                    value="Schedule Y"
                    title="Guidelines for clinical trials, new drug approvals, and pharmacovigilance."
                  >
                    Schedule Y
                  </option>
                  <option
                    value="Schedule Z"
                    title="Related to post-marketing surveillance (under proposal)."
                  >
                    Schedule Z
                  </option>
                </select>
              </div>

              {/* Type Dropdown (Editable) */}
              <div>
                <label className=" block text-sm font-medium mb-1 text-left">
                  Type
                </label>
                <input
                  list="type-options"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="Select or type medicine type"
                  className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="type-options">
                  <option value="Tablet" />
                  <option value="Capsule" />
                  <option value="Syrup" />
                  <option value="Injection" />
                  <option value="Eye Drop" />
                  <option value="Ointment" />
                  <option value="Sachet" />
                  <option value="Gel" />
                  <option value="Spray" />
                  <option value="Cream" />
                  <option value="ORS Power" />
                  <option value="Vaccine" />
                  <option value="Sanitizer" />
                  <option value="Other" />
                </datalist>
              </div>

             

              {/* PTS */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  Price to Stockist (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="pts"
                  value={formData.pts}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="MRP"
                  value={formData.MRP}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>

              {/* SP */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="sp"
                  value={formData.sp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>

              {/* GST */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  GST (%)
                </label>
                <input
                  type="number"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0"
                />
              </div>

              {/* Packing Unit */}
              <div>
                <label className=" block text-sm font-medium mb-1 text-left">
                  Packing Unit
                </label>
                <input
                  list="packingUnits"
                  name="packingUnit"
                  value={formData.packingUnit}
                  onChange={handleChange}
                  placeholder="Select or enter unit"
                  className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="packingUnits">
                  <option value="0.5 ML" />
                  <option value="1 GM" />
                  <option value="1 LTR" />
                  <option value="1 ML" />
                  <option value="1 PAIR" />
                  <option value="1 PC" />
                  <option value="1 PKT" />
                  <option value="1 REEL" />
                  <option value="2.5 ML" />
                  <option value="3 GM" />
                  <option value="4 TAB" />
                  <option value="4.2 GM" />
                  <option value="5 GM" />
                  <option value="5 ML" />
                  <option value="7 S" />
                  <option value="10 CAP" />
                  <option value="10 ML" />
                  <option value="10 PKT" />
                  <option value="10 TAB" />
                  <option value="12 PC" />
                  <option value="15 CAP" />
                  <option value="15 GM" />
                  <option value="15 ML" />
                  <option value="15 TAB" />
                  <option value="20 GM" />
                  <option value="20 ML" />
                  <option value="20 TAB" />
                  <option value="25 TAB" />
                  <option value="28 TAB" />
                  <option value="30 ML" />
                  <option value="30 TAB" />
                  <option value="50 ML" />
                  <option value="60 ML" />
                  <option value="80 GM" />
                  <option value="100 ML" />
                  <option value="100 TAB" />
                  <option value="120 TAB" />
                  <option value="150 ML" />
                  <option value="200 GM" />
                  <option value="200 ML" />
                  <option value="250 ML" />
                  <option value="300 ML" />
                  <option value="400 GM" />
                  <option value="500 GM" />
                  <option value="500 ML" />
                  <option value="VIAL" />
                </datalist>
              </div>

              {/* HSN Code */}
              <div>
                <label className="text-left block text-sm font-medium mb-2 text-gray-700">
                  HSN Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter HSN code"
                />
              </div>

              {/* Composition */}
              <div className="text-left md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Composition
                </label>
                <textarea
                  name="composition"
                  value={formData.composition}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Chemical composition of the medicine"
                />
              </div>

              {/* Description */}
              <div className="text-left md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Additional information about the medicine"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditIndex(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editIndex !== null ? "Update Product" : "Add Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineProductMaster;
