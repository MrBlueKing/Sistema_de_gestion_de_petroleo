import React, { useState } from "react";
import { 
  Page, 
  Text, 
  View, 
  Document, 
  StyleSheet, 
  PDFDownloadLink, 
  Image, 
  Font 
} from "@react-pdf/renderer";
import { toPng } from "html-to-image";

// Registrar fuentes para mejorar la apariencia del PDF
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Estilos mejorados para PDF profesional
const styles = StyleSheet.create({
  page: { 
    padding: 30,
    fontFamily: 'Roboto',
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1', // Color principal de tu gráfico
    borderBottomStyle: 'solid',
    alignItems: 'center',
    height: 50,
    marginBottom: 20,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 700,
    color: '#4338ca', // Color oscuro de indigo de Tailwind
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 500,
    marginVertical: 10,
    color: '#4338ca',
  },
  image: { 
    width: '100%', 
    height: 280, 
    marginVertical: 15,
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 5,
  },
  table: { 
    display: "table", 
    width: "100%", 
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#4338ca',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  realRow: { backgroundColor: '#e5edff' },
  simuladoRow: { backgroundColor: '#eef2ff' },
  tableColHeader: { 
    width: '25%', 
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 700,
    color: 'white',
  },
  tableCol: { 
    width: '25%', 
    fontSize: 10,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendBox: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 10,
    color: '#666',
  },
  companyInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  resumenSection: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    backgroundColor: '#fafafa',
  },
  resumenTitle: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 5,
    color: '#4338ca',
  },
  resumenRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  resumenLabel: {
    width: '60%',
    fontSize: 10,
    fontWeight: 500,
  },
  resumenValue: {
    width: '40%',
    fontSize: 10,
    textAlign: 'right',
  },
  legendColors: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  colorLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  colorText: {
    fontSize: 9,
  }
});

// Función de utilidad para formatear números
const safeNumber = (v) =>
  typeof v === "number"
    ? v
    : !isNaN(parseFloat(v))
    ? parseFloat(v)
    : 0;

// Componente de fecha actual
const CurrentDate = () => {
  const date = new Date();
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Documento PDF principal
const SimulacionPDF = ({ datosReal, datosSimulados, chartImage, calculos }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🛠️ Simulación de Consumo</Text>
          <Text style={styles.companyInfo}>Generado el {CurrentDate()}</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Análisis y proyección de consumo basado en datos históricos</Text>
      
      {/* Sección de Resumen */}
      <View style={styles.resumenSection}>
        <Text style={styles.resumenTitle}>Resumen de Cálculos</Text>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Total Horas Trabajadas:</Text>
          <Text style={styles.resumenValue}>{calculos.totalHoras.toFixed(2)} h</Text>
        </View>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Total Consumo:</Text>
          <Text style={styles.resumenValue}>{calculos.totalConsumo.toFixed(2)} unidades</Text>
        </View>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Rendimiento:</Text>
          <Text style={styles.resumenValue}>{calculos.rendimiento.toFixed(2)} h/unidad</Text>
        </View>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Promedio Horas Diarias:</Text>
          <Text style={styles.resumenValue}>{calculos.promedioHoras.toFixed(2)} h</Text>
        </View>
        
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Consumo Simulado Diario:</Text>
          <Text style={styles.resumenValue}>{calculos.consumoSimuladoDiario.toFixed(2)} unidades</Text>
        </View>
      </View>
      
      {/* Gráfico */}
      <Text style={styles.graphTitle}>📈 Gráfico de Stock vs Día</Text>
      
      <View style={styles.legendColors}>
        <View style={styles.colorLegend}>
          <View style={[styles.colorBox, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.colorText}>Stock Inicial</Text>
        </View>
        <View style={styles.colorLegend}>
          <View style={[styles.colorBox, { backgroundColor: '#f97316' }]} />
          <Text style={styles.colorText}>Consumo</Text>
        </View>
        <View style={styles.colorLegend}>
          <View style={[styles.colorBox, { backgroundColor: '#10b981' }]} />
          <Text style={styles.colorText}>Horas</Text>
        </View>
      </View>
      
      {chartImage && <Image src={chartImage} style={styles.image} />}
      
      {/* Leyenda para diferenciar datos reales y simulados */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#fffff' }]} />
          <Text style={styles.legendText}>Datos Reales</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#eef2ff' }]} />
          <Text style={styles.legendText}>Datos Simulados</Text>
        </View>
      </View>
      
      {/* Tabla de datos */}
      <Text style={styles.graphTitle}>Datos de Simulación</Text>
      
      <View style={styles.table}>
        {/* Encabezado de la tabla */}
        <View style={styles.tableRowHeader}>
          <Text style={styles.tableColHeader}>Día</Text>
          <Text style={styles.tableColHeader}>Horas</Text>
          <Text style={styles.tableColHeader}>Consumo</Text>
          <Text style={styles.tableColHeader}>Stock</Text>
        </View>
        
        {/* Datos reales */}
        {datosReal && datosReal.map((d, i) => (
          <View key={`real-${i}`} style={[styles.tableRow, styles.realRow]}>
            <Text style={styles.tableCol}>{d.dia}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.horas).toFixed(2)}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.consumo).toFixed(2)}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.stockInicial).toFixed(2)}</Text>
          </View>
        ))}
        
        {/* Datos simulados */}
        {datosSimulados && datosSimulados.map((d, i) => (
          <View key={`sim-${i}`} style={[styles.tableRow, styles.simuladoRow]}>
            <Text style={styles.tableCol}>{d.dia}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.horas).toFixed(2)}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.consumo).toFixed(2)}</Text>
            <Text style={styles.tableCol}>{safeNumber(d.stockInicial).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      
      {/* Pie de página */}
      <View style={styles.footer}>
        <Text>Informe de Simulación de Consumo • Generado automáticamente</Text>
      </View>
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);

// Componente principal para exportar
const ExportarPDF = ({ targetRef, chartRef, setChartImage, chartImage, calculos, datosReal, datosSimulados }) => {
  const [preparando, setPreparando] = useState(false);

  // Función para capturar el gráfico con alta calidad
  const capturarGrafico = async () => {
    if (!chartRef?.current) return;
    
    setPreparando(true);
    
    try {
      const options = {
        pixelRatio: 4,     // Alta resolución
        quality: 1,        // Máxima calidad
        width: chartRef.current.offsetWidth * 2,  // Doble tamaño para mejor calidad
        height: chartRef.current.offsetHeight * 2,
        cacheBust: true,   // Evitar problemas de caché
        style: {
          transform: 'scale(2)',  // Escalar para mejorar nitidez
          transformOrigin: 'top left',
          width: `${chartRef.current.offsetWidth}px`,
          height: `${chartRef.current.offsetHeight}px`,
        }
      };
      
      const dataUrl = await toPng(chartRef.current, options);
      setChartImage(dataUrl);
    } catch (error) {
      console.error("Error al capturar el gráfico:", error);
    } finally {
      setPreparando(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8 space-y-4">
      <button
        onClick={capturarGrafico}
        disabled={preparando}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
      >
        {preparando ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Preparando gráfico...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Preparar PDF
          </>
        )}
      </button>

      {chartImage && (
        <div className="mt-4 text-center">
          <PDFDownloadLink
            document={
              <SimulacionPDF 
                datosReal={datosReal} 
                datosSimulados={datosSimulados} 
                chartImage={chartImage}
                calculos={calculos}
              />
            }
            fileName="simulacion_consumo.pdf"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md flex items-center"
          >
            {({ loading, error }) => 
              loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando PDF...
                </>
              ) : error ? (
                "Error al generar PDF"
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  📄 Descargar PDF
                </>
              )
            }
          </PDFDownloadLink>
          
          <p className="text-sm text-gray-600 mt-2">
            El gráfico se ha preparado correctamente
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportarPDF;