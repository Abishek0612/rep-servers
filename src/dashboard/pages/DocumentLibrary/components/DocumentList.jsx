import PropTypes from "prop-types";
import DocumentItem from "./DocumentItem";

const DocumentList = ({
  documents,
  onDocumentClick,
  onDeleteDocument,
  onReScanDocument,
  selectedDocuments,
  onSelectionChange,
  onSelectAll,
  isAllSelected,
  activeTab,
}) => {
  return (
    <div className="bg-white shadow overflow-hidden rounded-md w-full">
      <div className="hidden md:grid grid-cols-12 bg-gray-50 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
        {activeTab === "approved" ? (
          <div className="col-span-1 flex justify-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAll}
              className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded cursor-pointer"
            />
          </div>
        ) : (
          <div className="col-span-1"></div>
        )}
        <div className="col-span-3">Document Name</div>
        <div className="col-span-2">Supplier Name</div>
        <div className="col-span-1">Doc Number</div>
        <div className="col-span-1 text-center">Type</div>
        <div className="col-span-1 text-center">Date</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>

      {documents.length > 0 ? (
        <ul className="divide-y divide-gray-200 w-full">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              onDocumentClick={onDocumentClick}
              onDeleteDocument={onDeleteDocument}
              onReScanDocument={onReScanDocument}
              isSelected={selectedDocuments.includes(document.id)}
              onSelectionChange={onSelectionChange}
              activeTab={activeTab}
            />
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center py-20 px-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <h3 className="text-sm font-medium text-gray-900">
              No documents found
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

DocumentList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDocumentClick: PropTypes.func.isRequired,
  onDeleteDocument: PropTypes.func.isRequired,
  onReScanDocument: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  isAllSelected: PropTypes.bool.isRequired,
  activeTab: PropTypes.string,
};

export default DocumentList;
