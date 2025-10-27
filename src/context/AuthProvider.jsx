import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import authService from "../api/authService";
import userService from "../api/userService";
import {
  clearTokens,
  isAuthenticated,
  setTempUserData,
  getIsFirstLogin,
  setIsFirstLogin as storeIsFirstLogin,
} from "../utils/tokenStorage";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(getIsFirstLogin());
  const navigate = useNavigate();
  const location = useLocation();
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const response = await userService.getCurrentUser();
          if (response.success) {
            console.log("User data loaded:", response.data);
            setCurrentUser(response.data);

            const needsPasswordReset = response.data.isFirstLogin === true;
            setIsFirstLogin(needsPasswordReset);
            storeIsFirstLogin(needsPasswordReset);

            if (
              needsPasswordReset &&
              location.pathname !== "/first-time-password"
            ) {
              console.log("Redirecting to password reset page from loadUser");
              navigate("/first-time-password", { replace: true });
            }
          }
        } catch (err) {
          console.error("Error loading user", err);
          if (err.response?.status === 401) {
            clearTokens();
          }
        }
      } else {
        if (location.pathname !== "/login") {
          try {
            const refreshResponse = await authService
              .refreshToken()
              .catch((_) => {
                console.warn(
                  "Token refresh failed - this is normal if not logged in"
                );
                return { success: false };
              });

            if (refreshResponse && refreshResponse.success) {
              try {
                const userResponse = await userService.getCurrentUser();
                if (userResponse.success) {
                  setCurrentUser(userResponse.data);
                  const needsPasswordReset =
                    userResponse.data.isFirstLogin === true;
                  setIsFirstLogin(needsPasswordReset);
                  storeIsFirstLogin(needsPasswordReset);
                }
              } catch (userErr) {
                console.error(
                  "Error loading user after token refresh:",
                  userErr
                );
              }
            }
          } catch (refreshErr) {
            console.error("Error during token refresh process:", refreshErr);
          }
        }
      }

      initialLoadComplete.current = true;
      setLoading(false);
    };

    loadUser();
  }, [navigate, location.pathname]);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(credentials);

      if (response.success) {
        // console.log("Login response:", response.data);

        const shouldResetPassword = response.data.isFirstLogin === true;
        setIsFirstLogin(shouldResetPassword);
        storeIsFirstLogin(shouldResetPassword);

        if (response.data.userId) {
          setTempUserData(response.data.userId, shouldResetPassword);
        }

        try {
          const userResponse = await userService.getCurrentUser();

          if (userResponse.success) {
            // console.log("User data after login:", userResponse.data);
            setCurrentUser(userResponse.data);

            if (shouldResetPassword) {
              //   console.log("Navigating to first-time password page");
              navigate("/first-time-password", { replace: true });

              setTimeout(() => {
                if (window.location.pathname !== "/first-time-password") {
                  //   console.log("Forced navigation to password reset page");
                  window.location.href = "/first-time-password";
                }
              }, 100);
            } else {
              const from = location.state?.from?.pathname || "/dashboard";
              console.log("Navigating to:", from);
              navigate(from, { replace: true });
            }
          }
        } catch (userErr) {
          console.error("Error fetching user after login:", userErr);
          setLoading(false);
        }
      }

      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw err;
    }
  };

  const changeFirstTimePassword = async (password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.changeFirstTimePassword(password);

      if (response.success) {
        setIsFirstLogin(false);
        storeIsFirstLogin(false);

        try {
          const userResponse = await userService.getCurrentUser();
          if (userResponse.success) {
            setCurrentUser(userResponse.data);
            navigate("/dashboard", { replace: true });
          }
        } catch (userErr) {
          console.error("Error fetching user after password change:", userErr);
        }
      }

      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Password change failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      setIsFirstLogin(false);
      storeIsFirstLogin(false);
      setError(null);

      clearTokens();
      setLoading(false);

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      setCurrentUser(null);
      clearTokens();
      setLoading(false);
      navigate("/login", { replace: true });
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.forgotPassword(email);
      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Request failed");
      throw err;
    }
  };

  const resetPassword = async (resetData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.resetPassword(resetData);
      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Password reset failed");
      throw err;
    }
  };

  const resendVerification = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.resendVerification(email);
      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Resend verification failed");
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await userService.updateProfile(profileData);
      if (response.success) {
        setCurrentUser(response.data);
      }
      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Profile update failed");
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    isFirstLogin,
    isAuthenticated: !!currentUser,
    login,
    changeFirstTimePassword,
    logout,
    forgotPassword,
    resetPassword,
    resendVerification,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
