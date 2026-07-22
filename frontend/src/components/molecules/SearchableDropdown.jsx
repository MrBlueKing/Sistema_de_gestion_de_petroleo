import React, { useState, useRef, useEffect } from "react";

const SearchableDropdown = ({ 
  options, 
  selected, 
  onSelect, 
  placeholder, 
  disabled = false,
  maxHeight = "240px" // 🔧 Agregar esta prop con valor por defecto
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [userTyping, setUserTyping] = useState(false);

  // Reset search when selected changes externally
  useEffect(() => {
    if (selected) {
      const selectedOption = options.find(opt => 
        (typeof opt.value === 'object' && typeof selected === 'object' && opt.value?.rut === selected?.rut) || 
        (typeof opt.value !== 'object' && opt.value === selected) ||
        (opt.label === selected) // Agregamos esta condición para manejar el caso donde se pasa el label
      );
      
      if (selectedOption) {
        setSearch(selectedOption.label);
      } else if (typeof selected === 'string') {
        // Si no encontramos una coincidencia exacta pero selected es string, asumimos que es un label
        setSearch(selected);
      }
    } else if (!userTyping) {
      setSearch("");
    }
  }, [selected, options, userTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setUserTyping(false);
        
        // Si se cierra sin seleccionar y hay un valor seleccionado, restaurar ese valor
        if (selected) {
          const selectedOption = options.find(opt => 
            (typeof opt.value === 'object' && typeof selected === 'object' && opt.value?.rut === selected?.rut) || 
            (typeof opt.value !== 'object' && opt.value === selected) ||
            (opt.label === selected)
          );
          
          if (selectedOption) {
            setSearch(selectedOption.label);
          } else if (typeof selected === 'string') {
            setSearch(selected);
          }
        } else {
          setSearch("");
        }
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selected, options]);

  const filteredOptions = options.filter((opt) => {
    if (!search) return true;
    
    // Manejo para diferentes tipos de opciones
    if (typeof opt.value === 'object' && opt.value?.rut) {
      const rut = (opt.value.rut || "").toLowerCase();
      const nombre = (opt.value.nombre || "").toLowerCase();
      const cargo = (opt.value.cargo || "").toLowerCase();
      const term = search.toLowerCase();
      return rut.includes(term) || nombre.includes(term) || cargo.includes(term);
    } else {
      return opt.label.toLowerCase().includes(search.toLowerCase());
    }
  });

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleInputChange = (e) => {
    if (!disabled) {
      const newValue = e.target.value;
      setSearch(newValue);
      setUserTyping(true);
      setIsOpen(true);
      
      // Si el usuario borra completamente el campo, quitar la selección
      if (newValue === "") {
        onSelect(null);
        setUserTyping(false);
      }
    }
  };

  const handleOptionSelect = (opt) => {
    if (!disabled) {
      onSelect(opt.label); // Enviamos el label en lugar del value
      setSearch(opt.label);
      setIsOpen(false);
      setUserTyping(false);
      
      // Quitar el foco del input para mejorar UX
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`w-full border ${disabled ? 'bg-gray-100' : 'bg-white'} ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${
            isOpen ? 'border-orange-400 ring-1 ring-orange-300' : 'border-gray-300'
          } rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400`}
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onClick={handleInputClick}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className={`h-5 w-5 ${isOpen ? 'text-orange-500' : 'text-gray-400'} ${disabled ? 'opacity-50' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d={isOpen 
                ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" 
                : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              } 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>
      
      {isOpen && !disabled && (
        <ul 
          className="absolute z-10 bg-white border border-gray-300 mt-1 w-full overflow-auto rounded-md shadow-lg"
          style={{ maxHeight }} // 🔧 Usar la prop maxHeight aquí en lugar de max-h-60
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 transition-colors duration-150"
                onClick={() => handleOptionSelect(opt)}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500">No hay coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;