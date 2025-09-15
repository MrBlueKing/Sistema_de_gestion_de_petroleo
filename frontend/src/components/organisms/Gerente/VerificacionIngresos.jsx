import React, { useState, useEffect } from "react";
import { GiGasPump } from "react-icons/gi";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiTruck,
  FiDroplet,
  FiTrendingUp,
  FiBarChart2,
  FiRefreshCw,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import axios from "../../../lib/axios";

import UniversalHeader from "../Todos/UniversalHeader";
import FiltrosComponent from "../../molecules/FiltrosComponent";
import PageControl from "../../molecules/PageControl";
import { getFaenaColors } from "../../../context/faenaColor";
import ResumenStockDetallado from "../../molecules/ResumenStockDetallado";

const VerificacionIngresos = () => {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
  const [faenas, setFaenas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [registrosPorPagina] = useState(10);

  // Estado para filtro de número de documento
  const [numeroDocumento, setNumeroDocumento] = useState("");

  // 🆕 Estado para controlar detalles expandidos
  const [detallesExpandidos, setDetallesExpandidos] = useState({});
  const [mostrarAnalisisStock, setMostrarAnalisisStock] = useState(false);

  // Cargar faenas disponibles
  useEffect(() => {
    cargarFaenas();
  }, []);

  // Cargar ingresos cuando cambien los filtros O la página
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarIngresos();
      if (currentPage === 1) {
        cargarResumen();
      }
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada, numeroDocumento, currentPage]);

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

  const cargarIngresos = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: registrosPorPagina,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id_faena: faenaSeleccionada === "todas" ? null : faenaSeleccionada,
        ...(numeroDocumento && { numero_guia: numeroDocumento }),
      };

      console.log("🔍 Cargando ingresos con parámetros:", params);

      const response = await axios.get("/api/verificacion-ingresos", {
        params,
      });

      if (response.data.success) {
        const ingresosData = response.data.data || [];
        const paginacionData = response.data.pagination || {};

        setIngresos(Array.isArray(ingresosData) ? ingresosData : []);
        setTotalPages(paginacionData.total_pages || 1);
        setTotalRegistros(paginacionData.total || 0);

        console.log("✅ Ingresos cargados:", {
          registros: ingresosData.length,
          pagina: currentPage,
          totalPaginas: paginacionData.total_pages,
          totalRegistros: paginacionData.total,
          filtroDocumento: numeroDocumento || "Sin filtro",
        });
      } else {
        throw new Error(response.data.message || "Error al cargar ingresos");
      }
    } catch (error) {
      console.error("Error al cargar ingresos:", error);
      setIngresos([]);
      if (error.response?.status === 404) {
        console.log("La ruta de verificación de ingresos no existe aún");
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id_faena: faenaSeleccionada === "todas" ? null : faenaSeleccionada,
        ...(numeroDocumento && { numero_guia: numeroDocumento }),
      };

      const response = await axios.get("/api/verificacion-ingresos/resumen", {
        params,
      });
      setResumen(response.data.data || response.data || null);
    } catch (error) {
      console.error("Error al cargar resumen:", error);
      setResumen(null);
    }
  };

  // Manejador de cambio de página
  const handlePageChange = (nuevaPagina) => {
    setCurrentPage(nuevaPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Manejador para filtros
  const handleFiltrosChange = (nuevosFiltros) => {
    console.log("🔄 Filtros cambiados:", nuevosFiltros);

    setCurrentPage(1);

    if (nuevosFiltros.fechaDesde !== undefined)
      setFechaDesde(nuevosFiltros.fechaDesde);
    if (nuevosFiltros.fechaHasta !== undefined)
      setFechaHasta(nuevosFiltros.fechaHasta);
    if (nuevosFiltros.faenaSeleccionada !== undefined)
      setFaenaSeleccionada(nuevosFiltros.faenaSeleccionada);
    if (nuevosFiltros.numeroDocumento !== undefined)
      setNumeroDocumento(nuevosFiltros.numeroDocumento);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setFaenaSeleccionada("todas");
    setNumeroDocumento("");
    setCurrentPage(1);
    setIngresos([]);
    setResumen(null);
  };

  // 🆕 Función para toggle detalles expandidos
  const toggleDetalles = (ingresoId) => {
    setDetallesExpandidos((prev) => ({
      ...prev,
      [ingresoId]: !prev[ingresoId],
    }));
  };

  // Funciones auxiliares
  const getErrorClass = (error) => {
    if (Math.abs(error) < 0.01) return "text-green-600";
    if (Math.abs(error) <= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getErrorIcon = (error) => {
    if (Math.abs(error) < 0.01)
      return <FiCheckCircle className="inline mr-1" />;
    return <FiAlertCircle className="inline mr-1" />;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0,00";
    return new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getFaenaName = (faenaData) => {
    if (typeof faenaData === "object" && faenaData !== null) {
      return faenaData.nombre || faenaData.ubicacion || `Faena ${faenaData.id}`;
    }
    return faenaData || "Sin faena";
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = fechaDesde && fechaHasta;

  return (
    <div className="min-h-screen bg-gray-50 mt-12">
      <UniversalHeader type="gerente" />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <GiGasPump className="text-orange-600 mr-3" />
                Verificación de Ingresos de Petróleo
              </h1>
              <p className="text-gray-600">
                Visualización de errores iniciales y finales en los ingresos de
                combustible con detalle por estanque
              </p>
            </div>

            {/* Información de paginación y acciones */}
            <div className="flex items-center gap-4">
              {hayFiltrosActivos && (
                <>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {totalRegistros}
                    </div>
                    <div className="text-sm text-gray-500">Total registros</div>
                  </div>

                  <button
                    onClick={cargarIngresos}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    <FiRefreshCw
                      className={`mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Actualizar
                  </button>

                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Limpiar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

         {/* Filtros */}
        <div className="mb-6">
          <FiltrosComponent
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            faenaSeleccionada={faenaSeleccionada}
            setFaenaSeleccionada={setFaenaSeleccionada}
            faenas={faenas}
            onChange={handleFiltrosChange}
            mostrarEquipoFilter={true}
            equipoFilter={numeroDocumento}
            placeholderEquipo="Buscar por N° de guía/documento..."
            labelEquipo="Filtrar por N° Documento"
            cargando={loading}
            compacto={false}
            modo="faenas"
            tituloPersonalizado="Filtros de Verificación"
          />
        </div>
        
        {/* Botones de resumen - REEMPLAZAR el botón existente */}
        {resumen && hayFiltrosActivos && (
          <div className="mb-6 flex flex-wrap gap-3">
            {/* Botón resumen tradicional */}
            <button
              onClick={() => setMostrarResumen(!mostrarResumen)}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FiBarChart2 className="mr-2" />
              {mostrarResumen ? "Ocultar" : "Mostrar"} Resumen Básico
            </button>

            {/* 🆕 Botón para análisis detallado de stock */}
            <button
              onClick={() => setMostrarAnalisisStock(!mostrarAnalisisStock)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiTrendingUp className="mr-2" />
              {mostrarAnalisisStock ? "Ocultar" : "Mostrar"} Análisis de Stock
              Detallado
            </button>
          </div>
        )}
     
        {/* 🆕 Panel de análisis detallado de stock */}
        <ResumenStockDetallado
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          idFaena={faenaSeleccionada}
          mostrarDetalle={mostrarAnalisisStock}
          onToggleDetalle={() => setMostrarAnalisisStock(!mostrarAnalisisStock)}
        />
        {/* Panel de resumen */}
        {mostrarResumen && resumen && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-indigo-50 p-6 rounded-lg shadow-sm border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-orange-600" />
              Resumen del Período
              {numeroDocumento && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Filtrado por: {numeroDocumento}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Ingresos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {resumen.total_ingresos}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Litros Documentados
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatNumber(resumen.total_litros_documentados)} L
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200 text-center">
                <p className="text-sm text-gray-600 mb-1">Litros Recibidos</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatNumber(resumen.total_litros_recibidos)} L
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Error Final Acumulado
                </p>
                <p
                  className={`text-xl font-bold ${getErrorClass(
                    resumen.error_final_acumulado
                  )}`}
                >
                  {formatNumber(resumen.error_final_acumulado)} L
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
                <p className="text-sm text-gray-600 mb-1">% Error Acumulado</p>
                <p className="text-2xl font-bold text-purple-600">
                  {resumen.porcentaje_precision}%
                </p>
              </div>
            </div>
          </div>
        )}
       
        {/* Estado de carga */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="animate-spin text-orange-600 text-2xl mr-3" />
              <p className="text-gray-600">Cargando ingresos...</p>
            </div>
          </div>
        )}
        {/* Mensaje sin filtros */}
        {!hayFiltrosActivos && !loading && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
            <FiFileText className="text-orange-600 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Configure los filtros para comenzar
            </h3>
            <p className="text-orange-600">
              Seleccione un rango de fechas y opcionalmente una faena para ver
              los ingresos de petróleo
            </p>
          </div>
        )}
        {/* Listado de ingresos con paginación */}
        {!loading && hayFiltrosActivos && (
          <div className="space-y-6">
            {/* Información de paginación superior */}
            {ingresos.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando página{" "}
                    <span className="font-medium">{currentPage}</span> de{" "}
                    <span className="font-medium">{totalPages}</span> (
                    {totalRegistros} registros en total)
                  </div>

                  {numeroDocumento && (
                    <div className="flex items-center text-sm text-orange-600">
                      <FiFileText className="mr-1" />
                      Filtrado por documento: "{numeroDocumento}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {ingresos.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <FiDroplet className="text-gray-400 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No se encontraron ingresos
                </h3>
                <p className="text-gray-500">
                  {numeroDocumento
                    ? `No hay ingresos con el documento "${numeroDocumento}" para los filtros seleccionados.`
                    : "No hay ingresos de petróleo para los filtros seleccionados."}
                </p>
                {numeroDocumento && (
                  <button
                    onClick={() => setNumeroDocumento("")}
                    className="mt-3 text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    Limpiar filtro de documento
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🔄 LISTADO DETALLADO CON INFORMACIÓN POR ESTANQUE */}
                {ingresos.map((ingreso) => (
                  <div
                    key={ingreso.id_ingreso}
                    className={`rounded-lg shadow-sm border border-gray-100 overflow-hidden ${
                      getFaenaColors(ingreso.id_faena).bg
                    } ${getFaenaColors(ingreso.id_faena).border} border-l-4`}
                  >
                    {/* 📋 CABECERA DEL INGRESO */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex flex-wrap justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h1 className="font-semibold text-gray-800 text-xl">
                              <span className="mr-2">
                                {getFaenaColors(ingreso.id_faena).emoji}
                              </span>
                              N° Documento {ingreso.numero_guia}
                              <span
                                className={`ml-2 px-2 py-1 text-2xl font-medium rounded-full ${
                                  getFaenaColors(ingreso.id_faena).badge
                                }`}
                              >
                                {getFaenaName(ingreso.faena)}
                              </span>
                            </h1>
                            <p className="text-sm text-gray-600">
                              {ingreso.fecha_ingreso} {ingreso.hora_ingreso} •{" "}
                              {ingreso.usuario}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 mt-2 sm:mt-0">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              Litros Documentados
                            </p>
                            <p className="font-semibold text-gray-800">
                              {formatNumber(ingreso.litros_documentados)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              Litros Recibidos
                            </p>
                            <p className="font-semibold text-gray-800">
                              {formatNumber(ingreso.litros_recibidos)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Estado</p>
                            <p
                              className={`font-semibold ${
                                ingreso.recibo_conforme
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {ingreso.recibo_conforme
                                ? "Conforme"
                                : "Con Observaciones"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 📊 RESUMEN DE ERRORES */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Stock Inicial Total
                          </h4>
                          <p className="text-xl font-bold text-orange-600">
                            {formatNumber(ingreso.stock_inicial_total)} L
                          </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="text-sm font-medium text-gray-800 mb-1">
                            Error Inicial Total
                          </h4>
                          <p className="text-xs text-gray-500">
                            (Medición Inicial − Stock Sistema)
                          </p>

                          <p
                            className={`text-xl font-bold ${getErrorClass(
                              ingreso.error_inicial_total
                            )}`}
                          >
                            {getErrorIcon(ingreso.error_inicial_total)}
                            {ingreso.error_inicial_total > 0 ? "+" : ""}
                            {formatNumber(ingreso.error_inicial_total)} L
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Error Final
                          </h4>
                          <p className="text-xs text-gray-500">
                            (Litros Documentados − Litros Recibidos)
                          </p>
                          <p
                            className={`text-xl font-bold ${getErrorClass(
                              ingreso.error_final
                            )}`}
                          >
                            {getErrorIcon(ingreso.error_final)}
                            {ingreso.error_final > 0 ? "+" : ""}
                            {formatNumber(ingreso.error_final)} L
                          </p>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Stock Final Total
                          </h4>
                          <p className="text-xl font-bold text-orange-600">
                            {formatNumber(ingreso.stock_final_total)} L
                          </p>
                        </div>
                      </div>

                      {/* 📝 OBSERVACIONES */}
                      {ingreso.observacion && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Observación:</strong> {ingreso.observacion}
                          </p>
                        </div>
                      )}

                      {/* 🔽 BOTÓN EXPANDIR/CONTRAER DETALLES */}
                      {ingreso.errores_por_estanque &&
                        ingreso.errores_por_estanque.length > 0 && (
                          <div className="border-t border-gray-200 pt-4">
                            <button
                              onClick={() => toggleDetalles(ingreso.id_ingreso)}
                              className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <div className="flex items-center">
                                <FiDroplet className="text-blue-500 mr-2" />
                                <span className="font-medium text-gray-700">
                                  Detalle por Estanque (
                                  {ingreso.errores_por_estanque.length}{" "}
                                  estanques)
                                </span>
                              </div>
                              {detallesExpandidos[ingreso.id_ingreso] ? (
                                <FiChevronUp className="text-gray-500" />
                              ) : (
                                <FiChevronDown className="text-gray-500" />
                              )}
                            </button>

                            {/* 📊 TABLA DETALLADA POR ESTANQUE - CAMPOS CORREGIDOS */}
                            {detallesExpandidos[ingreso.id_ingreso] && (
                              <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estanque
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Sistema
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medición Inicial
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Error Inicial
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medición Final
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Litros Agregados
                                        <p className="text-shadow-2xs text-gray-400">
                                          (Medición Final − Medición Inicial)
                                        </p>
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Altura (cm)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {ingreso.errores_por_estanque.map(
                                      (estanque, index) => (
                                        <tr
                                          key={`${estanque.id_estanque}-${index}`}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {estanque.nombre_estanque}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {formatNumber(
                                              estanque.stock_sistema
                                            )}{" "}
                                            L
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {formatNumber(
                                              estanque.medicion_inicial
                                            )}{" "}
                                            L
                                          </td>
                                          <td
                                            className={`px-4 py-3 text-sm font-medium text-center ${getErrorClass(
                                              estanque.error_inicial
                                            )}`}
                                          >
                                            {estanque.error_inicial > 0
                                              ? "+"
                                              : ""}
                                            {formatNumber(
                                              estanque.error_inicial
                                            )}{" "}
                                            L
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {formatNumber(
                                              estanque.medicion_final
                                            )}{" "}
                                            L
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {formatNumber(
                                              estanque.litros_agregados
                                            )}{" "}
                                            L
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {estanque.altura_texto || "N/A"}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <PageControl
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      colorScheme="orange"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificacionIngresos;
