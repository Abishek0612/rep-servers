import { Route, Routes, Navigate } from "react-router-dom";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import MobileSidebar from "./components/MobileSidebar";
import DocumentLibrary from "./pages/DocumentLibrary";
import { useState } from "react";

const DashboardRoutes = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-full relative">
      <div className="hidden lg:block">
        <CollapsibleSidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div
        style={{ backgroundColor: "#f7fbff" }}
        className={`flex-1 overflow-y-auto transition-all duration-300 w-full relative ${
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="p-2 sm:p-4 lg:p-6 w-full relative">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard/documents" replace />}
            />
            <Route path="/documents" element={<DocumentLibrary />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardRoutes;
