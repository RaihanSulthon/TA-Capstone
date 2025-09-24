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
    photoName: "",
  });

  // Convert file to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && name === "photoFile") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          photoFile: file,
          photoBase64: "",
          photoType: file.type,
          photoName: file.name,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear validation error for this field
    if (errors && errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
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

    fieldsToValidate.forEach((field) => {
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
      photoName: "",
    });
    setErrors({});
  };

  // Handle add contact
  const handleAddContact = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        message: "Mohon periksa dan lengkapi semua field yang wajib diisi",
        type: "error",
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
          setToast({
            message: "Gagal mengproses gambar. Silakan coba lagi.",
            type: "error",
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
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "contacts"), contactData);

      // Update local state
      const newContact = {
        id: docRef.id,
        ...contactData,
        nama: contactData.name, // Map untuk display
      };
      setContacts((prev) => [...prev, newContact]);

      setToast({
        message: "Kontak berhasil ditambahkan",
        type: "success",
      });

      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding contact:", error);
      setToast({
        message: error.message || "Gagal menambahkan kontak",
        type: "error",
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
        type: "error",
      });
      return;
    }

    if (!validateForm()) {
      setToast({
        message: "Mohon periksa dan lengkapi semua field yang wajib diisi",
        type: "error",
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
          setToast({
            message: "Gagal mengproses gambar. Silakan coba lagi.",
            type: "error",
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
        updatedAt: new Date(),
      };

      await updateDoc(contactRef, updatedData);

      // Update local state
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedContact.id
            ? { ...contact, ...updatedData, nama: updatedData.name }
            : contact
        )
      );

      setToast({
        message: "Kontak berhasil diperbarui",
        type: "success",
      });

      resetForm();
      setIsEditModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error updating contact:", error);
      setToast({
        message: error.message || "Gagal memperbarui kontak",
        type: "error",
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

      setContacts((prev) =>
        prev.filter((contact) => contact.id !== selectedContact.id)
      );

      setToast({
        message: "Kontak berhasil dihapus",
        type: "success",
      });

      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      setToast({
        message: "Gagal menghapus kontak",
        type: "error",
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
      photoName: contact.photoName || "",
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
        const contactsList = contactsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nama: data.name || data.nama || "",
            bidangKeahlian: data.expertise || data.bidangKeahlian || "",
          };
        });

        console.log("Fetched contacts:", contactsList);
        setContacts(contactsList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setToast({
          message: "Gagal memuat data kontak",
          type: "error",
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

    window.addEventListener("closeModal", handleCloseModal);
    return () => window.removeEventListener("closeModal", handleCloseModal);
  }, []);

  // Filter contacts
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.bidangKeahlian?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contact Form Component
  const ContactForm = () => (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">
            {selectedContact
              ? "Perbarui informasi kontak dosen"
              : "Tambahkan kontak dosen baru ke sistem"}
          </p>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Informasi Personal
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
                    errors.nama
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              {errors.nama && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errors.nama}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
                  }`}
                  placeholder="nama@telkomuniversity.ac.id"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ruang Kantor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="office"
                value={formData.office}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
                  errors.office
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
                }`}
                placeholder="Contoh: Gedung A Lt. 2 Ruang 201"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            {errors.office && (
              <p className="text-red-500 text-xs flex items-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errors.office}</span>
              </p>
            )}
          </div>
        </div>

        {/* Expertise Section */}
        <div className="space-y-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Bidang Keahlian
            </h3>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bidang Keahlian <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                name="bidangKeahlian"
                value={formData.bidangKeahlian}
                onChange={handleInputChange}
                rows="4"
                className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 resize-none ${
                  errors.bidangKeahlian
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
                }`}
                placeholder="Contoh: Artificial Intelligence, Software Engineering, Machine Learning"
              />
              <div className="absolute top-3 right-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            </div>
            {errors.bidangKeahlian && (
              <p className="text-red-500 text-xs flex items-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errors.bidangKeahlian}</span>
              </p>
            )}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 flex items-start space-x-2">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Tips: Pisahkan setiap bidang keahlian dengan koma (,). Setiap
                  bidang akan ditampilkan sebagai tag terpisah di halaman
                  kontak.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="space-y-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">Foto Profil</h3>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                type="file"
                name="photoFile"
                onChange={handleInputChange}
                accept="image/*"
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Klik untuk upload foto
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF hingga 5MB
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {(formData.photoFile || formData.photoBase64) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md">
                    <img
                      src={
                        formData.photoFile
                          ? URL.createObjectURL(formData.photoFile)
                          : formData.photoBase64
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formData.photoFile
                        ? formData.photoFile.name
                        : formData.photoName || "Foto Profil"}
                    </p>
                    {formData.photoFile && (
                      <p className="text-xs text-gray-500">
                        {(formData.photoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        Foto berhasil dimuat
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        photoFile: null,
                        photoBase64: "",
                        photoType: "",
                        photoName: "",
                      }))
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-6 border-t border-gray-100">
          <Button
            type="button"
            onClick={() => {
              if (selectedContact) {
                closeEditModal();
              } else {
                closeAddModal();
              }
            }}
            className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-xl font-medium transition-all duration-200 hover:scale-[0.98]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[0.98] ${
              isSubmitting
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4"
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
                <span>Menyimpan...</span>
              </div>
            ) : selectedContact ? (
              "Perbarui Kontak"
            ) : (
              "Tambah Kontak"
            )}
          </Button>
        </div>
      </form>
    </div>
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
    <div className="w-full space-y-6">
      <div className="max-w-full mx-auto px-2 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Contact Management
          </h1>
          <Button
            onClick={openAddModal}
            className="w-full md:w-auto bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 hover:scale-105 duration-300 transition-all hover:shadow-xl px-6 py-3"
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
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kontak berdasarkan nama, email..."
              className="w-full px-4 md:px-6 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-600 text-lg">
            Total: {contacts.length} kontak | Menampilkan:{" "}
            {filteredContacts.length} kontak
          </p>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              {searchTerm
                ? `Tidak ada kontak yang ditemukan untuk "${searchTerm}"`
                : "Belum ada kontak yang ditambahkan"}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg shadow-md p-6 space-y-4 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {contact.photoBase64 ? (
                        <img
                          src={contact.photoBase64}
                          alt={contact.nama || contact.name}
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl font-medium">
                            {(contact.nama || contact.name)
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {contact.nama || contact.name || "Nama tidak tersedia"}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.email || "Email tidak tersedia"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {contact.office || "Office tidak tersedia"}
                      </p>
                    </div>
                  </div>

                  {/* Tombol di sebelah kanan */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 hover:scale-95 duration-300 transition-all hover:shadow-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(contact)}
                      className="px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 hover:scale-95 duration-300 transition-all hover:shadow-lg"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Bidang Keahlian */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700">
                    Bidang Keahlian:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(contact.bidangKeahlian || contact.expertise || "")
                      .split(",")
                      .filter((skill) => skill.trim())
                      .map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-200"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Contact Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          title="Tambah Kontak Dosen"
          size="xl"
        >
          <ContactForm />
        </Modal>

        {/* Edit Contact Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title="Edit Kontak Dosen"
          size="xl"
        >
          <ContactForm />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Konfirmasi Hapus"
          size="md"
        >
          <div className="p-6">
            {/* Icon dan Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hapus Kontak
              </h3>
              <p className="text-gray-600 text-sm">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus kontak
                secara permanen.
              </p>
            </div>

            {/* Contact Info Card */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex items-center space-x-4">
                {selectedContact?.photoBase64 ? (
                  <img
                    src={selectedContact.photoBase64}
                    alt={selectedContact.nama || selectedContact.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {(selectedContact?.nama || selectedContact?.name)
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedContact?.nama ||
                      selectedContact?.name ||
                      "Nama tidak tersedia"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedContact?.email || "Email tidak tersedia"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedContact?.office || "Office tidak tersedia"}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Peringatan!
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Setelah dihapus, semua informasi kontak ini akan hilang dan
                    tidak dapat dipulihkan.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3">
              <Button
                onClick={closeDeleteModal}
                className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-xl font-medium transition-all duration-200 hover:scale-[0.98]"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Batal</span>
                </div>
              </Button>
              <Button
                onClick={handleDeleteContact}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Ya, Hapus Kontak</span>
                </div>
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminContactsPage;
