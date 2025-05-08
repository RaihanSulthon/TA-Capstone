import React from "react";

const Button = ({ type = "button", onClick, children, disabled, className }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-medium ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;