import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import documentService from "../../../../api/documentService";
import { useAuth } from "../../../../hooks/useAuth";

const UploadModal = ({ onClose, onUploadComplete, onShowToast }) => {
  const { currentUser } = useAuth();
  const [documentType, setDocumentType] = useState("Invoice");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  const getDocumentTypesForOrganization = () => {
    const orgCode = currentUser?.organization?.code || "KIWI";

    if (orgCode === "UBOARD") {
      return ["Invoice", "Purchase Order", "GRN", "Payment Advice"];
    } else {
      return ["Invoice"];
    }
  };

  const documentTypes = getDocumentTypesForOrganization();

  useEffect(() => {
    if (!documentTypes.includes(documentType)) {
      setDocumentType(documentTypes[0]);
    }
  }, [documentTypes, documentType]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  const validateFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > MAX_FILES) {
      onShowToast(
        `You can upload a maximum of ${MAX_FILES} documents at a time`,
        "error"
      );
      return false;
    }

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        onShowToast(
          `File "${file.name}" exceeds the maximum size limit of 15MB`,
          "error"
        );
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = (selectedFiles) => {
    if (!validateFiles(selectedFiles)) {
      return;
    }

    const newFiles = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(2),
      file,
      name: file.name,
      progress: 0,
      status: "pending",
      type: documentType,
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (fileId, e) => {
    e.stopPropagation();
    setFiles(files.filter((file) => file.id !== fileId));
  };

  const handleDocumentTypeChange = (newType) => {
    setDocumentType(newType);
    setFiles(files.map((file) => ({ ...file, type: newType })));
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const fileObj of files) {
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("documentType", documentType);

        fileObj.status = "uploading";
        setFiles([...files]);

        const progressInterval = setInterval(() => {
          fileObj.progress = Math.min(90, fileObj.progress + 10);
          setFiles([...files]);
        }, 200);

        try {
          const response = await documentService.uploadDocument(formData);

          clearInterval(progressInterval);

          if (response.success) {
            fileObj.progress = 100;
            fileObj.status = "success";
          } else {
            fileObj.status = "error";
            if (
              response.message &&
              response.message.includes("already exists")
            ) {
              onShowToast(response.message, "error");
              clearInterval(progressInterval);
              setUploading(false);
              return;
            }
          }

          setFiles([...files]);
        } catch (error) {
          clearInterval(progressInterval);
          console.error("Upload failed:", error);
          fileObj.status = "error";
          setFiles([...files]);

          if (
            error.response?.data?.message &&
            error.response.data.message.includes("already exists")
          ) {
            onShowToast(error.response.data.message, "error");
            setUploading(false);
            return;
          } else {
            onShowToast("Failed to upload " + fileObj.name, "error");
          }
        }
      }

      onUploadComplete();
    } catch (error) {
      console.error("Upload process failed:", error);
      onShowToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl mx-auto w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-medium">Upload Documents</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 cursor-pointer"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type
              </label>
              <div className="relative">
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => handleDocumentTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploading}
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {currentUser?.organization?.code &&
                currentUser.organization.code !== "UBOARD" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only Invoice documents are supported for your organization.
                  </p>
                )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Files ({files.length}/{MAX_FILES})
              </label>
              <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                {files.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {files.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between py-2 px-3"
                      >
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-gray-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <div>
                            <span className="text-sm text-gray-900 truncate max-w-[200px] block">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {file.type} •{" "}
                              {(file.file.size / (1024 * 1024)).toFixed(1)}MB
                            </span>
                          </div>
                        </div>

                        {file.status === "pending" && (
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-gray-500 cursor-pointer"
                            onClick={(e) => removeFile(file.id, e)}
                            disabled={uploading}
                          >
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}

                        {file.status === "uploading" && (
                          <div className="w-20">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {file.status === "success" && (
                          <svg
                            className="h-5 w-5 text-green-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}

                        {file.status === "error" && (
                          <svg
                            className="h-5 w-5 text-red-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-sm text-gray-500">
                    No files selected
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={triggerFileInput}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                disabled={uploading || files.length >= MAX_FILES}
              >
                <svg
                  className="mr-2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                Upload from computer
              </button>
            </div>

            <div
              className={`mb-6 border-2 border-dashed rounded-md p-8 transition-colors ${
                files.length >= MAX_FILES || uploading
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : isDragging
                  ? "border-blue-500 bg-blue-50 cursor-pointer"
                  : "border-gray-300 hover:border-gray-400 cursor-pointer"
              }`}
              onDragOver={
                files.length >= MAX_FILES || uploading
                  ? undefined
                  : handleDragOver
              }
              onDragLeave={
                files.length >= MAX_FILES || uploading
                  ? undefined
                  : handleDragLeave
              }
              onDrop={
                files.length >= MAX_FILES || uploading ? undefined : handleDrop
              }
              onClick={
                files.length >= MAX_FILES || uploading
                  ? undefined
                  : triggerFileInput
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                disabled={uploading || files.length >= MAX_FILES}
              />
              <div className="text-center">
                <svg
                  className={`mx-auto h-12 w-12 ${
                    files.length >= MAX_FILES || uploading
                      ? "text-gray-300"
                      : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p
                  className={`mt-2 text-sm ${
                    files.length >= MAX_FILES || uploading
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {files.length >= MAX_FILES
                    ? `Maximum ${MAX_FILES} files allowed`
                    : "Drag and drop files here, or click to select files"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, Word, Excel, Images (Max 15MB each)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  uploading || files.length === 0
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
                onClick={startUpload}
                disabled={uploading || files.length === 0}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UploadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUploadComplete: PropTypes.func.isRequired,
  onShowToast: PropTypes.func.isRequired,
};

export default UploadModal;
