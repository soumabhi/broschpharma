// src/pages/PackageMasterPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, X, Package, Search, Eye, Scissors, Activity, Disc, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const PackageMasterPage = () => {
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPackageId, setCurrentPackageId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        packageName: "",
        description: "",
        products: [{ product: "", power: "" }],
    });

    // Fake IOL product data
    const allProducts = [
        { _id: "p1", productName: "Monofocal IOL", category: "Standard", material: "Acrylic" },
        { _id: "p2", productName: "Multifocal IOL", category: "Premium", material: "Hydrophobic Acrylic" },
        { _id: "p3", productName: "Toric IOL", category: "Astigmatism", material: "Silicone" },
        { _id: "p4", productName: "Accommodating IOL", category: "Premium", material: "Hydrogel" },
        { _id: "p5", productName: "Aspheric IOL", category: "Enhanced Vision", material: "PMMA" },
        { _id: "p6", productName: "Blue Light Filtering IOL", category: "Protective", material: "Acrylic" },
        { _id: "p7", productName: "Piggyback IOL", category: "Specialized", material: "Acrylic" },
        { _id: "p8", productName: "Phakic IOL", category: "Refractive", material: "Collamer" },
    ];

    // Generate fake package data for eye hospital
    const generateFakeData = useCallback(() => {
        return [
            {
                _id: "1",
                packageName: "Standard Cataract Package",
                description: "Basic package for routine cataract surgery",
                products: [
                    { product: allProducts[0], power: "+20.0 D" },
                    { product: allProducts[0], power: "+21.0 D" },
                    { product: allProducts[0], power: "+22.0 D" },
                ]
            },
            {
                _id: "2",
                packageName: "Premium Vision Package",
                description: "Advanced lenses for enhanced visual outcomes",
                products: [
                    { product: allProducts[1], power: "+20.5 D" },
                    { product: allProducts[1], power: "+21.5 D" },
                    { product: allProducts[4], power: "+22.0 D" },
                ]
            },
            {
                _id: "3",
                packageName: "Astigmatism Correction Package",
                description: "Toric lenses for patients with corneal astigmatism",
                products: [
                    { product: allProducts[2], power: "+19.0 D T3.0" },
                    { product: allProducts[2], power: "+20.0 D T4.5" },
                    { product: allProducts[2], power: "+21.0 D T6.0" },
                ]
            },
            {
                _id: "4",
                packageName: "Refractive Lens Exchange Package",
                description: "For patients seeking refractive correction",
                products: [
                    { product: allProducts[7], power: "-5.0 D" },
                    { product: allProducts[7], power: "-10.0 D" },
                    { product: allProducts[7], power: "+15.0 D" },
                ]
            },
            {
                _id: "5",
                packageName: "Blue Light Protection Package",
                description: "Lenses with blue light filtering technology",
                products: [
                    { product: allProducts[5], power: "+20.5 D" },
                    { product: allProducts[5], power: "+21.5 D" },
                ]
            },
            {
                _id: "6",
                packageName: "Complex Case Package",
                description: "For challenging surgical cases",
                products: [
                    { product: allProducts[3], power: "+18.0 D" },
                    { product: allProducts[6], power: "+22.0 D" },
                    { product: allProducts[2], power: "+20.0 D T5.0" },
                ]
            },
        ];
    }, []);

    // Pagination state
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSizeOptions = [10, 20, 25];
    const filteredPackages = packageData.filter(pkg =>
        pkg.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginatedPackages = filteredPackages.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Initialize with fake data
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setPackageData(generateFakeData());
            setLoading(false);
        }, 800);
    }, [generateFakeData]);

    // Debounced search effect
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setSearchTerm(searchInput);
            setCurrentPage(1);
        }, 400);

        return () => clearTimeout(debounceTimer);
    }, [searchInput]);

    // Reset to first page if packageData or pageSize changes
    useEffect(() => {
        setCurrentPage(1);
    }, [packageData.length, pageSize]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updatedProducts = [...prev.products];
            updatedProducts[index] = {
                ...updatedProducts[index],
                [name]: value
            };
            return {
                ...prev,
                products: updatedProducts
            };
        });
    };

    const handleAddProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { product: "", power: "" }]
        }));
    };

    const handleRemoveProduct = (index) => {
        if (formData.products.length > 1) {
            setFormData(prev => ({
                ...prev,
                products: prev.products.filter((_, i) => i !== index)
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            packageName: "",
            description: "",
            products: [{ product: "", power: "" }],
        });
        setIsEditMode(false);
        setCurrentPackageId(null);
    };

    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // In a real app, this would be an API call
            setTimeout(() => {
                if (isEditMode) {
                    toast.success("Package updated successfully!");
                } else {
                    toast.success("Package created successfully!");
                    // Add new package to state
                    const newPackage = {
                        _id: `${packageData.length + 1}`,
                        ...formData,
                        products: formData.products.map(p => ({
                            ...p,
                            product: allProducts.find(prod => prod._id === p.product)
                        }))
                    };
                    setPackageData(prev => [...prev, newPackage]);
                }
                setIsModalOpen(false);
                resetForm();
                setSubmitting(false);
            }, 800);
        } catch (error) {
            console.error("Error saving package:", error);
            setSubmitting(false);
        }
    };

    const handleEdit = (pkg) => {
        setFormData({
            packageName: pkg.packageName,
            description: pkg.description || "",
            products: pkg.products.map(prod => ({
                product: prod.product._id,
                power: prod.power
            }))
        });
        setCurrentPackageId(pkg._id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleView = (pkg) => {
        navigate(`/package-details/${pkg._id}`, {
            state: {
                packageData: pkg
            }
        });
    };

    const handlePaginationChange = (newPage, newPageSize) => {
        setCurrentPage(newPage);
        setPageSize(newPageSize);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4">
            {/* Header */}
            <div className="w-full mx-auto mb-6 text-center">
                <div className="flex items-center justify-center mb-2">

                    <h1 className="text-3xl uppercase font-bold text-gray-900">
                        IOL Package Management
                    </h1>
                </div>
            </div>

            {/* Filters and Search Section */}
            <div className="w-full mx-auto mb-4">
                <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search packages by name or description..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    aria-label="Search IOL packages"
                                    className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-none focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-72 transition-all duration-200"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => setSearchInput("")}
                                        type="button"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium text-green-800">Total Packages</span>
                                <div className="flex items-center justify-center font-bold text-white text-xs bg-green-800 px-2 py-0.5 rounded-full">
                                    {packageData.length}
                                </div>
                            </div>
                            <button
                                onClick={handleAddNew}
                                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                <Plus size={16} />
                                New Package
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Table */}
            <div className="w-full mx-auto">
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '500px' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64 bg-white">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                                    <p className="text-gray-600 font-medium">Loading IOL package data...</p>
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
                                            Package Name
                                        </th>
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                                            Description
                                        </th>
                                        {/* <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                                            Products
                                        </th> */}
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {paginatedPackages.length > 0 ? (
                                        paginatedPackages.map((pkg, index) => (
                                            <tr
                                                key={pkg._id}
                                                className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
                                            >
                                                <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs text-left">
                                                    {(currentPage - 1) * pageSize + index + 1}
                                                </td>
                                                <td className="px-2 py-1 whitespace-nowrap">
                                                    <div className="text-xs font-semibold text-gray-900 flex items-center">
                                                        <Package className="w-4 h-4 mr-1 text-gray-800" />
                                                        {pkg.packageName}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-xs text-left text-gray-900 max-w-xs">
                                                    <span
                                                        title={pkg.description}
                                                        className="cursor-help hover:underline hover:text-green-700 transition-colors"
                                                    >
                                                        {pkg.description && pkg.description.length > 50
                                                            ? pkg.description.slice(0, 50) + '...'
                                                            : pkg.description}
                                                    </span>
                                                </td>
                                                {/* <td className="px-2 py-1 text-xs">
                                                    <div className="flex flex-wrap gap-1">
                                                        {pkg.products.slice(0, 3).map((prod, i) => (
                                                            <span key={i} className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded text-[10px]">
                                                                {prod.product.productName} ({prod.power})
                                                            </span>
                                                        ))}
                                                        {pkg.products.length > 3 && (
                                                            <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[10px]">
                                                                +{pkg.products.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td> */}
                                                <td className="px-2 py-1 whitespace-nowrap text-left">
                                                    <div className="flex space-x-1">
                                                        <button
                                                            onClick={() => handleView(pkg)}
                                                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4 text-gray-800" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(pkg)}
                                                            className="p-1.5 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                                                            title="Edit Package"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-black" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Packages Found</h3>
                                                        <p className="text-gray-600 text-xs">No IOL packages match your current search criteria.</p>
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

                {/* Pagination */}
                {filteredPackages.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 text-xs">
                                <div className="flex items-center space-x-1">
                                    <span className="font-medium text-gray-700">Rows per page:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => handlePaginationChange(1, parseInt(e.target.value))}
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
                                    Showing <span className="font-bold text-gray-900">{filteredPackages.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{" "}
                                    <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, filteredPackages.length)}</span> of{" "}
                                    <span className="font-bold text-gray-900">{filteredPackages.length}</span> packages
                                </div>
                            </div>

                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handlePaginationChange(currentPage - 1, pageSize)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                        : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        }`}
                                >
                                    Previous
                                </button>

                                <div className="flex space-x-1">
                                    {[...Array(Math.ceil(filteredPackages.length / pageSize))].map((_, i) => {
                                        const pageNum = i + 1;
                                        const totalPages = Math.ceil(filteredPackages.length / pageSize);
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePaginationChange(pageNum, pageSize)}
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
                                    disabled={currentPage === Math.ceil(filteredPackages.length / pageSize)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === Math.ceil(filteredPackages.length / pageSize)
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

            {/* Add/Edit Package Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
                        <div className="bg-black p-3 rounded-t-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                                        <Package className="w-4 h-4 text-gray-800" />
                                    </div>
                                    <h2 className="text-lg font-medium text-white">
                                        {isEditMode ? "Edit IOL Package" : "Create New IOL Package"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-all"
                                >
                                    <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-800 mb-1">
                                            Package Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="packageName"
                                            value={formData.packageName}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Premium Vision Package"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-800 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={2}
                                            placeholder="Describe the package purpose and contents"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center">
                                            <Activity className="w-4 h-4 mr-2 text-gray-800" />
                                            IOL Products in Package
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleAddProduct}
                                            className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-black flex items-center"
                                        >
                                            <Plus size={14} className="mr-1" /> Add Product
                                        </button>
                                    </div>

                                    {formData.products.map((product, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 bg-white rounded border border-gray-200">
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-800 mb-1">
                                                    IOL Product <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="product"
                                                    value={product.product}
                                                    onChange={(e) => handleProductChange(index, e)}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select an IOL</option>
                                                    {allProducts.map(prod => (
                                                        <option key={prod._id} value={prod._id}>
                                                            {prod.productName} ({prod.category})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-medium text-gray-800 mb-1">
                                                    Power <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="power"
                                                    value={product.power}
                                                    onChange={(e) => handleProductChange(index, e)}
                                                    placeholder="e.g., +20.5 D"
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex items-end justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProduct(index)}
                                                    disabled={formData.products.length <= 1}
                                                    className={`p-1.5 rounded ${formData.products.length <= 1
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-red-500 hover:bg-red-100"
                                                        }`}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded font-medium border border-gray-300 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-4 py-2 rounded font-semibold text-white flex items-center ${submitting
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                                            : "bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 border border-gray-600"
                                            }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                {isEditMode ? "Update Package" : "Create Package"}
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

export default PackageMasterPage;