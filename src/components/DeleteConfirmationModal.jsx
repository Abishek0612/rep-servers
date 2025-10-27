import { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Portal from "./Portal";

const DeleteConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  documentName,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          zIndex: 9999,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onClick={onCancel}
      >
        <div
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl mx-auto w-full max-w-md p-6 m-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
            Delete Document
          </h3>

          <p className="text-sm text-gray-500 mb-6 text-center">
            Do you really want to delete the document "{documentName}"? This
            action cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm  cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onCancel}
            >
              No
            </button>
            <button
              type="button"
              className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={onConfirm}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  documentName: PropTypes.string.isRequired,
};

export default DeleteConfirmationModal;
