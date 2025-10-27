import axiosInstance from "./axiosConfig";

const documentService = {
  uploadDocument: async (formData) => {
    const response = await axiosInstance.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getDocuments: async (page = 1, limit = 100) => {
    const response = await axiosInstance.get("/documents", {
      params: { page, limit },
    });
    return response.data;
  },

  getDocumentById: async (id, type) => {
    const response = await axiosInstance.get(
      `/documents/${id}?type=${encodeURIComponent(type)}`
    );
    return response.data;
  },

  deleteDocument: async (id, type) => {
    const response = await axiosInstance.delete(
      `/documents/${id}?type=${encodeURIComponent(type)}`
    );
    return response.data;
  },

  updateDocumentStatus: async (id, status, type) => {
    const response = await axiosInstance.patch(`/documents/${id}/status`, {
      status,
      type,
    });
    return response.data;
  },

  updateDocumentData: async (id, data, type) => {
    const response = await axiosInstance.put(`/documents/${id}/data`, {
      data,
      type,
    });

    return response.data;
  },

  exportDocuments: async (documentIds) => {
    const response = await axiosInstance.post(
      "/documents/export",
      {
        documentIds,
      },
      {
        responseType: "blob",
      }
    );
    return response;
  },

  reScanDocument: async (id, type) => {
    const response = await axiosInstance.post(`/documents/${id}/re-scan`, {
      type,
    });
    return response.data;
  },

  checkDocumentDuplicates: async (id, type) => {
    const response = await axiosInstance.get(
      `/documents/${id}/check-duplicates?type=${encodeURIComponent(type)}`
    );
    return response.data;
  },
};

export default documentService;
