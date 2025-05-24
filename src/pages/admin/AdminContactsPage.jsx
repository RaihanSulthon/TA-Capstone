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
  orderBy,
  where 
} from "firebase/firestore";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import Button from "../../components/forms/Button";

const ContactForm = ({ onSubmit, submitText, formData, setFormData, isSubmitting }) => {
  const [errors, setErrors] = useState({});

  // Convert file to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  // Validation functions
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "nama":
        if (!value.trim()) {
          error = "Nama lengkap wajib diisi";
        } else if (value.trim().length < 2) {
          error = "Nama harus minimal 2 karakter";
        }
        break;
        
      case "email":
        if (!value.trim()) {
          error = "Email wajib diisi";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Format email tidak valid";
        } else if (!value.endsWith("@telkomuniversity.ac.id")) {
          error = "Email harus berakhiran @telkomuniversity.ac.id";
        }
        break;
        
      case "office":
        if (!value.trim()) {
          error = "Ruang kantor wajib diisi";
        }
        break;
        
      case "bidangKeahlian":
        if (!value.trim()) {
          error = "Bidang keahlian wajib diisi";
        } else if (value.trim().length < 5) {
          error = "Bidang keahlian harus minimal 5 karakter";
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
    const fieldsToValidate = ["nama", "email", "office", "bidangKeahlian"];
    
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
    const { name, value, files } = e.target;
    
    if (name === "photoFile" && files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert("File harus berupa gambar");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Ukuran file tidak boleh lebih dari 5MB");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        photoFile: file,
        photoType: file.type,
        photoName: file.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ""
        }));
      }
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleFormChange}
            onBlur={handleFieldBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.nama 
                ? "border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:ring-blue-500"
            }`}
            required
          />
          {errors.nama && (
            <p className="mt-1 text-sm text-red-600">{errors.nama}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            onBlur={handleFieldBlur}
            placeholder="nama@telkomuniversity.ac.id"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.email 
                ? "border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:ring-blue-500"
            }`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Ruang Kantor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="office"
            value={formData.office}
            onChange={handleFormChange}
            onBlur={handleFieldBlur}
            placeholder="Contoh: Gedung A Lt. 2 Ruang 201"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.office 
                ? "border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:ring-blue-500"
            }`}
            required
          />
          {errors.office && (
            <p className="mt-1 text-sm text-red-600">{errors.office}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Bidang Keahlian <span className="text-red-500">*</span>
        </label>
        <textarea
          name="bidangKeahlian"
          value={formData.bidangKeahlian}
          onChange={handleFormChange}
          onBlur={handleFieldBlur}
          rows="4"
          placeholder="Contoh: Artificial Intelligence, Software Engineering, Machine Learning"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.bidangKeahlian 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:ring-blue-500"
          }`}
          required
        />
        {errors.bidangKeahlian && (
          <p className="mt-1 text-sm text-red-600">{errors.bidangKeahlian}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          <strong>Tips:</strong> Pisahkan setiap bidang keahlian dengan koma (,). Setiap bidang akan ditampilkan sebagai tag terpisah di halaman kontak.
        </p>
      </div>
      
      <div className="mt-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Foto Profil
        </label>
        
        {!formData.photoFile && !formData.photoBase64 ? (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span></p>
                <p className="text-xs text-gray-500">JPG, PNG atau GIF (Maks. 5MB)</p>
              </div>
              <input 
                type="file" 
                name="photoFile"
                onChange={handleFormChange}
                accept="image/*" 
                className="hidden" 
              />
            </label>
          </div>
        ) : (
          <div className="border rounded-md p-4 bg-gray-50">
            <div className="flex flex-col">
              <div className="w-full h-48 bg-gray-200 rounded-md mb-2 overflow-hidden relative">
                <img 
                  src={formData.photoFile ? URL.createObjectURL(formData.photoFile) : formData.photoBase64} 
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm font-medium text-gray-900">
                  {formData.photoFile ? formData.photoFile.name : formData.photoName || "Foto Profil"}
                  {formData.photoFile && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({(formData.photoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev, 
                    photoFile: null, 
                    photoBase64: "", 
                    photoType: "", 
                    photoName: ""
                  }))}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Hapus Foto
                </button>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Format: JPG, PNG, GIF. Maksimal 5MB
        </p>
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

const AdminContactsPage = () => {
  const { userRole } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    phone: "",
    office: "",
    bidangKeahlian: "",
    photoFile: null,
    photoBase64: "",
    photoType: "",
    photoName: ""
  });

  // Convert file to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  // Fetch contacts - ambil dari users collection dengan role "dosen_public"
  useEffect(() => {
    if (userRole !== "admin") return;
    
    const fetchContacts = async () => {
      try {
        // Query user dengan role "dosen_public" - ini akan bisa dibaca publik
        const contactsQuery = query(
          collection(db, "users"),
          where("role", "==", "dosen_public"),
          orderBy("name", "asc")
        );
        
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Map fields untuk compatibility
          nama: doc.data().name,
          bidangKeahlian: doc.data().expertise || doc.data().bidangKeahlian
        }));
        
        setContacts(contactsList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setToast({
          message: "Gagal memuat data kontak",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
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

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.bidangKeahlian?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form with errors
  const resetForm = () => {
    setFormData({
      nama: "",
      email: "",
      phone: "",
      office: "",
      bidangKeahlian: "",
      photoFile: null,
      photoBase64: "",
      photoType: "",
      photoName: ""
    });
  };

  // Handle add contact with improved validation
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      let photoBase64 = "";
      let photoType = "";
      let photoName = "";
      
      if (formData.photoFile) {
        try {
          const base64Data = await fileToBase64(formData.photoFile);
          photoBase64 = base64Data;
          photoType = formData.photoFile.type;
          photoName = formData.photoFile.name;
        } catch (error) {
          console.error("Error converting file to base64:", error);
          setToast({
            message: "Gagal mengproses gambar. Silakan coba lagi.",
            type: "error"
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      const contactData = {
        name: formData.nama.trim(),
        email: formData.email.trim().toLowerCase(),
        office: formData.office.trim(),
        expertise: formData.bidangKeahlian.trim(),
        bidangKeahlian: formData.bidangKeahlian.trim(),
        photoBase64: photoBase64,
        photoType: photoType,
        photoName: photoName,
        role: "dosen_public",
        isPublicContact: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, "users"), contactData);
      
      // Update local state
      const newContact = { 
        id: docRef.id, 
        ...contactData,
        nama: contactData.name // Map untuk display
      };
      setContacts(prev => [...prev, newContact]);
      
      setToast({
        message: "Kontak berhasil ditambahkan",
        type: "success"
      });
      
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding contact:", error);
      setToast({
        message: error.message || "Gagal menambahkan kontak",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit contact with improved validation
  const handleEditContact = async (e) => {
    e.preventDefault();
    
    if (!selectedContact) {
      setToast({
        message: "Kontak tidak ditemukan",
        type: "error"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let photoBase64 = formData.photoBase64;
      let photoType = formData.photoType;
      let photoName = formData.photoName;
      
      if (formData.photoFile) {
        try {
          const base64Data = await fileToBase64(formData.photoFile);
          photoBase64 = base64Data;
          photoType = formData.photoFile.type;
          photoName = formData.photoFile.name;
        } catch (error) {
          console.error("Error converting file to base64:", error);
          setToast({
            message: "Gagal mengproses gambar. Silakan coba lagi.",
            type: "error"
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      const contactRef = doc(db, "users", selectedContact.id);
      const updatedData = {
        name: formData.nama.trim(),
        email: formData.email.trim().toLowerCase(),
        office: formData.office.trim(),
        expertise: formData.bidangKeahlian.trim(),
        bidangKeahlian: formData.bidangKeahlian.trim(),
        photoBase64: photoBase64,
        photoType: photoType,
        photoName: photoName,
        updatedAt: new Date()
      };
      
      await updateDoc(contactRef, updatedData);
      
      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === selectedContact.id 
          ? { ...contact, ...updatedData, nama: updatedData.name }
          : contact
      ));
      
      setToast({
        message: "Kontak berhasil diperbarui",
        type: "success"
      });
      
      resetForm();
      setIsEditModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error updating contact:", error);
      setToast({
        message: error.message || "Gagal memperbarui kontak",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    
    try {
      await deleteDoc(doc(db, "users", selectedContact.id));
      
      setContacts(prev => prev.filter(contact => contact.id !== selectedContact.id));
      
      setToast({
        message: "Kontak berhasil dihapus",
        type: "success"
      });
      
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      setToast({
        message: "Gagal menghapus kontak",
        type: "error"
      });
    }
  };

  // Open modals
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setFormData({
      nama: contact.name || contact.nama || "",
      email: contact.email || "",
      office: contact.office || "",
      bidangKeahlian: contact.expertise || contact.bidangKeahlian || "",
      photoFile: null,
      photoBase64: contact.photoBase64 || "",
      photoType: contact.photoType || "",
      photoName: contact.photoName || ""
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  // Close modals
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedContact(null);
    resetForm();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedContact(null);
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
        <h1 className="text-2xl font-bold">Kelola Kontak Dosen</h1>
        <Button
          onClick={openAddModal}
          className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
        >
          Tambah Kontak
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
      
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kontak berdasarkan nama, email, atau bidang keahlian"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <p className="text-gray-600">
          Total: {contacts.length} kontak | Menampilkan: {filteredContacts.length} kontak
        </p>
      </div>
      
      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bidang Keahlian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada kontak yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.photoBase64 ? (
                        <img
                          src={contact.photoBase64}
                          alt={contact.nama}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.nama}</div>
                      {contact.office && (
                        <div className="text-sm text-gray-500">{contact.office}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.bidangKeahlian ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.bidangKeahlian.split(',').slice(0, 3).map((keahlian, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                            >
                              {keahlian.trim()}
                            </span>
                          ))}
                          {contact.bidangKeahlian.split(',').length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              +{contact.bidangKeahlian.split(',').length - 3} lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(contact)}
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
      
      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Tambah Kontak Dosen"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <ContactForm 
            onSubmit={handleAddContact}
            submitText="Tambah Kontak"
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>
      
      {/* Edit Contact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Kontak Dosen"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <ContactForm 
            onSubmit={handleEditContact}
            submitText="Perbarui Kontak"
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
            Apakah Anda yakin ingin menghapus kontak ini?
          </p>
          <p className="text-gray-800 font-medium mb-6">
            {selectedContact?.nama}
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={closeDeleteModal}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteContact}
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

export default AdminContactsPage;