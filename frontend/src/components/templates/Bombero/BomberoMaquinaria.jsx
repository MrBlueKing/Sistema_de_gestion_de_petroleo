import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import { FaArrowLeft, FaTools } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";
import bomberoService from "../../../context/bomberoService"; // CORREGIDO: usar services en lugar de context

const Maquinaria = ({ onNext, onPrevious, categoriaSeleccionada, userFaena }) => {
  const [currentPage, setCurrentPage] = useState(2);
  const [searchTerm, setSearchTerm] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalPages = 4;

  // Cargar categorías de máquinas desde la API con cache optimizado
  const loadCategorias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriasData = await bomberoService.getCategoriasMaquinaria();
      
      if (Array.isArray(categoriasData) && categoriasData.length > 0) {
        // Transformamos los datos para que coincidan con la estructura esperada
        const categoriasFormateadas = categoriasData.map(categoria => ({
          id: categoria.id_categoria,
          nombre: categoria.nombre_categoria,
          descripcion: `Medición: ${categoria.tipo_medicion}`,
          tipo_medicion: categoria.tipo_medicion,
          horas_mantencion: categoria.horas_mantencion
        }));
        
        setCategorias(categoriasFormateadas);
      } else {
        setError("No se encontraron categorías disponibles");
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  // Filtrar categorías por término de búsqueda
  const filteredCategorias = useMemo(() => {
    if (!searchTerm.trim()) return categorias;
    
    return categorias.filter((categoria) =>
      categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categorias, searchTerm]);

  // Manejar selección de categoría
  const handleCategoriaSelect = useCallback((categoria) => {
    setSeleccion(categoria.nombre);
    onNext(categoria);
  }, [onNext]);

  // Función para limpiar la búsqueda
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Manejar cambio en el término de búsqueda
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>
          
          {/* Título con ícono descriptivo */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              <FaTools className="mr-2 text-orange-500" /> 
              Seleccione Tipo de Máquina
            </h2>
          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[400px] md:min-h-[450px] flex flex-col">
            <TabProgressBar activeTab="maquinaria" />
            
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={handleSearchChange}
              placeholder="Buscar categoría de máquina"
              onClear={handleClearSearch}
            />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando categorías...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                      onClick={loadCategorias}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : filteredCategorias.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-gray-500 mb-2">
                      {categorias.length === 0 
                        ? 'No hay categorías disponibles' 
                        : 'No se encontraron resultados'
                      }
                    </p>
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <List
                  items={filteredCategorias}
                  onItemSelect={handleCategoriaSelect}
                  buttonStyle={true} 
                  tipoElemento="maquinaria"
                  maxHeight="350px"
                />
              )}
            </div>

            {/* Información de resultados */}
            {!loading && !error && filteredCategorias.length > 0 && (
              <div className="text-center text-white text-xs">
                Mostrando {filteredCategorias.length} de {categorias.length} categorías
                {searchTerm && ` para "${searchTerm}"`}
              </div>
            )}
          </div>
          
          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
              textColor="orange-500"
            />
            
            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            
            {/* Espacio para alinear el diseño */}
            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="inline-block">
                Seleccione una categoría de máquina para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(Maquinaria);