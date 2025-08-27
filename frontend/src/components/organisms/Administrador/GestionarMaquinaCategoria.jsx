import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaKeyboard,
  FaTruck,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
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

  // 🆕 Estados para el modo de entrada
  const [modoEntrada, setModoEntrada] = useState("dropdown"); // "dropdown" o "manual"
  const [nombreMaquinaManual, setNombreMaquinaManual] = useState("");
  const [patenteManual, setPatenteManual] = useState("");

  // Estados para los datos cargados
  const [categorias, setCategorias] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [maquinasOptions, setMaquinasOptions] = useState([]);

  // Estados para las fuentes de datos originales
  const [maquinasInternas, setMaquinasInternas] = useState([]);
  const [maquinasBodega, setMaquinasBodega] = useState([]);

  // Estado para información de normalización
  const [infoNormalizacion, setInfoNormalizacion] = useState({
    mostrar: false,
    patenteOriginal: "",
    patenteNormalizada: "",
    mensaje: "",
  });

  // Estados para carga y mensajes
  const [loading, setLoading] = useState({
    categorias: false,
    faenas: false,
    maquinasOptions: false,
    maquinasInternas: false,
    maquinasBodega: false,
    submit: false,
  });
  const [status, setStatus] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Timer para los mensajes
  const [messageTimeout, setMessageTimeout] = useState(null);

  // Función para mostrar mensajes temporales
  const showMessage = (type, message, duration = 5000) => {
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    setStatus({
      type,
      message,
      visible: true,
    });

    const timer = setTimeout(() => {
      setStatus((prev) => ({ ...prev, visible: false }));
    }, duration);

    setMessageTimeout(timer);
  };

  // 🆕 Función para recargar todas las listas después de guardar
  const recargarListas = async () => {
    console.log('🔄 Recargando listas después de guardar...');
    
    // Marcar como cargando las listas que necesitan actualización
    setLoading(prev => ({
      ...prev,
      maquinasInternas: true,
      maquinasBodega: true,
      maquinasOptions: true
    }));

    try {
      // 1. Recargar máquinas internas
      try {
        const responseMaquinasInternas = await axios.get('/api/maquinas-internas');
        if (responseMaquinasInternas.data.success) {
          setMaquinasInternas(responseMaquinasInternas.data.data);
          console.log('✅ Máquinas internas recargadas');
        }
      } catch (error) {
        console.warn('⚠️ Error recargando máquinas internas:', error);
      }

      // 2. Recargar máquinas de bodega
      try {
        const responseMaquinasBodega = await axios.get('/api/maquinarias-con-vista-previa');
        if (responseMaquinasBodega.data.success) {
          setMaquinasBodega(responseMaquinasBodega.data.data);
          console.log('✅ Máquinas de bodega recargadas');
        }
      } catch (error) {
        console.warn('⚠️ Error recargando máquinas de bodega:', error);
      }

      console.log('🎉 Todas las listas han sido recargadas exitosamente');
      
    } catch (error) {
      console.error('❌ Error general recargando listas:', error);
      showMessage('error', 'Error al recargar las listas. Actualice la página.');
    } finally {
      setLoading(prev => ({
        ...prev,
        maquinasInternas: false,
        maquinasBodega: false,
        maquinasOptions: false
      }));
    }
  };

  // 🆕 Función para cambiar modo de entrada
  const handleModoChange = (nuevoModo) => {
    setModoEntrada(nuevoModo);

    // Limpiar campos al cambiar modo
    if (nuevoModo === "manual") {
      setNombreMaquina("");
      setPatente("");
      setInfoNormalizacion({
        mostrar: false,
        patenteOriginal: "",
        patenteNormalizada: "",
        mensaje: "",
      });
    } else {
      setNombreMaquinaManual("");
      setPatenteManual("");
    }

    setStatus({ type: "", message: "", visible: false });
  };

  // 🆕 Obtener valores actuales según el modo
  const getNombreMaquinaActual = () => {
    return modoEntrada === "manual" ? nombreMaquinaManual : nombreMaquina;
  };

  const getPatenteActual = () => {
    return modoEntrada === "manual" ? patenteManual : patente;
  };

  // Función actualizada para mostrar todas las máquinas disponibles
  const actualizarMaquinasDisponibles = () => {
    if (maquinasBodega.length === 0) {
      return;
    }

    const options = maquinasBodega.map((maquina) => ({
      label: maquina.Nombre,
      value: maquina.Nombre,
      patente: maquina.Rut,
      patente_que_se_usara: maquina.patente_que_se_usara,
      id_bodega: maquina.Id_Personal,
      es_normalizada: maquina.es_patente_normalizada,
      info_display: maquina.info_display,
      maquinas_con_misma_patente: maquina.maquinas_con_misma_patente,
    }));

    setMaquinasOptions(options);
  };

  // Manejar selección de categoría
  const handleCategoriaSelect = (selectedValue) => {
    const categoria = categorias.find((cat) => cat.label === selectedValue);
    if (categoria) {
      setSelectedCategoriaId(categoria.value);
      setSelectedCategoriaLabel(categoria.label);
    } else {
      setSelectedCategoriaId("");
      setSelectedCategoriaLabel("");
    }
    setStatus({ type: "", message: "", visible: false });
  };

  // Manejar selección de máquina (solo para modo dropdown)
  const handleMaquinaSelect = (selectedValue) => {
    if (modoEntrada !== "dropdown") return;

    const maquinaSeleccionada = maquinasOptions.find(
      (maquina) => maquina.label === selectedValue
    );

    if (maquinaSeleccionada) {
      setNombreMaquina(maquinaSeleccionada.value);
      setPatente(maquinaSeleccionada.patente_que_se_usara);

      if (maquinaSeleccionada.es_normalizada) {
        setInfoNormalizacion({
          mostrar: true,
          patenteOriginal: maquinaSeleccionada.patente,
          patenteNormalizada: maquinaSeleccionada.patente_que_se_usara,
          mensaje: `La patente original "${maquinaSeleccionada.patente}" ya está en uso. Se asignará automáticamente "${maquinaSeleccionada.patente_que_se_usara}".`,
        });
      } else {
        setInfoNormalizacion({
          mostrar: false,
          patenteOriginal: "",
          patenteNormalizada: "",
          mensaje: "",
        });
      }
    } else {
      setNombreMaquina(selectedValue || "");
      setPatente("");
      setInfoNormalizacion({
        mostrar: false,
        patenteOriginal: "",
        patenteNormalizada: "",
        mensaje: "",
      });
    }

    setStatus({ type: "", message: "", visible: false });
  };

  // Manejar selección de faena
  const handleFaenaSelect = (selectedValue) => {
    const faena = faenas.find((f) => f.label === selectedValue);
    if (faena) {
      setSelectedFaenaId(faena.value);
      setSelectedFaenaLabel(faena.label);
    } else {
      setSelectedFaenaId("");
      setSelectedFaenaLabel("");
    }
    setStatus({ type: "", message: "", visible: false });
  };

  // 🆕 Validar formulario actualizado
  const validateForm = () => {
    if (!selectedCategoriaId) {
      showMessage("error", "Por favor selecciona una categoría.");
      return false;
    }

    const nombreActual = getNombreMaquinaActual();
    const patenteActual = getPatenteActual();

    if (!nombreActual.trim()) {
      showMessage("error", "Por favor ingresa un nombre de máquina.");
      return false;
    }

    if (!patenteActual.trim()) {
      showMessage("error", "Por favor ingresa una patente válida.");
      return false;
    }

    if (!selectedFaenaId) {
      showMessage("error", "Por favor selecciona una faena.");
      return false;
    }

    return true;
  };

  // 🔄 Función resetForm actualizada para incluir recarga de listas
  const resetForm = async () => {
    console.log('🧹 Limpiando formulario y recargando datos...');
    
    // Limpiar campos del formulario
    setSelectedCategoriaId("");
    setSelectedCategoriaLabel("");
    setNombreMaquina("");
    setPatente("");
    setNombreMaquinaManual("");
    setPatenteManual("");
    setSelectedFaenaId("");
    setSelectedFaenaLabel("");
    setInfoNormalizacion({
      mostrar: false,
      patenteOriginal: "",
      patenteNormalizada: "",
      mensaje: "",
    });
    setModoEntrada("dropdown");

    // 🆕 IMPORTANTE: Recargar las listas después del reset
    await recargarListas();
  };

  // 🔄 Función handleGuardar actualizada
  const handleGuardar = async () => {
    if (!validateForm()) return;

    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      const nombreActual = getNombreMaquinaActual();
      const patenteActual = getPatenteActual();

      const dataToSend = {
        categoria: selectedCategoriaId,
        nombre_maquina: nombreActual,
        patente: patenteActual,
        id_faena: selectedFaenaId,
        tipo_maquina: "Interno",
        modo_entrada: modoEntrada,
      };

      const response = await axios.post("/api/maquinas-internas", dataToSend);

      if (response.status === 201 && response.data?.maquina_interna) {
        let successMessage = "¡Máquina registrada exitosamente!";
        if (modoEntrada === "manual") {
          successMessage +=
            "\n\n📝 Registrada manualmente: " +
            nombreActual +
            " - " +
            patenteActual;
        }

        showMessage("success", successMessage, 7000);
        
        // 🆕 CAMBIO PRINCIPAL: Ahora resetForm incluye la recarga automática
        await resetForm();
        
      } else {
        showMessage(
          "error",
          response.data.error || "Error al guardar la máquina"
        );
      }
    } catch (error) {
      console.error("Error al guardar:", error);

      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        const firstError = Object.entries(error.response.data.errors);
        showMessage(
          "error",
          firstError.length > 0 ? firstError[0][1][0] : firstError[0],
          "Error de validación"
        );
      } else {
        let errorMsg = "Ocurrió un error al guardar. Intente nuevamente.";

        if (error.response?.data?.error) {
          if (error.response.data.error.includes("SQLSTATE")) {
            errorMsg =
              "Error en la base de datos. Por favor, contacte al administrador.";
          } else {
            errorMsg = error.response.data.error;
          }
        }

        showMessage("error", errorMsg);
      }
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Componente para mostrar información de normalización
  const InfoNormalizacion = () => {
    if (!infoNormalizacion.mostrar || modoEntrada === "manual") return null;

    return (
      <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
        <div className="flex items-start">
          <FaInfoCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800">
              Patente Normalizada Automáticamente
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              {infoNormalizacion.mensaje}
            </p>
            <p className="mt-2 text-xs text-blue-600">
              ℹ️ Esta normalización automática permite mantener la integridad de
              los datos.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 🆕 Componente de indicador de recarga (opcional, para mejor UX)
  const IndicadorRecarga = () => {
    const isListasCargando = loading.maquinasInternas || loading.maquinasBodega || loading.maquinasOptions;
    
    if (!isListasCargando) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center text-blue-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <span className="text-sm">Actualizando listas de máquinas...</span>
        </div>
      </div>
    );
  };

  // 🆕 Componente de selector de modo
  const ModoSelector = () => (
    <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
        <FaTruck className="mr-2 text-gray-600" />
        ¿Cómo deseas registrar la máquina?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Opción Dropdown */}
        <button
          onClick={() => handleModoChange("dropdown")}
          disabled={loading.maquinasOptions || loading.maquinasBodega}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            modoEntrada === "dropdown"
              ? "border-orange-400 bg-orange-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <div className="flex items-start">
            <FaSearch
              className={`mt-1 mr-3 ${
                modoEntrada === "dropdown" ? "text-orange-500" : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <h4
                className={`font-medium text-sm ${
                  modoEntrada === "dropdown"
                    ? "text-orange-800"
                    : "text-gray-700"
                }`}
              >
                Buscar en Base de Datos
              </h4>
              <p
                className={`text-xs mt-1 ${
                  modoEntrada === "dropdown"
                    ? "text-orange-700"
                    : "text-gray-500"
                }`}
              >
                Seleccionar desde máquinas registradas
              </p>
              {modoEntrada === "dropdown" && (
                <div className="flex items-center mt-2">
                  <FaCheckCircle className="text-orange-500 mr-1" size={12} />
                  <span className="text-xs text-orange-700 font-medium">
                    Seleccionado
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Opción Manual */}
        <button
          onClick={() => handleModoChange("manual")}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            modoEntrada === "manual"
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <div className="flex items-start">
            <FaKeyboard
              className={`mt-1 mr-3 ${
                modoEntrada === "manual" ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <h4
                className={`font-medium text-sm ${
                  modoEntrada === "manual" ? "text-blue-800" : "text-gray-700"
                }`}
              >
                Entrada Manual
              </h4>
              <p
                className={`text-xs mt-1 ${
                  modoEntrada === "manual" ? "text-blue-700" : "text-gray-500"
                }`}
              >
                Ingresar datos manualmente
              </p>
              {modoEntrada === "manual" && (
                <div className="flex items-center mt-2">
                  <FaCheckCircle className="text-blue-500 mr-1" size={12} />
                  <span className="text-xs text-blue-700 font-medium">
                    Seleccionado
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {modoEntrada === "manual" && (
        <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-200">
          <div className="flex items-start">
            <FaExclamationTriangle
              className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              size={14}
            />
            <p className="text-xs text-blue-800">
              <strong>Solo para casos especiales:</strong> Usar cuando la
              máquina no se encuentra en la base de datos. Asegúrate de ingresar
              datos correctos.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // useEffect para cargar datos iniciales...
  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading((prev) => ({ ...prev, categorias: true }));
      try {
        const response = await axios.get("/api/categorias");
        if (response.data.success) {
          const categoriasOptions = response.data.data.map((cat) => ({
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
        setLoading((prev) => ({ ...prev, categorias: false }));
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    const fetchFaenas = async () => {
      setLoading((prev) => ({ ...prev, faenas: true }));
      try {
        const response = await axios.get("/api/faenas");
        if (response.data.success) {
          const faenasOptions = response.data.data.map((faena) => ({
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
        setLoading((prev) => ({ ...prev, faenas: false }));
      }
    };

    fetchFaenas();
  }, []);

  // Cargar máquinas de bodega
  useEffect(() => {
    const fetchMaquinasBodega = async () => {
      try {
        setLoading((prev) => ({ ...prev, maquinasBodega: true }));
        const response = await axios.get("/api/maquinarias-con-vista-previa");

        console.log("Máquinas de bodega con vista previa:", response.data);

        if (response.data && response.data.success) {
          console.log("Máquinas bodega cargadas:", response.data.data.length);
          setMaquinasBodega(response.data.data);
        } else {
          showMessage("error", "Error al cargar maquinarias de bodega");
        }
      } catch (error) {
        console.error("Error al cargar maquinarias de bodega:", error);
        showMessage(
          "error",
          "Error al cargar maquinarias de bodega. Intente nuevamente."
        );
      } finally {
        setLoading((prev) => ({ ...prev, maquinasBodega: false }));
      }
    };

    fetchMaquinasBodega();
  }, []);

  // 🆕 useEffect adicional para actualizar opciones cuando cambien las máquinas de bodega
  useEffect(() => {
    if (maquinasBodega.length > 0) {
      actualizarMaquinasDisponibles();
      console.log('📋 Opciones de máquinas actualizadas después de recarga');
    }
  }, [maquinasBodega]); // Se ejecuta cada vez que se actualiza maquinasBodega

  useEffect(() => {
    if (!loading.maquinasBodega) {
      setLoading((prev) => ({ ...prev, maquinasOptions: true }));
      actualizarMaquinasDisponibles();
      setLoading((prev) => ({ ...prev, maquinasOptions: false }));
    }
  }, [maquinasBodega]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto w-full">
          <div className="bg-orange-400 px-6 py-4">
            <h2 className="text-white text-2xl font-bold">
              Categorización de Equipos
            </h2>
            <p className="text-orange-50 text-sm">
              Registro y administración de maquinaria interna
            </p>
          </div>

          <div className="p-8">
            {/* 🆕 Indicador de recarga */}
            <IndicadorRecarga />

            {/* Mensajes de estado */}
            {status.visible && status.type === "error" && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded transition-opacity duration-300">
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">
                    {status.message}
                  </span>
                </div>
              </div>
            )}

            {status.visible && status.type === "success" && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded transition-opacity duration-300">
                <div className="flex items-center">
                  <FaCheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span
                    className="text-green-700 font-medium"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {status.message}
                  </span>
                </div>
              </div>
            )}

            {/* 🆕 Selector de modo */}
            <ModoSelector />

            <div className="space-y-6">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría de Máquina <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={categorias}
                  selected={selectedCategoriaLabel}
                  onSelect={handleCategoriaSelect}
                  placeholder={
                    loading.categorias
                      ? "Cargando categorías..."
                      : "Seleccionar categoría..."
                  }
                  disabled={loading.categorias}
                />
              </div>

              {/* Campo de máquina según el modo */}
              {modoEntrada === "dropdown" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Máquina <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={maquinasOptions}
                    selected={nombreMaquina}
                    onSelect={handleMaquinaSelect}
                    placeholder={
                      loading.maquinasOptions || loading.maquinasBodega
                        ? "Cargando máquinas..."
                        : "Buscar máquina..."
                    }
                    disabled={loading.maquinasOptions || loading.maquinasBodega}
                  />
                  <InfoNormalizacion />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Máquina <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreMaquinaManual}
                      onChange={(e) => setNombreMaquinaManual(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Ingrese nombre de la máquina"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={patenteManual}
                      onChange={(e) => setPatenteManual(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Ingrese patente"
                    />
                  </div>
                </div>
              )}

              {/* Patente (solo visible en modo dropdown) */}
              {modoEntrada === "dropdown" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patente
                  </label>
                  <input
                    type="text"
                    value={patente}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                    placeholder="Se asignará automáticamente"
                  />
                </div>
              )}

              {/* Faena */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faena <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={faenas}
                  selected={selectedFaenaLabel}
                  onSelect={handleFaenaSelect}
                  placeholder={
                    loading.faenas
                      ? "Cargando faenas..."
                      : "Seleccionar faena..."
                  }
                  disabled={loading.faenas}
                  maxHeight="150px"
                />
              </div>

              {/* Botón de guardar */}
              <div className="flex justify-center pt-4">
                <Button
                  text={loading.submit ? "Procesando..." : "Registrar Máquina"}
                  color="orange"
                  onClick={handleGuardar}
                  disabled={loading.submit}
                  className="px-6 py-3 rounded-md text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
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