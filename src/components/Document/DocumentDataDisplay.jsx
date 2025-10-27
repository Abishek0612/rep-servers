import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import documentService from "../../api/documentService";

const DocumentDataDisplay = ({
  documentData,
  onClose,
  onSave,
  onApprove,
  goBackCallback = null,
  documentId = null,
}) => {
  const [editedData, setEditedData] = useState(documentData);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [organizationConfig, setOrganizationConfig] = useState(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);
  const [showImageControls, setShowImageControls] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateCheckComplete, setDuplicateCheckComplete] = useState(false);

  const isPDF = (url) => {
    if (!url) return false;
    return (
      url.toLowerCase().includes(".pdf") || url.toLowerCase().endsWith(".pdf")
    );
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";

    if (dateValue instanceof Date) {
      return dateValue.toISOString().split("T")[0];
    }

    if (typeof dateValue === "string") {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }

      if (dateValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        const [day, month, year] = dateValue.split("-");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      if (dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [day, month, year] = dateValue.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    return "";
  };

  const displayDateValue = (value) => {
    if (!value) return "";

    if (value instanceof Date) {
      return value.toLocaleDateString("en-GB");
    }

    if (typeof value === "string") {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split("-");
        return `${day}-${month}-${year}`;
      }

      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-GB");
      }
    }

    return value;
  };

  const getValidationStatus = (item, validationResults) => {
    if (!validationResults || !validationResults.length) return null;
    if (!item.articleNo) return null;

    const result = validationResults.find(
      (r) => r.articleCode === item.articleNo
    );
    return result;
  };

  const getFieldValidationError = (item, fieldKey, validationResults) => {
    if (!validationResults || !validationResults.length) return null;
    if (!item.articleNo) return null;

    const result = validationResults.find(
      (r) => r.articleCode === item.articleNo
    );
    if (!result || result.isValid) return null;

    const fieldMapping = {
      hsn: "HSN Code",
      eanNo: "EAN Code",
      baseCost: "Base Cost",
      igstPercent: "GST Percentage",
      cgstPercent: "GST Percentage",
      sgstPercent: "GST Percentage",
    };

    return result.mismatches?.find((m) => m.field === fieldMapping[fieldKey]);
  };

  const shouldShowValidation = () => {
    return (
      editedData.organization?.code === "UBOARD" &&
      (editedData.documentType === "Purchase Order" ||
        organizationConfig?.fields.some((f) => f.key === "poNumber"))
    );
  };

  const formatValidationErrors = (validationResults) => {
    if (!validationResults || !validationResults.length) return [];

    const errors = [];
    validationResults.forEach((result) => {
      if (!result.isValid && result.mismatches) {
        result.mismatches.forEach((mismatch) => {
          errors.push(
            `For article code ${result.articleCode}, expected value of ${mismatch.field} is ${mismatch.expected}, actual value is ${mismatch.actual}`
          );
        });
      }
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          errors.push(`For article code ${result.articleCode}: ${error}`);
        });
      }
    });

    return errors;
  };

  const isDescriptionField = (fieldKey) => {
    return ["itemName", "description"].includes(fieldKey);
  };

  const checkForDuplicates = useCallback(async () => {
    if (!documentId || !organizationConfig || duplicateCheckComplete) {
      console.log("Skipping duplicate check:", {
        documentId: !!documentId,
        organizationConfig: !!organizationConfig,
        duplicateCheckComplete,
      });
      return;
    }

    setIsCheckingDuplicates(true);
    setDuplicateError(null);

    try {
      const documentType = organizationConfig?.fields.some(
        (f) => f.key === "grnNumber"
      )
        ? "GRN"
        : organizationConfig?.fields.some((f) => f.key === "poNumber")
        ? "Purchase Order"
        : organizationConfig?.fields.some((f) => f.key === "documentNumber")
        ? "Payment Advice"
        : "Invoice";

      console.log(
        `Checking duplicates for documentId: ${documentId}, type: ${documentType}`
      );

      const response = await documentService.checkDocumentDuplicates(
        documentId,
        documentType
      );

      console.log("Duplicate check response:", response);

      if (response.success && response.data.hasDuplicates) {
        console.log("Duplicates found:", response.data.duplicates);
        setDuplicateError({
          hasDuplicates: true,
          duplicates: response.data.duplicates,
          documentNumber: response.data.currentDocumentNumber,
          documentType: response.data.documentType,
          organizationCode: response.data.organizationCode,
        });
      } else {
        console.log("No duplicates found");
        setDuplicateError(null);
      }

      setDuplicateCheckComplete(true);
    } catch (error) {
      console.error("Error checking duplicates:", error);
      setDuplicateError(null);
      setDuplicateCheckComplete(true);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, [documentId, organizationConfig, duplicateCheckComplete]);

  const getFieldConfig = (orgCode, documentType) => {
    const configs = {
      UBOARD: {
        name: "UBOARD",
        Invoice: {
          fields: [
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "buyerOrderNo", label: "Buyer Order No", type: "text" },
            { key: "invoiceDate", label: "Invoice Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            { key: "invoiceQty", label: "Invoice Qty", type: "number" },
            { key: "grossAmount", label: "Gross Amount", type: "number" },
            { key: "gstAmount", label: "GST Amount", type: "number" },
            { key: "totalAmount", label: "Total Amount", type: "number" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No.", type: "text" },
            { key: "itemName", label: "Item Name", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "qtyUnit", label: "Unit", type: "text" },
            { key: "rate", label: "Rate", type: "number" },
            { key: "gstRate", label: "GST Rate", type: "text" },
            { key: "totalAmount", label: "Amount", type: "number" },
          ],
        },
        "Purchase Order": {
          fields: [
            { key: "poNumber", label: "PO Number", type: "text" },
            { key: "poDate", label: "PO Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            { key: "deliveryDate", label: "Delivery Date", type: "date" },
            { key: "site", label: "Site", type: "text" },
            { key: "totalQty", label: "Total Qty", type: "number" },
            {
              key: "totalBasicValue",
              label: "Total Basic Value",
              type: "number",
            },
            { key: "totalIGST", label: "Total GST", type: "number" },
            {
              key: "totalOrderValue",
              label: "Total Order Value",
              type: "number",
            },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "eanNo", label: "EAN No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "baseCost", label: "Base Cost", type: "number" },
            { key: "igstPercent", label: "IGST%", type: "text" },
            { key: "igstValue", label: "IGST Value", type: "number" },
            { key: "cgstPercent", label: "CGST%", type: "text" },
            { key: "cgstValue", label: "CGST Value", type: "number" },
            { key: "sgstPercent", label: "SGST%", type: "text" },
            { key: "sgstValue", label: "SGST Value", type: "number" },
            {
              key: "totalBaseValue",
              label: "Total Base Value",
              type: "number",
            },
          ],
        },
        GRN: {
          fields: [
            { key: "grnNumber", label: "GRN Number", type: "text" },
            { key: "grnDate", label: "GRN Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "vendorInvoiceNo",
              label: "Vendor Invoice No",
              type: "text",
            },
            { key: "grnQty", label: "GRN Qty", type: "number" },
            { key: "poNumber", label: "PO Number", type: "text" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "ean", label: "EAN No.", type: "text" },
            { key: "challanQty", label: "Challan Qty", type: "number" },
            { key: "receivedQty", label: "Received Qty", type: "number" },
            { key: "acceptedQty", label: "Accepted Qty", type: "number" },
          ],
        },
        "Payment Advice": {
          fields: [
            { key: "documentNumber", label: "Document Number", type: "text" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "totalAmountSettled",
              label: "Total Amount Settled",
              type: "number",
            },
          ],
          itemFields: [
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
            { key: "paymentAmount", label: "Payment Amount", type: "number" },
            { key: "tds", label: "TDS", type: "number" },
            { key: "gstTaxHold", label: "GST Tax Hold", type: "number" },
            { key: "gstTaxPaid", label: "GST Tax Paid", type: "number" },
            { key: "remarks", label: "Remarks", type: "text" },
          ],
        },
      },
      ELZA: {
        name: "ELZA",
        Invoice: {
          fields: [
            { key: "supplierName", label: "Supplier Name", type: "text" },
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "invoiceDate", label: "Invoice Date", type: "date" },
            { key: "supplierGSTNo", label: "Supplier GST No", type: "text" },
            { key: "grossAmount", label: "Gross Amount", type: "number" },
            { key: "cgstAmount", label: "CGST Amount", type: "number" },
            { key: "sgstAmount", label: "SGST Amount", type: "number" },
            { key: "igstAmount", label: "IGST Amount", type: "number" },
            { key: "gstAmount", label: "Total GST Amount", type: "number" },
            { key: "totalAmount", label: "Total Amount", type: "number" },
          ],
          itemFields: [
            { key: "itemName", label: "Item Name", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "qtyUnit", label: "Unit", type: "text" },
            { key: "rate", label: "Rate", type: "number" },
            { key: "gstRate", label: "GST Rate", type: "text" },
            { key: "totalAmount", label: "Amount", type: "number" },
          ],
        },
        "Purchase Order": {
          fields: [
            { key: "poNumber", label: "PO Number", type: "text" },
            { key: "poDate", label: "PO Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            { key: "deliveryDate", label: "Delivery Date", type: "date" },
            { key: "site", label: "Site", type: "text" },
            {
              key: "totalBasicValue",
              label: "Total Basic Value",
              type: "number",
            },
            { key: "totalIGST", label: "Total IGST", type: "number" },
            {
              key: "totalOrderValue",
              label: "Total Order Value",
              type: "number",
            },
            { key: "totalQty", label: "Total Qty", type: "number" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "eanNo", label: "EAN No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "baseCost", label: "Base Cost", type: "number" },
            { key: "igstPercent", label: "IGST%", type: "text" },
            { key: "igstValue", label: "IGST Value", type: "number" },
            {
              key: "totalBaseValue",
              label: "Total Base Value",
              type: "number",
            },
          ],
        },
        GRN: {
          fields: [
            { key: "grnNumber", label: "GRN Number", type: "text" },
            { key: "grnDate", label: "GRN Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "vendorInvoiceNo",
              label: "Vendor Invoice No",
              type: "text",
            },
            { key: "grnQty", label: "GRN Qty", type: "number" },
            { key: "poNumber", label: "PO Number", type: "text" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "challanQty", label: "Challan Qty", type: "number" },
            { key: "receivedQty", label: "Received Qty", type: "number" },
            { key: "acceptedQty", label: "Accepted Qty", type: "number" },
          ],
        },
        "Payment Advice": {
          fields: [
            { key: "documentNumber", label: "Document Number", type: "text" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "totalAmountSettled",
              label: "Total Amount Settled",
              type: "number",
            },
          ],
          itemFields: [
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
            { key: "paymentAmount", label: "Payment Amount", type: "number" },
            { key: "tds", label: "TDS", type: "number" },
            { key: "gstTaxHold", label: "GST Tax Hold", type: "number" },
            { key: "gstTaxPaid", label: "GST Tax Paid", type: "number" },
          ],
        },
      },
      KIWI: {
        name: "KIWI",
        Invoice: {
          fields: [
            { key: "supplierName", label: "Supplier Name", type: "text" },
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "invoiceDate", label: "Invoice Date", type: "date" },
            { key: "supplierGSTNo", label: "Supplier GST No", type: "text" },
            { key: "grossAmount", label: "Gross Amount", type: "number" },
            { key: "cgstAmount", label: "CGST Amount", type: "number" },
            { key: "sgstAmount", label: "SGST Amount", type: "number" },
            { key: "igstAmount", label: "IGST Amount", type: "number" },
            { key: "gstAmount", label: "Total GST Amount", type: "number" },
            { key: "totalAmount", label: "Total Amount", type: "number" },
          ],
          itemFields: [
            { key: "itemName", label: "Item Name", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "qtyUnit", label: "Unit", type: "text" },
            { key: "rate", label: "Rate", type: "number" },
            { key: "gstRate", label: "GST Rate", type: "text" },
            { key: "totalAmount", label: "Amount", type: "number" },
          ],
        },
        "Purchase Order": {
          fields: [
            { key: "poNumber", label: "PO Number", type: "text" },
            { key: "poDate", label: "PO Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            { key: "deliveryDate", label: "Delivery Date", type: "date" },
            { key: "site", label: "Site", type: "text" },
            {
              key: "totalBasicValue",
              label: "Total Basic Value",
              type: "number",
            },
            { key: "totalIGST", label: "Total IGST", type: "number" },
            {
              key: "totalOrderValue",
              label: "Total Order Value",
              type: "number",
            },
            { key: "totalQty", label: "Total Qty", type: "number" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "hsn", label: "HSN", type: "text" },
            { key: "eanNo", label: "EAN No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "baseCost", label: "Base Cost", type: "number" },
            { key: "igstPercent", label: "IGST%", type: "text" },
            { key: "igstValue", label: "IGST Value", type: "number" },
            {
              key: "totalBaseValue",
              label: "Total Base Value",
              type: "number",
            },
          ],
        },
        GRN: {
          fields: [
            { key: "grnNumber", label: "GRN Number", type: "text" },
            { key: "grnDate", label: "GRN Date", type: "date" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "vendorInvoiceNo",
              label: "Vendor Invoice No",
              type: "text",
            },
            { key: "grnQty", label: "GRN Qty", type: "number" },
            { key: "poNumber", label: "PO Number", type: "text" },
          ],
          itemFields: [
            { key: "articleNo", label: "Article No", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "challanQty", label: "Challan Qty", type: "number" },
            { key: "receivedQty", label: "Received Qty", type: "number" },
            { key: "acceptedQty", label: "Accepted Qty", type: "number" },
          ],
        },
        "Payment Advice": {
          fields: [
            { key: "documentNumber", label: "Document Number", type: "text" },
            { key: "buyerName", label: "Buyer Name", type: "text" },
            { key: "sellerName", label: "Seller Name", type: "text" },
            {
              key: "totalAmountSettled",
              label: "Total Amount Settled",
              type: "number",
            },
          ],
          itemFields: [
            { key: "invoiceNumber", label: "Invoice Number", type: "text" },
            { key: "invoiceAmount", label: "Invoice Amount", type: "number" },
            { key: "paymentAmount", label: "Payment Amount", type: "number" },
            { key: "tds", label: "TDS", type: "number" },
            { key: "gstTaxHold", label: "GST Tax Hold", type: "number" },
            { key: "gstTaxPaid", label: "GST Tax Paid", type: "number" },
          ],
        },
      },
    };

    const orgConfig = configs[orgCode] || configs["KIWI"];
    const docTypeConfig = orgConfig[documentType] || orgConfig["Invoice"];

    return {
      name: orgConfig.name,
      fields: docTypeConfig.fields,
      itemFields: docTypeConfig.itemFields,
    };
  };

  useEffect(() => {
    if (editedData.organization?.code && editedData.documentType) {
      setOrganizationConfig(
        getFieldConfig(editedData.organization.code, editedData.documentType)
      );
    } else if (editedData.organization?.code) {
      const hasPoNumber = editedData.poNumber !== undefined;
      const hasInvoiceNumber = editedData.invoiceNumber !== undefined;
      const hasGrnNumber = editedData.grnNumber !== undefined;
      const hasDocumentNumber = editedData.documentNumber !== undefined;

      let docType = "Invoice";
      if (
        hasGrnNumber &&
        !hasInvoiceNumber &&
        !hasPoNumber &&
        !hasDocumentNumber
      ) {
        docType = "GRN";
      } else if (hasPoNumber && !hasInvoiceNumber && !hasDocumentNumber) {
        docType = "Purchase Order";
      } else if (
        hasDocumentNumber &&
        !hasInvoiceNumber &&
        !hasPoNumber &&
        !hasGrnNumber
      ) {
        docType = "Payment Advice";
      }

      setOrganizationConfig(
        getFieldConfig(editedData.organization.code, docType)
      );
    } else {
      const hasPoNumber = editedData.poNumber !== undefined;
      const hasGrnNumber = editedData.grnNumber !== undefined;
      const hasDocumentNumber = editedData.documentNumber !== undefined;

      const docType = hasGrnNumber
        ? "GRN"
        : hasPoNumber
        ? "Purchase Order"
        : hasDocumentNumber
        ? "Payment Advice"
        : "Invoice";
      setOrganizationConfig(getFieldConfig("KIWI", docType));
    }
  }, [editedData]);

  useEffect(() => {
    if (organizationConfig && documentId && !duplicateCheckComplete) {
      console.log("Organization config loaded, checking for duplicates");
      checkForDuplicates();
    }
  }, [
    organizationConfig,
    documentId,
    duplicateCheckComplete,
    checkForDuplicates,
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (documentId) {
        const documentType = organizationConfig?.fields.some(
          (f) => f.key === "grnNumber"
        )
          ? "GRN"
          : organizationConfig?.fields.some((f) => f.key === "poNumber")
          ? "Purchase Order"
          : organizationConfig?.fields.some((f) => f.key === "documentNumber")
          ? "Payment Advice"
          : "Invoice";

        await documentService.updateDocumentData(
          documentId,
          editedData,
          documentType
        );
      }
      onSave(editedData);
    } catch (error) {
      console.error("Error saving document data:", error);
      alert(
        `Failed to save data. Error: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      if (documentId) {
        const documentType = organizationConfig?.fields.some(
          (f) => f.key === "grnNumber"
        )
          ? "GRN"
          : organizationConfig?.fields.some((f) => f.key === "poNumber")
          ? "Purchase Order"
          : organizationConfig?.fields.some((f) => f.key === "documentNumber")
          ? "Payment Advice"
          : "Invoice";

        await documentService.updateDocumentStatus(
          documentId,
          "approved",
          documentType
        );
        onApprove(documentId);
      }
    } catch (error) {
      console.error("Error approving document:", error);
      alert("Failed to approve document. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleFieldChange = (fieldKey, value, fieldType) => {
    let processedValue = value;

    if (fieldType === "date" && value) {
      processedValue = value;
    }

    setEditedData((prev) => {
      const newData = { ...prev, [fieldKey]: processedValue };
      if (["cgstAmount", "sgstAmount", "igstAmount"].includes(fieldKey)) {
        const cgst = parseFloat(newData.cgstAmount) || 0;
        const sgst = parseFloat(newData.sgstAmount) || 0;
        const igst = parseFloat(newData.igstAmount) || 0;
        const totalGst = igst > 0 ? igst : cgst + sgst;
        newData.gstAmount = parseFloat(totalGst.toFixed(2));
      }
      return newData;
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...(editedData.items || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setEditedData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleAddItem = () => {
    if (!organizationConfig) return;

    const newItem = {};
    organizationConfig.itemFields.forEach((field) => {
      if (
        [
          "quantity",
          "rate",
          "baseCost",
          "totalAmount",
          "totalBaseValue",
          "discountAmount",
          "acceptedQty",
          "challanQty",
          "receivedQty",
          "igstValue",
          "cgstValue",
          "sgstValue",
          "invoiceAmount",
          "paymentAmount",
          "tds",
          "gstTaxHold",
          "gstTaxPaid",
        ].includes(field.key)
      ) {
        newItem[field.key] = "0";
      } else if (
        field.key === "gstRate" ||
        field.key === "igstPercent" ||
        field.key === "cgstPercent" ||
        field.key === "sgstPercent" ||
        field.key === "discountRate"
      ) {
        newItem[field.key] = "0";
      } else {
        newItem[field.key] = "";
      }
    });

    const updatedItems = [...(editedData.items || []), newItem];

    setEditedData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...(editedData.items || [])];
    updatedItems.splice(index, 1);

    setEditedData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleSummaryFieldChange = (fieldKey, value) => {
    setEditedData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleZoomIn = () => {
    setImageZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setImageZoomLevel(1);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  if (!organizationConfig) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading configuration...</span>
      </div>
    );
  }

  const currentStatus = documentData.status || "pending-approval";
  const isApproved = currentStatus === "approved";
  const documentType = organizationConfig.fields.some(
    (f) => f.key === "grnNumber"
  )
    ? "GRN"
    : organizationConfig.fields.some((f) => f.key === "poNumber")
    ? "Purchase Order"
    : organizationConfig.fields.some((f) => f.key === "documentNumber")
    ? "Payment Advice"
    : "Invoice";
  const documentName = documentType;

  return (
    <>
      <style jsx>{`
        .table-container {
          position: relative;
          overflow: auto;
          max-height: 400px;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 30;
          background-color: #f9fafb;
        }

        .sticky-column {
          position: sticky;
          left: 0;
          z-index: 20;
          background-color: white;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        }

        .sticky-header.sticky-column {
          z-index: 40;
          background-color: #f9fafb;
        }

        .image-zoom-container {
          position: relative;
          overflow: auto;
          width: 100%;
          height: 100%;
        }

        .zoom-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          display: flex;
          gap: 5px;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px;
          border-radius: 6px;
        }

        .zoom-button {
          background: white;
          border: none;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          transition: background-color 0.2s;
        }

        .zoom-button:hover {
          background: #f3f4f6;
        }

        .image-container {
          transform-origin: top left;
          transition: transform 0.2s ease;
        }

        .description-field {
          min-width: 250px;
          max-width: 400px;
        }

        .duplicate-error {
          background-color: #fef2f2;
          border: 2px solid #ef4444;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .duplicate-error-title {
          color: #dc2626;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .duplicate-error-content {
          color: #991b1b;
          font-size: 14px;
          line-height: 1.5;
        }

        .duplicate-list {
          margin-top: 12px;
          padding-left: 16px;
        }

        .duplicate-item {
          color: #7f1d1d;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .error-icon {
          color: #dc2626;
          margin-right: 8px;
          flex-shrink: 0;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      >
        <div
          className="relative bg-white w-screen h-screen overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
            {goBackCallback ? (
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                onClick={goBackCallback}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Files
              </button>
            ) : (
              <div className="flex items-center space-x-4"></div>
            )}
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

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full p-6">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-medium mb-4 text-center">
                  {documentName} Document
                </h3>
                <div
                  className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 min-h-[400px] relative"
                  onMouseEnter={() => setShowImageControls(true)}
                  onMouseLeave={() => setShowImageControls(false)}
                >
                  {documentData.imageUrl ? (
                    isPDF(documentData.imageUrl) ? (
                      <iframe
                        src={documentData.imageUrl}
                        title={documentName}
                        className="w-full h-full"
                        style={{ minHeight: "600px" }}
                      />
                    ) : (
                      <div className="image-zoom-container">
                        {showImageControls && (
                          <div className="zoom-controls">
                            <button
                              className="zoom-button"
                              onClick={handleZoomIn}
                              title="Zoom In"
                            >
                              +
                            </button>
                            <button
                              className="zoom-button"
                              onClick={handleZoomOut}
                              title="Zoom Out"
                            >
                              -
                            </button>
                            <button
                              className="zoom-button"
                              onClick={handleResetZoom}
                              title="Reset Zoom"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                        <div
                          className="image-container w-full h-full flex items-center justify-center"
                          style={{
                            transform: `scale(${imageZoomLevel})`,
                            cursor: imageZoomLevel > 1 ? "move" : "default",
                          }}
                        >
                          <img
                            src={documentData.imageUrl}
                            alt={documentName}
                            className="max-w-full max-h-full object-contain"
                            draggable={false}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                      No document available
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full">
                <h3 className="text-lg font-medium mb-4 text-center">
                  {isEditing
                    ? `Edit ${documentName} Data`
                    : `Extracted ${documentName} Data`}
                  <span
                    className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                      isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isApproved ? "Approved" : "Pending Approval"}
                  </span>
                </h3>

                {isCheckingDuplicates && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-600 mr-2"></div>
                      <span className="text-yellow-800 text-sm">
                        Checking for duplicates...
                      </span>
                    </div>
                  </div>
                )}

                {duplicateError && duplicateError.hasDuplicates && (
                  <div className="duplicate-error">
                    <div className="duplicate-error-title">
                      <svg
                        className="error-icon h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      File Duplicate Error
                    </div>
                    <div className="duplicate-error-content">
                      This file is a duplicate based on Organization (
                      {duplicateError.organizationCode}), Document Type (
                      {duplicateError.documentType}), and Document Number (
                      {duplicateError.documentNumber}).
                      <div className="duplicate-list">
                        <strong>Duplicate files found:</strong>
                        {duplicateError.duplicates.map((duplicate) => (
                          <div key={duplicate.id} className="duplicate-item">
                            • {duplicate.fileName} (Document:{" "}
                            {duplicate.documentNumber}, Created:{" "}
                            {new Date(duplicate.createdAt).toLocaleDateString()}
                            )
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {shouldShowValidation() &&
                  (editedData.validation_results ||
                    editedData.site_validation) && (
                    <div className="mb-4">
                      {(() => {
                        const siteValidation = editedData.site_validation;
                        const itemValidationErrors = formatValidationErrors(
                          editedData.validation_results
                        );
                        const totalItems =
                          editedData.validation_results?.length || 0;
                        const validItems =
                          editedData.validation_results?.filter(
                            (r) => r.isValid
                          ).length || 0;
                        const invalidItems = totalItems - validItems;

                        const hasSiteError =
                          siteValidation && !siteValidation.isValid;
                        const hasItemErrors = itemValidationErrors.length > 0;

                        if (!hasSiteError && !hasItemErrors) {
                          return (
                            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                              <h4 className="text-sm font-medium text-green-800 mb-2">
                                Product Master Validation
                              </h4>
                              <div className="flex space-x-4 text-xs">
                                <span className="text-green-600">
                                  Valid: {validItems}
                                </span>
                                <span className="text-gray-600">
                                  Total: {totalItems}
                                </span>
                              </div>
                              <p className="text-sm text-green-700 mt-2">
                                All line items and site code match the master
                                data
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-red-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                  Product Master Validation Errors
                                </h3>

                                {hasSiteError && (
                                  <div className="mt-2 mb-3 p-2 bg-red-100 rounded">
                                    <p className="text-sm font-medium text-red-700">
                                      Site Code Error:
                                    </p>
                                    <p className="text-sm text-red-600 mt-1">
                                      {siteValidation.error}
                                    </p>
                                  </div>
                                )}

                                {hasItemErrors && (
                                  <>
                                    <div className="flex space-x-4 text-xs mt-1 mb-2">
                                      <span className="text-green-600">
                                        Valid: {validItems}
                                      </span>
                                      <span className="text-red-600">
                                        Invalid: {invalidItems}
                                      </span>
                                      <span className="text-gray-600">
                                        Total: {totalItems}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm text-red-700">
                                      <p className="font-medium mb-1">
                                        Line Item Errors:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {itemValidationErrors.map(
                                          (error, index) => (
                                            <li key={index}>{error}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <div className="p-5 h-full overflow-y-auto">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        {organizationConfig.fields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                            </label>
                            <input
                              type={isEditing ? field.type : "text"}
                              className={`w-full px-4 py-2.5 border rounded-md ${
                                isEditing
                                  ? field.key === "site" &&
                                    editedData.site_validation &&
                                    !editedData.site_validation.isValid
                                    ? "border-red-500 bg-red-50"
                                    : "border-blue-300"
                                  : field.key === "site" &&
                                    editedData.site_validation &&
                                    !editedData.site_validation.isValid
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } ${
                                isEditing && field.key !== "gstAmount"
                                  ? "bg-white"
                                  : field.key === "site" &&
                                    editedData.site_validation &&
                                    !editedData.site_validation.isValid
                                  ? "bg-red-50"
                                  : "bg-gray-50"
                              } ${
                                [
                                  "grossAmount",
                                  "gstAmount",
                                  "totalAmount",
                                  "invoiceQty",
                                  "totalBasicValue",
                                  "totalIGST",
                                  "totalOrderValue",
                                  "totalQty",
                                  "grnQty",
                                  "totalAmountSettled",
                                  "cgstAmount",
                                  "sgstAmount",
                                  "igstAmount",
                                ].includes(field.key) && !isEditing
                                  ? "font-semibold text-green-600"
                                  : field.key === "site" &&
                                    editedData.site_validation &&
                                    !editedData.site_validation.isValid
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}
                              value={
                                isEditing && field.type === "date"
                                  ? formatDateForInput(editedData[field.key])
                                  : isEditing
                                  ? editedData[field.key] || ""
                                  : field.type === "date"
                                  ? displayDateValue(editedData[field.key])
                                  : editedData[field.key] || ""
                              }
                              onChange={(e) =>
                                [
                                  "grossAmount",
                                  "gstAmount",
                                  "totalAmount",
                                  "invoiceQty",
                                  "totalBasicValue",
                                  "totalIGST",
                                  "totalOrderValue",
                                  "totalQty",
                                  "grnQty",
                                  "totalAmountSettled",
                                ].includes(field.key)
                                  ? handleSummaryFieldChange(
                                      field.key,
                                      e.target.value
                                    )
                                  : handleFieldChange(
                                      field.key,
                                      e.target.value,
                                      field.type
                                    )
                              }
                              readOnly={!isEditing || field.key === "gstAmount"}
                            />
                            {field.key === "site" &&
                              editedData.site_validation &&
                              !editedData.site_validation.isValid && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  Invalid site code
                                </p>
                              )}
                            {[
                              "grossAmount",
                              "gstAmount",
                              "totalAmount",
                              "totalBasicValue",
                              "totalIGST",
                              "totalOrderValue",
                              "grnQty",
                              "totalAmountSettled",
                              "cgstAmount",
                              "sgstAmount",
                              "igstAmount",
                            ].includes(field.key) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {isEditing && field.key === "gstAmount"
                                  ? "Auto-calculated"
                                  : "Manual entry"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 text-lg">
                          Items
                        </h4>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
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
                            Add Item
                          </button>
                        )}
                      </div>

                      <div className="border rounded-lg shadow-sm">
                        <div
                          className="table-container"
                          style={{
                            maxHeight: "400px",
                            position: "relative",
                            overflow: "auto",
                          }}
                        >
                          <table className="min-w-full divide-y divide-gray-200 relative table-auto">
                            <thead>
                              <tr>
                                {organizationConfig.itemFields.map(
                                  (field, index) => (
                                    <th
                                      key={field.key}
                                      scope="col"
                                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50 sticky-header ${
                                        index === 0
                                          ? "sticky-column left-0 z-40 w-[180px]"
                                          : isDescriptionField(field.key)
                                          ? "whitespace-nowrap description-field"
                                          : "whitespace-nowrap max-w-xs"
                                      }`}
                                      style={
                                        index === 0
                                          ? {
                                              position: "sticky",
                                              left: 0,
                                              top: 0,
                                              zIndex: 40,
                                              backgroundColor: "#f9fafb",
                                              boxShadow:
                                                "2px 0 4px rgba(0,0,0,0.1)",
                                            }
                                          : {
                                              position: "sticky",
                                              top: 0,
                                              zIndex: 30,
                                              backgroundColor: "#f9fafb",
                                            }
                                      }
                                    >
                                      {field.label}
                                    </th>
                                  )
                                )}
                                {isEditing && (
                                  <th
                                    scope="col"
                                    className="sticky top-0 z-30 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50 sticky-header"
                                    style={{
                                      minWidth: "80px",
                                      position: "sticky",
                                      top: 0,
                                      zIndex: 30,
                                      backgroundColor: "#f9fafb",
                                    }}
                                  >
                                    Action
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {editedData.items &&
                              editedData.items.length > 0 ? (
                                editedData.items.map((item, index) => {
                                  const validationResult =
                                    shouldShowValidation()
                                      ? getValidationStatus(
                                          item,
                                          editedData.validation_results
                                        )
                                      : null;
                                  const isItemInvalid =
                                    validationResult &&
                                    !validationResult.isValid;

                                  return (
                                    <tr
                                      key={index}
                                      className={`${
                                        isEditing ? "hover:bg-gray-50" : ""
                                      } ${isItemInvalid ? "bg-red-50" : ""}`}
                                    >
                                      {organizationConfig.itemFields.map(
                                        (field, fieldIndex) => {
                                          const validationError =
                                            shouldShowValidation()
                                              ? getFieldValidationError(
                                                  item,
                                                  field.key,
                                                  editedData.validation_results
                                                )
                                              : null;

                                          return (
                                            <td
                                              key={field.key}
                                              className={`px-4 py-3 text-sm border-r border-gray-200 relative group ${
                                                fieldIndex === 0
                                                  ? "sticky-column left-0 bg-white z-20 w-[180px]"
                                                  : isDescriptionField(
                                                      field.key
                                                    )
                                                  ? "description-field"
                                                  : "max-w-xs"
                                              } ${
                                                isItemInvalid &&
                                                fieldIndex === 0
                                                  ? "bg-red-50"
                                                  : ""
                                              }`}
                                              style={
                                                fieldIndex === 0
                                                  ? {
                                                      position: "sticky",
                                                      left: 0,
                                                      zIndex: 20,
                                                      backgroundColor:
                                                        isItemInvalid
                                                          ? "#fef2f2"
                                                          : "white",
                                                      boxShadow:
                                                        "2px 0 4px rgba(0,0,0,0.1)",
                                                    }
                                                  : {}
                                              }
                                            >
                                              {isEditing ? (
                                                <input
                                                  type={field.type}
                                                  className={`w-full px-2 py-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                                    validationError
                                                      ? "border-red-500 bg-red-50"
                                                      : "border-gray-300"
                                                  } ${
                                                    isDescriptionField(
                                                      field.key
                                                    )
                                                      ? "min-w-[250px]"
                                                      : ""
                                                  }`}
                                                  value={item[field.key] || ""}
                                                  onChange={(e) =>
                                                    handleItemChange(
                                                      index,
                                                      field.key,
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <span
                                                  className={`block text-sm break-words ${
                                                    validationError
                                                      ? "text-red-600 font-medium"
                                                      : "text-gray-900"
                                                  } ${
                                                    fieldIndex === 0
                                                      ? "font-medium"
                                                      : ""
                                                  }`}
                                                >
                                                  {[
                                                    "totalAmount",
                                                    "rate",
                                                    "discountAmount",
                                                    "baseCost",
                                                    "igstValue",
                                                    "cgstValue",
                                                    "sgstValue",
                                                    "totalBaseValue",
                                                    "acceptedQty",
                                                    "challanQty",
                                                    "receivedQty",
                                                    "invoiceAmount",
                                                    "paymentAmount",
                                                    "tds",
                                                    "gstTaxHold",
                                                    "gstTaxPaid",
                                                  ].includes(field.key) &&
                                                  item[field.key]
                                                    ? parseFloat(
                                                        item[field.key]
                                                      ).toFixed(2)
                                                    : item[field.key] || "-"}
                                                </span>
                                              )}
                                            </td>
                                          );
                                        }
                                      )}
                                      {isEditing && (
                                        <td
                                          className="px-4 py-3 text-center border-r border-gray-200"
                                          style={{ minWidth: "80px" }}
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveItem(index)
                                            }
                                            className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200"
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
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td
                                    colSpan={
                                      organizationConfig.itemFields.length +
                                      (isEditing ? 1 : 0)
                                    }
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                  >
                                    No items found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-5 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                onClick={onClose}
                disabled={isSaving || isApproving}
              >
                Cancel
              </button>

              {isEditing ? (
                <button
                  type="button"
                  className={`px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSaving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                  } cursor-pointer`}
                  onClick={handleSave}
                  disabled={isSaving || isApproving}
                >
                  {isSaving ? (
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
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    onClick={handleStartEditing}
                    disabled={isSaving || isApproving}
                  >
                    Edit {documentName}
                  </button>

                  {!isApproved && (
                    <button
                      type="button"
                      className={`px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isApproving
                          ? "bg-green-400"
                          : "bg-green-600 hover:bg-green-700"
                      } cursor-pointer`}
                      onClick={handleApprove}
                      disabled={isSaving || isApproving}
                    >
                      {isApproving ? (
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
                          Approving...
                        </span>
                      ) : (
                        "Approve"
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

DocumentDataDisplay.propTypes = {
  documentData: PropTypes.shape({
    imageUrl: PropTypes.string,
    status: PropTypes.string,
    documentType: PropTypes.string,
    organization: PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
    }),
    invoiceNumber: PropTypes.string,
    poNumber: PropTypes.string,
    grnNumber: PropTypes.string,
    documentNumber: PropTypes.string,
    supplierName: PropTypes.string,
    buyerOrderNo: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
    validation_results: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  goBackCallback: PropTypes.func,
  documentId: PropTypes.string,
};

export default DocumentDataDisplay;
