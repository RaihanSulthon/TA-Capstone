import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase-config";
import { useAuth } from "../../contexts/Authcontexts";
import Button from "../../components/forms/Button";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

// FAQForm Component
const FAQForm = ({
  onSubmit,
  submitText,
  formData,
  setFormData,
  isSubmitting,
}) => {
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "question":
        if (!value.trim()) {
          error = "Pertanyaan wajib diisi";
        } else if (value.trim().length < 10) {
          error = "Pertanyaan harus minimal 10 karakter";
        }
        break;

      case "answer":
        if (!value.trim()) {
          error = "Jawaban wajib diisi";
        } else if (value.trim().length < 10) {
          error = "Jawaban harus minimal 10 karakter";
        }
        break;

      case "category":
        if (!value.trim()) {
          error = "Kategori wajib diisi";
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ["question", "answer", "category"];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field] || "");
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Question Field */}
      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-gray-700 mb-1">
          Pertanyaan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleFormChange}
          placeholder="Masukkan pertanyaan FAQ"
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.question
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.question && (
          <p className="mt-1 text-sm text-red-600">{errors.question}</p>
        )}
      </div>

      {/* Answer Field */}
      <div>
        <label
          htmlFor="answer"
          className="block text-sm font-medium text-gray-700 mb-1">
          Jawaban <span className="text-red-500">*</span>
        </label>
        <textarea
          id="answer"
          name="answer"
          value={formData.answer}
          onChange={handleFormChange}
          placeholder="Masukkan jawaban FAQ"
          rows={5}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.answer
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.answer && (
          <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
        )}
      </div>

      {/* Category Field */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-1">
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleFormChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.category
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}>
          <option value="">Pilih Kategori</option>
          <option value="general">General</option>
          <option value="account">Account & Registration</option>
          <option value="tickets">Tickets & Support</option>
          <option value="contacts">Contacts & Information</option>
          <option value="technical">Technical Issues</option>
          <option value="features">Features & Usage</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Order Field */}
      <div>
        <label
          htmlFor="order"
          className="block text-sm font-medium text-gray-700 mb-1">
          Urutan
        </label>
        <input
          type="number"
          id="order"
          name="order"
          value={formData.order}
          onChange={handleFormChange}
          placeholder="Nomor urutan (opsional)"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleFormChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="isActive"
          className="ml-2 text-sm font-medium text-gray-700">
          FAQ Aktif
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-white hover:text-blue-600 hover:border-blue-500 border-1 hover:scale-100 duration-300 transition-all hover:shadow-xl"
          }`}>
          {isSubmitting ? "Menyimpan..." : submitText}
        </Button>
      </div>
    </form>
  );
};

const AdminFAQPage = () => {
  const { userRole } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: "",
    isActive: true,
  });
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Clear toast after showing
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: "", type: "success" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = () => {
      const q = query(collection(db, "faqs"), orderBy("order", "asc"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const faqsList = [];
        querySnapshot.forEach((doc) => {
          faqsList.push({ id: doc.id, ...doc.data() });
        });
        setFaqs(faqsList);
        setLoading(false);
      });

      return unsubscribe;
    };

    fetchFAQs();
  }, []);

  // Get category label
  const getCategoryLabel = (category) => {
    const categoryMap = {
      general: "General",
      account: "Account & Registration",
      tickets: "Tickets & Support",
      contacts: "Contacts & Information",
      technical: "Technical Issues",
      features: "Features & Usage",
    };
    return categoryMap[category] || category;
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || faq.category === filterCategory;

    let matchesStatus = true;
    if (filterStatus === "active") {
      matchesStatus = faq.isActive === true;
    } else if (filterStatus === "inactive") {
      matchesStatus = faq.isActive === false;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFAQs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFAQs = filteredFAQs.slice(startIndex, startIndex + itemsPerPage);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      order: "",
      isActive: true,
    });
  };

  // Handle add FAQ
  const handleAddFAQ = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const faqData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        order: formData.order ? parseInt(formData.order) : faqs.length,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "faqs"), faqData);

      setToast({
        message: "FAQ berhasil ditambahkan",
        type: "success",
      });

      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding FAQ:", error);
      setToast({
        message: error.message || "Gagal menambahkan FAQ",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit FAQ
  const handleEditFAQ = async (e) => {
    e.preventDefault();

    if (!selectedFAQ) {
      setToast({
        message: "FAQ tidak ditemukan",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const faqRef = doc(db, "faqs", selectedFAQ.id);
      const updatedData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        order: formData.order ? parseInt(formData.order) : selectedFAQ.order,
        isActive: formData.isActive,
        updatedAt: new Date(),
      };

      await updateDoc(faqRef, updatedData);

      setToast({
        message: "FAQ berhasil diperbarui",
        type: "success",
      });

      resetForm();
      setIsEditModalOpen(false);
      setSelectedFAQ(null);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      setToast({
        message: error.message || "Gagal memperbarui FAQ",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete FAQ
  const handleDeleteFAQ = async () => {
    if (!selectedFAQ) return;

    try {
      await deleteDoc(doc(db, "faqs", selectedFAQ.id));

      setToast({
        message: "FAQ berhasil dihapus",
        type: "success",
      });

      setIsDeleteModalOpen(false);
      setSelectedFAQ(null);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setToast({
        message: "Gagal menghapus FAQ",
        type: "error",
      });
    }
  };

  // Open modals
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (faq) => {
    setSelectedFAQ(faq);
    setFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "",
      order: faq.order?.toString() || "",
      isActive: faq.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (faq) => {
    setSelectedFAQ(faq);
    setIsDeleteModalOpen(true);
  };

  // Close modals
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFAQ(null);
    resetForm();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedFAQ(null);
  };

  if (userRole !== "admin") {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Anda tidak memiliki akses untuk halaman ini</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
        <Button
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 w-full sm:w-auto hover:scale-105 duration-300 transition-all hover:shadow-xl">
          Tambah FAQ
        </Button>
      </div>

      {/* Toast notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}

      {/* Filters - Mobile Responsive like Ticket Management */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1">
              Cari
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pertanyaan atau jawaban"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Kategori</option>
              <option value="general">General</option>
              <option value="account">Account & Registration</option>
              <option value="tickets">Tickets & Support</option>
              <option value="contacts">Contacts & Information</option>
              <option value="technical">Technical Issues</option>
              <option value="features">Features & Usage</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <div className="pt-2">
            <button
              onClick={resetFilters}
              className="w-full font-semibold px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md hover:scale-90 duration-300 transition-all hover:shadow-xl">
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <p className="text-sm text-gray-600">
          Total: {faqs.length} FAQ | Aktif:{" "}
          {faqs.filter((f) => f.isActive).length} | Non-aktif:{" "}
          {faqs.filter((f) => !f.isActive).length}
        </p>
      </div>

      {/* FAQ List - Mobile Card Style like Image 4 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {currentFAQs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada FAQ yang ditemukan
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentFAQs.map((faq, index) => (
              <div key={faq.id} className="p-4 hover:bg-gray-50">
                {/* FAQ Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        #{faq.order}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          faq.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {faq.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm leading-tight">
                      {faq.question.length > 20
                        ? `${faq.question.substring(0, 20)}...`
                        : faq.question}
                    </h3>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openEditModal(faq)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-white hover:text-blue-600 border-blue-500 border-1 hover:scale-105 duration-300 transition-all hover:shadow-xl">
                      Detail
                    </button>
                    <button
                      onClick={() => openDeleteModal(faq)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-white hover:text-red-600 border-red-500 border-1 hover:scale-105 duration-300 transition-all hover:shadow-xl">
                      Hapus
                    </button>
                  </div>
                </div>

                {/* FAQ Details */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Kategori:</span>{" "}
                    {getCategoryLabel(faq.category)}
                  </div>
                  <div>
                    <span className="font-medium">Jawaban:</span>{" "}
                    {faq.answer?.substring(0, 100)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed">
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add FAQ Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Tambah FAQ"
        size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <FAQForm
            onSubmit={handleAddFAQ}
            submitText="Tambah FAQ"
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>

      {/* Edit FAQ Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit FAQ"
        size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <FAQForm
            onSubmit={handleEditFAQ}
            submitText="Perbarui FAQ"
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus"
        size="sm">
        <div>
          <p className="text-gray-600 mb-4">
            Apakah Anda yakin ingin menghapus FAQ ini?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            "{selectedFAQ?.question}"
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={closeDeleteModal}
              className="bg-blue-600 text-white hover:bg-white border hover:text-blue-600 transition duration-300">
              Batal
            </Button>
            <Button
              onClick={handleDeleteFAQ}
              className="bg-red-600 text-white hover:bg-white hover:text-red-600 border border-red-600 transition-colors duration-200">
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFAQPage;
