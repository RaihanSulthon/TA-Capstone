import React from "react";

/**
 * @param {Object} props Component props
 * @param {string} props.readStatus Current read status filter value ("all", "read", "unread")
 * @param {Function} props.setReadStatus Function to set read status filter
 * @param {string} props.userRole Current user role
 */
const ReadStatusFilter = ({ readStatus, setReadStatus, userRole }) => {
  const getReadFieldName = () => {
    switch (userRole) {
      case "admin":
        return "readByAdmin";
      case "disposisi":
        return "readByDisposisi";
      case "student":
      default:
        return "readByStudent";
    }
  };

  return (
    <div>
      <label htmlFor="read-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Status Dibaca
      </label>
      <select
        id="read-status-filter"
        value={readStatus}
        onChange={(e) => setReadStatus(e.target.value)}
        className="w-full md:w-40 px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="all">Semua Tiket</option>
        <option value="unread">Belum Dibaca</option>
        <option value="read">Sudah Dibaca</option>
      </select>
    </div>
  );
};

export default ReadStatusFilter;