import React, { useState, useEffect, useContext } from 'react';
import { 
  FaGasPump, 
  FaTimes, 
  FaTruck, 
  FaExclamationTriangle,
  FaSpinner,
  FaChartBar,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaLayerGroup,
  FaWarehouse,
  FaTachometerAlt
} from 'react-icons/fa';
import { RiOilFill } from 'react-icons/ri';
import { UserContext } from '../../context/userContext';
import axios from '../../lib/axios';

// Componente para separador de sección (como en SelectorEstanque)
const SeparadorSeccion = ({ icono, titulo, cantidad, color = "blue", stockTotal = null }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`px-3 py-2 text-xs font-medium border-t ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icono}
          <span>{titulo}</span>
        </div>
        <div className="text-right">
          <span className="text-xs">
            {cantidad} estanque{cantidad !== 1 ? 's' : ''}
          </span>
          {stockTotal !== null && (
            <div className="text-xs font-semibold mt-1">
              Total: {stockTotal.toLocaleString()} L
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de estanque estilo SelectorEstanque
const EstanqueTarjeta = ({ estanque }) => {
  // Calcular barra de progreso
  const porcentaje = Math.min(Math.round((parseFloat(estanque.stock_actual) / parseFloat(estanque.capacidad)) * 100), 100);
  
  // Función para obtener color de barra de progreso
  const getColorBarra = (nivel) => {
    if (nivel < 20) return "bg-red-500";
    if (nivel < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getColorTexto = (nivel) => {
    if (nivel < 20) return "text-red-600";
    if (nivel < 50) return "text-yellow-600";
    return "text-green-600";
  };

  const esMovil = estanque.tipo === 'movil';
  
  // Determinar el estado del stock
  const estadoStock = porcentaje < 20 
    ? { label: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50', icon: FaTimesCircle }
    : porcentaje < 50 
    ? { label: 'Medio', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: FaExclamationTriangle }
    : { label: 'Óptimo', color: 'text-green-600', bgColor: 'bg-green-50', icon: FaCheckCircle };

  const IconoEstado = estadoStock.icon;

  return (
    <div className="border rounded-lg p-3 bg-white hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Ícono del tipo de estanque */}
          <div className="flex-shrink-0 pt-1">
            {esMovil ? (
              <FaTruck className="text-amber-600" size={16} />
            ) : (
              <FaWarehouse className="text-blue-600" size={16} />
            )}
          </div>

          {/* Información del estanque */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {estanque.nombre || `Estanque ${estanque.id_estanque}`}
              </h4>
              <div className="flex items-center space-x-2">
                {/* Estado del stock */}
                <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${estadoStock.bgColor}`}>
                  <IconoEstado size={10} className={estadoStock.color} />
                  <span className={`font-medium ${estadoStock.color}`}>
                    {estadoStock.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de capacidad y stock */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Stock actual:</span>
                <span className="font-medium">{parseFloat(estanque.stock_actual).toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span>Capacidad total:</span>
                <span className="font-medium">{parseFloat(estanque.capacidad).toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span>Nivel:</span>
                <span className={`font-medium ${getColorTexto(porcentaje)}`}>
                  {porcentaje}%
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getColorBarra(porcentaje)}`}
                  style={{ width: `${Math.max(porcentaje, 2)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge de tipo */}
        <div className="flex-shrink-0 ml-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            esMovil ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {esMovil ? 'Móvil' : 'Fijo'}
          </span>
        </div>
      </div>
    </div>
  );
};

const StockEstanquesFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [estanques, setEstanques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  // Función para obtener el stock de estanques
  const fetchEstanques = async () => {
    if (!user?.id_faena) {
      setError('No se pudo obtener la información de la faena');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/trasvasijes/datos-formulario?id_faena=${user.id_faena}`);
      
      if (response.data?.success) {
        const todosLosEstanques = [
          ...(response.data.data.estanques_fijos || []),
          ...(response.data.data.estanques_moviles || [])
        ];
        setEstanques(todosLosEstanques);
      } else {
        setError('No se pudieron cargar los datos de estanques');
      }
    } catch (err) {
      console.error('Error al cargar estanques:', err);
      setError('Error al cargar datos de estanques');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchEstanques();
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      // Fix para navegadores móviles - establecer altura fija
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    } else {
      // Restaurar scroll del body cuando el modal se cierra
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, user?.id_faena]);

  // Funciones de utilidad
  const calcularPorcentaje = (stock, capacidad) => {
    if (!capacidad || capacidad === 0) return 0;
    return Math.min(100, (parseFloat(stock) / parseFloat(capacidad)) * 100);
  };

  // 🆕 FUNCIÓN PARA ORDENAR POR NOMBRE (1, 2, 3, 4, etc.)
  const ordenarPorNombre = (a, b) => {
    // Extraer números del nombre si existen
    const extraerNumero = (nombre) => {
      if (!nombre) return 0;
      const match = nombre.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const numeroA = extraerNumero(a.nombre);
    const numeroB = extraerNumero(b.nombre);

    // Si ambos tienen números, ordenar por número
    if (numeroA > 0 && numeroB > 0) {
      return numeroA - numeroB;
    }

    // Si solo uno tiene número, el que tiene número va primero
    if (numeroA > 0 && numeroB === 0) return -1;
    if (numeroA === 0 && numeroB > 0) return 1;

    // Si ninguno tiene número, ordenar alfabéticamente
    return (a.nombre || '').localeCompare(b.nombre || '');
  };

  // Separar estanques por tipo y ordenar por nombre
  const estanquesAgrupados = React.useMemo(() => {
    const fijos = estanques.filter(e => e.tipo === 'fijo');
    const moviles = estanques.filter(e => e.tipo === 'movil');

    // 🆕 ORDENAR POR NOMBRE en lugar de por stock
    fijos.sort(ordenarPorNombre);
    moviles.sort(ordenarPorNombre);

    return { fijos, moviles };
  }, [estanques]);

  // 🆕 CALCULAR SUMATORIAS
  const calcularSumatorias = React.useMemo(() => {
    const stockTotalFijos = estanquesAgrupados.fijos.reduce((total, estanque) => 
      total + parseFloat(estanque.stock_actual || 0), 0
    );
    
    const stockTotalMoviles = estanquesAgrupados.moviles.reduce((total, estanque) => 
      total + parseFloat(estanque.stock_actual || 0), 0
    );
    
    const stockTotalGeneral = stockTotalFijos + stockTotalMoviles;

    const capacidadTotalFijos = estanquesAgrupados.fijos.reduce((total, estanque) => 
      total + parseFloat(estanque.capacidad || 0), 0
    );
    
    const capacidadTotalMoviles = estanquesAgrupados.moviles.reduce((total, estanque) => 
      total + parseFloat(estanque.capacidad || 0), 0
    );
    
    const capacidadTotalGeneral = capacidadTotalFijos + capacidadTotalMoviles;

    return {
      stockTotalFijos,
      stockTotalMoviles,
      stockTotalGeneral,
      capacidadTotalFijos,
      capacidadTotalMoviles,
      capacidadTotalGeneral,
      porcentajeTotalGeneral: capacidadTotalGeneral > 0 ? 
        Math.round((stockTotalGeneral / capacidadTotalGeneral) * 100) : 0
    };
  }, [estanquesAgrupados]);

  // Calcular estadísticas globales
  const totalStockCritico = estanques.filter(e => calcularPorcentaje(e.stock_actual, e.capacidad) < 20).length;
  const totalStockMedio = estanques.filter(e => {
    const porcentaje = calcularPorcentaje(e.stock_actual, e.capacidad);
    return porcentaje >= 20 && porcentaje < 50;
  }).length;
  const totalStockOptimo = estanques.filter(e => calcularPorcentaje(e.stock_actual, e.capacidad) >= 50).length;
  const hayAlertas = totalStockCritico > 0;

  // Obtener nombre de la faena
  const getNombreFaena = () => {
    if (user?.faena?.ubicacion) return user.faena.ubicacion;
    if (user?.nombre_faena) return user.nombre_faena;
    return 'Faena no identificada';
  };

  return (
    <>
      {/* Botón FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center ${
          hayAlertas 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-orange-600 hover:bg-orange-700'
        } text-white`}
      >
        <FaGasPump size={24} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-transparent bg-opacity-50 transition-opacity backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-orange-600 text-white p-4 rounded-t-xl sm:rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <RiOilFill size={24} />
                  <div>
                    <h2 className="text-lg font-bold">Stock de Estanques</h2>
                    <p className="text-sm text-orange-100">{getNombreFaena()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* 🆕 RESUMEN GENERAL CON SUMATORIA */}
              <div className="mt-4 bg-orange-700 rounded-lg p-3">
                <div className="grid  gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {calcularSumatorias.stockTotalGeneral.toLocaleString()}
                    </div>
                    <div className="text-xs text-orange-200">Litros Totales</div>
                  </div>
                  
                </div>
                
                {/* Barra de progreso general */}
                <div className="mt-2">
                  <div className="w-full bg-orange-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-white transition-all duration-300"
                      style={{ width: `${Math.max(calcularSumatorias.porcentajeTotalGeneral, 2)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Estadísticas por estado */}
                {estanques.length > 0 && (
                  <div className="mt-3 flex justify-between text-xs text-orange-100">
                    <span>✅ Óptimo: {totalStockOptimo}</span>
                    <span>⚠️ Medio: {totalStockMedio}</span>
                    <span>🔴 Crítico: {totalStockCritico}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body - Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaSpinner className="text-4xl text-orange-600 animate-spin mb-4" />
                  <p className="text-gray-600">Cargando información de estanques...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={fetchEstanques}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : estanques.length === 0 ? (
                <div className="text-center py-12">
                  <FaInfoCircle className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron estanques en esta faena</p>
                </div>
              ) : (
                <div>
                  {/* Estanques Fijos */}
                  {estanquesAgrupados.fijos.length > 0 && (
                    <>
                      <SeparadorSeccion
                        icono={<FaWarehouse className="text-blue-600" size={14} />}
                        titulo="Estanques Fijos"
                        cantidad={estanquesAgrupados.fijos.length}
                        color="blue"
                        stockTotal={calcularSumatorias.stockTotalFijos}
                      />
                      <div className="p-2 sm:p-3 grid gap-2 sm:gap-3 grid-cols-1">
                        {estanquesAgrupados.fijos.map((estanque) => (
                          <EstanqueTarjeta key={estanque.id_estanque} estanque={estanque} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Estanques Móviles */}
                  {estanquesAgrupados.moviles.length > 0 && (
                    <>
                      <SeparadorSeccion
                        icono={<FaTruck className="text-amber-600" size={14} />}
                        titulo="Estanques Móviles"
                        cantidad={estanquesAgrupados.moviles.length}
                        color="amber"
                        stockTotal={calcularSumatorias.stockTotalMoviles}
                      />
                      <div className="p-2 sm:p-3 grid gap-2 sm:gap-3 grid-cols-1">
                        {estanquesAgrupados.moviles.map((estanque) => (
                          <EstanqueTarjeta key={estanque.id_estanque} estanque={estanque} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer con botón de actualizar */}
            <div className="bg-gray-50 p-3 border-t flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Actualizado: {new Date().toLocaleTimeString('es-CL')}
                </span>
                <button
                  onClick={fetchEstanques}
                  disabled={loading}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center space-x-2 text-sm"
                >
                  <FaSpinner className={loading ? 'animate-spin' : ''} size={14} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StockEstanquesFAB;