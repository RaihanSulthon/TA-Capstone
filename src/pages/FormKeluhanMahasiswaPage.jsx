// src/pages/FormKeluhanMahasiswaPage.jsx - Versi dengan validasi yang ditingkatkan
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContexts";
import { db, storage } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Button from "../components/forms/Button";
import TextField from "../components/forms/TextField";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

const FormKeluhanMahasiswaPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  
  // Kategori laporan
  const kategoriOptions = [
    { value: '', label: 'Pilih Kategori' },
    { value: 'akademik', label: 'Akademik' },
    { value: 'fasilitas', label: 'Fasilitas' },
    { value: 'organisasi', label: 'Organisasi Mahasiswa' },
    { value: 'ukm', label: 'Unit Kegiatan Mahasiswa (UKM)' },
    { value: 'keuangan', label: 'Keuangan' },
    { value: 'umum', label: 'Pertanyaan Umum' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  // Sub kategori berdasarkan kategori yang dipilih
  const subKategoriOptions = {
    akademik: [
      { value: 'perkuliahan', label: 'Perkuliahan' },
      { value: 'nilai', label: 'Nilai' },
      { value: 'dosen', label: 'Dosen' },
      { value: 'jadwal', label: 'Jadwal Kuliah' },
      { value: 'kurikulum', label: 'Kurikulum' },
      { value: 'akademik_lainnya', label: 'Lainnya' }
    ],
    fasilitas: [
      { value: 'ruang_kelas', label: 'Ruang Kelas' },
      { value: 'laboratorium', label: 'Laboratorium' },
      { value: 'perpustakaan', label: 'Perpustakaan' },
      { value: 'toilet', label: 'Toilet' },
      { value: 'parkir', label: 'Area Parkir' },
      { value: 'wifi', label: 'Koneksi Internet/WiFi' },
      { value: 'fasilitas_lainnya', label: 'Lainnya' }
    ],
    organisasi: [
      { value: 'bem', label: 'Badan Eksekutif Mahasiswa (BEM)' },
      { value: 'hima', label: 'Himpunan Mahasiswa' },
      { value: 'dpm', label: 'Dewan Perwakilan Mahasiswa' },
      { value: 'organisasi_lainnya', label: 'Lainnya' }
    ],
    ukm: [
      { value: 'olahraga', label: 'UKM Olahraga' },
      { value: 'seni', label: 'UKM Seni' },
      { value: 'penalaran', label: 'UKM Penalaran' },
      { value: 'keagamaan', label: 'UKM Keagamaan' },
      { value: 'ukm_lainnya', label: 'Lainnya' }
    ],
    keuangan: [
      { value: 'pembayaran', label: 'Pembayaran SPP/UKT' },
      { value: 'beasiswa', label: 'Beasiswa' },
      { value: 'keuangan_lainnya', label: 'Lainnya' }
    ],
    umum: [
      { value: 'informasi', label: 'Informasi Umum' },
      { value: 'layanan', label: 'Layanan Kampus' },
      { value: 'umum_lainnya', label: 'Lainnya' }
    ],
    lainnya: [
      { value: 'lainnya', label: 'Lainnya' }
    ]
  };

  const [formData, setFormData] = useState({
    nama: currentUser?.displayName || "",
    nim: "",
    prodi: "",
    semester: "",
    email: currentUser?.email || "",
    noHp: "",
    kategori: "",
    subKategori: "",
    judul: "",
    deskripsi: "",
    anonymous: false,
    lampiran: null,
    lampiranURL: "",
  });

  // State untuk validasi form
  const [formErrors, setFormErrors] = useState({
    nama: "",
    nim: "",
    prodi: "",
    semester: "",
    email: "",
    noHp: "",
    kategori: "",
    subKategori: "",
    judul: "",
    deskripsi: "",
    lampiran: "",
  });

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });

      // Reset error if exists
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: ""
        });
      }
    } else if (type === 'file') {
      if (files && files[0]) {
        // Validasi ukuran file (5MB)
        if (files[0].size > 5 * 1024 * 1024) {
          setFormErrors({
            ...formErrors,
            lampiran: "Ukuran file terlalu besar. Maksimal 5MB"
          });
          setToast({
            message: "Ukuran file terlalu besar. Maksimal 5MB",
            type: "error"
          });
          fileInputRef.current.value = ""; // Reset file input
          return;
        }

        // Validasi tipe file
        const fileType = files[0].type;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(fileType)) {
          setFormErrors({
            ...formErrors,
            lampiran: "Tipe file tidak didukung. Hanya JPG, PNG, GIF, dan PDF yang diizinkan."
          });
          setToast({
            message: "Tipe file tidak didukung. Hanya JPG, PNG, GIF, dan PDF yang diizinkan.",
            type: "error"
          });
          fileInputRef.current.value = ""; // Reset file input
          return;
        }

        // Simpan objek file untuk upload nanti
        setFileObj(files[0]);
        
        // Buat URL preview jika file adalah gambar
        if (fileType.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(files[0]);
          setPreviewUrl(objectUrl);
        } else {
          // Jika bukan gambar (misal PDF), gunakan icon generic
          setPreviewUrl(null);
        }

        // Update form data dengan nama file
        setFormData({
          ...formData,
          lampiran: files[0].name
        });

        // Reset error
        setFormErrors({
          ...formErrors,
          lampiran: ""
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Reset error jika ada
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: ""
        });
      }
      
      // Reset sub-kategori jika kategori berubah
      if (name === 'kategori') {
        setFormData(prev => ({
          ...prev,
          subKategori: ''
        }));
        
        // Reset error sub-kategori
        setFormErrors({
          ...formErrors,
          subKategori: ""
        });
      }
    }
  };

  // Validate input field
  const validateField = (name, value) => {
    // Skip validation if field is empty and anonymous mode is active
    if (formData.anonymous && ['nama', 'nim', 'prodi', 'semester', 'email', 'noHp'].includes(name)) {
      return "";
    }

    let error = "";
    
    switch (name) {
      case "nama":
        if (!value && !formData.anonymous) {
          error = "Nama lengkap wajib diisi";
        } else if (value && value.length < 3) {
          error = "Nama terlalu pendek (min. 3 karakter)";
        } else if (value && value.length > 100) {
          error = "Nama terlalu panjang (maks. 100 karakter)";
        }
        break;
        
      case "nim":
        if (!value && !formData.anonymous) {
          error = "NIM wajib diisi";
        } else if (value && !/^\d{8,12}$/.test(value)) {
          error = "NIM harus berupa 8-12 digit angka";
        }
        break;
        
      case "prodi":
        if (!value && !formData.anonymous) {
          error = "Program studi wajib diisi";
        } else if (value && value.length < 3) {
          error = "Nama program studi terlalu pendek";
        }
        break;
        
      case "semester":
        if (!value && !formData.anonymous) {
          error = "Semester wajib diisi";
        }
        break;
        
      case "email":
        if (!value && !formData.anonymous) {
          error = "Email wajib diisi";
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Format email tidak valid";
        } else if (value && !value.endsWith("@student.telkomuniversity.ac.id") && 
                  !value.endsWith("@telkomuniversity.ac.id") && 
                  !value.endsWith("@adminhelpdesk.ac.id")) {
          error = "Email harus menggunakan domain telkomuniversity.ac.id";
        }
        break;
        
      case "noHp":
        if (value && !/^(\+62|62|0)[0-9]{9,12}$/.test(value)) {
          error = "Format nomor HP tidak valid (contoh: 081234567890)";
        }
        break;
        
      case "kategori":
        if (!value) {
          error = "Kategori wajib dipilih";
        }
        break;
        
      case "subKategori":
        if (!value && formData.kategori) {
          error = "Sub kategori wajib dipilih";
        }
        break;
        
      case "judul":
        if (!value) {
          error = "Judul laporan wajib diisi";
        } else if (value.length < 5) {
          error = "Judul terlalu pendek (min. 5 karakter)";
        } else if (value.length > 100) {
          error = "Judul terlalu panjang (maks. 100 karakter)";
        }
        break;
        
      case "deskripsi":
        if (!value) {
          error = "Deskripsi wajib diisi";
        } else if (value.length < 20) {
          error = "Deskripsi terlalu pendek (min. 20 karakter)";
        } else if (value.length > 2000) {
          error = "Deskripsi terlalu panjang (maks. 2000 karakter)";
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  // Handle blur event (validasi saat user selesai mengetik di field)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setFormErrors({
      ...formErrors,
      [name]: error
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validasi setiap field
    Object.keys(formData).forEach(key => {
      if (key !== 'anonymous' && key !== 'lampiran' && key !== 'lampiranURL') {
        const error = validateField(key, formData[key]);
        
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });
    
    setFormErrors(newErrors);
    return isValid;
  };

  // Upload file ke Firebase Storage
  const uploadFile = async (file) => {
    if (!file) return null;

    try {
      setFileUploading(true);
      
      // Generate unique filename
      const fileName = `ticket_attachments/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Dapatkan URL download
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        storagePath: fileName,
        url: downloadURL
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setFileUploading(false);
    }
  };

  // Reset form preview
  useEffect(() => {
    return () => {
      // Clean up preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({
        message: "Mohon perbaiki error pada form sebelum mengirim",
        type: "error"
      });
      
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors).find(key => formErrors[key]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      
      return;
    }
    
    setLoading(true);
    
    try {
      // Import notificationService
      const { notifyNewTicket } = await import("../services/notificationService");
      
      // Upload lampiran jika ada
      let fileData = null;
      if (fileObj) {
        try {
          fileData = await uploadFile(fileObj);
        } catch (error) {
          setToast({
            message: "Gagal mengupload lampiran. Silakan coba lagi.",
            type: "error"
          });
          setLoading(false);
          return;
        }
      }
      
      // Persiapkan data untuk disimpan ke Firestore
      const ticketData = {
        ...formData,
        lampiran: fileData ? fileObj.name : null,
        lampiranStoragePath: fileData ? fileData.storagePath : null,
        lampiranURL: fileData ? fileData.url : null,
        userId: currentUser?.uid || "anonymous",
        status: "new",
        assignedTo: null,
        feedback: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Simpan ke Firestore
      const ticketsCollection = collection(db, "tickets");
      const docRef = await addDoc(ticketsCollection, ticketData);
      
      // Get ticket with ID
      const newTicket = {
        id: docRef.id,
        ...ticketData
      };
      
      // Send notification to admins
      await notifyNewTicket(
        newTicket,
        currentUser?.uid || "anonymous",
        currentUser?.displayName || formData.nama || "Anonymous"
      );
      
      setToast({
        message: "Laporan Anda berhasil dikirim. Tim kami akan segera menindaklanjuti.",
        type: "success"
      });
      
      // Reset form
      setFormData({
        nama: currentUser?.displayName || "",
        nim: "",
        prodi: "",
        semester: "",
        email: currentUser?.email || "",
        noHp: "",
        kategori: "",
        subKategori: "",
        judul: "",
        deskripsi: "",
        anonymous: false,
        lampiran: null,
        lampiranURL: ""
      });
      
      // Reset preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      setFileObj(null);
      
      // Redirect ke halaman tracking ticket setelah beberapa detik
      setTimeout(() => {
        navigate(`/app/tickets/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      setToast({
        message: "Terjadi kesalahan. Silakan coba lagi nanti.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle hapus file
  const handleRemoveFile = () => {
    setFormData({
      ...formData,
      lampiran: null
    });
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    setFileObj(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Reset error
    setFormErrors({
      ...formErrors,
      lampiran: ""
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Form */}
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Form Keluhan dan Laporan Mahasiswa</h1>
          <p className="mt-2">Silakan isi formulir di bawah ini untuk menyampaikan keluhan atau laporan Anda</p>
        </div>
        
        {/* Content Form */}
        <div className="p-6">
          {/* Toast notification */}
          {toast.message && (
            <Toast 
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ message: "", type: "success" })}
            />
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Bagian Identitas */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Identitas Pelapor</h2>
              
              <div className="mb-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="anonymous" 
                    checked={formData.anonymous} 
                    onChange={handleChange} 
                    className="h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Kirim sebagai Anonim (Identitas tidak akan ditampilkan)</span>
                </label>
                {formData.anonymous && (
                  <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm">
                    <p>Mode anonim diaktifkan. Informasi identitas Anda tidak akan ditampilkan, tetapi tetap tersimpan untuk keperluan administrasi.</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="nama" className="block text-gray-700 font-medium mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(min. 3 karakter)</span>
                  </label>
                  <input 
                    type="text" 
                    id="nama" 
                    name="nama" 
                    value={formData.nama} 
                    onChange={handleChange}
                    onBlur={handleBlur} 
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.nama ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                    placeholder="Masukkan nama lengkap"
                    minLength={3}
                    maxLength={100}
                  />
                  {formErrors.nama && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.nama}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="nim" className="block text-gray-700 font-medium mb-2">
                    NIM <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(8-12 digit)</span>
                  </label>
                  <input 
                    type="text" 
                    id="nim" 
                    name="nim" 
                    value={formData.nim} 
                    onChange={handleChange}
                    onBlur={handleBlur} 
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.nim ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                    placeholder="Masukkan NIM (hanya angka)"
                    pattern="[0-9]{8,12}"
                  />
                  {formErrors.nim && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.nim}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="prodi" className="block text-gray-700 font-medium mb-2">
                    Program Studi <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="prodi" 
                    name="prodi" 
                    value={formData.prodi} 
                    onChange={handleChange}
                    onBlur={handleBlur} 
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.prodi ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                    placeholder="Contoh: Teknik Informatika"
                  />
                  {formErrors.prodi && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.prodi}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="semester" className="block text-gray-700 font-medium mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="semester" 
                    name="semester" 
                    value={formData.semester} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.semester ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                  >
                    <option value="">Pilih Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  {formErrors.semester && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.semester}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(domain telkomuniversity.ac.id)</span>
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                    placeholder="contoh@student.telkomuniversity.ac.id"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="noHp" className="block text-gray-700 font-medium mb-2">
                    Nomor HP
                    <span className="text-xs text-gray-500 ml-1">(opsional)</span>
                  </label>
                  <input 
                    type="tel" 
                    id="noHp" 
                    name="noHp" 
                    value={formData.noHp} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.noHp ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={formData.anonymous}
                    placeholder="Contoh: 081234567890"
                  />
                  {formErrors.noHp && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.noHp}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bagian Detail Laporan */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Detail Laporan</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="kategori" className="block text-gray-700 font-medium mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="kategori" 
                    name="kategori" 
                    value={formData.kategori} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.kategori ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                  >
                    {kategoriOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {formErrors.kategori && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.kategori}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="subKategori" className="block text-gray-700 font-medium mb-2">
                    Sub Kategori <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="subKategori" 
                    name="subKategori" 
                    value={formData.subKategori} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.subKategori ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={!formData.kategori}
                  >
                    <option value="">Pilih Sub Kategori</option>
                    {formData.kategori && subKategoriOptions[formData.kategori]?.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {formErrors.subKategori && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.subKategori}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="judul" className="block text-gray-700 font-medium mb-2">
                  Judul Laporan <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(5-100 karakter)</span>
                </label>
                <input 
                  type="text" 
                  id="judul" 
                  name="judul" 
                  value={formData.judul} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.judul ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Berikan judul yang singkat dan jelas"
                  minLength={5}
                  maxLength={100}
                />
                {formErrors.judul && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.judul}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="deskripsi" className="block text-gray-700 font-medium mb-2">
                  Deskripsi <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(min. 20 karakter)</span>
                </label>
                <textarea 
                  id="deskripsi" 
                  name="deskripsi" 
                  value={formData.deskripsi} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="6" 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.deskripsi ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Jelaskan secara detail keluhan atau laporan Anda..."
                  minLength={20}
                  maxLength={2000}
                ></textarea>
                {formErrors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.deskripsi}</p>
                )}
                <div className="mt-1 text-xs text-gray-500 flex justify-end">
                  {formData.deskripsi.length}/2000 karakter
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Lampiran (opsional)
                  <span className="text-xs text-gray-500 ml-2">Maksimal 5 MB (JPG, PNG, GIF, PDF)</span>
                </label>
                
                {/* File input dengan preview */}
                {!formData.lampiran ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span> atau drag and drop</p>
                        <p className="text-xs text-gray-500">JPG, PNG, GIF atau PDF (Maks. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        name="lampiran"
                        onChange={handleChange}
                        accept=".jpg,.jpeg,.png,.gif,.pdf" 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-lg border-gray-300 p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {previewUrl ? (
                          // Preview gambar jika ada
                          <div className="relative w-16 h-16 mr-3 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="object-cover w-full h-full" 
                            />
                          </div>
                        ) : (
                          // Icon untuk PDF atau file lain
                          <div className="w-12 h-12 mr-3 flex-shrink-0 flex items-center justify-center rounded bg-gray-200">
                            <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formData.lampiran}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fileObj ? `${(fileObj.size / 1024 / 1024).toFixed(2)} MB` : 'File diupload'}
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {formErrors.lampiran && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.lampiran}</p>
                )}
              </div>
            </div>
            
            {/* Tombol Submit */}
            <div className="mt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading || fileUploading}
                className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow ${
                  (loading || fileUploading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {loading || fileUploading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                    <span>{fileUploading ? "Mengunggah file..." : "Mengirim..."}</span>
                  </div>
                ) : "Kirim Laporan"}
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Catatan: Kolom bertanda <span className="text-red-500">*</span> wajib diisi</p>
              <p className="mt-1">Laporan Anda akan ditindaklanjuti dalam waktu 3x24 jam kerja.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormKeluhanMahasiswaPage;