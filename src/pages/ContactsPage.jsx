import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase-config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useAuth } from "../contexts/Authcontexts";

const ContactsPage = () => {
  const { isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKeahlian, setFilterKeahlian] = useState("all");

  // Fetch contacts from users collection with role "dosen_public"
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Query users with role "dosen_public" - accessible without auth
        const contactsQuery = query(
          collection(db, "users"),
          where("role", "==", "dosen_public"),
          orderBy("name", "asc")
        );
        
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Map fields for compatibility
          nama: doc.data().name,
          bidangKeahlian: doc.data().expertise || doc.data().bidangKeahlian || ""
        }));
        
        setContacts(contactsList);
        setError("");
      } catch (error) {
        console.error("Error fetching contacts:", error);
        let errorMessage = "Gagal memuat data kontak. Silakan coba lagi nanti.";
        
        // If the error is due to Firebase permissions
        if (error.code === 'permission-denied') {
          errorMessage = "Akses ditolak - Cek pengaturan keamanan Firebase Anda.";
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Filter contacts based on search term and expertise
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.bidangKeahlian?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKeahlian = filterKeahlian === "all" || 
      contact.bidangKeahlian?.toLowerCase().includes(filterKeahlian.toLowerCase());
    
    return matchesSearch && matchesKeahlian;
  });

  // Get unique expertise areas for filter
  const keahlianOptions = Array.from(
    new Set(
      contacts
        .map(contact => contact.bidangKeahlian)
        .filter(Boolean)
        .flatMap(keahlian => 
          keahlian.split(',').map(k => k.trim())
        )
    )
  ).sort();

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterKeahlian("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Kontak Dosen</h1>
                <p className="text-blue-100">
                  Temukan dosen berdasarkan bidang keahlian yang Anda butuhkan
                </p>
              </div>
              
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center bg-blue-600 text-white border border-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition-colors duration-300"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold mb-2">Error:</p>
            <p>{error}</p>
            {error.includes("Akses ditolak") && (
              <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded">
                <p className="font-semibold">Possible Firebase Security Rules Issue:</p>
                <p className="mt-2">
                  It looks like your Firebase security rules might be preventing access to the contacts data. 
                  Please make sure your Firestore security rules allow reading users with role "dosen_public".
                </p>
                <p className="mt-2">
                  Update your security rules in Firebase Console to include:
                </p>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {`match /users/{userId} {
  allow read: if resource.data.role == "dosen_public" || 
              (request.auth != null && request.auth.uid == userId);
}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Kontak Dosen</h1>
              <p className="text-blue-100">
                Temukan dosen berdasarkan bidang keahlian yang Anda butuhkan
              </p>
            </div>
            
            {/* Back to Home Button */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center bg-blue-600 text-white border border-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-1">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Dosen
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan nama, email, atau bidang keahlian"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="keahlian-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Bidang Keahlian
                </label>
                <select
                  id="keahlian-filter"
                  value={filterKeahlian}
                  onChange={(e) => setFilterKeahlian(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Bidang Keahlian</option>
                  {keahlianOptions.map(keahlian => (
                    <option key={keahlian} value={keahlian}>
                      {keahlian}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <p className="text-gray-600">
            Menampilkan {filteredContacts.length} dari {contacts.length} dosen
          </p>
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Dosen Ditemukan</h3>
            <p className="text-gray-600 mb-4">
              {contacts.length === 0 
                ? "Belum ada data kontak dosen yang tersedia."
                : "Coba ubah kata kunci pencarian atau filter yang Anda gunakan."
              }
            </p>
            {filteredContacts.length === 0 && contacts.length > 0 && (
              <button
                onClick={resetFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Profile Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {contact.photoBase64 ? (
                    <img
                      src={contact.photoBase64}
                      alt={contact.nama}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.nama}</h3>
                  
                  {contact.bidangKeahlian && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-500 mb-1">Bidang Keahlian</p>
                      <div className="flex flex-wrap gap-1">
                        {contact.bidangKeahlian.split(',').map((keahlian, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                          >
                            {keahlian.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {contact.email && (
                    <div className="flex items-center mb-2">
                      <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-700 text-sm break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.office && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-600 text-sm">{contact.office}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;