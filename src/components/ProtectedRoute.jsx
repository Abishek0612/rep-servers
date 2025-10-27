import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isFirstLogin, loading, currentUser } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // console.log("ProtectedRoute - Path:", currentPath);
  // console.log("ProtectedRoute - isFirstLogin:", isFirstLogin);
  // console.log(
  //   "ProtectedRoute - User needs password reset:",
  //   currentUser?.isFirstLogin === true || isFirstLogin
  // );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const needsPasswordReset =
    isFirstLogin || (currentUser && currentUser.isFirstLogin === true);

  if (needsPasswordReset && currentPath !== "/first-time-password") {
    console.log("Password reset required, redirecting to first-time-password");
    return <Navigate to="/first-time-password" replace />;
  }

  if (!needsPasswordReset && currentPath === "/first-time-password") {
    console.log("Password already reset, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
