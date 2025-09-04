// components/organisms/OperadorVehiculo/HistorialUsuario.jsx
import React, { useState, useMemo } from 'react';
import { FaHistory, FaGasPump, FaTruck, FaCalendarAlt, FaMapMarkerAlt, FaFileInvoiceDollar, FaDollarSign, FaCheckCircle, FaClock, FaTimes, FaChartLine, FaUser } from 'react-icons/fa';
import { useHistorialUsuario } from '../../hook/OperadorVehiculo/useHistorialUsuario';
import PageControl from '../molecules/PageControl'; // 🆕 Importar PageControl

const HistorialUsuarioOperadorVehiculo = ({ recargarKey = 0 }) => {
  const {
    loading,
    error,
    cargas,
    ultimaCarga,
    totalCargas,
    estadisticasMes,
    hayCargas,
    cargasPendientes,
    cargasAprobadas,
    cargasRendidas,
    cargarMisCargas
  } = useHistorialUsuario();

  // 🆕 ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  // Cargar al montar el componente
  React.useEffect(() => {
    cargarMisCargas(50); // Cargar más datos para la paginación
  }, [cargarMisCargas, recargarKey]);

  // 🆕 LÓGICA DE PAGINACIÓN
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    return cargas.slice(inicio, fin);
  }, [cargas, paginaActual]);

  const totalPaginas = Math.ceil(cargas.length / ITEMS_POR_PAGINA);

  // 🆕 FUNCIÓN PARA CAMBIAR PÁGINA
  const handleCambioPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: -250, behavior: 'smooth' });
  };

  // 🆕 RESETEAR PÁGINA CUANDO CAMBIEN LOS DATOS
  React.useEffect(() => {
    setPaginaActual(1);
  }, [cargas.length, recargarKey]);

  // Función para refrescar manualmente
  const refrescarHistorial = (limite = 50) => {
    setPaginaActual(1); // Reset página al refrescar
    cargarMisCargas(limite);
  };

  // 🎨 FUNCIÓN PARA OBTENER ESTILO DE ESTADO
  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: <FaCheckCircle className="text-green-600" />
        };
      case 'Por Rendir':
      case 'Pendiente':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: <FaClock className="text-yellow-600" />
        };
      case 'Rendido':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: <FaCheckCircle className="text-blue-600" />
        };
      case 'Rechazado':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: <FaTimes className="text-red-600" />
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: <FaClock className="text-gray-600" />
        };
    }
  };

  // 💼 COMPONENTE PARA ESTADÍSTICAS DEL MES - CORREGIDO
  const EstadisticasMesuales = () => {
    // ✅ VALIDACIÓN: Verificar que estadisticasMes existe y tiene datos
    if (!estadisticasMes || !estadisticasMes.total_mes || estadisticasMes.total_mes === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <FaChartLine className="text-blue-400 text-2xl mx-auto mb-2" />
            <p className="text-sm text-blue-600">
              Sin cargas registradas este mes
            </p>
          </div>
        </div>
      );
    }

    // ✅ USAR LA ESTRUCTURA REAL DEL BACKEND
    const { 
      total_mes = 0, 
      litros_mes = 0, 
      costo_mes = 0,
      pendientes = 0,
      aprobadas = 0,
      rechazadas = 0
    } = estadisticasMes;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaChartLine className="text-blue-500" />
          Mis Estadísticas del Mes
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              {total_mes.toLocaleString()}
            </div>
            <div className="text-xs text-blue-500 font-medium">Cargas</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {litros_mes.toLocaleString()} L
            </div>
            <div className="text-xs text-green-500 font-medium">Litros</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">
              ${costo_mes.toLocaleString()}
            </div>
            <div className="text-xs text-purple-500 font-medium">Costo Total</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">
              {total_mes > 0 ? Math.round(litros_mes / total_mes) : 0} L
            </div>
            <div className="text-xs text-orange-500 font-medium">Promedio</div>
          </div>
        </div>

        {/* Estadísticas por estado */}
        {(pendientes > 0 || aprobadas > 0 || rechazadas > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Por Estado:</h5>
            <div className="flex gap-4 text-sm">
              {aprobadas > 0 && (
                <span className="text-green-600 font-medium">
                  {aprobadas} Aprobadas
                </span>
              )}
              {pendientes > 0 && (
                <span className="text-yellow-600 font-medium">
                  {pendientes} Pendientes
                </span>
              )}
              {rechazadas > 0 && (
                <span className="text-red-600 font-medium">
                  {rechazadas} Rechazadas
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 📋 COMPONENTE PARA TARJETA DE CARGA
  const TarjetaCarga = ({ carga, index }) => {
    const estiloEstado = getEstadoStyle(carga.estado);
    
    return (
      <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-all hover:shadow-md">
        {/* Header de la carga */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <FaFileInvoiceDollar className="text-blue-500" />
            <div>
              <h4 className="font-semibold text-gray-800">
                Boleta: {carga.numero_boleta}
              </h4>
              <p className="text-xs text-gray-500">{carga.fecha_legible}</p>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${estiloEstado.bg} ${estiloEstado.text} ${estiloEstado.border}`}>
            {estiloEstado.icon}
            {carga.estado}
          </div>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <FaGasPump className="text-green-500 text-sm" />
            <div>
              <div className="font-semibold text-gray-800">
                {parseFloat(carga.litros).toLocaleString()} L
              </div>
              <div className="text-xs text-gray-500">{carga.tipo_combustible}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-purple-500 text-sm" />
            <div>
              <div className="font-semibold text-gray-800">
                ${parseFloat(carga.costo).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                ${parseFloat(carga.precio_por_litro).toLocaleString()}/L
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación y observaciones */}
        {(carga.ubicacion || carga.observaciones) && (
          <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
            {carga.ubicacion && (
              <div className="flex items-start gap-2 mb-1">
                <FaMapMarkerAlt className="text-gray-400 text-xs mt-1" />
                <span>{carga.ubicacion}</span>
              </div>
            )}
            {carga.observaciones && (
              <div className="text-xs text-gray-500 italic mt-1">
                "{carga.observaciones}"
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tu historial de cargas...</p>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error al cargar historial</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => refrescarHistorial(50)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header del historial */}
        <div className="text-center mb-6">
          <FaUser className="text-blue-500 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800">
            Mi Historial de Cargas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {hayCargas 
              ? `${totalCargas} cargas registradas - Última: ${ultimaCarga?.fecha_legible}`
              : 'No tienes cargas registradas aún'
            }
          </p>
        </div>

        {/* Estadísticas del mes */}
        <EstadisticasMesuales />

        {/* Lista de cargas */}
        {hayCargas ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <FaHistory className="text-blue-500" />
                Cargas Recientes
                {/* 🆕 Indicador de página */}
                <span className="text-sm text-gray-500 font-normal">
                  (Página {paginaActual} de {totalPaginas})
                </span>
              </h4>
              <button
                onClick={() => refrescarHistorial(50)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                Actualizar
              </button>
            </div>

            {/* 🆕 INFO DE PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
                Mostrando {((paginaActual - 1) * ITEMS_POR_PAGINA) + 1} - {Math.min(paginaActual * ITEMS_POR_PAGINA, cargas.length)} de {cargas.length} cargas
              </div>
            )}

            {/* Grid de cargas PAGINADAS */}
            <div className="space-y-3">
              {datosPaginados.map((carga, index) => (
                <TarjetaCarga 
                  key={`${carga.id}-${index}`} 
                  carga={carga} 
                  index={index} 
                />
              ))}
            </div>

            {/* 🆕 COMPONENTE DE PAGINACIÓN - SIEMPRE VISIBLE PARA TEST */}
            <div className="mt-6 pt-4 border-t border-gray-200 bg-yellow-50 p-4 rounded-lg">
              <div className="text-center mb-2 text-sm text-gray-600">
                Debug: {cargas.length} cargas, {totalPaginas} páginas, página {paginaActual}
              </div>
              {cargas.length > ITEMS_POR_PAGINA ? (
                <PageControl
                  currentPage={paginaActual}
                  totalPages={totalPaginas}
                  onPageChange={handleCambioPagina}
                  colorScheme="blue"
                />
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  Paginación no necesaria ({cargas.length} ≤ {ITEMS_POR_PAGINA})
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Estado vacío */
          <div className="text-center py-12">
            <FaGasPump className="text-gray-300 text-5xl mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              Sin cargas registradas
            </h4>
            <p className="text-gray-500 text-sm mb-6">
              Cuando registres tu primera carga de combustible, aparecerá aquí.
            </p>
            <button
              onClick={() => refrescarHistorial(50)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialUsuarioOperadorVehiculo;