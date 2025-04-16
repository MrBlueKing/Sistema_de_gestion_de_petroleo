import React, { useState } from "react";

const SearchableDropdown = ({
  options = [],
  selected,
  onSelect,
  placeholder = "Selecciona una opción",
  labelKey = "nombre", // permite especificar la propiedad a mostrar
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === "string" ? opt : opt[labelKey];
    return label?.toLowerCase().includes(filter.toLowerCase());
  });

  const getLabel = (opt) => (typeof opt === "string" ? opt : opt[labelKey]);

  return (
    <div className="relative w-full">
      <div
        className="border rounded-md p-2 bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected || placeholder}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar..."
            className="w-full p-2 border-b outline-none"
          />
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  const value = getLabel(opt);
                  onSelect(value);
                  setIsOpen(false);
                  setFilter("");
                }}
              >
                {getLabel(opt)}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500 text-sm text-center">
              Sin resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
