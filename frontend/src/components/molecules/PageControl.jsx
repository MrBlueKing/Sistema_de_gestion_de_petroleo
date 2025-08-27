// src/components/molecules/PageControl.jsx
import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PageControl = ({
  currentPage,
  totalPages,
  onPageChange,
  colorScheme = 'default' // 'default', 'blue', 'dark', 'gray', 'green'
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🎨 ESQUEMAS DE COLOR
  const colorSchemes = {
    default: {
      // Esquema original con transparencias
      container: 'bg-white/20 backdrop-blur-sm border-white/30',
      buttonEnabled: 'bg-white/30 text-white hover:bg-white/40 hover:scale-105',
      buttonDisabled: 'bg-white/20 text-white/40 cursor-not-allowed',
      pageActive: 'bg-white text-orange-500 shadow-md scale-110',
      pageInactive: 'bg-white/30 text-white hover:bg-white/40 hover:scale-105',
      indicator: 'bg-white/30',
      indicatorText: 'text-white',
      dotActive: 'bg-white',
      dotInactive: 'bg-white/50 hover:bg-white/70'
    },
    blue: {
      // Esquema azul para fondos claros
      container: 'bg-blue-50 border border-blue-200',
      buttonEnabled: 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105',
      buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
      pageActive: 'bg-blue-600 text-white shadow-md scale-110',
      pageInactive: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:scale-105',
      indicator: 'bg-blue-100',
      indicatorText: 'text-blue-800',
      dotActive: 'bg-blue-600',
      dotInactive: 'bg-blue-300 hover:bg-blue-400'
    },
    dark: {
      // Esquema oscuro
      container: 'bg-gray-800 border border-gray-600',
      buttonEnabled: 'bg-gray-700 text-white hover:bg-gray-600 hover:scale-105',
      buttonDisabled: 'bg-gray-900 text-gray-500 cursor-not-allowed',
      pageActive: 'bg-blue-600 text-white shadow-md scale-110',
      pageInactive: 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:scale-105',
      indicator: 'bg-gray-700',
      indicatorText: 'text-white',
      dotActive: 'bg-blue-500',
      dotInactive: 'bg-gray-600 hover:bg-gray-500'
    },
    gray: {
      // Esquema gris neutro para fondos claros
      container: 'bg-gray-100 border border-gray-300',
      buttonEnabled: 'bg-gray-600 text-white hover:bg-gray-700 hover:scale-105',
      buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
      pageActive: 'bg-gray-600 text-white shadow-md scale-110',
      pageInactive: 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:scale-105',
      indicator: 'bg-white',
      indicatorText: 'text-gray-800',
      dotActive: 'bg-gray-600',
      dotInactive: 'bg-gray-400 hover:bg-gray-500'
    },
    green: {
      // Esquema verde
      container: 'bg-green-50 border border-green-200',
      buttonEnabled: 'bg-green-600 text-white hover:bg-green-700 hover:scale-105',
      buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
      pageActive: 'bg-green-600 text-white shadow-md scale-110',
      pageInactive: 'bg-white text-green-600 border border-green-200 hover:bg-green-50 hover:scale-105',
      indicator: 'bg-green-100',
      indicatorText: 'text-green-800',
      dotActive: 'bg-green-600',
      dotInactive: 'bg-green-300 hover:bg-green-400'
    },
    orange: {
      // 🔸 Esquema naranja
      container: 'bg-orange-50 border border-orange-200',
      buttonEnabled: 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105',
      buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
      pageActive: 'bg-orange-600 text-white shadow-md scale-110',
      pageInactive: 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 hover:scale-105',
      indicator: 'bg-orange-100',
      indicatorText: 'text-orange-800',
      dotActive: 'bg-orange-600',
      dotInactive: 'bg-orange-300 hover:bg-orange-400'
    }
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.default;

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // 🎯 GENERAR PÁGINAS VISIBLES
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (currentPage <= 2) {
      pages.push(1, 2, 3, '...', totalPages);
    } else if (currentPage >= totalPages - 1) {
      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage, '...', totalPages);
    }

    return pages;
  };

  // Si no hay páginas para mostrar
  if (totalPages <= 1) {
    return null;
  }

  // 📱 VERSIÓN MÓVIL
  if (isMobile) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className={`${colors.container} rounded-xl px-3 py-2`}>
          <div className="flex items-center space-x-3">
            {/* BOTÓN ANTERIOR MÓVIL */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`
                flex items-center justify-center
                w-10 h-8 rounded-lg
                transition-all duration-300 ease-out
                ${currentPage === 1
                  ? colors.buttonDisabled
                  : colors.buttonEnabled
                }
              `}
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>

            {/* INDICADOR CENTRAL MÓVIL */}
            <div className={`${colors.indicator} rounded-lg px-4 py-1`}>
              <div className="text-center">
                <div className={`text-sm font-bold ${colors.indicatorText}`}>
                  {currentPage} / {totalPages}
                </div>
              </div>
            </div>

            {/* BOTÓN SIGUIENTE MÓVIL */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`
                flex items-center justify-center
                w-10 h-8 rounded-lg
                transition-all duration-300 ease-out
                ${currentPage === totalPages
                  ? colors.buttonDisabled
                  : colors.buttonEnabled
                }
              `}
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* PUNTOS INDICADORES PARA POCAS PÁGINAS */}
          {totalPages <= 6 && totalPages > 1 && (
            <div className="flex items-center justify-center space-x-1 mt-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`
                    h-1 rounded-full transition-all duration-300 ease-out
                    ${page === currentPage
                      ? `w-4 ${colors.dotActive}`
                      : `w-1 ${colors.dotInactive}`
                    }
                  `}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 🖥️ VERSIÓN DESKTOP
  return (
    <div className="flex justify-center items-center w-full">
      <div className={`${colors.container} rounded-xl px-4 py-2`}>
        <div className="flex items-center space-x-2">
          {/* BOTÓN ANTERIOR DESKTOP */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`
              flex items-center justify-center
              w-9 h-9 rounded-lg
              transition-all duration-300 ease-out
              ${currentPage === 1
                ? colors.buttonDisabled
                : colors.buttonEnabled
              }
            `}
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          {/* NÚMEROS DE PÁGINA DESKTOP */}
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <div className="flex items-center justify-center w-9 h-9 text-gray-500">
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                      <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                      <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => goToPage(page)}
                    className={`
                      flex items-center justify-center
                      w-9 h-9 rounded-lg text-sm font-semibold
                      transition-all duration-300 ease-out
                      ${page === currentPage
                        ? colors.pageActive
                        : colors.pageInactive
                      }
                    `}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* BOTÓN SIGUIENTE DESKTOP */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`
              flex items-center justify-center
              w-9 h-9 rounded-lg
              transition-all duration-300 ease-out
              ${currentPage === totalPages
                ? colors.buttonDisabled
                : colors.buttonEnabled
              }
            `}
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageControl;