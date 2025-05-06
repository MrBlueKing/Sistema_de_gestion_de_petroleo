import React, { useState, useEffect, useCallback, useContext } from "react";
import Header from "../../organisms/Bombero/Header";
import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import SearchBar from "../../molecules/SearchBar";
import List from "../../molecules/OptionsFormBombero"; // Cambiado a OptionsFormBombero para mantener coherencia
import Button from "../../atoms/Button/Button";
import PageControl from "../../molecules/PageControl";
import { FaArrowLeft } from "react-icons/fa";
import axios from "../../../lib/axios"; // Asegúrate de tener axios disponible
import { UserContext } from "../../../context/userContext";


const Patente = ({ categoriaSeleccionada, onNext, onPrevious }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(3);
  const [seleccion, setSeleccion] = useState(null);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalPages = 4;
  const { user } = useContext(UserContext);

  // Cargar maquinas desde la API
  useEffect(() => {
    let isMounted = true;

    const cargarMaquinas = async () => {
      try {
        setLoading(true);

        // Supón que tienes el id_faena disponible
        const idFaena = user?.id_faena; // o desde contexto, auth, etc.

        const response = await axios.get("/api/maquinas-internas-permiso", {
          params: { id_faena: idFaena }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          let maquinasFiltradas = response.data.data;

          if (categoriaSeleccionada) {
            if (!isNaN(categoriaSeleccionada)) {
              maquinasFiltradas = maquinasFiltradas.filter(
                m => m.categoria === categoriaSeleccionada.toString()
              );
            } else if (typeof categoriaSeleccionada === 'object' && categoriaSeleccionada.id) {
              maquinasFiltradas = maquinasFiltradas.filter(
                m => m.categoria === categoriaSeleccionada.id.toString()
              );
            }
          }

          if (isMounted) {
            setMaquinas(maquinasFiltradas);
            setError(null);
          }
        } else {
          if (isMounted) {
            setError("Formato de respuesta no esperado");
          }
        }
      } catch (err) {
        console.error("Error al cargar máquinas:", err);
        if (isMounted) {
          setError("Error al conectar con el servidor");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };


    cargarMaquinas();

    return () => {
      isMounted = false;
    };
  }, [categoriaSeleccionada]);

  // Filtrar maquinas por término de búsqueda
  const maquinasFiltradas = useCallback(() => {
    if (!searchTerm.trim()) return maquinas;

    return maquinas.filter(maquina =>
      maquina.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [maquinas, searchTerm]);

  // Formatear las máquinas para el componente List
  const formatearMaquinas = useCallback(() => {
    return maquinasFiltradas().map(maquina => ({
      id: maquina.id_maquina_interna,
      nombre: maquina.patente,
      descripcion: maquina.nombre,
      original: maquina
    }));
  }, [maquinasFiltradas]);

  const handleSelectPatente = (maquina) => {
    setSeleccion(maquina.nombre);
    onNext(maquina.original || maquina); // Pasar la máquina completa al siguiente paso
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const formattedItems = formatearMaquinas();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">
            Selecciona una Máquina
            {categoriaSeleccionada && typeof categoriaSeleccionada === 'object' && categoriaSeleccionada.nombre && (
              <span className="ml-1 text-blue-600">({categoriaSeleccionada.nombre})</span>
            )}
          </h2>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="patente" />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar por patente o nombre"
              onClear={handleClearSearch}
            />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
              {loading ? (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Cargando máquinas...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-4 text-red-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : formattedItems.length > 0 ? (
                <List
                  items={formattedItems}
                  onItemSelect={handleSelectPatente}
                  buttonStyle={true}
                  tipoElemento="maquinaria"
                />
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No se encontraron máquinas</p>
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="mt-2 text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                Seleccione una máquina para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Patente;