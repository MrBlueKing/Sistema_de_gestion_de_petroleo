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

  // 🔧 CORRECCIÓN para DetalleCargaModal.jsx

  const handleAprobar = async () => {
    try {
      console.log("🚀 Iniciando aprobación de carga:", cargaId);

      const response = await axios.post(
        `/api/adminOperador/cargas/${cargaId}/aprobar`
      );

      console.log("📡 Respuesta completa del servidor:", response.data);

      // 🔧 CORREGIDO: Tu backend devuelve el status en response.data.status
      if (response.data.status === "success") {
        console.log("✅ Aprobación exitosa");

        // ✅ Actualizar estado local con los datos frescos del backend
        if (response.data.data) {
          setCarga(response.data.data);
        } else {
          // Fallback: actualizar manualmente si no viene data
          setCarga((prev) => ({
            ...prev,
            estado: "Rendido",
            fecha_aprobacion: new Date().toISOString(),
          }));
        }

        // ✅ Ejecutar callback para actualizar lista padre
        onActionComplete && onActionComplete();

        // ✅ Mostrar mensaje de éxito
        setSuccess(response.data.message || "✅ Carga rendida con éxito");
        setError(null); // Limpiar errores previos

        // ✅ Opcional: ocultar mensaje después de unos segundos
        setTimeout(() => setSuccess(null), 5000);
      } else {
        // 🚨 Si el servidor responde pero con status diferente a 'success'
        console.log("⚠️ Respuesta no exitosa del servidor:", response.data);
        setError(response.data.message || "❌ No se pudo aprobar la carga");
        setSuccess(null);
      }
    } catch (error) {
      // 🚨 Error de red, servidor no responde, etc.
      console.error("❌ Error en la petición:", error);
      console.error("📋 Detalles del error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Obtener mensaje de error del backend si existe
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `❌ Error al aprobar la carga: ${error.message}`;

      setError(errorMessage);
      setSuccess(null);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      setError("Debe ingresar un motivo para el rechazo");
      return;
    }

    try {
      // ✅ ADAPTADO: Usar tus rutas actuales con POST
      const response = await axios.post(
        `/api/adminOperador/cargas/${cargaId}/rechazar`,
        {
          motivo_rechazo: motivoRechazo,
        }
      );

      if (response.data.status === "success") {
        setCarga((prev) => ({
          ...prev,
          estado: "rechazado",
          fecha_aprobacion: new Date().toISOString(),
          motivo_rechazo: motivoRechazo,
        }));
        setMostrarRechazo(false);
        setMotivoRechazo("");
        onActionComplete && onActionComplete();
      }
    } catch (error) {
      setError("Error al rechazar la carga");
    }
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
            <button
              onClick={handleAprobar}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Rendir
            </button>
          </div>
        )}

        {/* Formulario de rechazo */}
        {mostrarRechazo && (
          <div className="p-6 border-t border-gray-200 bg-red-50">
            <h4 className="text-lg font-semibold text-red-800 mb-3">
              Rechazar Carga
            </h4>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ingrese el motivo del rechazo..."
              className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
            />
            <div className="flex items-center justify-end space-x-3 mt-3">
              <button
                onClick={() => {
                  setMostrarRechazo(false);
                  setMotivoRechazo("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleCargaModal;
