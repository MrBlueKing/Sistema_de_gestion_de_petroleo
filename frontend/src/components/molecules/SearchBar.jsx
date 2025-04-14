import React from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Barra de búsqueda abajo */}
      <div className="flex items-center bg-white rounded-full px-3 py-2 w-full">
        <FaSearch className="text-gray-600 mr-2" />
        <input
          type="text"
          placeholder="Buscar"
          className="bg-transparent border-none outline-none w-full text-sm"
          value={searchTerm}  // Vincular el valor del input al estado
          onChange={(e) => setSearchTerm(e.target.value)}  // Actualizar el estado cuando cambie el input
        />
      </div>
    </div>
  );
};

export default SearchBar;
  