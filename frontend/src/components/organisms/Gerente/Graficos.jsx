import { useState, useEffect } from "react";
import axios from "../../../lib/axios";

import UniversalHeader from "../Todos/UniversalHeader";

import {
  FiDroplet,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";

// Importación de componentes moleculares para filtros y tablas
import FiltrosComponent from "../../molecules/FiltrosComponent";
import ConsumoPorMaquinaPureTable from "../../molecules/ConsumoPorMaquinaTable";
import ConsumoPorFaenaTable from "../../molecules/ConsumoPorFaenaTable";
import IngresosPorFaenaTable from "../../molecules/IngresosPorFaenaTable";

// Importación de componentes moleculares para gráficos
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";
// 🆕 IMPORTAR EL NUEVO ConsumptionPieChart conectado al backend
import ConsumptionPieChart from "../../molecules/ConsumptionPieChart";

const Graficos = ({ children }) => {
  // Estados básicos necesarios
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [faenas, setFaenas] = useState([]);

  // ✅ CORRECCIÓN: Estados para las horas
  const [horaDesde, setHoraDesde] = useState("08:00");
  const [horaHasta, setHoraHasta] = useState("18:00");

  // Estado para controlar la vista activa
  const [vistaActiva, setVistaActiva] = useState("graficos");

  // Inicializar fechaDesde al primer día del mes actual
  const [fechaDesde, setFechaDesde] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );

  // Inicializar fechaHasta al día actual
  const [fechaHasta, setFechaHasta] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ NUEVA FUNCIÓN: Formatear fecha con hora para enviar al backend
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha || !hora) return fecha;
    return `${fecha} ${hora}:00`;
  };

  // ✅ NUEVA FUNCIÓN: Obtener fechas formateadas para enviar
  const obtenerFechasFormateadas = () => {
    return {
      fecha_inicio: formatearFechaHora(fechaDesde, horaDesde),
      fecha_fin: formatearFechaHora(fechaHasta, horaHasta),
    };
  };

  // Cargar faenas disponibles
  useEffect(() => {
    cargarFaenas();
  }, []);

  //Funcion para obtener las faenas disponibles
  const cargarFaenas = async () => {
    try {
      const response = await axios.get("/api/faenas");
      const faenasData = response.data.data || response.data;

      if (Array.isArray(faenasData)) {
        const faenasFormateadas = faenasData.map((faena) => ({
          value: faena.id_faena.toString(),
          label: faena.ubicacion || faena.nombre || `Faena ${faena.id_faena}`,
        }));
        setFaenas(faenasFormateadas);
      } else {
        console.error("Formato de respuesta inesperado:", response.data);
        setFaenas([]);
      }
    } catch (error) {
      console.error("Error al cargar faenas:", error);
      setFaenas([]);
    }
  };

  // Función para refrescar datos manualmente
  const refrescarDatos = () => {
    setRefreshTrigger((prev) => prev + 1);
    setUltimaActualizacion(new Date());
    setMensajeExito("Datos actualizados correctamente");

    // Limpiar mensaje de éxito después de 3 segundos
    setTimeout(() => {
      setMensajeExito(null);
    }, 3000);
  };

  // ✅ FUNCIÓN DEBUG: Para verificar que las horas se están pasando
  useEffect(() => {
    console.log("🕐 Filtros actualizados:", {
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      fechaInicioFormateada: formatearFechaHora(fechaDesde, horaDesde),
      fechaFinFormateada: formatearFechaHora(fechaHasta, horaHasta),
    });
  }, [fechaDesde, fechaHasta, horaDesde, horaHasta]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <UniversalHeader type="gerente" />
      <div className=" py-6">
        {/* Mensajes de estado */}
        {cargando && (
          <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
            <FiLoader
              className="animate-spin mx-auto h-8 w-8"
              style={{ color: "#F67029" }}
            />
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        )}

        {error && (
          <div
            className="border-l-4 text-red-700 p-4 mb-4 rounded-r-md shadow-sm"
            style={{ backgroundColor: "#FEF2F2", borderColor: "#AB201A" }}
          >
            <div className="flex">
              <div className="py-1">
                <FiX className="h-6 w-6 mr-4" style={{ color: "#AB201A" }} />
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {mensajeExito && (
          <div
            className="border-l-4 p-4 mb-4 rounded-r-md shadow-sm"
            style={{ backgroundColor: "#F0EDEA", borderColor: "#9A0000" }}
          >
            <div className="flex">
              <div className="py-1">
                <FiCheckCircle
                  className="h-6 w-6 mr-4"
                  style={{ color: "#9A0000" }}
                />
              </div>
              <div>
                <p className="font-bold" style={{ color: "#9A0000" }}>
                  Éxito
                </p>
                <p style={{ color: "#9A0000" }}>{mensajeExito}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sección principal */}
        <section className="">
          <div className="flex justify-between items-center mb-3 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDroplet className="mr-2" style={{ color: "#F67029" }} />
              Dashboard Operacional{" "}
                
            </h2>


            <div className="flex items-center space-x-4">
              {/* Selector de vista */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setVistaActiva("graficos")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    vistaActiva === "graficos"
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    vistaActiva === "graficos"
                      ? { backgroundColor: "#F67029" }
                      : {}
                  }
                >
                  Gráficos
                </button>
                <button
                  onClick={() => setVistaActiva("tablas")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    vistaActiva === "tablas"
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    vistaActiva === "tablas"
                      ? { backgroundColor: "#F67029" }
                      : {}
                  }
                >
                  Tablas
                </button>
              </div>

              {/* Botón refrescar */}
              <button
                onClick={refrescarDatos}
                className="flex items-center px-3 py-1 rounded transition-colors"
                style={{ backgroundColor: "#FFF5F2", color: "#AB201A" }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#FEF2F2")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#FFF5F2")
                }
                disabled={cargando}
              >
                <FiRefreshCw
                  className={`mr-1 ${cargando ? "animate-spin" : ""}`}
                />
                Actualizar
              </button>
            </div>
          </div>

          {/* Componente de filtros reutilizable */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-md font-medium text-gray-800 mb-4">
              Filtros de Visualización
            </h3>
            {/* ✅ CORRECCIÓN: Pasar las props de hora correctamente */}
            <FiltrosComponent
              fechaDesde={fechaDesde}
              setFechaDesde={setFechaDesde}
              fechaHasta={fechaHasta}
              setFechaHasta={setFechaHasta}
              faenaSeleccionada={faenaSeleccionada}
              setFaenaSeleccionada={setFaenaSeleccionada}
              faenas={faenas}
              // ✅ PROPS para habilitar horas
              incluirHoras={true}
              horaDesde={horaDesde}
              setHoraDesde={setHoraDesde}
              horaHasta={horaHasta}
              setHoraHasta={setHoraHasta}
              tituloPersonalizado="Análisis con precisión horaria"
            />
          </div>

          {/* Vista de tablas */}
          {vistaActiva === "tablas" && (
            <>
              {/* ✅ CORRECCIÓN: Pasar las horas a las tablas */}
              <ConsumoPorMaquinaPureTable
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                horaDesde={horaDesde}
                horaHasta={horaHasta}
                faenaSeleccionada={faenaSeleccionada}
                refreshKey={refreshTrigger}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ConsumoPorFaenaTable
                  fechaDesde={fechaDesde}
                  fechaHasta={fechaHasta}
                  horaDesde={horaDesde}
                  horaHasta={horaHasta}
                  faenaSeleccionada={faenaSeleccionada}
                  refreshKey={refreshTrigger}
                />
                <IngresosPorFaenaTable
                  fechaDesde={fechaDesde}
                  fechaHasta={fechaHasta}
                  horaDesde={horaDesde}
                  horaHasta={horaHasta}
                  faenaSeleccionada={faenaSeleccionada}
                  refreshKey={refreshTrigger}
                />
              </div>
            </>
          )}

          {/* Vista de gráficos - LAYOUT MEJORADO CON TOP CHART ANCHO COMPLETO */}
          {vistaActiva === "graficos" && (
            <>
              <div className="mt-6">
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                    <FiBarChart2
                      className="mr-2"
                      style={{ color: "#F67029" }}
                    />
                    Visualización de Datos
                  </h3>

                  {/* 🆕 TOP EQUIPOS CHART - ANCHO COMPLETO */}
                  <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Top Equipos por Consumo
                      </h4>
                      {fechaDesde && fechaHasta && (
                        <TopEquiposChart
                          faenaSeleccionada={faenaSeleccionada}
                          fechaDesde={fechaDesde}
                          fechaHasta={fechaHasta}
                          horaDesde={horaDesde}
                          horaHasta={horaHasta}
                          refreshKey={refreshTrigger}
                        />
                      )}
                    </div>
                  </div>

                  {/* 🆕 OTROS GRÁFICOS EN GRID 2x1 */}
                  <div className="mb-6">
                    {/* 🆕 CONSUMO POR CATEGORÍAS - REEMPLAZA EL PLACEHOLDER */}

                    {fechaDesde && fechaHasta && (
                      <ConsumptionPieChart
                        faenaSeleccionada={faenaSeleccionada}
                        fechaDesde={fechaDesde}
                        fechaHasta={fechaHasta}
                        refreshKey={refreshTrigger}
                      />
                    )}
                  </div>

                  {/* 🆕 TENDENCIA - ANCHO COMPLETO */}
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Tendencia de Consumo
                    </h4>
                    {faenaSeleccionada && (
                      <ConsumoTendenciaChart
                        faenaSeleccionada={faenaSeleccionada}
                        fechaDesde={fechaDesde}
                        fechaHasta={fechaHasta}
                        horaDesde={horaDesde}
                        horaHasta={horaHasta}
                        refreshKey={refreshTrigger}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Sección para contenido hijo (si existe) */}
        <section>{children}</section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos
            reservados.
          </div>
          <div className="flex items-center">
            <span className="mr-2">Versión 0.0.1</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
            <span>
              Última actualización: {ultimaActualizacion.toLocaleString()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Graficos;
