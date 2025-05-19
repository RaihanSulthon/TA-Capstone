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

  // Menangani klik di luar modal untuk menutup modal
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
        return "max-w-sm";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "2xl":
        return "max-w-2xl";
      case "full":
        return "max-w-full mx-4";
      default:
        return "max-w-md"; // Default: md
    }
  };

  // Menentukan posisi modal
  const getModalPosition = () => {
    switch (position) {
      case "top-right":
        return "fixed top-4 right-4 z-50";
      case "top-left":
        return "fixed top-4 left-4 z-50";
      case "custom": // Untuk posisi custom jika diperlukan
        return "fixed z-50"; // Tambahkan class positioning sesuai kebutuhan
      default:
        return "fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"; // Posisi tengah (default)
    }
  };

  if (!isOpen) return null;

  const isAdminPanel = window.location.pathname.startsWith('/admin');

  return (
    <>
      {/* Backdrop dengan efek blur */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" aria-hidden="true" />
      
      {/* Modal container */}
      <div 
        ref={modalRef}
        className={`${getModalPosition()} bg-white rounded-xl shadow-2xl p-6 w-full ${getModalSize()} mx-4 transform transition-all duration-300 ease-in-out`}
      >
        {title && (
          <h2 className={`text-xl font-semibold mb-4 ${isAdminPanel ? 'text-gray-900' : ''}`}>
            {title}
          </h2>
        )}
        
        {children}
      </div>
    </>
  );
};

export default Modal;