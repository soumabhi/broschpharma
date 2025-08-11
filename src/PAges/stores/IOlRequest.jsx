// src/pages/IOLRequestPage.jsx
import React, { useState, useEffect } from "react";
import {
    Plus,
    Edit3,
    Eye,
    Search,
    Package,
    ChevronLeft,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const IOLRequestPage = () => {
    const navigate = useNavigate();
    const [packageRequests, setPackageRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPackageName, setNewPackageName] = useState("");
    // Map of packageName to products (with default power)
    const packageProductMap = {
        "Cataract Surgery Package": [
            { productId: "p1", power: "+20.0 D" },
            { productId: "p2", power: "+21.5 D" },
            { productId: "p5", power: "+22.0 D" },
        ],
        "Premium Vision Package": [
            { productId: "p2", power: "+20.5 D" },
            { productId: "p4", power: "+21.0 D" },
        ],
        "Astigmatism Correction": [
            { productId: "p3", power: "+19.0 D T3.0" },
            { productId: "p6", power: "+20.5 D" },
        ],
        "Refractive Lens Exchange": [
            { productId: "p4", power: "-5.0 D" },
            { productId: "p5", power: "+15.0 D" },
            { productId: "p6", power: "+21.5 D" },
        ],
    };
    const [newProducts, setNewProducts] = useState([]); // [{productId, power}]
    const [submitting, setSubmitting] = useState(false);

    // Fake IOL products data
    const allProducts = [
        { id: "p1", name: "Monofocal IOL", category: "Standard" },
        { id: "p2", name: "Multifocal IOL", category: "Premium" },
        { id: "p3", name: "Toric IOL", category: "Astigmatism" },
        { id: "p4", name: "Accommodating IOL", category: "Premium" },
        { id: "p5", name: "Aspheric IOL", category: "Enhanced Vision" },
        { id: "p6", name: "Blue Light Filtering IOL", category: "Protective" },
    ];

    // Generate fake package requests data
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const fakeData = [
                {
                    id: "1",
                    packageName: "Cataract Surgery Package",
                    products: [
                        { ...allProducts[0], power: "+20.0 D", quantity: 2 },
                        { ...allProducts[1], power: "+21.5 D", quantity: 1 },
                        { ...allProducts[4], power: "+22.0 D", quantity: 3 },
                    ],
                    status: "Pending",
                    quantityRequested: 6,
                    quantityProvided: 0,
                },
                {
                    id: "2",
                    packageName: "Premium Vision Package",
                    products: [
                        { ...allProducts[1], power: "+20.5 D", quantity: 1 },
                        { ...allProducts[3], power: "+21.0 D", quantity: 2 },
                    ],
                    status: "Partial",
                    quantityRequested: 3,
                    quantityProvided: 1,
                },
                {
                    id: "3",
                    packageName: "Astigmatism Correction",
                    products: [
                        { ...allProducts[2], power: "+19.0 D T3.0", quantity: 2 },
                        { ...allProducts[5], power: "+20.5 D", quantity: 2 },
                    ],
                    status: "Completed",
                    quantityRequested: 4,
                    quantityProvided: 4,
                },
                {
                    id: "4",
                    packageName: "Refractive Lens Exchange",
                    products: [
                        { ...allProducts[3], power: "-5.0 D", quantity: 1 },
                        { ...allProducts[4], power: "+15.0 D", quantity: 2 },
                        { ...allProducts[5], power: "+21.5 D", quantity: 1 },
                    ],
                    status: "Pending",
                    quantityRequested: 4,
                    quantityProvided: 0,
                },
            ];
            setPackageRequests(fakeData);
            setLoading(false);
        }, 800);
    }, []);

    // Debounced search effect
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 400);

        return () => clearTimeout(debounceTimer);
    }, [searchInput]);

    // Pagination state
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSizeOptions = [10, 20, 25];

    const filteredPackages = packageRequests.filter(
        (pkg) =>
            pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.products.some((product) =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    const paginatedPackages = filteredPackages.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset to first page if filteredPackages or pageSize changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredPackages.length, pageSize]);

    // When package changes, reset products
    useEffect(() => {
        setNewProducts([]);
        setProductToAdd({ productId: "", power: "" });
    }, [newPackageName]);

    // For adding a product
    const [productToAdd, setProductToAdd] = useState({
        productId: "",
        power: "",
        quantity: "",
    });

    // When productToAdd.productId or newPackageName changes, update power but do not reset productId or quantity
    useEffect(() => {
        if (newPackageName && productToAdd.productId) {
            const pkgProd = packageProductMap[newPackageName]?.find(
                (p) => p.productId === productToAdd.productId
            );
            if (pkgProd && productToAdd.power !== pkgProd.power) {
                setProductToAdd((pt) => ({ ...pt, power: pkgProd.power }));
            }
            if (!pkgProd) {
                setProductToAdd((pt) => ({ ...pt, power: "" }));
            }
        } else if (!productToAdd.productId) {
            setProductToAdd((pt) => ({ ...pt, power: "" }));
        }
    }, [productToAdd.productId, newPackageName]);

    const handleAddProductToList = () => {
        if (
            !productToAdd.productId ||
            !productToAdd.power.trim() ||
            !productToAdd.quantity ||
            isNaN(Number(productToAdd.quantity)) ||
            Number(productToAdd.quantity) <= 0
        )
            return;
        // Prevent duplicate product
        if (newProducts.some((p) => p.productId === productToAdd.productId)) return;
        setNewProducts((prev) => [
            ...prev,
            { ...productToAdd, quantity: Number(productToAdd.quantity) },
        ]);
        setProductToAdd({ productId: "", power: "", quantity: "" });
    };

    const handleRemoveProductFromList = (productId) => {
        setNewProducts((prev) => prev.filter((p) => p.productId !== productId));
    };

    // Allow editing power for each product
    const handleEditProductPower = (productId, newPower) => {
        setNewProducts((prev) =>
            prev.map((p) =>
                p.productId === productId ? { ...p, power: newPower } : p
            )
        );
    };

    const handleAddNewPackage = () => {
        if (!newPackageName) return;
        if (newProducts.length === 0) return;

        setSubmitting(true);
        setTimeout(() => {
            const packageName = newPackageName;
            const products = newProducts
                .map((p) => {
                    const prod = allProducts.find((ap) => ap.id === p.productId);
                    return prod ? { ...prod, power: p.power, quantity: p.quantity } : null;
                })
                .filter(Boolean);
            const quantityRequested = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
            const newPackage = {
                id: `${packageRequests.length + 1}`,
                packageName,
                products,
                status: "Pending",
                quantityRequested,
                quantityProvided: 0,
            };
            setPackageRequests((prev) => [newPackage, ...prev]);
            setNewPackageName("");
            setNewProducts([]);
            setSubmitting(false);
            setShowAddModal(false);
        }, 600);
    };

    const handleViewPackage = (pkg) => {
        navigate("/iol-package-details", {
            state: { packageData: pkg },
        });
    };

    const handleEditPackage = (pkg) => {
        navigate("/iol-package-details", {
            state: {
                packageData: pkg,
                editMode: true,
            },
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "Partial":
                return "bg-blue-100 text-blue-800";
            case "Completed":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Pending":
                return <MoreHorizontal className="w-4 h-4 mr-1" />;
            case "Partial":
                return <ChevronLeft className="w-4 h-4 mr-1" />;
            case "Completed":
                return <CheckCircle className="w-4 h-4 mr-1" />;
            default:
                return null;
        }
    };

    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
            {/* Header */}
            <div className="w-full mx-auto mb-6">
                <div className="flex items-center justify-center mb-4">
                    <div>
                        <h1 className="text-3xl uppercase font-bold text-gray-900">
                            IOL Package Requests
                        </h1>
                    </div>
                </div>

                {/* Filters and Search Section */}
                <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search packages or products..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-72 transition-all duration-200"
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
                                <span className="font-medium text-green-800">
                                    Total Requests
                                </span>
                                <div
                                    className={`flex items-center justify-center font-bold text-white text-[10px] bg-green-800 ${packageRequests.length < 10
                                        ? "w-5 h-5 rounded-full"
                                        : "px-3 h-5 rounded-full"
                                        }`}
                                    style={{
                                        minWidth: packageRequests.length < 10 ? "1.25rem" : "2rem",
                                        borderRadius: "9999px",
                                    }}
                                >
                                    {packageRequests.length}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                <Plus size={16} />
                                New Request
                            </button>
                        </div>
                    </div>
                </div>

                {/* Packages Table */}
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div
                        className="overflow-x-auto"
                        style={{ maxHeight: "calc(100vh - 350px)", minHeight: "500px" }}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800"></div>
                                    <p className="text-gray-600 font-medium">
                                        Loading package requests...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-1 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs w-8" style={{ minWidth: '2rem', width: '2rem', maxWidth: '2.5rem' }}>#</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Requisition No</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Package Name</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Products</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Quantity Requested</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Quantity Processed</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Status</th>
                                        <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {paginatedPackages.length > 0 ? (
                                        paginatedPackages.map((pkg, idx) => {
                                            // Simulate a requisition number (e.g., REQ-20250001, REQ-20250002, ...)
                                            const requisitionNo = pkg.requisitionNo || `REQ-2025${String((currentPage - 1) * pageSize + idx + 1).padStart(4, '0')}`;
                                            return (
                                                <tr
                                                    key={pkg.id}
                                                    className="hover:bg-gray-50 transition-all duration-200"
                                                >
                                                    <td className="px-1 py-1 text-left text-gray-700 font-semibold" style={{ minWidth: '2rem', width: '2rem', maxWidth: '2.5rem' }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                                                    <td className="px-4 py-1 text-left font-mono text-xs text-gray-700 whitespace-nowrap">{requisitionNo}</td>
                                                    <td className="px-4 py-1 whitespace-nowrap text-left">
                                                        <div className="flex items-center">
                                                            <Package className="w-4 h-4 mr-2 text-gray-700" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {pkg.packageName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-1 text-left">
                                                        <div className="group relative">
                                                            <span className="text-sm text-gray-700">
                                                                {truncateText(
                                                                    pkg.products.map((p) => p.name).join(", "),
                                                                    30
                                                                )}
                                                            </span>
                                                            <div className="absolute z-20 invisible group-hover:visible w-64 p-3 text-xs bg-white border border-gray-200 rounded-lg shadow-xl top-full left-0 transform transition-all duration-300">
                                                                <div className="font-medium text-gray-900 mb-1">
                                                                    Included Products:
                                                                </div>
                                                                <ul className="text-gray-700">
                                                                    {pkg.products.map((product, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            className="py-1 border-b border-gray-100 last:border-0"
                                                                        >
                                                                            {product.name} ({product.power})
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-1 text-left font-semibold text-gray-900">{pkg.quantityRequested}</td>
                                                    <td className="px-4 py-1 text-left font-semibold text-gray-900">{pkg.status === "Pending" ? 0 : pkg.quantityProvided}</td>
                                                    <td className="px-4 py-1 text-left">
                                                        <div
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                pkg.status
                                                            )}`}
                                                        >
                                                            {getStatusIcon(pkg.status)}
                                                            {pkg.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-1 whitespace-nowrap text-left">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleViewPackage(pkg)}
                                                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                                title="View Package"
                                                            >
                                                                <Eye className="w-4 h-4 text-gray-700" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                            No Package Requests
                                                        </h3>
                                                        <p className="text-gray-600 text-xs">
                                                            Create your first IOL package request
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

                {/* Pagination Footer */}
                {filteredPackages.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 text-xs">
                                <div className="flex items-center space-x-1">
                                    <span className="font-medium text-gray-700">Rows per page:</span>
                                    <select
                                        value={pageSize}
                                        onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                        className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                                    >
                                        {pageSizeOptions.map((limit) => (
                                            <option key={limit} value={limit}>{limit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                                    Showing <span className="font-bold text-gray-900">{filteredPackages.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, filteredPackages.length)}</span> of <span className="font-bold text-gray-900">{filteredPackages.length}</span> requests
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                                    onClick={() => setCurrentPage(pageNum)}
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
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPackages.length / pageSize), p + 1))}
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

                {/* Add New Package Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
                        <div
                            className="bg-gradient-to-br from-white to-gray-100 rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-300 overflow-hidden"
                            style={{ maxHeight: "90vh", minWidth: "700px" }}
                        >
                            {/* Modal Header */}
                            <div className="bg-black p-4 rounded-t-2xl shadow flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                        <Plus className="w-5 h-5 text-gray-900" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-wide">
                                        Create New IOL Request
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                                >
                                    <XCircle className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div
                                className="p-6 bg-white"
                                style={{ maxHeight: "calc(90vh - 64px)", overflowY: "auto" }}
                            >
                                {/* Package Name Dropdown */}
                                <div className="mb-5">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Package Name
                                    </label>
                                    <select
                                        value={newPackageName}
                                        onChange={(e) => setNewPackageName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-1 focus:ring-gray-700 focus:border-transparent outline-none shadow-sm bg-white text-gray-900"
                                    >
                                        <option value="" disabled>
                                            Select a package
                                        </option>
                                        <option value="Cataract Surgery Package">
                                            Cataract Surgery Package
                                        </option>
                                        <option value="Premium Vision Package">
                                            Premium Vision Package
                                        </option>
                                        <option value="Astigmatism Correction">
                                            Astigmatism Correction
                                        </option>
                                        <option value="Refractive Lens Exchange">
                                            Refractive Lens Exchange
                                        </option>
                                    </select>
                                </div>

                                {/* Add Products Section (select product and power, add/remove) */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Products
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-3">
                                        <select
                                            value={productToAdd.productId}
                                            onChange={(e) =>
                                                setProductToAdd((pt) => ({
                                                    ...pt,
                                                    productId: e.target.value,
                                                }))
                                            }
                                            className="px-3 py-2 border border-gray-400 rounded-lg focus:ring-1 focus:ring-gray-700 focus:border-transparent outline-none bg-white w-48 text-gray-900"
                                            disabled={!newPackageName}
                                        >
                                            <option value="" disabled>
                                                Select product
                                            </option>
                                            {newPackageName &&
                                                packageProductMap[newPackageName] &&
                                                packageProductMap[newPackageName]
                                                    .filter(
                                                        (pkgProd) =>
                                                            !newProducts.some(
                                                                (np) => np.productId === pkgProd.productId
                                                            )
                                                    )
                                                    .map((pkgProd) => {
                                                        const prod = allProducts.find(
                                                            (ap) => ap.id === pkgProd.productId
                                                        );
                                                        return (
                                                            <option
                                                                key={pkgProd.productId}
                                                                value={pkgProd.productId}
                                                            >
                                                                {prod ? prod.name : pkgProd.productId}
                                                            </option>
                                                        );
                                                    })}
                                        </select>
                                        <input
                                            type="text"
                                            value={productToAdd.power}
                                            readOnly
                                            placeholder="Power"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-700 focus:border-transparent outline-none w-40 bg-gray-100 text-gray-700"
                                            disabled={!productToAdd.productId}
                                        />
                                        {/* Quantity input appears when product is selected */}
                                        <input
                                            type="number"
                                            min="1"
                                            value={productToAdd.quantity}
                                            onChange={(e) =>
                                                setProductToAdd((pt) => ({
                                                    ...pt,
                                                    quantity: e.target.value.replace(/^0+/, ""),
                                                }))
                                            }
                                            placeholder="Quantity"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-700 focus:border-transparent outline-none w-28 bg-white text-gray-900"
                                            disabled={!productToAdd.productId}
                                            style={{
                                                display: productToAdd.productId ? undefined : "none",
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddProductToList}
                                            disabled={
                                                !productToAdd.productId ||
                                                !productToAdd.power ||
                                                !productToAdd.quantity ||
                                                isNaN(Number(productToAdd.quantity)) ||
                                                Number(productToAdd.quantity) <= 0 ||
                                                newProducts.some(
                                                    (p) => p.productId === productToAdd.productId
                                                )
                                            }
                                            className={`px-4 py-2 rounded-lg font-semibold text-white flex items-center shadow transition-all duration-200 ${!productToAdd.productId ||
                                                !productToAdd.power ||
                                                !productToAdd.quantity ||
                                                isNaN(Number(productToAdd.quantity)) ||
                                                Number(productToAdd.quantity) <= 0 ||
                                                newProducts.some(
                                                    (p) => p.productId === productToAdd.productId
                                                )
                                                ? "bg-gray-300 cursor-not-allowed"
                                                : "bg-gradient-to-r from-gray-900 to-gray-700 hover:from-black hover:to-gray-800"
                                                }`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {/* List of added products - scrollable if more than 5, table layout */}
                                    <div
                                        className={`border border-gray-200 rounded-lg bg-gray-50 p-2 ${newProducts.length > 5
                                            ? "max-h-48 overflow-y-auto scrollbar-hide"
                                            : ""
                                            }`}
                                    >
                                        {newProducts.length > 0 ? (
                                            <>
                                                <div className="font-medium text-xs text-gray-800 mb-2">
                                                    Selected Products:
                                                </div>
                                                <table className="w-full text-xs table-fixed">
                                                    <thead>
                                                        <tr className="bg-gray-100">
                                                            <th className="font-semibold text-gray-700 py-1 px-2 w-1/12 text-left">#</th>
                                                            <th className="font-semibold text-gray-700 py-1 px-2 w-2/5 text-left">
                                                                Product
                                                            </th>
                                                            <th className="font-semibold text-gray-700 py-1 px-2 w-1/4 text-left">
                                                                Power
                                                            </th>
                                                            <th className="font-semibold text-gray-700 py-1 px-2 w-1/6 text-left">
                                                                Quantity
                                                            </th>
                                                            <th className="font-semibold text-gray-700 py-1 px-2 w-1/6 text-left">
                                                                Remove
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {newProducts.map((p, idx) => {
                                                            const prod = allProducts.find(
                                                                (ap) => ap.id === p.productId
                                                            );
                                                            return (
                                                                <tr
                                                                    key={p.productId}
                                                                >
                                                                    <td className="py-0 px-2 text-gray-700 text-left font-semibold">{idx + 1}</td>
                                                                    <td className="py-0 px-2 text-gray-900 truncate text-left">
                                                                        {prod ? prod.name : p.productId}
                                                                    </td>
                                                                    <td className="py-0 px-2 text-left text-gray-700">
                                                                        {p.power}
                                                                    </td>
                                                                    <td className="py-0 px-2 text-gray-700 font-semibold text-left">
                                                                        {p.quantity}
                                                                    </td>
                                                                    <td className="py-0 px-2 text-left">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleRemoveProductFromList(p.productId)
                                                                            }
                                                                            className="text-xs text-gray-500 hover:text-black  py-1 rounded transition-all text-left"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </>
                                        ) : (
                                            <div className="text-xs text-gray-400 text-center py-4">
                                                Select a package and add products.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-800 bg-gradient-to-r from-gray-100 to-gray-300 hover:from-gray-200 hover:to-gray-400 rounded-lg font-medium border border-gray-300 text-sm shadow"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddNewPackage}
                                        disabled={
                                            submitting || !newPackageName || newProducts.length === 0
                                        }
                                        className={`px-4 py-2 rounded-lg font-semibold text-white flex items-center shadow transition-all duration-200 ${submitting || !newPackageName || newProducts.length === 0
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-gradient-to-r from-gray-900 to-gray-700 hover:from-black hover:to-gray-800"
                                            }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Request"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IOLRequestPage;
