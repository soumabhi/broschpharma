// /components/StoreSelector.jsx
import React from "react";
import { Building } from "lucide-react";

const StoreSelector = ({ stores, onSelectStore }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
      <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
        Select Your Store
      </h2>
      <div className="space-y-3">
        {stores.length > 0 ? (
          stores.map((store) => (
            <button
              key={store._id}
              onClick={() => onSelectStore(store)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center space-x-3"
            >
              <Building className="h-4 w-4 text-gray-600" />
              <span>{store.name}</span>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center">No stores available.</p>
        )}
      </div>
    </div>
  );
};

export default StoreSelector;
