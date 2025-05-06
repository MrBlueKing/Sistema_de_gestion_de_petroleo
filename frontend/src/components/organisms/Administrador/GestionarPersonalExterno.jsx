import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";

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
  const [loading, setLoading] = useState({ fetchData: false, submitForm: false });

  // Estados simplificados
  const [personalExterno, setPersonalExterno] = useState({ nombre: "", rut: "", id_empresa: "" });
  const [empresaExterna, setEmpresaExterna] = useState({ nombre: "", rut: "", contacto: "" });

  const faenas = ["Cabildo", "Catemu", "Chincolco", "Tiltil"];

  // Carga datos según el tipo de personal seleccionado
  useEffect(() => {
    if (tipoPersonal === "Interno") {
      fetchSolicitantes();
    } else if (tipoPersonal === "Externo") {
      fetchEmpresas();
    }
  }, [tipoPersonal]);

  // Función mejorada para validar RUT chileno
  const validarRut = (rut) => {
    if (!rut) return false;
    
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").trim();
    
    // Verificar formato básico
    if (!/^[0-9]{7,8}[0-9kK]$/.test(rutLimpio)) return false;
    
    // Validación del dígito verificador
    const rutDigitos = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplo = 2;
    
    // Suma ponderada
    for (let i = rutDigitos.length - 1; i >= 0; i--) {
      suma += parseInt(rutDigitos[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    // Cálculo del dígito verificador
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();
    
    return dvCalculado === dv;
  };

  // Función para formatear RUT con puntos y guión
  const formatearRut = (rut) => {
    if (!rut) return "";
    
    // Eliminar puntos y guiones
    let valor = rut.replace(/\./g, "").replace(/-/g, "").trim();
    
    // Validar que solo contenga números y k
    if (!/^[0-9kK]+$/.test(valor)) return rut;
    
    // Obtener DV
    const dv = valor.slice(-1);
    // Obtener Cuerpo
    const rutCuerpo = valor.slice(0, -1);
    
    // Formatear con puntos
    let rutFormateado = "";
    let i = rutCuerpo.length;
    
    while (i > 0) {
      const inicio = Math.max(0, i - 3);
      rutFormateado = rutCuerpo.substring(inicio, i) + (rutFormateado ? "." + rutFormateado : "");
      i = inicio;
    }
    
    return rutFormateado + "-" + dv;
  };

  // Obtener solicitantes internos disponibles
  const fetchSolicitantes = async () => {
    setLoading(prev => ({ ...prev, fetchData: true }));
    try {
      const [responseBodega, responsePetroleo] = await Promise.all([
        axios.get("/api/personal-bodega"),
        axios.get("/api/personal-internos")
      ]);
      
      if (!responseBodega.data?.data) throw new Error("Error al obtener datos de bodega");
      
      const personas = responseBodega.data.data.filter(item => item.Cargo !== "Maquinaria" && item.Rut && item.Nombre);
      const registrados = responsePetroleo.data?.personal_interno || [];
      
      // Filtrar solicitantes no registrados
      const disponibles = personas.filter(p => {
        const rutLimpio = p.Rut.trim().toLowerCase();
        return !registrados.some(r => 
          r.personal_interno?.rut && 
          r.personal_interno.rut.trim().toLowerCase() === rutLimpio
        );
      });
      
      // Formatear para dropdown
      setSolicitantes(disponibles.map(p => ({
        label: `${p.Rut} - ${p.Nombre}`,
        value: { rut: p.Rut, nombre: p.Nombre, cargo: p.Cargo || "No especificado" }
      })));
    } catch (err) {
      setError(`Error al cargar solicitantes: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(prev => ({ ...prev, fetchData: false }));
    }
  };

  // Obtener empresas disponibles
  const fetchEmpresas = async () => {
    setLoading(prev => ({ ...prev, fetchData: true }));
    try {
      const response = await axios.get("/api/empresas-disponibles");
      console.log("datillos:", response.data);
      if (!response.data) throw new Error("Error al obtener empresas");
      
      // Formatear empresas para dropdown
      setEmpresas((response.data || []).map(e => ({
        label: `${e.rut} - ${e.nombre}`,
        value: { id: e.id_empresa, nombre: e.nombre, rut: e.rut, contacto: e.contacto }
      })));
    console.log("datilijillos:" , empresas);
    } catch (err) {
      setError(`Error al cargar empresas: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(prev => ({ ...prev, fetchData: false }));
    }
  };

  // Validación mejorada del formulario
  const validarFormulario = () => {
    // Validación común para todos los tipos
    if ((tipoPersonal === "Interno" || tipoPersonal === "Externo") && !faenaSeleccionada) {
      setError("Debe seleccionar una faena.");
      return false;
    }

    // Validaciones específicas por tipo
    if (tipoPersonal === "Interno") {
      if (!solicitanteSeleccionado) {
        setError("Debe seleccionar un solicitante válido.");
        return false;
      }
      if (!validarRut(solicitanteSeleccionado.rut)) {
        setError("El RUT del solicitante es inválido.");
        return false;
      }
    } 
    else if (tipoPersonal === "Externo") {
      if (!personalExterno.nombre?.trim()) {
        setError("El nombre del personal externo es requerido.");
        return false;
      }
      if (!validarRut(personalExterno.rut)) {
        setError("El RUT del personal externo es inválido.");
        return false;
      }
      if (!personalExterno.id_empresa) {
        setError("Debe seleccionar una empresa.");
        return false;
      }
    } 
    else if (tipoPersonal === "Nueva Empresa") {
      if (!empresaExterna.nombre?.trim()) {
        setError("El nombre de la empresa es requerido.");
        return false;
      }
      if (!validarRut(empresaExterna.rut)) {
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

    const seleccionado = solicitantes.find(s => s.label === selectedLabel);
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
      setPersonalExterno(prev => ({ ...prev, id_empresa: "" }));
      setError("");
      return;
    }

    const seleccionada = empresas.find(e => e.label === selectedLabel);
    if (!seleccionada) {
      setError("Empresa no encontrada en la lista.");
      return;
    }

    setPersonalExterno(prev => ({ ...prev, id_empresa: seleccionada.value.id }));
    setError("");
  };

  // Handler para manejo de input RUT con autoformato
  const handleRutChange = (e, setterFn, field = 'rut') => {
    const rutFormateado = formatearRut(e.target.value);
    setterFn(prev => ({ ...prev, [field]: rutFormateado }));
  };

  // Handler para guardar registro
  const handleGuardar = async () => {
    setError("");
    setSuccess("");

    if (!validarFormulario()) return;

    setLoading(prev => ({ ...prev, submitForm: true }));
    
    try {
      let endpoint, payload;
      
      switch (tipoPersonal) {
        case "Interno":
          endpoint = "/api/registrarUsuarioInterno";
          payload = {
            rut: solicitanteSeleccionado.rut,
            nombre_completo: solicitanteSeleccionado.nombre,
            cargo: solicitanteSeleccionado.cargo,
            ubicacion: faenaSeleccionada,
            faena: faenaSeleccionada
          };
          break;
        case "Externo":
          endpoint = "/api/registrar-personal-externo";
          payload = {
            rut: personalExterno.rut,
            nombre_completo: personalExterno.nombre,
            id_empresa: personalExterno.id_empresa,
            ubicacion: faenaSeleccionada
          };
          break;
        case "Nueva Empresa":
          endpoint = "/api/ingresos-empresas-externas";
          payload = {
            nombre: empresaExterna.nombre,
            rut: empresaExterna.rut,
            contacto: empresaExterna.contacto
          };
          break;
      }
      
      const response = await axios.post(endpoint, payload);
      
      if (response.data?.success) {
        setSuccess("Registro realizado correctamente.");
        setCamposEditables(false);
      } else {
        throw new Error(response.data?.message || "No se pudo completar el registro.");
      }
    } catch (err) {
      if (err.response && err.response.status === 422) {
        // Mostrar los errores de validación
        const errores = err.response.data.errors;
        const mensajes = Object.values(errores).flat().join("\n");
        setError(`Errores de validación:\n${mensajes}`);
      } else {
        // Otro tipo de error (500, 404, etc)
        setError(`Error al guardar los datos: ${err.message}`);
      }
    }
     finally {
      setLoading(prev => ({ ...prev, submitForm: false }));
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

  // Renderizar formulario según tipo de personal
  const renderFormFields = () => {
    switch(tipoPersonal) {
      case "Interno":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solicitante <span className="text-red-500">*</span>
              </label>
              <div className={!camposEditables ? "opacity-75 pointer-events-none" : ""}>
                <SearchableDropdown
                  options={solicitantes}
                  selected={solicitanteSeleccionado ? solicitantes.find(s => s.value.rut === solicitanteSeleccionado.rut)?.label || "" : ""}
                  onSelect={handleSolicitanteSelect}
                  placeholder={loading.fetchData ? "Cargando..." : "Seleccione un solicitante"}
                  disabled={!camposEditables || loading.fetchData}
                />
              </div>
            </div>
            {solicitanteSeleccionado && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">Información del solicitante</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">RUT:</span> {solicitanteSeleccionado.rut}</div>
                  <div><span className="font-medium">Nombre:</span> {solicitanteSeleccionado.nombre}</div>
                  <div><span className="font-medium">Cargo:</span> {solicitanteSeleccionado.cargo}</div>
                </div>
              </div>
            )}
          </>
        );
      
      case "Externo":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa <span className="text-red-500">*</span>
              </label>
              <div className={!camposEditables ? "opacity-75 pointer-events-none" : ""}>
                <SearchableDropdown
                  options={empresas}
                  selected={empresas.find(e => e.value.id === personalExterno.id_empresa)?.label || ""}
                  onSelect={handleEmpresaSelect}
                  placeholder={loading.fetchData ? "Cargando..." : "Seleccione empresa"}
                  disabled={!camposEditables || loading.fetchData}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={personalExterno.nombre}
                onChange={(e) => setPersonalExterno(prev => ({ ...prev, nombre: e.target.value }))}
                disabled={!camposEditables}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Nombre completo"
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
                disabled={!camposEditables}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="12.345.678-9"
              />
            </div>
            
            {personalExterno.id_empresa && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">Información de la empresa</h3>
                {empresas.find(e => e.value.id === personalExterno.id_empresa) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Empresa:</span> {empresas.find(e => e.value.id === personalExterno.id_empresa).value.nombre}</div>
                    <div><span className="font-medium">RUT:</span> {empresas.find(e => e.value.id === personalExterno.id_empresa).value.rut}</div>
                    <div><span className="font-medium">Contacto:</span> {empresas.find(e => e.value.id === personalExterno.id_empresa).value.contacto}</div>
                  </div>
                )}
              </div>
            )}
          </>
        );
      
      case "Nueva Empresa":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={empresaExterna.nombre}
                onChange={(e) => setEmpresaExterna(prev => ({ ...prev, nombre: e.target.value }))}
                disabled={!camposEditables}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Nombre de la empresa"
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
                disabled={!camposEditables}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="76.123.456-7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={empresaExterna.contacto}
                onChange={(e) => setEmpresaExterna(prev => ({ ...prev, contacto: e.target.value }))}
                disabled={!camposEditables}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Teléfono o email"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // Verificar si el botón debe estar deshabilitado
  const isSubmitDisabled = () => {
    if (loading.submitForm || loading.fetchData) return true;
    
    switch(tipoPersonal) {
      case "Interno":
        return !solicitanteSeleccionado || !faenaSeleccionada;
      case "Externo":
        return !personalExterno.nombre || !personalExterno.rut || !personalExterno.id_empresa || !faenaSeleccionada;
      case "Nueva Empresa":
        return !empresaExterna.nombre || !empresaExterna.rut || !empresaExterna.contacto;
      default:
        return true;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
      <div className="bg-orange-400 px-6 py-4">
        <h2 className="text-white text-2xl font-bold">Registrar Personal</h2>
        <p className="text-orange-50 text-sm">Gestión de solicitantes internos, personal externo y empresas</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Tipo de registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Registro <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {["Interno", "Externo", "Nueva Empresa"].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoPersonal(tipo)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    tipoPersonal === tipo 
                      ? "bg-orange-400 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={!camposEditables}
                >
                  {tipo === "Interno" ? "Solicitante Interno" : 
                   tipo === "Externo" ? "Personal Externo" : "Nueva Empresa"}
                </button>
              ))}
            </div>
          </div>

          {/* Campo Faena - para Interno y Externo */}
          {(tipoPersonal === "Interno" || tipoPersonal === "Externo") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faena <span className="text-red-500">*</span>
              </label>
              <div className={!camposEditables ? "opacity-75 pointer-events-none" : ""}>
                <SearchableDropdown
                  options={faenas.map(f => ({ label: f, value: f }))}
                  selected={faenaSeleccionada}
                  onSelect={value => {
                    setFaenaSeleccionada(value);
                    setError("");
                  }}
                  placeholder="Seleccionar Faena"
                  disabled={!camposEditables}
                />
              </div>
            </div>
          )}

          {/* Formulario según tipo seleccionado */}
          {renderFormFields()}
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end gap-3">
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
              {loading.submitForm ? "Registrando..." : `Registrar ${
                tipoPersonal === "Interno" ? "Solicitante" :
                tipoPersonal === "Externo" ? "Personal Externo" : "Empresa"
              }`}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
        Sistema de Gestión de Combustible • {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default RegistrarPersonal;