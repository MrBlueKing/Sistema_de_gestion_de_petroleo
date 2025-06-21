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
  FaWarehouse
} from 'react-icons/fa';
import { RiOilFill } from 'react-icons/ri';
import { UserContext } from '../../context/userContext';
import axios from '../../lib/axios';

// Componente para separador de sección (como en SelectorEstanque)
const SeparadorSeccion = ({ icono, titulo, cantidad, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`px-3 py-2 text-xs font-medium border-t ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icono}
          <span>{titulo}</span>
        </div>
        <span className="text-xs">
          {cantidad} estanque{cantidad !== 1 ? 's' : ''}
        </span>
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
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {estanque.nombre}
            </h4>

            {/* Barra de progreso */}
            <div className="mt-2 mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Stock</span>
                <span className={`text-xs font-medium ${getColorTexto(porcentaje)}`}>
                  {porcentaje}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getColorBarra(porcentaje)}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>

            {/* Información detallada */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Stock actual:</span>
                <span className={`font-medium ${getColorTexto(porcentaje)}`}>
                  {parseFloat(estanque.stock_actual).toLocaleString('es-CL')} L
                </span>
              </div>
              <div className="flex justify-between">
                <span>Capacidad:</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(estanque.capacidad).toLocaleString('es-CL')} L
                </span>
              </div>
              <div className="flex justify-between">
                <span>Disponible:</span>
                <span className="font-medium text-gray-900">
                  {(parseFloat(estanque.capacidad) - parseFloat(estanque.stock_actual)).toLocaleString('es-CL')} L
                </span>
              </div>
              {estanque.altura_actual && (
                <div className="flex justify-between">
                  <span>Altura:</span>
                  <span className="font-medium text-gray-900">
                    {parseFloat(estanque.altura_actual).toFixed(2)} cm
                  </span>
                </div>
              )}
            </div>

            {/* Badge de estado del stock */}
            <div className={`mt-2 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${estadoStock.bgColor} ${estadoStock.color}`}>
              <IconoEstado size={12} />
              <span>{estadoStock.label}</span>
            </div>
          </div>
        </div>

        {/* Tipo de estanque badge */}
        <div className="flex-shrink-0 ml-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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

  // Separar estanques por tipo usando el campo 'tipo' de la API
  const estanquesAgrupados = React.useMemo(() => {
    const fijos = estanques.filter(e => e.tipo === 'fijo');
    const moviles = estanques.filter(e => e.tipo === 'movil');

    // Ordenar por porcentaje de stock (menor primero para identificar críticos)
    const ordenarPorStock = (a, b) => {
      const porcentajeA = calcularPorcentaje(a.stock_actual, a.capacidad);
      const porcentajeB = calcularPorcentaje(b.stock_actual, b.capacidad);
      return porcentajeA - porcentajeB;
    };

    fijos.sort(ordenarPorStock);
    moviles.sort(ordenarPorStock);

    return { fijos, moviles };
  }, [estanques]);

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
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-orange-600 hover:bg-orange-700'
        } text-white`}
        aria-label="Ver stock de estanques"
      >
        <FaGasPump className="text-xl" />
        {hayAlertas && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{totalStockCritico}</span>
          </div>
        )}
      </button>

      {/* Modal/Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaChartBar className="text-lg sm:text-2xl" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Stock de Estanques</h2>
                    <p className="text-orange-100 text-xs sm:text-sm">{getNombreFaena()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-orange-800 rounded-lg transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Estadísticas rápidas */}
              {estanques.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-1 sm:gap-3">
                  <div className="text-center">
                    <div className="text-sm sm:text-xl font-bold">{estanques.length}</div>
                    <div className="text-xs text-orange-100">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-xl font-bold text-green-300">
                      {totalStockOptimo}
                    </div>
                    <div className="text-xs text-orange-100">Óptimo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-xl font-bold text-yellow-300">
                      {totalStockMedio}
                    </div>
                    <div className="text-xs text-orange-100">Medio</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm sm:text-xl font-bold ${totalStockCritico > 0 ? 'text-red-300' : 'text-green-300'}`}>
                      {totalStockCritico}
                    </div>
                    <div className="text-xs text-orange-100">Crítico</div>
                  </div>
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-12">
                  <FaSpinner className="text-4xl text-orange-500 mx-auto mb-4 animate-spin" />
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
                  <FaSpinner className={loading ? 'animate-spin' : ''} />
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