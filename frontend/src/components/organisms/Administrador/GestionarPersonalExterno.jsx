import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";
import { cleanRut, formatRut, validateRut } from "../../../utils/rutHelper";

const RegistrarPersonal = () => {
  // Estados principales
  const [tipoPersonal, setTipoPersonal] = useState("Interno");
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState(null);
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [camposEditables, setCamposEditables] = useState(true);
  const [solicitantes, setSolicitantes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState({
    fetchData: false,
    submitForm: false,
    faenas: false,
  });

  // Estados simplificados
  const [personalExterno, setPersonalExterno] = useState({
    nombre: "",
    rut: "",
    id_empresa: "",
  });
  const [empresaExterna, setEmpresaExterna] = useState({
    nombre: "",
    rut: "",
    contacto: "",
  });

  // Estado para faenas dinámicas
  const [faenas, setFaenas] = useState([]);

  // Cargar faenas desde la API
  useEffect(() => {
    const fetchFaenas = async () => {
      setLoading((prev) => ({ ...prev, faenas: true }));
      try {
        const response = await axios.get("/api/faenas");
        if (response.data.success) {
          const faenasOptions = response.data.data.map((faena) => ({
            label: faena.ubicacion,
            value: faena.ubicacion,
          }));
          setFaenas(faenasOptions);
        } else {
          // Fallback a faenas hardcodeadas
          setFaenas([
            { label: "Cabildo", value: "Cabildo" },
            { label: "Catemu", value: "Catemu" },
            { label: "Chincolco", value: "Chincolco" },
            { label: "Tiltil", value: "Tiltil" },
          ]);
        }
      } catch (error) {
        console.error("Error al cargar faenas:", error);
        // Fallback a faenas hardcodeadas
        setFaenas([
          { label: "Cabildo", value: "Cabildo" },
          { label: "Catemu", value: "Catemu" },
          { label: "Chincolco", value: "Chincolco" },
          { label: "Tiltil", value: "Tiltil" },
        ]);
      } finally {
        setLoading((prev) => ({ ...prev, faenas: false }));
      }
    };

    fetchFaenas();
  }, []);

  // Obtener solicitantes internos disponibles
  const fetchSolicitantes = async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }));
    try {
      const [responseBodega, responsePetroleo] = await Promise.all([
        axios.get("/api/personal-bodega"),
        axios.get("/api/personal-internos"),
      ]);

      if (!responseBodega.data?.data)
        throw new Error("Error al obtener datos de bodega");

      const personas = responseBodega.data.data.filter(
        (item) => item.Cargo !== "Maquinaria" && item.Rut && item.Nombre
      );
      const registrados = responsePetroleo.data?.personal_interno || [];

      // Filtrar solicitantes no registrados
      const disponibles = personas.filter((p) => {
        const rutLimpio = p.Rut.trim().toLowerCase();
        return !registrados.some(
          (r) =>
            r.personal_interno?.rut &&
            r.personal_interno.rut.trim().toLowerCase() === rutLimpio
        );
      });

      // Formatear para dropdown
      setSolicitantes(
        disponibles.map((p) => ({
          label: `${p.Rut} - ${p.Nombre}`,
          value: {
            rut: p.Rut,
            nombre: p.Nombre,
            cargo: p.Cargo || "No especificado",
          },
        }))
      );
    } catch (err) {
      setError(
        `Error al cargar solicitantes: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }));
    }
  };

  // Obtener empresas disponibles
  const fetchEmpresas = async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }));
    try {
      const response = await axios.get("/api/empresas-disponibles");
      console.log("datillos:", response.data);
      if (!response.data) throw new Error("Error al obtener empresas");

      // Formatear empresas para dropdown
      setEmpresas(
        (response.data || []).map((e) => ({
          label: `${e.rut} - ${e.nombre}`,
          value: {
            id: e.id_empresa,
            nombre: e.nombre,
            rut: e.rut,
            contacto: e.contacto,
          },
        }))
      );
      console.log("datilijillos:", empresas);
    } catch (err) {
      setError(
        `Error al cargar empresas: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }));
    }
  };

  // Efecto para cargar datos según el tipo de personal
  useEffect(() => {
    if (tipoPersonal === "Interno") {
      fetchSolicitantes();
    } else if (tipoPersonal === "Externo") {
      fetchEmpresas();
    }

    // Limpiar estados cuando se cambia de tipo
    setSolicitanteSeleccionado(null);
    setPersonalExterno({ nombre: "", rut: "", id_empresa: "" });
    setEmpresaExterna({ nombre: "", rut: "", contacto: "" });
    setFaenaSeleccionada("");
    setError("");
    setSuccess("");
    setCamposEditables(true);
  }, [tipoPersonal]);

  // Validar formulario antes de enviar
  const validarFormulario = () => {
    if (tipoPersonal === "Interno") {
      if (!solicitanteSeleccionado) {
        setError("Debe seleccionar un solicitante.");
        return false;
      }
      if (!faenaSeleccionada) {
        setError("Debe seleccionar una faena.");
        return false;
      }
      if (!validateRut(solicitanteSeleccionado.rut)) {
        setError("El RUT del solicitante es inválido.");
        return false;
      }
    } else if (tipoPersonal === "Externo") {
      if (!personalExterno.nombre?.trim()) {
        setError("El nombre del personal externo es requerido.");
        return false;
      }
      if (!validateRut(personalExterno.rut)) {
        setError("El RUT del personal externo es inválido.");
        return false;
      }
      if (!personalExterno.id_empresa) {
        setError("Debe seleccionar una empresa.");
        return false;
      }
      if (!faenaSeleccionada) {
        setError("Debe seleccionar una faena.");
        return false;
      }
    } else if (tipoPersonal === "Nueva Empresa") {
      if (!empresaExterna.nombre?.trim()) {
        setError("El nombre de la empresa es requerido.");
        return false;
      }
      if (!validateRut(empresaExterna.rut)) {
        setError("El RUT de la empresa es inválido.");
        return false;
      }
      if (!empresaExterna.contacto?.trim()) {
        setError("El contacto de la empresa es requerido.");
        return false;
      }
    }

    return true;
  };

  // Handler para selección de solicitante
  const handleSolicitanteSelect = (selectedLabel) => {
    if (!selectedLabel) {
      setSolicitanteSeleccionado(null);
      setError("");
      return;
    }

    const seleccionado = solicitantes.find((s) => s.label === selectedLabel);
    if (!seleccionado) {
      setError("Solicitante no encontrado en la lista.");
      return;
    }

    setSolicitanteSeleccionado(seleccionado.value);
    setError("");
  };

  // Handler para selección de empresa
  const handleEmpresaSelect = (selectedLabel) => {
    if (!selectedLabel) {
      setPersonalExterno((prev) => ({ ...prev, id_empresa: "" }));
      setError("");
      return;
    }

    const seleccionada = empresas.find((e) => e.label === selectedLabel);
    if (!seleccionada) {
      setError("Empresa no encontrada en la lista.");
      return;
    }

    setPersonalExterno((prev) => ({
      ...prev,
      id_empresa: seleccionada.value.id,
    }));
    setError("");
  };

  // Handler para selección de faena
  const handleFaenaSelect = (selectedLabel) => {
    if (!selectedLabel) {
      setFaenaSeleccionada("");
      setError("");
      return;
    }

    const faenaEncontrada = faenas.find((f) => f.label === selectedLabel);
    if (!faenaEncontrada) {
      setError("Faena no encontrada en la lista.");
      return;
    }

    setFaenaSeleccionada(faenaEncontrada.value);
    setError("");
    console.log("✅ Faena seleccionada:", faenaEncontrada);
  };

  // Handler para manejo de input RUT con autoformato
  const handleRutChange = (e, setterFn, field = "rut") => {
    const rutFormateado = formatRut(e.target.value);
    setterFn((prev) => ({ ...prev, [field]: rutFormateado }));
  };

  // Handler para guardar registro
  const handleGuardar = async () => {
    setError("");
    setSuccess("");

    if (!validarFormulario()) return;

    setLoading((prev) => ({ ...prev, submitForm: true }));

    try {
      let endpoint, payload;

      switch (tipoPersonal) {
        case "Interno":
          endpoint = "/api/registrarUsuarioInterno";
          payload = {
            rut: cleanRut(solicitanteSeleccionado.rut), // 🧹 Limpiamos RUT antes de enviar
            nombre_completo: solicitanteSeleccionado.nombre,
            cargo: solicitanteSeleccionado.cargo,
            ubicacion: faenaSeleccionada,
            faena: faenaSeleccionada,
          };
          break;
        case "Externo":
          endpoint = "/api/registrar-personal-externo";
          payload = {
            rut: cleanRut(personalExterno.rut), // 🧹 Limpiamos RUT antes de enviar
            nombre_completo: personalExterno.nombre,
            id_empresa: personalExterno.id_empresa,
            ubicacion: faenaSeleccionada,
          };
          break;
        case "Nueva Empresa":
          endpoint = "/api/ingresos-empresas-externas";
          payload = {
            nombre: empresaExterna.nombre,
            rut: cleanRut(empresaExterna.rut), // 🧹 Limpiamos RUT antes de enviar
            contacto: empresaExterna.contacto,
          };
          break;
        default:
          throw new Error("Tipo de personal no válido");
      }

      const response = await axios.post(endpoint, payload);

      if (response.data?.success) {
        setSuccess("Registro realizado correctamente.");

        // 🔄 Resetear todos los estados del formulario
        setSolicitanteSeleccionado(null);
        setFaenaSeleccionada("");
        setPersonalExterno({ nombre: "", rut: "", id_empresa: "" });
        setEmpresaExterna({ nombre: "", rut: "", contacto: "" });
        

        // Opcional: Recargar datos si es necesario
        if (tipoPersonal === "Interno") {
          fetchSolicitantes();
        } else if (tipoPersonal === "Externo") {
          fetchEmpresas();
        }
      } else {
        throw new Error(
          response.data?.message || "No se pudo completar el registro."
        );
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(
          error.response?.data?.message || "Error al procesar el registro"
        );
      }
    } finally {
      setLoading((prev) => ({ ...prev, submitForm: false }));
    }
  };

  // Resetear formulario
  const handleReset = () => {
    setSolicitanteSeleccionado(null);
    setFaenaSeleccionada("");
    setPersonalExterno({ nombre: "", rut: "", id_empresa: "" });
    setEmpresaExterna({ nombre: "", rut: "", contacto: "" });
    setError("");
    setSuccess("");
    setCamposEditables(true);

    if (tipoPersonal === "Interno") fetchSolicitantes();
    else if (tipoPersonal === "Externo") fetchEmpresas();
  };

  // Función para determinar si el botón submit está deshabilitado
  const isSubmitDisabled = () => {
    if (loading.submitForm || loading.faenas) return true;

    if (tipoPersonal === "Interno") {
      return !solicitanteSeleccionado || !faenaSeleccionada;
    } else if (tipoPersonal === "Externo") {
      return (
        !personalExterno.nombre.trim() ||
        !personalExterno.rut.trim() ||
        !personalExterno.id_empresa ||
        !faenaSeleccionada
      );
    } else if (tipoPersonal === "Nueva Empresa") {
      return !empresaExterna.nombre.trim() || !empresaExterna.rut.trim();
    }
    return false;
  };

  // Renderizar formulario según tipo de personal
  const renderFormFields = () => {
    switch (tipoPersonal) {
      case "Interno":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solicitante <span className="text-red-500">*</span>
              </label>
              <div
                className={
                  !camposEditables ? "opacity-75 pointer-events-none" : ""
                }
              >
                <SearchableDropdown
                  options={solicitantes}
                  selected={
                    solicitanteSeleccionado
                      ? solicitantes.find(
                          (s) => s.value.rut === solicitanteSeleccionado.rut
                        )?.label || ""
                      : ""
                  }
                  onSelect={handleSolicitanteSelect}
                  placeholder={
                    loading.fetchData
                      ? "Cargando solicitantes..."
                      : "Seleccionar Solicitante"
                  }
                  disabled={!camposEditables || loading.fetchData}
                />
              </div>
            </div>
          </>
        );

      case "Externo":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={personalExterno.nombre}
                onChange={(e) =>
                  setPersonalExterno((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nombre completo del personal"
                disabled={!camposEditables}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={personalExterno.rut}
                onChange={(e) => handleRutChange(e, setPersonalExterno)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="12.345.678-9"
                disabled={!camposEditables}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa <span className="text-red-500">*</span>
              </label>
              <div
                className={
                  !camposEditables ? "opacity-75 pointer-events-none" : ""
                }
              >
                <SearchableDropdown
                  options={empresas}
                  selected={
                    personalExterno.id_empresa
                      ? empresas.find(
                          (e) => e.value.id === personalExterno.id_empresa
                        )?.label || ""
                      : ""
                  }
                  onSelect={handleEmpresaSelect}
                  placeholder={
                    loading.fetchData
                      ? "Cargando empresas..."
                      : "Seleccionar Empresa"
                  }
                  disabled={!camposEditables || loading.fetchData}
                  maxHeight="100px"
                />
              </div>
            </div>
          </>
        );

      case "Nueva Empresa":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={empresaExterna.nombre}
                onChange={(e) =>
                  setEmpresaExterna((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nombre de la empresa"
                disabled={!camposEditables}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={empresaExterna.rut}
                onChange={(e) => handleRutChange(e, setEmpresaExterna)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="12.345.678-9"
                disabled={!camposEditables}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacto
              </label>
              <input
                type="text"
                value={empresaExterna.contacto}
                onChange={(e) =>
                  setEmpresaExterna((prev) => ({
                    ...prev,
                    contacto: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Teléfono o email de contacto (opcional)"
                disabled={!camposEditables}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="bg-orange-400 px-6 py-4">
          <h2 className="text-white text-2xl font-bold">Registrar Personal</h2>
          <p className="text-orange-50 text-sm">
            Gestión de solicitantes internos, personal externo y empresas
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario principal */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-6">
            {/* Selector de tipo de personal */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Personal
              </label>
              <div className="flex flex-wrap gap-2">
                {["Interno", "Externo", "Nueva Empresa"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoPersonal(tipo)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      tipoPersonal === tipo
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={!camposEditables}
                  >
                    {tipo === "Interno"
                      ? "Solicitante Interno"
                      : tipo === "Externo"
                      ? "Personal Externo"
                      : "Nueva Empresa"}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Faena - para Interno y Externo */}
            {(tipoPersonal === "Interno" || tipoPersonal === "Externo") && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faena <span className="text-red-500">*</span>
                </label>
                <div
                  className={
                    !camposEditables ? "opacity-75 pointer-events-none" : ""
                  }
                >
                  <SearchableDropdown
                    options={faenas}
                    selected={faenaSeleccionada}
                    onSelect={handleFaenaSelect}
                    placeholder={
                      loading.faenas
                        ? "Cargando faenas..."
                        : "Seleccionar Faena"
                    }
                    disabled={!camposEditables || loading.faenas}
                  />
                </div>
              </div>
            )}

            {/* Formulario según tipo seleccionado */}
            <div className="space-y-6 min-h-[240px]">{renderFormFields()}</div>
          </div>

          {/* Botones de acción */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading.submitForm}
            >
              {camposEditables ? "Cancelar" : "Nuevo Registro"}
            </button>

            {camposEditables && (
              <button
                onClick={handleGuardar}
                disabled={isSubmitDisabled()}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 disabled:opacity-50"
              >
                {loading.submitForm
                  ? "Registrando..."
                  : `Registrar ${
                      tipoPersonal === "Interno"
                        ? "Solicitante"
                        : tipoPersonal === "Externo"
                        ? "Personal Externo"
                        : "Empresa"
                    }`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarPersonal;
