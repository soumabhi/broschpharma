import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Settings,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building2,
  ShoppingCart,
  Pill,
  Eye,
  Factory,
  Receipt,
  Boxes,
  Users,
} from "lucide-react";

const menuItems = [
  {
    icon: <Receipt size={18} />,
    id: "dashboard",
    label: "Dashboard",
    path: "/",
  },
  {
    id: "BillingEntity",
    label: "Billing Entities",
    icon: <Receipt size={18} />,
    permissions: ["BillingEntityMed", "BillingEntity"],
    subItems: [
      {
        id: "billing-entity",
        label: "IOL Billing",
        path: "/BillingUnit",
        icon: <Eye size={16} />,
        permissions: ["BillingEntity"],
      },
      // {
      //   id: "medicine-billing",
      //   label: "Medicine Billing",
      //   path: "/medicinebilling",
      //   icon: <Pill size={16} />,
      //   permissions: ["BillingEntityMed"],
      // },
    ],
  },
  {
    id: "companymaster",
    label: "Vendor Master",
    icon: <Building2 size={18} />,
    permissions: ["medCompany", "company"],
    subItems: [
      // {
      //   id: "medicine-Company",
      //   label: "Medicine Company",
      //   path: "/medicinecompany",
      //   icon: <Factory size={16} />,
      //   permissions: ["medCompany"],
      // },
      {
        id: "iol-master",
        label: "IOL Vendors",
        path: "/IOLMaster",
        icon: <Building2 size={16} />,
        permissions: ["company"],
      },
    ],
  },
  {
    id: "productmaster",
    label: "Product Master",
    icon: <Boxes size={18} />,
    permissions: ["IolProduct", "medicineProduct"],
    subItems: [
      // {
      //   id: "medicine-Product",
      //   label: "Medicine Product",
      //   path: "/medicineproduct",
      //   icon: <Pill size={16} />,
      //   permissions: ["medicineProduct"],
      // },
      {
        id: "iol-product-master",
        label: "IOL Product",
        path: "/IOLProductMaster",
        icon: <Eye size={16} />,
        permissions: ["IolProduct"],
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package size={18} />,
    permissions: ["medicineInventory", "IolInventory"],
    subItems: [
      // {
      //   id: "Medicine-inventory",
      //   label: "Medicine Inventory",
      //   path: "/MediInventory",
      //   icon: <Pill size={16} />,
      //   permissions: ["medicineInventory"],
      // },
      {
        id: "iol-inventory",
        label: "IOL Inventory",
        path: "/IOLInventory",
        icon: <Eye size={16} />,
        permissions: ["IolInventory"],
      },
    ],
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: <FileText size={18} />,
    permissions: ["IolInvoice"],
    subItems: [
      {
        id: "IOlinvoice",
        label: "IOL Invoice",
        path: "/invoicepage",
        icon: <Receipt size={16} />,
        permissions: ["IolInvoice"],
      },
      // {
      //   id: "Medicineinvoice",
      //   label: "Medicine Invoice",
      //   path: "/medicineinvoice",
      //   icon: <Receipt size={16} />,
      //   permissions: ["medInvoice"],
      // },
    ],
  },
  {
    icon: <Factory size={18} />,
    id: "packageMaster",
    label: "Package Master",
    path: "/package",
    permissions: [],
  },
];

const ClassicSidebar = ({ collapsed, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const permission = user?.permission || [];
  const role = user?.role;


  if (role === "shipper" && !menuItems.some(item => item.id === "shipper-consume")) {
    menuItems.push({
      id: "shipper-consume",
      label: "IOL Inventory",
      icon: <ShoppingCart size={18} />,
      path: "/confirm-consume",
      permissions: [],
    },
      {
        id: "iol-request",
        label: "IOL Request",
        icon: <Factory size={18} />,
        path: "/iol-request",
        permissions: [],
      }
    );
  }

  const hasPermission = (requiredPermissions = []) => {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.some((perm) => permission.includes(perm));
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  useEffect(() => {
    if (!collapsed) {
      onToggle(); // Collapse the sidebar if not already
    }
  }, [location.pathname]);


  const hasVisibleSubItems = (subItems) => {
    return subItems.some((sub) => hasPermission(sub.permissions || []));
  };


  return (
    <aside
      className={`h-screen bg-gradient-to-b from-gray-50 to-white border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out shadow-sm ${collapsed ? "w-16" : "w-64"
        }`}
      style={{
        minWidth: collapsed ? "4rem" : "16rem",
        maxWidth: collapsed ? "4rem" : "16rem",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100/80">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight select-none">
              Billing
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`flex items-center justify-center w-8 h-8 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 ${collapsed ? "mx-auto" : ""
            }`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className={`space-y-1 ${collapsed ? "px-1" : "px-2"}`}>
          {menuItems
            .filter((item) => {
              const parentAllowed = hasPermission(item.permissions || []);
              const visibleChildren = item.subItems
                ? hasVisibleSubItems(item.subItems)
                : false;

              return parentAllowed || visibleChildren;
            })
            .map((item) => {
              const isExpanded = expandedItems[item.id];
              const hasVisibleSubs = item.subItems
                ? hasVisibleSubItems(item.subItems)
                : false;

              return (
                <li key={item.id}>
                  {item.subItems ? (
                    <div className="space-y-1">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => !collapsed && toggleExpanded(item.id)}
                        className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-2"
                          } py-2.5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${isExpanded ? "bg-gray-50" : ""
                          }`}
                        disabled={collapsed}
                      >
                        <div
                          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
                            }`}
                        >
                          <div className={`flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 ${collapsed ? "w-6 h-6" : "w-5 h-5"
                            }`}>
                            {item.icon}
                          </div>
                          {!collapsed && (
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                          )}
                        </div>
                        {!collapsed && hasVisibleSubs && (
                          <div className="flex items-center justify-center w-4 h-4">
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Sub Items - Collapsible */}
                      {!collapsed && isExpanded && hasVisibleSubs && (
                        <ul className="space-y-0.5 ml-2 overflow-hidden">
                          {item.subItems
                            .filter((sub) =>
                              hasPermission(sub.permissions || [])
                            )
                            .map((sub) => (
                              <li key={sub.id}>
                                <NavLink
                                  to={sub.path}
                                  className={({ isActive }) =>
                                    `flex items-center px-2 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group ${isActive
                                      ? "bg-gray-50 text-gray-900 border-l-2 border-gray-500 shadow-sm"
                                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`
                                  }
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    {sub.icon && (
                                      <span className="flex items-center justify-center flex-shrink-0 opacity-70">
                                        {sub.icon}
                                      </span>
                                    )}
                                    <span className="truncate">
                                      {sub.label}
                                    </span>
                                  </div>
                                </NavLink>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? "justify-center px-0 py-2" : "px-2 gap-3 py-3"
                        } rounded-lg transition-all duration-200 font-medium group ${isActive
                          ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`
                      }
                    >
                      <div
                        className={`flex items-center justify-center rounded-lg ${({
                          isActive,
                        }) => (isActive ? "bg-white/20" : "bg-gray-50")} ${({
                          isActive,
                        }) => (isActive ? "text-white" : "text-gray-600")} ${collapsed ? "w-6 h-6" : "w-5 h-5"
                          }`}
                      >
                        {item.icon}
                      </div>
                      {!collapsed && (
                        <span className="text-sm truncate">{item.label}</span>
                      )}
                    </NavLink>
                  )}
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-gray-100/80">
        <div
          className={`flex items-center py-2 ${collapsed ? "justify-center px-0" : "gap-3 px-2"
            }`}
        >
          <div className={`rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${collapsed ? "w-6 h-6" : "w-6 h-6"
            }`}>
            <Users size={14} className="text-white" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.reload();
                }}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ClassicSidebar;
