import { useState, useEffect, useCallback } from "react";
import React from "react";
import DocumentList from "./components/DocumentList";
import UploadModal from "./components/UploadModal";
import DocumentFilters from "./components/DocumentFilter";
import DeleteConfirmationModal from "../../../components/DeleteConfirmationModal";
import Pagination from "./components/Pagination";
import { DocumentDataDisplay } from "../../../components/Document";
import Toast from "../../../components/Toast";
import documentService from "../../../api/documentService";
import { useAuth } from "../../../hooks/useAuth";

const DocumentLibrary = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [showDocumentDisplay, setShowDocumentDisplay] = useState(false);
  const [extractedDocumentData, setExtractedDocumentData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isReScanning, setIsReScanning] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [itemsPerPage] = useState(100);

  const getExtractedDataField = (documentType) => {
    switch (documentType.toLowerCase()) {
      case "invoice":
        return "invoice_data";
      case "purchase order":
        return "purchase_order_data";
      case "grn":
        return "grn_data";
      case "payment advice":
        return "payment_advice_data";
      default:
        return "invoice_data";
    }
  };

  const getExtractedData = (doc) => {
    const dataField = getExtractedDataField(doc.document_type);
    return doc[dataField];
  };

  const getDocumentNumber = (doc) => {
    const data = getExtractedData(doc);
    if (!data) return "N/A";
    return (
      data.invoiceNumber ||
      data.poNumber ||
      data.grnNumber ||
      data.documentNumber ||
      "N/A"
    );
  };

  const getSupplierName = (doc) => {
    const data = getExtractedData(doc);
    if (!data) return "N/A";
    return data.sellerName || data.supplierName || "N/A";
  };

  const fetchDocuments = useCallback(
    async (page = 1, showRefreshingIndicator = false) => {
      if (showRefreshingIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await documentService.getDocuments(page, itemsPerPage);
        if (response.success) {
          const transformedDocuments = response.data.map((doc) => {
            const extractedData = getExtractedData(doc);
            return {
              id: doc._id,
              name: doc.file_name,
              type: doc.document_type,
              date: new Date(doc.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              createdAt: doc.createdAt,
              status: doc.status.toLowerCase(),
              s3Url: doc.s3_url,
              extractedData: extractedData,
              rawDocument: doc,
              supplierName: getSupplierName(doc),
              documentNumber: getDocumentNumber(doc),
            };
          });

          setDocuments(transformedDocuments);
          setTotalPages(response.pagination?.pages || 1);
          setTotalDocuments(response.pagination?.total || 0);
          setCurrentPage(response.pagination?.page || 1);
        }
      } catch (error) {
        showToast("Failed to load documents. Please try again.", "error");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [itemsPerPage]
  );

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchDocuments(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredDocuments = documents.filter((doc) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(lowerSearchTerm) ||
      (doc.supplierName &&
        doc.supplierName.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.documentNumber &&
        doc.documentNumber.toLowerCase().includes(lowerSearchTerm));

    const matchesTab = (() => {
      if (activeTab === "all") return true;
      if (activeTab === "approved") {
        if (activeSubTab === "all") return doc.status === "approved";
        if (activeSubTab === "invoice")
          return (
            doc.status === "approved" && doc.type.toLowerCase() === "invoice"
          );
        if (activeSubTab === "purchase-order")
          return (
            doc.status === "approved" &&
            doc.type.toLowerCase() === "purchase order"
          );
        if (activeSubTab === "grn")
          return doc.status === "approved" && doc.type.toLowerCase() === "grn";
        if (activeSubTab === "payment-advice")
          return (
            doc.status === "approved" &&
            doc.type.toLowerCase() === "payment advice"
          );
        return doc.status === "approved";
      }
      return true;
    })();

    const matchesType =
      selectedType === "All Types" || doc.type === selectedType;
    const matchesStatus =
      selectedStatus === "All Statuses" || doc.status === selectedStatus;

    let matchesDate = true;
    if (dateRange.from || dateRange.to) {
      const docDate = new Date(doc.createdAt);

      if (dateRange.from && dateRange.to) {
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = docDate >= fromDate && docDate <= toDate;
      } else if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        matchesDate = docDate >= fromDate;
      } else if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = docDate <= toDate;
      }
    }

    return (
      matchesSearch && matchesTab && matchesType && matchesStatus && matchesDate
    );
  });

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    showToast(
      "Documents uploaded successfully. Processing will continue in the background.",
      "success"
    );
    setTimeout(() => {
      fetchDocuments(currentPage);
    }, 1000);
  };

  const handleDocumentClick = async (document) => {
    setActiveDocumentId(document.id);

    try {
      const response = await documentService.getDocumentById(
        document.id,
        document.type
      );

      if (response.success) {
        const doc = response.data;

        const hasValidExtractedData = (data) => {
          if (!data) return false;
          if (typeof data !== "object") return false;
          if (data.error) return false;

          const keys = Object.keys(data);
          const dataKeys = keys.filter(
            (key) =>
              key !== "error" && key !== "extractedText" && key !== "message"
          );

          if (dataKeys.length === 0) return false;

          const hasNonEmptyValues = dataKeys.some((key) => {
            const value = data[key];
            if (value === null || value === undefined || value === "")
              return false;
            if (Array.isArray(value) && value.length === 0) return false;
            if (typeof value === "object" && Object.keys(value).length === 0)
              return false;
            return true;
          });

          return hasNonEmptyValues;
        };

        const extractedData = getExtractedData(doc);

        if (hasValidExtractedData(extractedData)) {
          setExtractedDocumentData({
            ...extractedData,
            imageUrl: doc.s3_url,
            status: doc.status,
            documentType: doc.document_type,
            organization: doc.organization || {
              code: "KIWI",
              name: "Default",
            },
            validation_results: doc.validation_results,
            site_validation: doc.site_validation,
          });

          setShowDocumentDisplay(true);
        } else if (doc.status === "ocr-running") {
          showToast(
            "This document is still being processed. Please try again later.",
            "info"
          );
        } else {
          showToast(
            "Document processing is in progress. Please wait a moment and try again.",
            "info"
          );
        }
      }
    } catch (error) {
      showToast("Failed to load document details. Please try again.", "error");
    }
  };

  const handleDeleteDocument = (documentId, documentName) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (!document) return;

    setDocumentToDelete({
      id: documentId,
      name: documentName,
      type: document.type,
    });
    setShowDeleteModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      await documentService.deleteDocument(
        documentToDelete.id,
        documentToDelete.type
      );
      showToast("Document deleted successfully", "success");
      setSelectedDocuments((prev) =>
        prev.filter((id) => id !== documentToDelete.id)
      );
      fetchDocuments(currentPage);
    } catch (error) {
      showToast("Failed to delete document. Please try again.", "error");
    } finally {
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDeleteDocument = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleReScanDocument = async (documentId, documentType) => {
    setIsReScanning((prev) => ({ ...prev, [documentId]: true }));

    try {
      await documentService.reScanDocument(documentId, documentType);
      showToast("Document re-scan started successfully", "success");
      setTimeout(() => {
        fetchDocuments(currentPage);
      }, 2000);
    } catch (error) {
      showToast("Failed to start document re-scan. Please try again.", "error");
    } finally {
      setIsReScanning((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const handleSaveDocumentData = async (data) => {
    try {
      const document = documents.find((doc) => doc.id === activeDocumentId);
      if (!document) return;

      await documentService.updateDocumentData(
        activeDocumentId,
        data,
        document.type
      );

      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === activeDocumentId
            ? {
                ...doc,
                extractedData: data,
              }
            : doc
        )
      );

      showToast("Document data saved successfully!", "success");
      fetchDocuments(currentPage);
    } catch (error) {
      showToast("Failed to save document data. Please try again.", "error");
    }
  };

  const handleApproveDocument = async (documentId) => {
    try {
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) return;

      await documentService.updateDocumentStatus(
        documentId,
        "approved",
        document.type
      );

      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                status: "approved",
                approval_date: new Date().toISOString(),
              }
            : doc
        )
      );

      showToast("Document approved successfully!", "success");
      setShowDocumentDisplay(false);
      fetchDocuments(currentPage);
    } catch (error) {
      showToast("Failed to approve document. Please try again.", "error");
    }
  };

  const handleRefresh = () => {
    fetchDocuments(currentPage, true);
  };

  const handleSelectionChange = (documentId, isSelected) => {
    setSelectedDocuments((prev) => {
      if (isSelected) {
        return [...prev, documentId];
      } else {
        return prev.filter((id) => id !== documentId);
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const isAllSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => selectedDocuments.includes(doc.id));

  const getSelectedDocumentTypes = () => {
    const selectedDocs = documents.filter((doc) =>
      selectedDocuments.includes(doc.id)
    );
    const types = [
      ...new Set(selectedDocs.map((doc) => doc.type.toLowerCase())),
    ];

    if (types.length === 1) {
      return types[0].replace(/\s+/g, "_").toLowerCase();
    } else if (types.length > 1) {
      return "mixed_documents";
    }
    return "documents";
  };

  const handleExportDocuments = async () => {
    if (selectedDocuments.length === 0) {
      showToast("Please select documents to export.", "error");
      return;
    }

    if (!documentService.exportDocuments) {
      showToast(
        "Export function not available. Please refresh the page.",
        "error"
      );
      return;
    }

    setIsExporting(true);
    try {
      const response = await documentService.exportDocuments(selectedDocuments);

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const documentType = getSelectedDocumentTypes();
      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `${documentType}_export_${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(
        `Successfully exported ${selectedDocuments.length} documents!`,
        "success"
      );
      setSelectedDocuments([]);
    } catch (error) {
      showToast("Failed to export documents. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedDocuments([]);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const documentTypes = [
    "All Types",
    ...new Set(documents.map((doc) => doc.type)),
  ];
  const documentStatuses = [
    "All Statuses",
    ...new Set(documents.map((doc) => doc.status)),
  ];

  const approvedCount = documents.filter(
    (doc) => doc.status === "approved"
  ).length;
  const approvedInvoiceCount = documents.filter(
    (doc) => doc.status === "approved" && doc.type.toLowerCase() === "invoice"
  ).length;
  const approvedPOCount = documents.filter(
    (doc) =>
      doc.status === "approved" && doc.type.toLowerCase() === "purchase order"
  ).length;
  const approvedGRNCount = documents.filter(
    (doc) => doc.status === "approved" && doc.type.toLowerCase() === "grn"
  ).length;
  const approvedPaymentAdviceCount = documents.filter(
    (doc) =>
      doc.status === "approved" && doc.type.toLowerCase() === "payment advice"
  ).length;

  return (
    <div className="h-full w-full">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Document Library
        </h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {selectedDocuments.length > 0 && (
            <React.Fragment>
              <button
                onClick={handleClearSelection}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center cursor-pointer"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Selection
              </button>
              <button
                onClick={handleExportDocuments}
                disabled={isExporting}
                className={`w-full sm:w-auto ${
                  isExporting
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded-lg flex items-center justify-center cursor-pointer`}
              >
                {isExporting ? (
                  <React.Fragment>
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Exporting...
                  </React.Fragment>
                ) : (
                  <React.Fragment>
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Data ({selectedDocuments.length})
                  </React.Fragment>
                )}
              </button>
            </React.Fragment>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-dark-purple)] text-white px-4 py-2 rounded-lg flex items-center justify-center cursor-pointer"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload Documents
          </button>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 border-b border-gray-200">
        <div className="flex justify-between items-center -mb-px">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "all"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => {
                setActiveTab("all");
                setActiveSubTab("all");
                setCurrentPage(1);
                fetchDocuments(1);
              }}
            >
              All Docs ({totalDocuments})
            </button>
            <button
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "approved"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => {
                setActiveTab("approved");
                setActiveSubTab("invoice");
                setCurrentPage(1);
                fetchDocuments(1);
              }}
            >
              Approved ({approvedCount})
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className={`py-3 sm:py-4 px-2 text-gray-500 hover:text-gray-700 transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
            title="Refresh Documents"
          >
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {activeTab === "approved" && (
        <div className="mb-4 sm:mb-6">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto border-b border-gray-100">
            <button
              className={`py-2 sm:py-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "invoice"
                  ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveSubTab("invoice")}
            >
              Invoice ({approvedInvoiceCount})
            </button>
            <button
              className={`py-2 sm:py-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "purchase-order"
                  ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveSubTab("purchase-order")}
            >
              Purchase Order ({approvedPOCount})
            </button>
            <button
              className={`py-2 sm:py-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "grn"
                  ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveSubTab("grn")}
            >
              GRN ({approvedGRNCount})
            </button>
            <button
              className={`py-2 sm:py-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "payment-advice"
                  ? "border-[var(--color-secondary)] text-[var(--color-secondary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveSubTab("payment-advice")}
            >
              Payment Advice ({approvedPaymentAdviceCount})
            </button>
          </div>
        </div>
      )}

      <DocumentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        dateRange={dateRange}
        setDateRange={setDateRange}
        documentTypes={documentTypes}
        documentStatuses={documentStatuses}
        activeTab={activeTab}
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          <span className="ml-3 text-sm sm:text-base text-gray-600">
            Loading documents...
          </span>
        </div>
      ) : (
        <>
          <DocumentList
            documents={filteredDocuments}
            onDocumentClick={handleDocumentClick}
            onDeleteDocument={handleDeleteDocument}
            onReScanDocument={handleReScanDocument}
            selectedDocuments={selectedDocuments}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            activeTab={activeTab}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalDocuments}
          />
        </>
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
          onShowToast={showToast}
        />
      )}

      {showDeleteModal && documentToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={confirmDeleteDocument}
          onCancel={cancelDeleteDocument}
          documentName={documentToDelete.name}
        />
      )}

      {showDocumentDisplay && extractedDocumentData && (
        <DocumentDataDisplay
          documentData={extractedDocumentData}
          onClose={() => setShowDocumentDisplay(false)}
          onSave={handleSaveDocumentData}
          onApprove={handleApproveDocument}
          documentId={activeDocumentId}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
