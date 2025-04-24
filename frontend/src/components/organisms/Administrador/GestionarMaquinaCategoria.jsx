import React, { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";

const GestionarMaquinaCategoria = () => {
  // Estados para los campos del formulario
  const [selectedCategoriaId, setSelectedCategoriaId] = useState("");
  const [selectedCategoriaLabel, setSelectedCategoriaLabel] = useState("");
  const [nombreMaquina, setNombreMaquina] = useState("");
  const [patente, setPatente] = useState(""); // Cambiamos de rut a patente
  const [selectedFaenaId, setSelectedFaenaId] = useState("");
  const [selectedFaenaLabel, setSelectedFaenaLabel] = useState("");
  const [maquinarias, setMaquinarias] = useState([]);

  // Estados para los datos cargados
  const [categorias, setCategorias] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [maquinasOptions, setMaquinasOptions] = useState([]);

  // Estados para carga y errores
  const [loading, setLoading] = useState({
    categorias: false,
    faenas: false,
    maquinasOptions: false,
    submit: false
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Obtener maquinarias de la base de datos bodega
  useEffect(() => {
    const fetchMaquinarias = async () => {
      try {
        const response = await axios.get("/api/maquinarias");
        
        if (response.data && response.data.success) {
          // Guardar los datos completos de las maquinarias
          setMaquinarias(response.data.data);

          // Crear opciones para el dropdown de máquinas
          const options = response.data.data.map(maquina => ({
            label: maquina.Nombre,
            value: maquina.Nombre,
            patente: maquina.Rut // Guardamos el Rut como patente
          }));
          setMaquinasOptions(options);
        }
      } catch (error) {
        console.error("Error al cargar maquinarias:", error);
      }
    };

    fetchMaquinarias();
  }, []);

  // Cargar categorías al iniciar
  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(prev => ({ ...prev, categorias: true }));
      try {
        const response = await axios.get("/api/categorias");
        if (response.data.success) {
          const categoriasOptions = response.data.data.map(cat => ({
            label: cat.nombre_categoria,
            value: cat.id_categoria,
          }));
          setCategorias(categoriasOptions);
        } else {
          setError("Error al cargar categorías");
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        setError("Error al cargar categorías. Intente nuevamente.");
      } finally {
        setLoading(prev => ({ ...prev, categorias: false }));
      }
    };

    fetchCategorias();
  }, []);

  // Cargar faenas al iniciar
  useEffect(() => {
    const fetchFaenas = async () => {
      setLoading(prev => ({ ...prev, faenas: true }));
      try {
        const response = await axios.get("/api/faenas");
        if (response.data.success) {
          const faenasOptions = response.data.data.map(faena => ({
            label: faena.ubicacion,
            value: faena.id_faena,
          }));
          setFaenas(faenasOptions);
        } else {
          setError("Error al cargar faenas");
        }
      } catch (error) {
        console.error("Error al cargar faenas:", error);
        setError("Error al cargar faenas. Intente nuevamente.");
      } finally {
        setLoading(prev => ({ ...prev, faenas: false }));
      }
    };

    fetchFaenas();
  }, []);

  // Manejar selección de categoría
  const handleCategoriaSelect = (selectedValue) => {
    // Buscar la categoría por su label
    const categoria = categorias.find(cat => cat.label === selectedValue);
    if (categoria) {
      setSelectedCategoriaId(categoria.value);
      setSelectedCategoriaLabel(categoria.label);
    } else {
      setSelectedCategoriaId("");
      setSelectedCategoriaLabel("");
    }
    setError("");
    setSuccessMessage("");
  };

  // Manejar selección de máquina
  const handleMaquinaSelect = (selectedValue) => {
    // Encontramos la máquina seleccionada de las opciones
    const maquinaSeleccionada = maquinasOptions.find(maquina => maquina.label === selectedValue);

    if (maquinaSeleccionada) {
      setNombreMaquina(maquinaSeleccionada.label);  // Guardamos el nombre
      setPatente(maquinaSeleccionada.patente || ""); // Guardamos el rut como patente
      console.log("Nombre:", maquinaSeleccionada.label, "Patente:", maquinaSeleccionada.patente);
    } else {
      setNombreMaquina(selectedValue || "");
      setPatente("");
    }

    setError("");
    setSuccessMessage("");
  };

  // Manejar selección de faena
  const handleFaenaSelect = (selectedValue) => {
    // Buscar la faena por su label
    const faena = faenas.find(f => f.label === selectedValue);
    if (faena) {
      setSelectedFaenaId(faena.value);
      setSelectedFaenaLabel(faena.label);
    } else {
      setSelectedFaenaId("");
      setSelectedFaenaLabel("");
    }
    setError("");
    setSuccessMessage("");
  };

  // Validar formulario
  const validateForm = () => {
    if (!selectedCategoriaId) {
      setError("Por favor selecciona una categoría.");
      return false;
    }
    if (!nombreMaquina.trim()) {
      setError("Por favor ingresa un nombre de máquina.");
      return false;
    }
    if (!patente.trim()) {
      setError("Por favor selecciona una máquina con patente válida.");
      return false;
    }
    if (!selectedFaenaId) {
      setError("Por favor selecciona una faena.");
      return false;
    }
    return true;
  };

  // Guardar la máquina
  const handleGuardar = async () => {
    if (!validateForm()) {
      return;
    }
  
    setLoading(prev => ({ ...prev, submit: true }));
  
    try {
      // Preparar los datos para la API de máquinas-internas
      const data = {
        patente: patente.trim(),
        categoria: selectedCategoriaId,
        nombre_maquina: nombreMaquina.trim(),
        tipo_maquina: "Interno"
      };
  
      console.log("Datos a enviar:", data);
  
      // Llamada a la API de máquinas internas
      const response = await axios.post("/api/maquinas-internas", data);
  
      if (response.data && response.data.success) {
        setSuccessMessage("Máquina interna registrada correctamente");
        resetForm();
      } else {
        setError(response.data?.message || "Error al registrar la máquina");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Ocurrió un error al guardar. Intente nuevamente.");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };
  
  // Resetear el formulario
  const resetForm = () => {
    setSelectedCategoriaId("");
    setSelectedCategoriaLabel("");
    setNombreMaquina("");
    setPatente("");
    setSelectedFaenaId("");
    setSelectedFaenaLabel("");
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto w-full">
          <div className="bg-orange-400 px-6 py-4">
            <h2 className="text-white text-2xl font-bold">Categorización de Equipos</h2>
            <p className="text-orange-50 text-sm">Registro y administración de maquinaria interna</p>
          </div>

          <div className="p-8 z-10">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-700 font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría de Máquina <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={categorias}
                  selected={selectedCategoriaLabel}
                  onSelect={handleCategoriaSelect}
                  placeholder={loading.categorias ? "Cargando categorías..." : "Selecciona categoría de máquina"}
                  disabled={loading.categorias}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Máquina <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={maquinasOptions}
                  selected={nombreMaquina}
                  onSelect={handleMaquinaSelect}
                  placeholder={loading.maquinasOptions ? "Cargando Nombres de Máquina..." : "Selecciona nombre de máquina"}
                  disabled={loading.maquinasOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patente
                </label>
                <input
                  type="text"
                  value={patente}
                  readOnly
                  className="mt-1 block w-full bg-gray-100 shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-orange-400 focus:border-orange-400 cursor-not-allowed"
                  placeholder="Se cargará automáticamente al seleccionar la máquina"
                />
                <p className="mt-1 text-xs text-gray-500">
                  La patente se obtiene automáticamente al seleccionar una máquina
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faena <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={faenas}
                  selected={selectedFaenaLabel}
                  onSelect={handleFaenaSelect}
                  placeholder={loading.faenas ? "Cargando faenas..." : "Selecciona faena"}
                  disabled={loading.faenas}
                />
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-3">
              <button
                onClick={resetForm}
                disabled={loading.submit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button
                text={loading.submit ? "Procesando..." : "Registrar Máquina"}
                color="orange"
                onClick={handleGuardar}
                disabled={loading.submit}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
            Sistema de Gestión de Combustible • {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GestionarMaquinaCategoria;