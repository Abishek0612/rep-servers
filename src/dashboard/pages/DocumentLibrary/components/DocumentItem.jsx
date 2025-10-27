import PropTypes from "prop-types";

const DocumentItem = ({
  document,
  onDocumentClick,
  onDeleteDocument,
  onReScanDocument,
  isSelected,
  onSelectionChange,
  activeTab,
}) => {
  const { id, name, type, date, status, s3Url, supplierName, documentNumber } =
    document;

  const getStatusPill = (status) => {
    switch (status) {
      case "uploading":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg
              className="mr-1.5 h-2 w-2 text-blue-400 animate-pulse"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            Uploading...
          </span>
        );
      case "uploaded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg
              className="mr-1.5 h-2 w-2 text-gray-400"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            Uploaded
          </span>
        );
      case "ocr-running":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg
              className="mr-1.5 h-2 w-2 text-yellow-400 animate-pulse"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            OCR Running
          </span>
        );
      case "pending-approval":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg
              className="mr-1.5 h-2 w-2 text-red-400"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            Pending Approval
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg
              className="mr-1.5 h-2 w-2 text-green-400"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg
              className="mr-1.5 h-2 w-2 text-gray-400"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getDocumentIcon = (type) => {
    switch (type.toLowerCase()) {
      case "invoice":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
      case "purchase order":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-indigo-500"
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
        );
      case "grn":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        );
      case "payment advice":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      case "contract":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  const handleDocumentClick = (e) => {
    if (
      e.target.type === "checkbox" ||
      e.target.closest('input[type="checkbox"]')
    ) {
      return;
    }
    onDocumentClick(document);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (s3Url) {
      window.open(s3Url, "_blank");
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelectionChange(id, e.target.checked);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteDocument(id, name);
  };

  const handleReScanClick = (e) => {
    e.stopPropagation();
    onReScanDocument(id, type);
  };

  const isClickable =
    type.toLowerCase() === "invoice" ||
    type.toLowerCase() === "purchase order" ||
    type.toLowerCase() === "grn" ||
    type.toLowerCase() === "payment advice";

  const showReScanButton = activeTab === "all" && status === "pending-approval";

  return (
    <li
      data-id={id}
      className={`block hover:bg-gray-50 transition duration-150 ease-in-out`}
    >
      <div className="block md:hidden p-4">
        <div className="flex items-center space-x-3">
          {activeTab === "approved" && (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded cursor-pointer"
              />
            </div>
          )}
          <div className="flex-shrink-0">{getDocumentIcon(type)}</div>
          <div
            className={`min-w-0 flex-1 ${isClickable ? "cursor-pointer" : ""}`}
            onClick={isClickable ? handleDocumentClick : undefined}
          >
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{supplierName}</p>
            <p className="text-xs text-gray-500 truncate">
              Doc No: {documentNumber}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-xs text-gray-500">{type}</p>
                <p className="text-xs text-gray-500">{date}</p>
              </div>
              <div>{getStatusPill(status)}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          {isClickable && (
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDocumentClick(document);
              }}
            >
              View
            </button>
          )}
          {showReScanButton && (
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
              onClick={handleReScanClick}
            >
              Re-Scan
            </button>
          )}
          <button
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
            onClick={handleDownload}
          >
            Download
          </button>
          <button
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
            onClick={handleDeleteClick}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-12 items-center px-2 py-3 w-full">
        {activeTab === "approved" ? (
          <div
            className="col-span-1 flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded cursor-pointer"
            />
          </div>
        ) : (
          <div className="col-span-1"></div>
        )}

        <div
          className={`col-span-3 flex items-center space-x-3 ${
            isClickable ? "cursor-pointer" : ""
          }`}
          onClick={isClickable ? handleDocumentClick : undefined}
        >
          <div className="flex-shrink-0">{getDocumentIcon(type)}</div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {name}
          </div>
        </div>

        <div className="col-span-2 text-sm text-gray-500 truncate">
          {supplierName}
        </div>
        <div className="col-span-1 text-sm text-gray-500 truncate">
          {documentNumber}
        </div>

        <div className="col-span-1 text-center">
          <span className="text-sm text-gray-500">{type}</span>
        </div>

        <div className="col-span-1 text-center">
          <span className="text-sm text-gray-500">{date}</span>
        </div>

        <div className="col-span-1 text-center">{getStatusPill(status)}</div>

        <div className="col-span-2 flex justify-center space-x-1">
          {isClickable && (
            <button
              className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-[var(--color-primary)] hover:bg-[var(--color-dark-purple)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDocumentClick(document);
              }}
              title="View document"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          )}
          {showReScanButton && (
            <button
              className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-[var(--color-primary)] hover:bg-[var(--color-dark-purple)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
              onClick={handleReScanClick}
              title="Re-scan document"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
          <button
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-[var(--color-primary)] hover:bg-[var(--color-dark-purple)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
            onClick={handleDownload}
            title="Download document"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-[var(--color-primary)] hover:bg-[var(--color-dark-purple)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] cursor-pointer"
            onClick={handleDeleteClick}
            title="Delete document"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
};

DocumentItem.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    s3Url: PropTypes.string,
    file: PropTypes.object,
    supplierName: PropTypes.string,
    documentNumber: PropTypes.string,
  }).isRequired,
  onDocumentClick: PropTypes.func.isRequired,
  onDeleteDocument: PropTypes.func.isRequired,
  onReScanDocument: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default DocumentItem;
