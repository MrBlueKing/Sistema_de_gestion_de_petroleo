import React, { useState, useRef, useEffect } from "react";

const SearchableDropdown = ({ options, selected, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Cierra el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔄 Actualiza el input si selected cambia desde el padre
  useEffect(() => {
    setSearch(selected);
  }, [selected]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <ul className="absolute z-10 bg-white border border-gray-300 mt-1 max-h-60 w-full overflow-auto rounded shadow">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onSelect(opt);
                  setSearch(opt); // actualiza visualmente
                  setIsOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-400">No hay coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;
