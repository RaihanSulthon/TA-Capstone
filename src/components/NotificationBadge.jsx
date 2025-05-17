// src/components/NotificationBadge.jsx
import React from 'react';

const NotificationBadge = ({ count, onClick, className }) => {
  if (!count || count <= 0) return null;
  
  return (
    <button 
      onClick={onClick}
      className={`relative inline-flex items-center ${className || ''}`}
    >
      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
        {count > 9 ? '9+' : count}
      </span>
    </button>
  );
};

export default NotificationBadge;