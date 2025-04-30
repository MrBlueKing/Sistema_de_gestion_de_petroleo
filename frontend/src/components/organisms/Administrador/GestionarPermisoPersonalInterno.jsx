import React, { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";

const AsignarPermisoSolicitante = () => {
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState(null);
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [solicitantes, setSolicitantes] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [faenasDisponibles, setFaenasDisponibles] = useState([]);
  const [loading, setLoading] = useState({
    fetchData: false,
    submitForm: false,
    faenasPermisos: false
  });
  const [camposEditables, setCamposEditables] = useState(true);

  const fetchSolicitantes = async () => {
    setLoading(prev => ({ ...prev, fetchData: true }));
    try {
      // Obtener los solicitantes ya registrados usando la nueva API
      const response = await axios.get("/api/personal-internos");
      if (!response.data) {
        throw new Error("Error al obtener personal interno");
      }
      
      // Extraer el array correcto de la respuesta
      const solicitantesRegistrados = response.data?.personal_interno || [];

      // Formatear las opciones para el dropdown
      const opcionesFormateadas = solicitantesRegistrados.map((item) => {
        // Verificar estructura de datos y crear nombre completo combinando nombre y apellido
        const personalData = item.personal_interno || item;
        const nombreCompleto = personalData.nombre_completo || 
                             `${personalData.nombre || ''} ${personalData.apellido || ''}`.trim();
        
        return {
          label: `${personalData.rut} - ${nombreCompleto}`,
          value: {
            id: personalData.id_personal_interno,
            rut: personalData.rut,
            nombre: nombreCompleto,
            apellido: personalData.apellido || '',
            cargo: personalData.cargo || "No especificado",
          },
        };
      });
      
      setSolicitantes(opcionesFormateadas);
    } catch (err) {
      setError(`No se pudo cargar el personal: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(prev => ({ ...prev, fetchData: false }));
    }
  };

  const fetchFaenas = async () => {
    setLoading(prev => ({ ...prev, fetchData: true }));
    try {
      // Obtener las faenas desde la API
      const response = await axios.get("/api/faenas");
      if (!response.data) {
        throw new Error("Error al obtener faenas");
      }

      // Extraer las faenas de la respuesta
      const faenasData = response.data?.faenas || [];

      // Formatear las opciones para el dropdown
      const opcionesFormateadas = faenasData.map((faena) => ({
        label: faena.ubicacion || `Faena ${faena.id_faena}`,
        value: faena.id_faena
      }));

      setFaenas(opcionesFormateadas);
      // También establecer como faenas disponibles inicialmente
      setFaenasDisponibles(opcionesFormateadas);
    } catch (err) {
      console.error("Error al cargar faenas:", err);
      setError(`Error al cargar faenas: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(prev => ({ ...prev, fetchData: false }));
    }
  };
  
  // Función para obtener las faenas disponibles para un solicitante
  const fetchFaenasDisponibles = async (idSolicitante) => {
    if (!idSolicitante) return;
    
    setLoading(prev => ({ ...prev, faenasPermisos: true }));
    setFaenaSeleccionada(""); // Limpiar faena seleccionada al cambiar de solicitante
    setError(""); // Limpiar mensajes de error previos
    
    try {
      // Usar el nuevo endpoint para obtener faenas disponibles
      const response = await axios.get("/api/faenasDisponibles", {
        params: { id_dotacion: idSolicitante }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Error al obtener faenas disponibles");
      }
      
      // Formatear las faenas disponibles para el dropdown
      const faenasDisponibles = response.data.faenas_disponibles.map(faena => ({
        label: faena.ubicacion || `Faena ${faena.id_faena}`,
        value: faena.id_faena
      }));
      
      setFaenasDisponibles(faenasDisponibles);
      
      if (faenasDisponibles.length === 0) {
        setError("Este solicitante ya tiene permisos asignados en todas las faenas disponibles.");
      }
    } catch (err) {
      console.error("Error al obtener faenas disponibles:", err);
      
      // Si falla el endpoint, intentamos con método alternativo
      try {
        // Obtener los permisos existentes del solicitante
        const permisosResponse = await axios.get("/api/permisosFaenas", {
          params: { id_dotacion: idSolicitante }
        });
        
        // Extraer los IDs de faenas donde el solicitante ya tiene permiso
        const permisosExistentes = permisosResponse.data?.permisos || [];
        const faenasConPermiso = permisosExistentes.map(permiso => permiso.id_faena);
        
        // Filtrar las faenas disponibles
        const faenasFiltradas = faenas.filter(faena => 
          !faenasConPermiso.includes(faena.value)
        );
        
        setFaenasDisponibles(faenasFiltradas);
        
        if (faenasFiltradas.length === 0) {
          setError("Este solicitante ya tiene permisos asignados en todas las faenas disponibles.");
        }
      } catch (error) {
        // Si ambos métodos fallan, usamos el verificador individual como último recurso
        verificarFaenasManualmente(idSolicitante);
      }
    } finally {
      setLoading(prev => ({ ...prev, faenasPermisos: false }));
    }
  };

  // Método alternativo para verificar manualmente cada faena
  const verificarFaenasManualmente = async (idSolicitante) => {
    try {
      const checkResults = await Promise.allSettled(
        faenas.map(async (faena) => {
          try {
            // Usamos el endpoint verificarPermiso para cada faena
            const response = await axios.get("/api/verificarPermiso", {
              params: { id_dotacion: idSolicitante, id_faena: faena.value }
            });
            
            // Si existe el permiso, la faena no está disponible
            return response.data?.existe ? null : faena;
          } catch (error) {
            // Si hay error, asumimos que la faena está disponible
            return faena;
          }
        })
      );
      
      // Filtrar faenas disponibles (no nulas)
      const faenasFiltradasResult = checkResults
        .filter(result => result.status === "fulfilled" && result.value !== null)
        .map(result => result.value);
      
      setFaenasDisponibles(faenasFiltradasResult);
      
      if (faenasFiltradasResult.length === 0) {
        setError("Este solicitante ya tiene permisos asignados en todas las faenas disponibles.");
      }
    } catch (e) {
      console.error("Error en verificación manual de faenas:", e);
      // Si todo falla, mostramos todas las faenas como disponibles
      setFaenasDisponibles(faenas);
    }
  };

  useEffect(() => {
    fetchSolicitantes();
    fetchFaenas();
  }, []);

  const handleSolicitanteSelect = (selectedLabel) => {
    // Manejar explícitamente el caso cuando value es null (borrado completo)
    if (selectedLabel === null || selectedLabel === "") {
      setSolicitanteSeleccionado(null);
      setError("");
      // Restaurar todas las faenas al no tener solicitante seleccionado
      setFaenasDisponibles(faenas);
      return;
    }

    // Buscar el objeto solicitante basado en el label seleccionado
    const opcionSeleccionada = solicitantes.find(opt => 
      opt.label.includes(selectedLabel) || selectedLabel.includes(opt.label)
    );

    if (!opcionSeleccionada) {
      // Intenta buscar por partes del texto (RUT o nombre)
      const partesSeleccionadas = selectedLabel.split('-').map(part => part.trim());
      const encontradoPorPartes = solicitantes.find(opt => {
        const partes = opt.label.split('-').map(part => part.trim());
        return partes.some(parte => partesSeleccionadas.includes(parte));
      });
      
      if (encontradoPorPartes) {
        const solicitante = encontradoPorPartes.value;
        setSolicitanteSeleccionado(solicitante);
        setError("");
        // Actualizar faenas disponibles para este solicitante
        fetchFaenasDisponibles(solicitante.id);
        return;
      }
      
      setError("Solicitante no encontrado en la lista.");
      return;
    }

    const solicitante = opcionSeleccionada.value;
    setSolicitanteSeleccionado(solicitante);
    setError("");
    // Actualizar faenas disponibles para este solicitante
    fetchFaenasDisponibles(solicitante.id);
  };

  const validarFormulario = () => {
    if (!solicitanteSeleccionado) {
      setError("Debe seleccionar un solicitante válido.");
      return false;
    }

    if (!solicitanteSeleccionado.id) {
      setError("No se pudo identificar al solicitante seleccionado.");
      return false;
    }

    if (!faenaSeleccionada) {
      setError("Debe seleccionar una faena.");
      return false;
    }

    return true;
  };

  const handleAsignarPermiso = async () => {
    // Limpiar mensajes previos
    setError("");
    setSuccess("");

    if (!validarFormulario()) {
      return;
    }

    setLoading(prev => ({ ...prev, submitForm: true }));
    
    try {
      // Llamar a la API para asignar permiso
      const response = await axios.post("/api/asignarPermisoSolicitante", {
        id_dotacion: solicitanteSeleccionado.id,
        id_faena: faenaSeleccionada,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Error al asignar permiso al solicitante");
      }

      setSuccess("¡Permiso asignado correctamente al solicitante!");
      setCamposEditables(false); // Bloquear campos después de guardar
      
      // Actualizar la lista de faenas disponibles
      if (solicitanteSeleccionado) {
        fetchFaenasDisponibles(solicitanteSeleccionado.id);
      }
      
    } catch (err) {
      // Manejar error de permiso ya asignado (status 409)
      if (err.response && err.response.status === 409) {
        setError("Este solicitante ya tiene un permiso asignado para esta faena.");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "No se pudo asignar el permiso al solicitante. Intenta nuevamente."
        );
      }
    } finally {
      setLoading(prev => ({ ...prev, submitForm: false }));
    }
  };

  const handleReset = () => {
    setSolicitanteSeleccionado(null);
    setFaenaSeleccionada("");
    setError("");
    setSuccess("");
    setCamposEditables(true);
    // Restaurar todas las faenas al estado inicial
    setFaenasDisponibles(faenas);
  };

  // Determinar el valor a mostrar en el dropdown de solicitantes
  const getSelectedSolicitanteLabel = () => {
    if (!solicitanteSeleccionado) return "";

    // Buscar el label completo basado en el objeto seleccionado
    const foundOption = solicitantes.find(
      s => s.value.id === solicitanteSeleccionado.id
    );

    // Si se encuentra la opción, devolver su label, de lo contrario crear uno basado en los datos disponibles
    return foundOption ? 
      foundOption.label : 
      `${solicitanteSeleccionado.rut} - ${solicitanteSeleccionado.nombre}`;
  };

  // Verificar si el botón debe estar deshabilitado
  const isSubmitDisabled = () => {
    return (
      loading.submitForm ||
      loading.fetchData ||
      loading.faenasPermisos ||
      !solicitanteSeleccionado ||
      !faenaSeleccionada ||
      faenasDisponibles.length === 0
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto w-full">
          <div className="bg-orange-400 px-6 py-4">
            <h2 className="text-white text-2xl font-bold">
              Asignar Permisos a Solicitantes
            </h2>
            <p className="text-orange-50 text-sm">
              Asignación de permisos de faenas a solicitantes existentes
            </p>
          </div>

          <div className="p-6">
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

            {success && (
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
                  <span className="text-green-700 font-medium">{success}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Solicitante <span className="text-red-500">*</span>
                </label>
                <div
                  className={
                    camposEditables ? "" : "opacity-75 pointer-events-none"
                  }
                >
                  <SearchableDropdown
                    options={solicitantes}
                    selected={getSelectedSolicitanteLabel()}
                    onSelect={handleSolicitanteSelect}
                    placeholder={loading.fetchData ? "Cargando solicitantes..." : "Seleccione un solicitante registrado"}
                    disabled={!camposEditables || loading.fetchData}
                    displayValue={(item) => item} // Asegura que se muestre el texto completo
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Seleccione un solicitante de la lista para asignarle permisos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Faena <span className="text-red-500">*</span>
                </label>
                <div
                  className={
                    camposEditables ? "" : "opacity-75 pointer-events-none"
                  }
                >
                  <SearchableDropdown
                    options={faenasDisponibles}
                    selected={faenaSeleccionada ? faenasDisponibles.find(f => f.value === faenaSeleccionada)?.label : ""}
                    onSelect={(value) => {
                      // Buscar el valor basado en la etiqueta seleccionada
                      const selectedFaena = faenasDisponibles.find(f => f.label === value);
                      setFaenaSeleccionada(selectedFaena ? selectedFaena.value : "");
                      setError("");
                    }}
                    placeholder={
                      loading.fetchData || loading.faenasPermisos 
                        ? "Cargando faenas disponibles..." 
                        : faenasDisponibles.length === 0 
                          ? "No hay faenas disponibles para este solicitante" 
                          : "Seleccionar faena para permiso"
                    }
                    disabled={!camposEditables || loading.fetchData || loading.faenasPermisos || faenasDisponibles.length === 0}
                    displayValue={(item) => item} // Asegura que se muestre el texto completo
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {loading.faenasPermisos
                    ? "Cargando faenas disponibles..."
                    : faenasDisponibles.length === 0 
                      ? "Este solicitante ya tiene permisos en todas las faenas disponibles" 
                      : "Seleccione la faena para la cual se asignará el permiso (solo se muestran faenas sin permisos)"}
                </p>
              </div>

              {solicitanteSeleccionado && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-700 mb-2">Información del solicitante</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">RUT:</span> {solicitanteSeleccionado.rut}
                    </div>
                    <div>
                      <span className="font-medium">Nombre:</span> {solicitanteSeleccionado.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Cargo:</span> {solicitanteSeleccionado.cargo}
                    </div>
                    {faenaSeleccionada && (
                      <div>
                        <span className="font-medium">Faena a asignar:</span> {faenas.find(f => f.value === faenaSeleccionada)?.label}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
                disabled={loading.submitForm}
              >
                {camposEditables ? "Cancelar" : "Nuevo Permiso"}
              </button>

              {camposEditables && (
                <Button
                  text={loading.submitForm ? "Asignando..." : "Asignar Permiso"}
                  color="orange"
                  onClick={handleAsignarPermiso}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitDisabled()}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
            Sistema de Gestión de Combustible • {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AsignarPermisoSolicitante;