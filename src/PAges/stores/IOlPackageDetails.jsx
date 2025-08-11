// src/pages/PackageDetailsPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, Eye, ChevronLeft, Edit3, Trash2, Plus, Save, X } from "lucide-react";

const PackageDetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { packageData, editMode } = location.state || {};
    const [products, setProducts] = useState(packageData?.products || []);
    const [isEditing, setIsEditing] = useState(editMode || false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", power: "" });

    // Available products for selection
    const allProducts = [
        { id: "p1", name: "Monofocal IOL", category: "Standard" },
        { id: "p2", name: "Multifocal IOL", category: "Premium" },
        { id: "p3", name: "Toric IOL", category: "Astigmatism" },
        { id: "p4", name: "Accommodating IOL", category: "Premium" },
        { id: "p5", name: "Aspheric IOL", category: "Enhanced Vision" },
        { id: "p6", name: "Blue Light Filtering IOL", category: "Protective" },
    ];

    if (!packageData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Package Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested IOL package could not be found.</p>
                    <button
                        onClick={() => navigate('/iol-request')}
                        className="bg-gradient-to-r from-gray-800 to-black text-white px-5 py-2 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Requests
                    </button>
                </div>
            </div>
        );
    }

    const handleEditProduct = (product) => {
        setEditingProduct(product);
    };

    const handleSaveEdit = () => {
        setProducts(prev => prev.map(p =>
            p.id === editingProduct.id ? editingProduct : p
        ));
        setEditingProduct(null);
    };

    const handleDeleteProduct = (productId) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.power) return;

        const selectedProduct = allProducts.find(p => p.name === newProduct.name);
        const newProductObj = {
            ...selectedProduct,
            power: newProduct.power
        };

        setProducts(prev => [...prev, newProductObj]);
        setNewProduct({ name: "", power: "" });
        setShowAddModal(false);
    };

    const handleSavePackage = () => {
        // In a real app, this would save to backend
        navigate('/', { state: { updatedPackage: { ...packageData, products } } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 w-full">
            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/iol-request')}
                        className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Requests
                    </button>

                    <div className="flex items-start justify-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center uppercase">
                                {packageData.packageName}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-2 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs w-8" style={{ minWidth: '2rem', width: '2rem', maxWidth: '2.5rem' }}>#</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Product Name</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Power</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-800 uppercase tracking-wide text-xs">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length > 0 ? (
                                    products.map((product, idx) => (
                                        <tr
                                            key={product.id || idx}
                                            className="hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <td className="px-2 py-3 text-left text-gray-700 font-semibold">{idx + 1}</td>
                                            <td className="px-4 py-3 text-left">
                                                <div className="text-sm font-medium text-gray-900 text-left">{product.name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-left">
                                                <div className="text-sm text-gray-700 text-left">{product.power}</div>
                                            </td>
                                            <td className="px-4 py-3 text-left">
                                                <div className="text-sm text-gray-700 text-left">{product.quantity || 1}</div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No Products Added</h3>
                                                    <p className="text-gray-600 text-xs">No products in this package</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetailsPage;