import axiosInstance from "./axiosConfig";

const invoiceService = {
  uploadInvoice: async (formData) => {
    const response = await axiosInstance.post("/invoices/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getInvoices: async () => {
    const response = await axiosInstance.get("/invoices");
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  },

  deleteInvoice: async (id) => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  },

  updateInvoiceStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/invoices/${id}/status`, {
      status,
    });
    return response.data;
  },

  updateInvoiceData: async (id, invoiceData) => {
    const response = await axiosInstance.put(
      `/invoices/${id}/data`,
      invoiceData
    );
    return response.data;
  },
};

export default invoiceService;
