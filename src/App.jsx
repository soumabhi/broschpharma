import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Pages
import InvoiceCreatePage from "./PAges/invoice";
import ClassicLayout from "./Layout/ClassicLayout";
// import Shipper from "./PAges/Shipper";
// import Biller from "./PAges/Biller";
import Invoicepage from "./PAges/Invoicepage";
import BillingUnit from "./PAges/Configuration/BillingUnit";
// import ShippingUnit from "./PAges/Configuration/ShippingUnit";
import IOLMaster from "./PAges/Configuration/Iolmaster";
import IOLProductMaster from "./PAges/Configuration/IolProductmaster";
import IOLInventory from "./PAges/Inventory/Inventory";
import IOLprodoctpage from "./PAges/Configuration/IOLProductpage";
import Login from "./Component/login";
import MedicineProductMst from "./PAges/Configuration/MedicineProductMst";
import MediInventory from "./PAges/Inventory/MediInventory";

import ShippingpageDetails from "./PAges/Configuration/ShippingDetailpage";
import PDFGeneration from "./PAges/PDF/PDFGeneration";
import AddUser from "./Component/AddUser";
// import BillerPage from "./PAges/Biller";
// import MedicineCompanyName from "./PAges/Configuration/MedicineCompanyName";
// import MedicineProductMaster from "./PAges/Configuration/MedicineProductMst";
// import MedBillerPage from "./PAges/Configuration/MedicineBillingUnit";
// import MedicineInvoice from "./PAges/MedicineInvoice";
import SimpleDashBoard from "./PAges/dashboard/SimpleDashBoard";
import ShipperConfirmation from "./PAges/stores/shipperConfirmation";
import IolRequest from "./PAges/stores/IOlRequest";
import IolPackageMaster from "./PAges/Configuration/IolPackageMaster";
import IolPackageDetails from "./PAges/stores/IOlPackageDetails";
import PackageDetailsPage from "./PAges/Configuration/PackageDetailPage";

// Permission Mapping for routes
const routePermissions = [
  { path: "/", element: <SimpleDashBoard /> },
  { path: "/package", element: <IolPackageMaster /> },
  { path: "/package-details/:id", element: <PackageDetailsPage /> },
  {
    path: "/invoice",
    element: <InvoiceCreatePage />,
    permissions: ["IolInvoice"],
  },
  // { path: "/shipper", element: <Shipper />, permissions: ["product", "admin"] },
  // { path: "/biller", element: <Biller />, permissions: ["product", "admin"] },
  {
    path: "/invoicepage",
    element: <Invoicepage />,
    permissions: ["IolInvoice"],
  },
  {
    path: "/BillingUnit",
    element: <BillingUnit />,
    permissions: ["BillingEntity"],
  },
  // {
  //   path: "/ShippingUnit",
  //   element: <ShippingUnit />,
  //   permissions: ["BillingEntity"],
  // },
  {
    path: "/IOLMaster",
    element: <IOLMaster />,
    permissions: ["company"],
  },
  {
    path: "/IOLProductMaster",
    element: <IOLProductMaster />,
    permissions: ["IolProduct"],
  },
  {
    path: "/IOLInventory",
    element: <IOLInventory />,
    permissions: ["IolInventory"],
  },
  {
    path: "/IOLprodoctpage",
    element: <IOLprodoctpage />,
    permissions: ["IolProduct"],
  },
  {
    path: "/ShippingpageDetails",
    element: <ShippingpageDetails />,
    permissions: ["BillingEntity"],
  },
  {
    path: "/PDFGeneration",
    element: <PDFGeneration />,
    permissions: ["IolInvoice"],
  },
  // {
  //   path: "/MediInventory",
  //   element: <MediInventory />,
  //   permissions: ["medicineInventory"],
  // },
  // {
  //   path: "/MedicineProductMst",
  //   element: <MedicineProductMst />,
  //   permissions: ["medicineProduct"],
  // },
  // {
  //   path: "/medicinebilling",
  //   element: <MedBillerPage />,
  //   permissions: ["BillingEntityMed"],
  // },
  // {
  //   path: "/medicinecompany",
  //   element: <MedicineCompanyName />,
  //   permissions: ["medCompany"],
  // },
  // {
  //   path: "/medicineproduct",
  //   element: <MedicineProductMaster />,
  //   permissions: ["medicineProduct"],
  // },
  // {
  //   path: "/MedicineInvoice",
  //   element: <MedicineInvoice />,
  //   permissions: ["medInvoice"],
  // },
  // {
  //   path: "/addUser",
  //   element: <AddUser />,
  //   permissions: ["product"],
  // },
];

function App() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || "";

  const userPermissions = user?.permission || [];

  const hasAccess = (routePerms = []) =>
    routePerms.length === 0 ||
    routePerms.some((perm) => userPermissions.includes(perm));

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route element={<ClassicLayout />}>
          {routePermissions.map(({ path, element, permissions }) =>
            hasAccess(permissions) ? (
              <Route key={path} path={path} element={element} />
            ) : null
          )}
          {userRole === "shipper" && (
            <>
            <Route path="/confirm-consume" element={<ShipperConfirmation />} />
            <Route path="/iol-request" element={<IolRequest />} />
            <Route path="/iol-package-details" element={<IolPackageDetails />} />
            </>
          )}
        </Route>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        {hasAccess(["userAdd"]) && (
          <Route path="/addUser" element={<AddUser />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
