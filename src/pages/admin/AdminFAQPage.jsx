import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import Button from "../../components/forms/Button";

const FAQForm = ({ onSubmit, submitText, formData, setFormData, isSubmitting }) => {
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
    
    fieldsToValidate.forEach(field => {
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle form blur (validation on field exit)
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle form submit with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(e);
  };

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'account', label: 'Account & Registration' },
    { value: 'tickets', label: 'Tickets & Support' },
    { value: 'contacts', label: 'Contacts & Information' },
    { value: 'technical', label: 'Technical Issues' },
    { value: 'features', label: 'Features & Usage' }
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleFormChange}
          onBlur={handleFieldBlur}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.category 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:ring-blue-500"
          }`}
          required
        >
          <option value="">Pilih Kategori</option>
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Pertanyaan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="question"
          value={formData.question}
          onChange={handleFormChange}
          onBlur={handleFieldBlur}
          placeholder="Masukkan pertanyaan FAQ"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.question 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:ring-blue-500"
          }`}
          required
        />
        {errors.question && (
          <p className="mt-1 text-sm text-red-600">{errors.question}</p>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Jawaban <span className="text-red-500">*</span>
        </label>
        <textarea
          name="answer"
          value={formData.answer}
          onChange={handleFormChange}
          onBlur={handleFieldBlur}
          rows="6"
          placeholder="Masukkan jawaban untuk pertanyaan FAQ"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.answer 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:ring-blue-500"
          }`}
          required
        />
        {errors.answer && (
          <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Order/Urutan
        </label>
        <input
          type="number"
          name="order"
          value={formData.order}
          onChange={handleFormChange}
          min="0"
          placeholder="Urutan tampil (0 = pertama)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Semakin kecil angka, semakin atas posisinya. Biarkan kosong untuk urutan otomatis.
        </p>
      </div>

      <div className="mb-6">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleFormChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700">Aktif (tampilkan di halaman FAQ)</span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('closeModal'))}
          className="bg-red-600 text-white hover:bg-white hover:text-red-600 border border-red-600 transition-colors duration-200"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
          className={`${
            isSubmitting || Object.keys(errors).some(key => errors[key])
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
          }`}
        >
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: "",
    isActive: true
  });

  // Fetch FAQs
  useEffect(() => {
    if (userRole !== "admin") return;
    
    const fetchFAQs = async () => {
      try {
        const faqsQuery = query(
          collection(db, "faqs"),
          orderBy("order", "asc")
        );
        
        const faqsSnapshot = await getDocs(faqsQuery);
        const faqsList = faqsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFaqs(faqsList);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        setToast({
          message: "Gagal memuat data FAQ",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [userRole]);

  // Clear toast
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: "", type: "success" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Listen for close modal events
  useEffect(() => {
    const handleCloseModal = () => {
      closeAddModal();
      closeEditModal();
    };

    window.addEventListener('closeModal', handleCloseModal);
    return () => window.removeEventListener('closeModal', handleCloseModal);
  }, []);

  // Get category label
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'general': 'General',
      'account': 'Account & Registration',
      'tickets': 'Tickets & Support',
      'contacts': 'Contacts & Information',
      'technical': 'Technical Issues',
      'features': 'Features & Usage'
    };
    return categoryMap[category] || category;
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || faq.category === filterCategory;
    
    let matchesStatus = true;
    if (filterStatus === "active") {
      matchesStatus = faq.isActive === true;
    } else if (filterStatus === "inactive") {
      matchesStatus = faq.isActive === false;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      order: "",
      isActive: true
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
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, "faqs"), faqData);
      
      // Update local state
      const newFAQ = { 
        id: docRef.id, 
        ...faqData
      };
      setFaqs(prev => [...prev, newFAQ].sort((a, b) => a.order - b.order));
      
      setToast({
        message: "FAQ berhasil ditambahkan",
        type: "success"
      });
      
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding FAQ:", error);
      setToast({
        message: error.message || "Gagal menambahkan FAQ",
        type: "error"
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
        type: "error"
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
        updatedAt: new Date()
      };
      
      await updateDoc(faqRef, updatedData);
      
      // Update local state
      setFaqs(prev => prev.map(faq => 
        faq.id === selectedFAQ.id 
          ? { ...faq, ...updatedData }
          : faq
      ).sort((a, b) => a.order - b.order));
      
      setToast({
        message: "FAQ berhasil diperbarui",
        type: "success"
      });
      
      resetForm();
      setIsEditModalOpen(false);
      setSelectedFAQ(null);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      setToast({
        message: error.message || "Gagal memperbarui FAQ",
        type: "error"
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
      
      setFaqs(prev => prev.filter(faq => faq.id !== selectedFAQ.id));
      
      setToast({
        message: "FAQ berhasil dihapus",
        type: "success"
      });
      
      setIsDeleteModalOpen(false);
      setSelectedFAQ(null);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setToast({
        message: "Gagal menghapus FAQ",
        type: "error"
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
      isActive: faq.isActive !== false
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

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kelola FAQ</h1>
        <Button
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
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
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Cari
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pertanyaan atau jawaban"
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Semua Kategori</option>
                <option value="general">General</option>
                <option value="account">Account & Registration</option>
                <option value="tickets">Tickets & Support</option>
                <option value="contacts">Contacts & Information</option>
                <option value="technical">Technical Issues</option>
                <option value="features">Features & Usage</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <p className="text-gray-600">
          Total: {faqs.length} FAQ | Menampilkan: {filteredFAQs.length} FAQ | 
          Aktif: {faqs.filter(f => f.isActive).length} | 
          Non-aktif: {faqs.filter(f => !f.isActive).length}
        </p>
      </div>
      
      {/* FAQs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urutan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pertanyaan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFAQs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada FAQ yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredFAQs.map((faq) => (
                  <tr key={faq.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faq.order}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs">
                        {faq.question}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {faq.answer.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {getCategoryLabel(faq.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        faq.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {faq.isActive ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(faq)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(faq)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add FAQ Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Tambah FAQ"
        size="lg"
      >
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
        size="lg"
      >
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
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Apakah Anda yakin ingin menghapus FAQ ini?
          </p>
          <p className="text-gray-800 font-medium mb-6">
            {selectedFAQ?.question}
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={closeDeleteModal}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteFAQ}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFAQPage;