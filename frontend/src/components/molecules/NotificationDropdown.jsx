import React, { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";

const NotificationDropdown = ({ notifications }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <FaBell className="text-gray-600" size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`
            absolute right-0 mt-2 min-w-[280px] max-w-xs w-full
            bg-white rounded-md shadow-lg border border-gray-200 z-40 overflow-hidden
          `}
        >
          <div className="px-4 py-2 border-b border-gray-100 font-medium text-gray-700">
            Notificaciones
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100"
              >
                <p className="text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-500">{n.time} atrás</p>
              </li>
            ))}
          </ul>
          {notifications.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No hay notificaciones
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
