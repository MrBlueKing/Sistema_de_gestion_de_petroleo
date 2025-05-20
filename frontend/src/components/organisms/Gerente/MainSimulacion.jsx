import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "../../../lib/axios";
import {
  FiTruck, FiDroplet, FiClock, FiCalendar,
  FiFilter, FiRefreshCw, FiDownload, FiInfo, FiAlertTriangle
} from "react-icons/fi";
import { toPng } from "html-to-image";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";

// Importar el componente de filtros mejorado
import FiltrosComponent from "../../molecules/FiltrosComponent";

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2',
    padding: 5,
  },
  tableCol: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 8,
  },
  image: {
    marginVertical: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
  },
});

// Componente PDF
const ProyeccionPDF = ({ maquina, calculos, periodo, imagenGrafico }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Proyección de Consumo</Text>
      <Text style={styles.subtitle}>{maquina.label}</Text>

      <View style={styles.section}>
        <Text style={styles.text}>
          <Text style={styles.bold}>Período: </Text>
          {periodo.desde} al {periodo.hasta}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Tipo de medición: </Text>
          {maquina.tipo}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Resultados de Cálculos</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Total {maquina.tipo === 'horometro' ? 'Horas' : 'Kilómetros'}: </Text>
          {calculos.totalHoras.toLocaleString()} {maquina.tipo === 'horometro' ? 'h' : 'km'}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Total Consumo: </Text>
          {calculos.totalConsumo.toLocaleString()} L
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Rendimiento: </Text>
          {calculos.rendimiento.toFixed(3)} {maquina.tipo === 'horometro' ? 'h/L' : 'km/L'}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Promedio Diario: </Text>
          {calculos.promedioHoras.toFixed(2)} {maquina.tipo === 'horometro' ? 'h/día' : 'km/día'}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Consumo Simulado Diario: </Text>
          {calculos.consumoSimuladoDiario.toFixed(2)} L/día
        </Text>
      </View>

      {imagenGrafico && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Gráfico de Proyección</Text>
          <Image src={imagenGrafico} style={styles.image} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subtitle}>Proyección</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>Día</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>Fecha</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>{maquina.tipo === 'horometro' ? 'Horas' : 'Km'}</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>Consumo</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>Stock Inicial</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableHeader}>Stock Final</Text>
            </View>
          </View>

          {calculos.simulacion.map((sim, index) => (
            <View key={`pdf-sim-${index}`} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{sim.dia}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{sim.fecha}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{parseFloat(sim.horas).toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{parseFloat(sim.consumo).toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{parseFloat(sim.stock_inicial).toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{parseFloat(sim.stock_final).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>
        Reporte generado el {new Date().toLocaleString()} • Sistema de Proyección de Consumo
      </Text>
    </Page>
  </Document>
);

// Componente principal
function ProyeccionConsumo() {
  // Estados para fechas y selección
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [faenaSeleccionada, setFaenaSeleccionada] = useState('todas');
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
  const [diasProyeccion, setDiasProyeccion] = useState(7);

  // Estados para datos
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [todasLasMaquinas, setTodasLasMaquinas] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [datosProyeccion, setDatosProyeccion] = useState(null);
  const [maquinaDetalles, setMaquinaDetalles] = useState(null);
  const [graficoDataUrl, setGraficoDataUrl] = useState(null);

  // Referencias para exportar
  const graficoRef = useRef(null);

  // Efecto para cargar faenas al inicio
  useEffect(() => {
    const cargarFaenas = async () => {
      try {
        const response = await axios.get("/api/faenas");

        // Verificar la estructura de la respuesta
        console.log("Respuesta faenas:", response);

        // Ajustar según la estructura real de la respuesta
        // La API devuelve directamente un array, no hay .data.data
        if (Array.isArray(response.data)) {
          const opcionesFaenas = [
            { value: "todas", label: "Todas las faenas" },
            ...response.data.map(faena => ({
              value: faena.id_faena.toString(),
              label: faena.ubicacion
            }))
          ];
          setFaenas(opcionesFaenas);
        } else {
          console.error("La respuesta no tiene el formato esperado:", response.data);
          setError("Formato de respuesta de faenas incorrecto");
        }
      } catch (err) {
        console.error("Error al cargar faenas:", err);
        setError("No se pudieron cargar las faenas. Por favor, intente de nuevo.");
      }
    };

    cargarFaenas();
  }, []);

  // Efecto para cargar proyección cuando cambian las fechas o faena
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarDatosProyeccion();
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada, diasProyeccion]);

  // Función para cargar datos de proyección
  const cargarDatosProyeccion = async () => {
    if (!fechaDesde || !fechaHasta) return;

    setCargando(true);
    setError(null);

    try {
      console.log("Cargando proyección con parámetros:", {
        desde: fechaDesde,
        hasta: fechaHasta,
        faena: faenaSeleccionada,
        dias_proyeccion: diasProyeccion
      });

      const response = await axios.get("/api/proyeccion-consumo", {
        params: {
          desde: fechaDesde,
          hasta: fechaHasta,
          faena: faenaSeleccionada,
          dias_proyeccion: diasProyeccion
        }
      });

      console.log("Respuesta proyección:", response);

      if (response.data && response.data.status === "success") {
        setDatosProyeccion(response.data.data);

        // Preparar opciones de máquinas para el selector
        const opcionesMaquinas = response.data.data.maquinas.map(maquina => ({
          value: maquina.id,
          label: `${maquina.nombre} (${maquina.patente || "Sin patente"})`,
          tipo: maquina.tipo_medicion,
          datos: maquina
        }));

        setTodasLasMaquinas(opcionesMaquinas);

        // Si no hay máquina seleccionada o ya no está en la lista, seleccionar la primera
        if (!maquinaSeleccionada || !opcionesMaquinas.find(m => m.value === maquinaSeleccionada.value)) {
          if (opcionesMaquinas.length > 0) {
            setMaquinaSeleccionada(opcionesMaquinas[0]);
            setMaquinaDetalles(opcionesMaquinas[0].datos);
          } else {
            setMaquinaSeleccionada(null);
            setMaquinaDetalles(null);
          }
        }
      } else {
        console.error("Respuesta inválida:", response.data);
        setError("Respuesta inválida del servidor");
      }
    } catch (err) {
      console.error("Error al cargar proyección:", err);
      setError(`Error: ${err.message || "No se pudo cargar la proyección"}`);
    } finally {
      setCargando(false);
    }
  };

  // Manejar cambio de máquina seleccionada
  const handleChangeMaquina = (opcion) => {
    setMaquinaSeleccionada(opcion);
    const maquinaData = datosProyeccion.maquinas.find(m => m.id === opcion.value);
    setMaquinaDetalles(maquinaData);
  };

  // Cálculos para la máquina seleccionada
  const calculos = useMemo(() => {
    if (!maquinaDetalles) return null;

    // Usar los datos calculados por la API, disponibles en datos_totales
    return {
      horometro: maquinaDetalles.detalle_historico.map(d => d.medicion),
      cargas: maquinaDetalles.detalle_historico.map(d => d.carga),
      horasTrabajadas: maquinaDetalles.detalle_historico.map(d => d.horas_trabajadas),
      consumoReal: maquinaDetalles.detalle_historico.map(d => d.consumo_real),
      totalHoras: maquinaDetalles.datos_totales.total_horas_trabajadas,
      totalConsumo: maquinaDetalles.datos_totales.total_consumo_real,
      rendimiento: maquinaDetalles.datos_totales.rendimiento,
      promedioHoras: maquinaDetalles.datos_totales.promedio_horas_diario,
      consumoSimuladoDiario: maquinaDetalles.datos_totales.consumo_simulado_diario,
      simulacion: maquinaDetalles.detalle_proyeccion,
      diasRegistrados: maquinaDetalles.datos_totales.total_registros - 1
    };
  }, [maquinaDetalles]);

  // Datos para gráficos
  const datosGrafico = useMemo(() => {
    if (!calculos) return [];

    // Datos históricos para el gráfico
    const datosHistoricos = maquinaDetalles.detalle_historico.map((d, index) => ({
      dia: `Día ${index + 1}`,
      fecha: d.fecha,
      horas: d.horas_trabajadas || 0,
      consumo: d.consumo_real || 0,
      medicion: d.medicion,
      carga: d.carga,
      stockInicial: index > 0 ?
        parseFloat(maquinaDetalles.detalle_historico[index - 1].carga) - parseFloat(d.consumo_real || 0) :
        parseFloat(d.carga),
      esReal: true
    }));

    // Datos de proyección para el gráfico
    const datosProyeccion = maquinaDetalles.detalle_proyeccion.map(p => ({
      dia: `Día ${p.dia}`,
      fecha: p.fecha,
      horas: parseFloat(p.horas),
      consumo: parseFloat(p.consumo),
      stockInicial: parseFloat(p.stock_inicial),
      stockFinal: parseFloat(p.stock_final),
      esReal: false
    }));

    return [...datosHistoricos, ...datosProyeccion];
  }, [maquinaDetalles, calculos]);

  // Generar imagen del gráfico para PDF
  const generarImagenGrafico = async () => {
    if (!graficoRef.current) return null;

    try {
      const dataUrl = await toPng(graficoRef.current);
      setGraficoDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Error al generar imagen del gráfico:', error);
      return null;
    }
  };

  // Efecto para actualizar imagen del gráfico cuando cambia la máquina seleccionada
  useEffect(() => {
    if (maquinaDetalles && calculos) {
      generarImagenGrafico();
    }
  }, [maquinaDetalles, calculos]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center">
        <FiDroplet className="mr-2" /> Proyección de Consumo de Combustible
      </h1>

      {/* Filtros usando el componente mejorado */}
      <FiltrosComponent
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        faenaSeleccionada={faenaSeleccionada}
        setFaenaSeleccionada={setFaenaSeleccionada}
        faenas={faenas} // Pasamos la lista de faenas al componente
      />

      {/* Control adicional para días de proyección */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días de Proyección</label>
            <input
              type="number"
              value={diasProyeccion}
              onChange={(e) => setDiasProyeccion(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="30"
              className="w-32 p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <button
              onClick={cargarDatosProyeccion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              disabled={cargando || !fechaDesde || !fechaHasta}
            >
              <FiRefreshCw className={`mr-2 ${cargando ? 'animate-spin' : ''}`} />
              {cargando ? 'Cargando...' : 'Actualizar Datos'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta cuando no hay fechas seleccionadas */}
      {(!fechaDesde || !fechaHasta) && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Por favor, seleccione un rango de fechas para ver la proyección de consumo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de máquina */}
      {datosProyeccion && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FiTruck className="mr-2" /> Seleccionar Máquina
          </h2>
          <div className="mb-4">
            <select
              value={maquinaSeleccionada?.value || ''}
              onChange={(e) => {
                const seleccionada = todasLasMaquinas.find(m => m.value === parseInt(e.target.value));
                handleChangeMaquina(seleccionada || todasLasMaquinas[0]);
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              {todasLasMaquinas.map(maquina => (
                <option key={maquina.value} value={maquina.value}>{maquina.label}</option>
              ))}
            </select>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Máquinas</h3>
              <p className="text-2xl font-bold text-blue-800">{datosProyeccion.total_maquinas}</p>
              <div className="text-xs text-blue-600 mt-1">
                <span>{datosProyeccion.maquinas_con_consumo_real} con consumo real</span> •
                <span className="ml-1">{datosProyeccion.maquinas_con_proyeccion} con proyección</span>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-green-700 mb-1">Consumo Total en Período</h3>
              <p className="text-2xl font-bold text-green-800">{datosProyeccion.kpis_globales.consumo_total.toLocaleString()} L</p>
              <div className="text-xs text-green-600 mt-1">
                <span>{datosProyeccion.kpis_globales.consumo_total_real.toLocaleString()} L reales</span> •
                <span className="ml-1">{datosProyeccion.kpis_globales.consumo_total_proyectado.toLocaleString()} L proyectados</span>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-700 mb-1">Rendimiento Promedio</h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-xl font-bold text-purple-800">
                    {datosProyeccion.kpis_globales.rendimiento_promedio_horometro.toLocaleString()} h/L
                  </p>
                  <div className="text-xs text-purple-600">Horómetro</div>
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-800">
                    {datosProyeccion.kpis_globales.rendimiento_promedio_kilometraje.toLocaleString()} km/L
                  </p>
                  <div className="text-xs text-purple-600">Kilometraje</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detalles de máquina seleccionada */}
      {maquinaDetalles && calculos && (
        <div className="mb-6">
          <div className="flex justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <FiClock className="mr-2" /> Detalles de Proyección: {maquinaSeleccionada.label}
            </h2>
            {graficoDataUrl && (
              <PDFDownloadLink
                document={
                  <ProyeccionPDF
                    maquina={maquinaSeleccionada}
                    calculos={calculos}
                    periodo={{
                      desde: fechaDesde,
                      hasta: fechaHasta
                    }}
                    imagenGrafico={graficoDataUrl}
                  />
                }
                fileName={`Proyeccion_${maquinaSeleccionada.value}_${new Date().toISOString().slice(0, 10)}.pdf`}
              >
                {({ blob, url, loading, error }) => (
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    disabled={loading}
                  >
                    <FiDownload className="mr-1" />
                    {loading ? 'Generando...' : 'Exportar PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            )}
          </div>

          {/* Información sobre consumo real vs proyectado para esta máquina */}
          <div className="bg-blue-50 p-4 mb-4 rounded-lg border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Consumo Real</h3>
                <p className="text-2xl font-bold text-blue-700">{maquinaDetalles.datos_en_rango.consumo_real.toLocaleString()} L</p>
                <p className="text-xs text-blue-600">
                  {maquinaDetalles.tipo_medicion === 'horometro'
                    ? `${maquinaDetalles.datos_en_rango.horas_trabajadas.toLocaleString()} horas trabajadas`
                    : `${maquinaDetalles.datos_en_rango.horas_trabajadas.toLocaleString()} km recorridos`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-800 mb-1">Consumo Proyectado</h3>
                <p className="text-2xl font-bold text-indigo-700">{maquinaDetalles.datos_en_rango.consumo_proyectado.toLocaleString()} L</p>
                <p className="text-xs text-indigo-600">
                  {maquinaDetalles.tipo_medicion === 'horometro'
                    ? `${maquinaDetalles.datos_en_rango.horas_proyectadas.toLocaleString()} horas proyectadas`
                    : `${maquinaDetalles.datos_en_rango.horas_proyectadas.toLocaleString()} km proyectados`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-800 mb-1">Consumo Total</h3>
                <p className="text-2xl font-bold text-purple-700">{maquinaDetalles.datos_en_rango.consumo_total.toLocaleString()} L</p>
                <p className="text-xs text-purple-600">
                  {maquinaDetalles.tipo_medicion === 'horometro'
                    ? `${maquinaDetalles.datos_en_rango.horas_totales.toLocaleString()} horas totales`
                    : `${maquinaDetalles.datos_en_rango.horas_totales.toLocaleString()} km totales`}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            {maquinaDetalles.datos_en_rango.consumo_total > 0 && (
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(maquinaDetalles.datos_en_rango.consumo_real / maquinaDetalles.datos_en_rango.consumo_total) * 100}%`,
                      transition: "width 0.5s ease-in-out"
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Real: {((maquinaDetalles.datos_en_rango.consumo_real / maquinaDetalles.datos_en_rango.consumo_total) * 100).toFixed(1)}%</span>
                  <span>Proyectado: {((maquinaDetalles.datos_en_rango.consumo_proyectado / maquinaDetalles.datos_en_rango.consumo_total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de datos y cálculos */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de la máquina */}
              <div>
                <h3 className="text-md font-semibold mb-3 pb-2 border-b">Información de la Máquina</h3>
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">ID:</td>
                      <td className="py-1">{maquinaDetalles.id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Nombre:</td>
                      <td className="py-1">{maquinaDetalles.nombre}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Patente:</td>
                      <td className="py-1">{maquinaDetalles.patente || "Sin patente"}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Tipo de Medición:</td>
                      <td className="py-1 capitalize">{maquinaDetalles.tipo_medicion}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Estado:</td>
                      <td className="py-1">
                        {maquinaDetalles.tiene_consumo_real
                          ? <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Con consumo real</span>
                          : <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Solo proyección</span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Total Registros:</td>
                      <td className="py-1">{calculos.diasRegistrados + 1}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Último Consumo:</td>
                      <td className="py-1">
                        {maquinaDetalles.detalle_historico[maquinaDetalles.detalle_historico.length - 1].fecha}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Resultados de cálculos */}
              <div>
                <h3 className="text-md font-semibold mb-3 pb-2 border-b">Resultados de Cálculos</h3>
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Total {maquinaDetalles.tipo_medicion === 'horometro' ? 'Horas' : 'Kilómetros'}:</td>
                      <td className="py-1">{calculos.totalHoras.toLocaleString()} {maquinaDetalles.tipo_medicion === 'horometro' ? 'h' : 'km'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Total Consumo:</td>
                      <td className="py-1">{calculos.totalConsumo.toLocaleString()} L</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Rendimiento:</td>
                      <td className="py-1">{calculos.rendimiento.toFixed(3)} {maquinaDetalles.tipo_medicion === 'horometro' ? 'h/L' : 'km/L'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Promedio Diario:</td>
                      <td className="py-1">{calculos.promedioHoras.toFixed(2)} {maquinaDetalles.tipo_medicion === 'horometro' ? 'h/día' : 'km/día'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Consumo Simulado Diario:</td>
                      <td className="py-1">{calculos.consumoSimuladoDiario.toFixed(2)} L/día</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Días Proyectados:</td>
                      <td className="py-1">{calculos.simulacion.length}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-gray-600">Stock Actual:</td>
                      <td className="py-1">{(calculos.simulacion[0]?.stock_inicial || 0).toLocaleString()} L</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico */}
            <div ref={graficoRef} className="mt-6 p-4 bg-white rounded-lg border border-gray-100">
              <h3 className="text-md font-semibold mb-4">Gráfico de Consumo y Proyección</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dia"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [value.toLocaleString(), name]}
                      labelFormatter={(label) => `${label}`}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-sm">
                              <p className="font-semibold">{label} ({data.fecha})</p>
                              {payload.map((entry, index) => (
                                <p key={`item-${index}`} style={{ color: entry.color }}>
                                  {entry.name}: {entry.value.toLocaleString()}
                                </p>
                              ))}
                              <p className="text-xs mt-1 text-gray-500">
                                {data.esReal ? 'Datos Reales' : 'Datos Proyectados'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="horas"
                      name={maquinaDetalles.tipo_medicion === 'horometro' ? 'Horas Trabajadas' : 'Km Recorridos'}
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="consumo"
                      name="Consumo (L)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stockInicial"
                      name="Stock Inicial (L)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4 text-sm text-gray-500">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span>{maquinaDetalles.tipo_medicion === 'horometro' ? 'Horas Trabajadas' : 'Km Recorridos'}</span>
                </div>
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Consumo (L)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Stock Inicial (L)</span>
                </div>
              </div>
            </div>

            {/* Tabs para datos históricos y proyección */}
            <div className="mt-6">
              <ul className="flex border-b border-gray-200">
                <li className="mr-1">
                  <button
                    className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold border-l border-t border-r rounded-t"
                    onClick={() => document.getElementById('tab-historico').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Datos Históricos
                  </button>
                </li>
                <li className="mr-1">
                  <button
                    className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold border-l border-t border-r rounded-t"
                    onClick={() => document.getElementById('tab-proyeccion').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Proyección
                  </button>
                </li>
              </ul>
            </div>

            {/* Tabla de datos históricos */}
            <div id="tab-historico" className="mt-6">
              <h3 className="text-md font-semibold mb-3 pb-2 border-b">Datos Históricos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {maquinaDetalles.tipo_medicion === 'horometro' ? 'Horómetro' : 'Kilometraje'}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga (L)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {maquinaDetalles.tipo_medicion === 'horometro' ? 'Horas Trabajadas' : 'Km Recorridos'}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Real (L)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculos.horometro.map((h, index) => (
                      <tr key={`hist-${index}`} className={index === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{maquinaDetalles.detalle_historico[index]?.fecha || '-'}</td>
                        <td className="px-3 py-2">{h.toLocaleString()}</td>
                        <td className="px-3 py-2">{calculos.cargas[index].toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {index === 0 ? '-' : calculos.horasTrabajadas[index].toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          {index === 0 ? '-' : calculos.consumoReal[index].toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabla de proyección */}
            <div id="tab-proyeccion" className="mt-6">
              <h3 className="text-md font-semibold mb-3 pb-2 border-b">Proyección</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {maquinaDetalles.tipo_medicion === 'horometro' ? 'Horas Simuladas' : 'Km Simulados'}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Simulado (L)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Inicial (L)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Final (L)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculos.simulacion.map((sim, index) => (
                      <tr key={`sim-${index}`} className={parseFloat(sim.stock_final) <= 0 ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2">{sim.dia}</td>
                        <td className="px-3 py-2">{sim.fecha}</td>
                        <td className="px-3 py-2">{parseFloat(sim.horas).toLocaleString()}</td>
                        <td className="px-3 py-2">{parseFloat(sim.consumo).toLocaleString()}</td>
                        <td className="px-3 py-2">{parseFloat(sim.stock_inicial).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {parseFloat(sim.stock_final) <= 0 ? (
                            <span className="text-red-600 font-medium flex items-center">
                              <FiAlertTriangle className="mr-1" />
                              {parseFloat(sim.stock_final).toLocaleString()}
                            </span>
                          ) : (
                            parseFloat(sim.stock_final).toLocaleString()
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sin datos seleccionados */}
      {(!maquinaDetalles || !calculos) && !cargando && datosProyeccion && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Seleccione una máquina para ver su proyección de consumo.
          </p>
        </div>
      )}

      {/* Cargando */}
      {cargando && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Cargando datos...</h3>
          <p className="mt-1 text-xs text-gray-500">Esto puede tardar unos momentos</p>
        </div>
      )}

      {/* Sin datos cargados */}
      {!datosProyeccion && !cargando && fechaDesde && fechaHasta && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos para el periodo seleccionado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Intente seleccionar un rango de fechas diferente o haga clic en "Actualizar Datos".
          </p>
          <button
            onClick={cargarDatosProyeccion}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw className="inline mr-2" />
            Actualizar Datos
          </button>
        </div>
      )}

      {/* Pie de página */}
      <footer className="mt-8 text-center text-xs text-gray-500 py-4 border-t border-gray-200">
        <p>Sistema de Proyección de Consumo • © {new Date().getFullYear()}</p>
        <p className="mt-1">Versión 1.0.0</p>
      </footer>
    </div>
  );
}

export default ProyeccionConsumo;