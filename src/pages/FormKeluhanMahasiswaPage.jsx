// src/pages/FormKeluhanMahasiswaPage.jsx
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
      if (!formData.kategori || !formData.subKategori || !formData.judul || !formData.deskripsi) {
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
        status: "new",
        assignedTo: null,
        feedback: [],
        readByStudent: false,
        readByAdmin: false,
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
      
      // TODO: Upload lampiran ke Firebase Storage jika ada
      // Jika lampiran ada, upload ke Firebase Storage
      // dan update dokumen dengan URL lampiran
      
      setToast({
        message: "Laporan Anda berhasil dikirim dan akan segera ditindaklanjuti.",
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(sem => (
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
                    disabled={formData.anonymous}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="noHp" className="block text-gray-700 font-medium mb-2">Nomor HP</label>
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
              
              <div className="mt-2">
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {kategoriOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="judul" className="block text-gray-700 font-medium mb-2">
                  Judul Laporan <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="judul" 
                  name="judul" 
                  value={formData.judul} 
                  onChange={handleChange} 
                  placeholder="Berikan judul yang singkat dan jelas"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  rows="6" 
                  placeholder="Jelaskan secara detail keluhan atau laporan Anda..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Lampiran (opsional)
                  <span className="text-sm text-gray-500 ml-2">Maksimal 5 MB (.jpg, .png, .pdf)</span>
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
                      // Image preview
                      <div className="flex flex-col">
                        <div className="w-full h-48 bg-gray-200 rounded-md mb-2 overflow-hidden relative">
                          <img 
                            src={URL.createObjectURL(formData.lampiran)} 
                            alt="Lampiran"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-0 right-0 p-2 bg-black bg-opacity-50 text-white rounded-tl-md text-xs">
                            Preview image
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {formData.lampiran.name}
                            <span className="ml-2 text-xs text-gray-500">
                              ({(formData.lampiran.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
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
                    ) : formData.lampiran.type === 'application/pdf' ? (
                      // PDF preview
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112.414 3H16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-gray-900">Dokumen PDF</span>
                            <p className="text-xs text-gray-500">
                              {formData.lampiran.name}
                              <span className="ml-2">
                                ({(formData.lampiran.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2">
                          <span className="text-sm text-gray-600">File PDF siap diupload</span>
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
                    ) : (
                      // Other file types
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{formData.lampiran.name}</span>
                            <p className="text-xs text-gray-500">
                              ({(formData.lampiran.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        </div>
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