import React, { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";

const RegistrarSolicitante = () => {
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState(null);
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [solicitantes, setSolicitantes] = useState([]);
  const [loading, setLoading] = useState({
    fetchData: false,
    submitForm: false
  });
  const [camposEditables, setCamposEditables] = useState(true);

  const faenas = ["Catemu", "Cabildo", "Til Til"];

  const fetchSolicitantes = async () => {
    setLoading(prev => ({ ...prev, fetchData: true }));
    try {
      // Obtener los solicitantes desde la bodega
      const responseBodega = await axios.get("/api/personal-bodega");
      if (!responseBodega.data?.data) {
        throw new Error("Formato de respuesta inválido desde la API de bodega");
      }
      
      const personas = responseBodega.data.data.filter(
        (item) => item.Cargo !== "Maquinaria"
      );
      
      // Obtener los solicitantes ya registrados en petroleo
      const responsePetroleo = await axios.get("/api/personal-internos");
      if (!responsePetroleo.data) {
        throw new Error("Error al obtener personal interno");
      }

      // Extraer el array correcto de la respuesta
      const solicitantesRegistrados =
        responsePetroleo.data?.personal_interno || [];

      console.log("Solicitantes ya registrados:", solicitantesRegistrados);

      // Filtrar los solicitantes de la bodega que no estén ya registrados
      const solicitantesDisponibles = personas.filter(
        (item) =>
          item.Rut && // Validar que existe un RUT
          item.Nombre && // Validar que existe un Nombre
          !solicitantesRegistrados.some(
            (solicitante) =>
              solicitante.rut?.trim().toLowerCase() ===
              item.Rut?.trim().toLowerCase()
          )
      );

      // Formatear las opciones para el dropdown
      const opcionesFormateadas = solicitantesDisponibles.map((item) => ({
        label: `${item.Rut} - ${item.Nombre}`,
        value: {
          rut: item.Rut,
          nombre: item.Nombre,
          cargo: item.Cargo || "No especificado",
        },
      }));

      setSolicitantes(opcionesFormateadas);
    } catch (err) {
      console.error("Error al cargar solicitantes:", err);
      setError(`No se pudo cargar el personal: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(prev => ({ ...prev, fetchData: false }));
    }
  };

  useEffect(() => {
    fetchSolicitantes();
  }, []);

  // Validar formato de RUT chileno (XX.XXX.XXX-X o XXXXXXXX-X)
  const validarRut = (rut) => {
    if (!rut) return false;
    
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/\./g, "").replace("-", "");
    
    // Verificar formato básico
    if (!/^[0-9]{7,8}[0-9kK]$/.test(rutLimpio)) return false;
    
    // Validación del dígito verificador (algoritmo módulo 11)
    const rutSinDv = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    // Suma ponderada
    for (let i = rutSinDv.length - 1; i >= 0; i--) {
      suma += parseInt(rutSinDv[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    // Cálculo del dígito verificador
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();
    
    return dvCalculado === dv;
  };

  const handleSolicitanteSelect = (selectedLabel) => {
    console.log("Valor seleccionado:", selectedLabel);
    
    // Manejar explícitamente el caso cuando value es null (borrado completo)
    if (selectedLabel === null) {
      setSolicitanteSeleccionado(null);
      setError("");
      return;
    }
    
    // Buscar el objeto solicitante basado en el label seleccionado
    const opcionSeleccionada = solicitantes.find(opt => opt.label === selectedLabel);
    
    if (!opcionSeleccionada) {
      setError("Solicitante no encontrado en la lista.");
      return;
    }
    
    const solicitanteObj = opcionSeleccionada.value;
    if (!validarRut(solicitanteObj.rut)) {
      setError("El RUT seleccionado no es válido.");
      return;
    }

    setSolicitanteSeleccionado(solicitanteObj);
    setError("");
  };

  const validarFormulario = () => {
    if (!solicitanteSeleccionado) {
      setError("Debe seleccionar un solicitante válido.");
      return false;
    }

    if (!solicitanteSeleccionado.rut) {
      setError("El RUT del solicitante es requerido.");
      return false;
    }
    
    if (!validarRut(solicitanteSeleccionado.rut)) {
      setError("El formato del RUT no es válido o el dígito verificador es incorrecto.");
      return false;
    }

    if (!solicitanteSeleccionado.nombre || solicitanteSeleccionado.nombre.trim() === "") {
      setError("El nombre del solicitante es requerido.");
      return false;
    }

    if (!faenaSeleccionada) {
      setError("Debe seleccionar una faena.");
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    // Limpiar mensajes previos
    setError("");
    setSuccess("");

    if (!validarFormulario()) {
      return;
    }

    setLoading(prev => ({ ...prev, submitForm: true }));
    console.log("solicitante seleccionado:", solicitanteSeleccionado)
    try {
      const response = await axios.post("/api/registrarUsuarioInterno", {
        rut: solicitanteSeleccionado.rut,
        nombre_completo: solicitanteSeleccionado.nombre,
        cargo: solicitanteSeleccionado.cargo,
        ubicacion: faenaSeleccionada,
      });
      console.log("Respuesta del backend:", response.data);
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Error al registrar solicitante");
      }

      console.log("Solicitante registrado:", response.data);
      setSuccess("¡Solicitante registrado exitosamente!");
      setCamposEditables(false); // Bloquear campos después de guardar

      // Eliminar el solicitante recién registrado de la lista
      setSolicitantes((prevSolicitantes) =>
        prevSolicitantes.filter(
          (item) => item.value.rut !== solicitanteSeleccionado.rut
        )
      );
    } catch (err) {
      console.error("Error al guardar solicitante:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "No se pudo registrar el solicitante. Intenta nuevamente."
      );
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

    // Opcional: Recargar la lista de solicitantes por si hubieran cambios mientras trabajaba
    fetchSolicitantes();
  };

  // Determinar el valor a mostrar en el dropdown de solicitantes
  const getSelectedSolicitanteLabel = () => {
    if (!solicitanteSeleccionado) return "";
    
    // Buscar el label completo basado en el objeto seleccionado
    const foundOption = solicitantes.find(
      s => s.value.rut === solicitanteSeleccionado.rut
    );
    
    return foundOption ? foundOption.label : "";
  };

  // Verificar si el botón debe estar deshabilitado
  const isSubmitDisabled = () => {
    return (
      loading.submitForm || 
      loading.fetchData || 
      !solicitanteSeleccionado || 
      !faenaSeleccionada
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto w-full">
          <div className="bg-orange-400 px-6 py-4">
            <h2 className="text-white text-2xl font-bold">
              Registrar Solicitante
            </h2>
            <p className="text-orange-50 text-sm">
              Asignación de solicitantes a faenas
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
                  Nombre Solicitante <span className="text-red-500">*</span>
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
                    placeholder={loading.fetchData ? "Cargando solicitantes..." : "Seleccione RUT y nombre del solicitante"}
                    disabled={!camposEditables || loading.fetchData}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Seleccione un solicitante de la lista por RUT y nombre
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faena <span className="text-red-500">*</span>
                </label>
                <div
                  className={
                    camposEditables ? "" : "opacity-75 pointer-events-none"
                  }
                >
                  <SearchableDropdown
                    options={faenas.map((f) => ({ label: f, value: f }))}
                    selected={faenaSeleccionada}
                    onSelect={(value) => {
                      setFaenaSeleccionada(value);
                      setError("");
                    }}
                    placeholder={loading.fetchData ? "Cargando Ubicación..." : "Seleccionar Faena"}
                    disabled={!camposEditables || loading.fetchData}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Seleccione la faena donde se asignará el solicitante
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
                        <span className="font-medium">Faena asignada:</span> {faenaSeleccionada}
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
                {camposEditables ? "Cancelar" : "Nuevo Registro"}
              </button>

              {camposEditables && (
                <Button
                  text={loading.submitForm ? "Registrando..." : "Registrar Solicitante"}
                  color="orange"
                  onClick={handleGuardar}
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

export default RegistrarSolicitante;