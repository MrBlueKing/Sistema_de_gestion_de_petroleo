import React, { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";

const GestionarMaquinaCategoria = () => {
  // Estados para los campos del formulario
  const [selectedCategoriaId, setSelectedCategoriaId] = useState("");
  const [selectedCategoriaLabel, setSelectedCategoriaLabel] = useState("");
  const [nombreMaquina, setNombreMaquina] = useState("");
  const [patente, setPatente] = useState("");
  const [selectedFaenaId, setSelectedFaenaId] = useState("");
  const [selectedFaenaLabel, setSelectedFaenaLabel] = useState("");
  
  // Estados para los datos cargados
  const [categorias, setCategorias] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [maquinasOptions, setMaquinasOptions] = useState([]);
  
  // Estados para las fuentes de datos originales
  const [maquinasInternas, setMaquinasInternas] = useState([]);
  const [maquinasBodega, setMaquinasBodega] = useState([]);

  // Estados para carga y mensajes
  const [loading, setLoading] = useState({
    categorias: false,
    faenas: false,
    maquinasOptions: false,
    maquinasInternas: false,
    maquinasBodega: false,
    submit: false
  });
  const [status, setStatus] = useState({
    type: "", // "error" o "success"
    message: "",
    visible: false
  });

  // Timer para los mensajes
  const [messageTimeout, setMessageTimeout] = useState(null);

  // Función para mostrar mensajes temporales
  const showMessage = (type, message, duration = 5000) => {
    // Limpiar cualquier timer existente
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    // Mostrar el nuevo mensaje
    setStatus({
      type,
      message,
      visible: true
    });
    
    // Configurar timer para ocultar el mensaje
    const timer = setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, duration);
    
    setMessageTimeout(timer);
  };

  // Función principal para filtrar y actualizar las opciones disponibles
  const actualizarMaquinasDisponibles = () => {
    if (maquinasBodega.length === 0 || !Array.isArray(maquinasInternas)) {
      return; // Si no tenemos datos, no hacemos nada
    }

    // Extraemos las patentes de las máquinas ya registradas
    const patentesRegistradas = maquinasInternas.map(maquina => maquina.patente);
    
    // Filtramos las máquinas de bodega, excluyendo las que tienen patentes ya registradas
    const maquinasNoRegistradas = maquinasBodega.filter(
      maquina => !patentesRegistradas.includes(maquina.Rut)
    );
    
    // Convertimos a formato para el dropdown
    const options = maquinasNoRegistradas.map(maquina => ({
      label: maquina.Nombre,
      value: maquina.Nombre,
      patente: maquina.Rut
    }));
    
    setMaquinasOptions(options);

    console.log('Máquinas disponibles actualizadas:', options.length);
  };

  // 1. Cargar máquinas internas (ya registradas)
  useEffect(() => {
    const fetchMaquinasInternas = async () => {
      try {
        setLoading(prev => ({ ...prev, maquinasInternas: true }));
        const response = await axios.get("/api/maquinas-internas-registradas");
        console.log("Datoaaaaaaaaaaaaaas:", response.data);
        
        if (response.data && response.data.success) {
          console.log('Máquinas internas cargadas:', response.data.data.length);
          setMaquinasInternas(response.data.data);
        } else {
          showMessage("error", "Error al cargar maquinarias registradas");
        }
      } catch (error) {
        console.error("Error al cargar maquinarias registradas:", error);
        showMessage("error", "Error al cargar maquinarias registradas. Intente nuevamente.");
      } finally {
        setLoading(prev => ({ ...prev, maquinasInternas: false }));
      }
    };

    fetchMaquinasInternas();
  }, []);

  // 2. Cargar máquinas de bodega
  useEffect(() => {
    const fetchMaquinasBodega = async () => {
      try {
        setLoading(prev => ({ ...prev, maquinasBodega: true }));
        const response = await axios.get("/api/maquinarias");
        
        if (response.data && response.data.success) {
          console.log('Máquinas bodega cargadas:', response.data.data.length);
          setMaquinasBodega(response.data.data);
        } else {
          showMessage("error", "Error al cargar maquinarias de bodega");
        }
      } catch (error) {
        console.error("Error al cargar maquinarias de bodega:", error);
        showMessage("error", "Error al cargar maquinarias de bodega. Intente nuevamente.");
      } finally {
        setLoading(prev => ({ ...prev, maquinasBodega: false }));
      }
    };

    fetchMaquinasBodega();
  }, []);

  // 3. Actualizar las opciones disponibles cuando cambien las fuentes de datos
  useEffect(() => {
    // Solo procesamos cuando ambas fuentes de datos están cargadas
    if (!loading.maquinasInternas && !loading.maquinasBodega) {
      setLoading(prev => ({ ...prev, maquinasOptions: true }));
      actualizarMaquinasDisponibles();
      setLoading(prev => ({ ...prev, maquinasOptions: false }));
    }
  }, [maquinasInternas, maquinasBodega]);

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
          showMessage("error", "Error al cargar categorías");
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        showMessage("error", "Error al cargar categorías. Intente nuevamente.");
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
          showMessage("error", "Error al cargar faenas");
        }
      } catch (error) {
        console.error("Error al cargar faenas:", error);
        showMessage("error", "Error al cargar faenas. Intente nuevamente.");
      } finally {
        setLoading(prev => ({ ...prev, faenas: false }));
      }
    };

    fetchFaenas();
    
    // Limpieza al desmontar
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, []);

  // Manejar selección de categoría
  const handleCategoriaSelect = (selectedValue) => {
    const categoria = categorias.find(cat => cat.label === selectedValue);
    if (categoria) {
      setSelectedCategoriaId(categoria.value);
      setSelectedCategoriaLabel(categoria.label);
    } else {
      setSelectedCategoriaId("");
      setSelectedCategoriaLabel("");
    }
    setStatus({ type: "", message: "", visible: false });
  };

  // Manejar selección de máquina
  const handleMaquinaSelect = (selectedValue) => {
    const maquinaSeleccionada = maquinasOptions.find(maquina => maquina.label === selectedValue);

    if (maquinaSeleccionada) {
      setNombreMaquina(maquinaSeleccionada.label);
      setPatente(maquinaSeleccionada.patente || "");
    } else {
      setNombreMaquina(selectedValue || "");
      setPatente("");
    }

    setStatus({ type: "", message: "", visible: false });
  };

  // Manejar selección de faena
  const handleFaenaSelect = (selectedValue) => {
    const faena = faenas.find(f => f.label === selectedValue);
    if (faena) {
      setSelectedFaenaId(faena.value);
      setSelectedFaenaLabel(faena.label);
    } else {
      setSelectedFaenaId("");
      setSelectedFaenaLabel("");
    }
    setStatus({ type: "", message: "", visible: false });
  };

  // Validar formulario
  const validateForm = () => {
    if (!selectedCategoriaId) {
      showMessage("error", "Por favor selecciona una categoría.");
      return false;
    }
    if (!nombreMaquina.trim()) {
      showMessage("error", "Por favor ingresa un nombre de máquina.");
      return false;
    }
    if (!patente.trim()) {
      showMessage("error", "Por favor selecciona una máquina con patente válida.");
      return false;
    }
    if (!selectedFaenaId) {
      showMessage("error", "Por favor selecciona una faena.");
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
        tipo_maquina: "Interno",
        id_faena: selectedFaenaId // Añadimos el id_faena para el permiso
      };
  
      // Llamada a la API de máquinas internas
      const response = await axios.post("/api/maquinas-internas", data);
  
      // Verificar la respuesta
      if (response.status === 201 && response.data?.maquina_interna) {
        showMessage("success", "Máquina interna registrada exitosamente");
        
        // Actualizar la lista de máquinas registradas para que se actualice el filtro
        const nuevaMaquina = {
          patente: patente.trim(),
          nombre_maquina: nombreMaquina.trim()
        };
        
        setMaquinasInternas(prev => [...prev, nuevaMaquina]);
        
        // Volver a filtrar las opciones disponibles
        actualizarMaquinasDisponibles();
        
        resetForm();
      } else {
        const errorMsg = response.data?.error || response.data?.message || "Error al registrar la máquina";
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      
      // Manejar errores
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        showMessage("error", Array.isArray(firstError) ? firstError[0] : "Error de validación");
      } 
      else if (error.response?.data?.error && error.response.data.error.includes("Duplicate entry") && 
               error.response.data.error.includes("maquinas_internas_patente_unique")) {
        showMessage("error", "La patente ingresada ya está registrada en el sistema. Por favor, utilice otra.");
        
        // Si hay un duplicado, actualizamos la lista de máquinas internas y volvemos a filtrar
        const fetchMaquinasInternas = async () => {
          try {
            const response = await axios.get("/api/maquinas-internas-registradas");
            if (response.data && response.data.success) {
              setMaquinasInternas(response.data.data);
              actualizarMaquinasDisponibles();
            }
          } catch (error) {
            console.error("Error al actualizar máquinas registradas:", error);
          }
        };
        
        fetchMaquinasInternas();
      } 
      else {
        let errorMsg = "Ocurrió un error al guardar. Intente nuevamente.";
        
        if (error.response?.data?.error) {
          if (error.response.data.error.includes("SQLSTATE")) {
            errorMsg = "Error en la base de datos. Por favor, contacte al administrador.";
          } else {
            errorMsg = error.response.data.error;
          }
        }
        
        showMessage("error", errorMsg);
      }
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
            {status.visible && status.type === "error" && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded transition-opacity duration-300">
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
                  <span className="text-red-700 font-medium">{status.message}</span>
                </div>
              </div>
            )}

            {status.visible && status.type === "success" && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded transition-opacity duration-300">
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
                  <span className="text-green-700 font-medium">{status.message}</span>
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
                  placeholder={
                    loading.maquinasOptions || loading.maquinasInternas || loading.maquinasBodega
                      ? "Cargando máquinas disponibles..."
                      : "Selecciona nombre de máquina"
                  }
                  disabled={loading.maquinasOptions || loading.maquinasInternas || loading.maquinasBodega}
                />
                {!loading.maquinasOptions && !loading.maquinasInternas && !loading.maquinasBodega && maquinasOptions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No hay máquinas disponibles para registrar. Todas las máquinas ya han sido registradas.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patente <span className="text-red-500">*</span>
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
                <p className="mt-1 text-xs text-gray-500">
                  La máquina será asignada a esta faena
                </p>
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
                disabled={loading.submit || maquinasOptions.length === 0}
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