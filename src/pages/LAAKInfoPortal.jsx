import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LAAKInfoPortal = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  // Information data structure
  const infoSections = {
    laak: {
      title: "Info Layanan Administrasi Akademik & Kemahasiswaan (LAAK)",
      icon: "🏛️",
      color: "blue",
      items: [
        {
          title: "Pedoman Akademik Universitas Telkom",
          url: "https://baa.telkomuniversity.ac.id/pedoman-akademik-universitas-telkom/",
          description: "Panduan lengkap akademik Universitas Telkom"
        },
        {
          title: "Kalender Akademik Universitas Telkom", 
          url: "https://baa.telkomuniversity.ac.id/kalender-akademik-2-2/",
          description: "Jadwal dan kalender akademik terbaru"
        },
        {
          title: "Telegram Info LAAK FIF",
          url: "https://t.me/LAAKFIF",
          description: "Channel Telegram untuk informasi terkini"
        }
      ]
    },
    akademik: {
      title: "Akademik",
      icon: "📚",
      color: "green",
      items: [
        {
          title: "Kontak Layanan Akademik FIF",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:x:/g/personal/laaksoc_365_telkomuniversity_ac_id/ESeeJauobBlItvzehIlXXasBANyj8Aqo9nftVcMyT0U9Rg?e=KbTQrT",
          description: "Daftar kontak layanan akademik"
        },
        {
          title: "Informasi Kerja Praktik KP",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/EUeKw3-vRNhJq5Ycaq7TBdUBXL2RO5izCeyhR0zBncuyEg?e=u7LXc2",
          description: "Panduan dan informasi Kerja Praktik"
        },
        {
          title: "Pengajuan (Yudisium, Pengecekan Similarity, SKL dan Transkrip Sementara, Sidang TA, SK TA, dll)",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/EUeKw3-vRNhJq5Ycaq7TBdUBXL2RO5izCeyhR0zBncuyEg?e=u7LXc2",
          description: "Formulir pengajuan berbagai dokumen akademik"
        },
        {
          title: "Panduan TA (& Proposal)",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/ESyaRVJjsJNIrZka68QLNdoBP6djA-H6vXvN_RZl71LRjA?e=YNPvdn",
          description: "Panduan lengkap Tugas Akhir dan Proposal"
        },
        {
          title: "Syarat Summa Cumlaude dan Cumlaude (S1, S2, S3)",
          url: "https://telkomuniversityofficial-my.sharepoint.com/personal/laaksoc_365_telkomuniversity_ac_id/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Flaaksoc%5F365%5Ftelkomuniversity%5Fac%5Fid%2FDocuments%2F%5B07%5D%20DOKUMEN%20AKADEMIK%2FAturan%20Akademik%20Tel%2DU%2FAturan%20Luaran%20TA%2C%20Aturan%20Summa%20Cumlaude%20dan%20Cumlaude%2C%20Panduan%20Generative%20AI%2FPU%5FKRITERIA%5FTAMBAHAN%5FUNTUK%5FPREDIKAT%5FSUMMA%5FCUMLAUDE%5FDAN%5FCUMLAUDE%2Epdf&parent=%2Fpersonal%2Flaaksoc%5F365%5Ftelkomuniversity%5Fac%5Fid%2FDocuments%2F%5B07%5D%20DOKUMEN%20AKADEMIK%2FAturan%20Akademik%20Tel%2DU%2FAturan%20Luaran%20TA%2C%20Aturan%20Summa%20Cumlaude%20dan%20Cumlaude%2C%20Panduan%20Generative%20AI&ga=1",
          description: "Kriteria predikat kelulusan terbaik"
        },
        {
          title: "Permohonan Aktif Kuliah",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/Ea6_1IOar0dGq7rsGhHh0doBv41AGKzRjnwVDMgOCWPTdw?e=Uf1vQ8",
          description: "Formulir permohonan aktif kuliah"
        },
        {
          title: "Pengajuan Undur Diri Mahasiswa",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/EUYnLu7tzutEqSqMZ0Vmn8EBRxOw_dGT-sC_2WdcEp7BBg?e=9LWmrp",
          description: "Prosedur pengajuan undur diri"
        },
        {
          title: "Pengajuan Cuti Akademik",
          url: "https://telkomuniversityofficial-my.sharepoint.com/:w:/g/personal/laaksoc_365_telkomuniversity_ac_id/EZHYyGjRbIlFkulHDmpaRE0BCLhRzUZZIHPkAFXIQP0PYQ?e=APCRJ0",
          description: "Formulir pengajuan cuti akademik"
        },
        {
          title: "Pengajuan Komplain dan Saran untuk LAAK",
          url: "https://forms.office.com/pages/responsepage.aspx?id=D_6vkKPCCEG7mGzrTpTvFdEV-iq3_rVFrziCofIAXI1UOFZQQlpCSDVOREpaODJKWTMwUzZENzFXVi4u&route=shorturl",
          description: "Sampaikan komplain dan saran Anda"
        }
      ]
    },
    kemahasiswaan: {
      title: "Kemahasiswaan",
      icon: "👥",
      color: "purple",
      items: [
        {
          title: "Kode Etik Mahasiswa",
          url: "https://ugc.production.linktr.ee/16901c51-fb50-4ae6-a3dc-ee4df9a8c86f_KR-069-2014---Kode-Etik-Mahasiswa-Tel-U.pdf",
          description: "Pedoman kode etik mahasiswa Tel-U"
        },
        {
          title: "Pengajuan Bantuan Dana (Kompetisi atau Kegiatan)",
          url: "https://forms.office.com/pages/responsepage.aspx?id=D_6vkKPCCEG7mGzrTpTvFUd0q4aIECVLikwEWF7c7klUQ0tOVzdWNzdTQjhOVjE5VDlESFdMV1k4Qi4u&route=shorturl",
          description: "Formulir bantuan dana untuk kompetisi dan kegiatan"
        },
        {
          title: "Pelaporan Kompetisi Mandiri",
          url: "https://forms.office.com/Pages/ResponsePage.aspx?id=D_6vkKPCCEG7mGzrTpTvFZaiIdFgEWpOloNL-C7LRkdUNzAzWVhVV0ExM1VQVkRCV0I0UERLR1owUi4u",
          description: "Laporkan partisipasi kompetisi mandiri"
        },
        {
          title: "Layanan Pusat (Konseling, beasiswa, asrama, dll)",
          url: "https://linktr.ee/ditmawa_univtelkom",
          description: "Portal layanan kemahasiswaan terpusat"
        },
        {
          title: "Kompetisi Belmawa 2024",
          url: "https://linktr.ee/kompetisikemendikbudristek24",
          description: "Informasi kompetisi Belmawa terbaru"
        },
        {
          title: "Panduan TAK",
          url: "https://linktr.ee/panduanTAK",
          description: "Panduan Tugas Akhir Komprehensif"
        }
      ]
    },
    aplikasi: {
      title: "Aplikasi Penunjang",
      icon: "💻",
      color: "orange",
      items: [
        {
          title: "SiPProp (untuk Proposal TA)",
          url: "https://apps-soc.telkomuniversity.ac.id/login",
          description: "Sistem Informasi Proposal - Login menggunakan SSO",
          requiresLogin: true
        },
        {
          title: "SIPETA (untuk Tugas Akhir)",
          url: "https://apps-soc.telkomuniversity.ac.id/login",
          description: "Sistem Informasi Penelitian Tugas Akhir - Login menggunakan SSO",
          requiresLogin: true
        },
        {
          title: "SiKaPe (untuk Kerja Praktek)",
          url: "https://apps-soc.telkomuniversity.ac.id/login",
          description: "Sistem Informasi Kerja Praktek - Login menggunakan SSO",
          requiresLogin: true
        },
        {
          title: "SIRAMA (untuk Registrasi)",
          url: "https://sirama.telkomuniversity.ac.id/",
          description: "Sistem Informasi Registrasi Mahasiswa - Login menggunakan SSO",
          requiresLogin: true
        },
        {
          title: "iBasila (untuk Verifikasi Dokumen)",
          url: "https://basila.telkomuniversity.ac.id/landing_page/",
          description: "Sistem Verifikasi Dokumen - Login menggunakan SSO",
          requiresLogin: true
        },
        {
          title: "TOSS (untuk pengajuan Surat)",
          url: "https://toss.telkomuniversity.ac.id/login",
          description: "Tel-U Online Student Services - Login menggunakan SSO",
          requiresLogin: true
        }, 
        {
          title: "Tel-U Care (untuk Penundaan BPP)",
          url: "https://situ-keu.telkomuniversity.ac.id/credit-payment/home",
          description: "Sistem Penundaan Biaya Pendidikan - Login menggunakan SSO",
          requiresLogin: true
        }
      ]
    }
  };

  // Get color classes for each section
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        gradient: "from-blue-500 to-blue-600",
        hover: "hover:from-blue-600 hover:to-blue-700",
        light: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200"
      },
      green: {
        gradient: "from-green-500 to-green-600", 
        hover: "hover:from-green-600 hover:to-green-700",
        light: "bg-green-50",
        text: "text-green-600",
        border: "border-green-200"
      },
      purple: {
        gradient: "from-purple-500 to-purple-600",
        hover: "hover:from-purple-600 hover:to-purple-700", 
        light: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-200"
      },
      orange: {
        gradient: "from-orange-500 to-orange-600",
        hover: "hover:from-orange-600 hover:to-orange-700",
        light: "bg-orange-50", 
        text: "text-orange-600",
        border: "border-orange-200"
      }
    };
    return colorMap[color];
  };

  // Handle external link click
  const handleLinkClick = (url, title) => {
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Toggle section
  const toggleSection = (sectionKey) => {
    setActiveSection(activeSection === sectionKey ? null : sectionKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-full">
              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM10 18V9h6v9h-6zm-4 0V9h2v9H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            LAAK FIF Tel-U
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">
            Info Layanan Administrasi Akademik & Kemahasiswaan
          </p>
          <p className="text-lg text-blue-200">
            Fakultas Informatika - Universitas Telkom
          </p>
          
          {/* Back to Home Button */}
          <button
            onClick={() => navigate("/")}
            className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 text-white border-2 font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-300"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {Object.entries(infoSections).map(([sectionKey, section]) => {
            const colors = getColorClasses(section.color);
            const isActive = activeSection === sectionKey;
            
            return (
              <div key={sectionKey} className="space-y-4">
                {/* Section Header Button */}
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className={`w-full p-6 rounded-xl bg-gradient-to-r ${colors.gradient} ${colors.hover} text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">{section.icon}</span>
                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-bold leading-tight">
                          {section.title}
                        </h3>
                        <p className="text-sm opacity-90 mt-1">
                          {section.items.length} item tersedia
                        </p>
                      </div>
                    </div>
                    <svg 
                      className={`h-6 w-6 transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Section Items */}
                {isActive && (
                  <div className={`${colors.light} border ${colors.border} rounded-xl p-6 space-y-4`} style={{animation: 'fadeIn 0.3s ease-out'}}>
                    {section.items.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleLinkClick(item.url, item.title)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-2 leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.description}
                            </p>
                            {item.requiresLogin && (
                              <div className="flex items-center text-xs text-blue-600">
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Memerlukan Login SSO
                              </div>
                            )}
                          </div>
                          <svg className="h-5 w-5 text-gray-400 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Butuh Bantuan Lebih Lanjut?
          </h2>
          <p className="text-gray-600 mb-6">
            Hubungi layanan LAAK FIF untuk mendapatkan bantuan dan informasi lebih detail
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleLinkClick("https://t.me/LAAKFIF", "Telegram LAAK FIF")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Join Telegram LAAK FIF
            </button>
            <button
              onClick={() => handleLinkClick("https://forms.office.com/pages/responsepage.aspx?id=D_6vkKPCCEG7mGzrTpTvFdEV-iq3_rVFrziCofIAXI1UOFZQQlpCSDVOREpaODJKWTMwUzZENzFXVi4u&route=shorturl", "Form Komplain")}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Kirim Komplain/Saran
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LAAKInfoPortal;