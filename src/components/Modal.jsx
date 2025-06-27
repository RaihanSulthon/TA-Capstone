import { useRef, useEffect } from "react";

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md",
  position = "center"
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Menangani klik tombol Escape untuk menutup modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  // Menentukan lebar modal berdasarkan size
  const getModalSize = () => {
    switch (size) {
      case "sm":
        return "w-full max-w-sm mx-4";
      case "lg":
        return "w-full max-w-lg mx-4";
      case "xl":
        return "w-full max-w-xl mx-4";
      case "2xl":
        return "w-full max-w-2xl mx-4";
      case "full":
        return "w-full max-w-full mx-4";
      default:
        return "w-full max-w-md mx-4"; // Default: md
    }
  };

  if (!isOpen) return null;

  // Check if we're in admin panel by looking for red in background elements
  const isAdminPanel = window.location.pathname.startsWith('/admin');

  return (
    <>
      {/* Backdrop dengan efek blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" aria-hidden="true" />
      
      {/* Modal container - FIXED: Proper centering */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className={`bg-white rounded-xl shadow-2xl ${getModalSize()} max-h-[90vh] transform transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h2 className={`text-lg md:text-xl font-semibold ${isAdminPanel ? 'text-gray-900' : 'text-gray-900'}`}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;