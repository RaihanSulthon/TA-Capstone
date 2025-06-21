import { useState, useEffect } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Button from "../components/forms/Button";
import Textfield from "../components/forms/Textfield";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const FormKeluhanMahasiswaPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  
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

  // Helper function untuk generate token
  const generateSecureToken = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Helper function untuk format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'file') {
      if (files && files[0]) {
        const file = files[0];
        const fileSizeMB = file.size / (1024 * 1024);
        
        // Validasi ukuran file - Max 750KB untuk menghindari error Firestore
        const maxSizeKB = 750; // 750KB limit untuk base64
        const maxSizeBytes = maxSizeKB * 1024;
        
        if (file.size > maxSizeBytes) {
          setToast({
            message: `Ukuran file terlalu besar. Maksimal ${maxSizeKB}KB (${(maxSizeKB/1024).toFixed(1)}MB). File Anda: ${formatFileSize(file.size)}`,
            type: "error"
          });
          // Reset file input
          e.target.value = '';
          return;
        }

        // Validasi tipe file
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
          setToast({
            message: "Tipe file tidak didukung. Gunakan: gambar (JPG, PNG, GIF), PDF, Word, Excel, atau text.",
            type: "error"
          });
          e.target.value = '';
          return;
        }

        console.log("File accepted:", {
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          sizeStatus: file.size <= maxSizeBytes ? "OK" : "Too Large"
        });

        setFormData({
          ...formData,
          lampiran: file
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Reset sub-kategori jika kategori berubah
      if (name === 'kategori') {
        setFormData(prev => ({
          ...prev,
          subKategori: ''
        }));
      }
    }
  };

  const getFileType = (file) => {
    if (!file) return 'unknown';
    
    const fileType = file.type;
    
    // File gambar
    if (fileType.startsWith('image/')) {
      return 'image';
    }
    
    // File PDF
    if (fileType === 'application/pdf') {
      return 'pdf';
    }
    
    // File dokumen
    if (fileType.includes('document') || fileType.includes('text') || 
        fileType.includes('spreadsheet') || fileType.includes('presentation')) {
      return 'document';
    }
    
    return 'unknown';
  };

  const openFilePreview = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewFileUrl(url);
    setIsFilePreviewOpen(true);
  };
  
  const closeFilePreview = () => {
    setIsFilePreviewOpen(false);
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
      setPreviewFileUrl("");
    }
  };
  
  const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Validate form
  const validateForm = () => {
    // Validasi fields yang wajib untuk semua jenis form
    const requiredFields = ['kategori', 'subKategori', 'judul', 'deskripsi'];
    
    if (formData.anonymous) {
      // Validasi form anonymous - hanya email yang wajib untuk identitas
      requiredFields.push('email');
      
      for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          setToast({
            message: `Field ${field} wajib diisi`,
            type: "error"
          });
          return false;
        }
      }
    } else {
      // Validasi form non-anonymous - semua field identitas wajib
      const identityFields = ['nama', 'nim', 'prodi', 'semester', 'email', 'noHp'];
      const allRequiredFields = [...requiredFields, ...identityFields];
      
      for (const field of allRequiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          setToast({
            message: `Field ${field} wajib diisi`,
            type: "error"
          });
          return false;
        }
      }
    }
    
    // Validasi format email
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setToast({
          message: "Format email tidak valid",
          type: "error"
        });
        return false;
      }
    }
    
    // Validasi NIM (hanya untuk non-anonymous)
    if (!formData.anonymous && formData.nim) {
      // NIM harus berupa angka dan minimal 8 digit
      if (!/^\d{8,}$/.test(formData.nim)) {
        setToast({
          message: "NIM harus berupa angka minimal 8 digit",
          type: "error"
        });
        return false;
      }
    }
    
    // Validasi nomor HP (hanya untuk non-anonymous)
    if (!formData.anonymous && formData.noHp) {
      // Nomor HP harus berupa angka dan minimal 10 digit
      if (!/^\d{10,}$/.test(formData.noHp.replace(/[\s\-\+]/g, ''))) {
        setToast({
          message: "Nomor HP harus berupa angka minimal 10 digit",
          type: "error"
        });
        return false;
      }
    }

    // Validasi ukuran file sebelum submit
    if (formData.lampiran) {
      const maxSizeBytes = 750 * 1024; // 750KB
      if (formData.lampiran.size > maxSizeBytes) {
        setToast({
          message: `File terlalu besar. Maksimal 750KB. File Anda: ${formatFileSize(formData.lampiran.size)}`,
          type: "error"
        });
        return false;
      }

      // Estimasi ukuran base64
      const estimatedBase64Size = formData.lampiran.size * 1.4; // Base64 adds ~33% overhead
      const maxFirestoreFieldSize = 1048487; // Firestore field limit

      if (estimatedBase64Size > maxFirestoreFieldSize) {
        setToast({
          message: "File terlalu besar untuk disimpan. Silakan kompres file atau pilih file yang lebih kecil.",
          type: "error"
        });
        return false;
      }
    }
    
    return true;
  };

  // Enhanced fileToBase64 with size checking
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      console.log("Converting file to base64:", {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      });

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64Result = reader.result;
        const base64Size = base64Result.length;
        const maxSize = 1048487; // Firestore limit

        console.log("Base64 conversion result:", {
          originalSize: formatFileSize(file.size),
          base64Size: formatFileSize(base64Size),
          withinLimit: base64Size <= maxSize
        });

        if (base64Size > maxSize) {
          reject(new Error(`File terlalu besar setelah konversi (${formatFileSize(base64Size)}). Maksimal: ${formatFileSize(maxSize)}. Silakan gunakan file yang lebih kecil.`));
          return;
        }

        resolve(base64Result);
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Gagal membaca file"));
      };
    });
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMIT START ===");
    console.log("Form data before validation:", {
      ...formData,
      lampiran: formData.lampiran ? {
        name: formData.lampiran.name,
        size: formatFileSize(formData.lampiran.size),
        type: formData.lampiran.type
      } : null
    });
    
    if (!validateForm()) {
      console.log("=== VALIDATION FAILED ===");
      return;
    }
    
    setLoading(true);
    
    try {
      let lampiranBase64 = null;
      let lampiranType = null;
      let lampiranName = null;

      if (formData.lampiran) {
        try {
          console.log("=== CONVERTING FILE TO BASE64 ===");
          lampiranBase64 = await fileToBase64(formData.lampiran);
          lampiranType = formData.lampiran.type;
          lampiranName = formData.lampiran.name;
          
          console.log("File conversion successful:", {
            name: lampiranName,
            type: lampiranType,
            base64Length: lampiranBase64 ? lampiranBase64.length : 0
          });
        } catch (error) {
          console.error("Error converting file to base64:", error);
          setToast({
            message: error.message || "Gagal mengupload lampiran. File terlalu besar atau format tidak didukung.",
            type: "error"
          });
          setLoading(false);
          return;
        }
      }
      
      // Persiapkan data untuk disimpan ke Firestore
      const ticketData = {
        ...formData,
        lampiran: lampiranName,
        lampiranBase64: lampiranBase64,
        lampiranType: lampiranType,
        userId: currentUser?.uid || "anonymous",
        userEmail: formData.email,
        status: "new",
        assignedTo: null,
        nama: formData.anonymous ? null : formData.nama,
        nim: formData.anonymous ? null: formData.nim,
        prodi: formData.anonymous ? null : formData.prodi,
        semester: formData.anonymous ? null : formData.semester,
        noHp: formData.anonymous ? null : formData.noHp,
        email: formData.email,
        anonymous: formData.anonymous,
        secretToken: formData.anonymous ? generateSecureToken() : null,
        tokenGeneratedAt: formData.anonymous ? serverTimestamp() : null,
        tokenViewCount: formData.anonymous ? 0 : null,
        tokenLastViewed: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
        deletedBy: null,
        isDeleted: false
      };

      console.log("=== SAVING TICKET TO FIRESTORE ===");
      console.log("Ticket data size check:", {
        estimatedDocumentSize: JSON.stringify(ticketData).length + " characters",
        hasAttachment: !!lampiranBase64,
        attachmentSize: lampiranBase64 ? formatFileSize(lampiranBase64.length) : "0KB"
      });

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      
      // Tambahkan ID document ke data
      const finalTicketData = { ...ticketData, id: docRef.id };
      
      console.log("=== TICKET SAVED SUCCESSFULLY ===", docRef.id);

      console.log("=== DEBUGGING USER INFO ===");
      console.log("currentUser:", currentUser);
      console.log("userRole:", userRole);
      console.log("displayName:", currentUser?.displayName);
      console.log("uid:", currentUser?.uid);
      
      // Kirim notifikasi ke admin
      try {
        console.log("=== SENDING NOTIFICATION ===");
        const { notifyNewTicket } = await import("../services/notificationService");
        
        const senderName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Mahasiswa';
        
        if (currentUser?.uid) {
          const notifResult = await notifyNewTicket(
            finalTicketData,
            currentUser.uid,
            senderName,
            userRole || "student"
          );
          console.log("=== NOTIFICATION RESULT ===", notifResult);
        }
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
        // Jangan gagalkan seluruh proses jika notifikasi gagal
      }
      
      setToast({
        message: formData.anonymous 
          ? "Laporan anonymous berhasil dikirim! Token rahasia telah dibuat. Anda bisa melihat token di halaman 'My Tickets' → Detail Tiket untuk verifikasi dengan admin jika diperlukan." 
          : "Laporan berhasil dikirim!",
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
        lampiranURL: "",
      });
      
      // Redirect ke halaman my-tickets setelah 2 detik
      setTimeout(() => {
        navigate("/app/my-tickets");
      }, 2000);
      
    } catch (error) {
      console.error("=== FIRESTORE ERROR ===", error);
      
      // Analisis error untuk memberikan pesan yang lebih spesifik
      let errorMessage = "Gagal mengirim laporan. Silakan coba lagi nanti.";
      
      if (error.message.includes("1048487 bytes") || error.message.includes("too large")) {
        errorMessage = "File lampiran terlalu besar untuk disimpan. Maksimal ukuran efektif: 750KB. Silakan kompres file Anda.";
      } else if (error.message.includes("permission")) {
        errorMessage = "Tidak memiliki izin untuk menyimpan data. Silakan login ulang.";
      } else if (error.message.includes("network")) {
        errorMessage = "Masalah koneksi internet. Silakan periksa koneksi dan coba lagi.";
      }
      
      setToast({
        message: errorMessage,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl);
      }
    };
  }, [previewFileUrl]);

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
              {/* Checkbox Anonymous */}
              <div className="mb-2 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    name="anonymous"
                    checked={formData.anonymous}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                    <strong>Kirim laporan secara anonim</strong>
                  </label>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-6">
                  Jika dicentang, identitas Anda tidak akan ditampilkan dalam laporan. 
                  {formData.anonymous && " Token rahasia akan dibuat untuk verifikasi."}
                </p>
              </div>
              <div className="mb-4 text-sm text-gray-600">
                {formData.anonymous && (
                  <p className="mt-1 text-purple-600 font-medium">
                    ⚠️ Token rahasia akan dibuat untuk verifikasi kepemilikan tiket anonymous.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="nama" className="block text-gray-700 font-medium mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="nama" 
                    name="nama" 
                    value={formData.nama} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.anonymous}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="nim" className="block text-gray-700 font-medium mb-2">
                    NIM <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="nim" 
                    name="nim" 
                    value={formData.nim} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.anonymous}
                  />
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.anonymous}
                  />
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.anonymous}
                  >
                    <option value="">Pilih Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="noHp" className="block text-gray-700 font-medium mb-2">
                    Nomor HP
                  </label>
                  <input 
                    type="tel" 
                    id="noHp" 
                    name="noHp" 
                    value={formData.noHp} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.anonymous}
                  />
                </div>
              </div>
              <p className="mb-2 text-sm text-gray-600">Catatan: Kolom bertanda <span className="text-red-500">*</span> wajib diisi</p>
            </div>
            
            {/* Bagian Keluhan */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Detail Keluhan</h2>
              
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {kategoriOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.kategori}
                  >
                    <option value="">Pilih Sub Kategori</option>
                    {formData.kategori && subKategoriOptions[formData.kategori]?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="judul" className="block text-gray-700 font-medium mb-2">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="judul" 
                  name="judul" 
                  value={formData.judul} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tuliskan judul laporan secara singkat"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="deskripsi" className="block text-gray-700 font-medium mb-2">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="deskripsi" 
                  name="deskripsi" 
                  value={formData.deskripsi} 
                  onChange={handleChange} 
                  rows="5"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan laporan Anda secara detail..."
                />
              </div>
              
              {/* Lampiran dengan Size Guide */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Lampiran <span className="text-gray-500">(Opsional)</span>
                </label>
                
                {/* File Size Guide */}
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">📋 Pedoman Upload File:</p>
                      <ul className="space-y-1">
                        <li>• <strong>Ukuran maksimal:</strong> 750KB (~0.75MB)</li>
                        <li>• <strong>Format didukung:</strong> Gambar (JPG, PNG, GIF), PDF, Word, Excel, Text</li>
                        <li>• <strong>Tips:</strong> Kompres gambar atau gunakan format JPG untuk ukuran lebih kecil</li>
                        <li>• <strong>Catatan:</strong> File lebih besar dari 750KB akan otomatis ditolak</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {!formData.lampiran ? (
                  // Upload interface when no file is selected
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span> atau drag and drop</p>
                        <p className="text-xs text-gray-500">Maksimal 750KB • JPG, PNG, PDF, Word, Excel, Text</p>
                      </div>
                      <input 
                        type="file" 
                        name="lampiran"
                        onChange={handleChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  // Enhanced preview section when file is selected
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {getFileType(formData.lampiran) === 'image' ? (
                      <div>
                        <img 
                          src={URL.createObjectURL(formData.lampiran)} 
                          alt="Preview" 
                          className="max-w-full h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity mx-auto"
                          onClick={() => openFilePreview(formData.lampiran)}
                        />
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{formData.lampiran.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(formData.lampiran.size)} • {formData.lampiran.type}
                            </p>
                            {/* Status indicator */}
                            <div className="mt-1">
                              {formData.lampiran.size <= 750 * 1024 ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Ukuran OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ✗ Terlalu Besar
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-3">
                            <button
                              type="button"
                              onClick={() => openFilePreview(formData.lampiran)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                            >
                              👁️ Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadFile(formData.lampiran)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                            >
                              📥 Download
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, lampiran: null})}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                        <div className="flex-shrink-0">
                          {getFileType(formData.lampiran) === 'pdf' ? (
                            <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 18h12V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          ) : (
                            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{formData.lampiran.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(formData.lampiran.size)} • {getFileType(formData.lampiran) === 'pdf' ? 'PDF Document' : 'File Document'}
                          </p>
                          {/* Status indicator */}
                          <div className="mt-1">
                            {formData.lampiran.size <= 750 * 1024 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Ukuran OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✗ Terlalu Besar
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => downloadFile(formData.lampiran)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, lampiran: null})}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Preview */}
            <Modal
              isOpen={isFilePreviewOpen}
              onClose={closeFilePreview}
              title="Preview File"
              size="full"
            >
              <div className="flex flex-col items-center max-w-full">
                {/* File Container */}
                <div className="w-full bg-gray-100 rounded-lg p-4 mb-6">
                  {getFileType(formData.lampiran) === 'image' ? (
                    <img 
                      src={previewFileUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg mx-auto"
                      style={{ minHeight: '300px' }}
                    />
                  ) : getFileType(formData.lampiran) === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="h-16 w-16 text-red-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 18h12V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <p className="text-gray-600 text-center mb-4">
                        Preview PDF tidak tersedia di browser ini.<br/>
                        Silakan download file untuk melihat isinya.
                      </p>
                      <button
                        onClick={() => downloadFile(formData.lampiran)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        📥 Download PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="h-16 w-16 text-blue-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600 text-center mb-4">
                        Preview tidak tersedia untuk tipe file ini.<br/>
                        Silakan download file untuk melihat isinya.
                      </p>
                      <button
                        onClick={() => downloadFile(formData.lampiran)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📥 Download File
                      </button>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="text-center mb-4">
                  <p className="text-gray-600 text-sm font-medium">
                    {formData.lampiran?.name || "File"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formData.lampiran ? formatFileSize(formData.lampiran.size) : ''}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => downloadFile(formData.lampiran)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
                    </svg>
                    Download File
                  </button>
                  
                  {getFileType(formData.lampiran) === 'image' && (
                    <button
                      onClick={() => {
                        const newWindow = window.open('', '_blank');
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${formData.lampiran?.name || 'Preview Gambar'}</title>
                                <style>
                                  body { 
                                    margin: 0; 
                                    padding: 20px;
                                    display: flex; 
                                    justify-content: center; 
                                    align-items: center; 
                                    min-height: 100vh; 
                                    background-color: #f3f4f6;
                                    font-family: system-ui, -apple-system, sans-serif;
                                  }
                                  .container {
                                    text-align: center;
                                    max-width: 90vw;
                                    max-height: 90vh;
                                  }
                                  img { 
                                    max-width: 100%; 
                                    max-height: 80vh; 
                                    object-fit: contain;
                                    border-radius: 8px;
                                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                                  }
                                  .filename {
                                    margin-top: 16px;
                                    padding: 8px 16px;
                                    background: white;
                                    border-radius: 6px;
                                    color: #374151;
                                    font-size: 14px;
                                    display: inline-block;
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <img src="${previewFileUrl}" alt="${formData.lampiran?.name || 'Preview'}" />
                                  <div class="filename">${formData.lampiran?.name || 'Gambar Preview'}</div>
                                </div>
                              </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Buka di Tab Baru
                    </button>
                  )}
                  
                  <button
                    onClick={closeFilePreview}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-white hover:text-red-600 border border-red-600 transition-colors font-medium text-sm"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Tutup
                  </button>
                </div>
              </div>
            </Modal>
            
            {/* Tombol Submit */}
            <div className="mt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 rounded-lg font-semibold transition-colors duration-300 px-6 py-3"
              >
                {loading ? "Mengirim..." : "Kirim Laporan"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormKeluhanMahasiswaPage;