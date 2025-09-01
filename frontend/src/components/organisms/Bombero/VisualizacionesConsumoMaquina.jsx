import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaTruck, FaCalendarAlt, FaGasPump, FaChartLine,
  FaClock, FaExchangeAlt, FaChevronDown, FaChevronUp,
  FaInfoCircle, FaSpinner, FaFilter, FaEye,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';

// 🎨 CONFIGURACIÓN DE COLORES POR FAENA
const FAENA_COLORS = {
  'Cabildo': {
    primary: '#16a34a', // verde
    light: '#dcfce7',
    border: '#bbf7d0',
    icon: '🌿'
  },
  'Tiltil': {
    primary: '#dc2626', // rojo
    light: '#fee2e2',
    border: '#fecaca',
    icon: '🏔️'
  },
  'Estacion de Servicio': {
    primary: '#2986CC', // AZUL
    light: '#dcfce7',
    border: '#bbf7d0',
    icon: '⛽'
    }
};

// 🎨 COLORES PARA GRÁFICOS
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

// 🔧 CONFIGURACIÓN DE PAGINACIÓN
const ITEMS_PER_PAGE = 10;

// 📄 COMPONENTE DE PAGINACIÓN
const Pagination = React.memo(({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage = ITEMS_PER_PAGE
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startItem}</span> a{" "}
        <span className="font-medium">{endItem}</span> de{" "}
        <span className="font-medium">{totalItems}</span> resultados
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
            }`}
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {getPageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                ? "bg-blue-600 text-white"
                : page === '...'
                  ? "text-gray-400 cursor-default"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
            }`}
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

// Componente principal de visualizaciones
const VisualizacionesConsumoMaquina = ({
  consumos = [],
  stats = {},
  filters = {},
  selectedFaenas = [],
  loading = false,
  error = null,
  formatearFecha,
  formatNumber,
  user = null,
  maquinasDisponibles = []
}) => {
  const [vistaActiva, setVistaActiva] = useState('timeline');
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('');
  
  // 🆕 ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);

  // 🚨 VALIDACIONES INICIALES
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-lg">
        <FaSpinner className="animate-spin text-orange-600 text-3xl mr-3" />
        <span className="text-gray-600 font-medium">Cargando visualizaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-8 text-center shadow-lg border border-red-200">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!consumos || consumos.length === 0) {
    console.log("Datos de consumo:", consumos);
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center shadow-lg">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin datos para visualizar</h3>
        <p className="text-gray-600">
          {selectedFaenas.length === 0
            ? "Selecciona al menos una faena para ver los gráficos"
            : Object.keys(filters).some(key => filters[key])
              ? "No hay consumos que coincidan con los filtros aplicados"
              : "No hay consumos disponibles para crear gráficos"
          }
        </p>
      </div>
    );
  }

  // 🔧 PROCESAMIENTO DE DATOS MEJORADO
  const datosProcesados = useMemo(() => {
    if (!consumos || consumos.length === 0) return [];

    const datos = consumos.map(item => ({
      ...item,
      fecha: new Date(item.fecha_consumo),
      fechaFormateada: formatearFecha ?
        formatearFecha(item.fecha_consumo).fecha :
        new Date(item.fecha_consumo).toLocaleDateString('es-CL'),
      horaFormateada: formatearFecha ?
        formatearFecha(item.fecha_consumo).hora :
        new Date(item.fecha_consumo).toLocaleTimeString('es-CL'),
      litros: parseFloat(item.litros_consumidos || 0),
      faena: item.faena,
      medicion: parseFloat(item.medicion || 0),
      maquina: item.nombre_maquina || 'Sin nombre',
      patente: item.patente || 'Sin patente',
      id: item.id_consumo || item.id || Math.random(),
      solicitante: item.solicitante_nombre || 'N/A'
    }));

    console.log("DATOS PROCESADOS:", datos.slice(0, 3));
    return datos.sort((a, b) => b.fecha - a.fecha);
  }, [consumos, formatearFecha]);

  // 🔍 DATOS FILTRADOS - AHORA MUESTRA TODOS (SIN LÍMITE DE 10)
  const datosFiltrados = useMemo(() => {
    let datos = datosProcesados;

    if (maquinaSeleccionada && maquinaSeleccionada.trim() !== '') {
      datos = datosProcesados.filter(item =>
        item.maquina === maquinaSeleccionada
      );

      console.log(`🔍 Filtrado por máquina "${maquinaSeleccionada}":`, {
        totalOriginal: datosProcesados.length,
        filtradosPorMaquina: datos.length
      });
    }

    console.log(`📊 Datos disponibles para visualización:`, {
      totalDisponible: datos.length,
      conPaginacion: true
    });

    return datos;
  }, [datosProcesados, maquinaSeleccionada]);

  // 🆕 PAGINACIÓN DE DATOS PARA LA LÍNEA DE TIEMPO
  const datosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return datosFiltrados.slice(startIndex, endIndex);
  }, [datosFiltrados, currentPage]);

  // 🆕 CÁLCULOS DE PAGINACIÓN
  const totalPages = Math.ceil(datosFiltrados.length / ITEMS_PER_PAGE);
  const totalItems = datosFiltrados.length;

  // 🆕 HANDLER PARA CAMBIO DE PÁGINA
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // 🆕 RESET PÁGINA AL CAMBIAR FILTROS
  useEffect(() => {
    setCurrentPage(1);
  }, [maquinaSeleccionada]);

  // 📈 DATOS PARA LÍNEA DE TIEMPO - AHORA USA DATOS PAGINADOS
  const datosLineaTiempo = useMemo(() => {
    const datos = datosPaginados.map((item, index) => ({
      ...item,
      diaNumero: ((currentPage - 1) * ITEMS_PER_PAGE) + index + 1,
      consumoAcumulado: datosFiltrados
        .slice(0, ((currentPage - 1) * ITEMS_PER_PAGE) + index + 1)
        .reduce((sum, d) => sum + d.litros, 0)
    }));

    return datos;
  }, [datosPaginados, datosFiltrados, currentPage]);

  // 🥧 DATOS PARA GRÁFICO DE DONA - USA TODOS LOS DATOS FILTRADOS (NO PAGINADOS)
  const datosDona = useMemo(() => {
    const porFaena = datosFiltrados.reduce((acc, item) => {
      acc[item.faena] = (acc[item.faena] || 0) + item.litros;
      return acc;
    }, {});

    const totalLitros = Object.values(porFaena).reduce((sum, litros) => sum + litros, 0);

    return Object.entries(porFaena).map(([faena, litros]) => ({
      name: faena,
      value: litros,
      porcentaje: totalLitros > 0 ?
        ((litros / totalLitros) * 100).toFixed(1) : "0"
    }));
  }, [datosFiltrados]);

  // 📊 DATOS PARA BARRAS APILADAS - USA TODOS LOS DATOS FILTRADOS
  const datosBarras = useMemo(() => {
    const porFecha = {};

    datosFiltrados.forEach(item => {
      const fecha = item.fechaFormateada;
      if (!porFecha[fecha]) {
        porFecha[fecha] = { fecha, Cabildo: 0, Tiltil: 0, total: 0 };
      }
      porFecha[fecha][item.faena] = (porFecha[fecha][item.faena] || 0) + item.litros;
      porFecha[fecha].total += item.litros;
    });

    return Object.values(porFecha).sort((a, b) =>
      new Date(a.fecha.split('/').reverse().join('-')) -
      new Date(b.fecha.split('/').reverse().join('-'))
    );
  }, [datosFiltrados]);

  // 📊 ESTADÍSTICAS CALCULADAS - USA TODOS LOS DATOS FILTRADOS
  const estadisticasCalculadas = useMemo(() => {
    const totalLitros = datosFiltrados.reduce((sum, d) => sum + d.litros, 0);
    const visitasCabildo = datosFiltrados.filter(d => d.faena === 'Cabildo').length;
    const visitasTiltil = datosFiltrados.filter(d => d.faena === 'Tiltil').length;
    const promedioConsumo = datosFiltrados.length > 0 ? totalLitros / datosFiltrados.length : 0;

    // Detectar cambios de faena
    let cambiosFaena = 0;
    for (let i = 1; i < datosFiltrados.length; i++) {
      if (datosFiltrados[i].faena !== datosFiltrados[i - 1].faena) {
        cambiosFaena++;
      }
    }

    const maquinasUnicas = [...new Set(datosFiltrados.map(d => d.maquina))];

    return {
      totalLitros: totalLitros.toFixed(0),
      totalCargas: datosFiltrados.length,
      visitasCabildo,
      visitasTiltil,
      cambiosFaena,
      promedioConsumo: promedioConsumo.toFixed(1),
      diasActivo: new Set(datosFiltrados.map(d => d.fechaFormateada)).size,
      maquinasUnicas: maquinasUnicas.length,
      maquinaMasUsada: maquinasUnicas.length > 0 ? maquinasUnicas[0] : 'N/A'
    };
  }, [datosFiltrados]);

  // 🚛 OBTENER MÁQUINAS DISPONIBLES
  const maquinasDisponiblesGraficos = useMemo(() => {
    return maquinasDisponibles.length > 0 ? maquinasDisponibles : [...new Set(datosProcesados.map(d => d.maquina))].sort();
  }, [datosProcesados, maquinasDisponibles]);

  // 🎨 COMPONENTE: LÍNEA DE TIEMPO MEJORADA CON PAGINACIÓN
  const LineaTiempoComponent = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaClock className="text-blue-600" />
          {maquinaSeleccionada
            ? `Últimos Consumos - ${maquinaSeleccionada}`
            : 'Recorrido Temporal entre Faenas'
          }
        </h3>
        <div className="text-sm text-gray-500 space-y-1">
          <div>Página {currentPage} de {totalPages}</div>
          <div>{totalItems} registros totales</div>
        </div>
      </div>

      {datosLineaTiempo.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaInfoCircle className="text-2xl mb-2 mx-auto" />
          <p>No hay datos para mostrar en esta página</p>
          <p className="text-sm mt-1">
            {maquinaSeleccionada
              ? `No se encontraron consumos para "${maquinaSeleccionada}"`
              : "Ajusta los filtros para ver resultados"
            }
          </p>
        </div>
      ) : (
        <>
          {/* 🎨 LÍNEA DE TIEMPO VISUAL HERMOSA (de la segunda versión) */}
          <div className="relative mb-6">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200"></div>

            <div className="relative flex justify-start gap-3 overflow-x-auto pb-4 min-h-[120px] scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
              {datosLineaTiempo.map((item, index) => (
                <div key={item.id} className="flex flex-col items-center min-w-[100px] mx-1">
                  {/* Marcador de faena */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                    shadow-lg transform hover:scale-110 transition-all cursor-pointer
                    relative z-10
                  `} style={{ backgroundColor: FAENA_COLORS[item.faena]?.primary || '#6b7280' }}>
                    <span className="text-lg">{FAENA_COLORS[item.faena]?.icon || '📍'}</span>
                  </div>

                  {/* Información del consumo */}
                  <div className="mt-2 text-center">
                    <div className="text-xs text-gray-500">{item.fechaFormateada}</div>
                    <div className="text-xs text-gray-400">{item.horaFormateada}</div>
                    <div className="font-bold text-sm text-orange-600">{item.litros.toFixed(0)} L</div>
                    {item.patente && (
                      <div className="text-xs text-gray-600">{item.patente}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🎨 DETALLES DE LOS CONSUMOS (tarjetas bonitas de la segunda versión) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <FaEye className="text-green-600" />
              Detalle de Consumos {maquinaSeleccionada && `(${maquinaSeleccionada})`}
            </h4>

            {datosLineaTiempo.map((item, index) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border-l-4 ${item.faena === 'Cabildo' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{FAENA_COLORS[item.faena]?.icon || '📍'}</span>
                      <span className="font-semibold text-gray-800">{item.faena}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        #{((currentPage - 1) * ITEMS_PER_PAGE) + index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Fecha</div>
                        <div className="font-medium">{item.fechaFormateada}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Hora</div>
                        <div className="font-medium">{item.horaFormateada}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Solicitante</div>
                        <div className="font-medium truncate" title={item.solicitante}>
                          {item.solicitante}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Patente</div>
                        <div className="font-medium">{item.patente}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {item.litros.toFixed(1)} L
                    </div>
                    {item.consumoAcumulado && (
                      <div className="text-xs text-gray-500">
                        Acum: {item.consumoAcumulado.toFixed(1)} L
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🎨 RESUMEN POR FAENA (de la segunda versión) */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌿</span>
                <span className="font-semibold text-green-800">Cabildo</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  {estadisticasCalculadas.visitasCabildo} Cargas
                </div>
                <div className="font-bold text-green-600 text-lg">
                  {datosDona.find(d => d.name === 'Cabildo')?.value?.toFixed(0) || 0} L
                </div>
                <div className="text-xs text-green-700">
                  {datosDona.find(d => d.name === 'Cabildo')?.porcentaje || 0}% del total
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏔️</span>
                <span className="font-semibold text-red-800">Tiltil</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  {estadisticasCalculadas.visitasTiltil} Cargas
                </div>
                <div className="font-bold text-red-600 text-lg">
                  {datosDona.find(d => d.name === 'Tiltil')?.value?.toFixed(0) || 0} L
                </div>
                <div className="text-xs text-red-700">
                  {datosDona.find(d => d.name === 'Tiltil')?.porcentaje || 0}% del total
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 COMPONENTE DE PAGINACIÓN */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );

  // 🥧 COMPONENTE: GRÁFICO DE DONA MEJORADO (de la segunda versión)
  const DonaDobleComponent = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaChartLine className="text-purple-600" />
          Distribución de Consumo
          {maquinaSeleccionada && (
            <span className="text-sm font-normal text-gray-600">
              - {maquinaSeleccionada}
            </span>
          )}
        </h3>
        <span className="text-sm text-gray-500">
          Total: {estadisticasCalculadas.totalLitros} L ({totalItems} registros)
        </span>
      </div>

      {datosDona.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaInfoCircle className="text-2xl mb-2 mx-auto" />
          <p>No hay datos para mostrar la distribución</p>
          <p className="text-sm mt-1">
            {maquinaSeleccionada
              ? `La máquina "${maquinaSeleccionada}" no tiene consumos`
              : "Ajusta los filtros para ver resultados"
            }
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center justify-around">
          {/* Gráfico de dona */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosDona}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {datosDona.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={FAENA_COLORS[entry.name]?.primary || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${parseFloat(value).toFixed(1)} L`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Leyenda personalizada */}
          <div className="mt-4 lg:mt-0 lg:ml-6 space-y-3">
            {datosDona.map((item) => (
              <div key={item.name} className="flex items-center justify-between min-w-[250px] p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: FAENA_COLORS[item.name]?.primary || '#278ef5' }}
                  />
                  <div>
                    <span className="font-semibold text-gray-800">{item.name}</span>
                    <span className="text-xl ml-2">{FAENA_COLORS[item.name]?.icon || '📍'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{parseFloat(item.value).toFixed(1)} L</div>
                  <div className="text-sm text-gray-600">{item.porcentaje}% del total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores adicionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
        <div className="text-center bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{estadisticasCalculadas.totalCargas}</div>
          <div className="text-xs text-gray-600">Cargas totales</div>
        </div>
        <div className="text-center bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{estadisticasCalculadas.promedioConsumo} L</div>
          <div className="text-xs text-gray-600">Promedio/carga</div>
        </div>
        <div className="text-center bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">{estadisticasCalculadas.diasActivo}</div>
          <div className="text-xs text-gray-600">Días activo</div>
        </div>
        <div className="text-center bg-orange-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">{estadisticasCalculadas.maquinasUnicas}</div>
          <div className="text-xs text-gray-600">Máquinas únicas</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header (de la segunda versión) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              <FaTruck className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Análisis de Recorrido y Consumo
              </h1>
              <p className="text-gray-600">
                {totalItems > 0 ? (
                  <>
                    Mostrando {totalItems} registros
                    {maquinaSeleccionada && ` para ${maquinaSeleccionada}`}
                    {totalItems !== datosProcesados.length &&
                      ` de un total de ${datosProcesados.length}`
                    }
                    {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
                  </>
                ) : (
                  "No hay registros para mostrar"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de vista */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'timeline', label: 'Línea de Tiempo', icon: <FaClock /> },
            { id: 'dona', label: 'Distribución', icon: <FaChartLine /> },
          ].map((vista) => (
            <button
              key={vista.id}
              onClick={() => setVistaActiva(vista.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm ${vistaActiva === vista.id
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                }`}
            >
              {vista.icon}
              <span className="hidden sm:inline">{vista.label}</span>
            </button>
          ))}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="text-blue-600 text-sm">Total Consumido</div>
            <div className="text-2xl font-bold text-blue-800">{estadisticasCalculadas.totalLitros} L</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
            <div className="text-green-600 text-sm">Cargas Cabildo</div>
            <div className="text-2xl font-bold text-green-800">{estadisticasCalculadas.visitasCabildo}</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3">
            <div className="text-red-600 text-sm">Cargas Tiltil</div>
            <div className="text-2xl font-bold text-red-800">{estadisticasCalculadas.visitasTiltil}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
            <div className="text-purple-600 text-sm">Cambios de Faena</div>
            <div className="text-2xl font-bold text-purple-800">{estadisticasCalculadas.cambiosFaena}</div>
          </div>
        </div>
      </div>

      {/* Visualización activa */}
      <div className="transition-all duration-300">
        {vistaActiva === 'timeline' && <LineaTiempoComponent />}
        {vistaActiva === 'dona' && <DonaDobleComponent />}
      </div>
    </div>
  );
};

export default VisualizacionesConsumoMaquina;