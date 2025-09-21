import { useState, useRef, useEffect } from "react";

const CustomSelect = ({
  options = [],
  value,
  onChange,
  name, // Tambahkan prop name
  placeholder = "Pilih opsi...",
  disabled = false,
  className = "",
  icon = null,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    // Pastikan onChange dipanggil dengan format yang benar
    onChange({
      target: {
        name: name, // Kirim name yang benar
        value: option.value,
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-left flex items-center justify-between ${
          disabled
            ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
            : isOpen
            ? "bg-white border-blue-500 shadow-lg"
            : "bg-white border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
          <span
            className={`truncate ${
              selectedOption ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center ml-2">
          {required && <span className="text-red-500 mr-2">*</span>}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari opsi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Tidak ada opsi yang ditemukan
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value || index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 flex items-center ${
                    value === option.value
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-700 hover:text-blue-700"
                  }`}
                >
                  <div className="flex items-center w-full">
                    {/* Icon untuk opsi tertentu */}
                    {option.icon && (
                      <div className="mr-3 flex-shrink-0 text-blue-500">
                        {option.icon}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {/* Checkmark untuk opsi yang dipilih */}
                    {value === option.value && (
                      <svg
                        className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer dengan info */}
          {filteredOptions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                {filteredOptions.length} opsi tersedia
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
