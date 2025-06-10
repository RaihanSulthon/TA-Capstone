import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase-config";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useAuth } from "../contexts/Authcontexts";

const ContactsSection = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // limiter for 6 contacts only
  useEffect(() => {
    const fetchFeaturedContacts = async () => {
      try {
        const contactsQuery = query(
          collection(db, "contacts"),
          where("isActive", "==", true),
          orderBy("name", "asc"),
          limit(6)
        );
        
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Map fields only for compatibility
          nama: doc.data().name,
          bidangKeahlian: doc.data().expertise || doc.data().bidangKeahlian || ""
        }));
        
        setContacts(contactsList);
        setError(null);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setError("Failed to load contacts. Please check your Firebase security rules.");
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContacts();
  }, []);

  // Handle view all button click - redirect to appropriate page
  const handleViewAllClick = () => {
    navigate("/contacts");
  };

  if (loading) {
    return (
      <section className="py-16 bg-white" id="contacts">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kontak Dosen</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white" id="contacts">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Kontak Dosen</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hubungi dosen-dosen kami untuk konsultasi akademik, penelitian, atau pertanyaan lainnya sesuai dengan bidang keahlian mereka.
          </p>
        </div>
        
        {error ? (
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-lg mx-auto">
              <p>{error}</p>
              <p className="mt-2 text-sm">
                This may be due to Firebase permission settings. Please update your Firestore security rules to allow reading users with role "dosen_public".
              </p>
              <div className="mt-4 bg-gray-100 p-3 rounded text-xs text-left overflow-auto">
                <pre>
                  {`match /users/{userId} {\n  allow read: if resource.data.role == "dosen_public" || \n              (request.auth != null && request.auth.uid == userId);\n}`}
                </pre>
              </div>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Kontak</h3>
            <p className="text-gray-600">
              Kontak dosen akan segera tersedia.
            </p>
          </div>
        ) : (
          <>
            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Profile Image */}
                  <div className="flex items-center mb-4">
                    {contact.photoBase64 ? (
                      <img
                        src={contact.photoBase64}
                        alt={contact.nama}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                        <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {contact.nama}
                      </h3>
                      {contact.office && (
                        <p className="text-sm text-gray-600">{contact.office}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Info */}
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
                  {/* Expertise Tags */}
                  {contact.bidangKeahlian && (
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        <span className="text-gray-600 text-sm font-medium">Bidang Keahlian</span>
                      </div>
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
                </div>
              ))}
            </div>
            
            {/* View All Button - Updated with new styling */}
            <div className="text-center">
              <button
                onClick={handleViewAllClick}
                className="inline-flex items-center bg-blue-600 border-2 border-blue-500 hover:bg-white hover:text-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Lihat Semua Kontak Dosen
                <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ContactsSection;