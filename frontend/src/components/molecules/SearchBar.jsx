// src/components/molecules/SearchBar.jsx
import React from "react";
import { FaSearch, FaUser } from "react-icons/fa";

const SearchBar = () => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      
      {/* Barra de búsqueda abajo */}
      <div className="flex items-center bg-white rounded-full px-3 py-2 w-full">
        <FaSearch className="text-gray-600 mr-2" />
        <input
          type="text"
          placeholder="Buscar"
          className="bg-transparent border-none outline-none w-full text-sm"
        />
      </div>
    </div>
  );
};

export default SearchBar;