// src/components/atoms/Button/UserButton.jsx
import React from "react";

const UserButton = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-full w-full shadow-md transition-colors"
    >
      {text}
    </button>
  );
};

export default UserButton;