// src/components/molecules/PageControl.jsx
import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PageControl = ({ 
  currentPage, 
  totalPages, 
  onPageChange
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

  // 📱 VERSIÓN MÓVIL
  if (isMobile) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
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
                  ? 'bg-white/20 text-white/40 cursor-not-allowed'
                  : 'bg-white/30 text-white hover:bg-white/40 active:scale-95'
                }
              `}
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>

            {/* INDICADOR CENTRAL MÓVIL */}
            <div className="bg-white/30 rounded-lg px-4 py-1">
              <div className="text-center">
                <div className="text-sm font-bold text-white">
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
                  ? 'bg-white/20 text-white/40 cursor-not-allowed'
                  : 'bg-white/30 text-white hover:bg-white/40 active:scale-95'
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
                      ? 'w-4 bg-white'
                      : 'w-1 bg-white/50 hover:bg-white/70'
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
      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
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
                ? 'bg-white/20 text-white/40 cursor-not-allowed'
                : 'bg-white/30 text-white hover:bg-white/40 hover:scale-105 active:scale-95'
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
                  <div className="flex items-center justify-center w-9 h-9 text-white/60">
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
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
                        ? 'bg-white text-orange-500 shadow-md scale-110'
                        : 'bg-white/30 text-white hover:bg-white/40 hover:scale-105'
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
                ? 'bg-white/20 text-white/40 cursor-not-allowed'
                : 'bg-white/30 text-white hover:bg-white/40 hover:scale-105 active:scale-95'
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