import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import logo from "../../assets/logo.png";
import logoName from "../../assets/logoName.png";

const CollapsibleSidebar = ({ isCollapsed, toggleCollapse }) => {
  const navigation = [
    {
      name: "Document Library",
      path: "/dashboard/documents",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`h-full bg-white border-r cursor-pointer border-gray-200 fixed top-0 left-0 bottom-0 flex flex-col transition-all duration-300 z-10 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`${
          isCollapsed ? "justify-center p-4" : "p-6"
        } flex items-center`}
      >
        {isCollapsed ? (
          <img src={logo} alt="Logo" className="h-8" />
        ) : (
          <div className="flex items-center">
            <img src={logoName} alt="Logo Name" className="h-12 ml-2" />
          </div>
        )}
      </div>

      <button
        className="absolute top-4 right-0 transform translate-x-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md focus:outline-none"
        onClick={toggleCollapse}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <nav className="mt-6 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center ${
                isCollapsed ? "justify-center" : "px-4"
              } py-3 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
            title={isCollapsed ? item.name : ""}
          >
            <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
            {!isCollapsed && item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer  */}
      {/* {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Help Center
          </div>
        </div>
      )} */}
    </div>
  );
};

CollapsibleSidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  toggleCollapse: PropTypes.func.isRequired,
};

export default CollapsibleSidebar;
