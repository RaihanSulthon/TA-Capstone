import { useState } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Button from "../components/forms/Button";
import TextField from "../components/forms/TextField";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import { resolve } from "styled-jsx/css";

const FormKeluhanMahasiswaPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  
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
        // Validasi ukuran file (5MB)
        if (files[0].size > 5 * 1024 * 1024) {
          setToast({
            message: "Ukuran file terlalu besar. Maksimal 5MB",
            type: "error"
          });
          return;
        }
        setFormData({
          ...formData,
          lampiran: files[0]
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

  // Validate form
  const validateForm = () => {
    if (formData.anonymous) {
      // Validasi form anonymous
      if (!formData.email || !formData.kategori || !formData.subKategori || !formData.judul || !formData.deskripsi) {
        setToast({
          message: "Harap isi semua kolom yang wajib diisi",
          type: "error"
        });
        return false;
      }
    } else {
      // Validasi form non-anonymous
      if (!formData.nama || !formData.nim || !formData.prodi || !formData.semester || 
          !formData.email || !formData.kategori || !formData.subKategori || 
          !formData.judul || !formData.deskripsi) {
        setToast({
          message: "Harap isi semua kolom yang wajib diisi",
          type: "error"
        });
        return false;
      }
      
      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setToast({
          message: "Format email tidak valid",
          type: "error"
        });
        return false;
      }
    }
    
    return true;
  };

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Import notificationService
      const { notifyNewTicket } = await import("../services/notificationService");

      let lampiranBase64 = null;
      let lampiranType = null;
      let lampiranName = null;

      if(formData.lampiran){
        try{
          const base64Data = await fileToBase64(formData.lampiran);
          lampiranBase64 = base64Data;
          lampiranType = formData.lampiran.type;
          lampiranName = formData.lampiran.name;
        }catch(error){
          console.error("Error converting file to base64:", error);
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
        email: formData.anonymous ? formData.email : formData.email,
        // Tambahan fields untuk token system
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

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      
      // Tambahkan ID document ke data
      const finalTicketData = { ...ticketData, id: docRef.id };
      
      // Kirim notifikasi ke admin
      if (currentUser?.displayName) {
        await notifyNewTicket(
          finalTicketData,
          currentUser.uid,
          currentUser.displayName,
          userRole || "student"
        );
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
      console.error("Error creating ticket:", error);
      setToast({
        message: "Gagal mengirim laporan. Silakan coba lagi nanti.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if(!file){
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
                  Judul Keluhan <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="judul" 
                  name="judul" 
                  value={formData.judul} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tuliskan judul keluhan secara singkat"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="deskripsi" className="block text-gray-700 font-medium mb-2">
                  Deskripsi Keluhan <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="deskripsi" 
                  name="deskripsi" 
                  value={formData.deskripsi} 
                  onChange={handleChange} 
                  rows="5"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan keluhan Anda secara detail..."
                />
              </div>
              
              {/* Lampiran */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Lampiran (Opsional)
                </label>
                
                {!formData.lampiran ? (
                  // Upload interface when no file is selected
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span> atau drag and drop</p>
                        <p className="text-xs text-gray-500">JPG, PNG atau PDF (Maks. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        name="lampiran"
                        onChange={handleChange}
                        accept=".jpg,.jpeg,.png,.pdf" 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  // Preview section when file is selected
                  <div className="border rounded-md p-4 bg-gray-50">
                    {formData.lampiran.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(formData.lampiran)} 
                        alt="Preview" 
                        className="max-w-full h-48 object-contain mx-auto mb-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-gray-200 rounded">
                        <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2">
                      <span className="text-sm text-gray-600">File siap diupload</span>
                      <button
                        onClick={() => setFormData({...formData, lampiran: null})}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Hapus File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tombol Submit */}
            <div className="mt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow"
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