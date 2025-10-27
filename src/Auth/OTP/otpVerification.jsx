import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const OTPVerification = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const { verifyEmail, resendVerification, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const isPasswordReset = location.state?.resetPassword || false;

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }

    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, email, navigate]);

  const resendOTP = async () => {
    try {
      await resendVerification(email);
      setTimer(60);
      setIsTimerActive(true);
      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .substring(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const joinedOtp = otp.join("");

    if (joinedOtp.length !== 6) {
      setError("Please enter a complete 6-digit code");
      return;
    }

    setError("");

    try {
      if (isPasswordReset) {
        navigate("/reset-password", {
          state: {
            email,
            otp: joinedOtp,
          },
        });
      } else {
        const response = await verifyEmail({ email, otp: joinedOtp });
        if (response.success) {
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-xl shadow-lg">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-inner">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-indigo-700">
              {isPasswordReset ? "Reset Password" : "Verify Your Email"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              We've sent a code to{" "}
              <span className="font-medium text-indigo-600">{email}</span>
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 sm:gap-4">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e)}
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg font-semibold border border-gray-300 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md bg-white"
                  maxLength={1}
                  autoFocus={index === 0}
                  style={{
                    caretColor: "transparent",
                    WebkitAppearance: "none",
                  }}
                />
              ))}
            </div>

            <div className="text-center mt-4">
              {isTimerActive ? (
                <p className="text-sm text-gray-600">
                  Resend code in{" "}
                  <span className="font-semibold text-indigo-600">
                    {timer}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendOTP}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition duration-300"
                >
                  Resend verification code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
                loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {loading ? "Processing..." : "Verify Code"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition duration-300 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 transform hover:-translate-x-1 transition duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
