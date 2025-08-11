import React, { useEffect, useState } from "react";
import ClassicSidebar from "../Component/ClassicSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const ClassicLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkloginData = localStorage.getItem("token");

    if (!checkloginData) {
      navigate("/login");
      // toast.info("you need to login First");
    }
  }, []);
  return (
    <div className="flex h-screen bg-gray-50 scrollbar-hide">
      <ClassicSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <main className="flex-1 min-w-0 flex flex-col p-0 overflow-x-hidden scrollbar-hide">
        <div className="flex-1 min-w-0 p-">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ClassicLayout;
