import React from "react";
import {
  Page,
  Document,
  View,
  PDFViewer,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

// Este es un ejemplo de cómo usar el componente PDF en un entorno de desarrollo
// donde quieras verlo antes de descargar

const ExportarPDFPreview = ({ datosReal, datosSimulados, chartImage, calculos }) => {
  // Importamos el componente SimulacionPDF dinámicamente para evitar
  // problemas con server-side rendering
  const [SimulacionPDFComponent, setSimulacionPDFComponent] = React.useState(null);

  React.useEffect(() => {
    // En un entorno real, necesitarías importar esto de manera dinámica
    // para evitar problemas con server-side rendering
    import("./ExportarPDF").then((module) => {
      // Aquí extraemos el componente SimulacionPDF del módulo exportado
      const { SimulacionPDF } = module;
      setSimulacionPDFComponent(() => SimulacionPDF);
    });
  }, []);

  if (!SimulacionPDFComponent || !chartImage) {
    return (
      <div className="text-center p-4 border rounded-lg bg-gray-50 mt-6">
        <p className="text-gray-600">
          Capture el gráfico primero para previsualizar el PDF
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Previsualización del PDF</h2>
      <PDFViewer style={{ width: "100%", height: "500px" }}>
        <SimulacionPDFComponent
          datosReal={datosReal}
          datosSimulados={datosSimulados}
          chartImage={chartImage}
          calculos={calculos}
        />
      </PDFViewer>
    </div>
  );
};

// Nota: Este componente es opcional y se puede usar para desarrollo
export default ExportarPDFPreview;