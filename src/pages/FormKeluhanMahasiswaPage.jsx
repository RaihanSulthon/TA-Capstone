import { useState, useEffect } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Button from "../components/forms/Button";
import Textfield from "../components/forms/Textfield";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { notifyNewTicket } from "../services/notificationService";
import CustomSelect from "../components/forms/CustomSelect";

const FormKeluhanMahasiswaPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState("");

  // Kategori laporan
  const kategoriOptions = [
    { value: "", label: "Pilih Kategori" },
    { value: "akademik", label: "Akademik" },
    { value: "fasilitas", label: "Fasilitas" },
    { value: "organisasi", label: "Organisasi Mahasiswa" },
    { value: "ukm", label: "Unit Kegiatan Mahasiswa (UKM)" },
    { value: "keuangan", label: "Keuangan" },
    { value: "umum", label: "Pertanyaan Umum" },
    { value: "lainnya", label: "Lainnya" },
  ];

  // Sub kategori berdasarkan kategori yang dipilih
  const subKategoriOptions = {
    akademik: [
      { value: "perkuliahan", label: "Perkuliahan" },
      { value: "nilai", label: "Nilai" },
      { value: "dosen", label: "Dosen" },
      { value: "jadwal", label: "Jadwal Kuliah" },
      { value: "kurikulum", label: "Kurikulum" },
      { value: "akademik_lainnya", label: "Lainnya" },
    ],
    fasilitas: [
      { value: "ruang_kelas", label: "Ruang Kelas" },
      { value: "laboratorium", label: "Laboratorium" },
      { value: "perpustakaan", label: "Perpustakaan" },
      { value: "toilet", label: "Toilet" },
      { value: "parkir", label: "Area Parkir" },
      { value: "wifi", label: "Koneksi Internet/WiFi" },
      { value: "fasilitas_lainnya", label: "Lainnya" },
    ],
    organisasi: [
      { value: "bem", label: "Badan Eksekutif Mahasiswa (BEM)" },
      { value: "hima", label: "Himpunan Mahasiswa" },
      { value: "dpm", label: "Dewan Perwakilan Mahasiswa" },
      { value: "organisasi_lainnya", label: "Lainnya" },
    ],
    ukm: [
      { value: "olahraga", label: "UKM Olahraga" },
      { value: "seni", label: "UKM Seni" },
      { value: "penalaran", label: "UKM Penalaran" },
      { value: "keagamaan", label: "UKM Keagamaan" },
      { value: "ukm_lainnya", label: "Lainnya" },
    ],
    keuangan: [
      { value: "pembayaran", label: "Pembayaran SPP/UKT" },
      { value: "beasiswa", label: "Beasiswa" },
      { value: "keuangan_lainnya", label: "Lainnya" },
    ],
    umum: [
      { value: "informasi", label: "Informasi Umum" },
      { value: "layanan", label: "Layanan Kampus" },
      { value: "umum_lainnya", label: "Lainnya" },
    ],
    lainnya: [{ value: "lainnya", label: "Lainnya" }],
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
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (type === "file") {
      if (files && files[0]) {
        const file = files[0];
        const fileSizeMB = file.size / (1024 * 1024);

        // Validasi ukuran file - Max 750KB untuk menghindari error Firestore
        const maxSizeKB = 750; // 750KB limit untuk base64
        const maxSizeBytes = maxSizeKB * 1024;

        if (file.size > maxSizeBytes) {
          setToast({
            message: `Ukuran file terlalu besar. Maksimal ${maxSizeKB}KB (${(
              maxSizeKB / 1024
            ).toFixed(1)}MB). File Anda: ${formatFileSize(file.size)}`,
            type: "error",
          });
          // Reset file input
          e.target.value = "";
          return;
        }

        // Validasi tipe file
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
        ];

        if (!allowedTypes.includes(file.type)) {
          setToast({
            message:
              "Tipe file tidak didukung. Gunakan: gambar (JPG, PNG, GIF), PDF, Word, Excel, atau text.",
            type: "error",
          });
          e.target.value = "";
          return;
        }

        console.log("File accepted:", {
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          sizeStatus: file.size <= maxSizeBytes ? "OK" : "Too Large",
        });

        setFormData({
          ...formData,
          lampiran: file,
        });
      }
    } else {
      // Handle all other inputs including custom selects
      const newFormData = {
        ...formData,
        [name]: value,
      };

      // Reset sub kategori when kategori changes
      if (name === "kategori") {
        newFormData.subKategori = "";
      }

      setFormData(newFormData);
    }
  };

  const getFileType = (file) => {
    if (!file) return "unknown";

    const fileType = file.type;

    // File gambar
    if (fileType.startsWith("image/")) {
      return "image";
    }

    // File PDF
    if (fileType === "application/pdf") {
      return "pdf";
    }

    // File dokumen
    if (
      fileType.includes("document") ||
      fileType.includes("text") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("presentation")
    ) {
      return "document";
    }

    return "unknown";
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
    const a = document.createElement("a");
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
    const requiredFields = ["kategori", "subKategori", "judul", "deskripsi"];

    if (formData.anonymous) {
      // Validasi form anonymous - hanya email yang wajib untuk identitas
      requiredFields.push("email");

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === "") {
          setToast({
            message: `Field ${field} wajib diisi`,
            type: "error",
          });
          return false;
        }
      }
    } else {
      // Validasi form non-anonymous - semua field identitas wajib
      const identityFields = [
        "nama",
        "nim",
        "prodi",
        "semester",
        "email",
        "noHp",
      ];
      const allRequiredFields = [...requiredFields, ...identityFields];

      for (const field of allRequiredFields) {
        if (!formData[field] || formData[field].toString().trim() === "") {
          setToast({
            message: `Field ${field} wajib diisi`,
            type: "error",
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
          type: "error",
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
          type: "error",
        });
        return false;
      }
    }

    // Validasi nomor HP (hanya untuk non-anonymous)
    if (!formData.anonymous && formData.noHp) {
      // Nomor HP harus berupa angka dan minimal 10 digit
      if (!/^\d{10,}$/.test(formData.noHp.replace(/[\s\-\+]/g, ""))) {
        setToast({
          message: "Nomor HP harus berupa angka minimal 10 digit",
          type: "error",
        });
        return false;
      }
    }

    // Validasi ukuran file sebelum submit
    if (formData.lampiran) {
      const maxSizeBytes = 750 * 1024; // 750KB
      if (formData.lampiran.size > maxSizeBytes) {
        setToast({
          message: `File terlalu besar. Maksimal 750KB. File Anda: ${formatFileSize(
            formData.lampiran.size
          )}`,
          type: "error",
        });
        return false;
      }

      // Estimasi ukuran base64
      const estimatedBase64Size = formData.lampiran.size * 1.4; // Base64 adds ~33% overhead
      const maxFirestoreFieldSize = 1048487; // Firestore field limit

      if (estimatedBase64Size > maxFirestoreFieldSize) {
        setToast({
          message:
            "File terlalu besar untuk disimpan. Silakan kompres file atau pilih file yang lebih kecil.",
          type: "error",
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

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64Result = reader.result;
        const base64Size = base64Result.length;
        const maxSize = 1048487; // Firestore limit

        console.log("Base64 conversion result:", {
          originalSize: formatFileSize(file.size),
          base64Size: formatFileSize(base64Size),
          withinLimit: base64Size <= maxSize,
        });

        if (base64Size > maxSize) {
          reject(
            new Error(
              `File terlalu besar setelah konversi (${formatFileSize(
                base64Size
              )}). Maksimal: ${formatFileSize(
                maxSize
              )}. Silakan gunakan file yang lebih kecil.`
            )
          );
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
          lampiranBase64 = await fileToBase64(formData.lampiran);
          lampiranType = formData.lampiran.type;
          lampiranName = formData.lampiran.name;

          console.log("File conversion successful:", {
            name: lampiranName,
            type: lampiranType,
            base64Length: lampiranBase64 ? lampiranBase64.length : 0,
          });
        } catch (error) {
          setToast({
            message:
              error.message ||
              "Gagal mengupload lampiran. File terlalu besar atau format tidak didukung.",
            type: "error",
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
        nim: formData.anonymous ? null : formData.nim,
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
        isDeleted: false,
      };

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "tickets"), ticketData);

      // Tambahkan ID document ke data
      const finalTicketData = { ...ticketData, id: docRef.id };

      // Kirim notifikasi ke admin
      try {

        const senderName =
          currentUser?.displayName ||
          currentUser?.email?.split("@")[0] ||
          "Mahasiswa";

        if (currentUser?.uid) {
          const notifResult = await notifyNewTicket(
            finalTicketData,
            currentUser.uid,
            senderName,
            userRole || "student"
          );
        }
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
        // Jangan gagalkan seluruh proses jika notifikasi gagal
      }

      setToast({
        message: formData.anonymous
          ? "Laporan anonymous berhasil dikirim! Token rahasia telah dibuat. Anda bisa melihat token di halaman 'My Tickets' → Detail Tiket untuk verifikasi dengan admin jika diperlukan."
          : "Laporan berhasil dikirim!",
        type: "success",
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

      if (
        error.message.includes("1048487 bytes") ||
        error.message.includes("too large")
      ) {
        errorMessage =
          "File lampiran terlalu besar untuk disimpan. Maksimal ukuran efektif: 750KB. Silakan kompres file Anda.";
      } else if (error.message.includes("permission")) {
        errorMessage =
          "Tidak memiliki izin untuk menyimpan data. Silakan login ulang.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Masalah koneksi internet. Silakan periksa koneksi dan coba lagi.";
      }

      setToast({
        message: errorMessage,
        type: "error",
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

  // Tambahkan fungsi-fungsi helper ini di dalam komponen FormKeluhanMahasiswaPage

  const getKategoriIcon = (kategori) => {
    const icons = {
      akademik: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
        </svg>
      ),
      fasilitas: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"
            clipRule="evenodd"
          />
        </svg>
      ),
      organisasi: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      ukm: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      keuangan: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
      ),
      umum: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      lainnya: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      ),
    };
    return icons[kategori] || null;
  };

  const getKategoriDescription = (kategori) => {
    const descriptions = {
      akademik: "Perkuliahan, nilai, dosen, jadwal",
      fasilitas: "Ruang kelas, lab, perpustakaan, WiFi",
      organisasi: "BEM, Himpunan, DPM",
      ukm: "Unit Kegiatan Mahasiswa",
      keuangan: "SPP, UKT, beasiswa",
      umum: "Informasi dan layanan kampus",
      lainnya: "Kategori lainnya",
    };
    return descriptions[kategori] || "";
  };

  const getSubKategoriIcon = (subKategori) => {
    // Icon yang lebih spesifik untuk sub kategori bisa ditambahkan di sini
    return (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Form - Updated Design */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Form Keluhan dan Laporan Mahasiswa
                </h1>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 text-sm">
                    Sistem Online - Aktif 24/7
                  </span>
                </div>
              </div>
            </div>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed">
              Silakan isi formulir di bawah ini untuk menyampaikan keluhan atau
              laporan Anda.
            </p>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-4 md:p-6">
          {/* Toast notification */}
          {toast.message && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ message: "", type: "success" })}
            />
          )}

          <form onSubmit={handleSubmit}>
            {/* Bagian Identitas - Updated Design */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Identitas Pelapor
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Informasi pribadi untuk keperluan follow-up
                  </p>
                </div>
              </div>

              {/* Checkbox Anonymous - Enhanced Design */}
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl shadow-sm">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="anonymous"
                      name="anonymous"
                      checked={formData.anonymous}
                      onChange={handleChange}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-purple-300 rounded transition-all duration-200"
                    />
                  </div>
                  <div className="ml-4">
                    <label
                      htmlFor="anonymous"
                      className="block text-base font-semibold text-gray-900 mb-2"
                    >
                      🕶️ Kirim laporan secara anonim
                    </label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Jika dicentang, identitas Anda tidak akan ditampilkan
                      dalam laporan.
                      {formData.anonymous && (
                        <span className="block mt-2 text-purple-700 font-medium">
                          ⚠️ Token rahasia akan dibuat untuk verifikasi
                          kepemilikan tiket anonymous.
                        </span>
                      )}
                    </p>
                    {formData.anonymous && (
                      <div className="mt-3 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                        <div className="flex items-center text-purple-800">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            Token rahasia akan dibuat otomatis untuk verifikasi
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields dengan Enhanced Design */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <label
                    htmlFor="nama"
                    className="flex items-center text-gray-700 font-semibold text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Nama Lengkap <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      formData.anonymous
                        ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                    placeholder="Masukkan nama lengkap Anda"
                    disabled={formData.anonymous}
                  />
                </div>

                {/* NIM */}
                <div className="space-y-2">
                  <label
                    htmlFor="nim"
                    className="flex items-center text-gray-700 font-semibold text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    NIM <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="nim"
                    name="nim"
                    value={formData.nim}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      formData.anonymous
                        ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                    placeholder="Contoh: 1234567890"
                    disabled={formData.anonymous}
                  />
                </div>

                {/* Program Studi */}
                <div className="space-y-2">
                  <label
                    htmlFor="prodi"
                    className="flex items-center text-gray-700 font-semibold text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Program Studi <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="prodi"
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      formData.anonymous
                        ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                    placeholder="Contoh: Informatika"
                    disabled={formData.anonymous}
                  />
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-semibold text-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Semester <span className="text-red-500 ml-1">*</span>
                  </label>

                  <CustomSelect
                    name="semester" // Tambahkan name prop
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
                      value: sem.toString(), // Pastikan value adalah string
                      label: `Semester ${sem}`,
                      icon: (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ),
                    }))}
                    value={formData.semester}
                    onChange={handleChange}
                    placeholder="Pilih Semester"
                    disabled={formData.anonymous}
                    required={true}
                    icon={
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center text-gray-700 font-semibold text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 01-2 2z"
                      />
                    </svg>
                    Email <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-700 cursor-default focus:outline-none"
                      placeholder="nama@student.telkomuniversity.ac.id"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email otomatis diambil dari akun yang sedang login
                  </p>
                </div>

                {/* Nomor HP */}
                <div className="space-y-2">
                  <label
                    htmlFor="noHp"
                    className="flex items-center text-gray-700 font-semibold text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    id="noHp"
                    name="noHp"
                    value={formData.noHp}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      formData.anonymous
                        ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                    placeholder="Contoh: 08123456789"
                    disabled={formData.anonymous}
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> Kolom bertanda{" "}
                      <span className="text-red-500">*</span> wajib diisi. Data
                      pribadi Anda akan dijaga kerahasiaannya sesuai kebijakan
                      privasi kampus.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian Keluhan - Updated Design */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Detail Keluhan
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Jelaskan masalah yang Anda hadapi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Kategori - Fixed */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-semibold text-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
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
                    Kategori <span className="text-red-500 ml-1">*</span>
                  </label>

                  <CustomSelect
                    name="kategori" // Tambahkan name prop
                    options={kategoriOptions
                      .filter((opt) => opt.value !== "")
                      .map((option) => ({
                        ...option,
                        icon: getKategoriIcon(option.value),
                        description: getKategoriDescription(option.value),
                      }))}
                    value={formData.kategori}
                    onChange={handleChange}
                    placeholder="Pilih Kategori"
                    required={true}
                    icon={
                      <svg
                        className="w-4 h-4 text-gray-500"
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
                    }
                  />
                </div>

                {/* Sub Kategori - Fixed */}
                <div className="space-y-2">
                  <label className="flex items-center text-gray-700 font-semibold text-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="m13 11l5 5m0 0l-5 5m5-5h-7.803c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C7 14.48 7 13.92 7 12.8V3" />
                    </svg>
                    Sub Kategori <span className="text-red-500 ml-1">*</span>
                  </label>

                  <CustomSelect
                    name="subKategori" // Tambahkan name prop
                    options={
                      formData.kategori
                        ? subKategoriOptions[formData.kategori]?.map(
                            (option) => ({
                              ...option,
                              icon: getSubKategoriIcon(option.value),
                            })
                          ) || []
                        : []
                    }
                    value={formData.subKategori}
                    onChange={handleChange}
                    placeholder="Pilih Sub Kategori"
                    disabled={!formData.kategori}
                    required={true}
                    icon={
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="m13 11l5 5m0 0l-5 5m5-5h-7.803c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C7 14.48 7 13.92 7 12.8V3" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Judul */}
              <div className="mb-6 space-y-2">
                <label
                  htmlFor="judul"
                  className="flex items-center text-gray-700 font-semibold text-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  Judul <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="judul"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 bg-white"
                  placeholder="Tuliskan judul laporan secara singkat dan jelas"
                />
              </div>

              {/* Deskripsi */}
              <div className="mb-6 space-y-2">
                <label
                  htmlFor="deskripsi"
                  className="flex items-center text-gray-700 font-semibold text-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                  Deskripsi <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 bg-white resize-none"
                  placeholder="Jelaskan laporan Anda secara detail. Sertakan informasi seperti kapan kejadian, dimana, dan apa yang terjadi..."
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Minimum 20 karakter untuk deskripsi yang jelas</span>
                  <span>{formData.deskripsi.length} karakter</span>
                </div>
              </div>

              {/* Lampiran dengan Size Guide */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Lampiran <span className="text-gray-500">(Opsional)</span>
                </label>

                {/* File Size Guide - Enhanced */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                        📋 Panduan Upload File
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              <strong>Ukuran maksimal:</strong> 750KB
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              <strong>Format:</strong> JPG, PNG, PDF, Word,
                              Excel
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-yellow-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              <strong>Tips:</strong> Kompres gambar untuk ukuran
                              optimal
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-purple-600"
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
                              <strong>Opsional:</strong> Bantu memperjelas
                              laporan
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!formData.lampiran ? (
                  // Fixed Upload Interface - Icons and text now properly contained
                  <div className="relative group">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-3 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg overflow-hidden">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        {/* Fixed: Icon properly contained */}
                        <div className="mb-1 p-2 bg-white rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <svg
                            className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="mb-2 text-base font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300 text-center">
                          Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-sm text-gray-500 text-center mb-2">
                          Maksimal 750KB • Gambar, PDF, Word, Excel, Text
                        </p>
                        {/* Fixed: Badge properly contained */}
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          📎 Lampiran (Opsional)
                        </div>
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
                  // File preview section tetap sama seperti sebelumnya
                  <div className="border-2 border-blue-200 rounded-2xl p-6 bg-gradient-to-br from-white to-blue-50">
                    {/* File preview content - keep existing code */}
                    {getFileType(formData.lampiran) === "image" ? (
                      <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-white shadow-lg">
                          <img
                            src={URL.createObjectURL(formData.lampiran)}
                            alt="Preview"
                            className="max-w-full h-64 object-contain mx-auto cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => openFilePreview(formData.lampiran)}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {formData.lampiran.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {formatFileSize(formData.lampiran.size)} •{" "}
                              {formData.lampiran.type}
                            </p>
                            <div className="mt-2">
                              {formData.lampiran.size <= 750 * 1024 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  ✅ Ukuran Sesuai
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                  ❌ Terlalu Besar
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openFilePreview(formData.lampiran)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-sm"
                            >
                              👁️ Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadFile(formData.lampiran)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium text-sm"
                            >
                              📥 Download
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, lampiran: null })
                              }
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium text-sm"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Document preview with enhanced styling
                      <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            {getFileType(formData.lampiran) === "pdf" ? (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 18h12V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {formData.lampiran.name}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {formatFileSize(formData.lampiran.size)} •{" "}
                            {getFileType(formData.lampiran) === "pdf"
                              ? "PDF Document"
                              : "Document"}
                          </p>
                          <div className="mt-2">
                            {formData.lampiran.size <= 750 * 1024 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Ukuran Sesuai
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ❌ Terlalu Besar
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => downloadFile(formData.lampiran)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, lampiran: null })
                            }
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
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
              size="large"
            >
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-4xl bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {getFileType(formData.lampiran) === "image" ? (
                    <div className="relative bg-gray-50 p-4 flex items-center justify-center min-h-[400px]">
                      <img
                        src={previewFileUrl}
                        alt="Preview"
                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  ) : getFileType(formData.lampiran) === "pdf" ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <svg
                        className="h-16 w-16 text-red-600 mb-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 18h12V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 text-center mb-4">
                        Preview PDF tidak tersedia di browser ini.
                        <br />
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
                      <svg
                        className="h-16 w-16 text-blue-600 mb-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-gray-600 text-center mb-4">
                        Preview tidak tersedia untuk tipe file ini.
                        <br />
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
                    {formData.lampiran
                      ? formatFileSize(formData.lampiran.size)
                      : ""}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => downloadFile(formData.lampiran)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                    </svg>
                    Download File
                  </button>

                  {getFileType(formData.lampiran) === "image" && (
                    <button
                      onClick={() => {
                        const newWindow = window.open("", "_blank");
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${
                                  formData.lampiran?.name || "Preview Gambar"
                                }</title>
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
                                  <img src="${previewFileUrl}" alt="${
                            formData.lampiran?.name || "Preview"
                          }" />
                                  <div class="filename">${
                                    formData.lampiran?.name || "Gambar Preview"
                                  }</div>
                                </div>
                              </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Buka di Tab Baru
                    </button>
                  )}

                  <button
                    onClick={closeFilePreview}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-white hover:text-red-600 border border-red-600 transition-colors font-medium text-sm"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
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
                    Tutup
                  </button>
                </div>
              </div>
            </Modal>

            {/* Tombol Submit - Enhanced Design */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-100"
              >
                ← Kembali
              </button>

              <Button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transform ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl active:scale-95"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Mengirim Laporan...
                  </div>
                ) : (
                  <div className="flex items-center">
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Kirim Laporan
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormKeluhanMahasiswaPage;
