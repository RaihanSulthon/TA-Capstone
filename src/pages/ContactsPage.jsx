import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { db } from "../firebase-config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useAuth } from "../contexts/Authcontexts";

const ContactsPage = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Deteksi apakah sedang di dalam protected route atau public route
  const isInsideApp = location.pathname.startsWith("/app/");

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKeahlian, setFilterKeahlian] = useState("all");

  // Fetch contacts from users collection with role "dosen_public"
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Query users with role "dosen_public" - accessible without auth
        // Query contacts collection - accessible without auth
        const contactsQuery = query(
          collection(db, "contacts"),
          where("isActive", "==", true),
          orderBy("name", "asc")
        );

        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = contactsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Map fields for compatibility
          nama: doc.data().name,
          bidangKeahlian:
            doc.data().expertise || doc.data().bidangKeahlian || "",
        }));

        setContacts(contactsList);
        setError("");
      } catch (error) {
        console.error("Error fetching contacts:", error);
        let errorMessage = "Gagal memuat data kontak. Silakan coba lagi nanti.";

        // If the error is due to Firebase permissions
        if (error.code === "permission-denied") {
          errorMessage =
            "Akses ditolak - Cek pengaturan keamanan Firebase Anda.";
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Filter contacts based on search term and expertise
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.bidangKeahlian
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKeahlian =
      filterKeahlian === "all" ||
      contact.bidangKeahlian
        ?.toLowerCase()
        .includes(filterKeahlian.toLowerCase());

    return matchesSearch && matchesKeahlian;
  });

  // Get unique expertise areas for filter
  const keahlianOptions = Array.from(
    new Set(
      contacts
        .map((contact) => contact.bidangKeahlian)
        .filter(Boolean)
        .flatMap((keahlian) => keahlian.split(",").map((k) => k.trim()))
    )
  ).sort();

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterKeahlian("all");
  };

  if (loading) {
    return (
      <div
        className={
          isInsideApp
            ? "w-full flex items-center justify-center py-12"
            : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"
        }
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
          <div className="mt-4 text-center">
            <p className="text-gray-600 font-medium">Memuat kontak dosen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={
          isInsideApp
            ? "w-full space-y-6"
            : "min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-20"
        }
      >
        {!isInsideApp && (
          // Navbar untuk public page dengan gradient background
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 py-4">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center group">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Capstone App
                  </span>
                </Link>
                <div className="flex items-center space-x-6">
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Home
                  </Link>
                  {isAuthenticated ? (
                    <Link
                      to="/app/dashboard"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}

        <div className={isInsideApp ? "" : "container mx-auto px-6 pt-24"}>
          <div
            className={
              isInsideApp
                ? "flex items-center justify-between mb-8"
                : "text-center mb-12"
            }
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Kontak Dosen
              </h1>
              <p className="text-gray-600 text-lg">
                Temukan dosen berdasarkan bidang keahlian yang Anda butuhkan
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-lg">
                  Terjadi Kesalahan
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            {error.includes("Akses ditolak") && (
              <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="font-semibold text-yellow-800 mb-2">
                  Possible Firebase Security Rules Issue:
                </p>
                <p className="text-yellow-700">
                  Please update your Firebase security rules to allow public
                  access to contacts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isInsideApp
          ? "w-full space-y-8"
          : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }
    >
      {!isInsideApp && (
        // Navbar untuk public page dengan design yang lebih menarik
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 py-4">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center group">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Capstone App
                </span>
              </Link>
              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Home
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/app/dashboard"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className={isInsideApp ? "" : "container mx-auto px-6 py-24"}>
        {/* Header dengan design yang lebih menarik */}
        <div className={isInsideApp ? "mb-8" : "text-center mb-16"}>
          <div
            className={
              isInsideApp ? "" : "flex items-center justify-center mb-6"
            }
          >
            {!isInsideApp && (
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-2xl">
                <svg
                  className="h-12 w-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            )}
          </div>

          {isInsideApp ? (
            // Layout untuk di dalam app - lebih sederhana dan compact
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-3 rounded-xl mr-4">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Kontak Dosen
                </h1>
                <p className="text-gray-600 text-base">
                  Temukan dosen berdasarkan bidang keahlian yang Anda butuhkan
                  dengan mudah dan cepat
                </p>
              </div>
            </div>
          ) : (
            // Layout untuk public page - lebih besar dan mencolok
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
                Kontak Dosen
              </h1>
              <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
                Temukan dosen berdasarkan bidang keahlian yang Anda butuhkan
                dengan mudah dan cepat
              </p>
            </div>
          )}
        </div>

        {/* Search and Filter Section dengan design yang lebih menarik */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 p-8 rounded-3xl shadow-xl mb-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                🔍 Cari Dosen
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan nama, email, atau bidang keahlian..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 placeholder-gray-400"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="lg:w-80">
              <label
                htmlFor="keahlian-filter"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                🎯 Filter Bidang Keahlian
              </label>
              <select
                id="keahlian-filter"
                value={filterKeahlian}
                onChange={(e) => setFilterKeahlian(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 bg-white"
              >
                <option value="all">Semua Bidang Keahlian</option>
                {keahlianOptions.map((keahlian) => (
                  <option key={keahlian} value={keahlian}>
                    {keahlian}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={resetFilters}
                className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-2xl hover:from-gray-200 hover:to-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-2 border-gray-200"
              >
                🔄 Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats dengan design yang lebih menarik */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 inline-flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl mr-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-blue-800 font-semibold">
                Menampilkan{" "}
                <span className="font-bold text-blue-900">
                  {filteredContacts.length}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-blue-900">
                  {contacts.length}
                </span>{" "}
                dosen
              </p>
            </div>
          </div>
        </div>

        {/* Contacts Grid dengan design yang lebih menarik */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 p-16 rounded-3xl shadow-xl text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-3xl inline-block">
                <svg
                  className="h-20 w-20 text-gray-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Tidak Ada Dosen Ditemukan
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              {contacts.length === 0
                ? "Belum ada data kontak dosen yang tersedia saat ini."
                : "Coba ubah kata kunci pencarian atau filter yang Anda gunakan."}
            </p>
            {filteredContacts.length === 0 && contacts.length > 0 && (
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100 group"
              >
                {/* Profile Image dengan gradient background */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  {contact.photoBase64 ? (
                    <img
                      src={contact.photoBase64}
                      alt={contact.nama}
                      className="relative z-10 w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="relative z-10 w-32 h-32 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-pulse delay-300"></div>
                </div>

                {/* Contact Info dengan padding yang lebih baik */}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {contact.nama}
                  </h3>

                  {contact.bidangKeahlian && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                        <span className="mr-2">🎓</span>
                        Bidang Keahlian
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contact.bidangKeahlian
                          .split(",")
                          .slice(0, 3)
                          .map((keahlian, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 hover:shadow-md transition-shadow duration-300"
                            >
                              {keahlian.trim()}
                            </span>
                          ))}
                        {contact.bidangKeahlian.split(",").length > 3 && (
                          <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            +{contact.bidangKeahlian.split(",").length - 3}{" "}
                            lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center group/item">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl mr-3 group-hover:item:scale-110 transition-transform duration-300">
                          <svg
                            className="h-4 w-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium break-all hover:underline transition-all duration-300"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}

                    {contact.office && (
                      <div className="flex items-center group/item">
                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-xl mr-3 group-hover:item:scale-110 transition-transform duration-300">
                          <svg
                            className="h-4 w-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-600 text-sm font-medium">
                          {contact.office}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decorative bottom border */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
