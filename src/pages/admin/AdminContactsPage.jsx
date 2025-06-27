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

const AdminContactsPage = () => {
  const { userRole } = useAuth();
  
  // State declarations
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && name === 'photoFile') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          photoFile: file,
          photoBase64: "",
          photoType: file.type,
          photoName: file.name
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (errors && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validation function
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "nama":
        if (!value.trim()) {
          error = "Nama wajib diisi";
        } else if (value.trim().length < 2) {
          error = "Nama harus minimal 2 karakter";
        }
        break;
        
      case "email":
        if (!value.trim()) {
          error = "Email wajib diisi";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Format email tidak valid";
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
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  // Validate all form fields
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

  // Reset form
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
    setErrors({});
  };

  // Handle add contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({
        message: "Mohon periksa dan lengkapi semua field yang wajib diisi",
        type: "error"
      });
      return;
    }
    
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, "contacts"), contactData);
      
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

  // Handle edit contact
  const handleEditContact = async (e) => {
    e.preventDefault();
    
    if (!selectedContact) {
      setToast({
        message: "Kontak tidak ditemukan",
        type: "error"
      });
      return;
    }

    if (!validateForm()) {
      setToast({
        message: "Mohon periksa dan lengkapi semua field yang wajib diisi",
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
      
      const contactRef = doc(db, "contacts", selectedContact.id);
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

  // Handle submit (untuk form)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedContact) {
      handleEditContact(e);
    } else {
      handleAddContact(e);
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    
    try {
      await deleteDoc(doc(db, "contacts", selectedContact.id));
      
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
    setSelectedContact(null);
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

  // Fetch contacts
  useEffect(() => {
    if (userRole !== "admin") return;
    
    const fetchContacts = async () => {
      try {
        const contactsQuery = query(
          collection(db, "contacts"),
          orderBy("createdAt", "desc")
        );
        
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = contactsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nama: data.name || data.nama || "",
            bidangKeahlian: data.expertise || data.bidangKeahlian || ""
          };
        });
        
        console.log("Fetched contacts:", contactsList);
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

  // Contact Form Component
  const ContactForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Lengkap *
        </label>
        <input
          type="text"
          name="nama"
          value={formData.nama}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.nama ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan nama lengkap"
        />
        {errors.nama && (
          <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
        )}
      </div>
  
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="nama@telkomuniversity.ac.id"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
  
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ruang Kantor *
        </label>
        <input
          type="text"
          name="office"
          value={formData.office}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.office ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Contoh: Gedung A Lt. 2 Ruang 201"
        />
        {errors.office && (
          <p className="text-red-500 text-xs mt-1">{errors.office}</p>
        )}
      </div>
  
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bidang Keahlian *
        </label>
        <textarea
          name="bidangKeahlian"
          value={formData.bidangKeahlian}
          onChange={handleInputChange}
          rows="3"
          className={`w-full px-3 py-2 text-sm md:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.bidangKeahlian ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Contoh: Artificial Intelligence, Software Engineering, Machine Learning"
        />
        {errors.bidangKeahlian && (
          <p className="text-red-500 text-xs mt-1">{errors.bidangKeahlian}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Tips: Pisahkan setiap bidang keahlian dengan koma (,). Setiap bidang akan ditampilkan sebagai tag terpisah di halaman kontak.
        </p>
      </div>
  
      {/* Photo upload section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Foto Profil
        </label>
        <div className="space-y-3">
          <input
            type="file"
            name="photoFile"
            onChange={handleInputChange}
            accept="image/*"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {(formData.photoFile || formData.photoBase64) && (
            <div className="space-y-3">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto border-2 border-gray-300 rounded-lg overflow-hidden">
                <img 
                  src={formData.photoFile ? URL.createObjectURL(formData.photoFile) : formData.photoBase64} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  {formData.photoFile ? formData.photoFile.name : formData.photoName || "Foto Profil"}
                  {formData.photoFile && (
                    <span className="block text-xs text-gray-500">
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
          )}
          
          <p className="text-xs text-gray-500 text-center">
            Format: JPG, PNG, GIF. Maksimal 5MB
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3 pt-4">
        <Button
          type="button"
          onClick={() => {
            if (selectedContact) {
              closeEditModal();
            } else {
              closeAddModal();
            }
          }}
          className="w-full md:w-auto bg-gray-600 text-white hover:bg-white hover:text-gray-600 border border-gray-600 transition-colors duration-200"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full md:w-auto ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
          }`}
        >
          {isSubmitting ? "Menyimpan..." : (selectedContact ? "Perbarui Kontak" : "Tambah Kontak")}
        </Button>
      </div>
    </form>
  );

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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Contact Management</h1>
        <Button
          onClick={openAddModal}
          className="w-full md:w-auto bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
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
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kontak berdasarkan nama, email..."
            className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-full">
        <div className="divide-y divide-gray-200">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 
                `Tidak ada kontak yang ditemukan untuk "${searchTerm}"` : 
                "Belum ada kontak yang ditambahkan"
              }
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {contact.photoBase64 ? (
                      <img
                        src={contact.photoBase64}
                        alt={contact.nama || contact.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg font-medium">
                          {(contact.nama || contact.name)?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.nama || contact.name || "Nama tidak tersedia"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{contact.email || "Email tidak tersedia"}</p>
                    <p className="text-xs text-gray-500 mt-1">{contact.office || "Office tidak tersedia"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Bidang Keahlian:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(contact.bidangKeahlian || contact.expertise || "")
                        .split(',')
                        .filter(skill => skill.trim())
                        .map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(contact)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Tambah Kontak Dosen"
        size="lg"
      >
        <div className="max-h-[70vh] md:max-h-[80vh] overflow-y-auto pr-2">
          <ContactForm />
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
          <ContactForm />
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
            {selectedContact?.nama || selectedContact?.name}
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={closeDeleteModal}
              className="bg-gray-600 text-white hover:bg-white hover:text-gray-600 border border-gray-600 transition-colors duration-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteContact}
              className="bg-red-600 text-white hover:bg-red-700"
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