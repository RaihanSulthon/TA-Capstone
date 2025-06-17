import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

const FAQSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [openFAQs, setOpenFAQs] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toggleFAQ = (faqId) => {
    setOpenFAQs((prev) => (prev === faqId ? null : faqId));
  };

  // Fetch FAQs from Firestore
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        // Query only active FAQs, ordered by order field
        const faqsQuery = query(
          collection(db, "faqs"),
          where("isActive", "==", true),
          orderBy("order", "asc")
        );
        
        const faqsSnapshot = await getDocs(faqsQuery);
        const faqsList = faqsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFaqs(faqsList);
        setError("");
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        // If no FAQs in database or error, fall back to some default FAQs
        setFaqs([
          {
            id: "default-1",
            question: "Apa itu My Capstone App?",
            answer: "My Capstone App adalah platform komprehensif yang dirancang khusus untuk mahasiswa dan dosen Telkom University. Platform ini menyediakan sistem helpdesk untuk mengelola keluhan dan pertanyaan, serta direktori kontak dosen berdasarkan bidang keahlian."
          },
          {
            id: "default-2",
            question: "Bagaimana cara mendaftar di platform ini?",
            answer: "Untuk mendaftar, klik tombol 'Sign Up' di halaman utama atau navigasi ke halaman registrasi. Gunakan email Telkom University yang valid (@student.telkomuniversity.ac.id untuk mahasiswa, @telkomuniversity.ac.id untuk dosen/staff)."
          },
          {
            id: "default-3",
            question: "Bagaimana cara membuat tiket keluhan?",
            answer: "Login sebagai mahasiswa, lalu pilih menu 'Buat Tiket Baru' dan lengkapi formulir keluhan dengan kategori yang sesuai."
          },
          {
            id: "default-4",
            question: "Apakah data saya aman di platform ini?",
            answer: "Ya, data Anda dienkripsi dan disimpan dengan keamanan berbasis role di Firebase dan Firestore dengan standar keamanan tinggi."
          },
          {
            id: "default-5",
            question: "Apa saja kategori keluhan yang tersedia?",
            answer: "Tersedia kategori seperti Akademik, Fasilitas, Organisasi, UKM, Keuangan, dan lainnya untuk memudahkan pengelolaan tiket."
          },
          {
            id: "default-6",
            question: "Bagaimana cara menggunakan fitur kontak dosen?",
            answer: "Menu 'Dosen' menyediakan daftar dosen dan info kontaknya berdasarkan bidang keahlian untuk memudahkan mahasiswa mencari bantuan akademik."
          }
        ]);
        setError("Menggunakan FAQ default. Data akan diperbarui ketika admin menambahkan FAQ baru.");
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Distribute FAQs into two columns
  const leftColumn = faqs.filter((_, i) => i % 2 === 0);
  const rightColumn = faqs.filter((_, i) => i % 2 !== 0);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50" id="faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan yang sering diajukan tentang platform My Capstone App
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang platform My Capstone App
          </p>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 max-w-4xl mx-auto">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {faqs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada FAQ</h3>
            <p className="text-gray-600">
              FAQ akan segera tersedia. Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            {[leftColumn, rightColumn].map((column, colIndex) => (
              <div key={colIndex} className="flex-1 space-y-4">
                {column.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <h3 className="font-medium text-gray-900 text-sm lg:text-base">{faq.question}</h3>
                      <svg
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          openFAQs === faq.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFAQs === faq.id && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-gray-600 text-sm lg:text-base">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-12 text-center bg-blue-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Masih ada pertanyaan?
          </h3>
          <p className="text-gray-600 mb-4">
            Tim support kami siap membantu Anda. Jangan ragu untuk menghubungi kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:contact@mycapstoneapp.com"
              className="inline-flex items-center bg-blue-600 border-2 border-blue-500 hover:bg-white hover:text-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Kirim Email
            </a>
            <button
              onClick={() => {
                isAuthenticated
                  ? navigate("/app/submit-ticket")
                  : navigate("/auth", { state: { initialTab: "signup" } });
              }}
              className="inline-flex items-center bg-blue-600 border-2 border-blue-500 hover:bg-white hover:text-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {isAuthenticated ? "Buat Tiket" : "Form Kontak"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;