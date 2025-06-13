import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import {
  FaHome,
  FaExclamationTriangle,
  FaRuler,
  FaGasPump,
  FaInfoCircle,
  FaTruck,
  FaCheckCircle,
  FaArrowRight,
  FaRoute,
  FaClipboardList,
  FaMapMarkerAlt,
  FaPlay,
  FaCheck,
  FaSync,
} from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import EstanquesModal from "./EstanquesModal";
import SelectorEstanques from "../../molecules/SelectorEstanque";

// Función para formatear números con separadores de miles
const formatNumberWithSeparators = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// COMPONENTE MODAL DE ÉXITO INTEGRADO - IGUAL QUE FormRecepcion
const ModalExitoRecepcion = ({ isOpen, onConfirm, datosRecepcion }) => {
  if (!isOpen) return null;

  const {
    tipoOperacion,
    estanqueOrigen,
    litrosTrasvasijados,
  } = datosRecepcion;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInScale">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
          <div className="flex items-center justify-center">
            <div className="bg-transparent bg-opacity-20 p-3 rounded-full mr-4">
              <FaCheck className="text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                ¡Trasvasije Registrado Exitosamente!
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                La operación se ha completado correctamente
              </p>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Estanque Origen
              </p>
              <p className="font-bold text-lg text-gray-800">
                {estanqueOrigen}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Litros Trasvasijados
              </p>
              <p className="font-bold text-lg text-orange-600">
                {formatNumberWithSeparators(litrosTrasvasijados)} L
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado del Registro:</span>
              <span className="ml-2 font-medium text-orange-600">
                ✓ Completado
              </span>
            </div>
          </div>
        </div>

        {/* Footer con botón */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onConfirm}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-sm"
            >
              <span>Volver</span>
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormRecepcionTrasvasije = () => {
  // Acceder al contexto de usuario
  const { user, loading } = useContext(UserContext);

  // Estados para datos del formulario - IGUAL que FormRecepcion
  const [formData, setFormData] = useState({
    observacion: "",
    id_faena: "",
  });

  // Estados específicos para trasvasije
  const [estanqueMovilSeleccionado, setEstanqueMovilSeleccionado] = useState(null);
  const [litrosDisponibles, setLitrosDisponibles] = useState(0);

  // Estados para distribución de combustible - IGUAL que FormRecepcion
  const [distribucionLitros, setDistribucionLitros] = useState({});

  // Estados para UI - IGUAL que FormRecepcion
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEstanquesModal, setShowEstanquesModal] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Estados para el modal de éxito - IGUAL que FormRecepcion
  const [showExitoModal, setShowExitoModal] = useState(false);
  const [datosRecepcionExitosa, setDatosRecepcionExitosa] = useState(null);

  // Estados para datos de combustible - IGUAL que FormRecepcion
  const [estanques, setEstanques] = useState([]);
  const [alturasEstanques, setAlturasEstanques] = useState({});
  const [capacidadDisponible, setCapacidadDisponible] = useState();

  // Efecto para actualizar la faena - IGUAL que FormRecepcion
  useEffect(() => {
    if (user?.id_faena) {
      setFormData((prev) => ({ ...prev, id_faena: user.id_faena }));
    }
  }, [user]);

  // Cargar estanques cuando cambie la faena - IGUAL que FormRecepcion
  useEffect(() => {
    if (formData.id_faena) {
      cargarEstanques(formData.id_faena);
    }
  }, [formData.id_faena]);

  // Función para cargar los estanques fijos
  const cargarEstanques = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(`/api/estanques-fijo/${idFaena}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEstanques(response.data.data);

      // Inicializar estados
      const initialAlturas = {};
      const initialDistribucion = {};
      response.data.data.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = { inicial: "", final: "" };
        initialDistribucion[estanque.id_estanque] = "";
      });
      setAlturasEstanques(initialAlturas);
      setDistribucionLitros(initialDistribucion);
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      mostrarAlerta("error", "Error al cargar los estanques fijos.");
    }
  };

  // Mostrar alertas - IGUAL que FormRecepcion
  const mostrarAlerta = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  // Mostrar alertas modales - IGUAL que FormRecepcion
  const mostrarModalAlerta = (type, message) => {
    setModalAlert({ show: true, type, message });
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
  };

  // Manejar cambios en campos - IGUAL que FormRecepcion
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Manejar selección de estanque móvil
  const handleEstanqueMovilSelect = (estanque) => {
    console.log('🚚 Estanque móvil seleccionado:', estanque);
    setEstanqueMovilSeleccionado(estanque);
    setLitrosDisponibles(estanque.stock_actual || 0);
    mostrarAlerta("success", `Estanque ${estanque.nombre} seleccionado con ${formatNumberWithSeparators(estanque.stock_actual)} L disponibles`);
  };

  // Cambiar estanque seleccionado
  const handleCambiarEstanque = () => {
    setEstanqueMovilSeleccionado(null);
    setLitrosDisponibles(0);
  };

  // Manejar cambios en distribución - IGUAL que FormRecepcion
  const handleDistribucionChange = (nuevaDistribucion) => {
    setDistribucionLitros(nuevaDistribucion);
  };

  // Manejar cambios en alturas - IGUAL que FormRecepcion
  const handleAlturaChange = (estanqueId, value) => {
    setAlturasEstanques((prev) => ({
      ...prev,
      [estanqueId]: {
        inicial: value.inicial !== undefined ? value.inicial : prev[estanqueId]?.inicial || "",
        final: value.final !== undefined ? value.final : prev[estanqueId]?.final || "",
      },
    }));
  };

  // Función simulada para el modal - IGUAL que FormRecepcion
  const calcularLitrosPetroleo = async () => {
    return { volInicial: 1000, volFinal: 1300 };
  };

  // Validar distribución - IGUAL que FormRecepcion
  const validarDistribucion = () => {
    const totalDistribuido = Object.values(distribucionLitros).reduce(
      (sum, val) => sum + (parseFloat(val) || 0), 0
    );

    if (totalDistribuido === 0) {
      return { valido: false, mensaje: "Debe distribuir al menos algunos litros" };
    }

    if (totalDistribuido > litrosDisponibles) {
      return { valido: false, mensaje: "No puede distribuir más litros de los disponibles" };
    }

    return { valido: true, mensaje: "Distribución válida" };
  };

  // Enviar trasvasije - Adaptado del FormRecepcion
  const handleSubmit = async () => {
    if (!estanqueMovilSeleccionado) {
      mostrarAlerta("error", "Debe seleccionar un estanque móvil");
      return;
    }

    const totalDistribuido = Object.values(distribucionLitros).reduce(
      (sum, val) => sum + (parseFloat(val) || 0), 0
    );

    if (totalDistribuido === 0) {
      mostrarAlerta("error", "Debe configurar la distribución y niveles");
      setShowEstanquesModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const datosTrasvasije = {
        id_usuario: user.id,
        id_faena: formData.id_faena,
        id_estanque_movil: estanqueMovilSeleccionado.id_estanque,
        litros_movil_inicial: litrosDisponibles,
        litros_movil_final: litrosDisponibles - totalDistribuido,
        distribuciones: Object.keys(distribucionLitros)
          .filter(estanqueId => parseFloat(distribucionLitros[estanqueId]) > 0)
          .map(estanqueId => ({
            id_estanque_fijo: parseInt(estanqueId),
            litros_asignados: parseFloat(distribucionLitros[estanqueId]),
            altura_fijo_inicial: parseFloat(alturasEstanques[estanqueId]?.inicial || 0),
            altura_fijo_final: parseFloat(alturasEstanques[estanqueId]?.final || 0)
          })),
        observaciones: formData.observacion || `Trasvasije desde ${estanqueMovilSeleccionado.nombre}`
      };

      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      await axios.post("/api/trasvasijes/movil-a-fijo", datosTrasvasije, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Mostrar modal de éxito - IGUAL que FormRecepcion
      setDatosRecepcionExitosa({
        tipoOperacion: 'trasvasije',
        estanqueOrigen: estanqueMovilSeleccionado.nombre,
        litrosTrasvasijados: totalDistribuido,
      });
      setShowExitoModal(true);

    } catch (error) {
      console.error("Error:", error);
      mostrarAlerta("error", "Error al registrar el trasvasije");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal de éxito - IGUAL que FormRecepcion
  const handleExitoModalConfirm = () => {
    setShowExitoModal(false);
    window.location.href = "/bombero";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ESTRUCTURA IDÉNTICA AL FormRecepcion */}
      <div className="bg-gray-50 shadow-sm rounded-lg p-4 sm:p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">
          Trasvasije de Combustible
        </h2>
        {/* Alertas - IGUAL que FormRecepcion */}
        {alert.show && (
          <div className={`mb-4 p-4 rounded-lg border-l-4 ${alert.type === "success"
            ? "bg-green-50 text-green-800 border-l-4 border-green-500"
            : alert.type === "info"
              ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
              : alert.type === "error"
                ? "bg-red-50 text-red-800 border-l-4 border-red-500"
                : alert.type === "warning"
                  ? "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
                  : "bg-green-50 text-green-800 border-l-4 border-green-500"
            }`}>
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {alert.type === "info" ? (
                <FaInfoCircle className="text-blue-600" size={20} />
              ) : alert.type === "error" ? (
                <FaExclamationTriangle className="text-red-600" size={20} />
              ) : alert.type === "warning" ? (
                <FaExclamationTriangle className="text-amber-600" size={20} />
              ) : (
                <FaCheck className="text-green-600" size={20} />
              )}
            </div>
            <div className="text-sm md:text-base">{alert.message}</div>
          </div>
        )}

        {/* Mostrar estanque seleccionado */}
        {estanqueMovilSeleccionado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="bg-green-500 p-3 rounded-lg mr-4">
                  <FaTruck className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 text-lg">{estanqueMovilSeleccionado.nombre}</h3>
                  <p className="text-green-700 text-sm">
                    {formatNumberWithSeparators(litrosDisponibles)} L disponibles para trasvasijar
                  </p>
                  <div className="flex items-center mt-1">
                    <FaCheckCircle className="text-green-600 mr-1 text-xs" />
                    <span className="text-green-600 text-xs font-medium">Estanque seleccionado</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCambiarEstanque}
                className="bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
              >
                Cambiar Estanque
              </button>
            </div>
          </div>
        )}

        {/* Estado de distribución - IGUAL estructura que FormRecepcion */}
        {estanqueMovilSeleccionado && litrosDisponibles > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-600">
                Estado de Distribución
              </label>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${validarDistribucion().valido ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                <span className="text-sm font-medium">
                  {validarDistribucion().valido ? 'Válida' : 'Requiere configuración'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GRID PRINCIPAL - IGUAL que FormRecepcion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de estanque móvil */}
          {!estanqueMovilSeleccionado && (
            <div className="flex flex-col col-span-full">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Estanque Móvil de Origen *
              </label>
              {formData.id_faena ? (
                <SelectorEstanques
                  idFaena={formData.id_faena}
                  onEstanqueSelect={handleEstanqueMovilSelect}
                  estanqueSeleccionado={estanqueMovilSeleccionado}
                  tipoEstanque="movil"
                  litrosRequeridos={0}
                  disabled={false}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <FaExclamationTriangle className="text-yellow-500 mx-auto mb-2 text-xl" />
                  <p className="text-yellow-800 font-medium">No se ha podido identificar la faena</p>
                  <p className="text-yellow-700 text-sm">Contacte al administrador del sistema</p>
                </div>
              )}
            </div>
          )}

          {/* Botón para configurar distribución */}
          {estanqueMovilSeleccionado && litrosDisponibles > 0 && (
            <div className="flex flex-col col-span-full">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Configurar Distribución *
              </label>
              <button
                onClick={() => setShowEstanquesModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-md transition-all flex items-center justify-center"
              >
                <FaPlay className="mr-3" />
                Distribuir {formatNumberWithSeparators(litrosDisponibles)} L entre Estanques Fijos
              </button>
            </div>
          )}

          {/* Observaciones - IGUAL que FormRecepcion */}
          <div className="flex flex-col col-span-full mt-2">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Observación
            </label>
            <InputField
              placeholder="Ingrese sus observaciones"
              isTextarea={true}
              value={formData.observacion}
              onChange={(e) => handleChange("observacion", e.target.value)}
              className="bg-white rounded-md px-3 py-2 min-h-[80px] text-gray-800 border-gray-300"
            />
          </div>
        </div>

        {/* Botones de acción - EXACTAMENTE IGUAL que FormRecepcion */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center mt-4 pt-2 border-t space-y-reverse space-y-3 sm:space-y-0">
          <Button
            to="/Bombero"
            className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto"
            icon={<FaHome className="mr-2 text-white" />}
            text="Volver"
          />

          <Button
            text={isSubmitting ? "Procesando..." : "Confirmar Trasvasije"}
            color="orange"
            onClick={handleSubmit}
            disabled={isSubmitting || !estanqueMovilSeleccionado}
            className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-6 py-3 sm:py-2 rounded-md w-full sm:w-auto sm:ml-auto ${isSubmitting ? "opacity-70 cursor-wait" : ""
              }`}
          />
        </div>

        {/* Texto de campos obligatorios - IGUAL que FormRecepcion */}
        <div className="text-xs text-gray-500 mt-2">
          Los campos marcados con * son obligatorios
        </div>

        {/* Modal de distribución - IGUAL que FormRecepcion */}
        <EstanquesModal
          isOpen={showEstanquesModal}
          onClose={() => setShowEstanquesModal(false)}
          estanques={estanques}
          alturasEstanques={alturasEstanques}
          handleAlturaChange={handleAlturaChange}
          calcularLitrosPetroleo={calcularLitrosPetroleo}
          modalAlert={modalAlert}
          capacidadDisponible={capacidadDisponible}
          litrosRecibidos={litrosDisponibles}
          distribucionLitros={distribucionLitros}
          onDistribucionChange={handleDistribucionChange}
        />
      </div>

      {/* Modal de éxito - IGUAL que FormRecepcion */}
      {datosRecepcionExitosa && (
        <ModalExitoRecepcion
          isOpen={showExitoModal}
          onConfirm={handleExitoModalConfirm}
          datosRecepcion={datosRecepcionExitosa}
        />
      )}
    </>
  );
};

export default FormRecepcionTrasvasije; 