import React, { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaUser,
  FaTruck,
  FaGasPump,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCommentAlt,
} from "react-icons/fa";
import SuccessNotification from '../molecules/SuccessNotificationRendir';
import LoadingButton from '../molecules/LoadingButtonRendir';
import axios from "../../lib/axios";

const DetalleCargaModal = ({ cargaId, isOpen, onClose, onActionComplete }) => {
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [success, setSuccess] = useState(null);
  const successRef = useRef(null);
  const modalRef = useRef(null);

  // Cargar detalles de la carga cuando se abre el modal
  useEffect(() => {
    if (isOpen && cargaId) {
      fetchDetalleCarga();
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, cargaId]);

  useEffect(() => {
    if (success && modalRef.current) {
      // Pone el scroll del modal en 0, es decir, arriba del modal
      modalRef.current.scrollTop = 0;

      // opcional: foco al mensaje
      successRef.current?.focus();
    }
  }, [success]);

  const fetchDetalleCarga = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ ADAPTADO: Usar tus rutas actuales
      const response = await axios.get(`/api/adminOperador/cargas/${cargaId}`);

      if (response.data.status === "success") {
        setCarga(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error al cargar detalle de carga:", error);
      setError(error.response?.data?.message || "Error al cargar los detalles");
    } finally {
      setLoading(false);
    }
  };

  // 2. Agregar estados para notificaciones (después de los estados existentes):
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });
  const [rendirLoading, setRendirLoading] = useState(false);

  // 🔧 CORRECCIÓN para DetalleCargaModal.jsx

  // 3. Reemplazar la función handleRendir existente con esta:
  const handleRendir = async () => {
    console.log("🚀 Iniciando rendición desde modal:", cargaId);
    setRendirLoading(true);

    try {
      setError(null);

      const response = await axios.post(`/api/adminOperador/cargas/${cargaId}/rendir`);
      console.log("📡 Respuesta del servidor:", response.data);

      if (response.data.status === "success") {
        // Actualizar el estado de la carga en el modal
        setCarga(prevCarga => ({
          ...prevCarga,
          estado: "Rendido",
          fecha_rendicion: new Date().toISOString()
        }));

        // Mostrar notificación de éxito
        setNotification({
          visible: true,
          title: "🎉 Rendición Exitosa",
          message: response.data.message || "La carga ha sido marcada como rendida correctamente.",
          type: "success"
        });

        // Llamar callback para actualizar la lista principal
        if (onActionComplete) {
          onActionComplete();
        }

        console.log("✅ Carga rendida exitosamente desde modal");
      } else {
        throw new Error(response.data.message || "Error al rendir la carga");
      }
    } catch (error) {
      console.error("❌ Error al rendir carga:", error);
      setNotification({
        visible: true,
        title: "❌ Error al Rendir",
        message: error.response?.data?.message || error.message || "Error al rendir la carga",
        type: "error"
      });
    } finally {
      setRendirLoading(false);
    }
  };

  // 4. Función para cerrar notificación:
  const closeNotification = () => {
    setNotification({ visible: false, title: "", message: "", type: "success" });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      "Por Rendir": "bg-yellow-100 text-yellow-800 border-yellow-200",
      Rendido: "bg-green-100 text-green-800 border-green-200",
      rechazado: "bg-red-100 text-red-800 border-red-200",
    };

    const icons = {
      PorRendir: <FaClock className="w-4 h-4" />,
      Rendido: <FaCheckCircle className="w-4 h-4" />,
      rechazado: <FaTimesCircle className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${variants[estado]}`}
      >
        {icons[estado]}
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Detalle de Carga Externa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando detalles...</span>
            </div>
          )}

          {success && (
            <div
              ref={successRef}
              tabIndex="-1" // necesario para que pueda recibir focus
              className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 outline-none"
            >
              <div className="flex items-center">
                <FaCheckCircle className="text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">
                    ¡Operación Exitosa!
                  </h3>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {carga && (
            <div className="space-y-6">
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información de la boleta */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaFileInvoiceDollar className="text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">
                      Información de la Boleta
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Boleta:</span>
                      <span className="font-medium">{carga.numero_boleta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Carga:</span>
                      <span className="font-medium">
                        {formatDate(carga.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      {getEstadoBadge(carga.estado)}
                    </div>
                  </div>
                </div>

                {/* Información del operador */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaUser className="text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold">Operador</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium">
                        {carga.user?.nombre} {carga.user?.apellido}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RUT:</span>
                      <span className="font-medium">
                        {carga.user?.rut || "No disponible"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">
                        {carga.user?.email || "No disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la máquina y combustible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información de la máquina */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaTruck className="text-orange-600 mr-2" />
                    <h3 className="text-lg font-semibold">Maquinaria</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium">
                        {carga.maquina?.nombre_maquina}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patente:</span>
                      <span className="font-medium">
                        {carga.maquina?.patente}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium">
                        {carga.maquina?.categoria?.nombre_categoria ||
                          "No disponible"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del combustible */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaGasPump className="text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold">Combustible</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">
                        {carga.tipo_combustible || "Diesel"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Litros:</span>
                      <span className="font-medium">{carga.litros} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio por litro:</span>
                      <span className="font-medium">
                        {formatCurrency(carga.precio_por_litro)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Costo total:</span>
                      <span className="font-medium text-lg text-green-600">
                        {formatCurrency(carga.costo)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación y observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ubicación */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaMapMarkerAlt className="text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold">Ubicación</h3>
                  </div>
                  <p className="text-gray-700">
                    {carga.ubicacion || "No especificada"}
                  </p>
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaCalendarAlt className="text-indigo-600 mr-2" />
                    <h3 className="text-lg font-semibold">
                      Información Adicional
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {carga.medicion && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medición:</span>
                        <span className="font-medium">
                          {Number(carga.medicion).toLocaleString("es-CL")} km
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lugar:</span>
                      <span className="font-medium">
                        {carga.faena?.ubicacion || "Cargas Externas"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {carga.observaciones && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FaCommentAlt className="text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold">Observaciones</h3>
                  </div>
                  <p className="text-gray-700">{carga.observaciones}</p>
                </div>
              )}

              {/* Información de aprobación/rechazo */}
              {(carga.estado === "aprobado" ||
                carga.estado === "rechazado") && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Información de{" "}
                      {carga.estado === "aprobado" ? "Aprobación" : "Rechazo"}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">
                          {formatDate(carga.fecha_aprobacion)}
                        </span>
                      </div>
                      {carga.aprobadoPor && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {carga.estado === "aprobado"
                              ? "Aprobado por:"
                              : "Rechazado por:"}
                          </span>
                          <span className="font-medium">
                            {carga.aprobadoPor.nombre}{" "}
                            {carga.aprobadoPor.apellido}
                          </span>
                        </div>
                      )}
                      {carga.motivo_rechazo && (
                        <div>
                          <span className="text-gray-600">
                            Motivo del rechazo:
                          </span>
                          <p className="text-red-700 bg-red-50 p-2 rounded mt-1">
                            {carga.motivo_rechazo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Actions */}
        {carga && carga.estado === "Por Rendir" && !mostrarRechazo && (
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <LoadingButton
              isLoading={rendirLoading}
              onClick={handleRendir}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Rendir Carga
            </LoadingButton>
          </div>
        )}

        {/* Notificación de Éxito/Error */}
        <SuccessNotification
          isVisible={notification.visible}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      </div>
    </div>
  );
};

export default DetalleCargaModal;
