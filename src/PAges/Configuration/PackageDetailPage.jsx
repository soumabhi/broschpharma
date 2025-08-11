// src/pages/PackageDetailsPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Edit3, X, Package, Eye, ChevronLeft } from "lucide-react";

const PackageDetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { packageData } = location.state || {};
    const [products, setProducts] = useState(packageData ? packageData.products : []);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSizeOptions = [10, 20, 25];

    // Debounced search effect
    React.useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setSearchTerm(searchInput);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(debounceTimer);
    }, [searchInput]);

    // Reset to first page if products or pageSize changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [products.length, pageSize]);

    const filteredProducts = products.filter(prod =>
        prod.product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.power?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [newProduct, setNewProduct] = useState({ productName: '', power: '' });
    const [submitting, setSubmitting] = useState(false);

    if (!packageData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Package Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested IOL package could not be found.</p>
                    <button
                        onClick={() => navigate('/package')}
                        className="bg-gradient-to-r from-gray-800 to-black text-white px-5 py-2 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                        <Eye className="w-4 h-4" /> Back to Packages
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4">
            <div className="w-full mx-auto">

                {/* Header */}
                {/* Header */}
                <div className="w-full mx-auto mb-6 text-center">
                    <div className="flex items-center justify-center mb-2 relative">
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute left-0 flex items-center px-3 py-2 text-gray-700 hover:text-black bg-white rounded-lg shadow border border-gray-200 transition-all"
                            title="Back"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" />
                            <span className="hidden sm:inline text-xs font-medium">Back</span>
                        </button>
                        <h1 className="text-3xl uppercase font-bold text-gray-900">
                            {packageData.packageName}
                        </h1>
                    </div>
                </div>

                {/* Filters and Actions Section */}
                <div className="w-full mx-auto mb-4">
                    <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search product or power..."
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        aria-label="Search products"
                                        className="pl-3 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-none focus:ring-gray-500 focus:border-transparent bg-white shadow-sm w-64 transition-all duration-200"
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
                                    <span className="font-medium text-green-800">Total Products</span>
                                    <div className="flex items-center justify-center font-bold text-white text-xs bg-green-800 px-2 py-0.5 rounded-full">
                                        {products.length}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setNewProduct({ productName: '', power: '' });
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <Plus size={16} /> Add Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Table Section */}
                <div className="w-full mx-auto">
                    <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '470px' }}>
                            <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">#</th>
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Product Name</th>
                                        {/* Removed Category and Material columns */}
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Power</th>
                                        <th className="px-2 py-1 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {paginatedProducts.length > 0 ? (
                                        paginatedProducts.map((prod, idx) => (
                                            <tr key={idx + (currentPage - 1) * pageSize} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                                                <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs text-left">{(currentPage - 1) * pageSize + idx + 1}</td>
                                                <td className="px-2 py-1 whitespace-nowrap text-xs font-semibold text-gray-900 text-left">{prod.product.productName}</td>
                                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-left">{prod.power}</td>
                                                <td className="px-2 py-1 whitespace-nowrap text-left">
                                                    <div className="flex space-x-1">
                                                        <button
                                                            onClick={() => {
                                                                setIsEditMode(true);
                                                                setEditIndex((currentPage - 1) * pageSize + idx);
                                                                setNewProduct({
                                                                    productName: prod.product.productName,
                                                                    power: prod.power
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-black" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const globalIdx = (currentPage - 1) * pageSize + idx;
                                                                setProducts(prev => prev.filter((_, i) => i !== globalIdx));
                                                            }}
                                                            className="p-1.5 bg-red-100 hover:bg-red-200 rounded transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <X className="w-4 h-4 text-red-500" />
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
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Products Found</h3>
                                                        <p className="text-gray-600 text-xs">No IOL products in this package yet.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {filteredProducts.length > 0 && (
                        <div className="mt-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-xl shadow-md border border-gray-200 p-4">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                <div className="flex items-center space-x-3 text-xs">
                                    <div className="flex items-center space-x-1">
                                        <span className="font-medium text-gray-700">Rows per page:</span>
                                        <select
                                            value={pageSize}
                                            onChange={e => { setCurrentPage(1); setPageSize(parseInt(e.target.value)); }}
                                            className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm"
                                        >
                                            {pageSizeOptions.map(limit => (
                                                <option key={limit} value={limit}>{limit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                                        Showing <span className="font-bold text-gray-900">{filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to {" "}
                                        <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of {" "}
                                        <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === 1
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                            : "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    <div className="flex space-x-1">
                                        {[...Array(Math.ceil(filteredProducts.length / pageSize))].map((_, i) => {
                                            const pageNum = i + 1;
                                            const totalPages = Math.ceil(filteredProducts.length / pageSize);
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
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === Math.ceil(filteredProducts.length / pageSize)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${currentPage === Math.ceil(filteredProducts.length / pageSize)
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

                {/* Add Product Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-gray-300">
                            <div className="bg-black p-3 rounded-t-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                                            <Package className="w-4 h-4 text-gray-800" />
                                        </div>
                                        <h2 className="text-lg font-medium text-white">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-all"
                                    >
                                        <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        setSubmitting(true);
                                        setTimeout(() => {
                                            if (isEditMode && editIndex !== null) {
                                                setProducts(prev => prev.map((p, i) => i === editIndex ? {
                                                    product: { productName: newProduct.productName },
                                                    power: newProduct.power
                                                } : p));
                                            } else {
                                                setProducts(prev => [
                                                    ...prev,
                                                    {
                                                        product: {
                                                            productName: newProduct.productName
                                                        },
                                                        power: newProduct.power,
                                                    },
                                                ]);
                                            }
                                            setIsModalOpen(false);
                                            setNewProduct({ productName: '', power: '' });
                                            setSubmitting(false);
                                            setIsEditMode(false);
                                            setEditIndex(null);
                                        }, 500);
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-800 mb-1">Product Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newProduct.productName}
                                            onChange={e => setNewProduct(p => ({ ...p, productName: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                                            placeholder="e.g., Monofocal IOL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-800 mb-1">Power <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newProduct.power}
                                            onChange={e => setNewProduct(p => ({ ...p, power: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
                                            placeholder="e.g., +20.0 D"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setIsEditMode(false);
                                                setEditIndex(null);
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
                                                    {isEditMode ? 'Saving...' : 'Adding...'}
                                                </>
                                            ) : (
                                                <>
                                                    {isEditMode ? <Edit3 className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                                                    {isEditMode ? 'Save Changes' : 'Add Product'}
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
        </div>
    );
};

export default PackageDetailsPage;