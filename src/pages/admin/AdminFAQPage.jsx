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
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 min-h-[600px]">
      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {submitText === "Tambah FAQ"
              ? "✨ Buat FAQ Baru"
              : "🔄 Perbarui FAQ"}
          </h3>
          <p className="text-base text-gray-600">
            {submitText === "Tambah FAQ"
              ? "Tambahkan pertanyaan dan jawaban yang sering ditanyakan pengguna"
              : "Perbarui informasi FAQ yang sudah ada dengan detail terbaru"}
          </p>
        </div>

        {/* Question Field */}
        <div className="space-y-3">
          <label
            htmlFor="question"
            className="flex items-center text-sm font-bold text-gray-700"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Pertanyaan <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleFormChange}
              placeholder="Tulis pertanyaan yang sering ditanyakan pengguna..."
              rows={4}
              className={`w-full px-5 py-4 bg-white border-2 rounded-xl focus:outline-none transition-all duration-300 resize-none text-sm shadow-sm hover:shadow-md ${
                errors.question
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }`}
            />
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
              {formData.question?.length || 0}/500
            </div>
          </div>
          {errors.question && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.question}
            </div>
          )}
        </div>

        {/* Answer Field */}
        <div className="space-y-3">
          <label
            htmlFor="answer"
            className="flex items-center text-sm font-bold text-gray-700"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Jawaban <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <textarea
              id="answer"
              name="answer"
              value={formData.answer}
              onChange={handleFormChange}
              placeholder="Berikan jawaban yang jelas, informatif, dan mudah dipahami..."
              rows={6}
              className={`w-full px-5 py-4 bg-white border-2 rounded-xl focus:outline-none transition-all duration-300 resize-none text-sm shadow-sm hover:shadow-md ${
                errors.answer
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }`}
            />
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
              {formData.answer?.length || 0}/1000
            </div>
          </div>
          {errors.answer && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.answer}
            </div>
          )}
        </div>

        {/* Category and Order Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Field */}
          <div className="space-y-3">
            <label
              htmlFor="category"
              className="flex items-center text-sm font-bold text-gray-700"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              Kategori <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              className={`w-full px-5 py-4 bg-white border-2 rounded-xl focus:outline-none transition-all duration-300 text-sm shadow-sm hover:shadow-md ${
                errors.category
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }`}
            >
              <option value="">Pilih Kategori</option>
              <option value="akademik">📚 Akademik</option>
              <option value="fasilitas">🏢 Fasilitas</option>
              <option value="organisasi">👥 Organisasi Mahasiswa</option>
              <option value="ukm">🎯 Unit Kegiatan Mahasiswa (UKM)</option>
              <option value="keuangan">💰 Keuangan</option>
              <option value="umum">❓ Pertanyaan Umum</option>
              <option value="lainnya">🔧 Lainnya</option>
            </select>
            {errors.category && (
              <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.category}
              </div>
            )}
          </div>

          {/* Order Field */}
          <div className="space-y-3">
            <label
              htmlFor="order"
              className="flex items-center text-sm font-bold text-gray-700"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              Urutan Tampil
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleFormChange}
              placeholder="Nomor urutan (opsional)"
              min="0"
              className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm shadow-sm hover:shadow-md"
            />
            <p className="text-xs text-gray-500 ml-1">
              Kosongkan untuk urutan otomatis berdasarkan waktu pembuatan
            </p>
          </div>
        </div>

        {/* Active Status - Updated layout */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-800">
                  Status Publikasi FAQ
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  FAQ akan ditampilkan di halaman publik jika diaktifkan
                </p>
              </div>
            </div>
            <div className="flex items-center ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="sr-only peer"
                />
                <div
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner ${
                    formData.isActive
                      ? "bg-gradient-to-r from-green-500 to-blue-500"
                      : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg border border-gray-200 transition-all duration-300 ${
                      formData.isActive ? "left-9" : "left-1"
                    }`}
                  ></div>
                </div>
              </label>
              <div className="ml-4 min-w-0">
                {formData.isActive ? (
                  <span className="text-green-600 font-semibold text-sm whitespace-nowrap flex items-center">
                    <span className="mr-1">✅</span>
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium text-sm whitespace-nowrap flex items-center">
                    <span className="mr-1">❌</span>
                    <span>Non-aktif</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 px-8 rounded-2xl font-bold text-base transition-all duration-300 transform shadow-lg ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-gray-500"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Menyimpan FAQ...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{submitText}</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
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

  // Get category label - Updated to match new categories
  const getCategoryLabel = (category) => {
    const categoryMap = {
      akademik: "Akademik",
      fasilitas: "Fasilitas",
      organisasi: "Organisasi Mahasiswa",
      ukm: "Unit Kegiatan Mahasiswa (UKM)",
      keuangan: "Keuangan",
      umum: "Pertanyaan Umum",
      lainnya: "Lainnya",
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
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
        <Button
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 w-full sm:w-auto hover:scale-105 duration-300 transition-all hover:shadow-xl"
        >
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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

          <div>
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kategori
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="akademik">Akademik</option>
              <option value="fasilitas">Fasilitas</option>
              <option value="organisasi">Organisasi Mahasiswa</option>
              <option value="ukm">Unit Kegiatan Mahasiswa (UKM)</option>
              <option value="keuangan">Keuangan</option>
              <option value="umum">Pertanyaan Umum</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={resetFilters}
              className="w-full font-semibold px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md hover:scale-90 duration-300 transition-all hover:shadow-xl"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-sm text-gray-600">
          Total: {faqs.length} FAQ | Aktif:{" "}
          {faqs.filter((f) => f.isActive).length} | Non-aktif:{" "}
          {faqs.filter((f) => !f.isActive).length}
        </p>
      </div>

      {/* FAQ List */}
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
                        }`}
                      >
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
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-white hover:text-blue-600 border-blue-500 border-1 hover:scale-105 duration-300 transition-all hover:shadow-xl"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => openDeleteModal(faq)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-white hover:text-red-600 border-red-500 border-1 hover:scale-105 duration-300 transition-all hover:shadow-xl"
                    >
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
                className="px-3 py-1 text-sm text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed"
              >
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
                className="px-3 py-1 text-sm text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title=""
        size="2xl"
      >
        <FAQForm
          onSubmit={handleAddFAQ}
          submitText="Tambah FAQ"
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title=""
        size="2xl"
      >
        <FAQForm
          onSubmit={handleEditFAQ}
          submitText="Perbarui FAQ"
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title=""
        size="lg"
      >
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ⚠️ Konfirmasi Hapus FAQ
            </h3>
            <p className="text-base text-gray-600">
              Tindakan ini tidak dapat dibatalkan setelah dilakukan
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm mb-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-2">
                  Apakah Anda yakin ingin menghapus FAQ ini?
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  FAQ yang dihapus tidak dapat dikembalikan dan akan hilang
                  secara permanen dari sistem.
                </p>

                {/* FAQ Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-400">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Pertanyaan yang akan dihapus:
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    "{selectedFAQ?.question}"
                  </p>
                  {selectedFAQ?.category && (
                    <div className="mt-3 flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        Kategori:
                      </span>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getCategoryLabel(selectedFAQ.category)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={closeDeleteModal}
              className="w-full py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-gray-50 hover:border-gray-400 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Batal
              </div>
            </button>

            <button
              onClick={handleDeleteFAQ}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Ya, Hapus FAQ
              </div>
            </button>
          </div>

          {/* Additional Warning Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Tip: Sebaiknya nonaktifkan FAQ terlebih dahulu sebelum
              menghapusnya
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFAQPage;
