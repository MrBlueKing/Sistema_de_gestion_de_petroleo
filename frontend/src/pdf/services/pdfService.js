import jsPDF from 'jspdf';
import logoEmpresa from '../../assets/Syc.png'
import logoFaenaTilTil from '../../assets/procesos.png'
import axios from '../../lib/axios';

class PDFService {
  constructor() {
    // Configuración optimizada para mejor legibilidad
    this.defaultConfig = {
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    };

    // Paleta de colores profesional 3H Copper
    this.colors = {
      primary: [249, 115, 22], // orange-500
      primaryDark: [194, 65, 12], // orange-700
      primaryLight: [254, 215, 170], // orange-200
      accent: [251, 146, 60], // orange-400
      copper: [184, 115, 51],
      white: [255, 255, 255],
      gray: [107, 114, 128],
      lightGray: [248, 250, 252], // Más suave
      mediumGray: [226, 232, 240], // Para bordes
      darkGray: [51, 65, 85], // Más legible
      success: [34, 197, 94],
      blue: [59, 130, 246] // Para acentos
    };

    // Sistema de paginación mejorado
    this.paginationTracker = {
      totalItems: 0,
      currentPage: 1,
      itemsPerPage: 0,
      pageStartIndex: 0,
      pageEndIndex: 0,
      recordsOnCurrentPage: 0
    };
  }

  // 🆕 FUNCIÓN PARA OBTENER NOMBRE DE FAENA
  async obtenerNombreFaena(user, filters) {
    try {
      // CASO 1: Si es "todas las faenas"
      if (filters?.faenaSeleccionada === 'todas') {
        if (filters?.faenas && filters.faenas.length > 1) {
          return `Todas las faenas (${filters.faenas.length} faenas)`;
        }
      }

      // CASO 2: Si hay filtro de faena específica (Gerente)
      if (filters?.faenaSeleccionada && filters.faenaSeleccionada !== 'todas') {
        // Buscar en las faenas disponibles del filtro
        if (filters?.faenas && filters.faenas.length > 0) {
          const faenaEncontrada = filters.faenas.find(f => 
            f.value == filters.faenaSeleccionada || f.id == filters.faenaSeleccionada
          );
          if (faenaEncontrada) {
            return faenaEncontrada.label || faenaEncontrada.nombre || faenaEncontrada.ubicacion;
          }
        }
        
        // Si no se encuentra en filtros, consultar API
        try {
          const response = await axios.get(`/api/faenasDisponibles`);
          if (response.data?.success && response.data.faenas) {
            const faenaEncontrada = response.data.faenas.find(f => f.id == filters.faenaSeleccionada);
            if (faenaEncontrada) {
              return faenaEncontrada.ubicacion || faenaEncontrada.nombre || `Faena ${filters.faenaSeleccionada}`;
            }
          }
        } catch (error) {
          console.warn('Error consultando faenas:', error);
        }
        
        return `Faena ${filters.faenaSeleccionada}`;
      }

      // CASO 3: Usar faena del usuario (Bombero o fallback)
      if (user?.faena?.ubicacion) {
        return user.faena.ubicacion;
      }
      
      if (user?.nombre_faena) {
        return user.nombre_faena;
      }

      return 'Sistema de Gestión de Petróleo';
    } catch (error) {
      console.warn('Error obteniendo nombre de faena:', error);
      return 'Sistema de Gestión de Petróleo';
    }
  }

  // Función principal para generar PDF
  async generateConsumptionPDF(data) {
    try {
      const { consumos, stats, filters, totalItems, currentPage, user } = data;

      const doc = new jsPDF(this.defaultConfig);
      let yPosition = 15;

      // Inicializar tracker de paginación
      this.initializePaginationTracker(totalItems, currentPage, consumos);

      // 🆕 OBTENER NOMBRE DE FAENA
      const nombreFaena = await this.obtenerNombreFaena(user, filters);

      // Header mejorado con nombre de faena
      yPosition = this.addProfessionalHeader(doc, yPosition, nombreFaena);

      // Filtros con mejor diseño
      yPosition = this.addImprovedFiltersInfo(doc, filters, yPosition);

      // Estadísticas rediseñadas
      yPosition = this.addEnhancedStatistics(doc, stats, yPosition);

      // Tabla armoniosa y equilibrada
      this.addHarmoniousTableWithPagination(doc, consumos, yPosition);

      // Footer mejorado
      this.addProfessionalFooter(doc);

      // 🆕 GENERAR NOMBRE DE ARCHIVO CON FAENA
      const fileName = this.generateFileName(filters, nombreFaena);
      doc.save(fileName);

      return { success: true, fileName };

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  }

  // Inicializar tracker de paginación
  initializePaginationTracker(totalItems, currentPage, consumos) {
    this.paginationTracker = {
      totalItems: totalItems || 0,
      currentPage: currentPage || 1,
      totalRecords: consumos?.length || 0,
      recordsPerPageTracker: [], // Para rastrear registros por página
      currentPageNumber: 1
    };
  }

  // 🔧 HEADER CON ESPACIADO CORREGIDO Y NOMBRE DE FAENA
  addProfessionalHeader(doc, yPosition, nombreFaena = 'Sistema de Gestión de Petróleo') {
    // Fondo principal con degradado visual
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, 297, 30, 'F');

    // Banda decorativa inferior
    doc.setFillColor(...this.colors.primaryDark);
    doc.rect(0, 28, 297, 3, 'F');

    // 🆕 LÓGICA PARA LOGO SEGÚN FAENA
    const esFaenaTilTil = nombreFaena && (
      nombreFaena.toLowerCase().includes('til til') || 
      nombreFaena.toLowerCase().includes('tiltil') ||
      nombreFaena.toLowerCase().includes('til-til')
    );

    // Usar logo específico o logo empresa por defecto
    const logoAUsar = esFaenaTilTil ? logoFaenaTilTil : logoEmpresa;
    doc.addImage(logoAUsar, 'PNG', 20, 0, 28, 28);

    // Línea separadora elegante
    doc.setDrawColor(...this.colors.white);
    doc.setLineWidth(0.8);
    doc.line(75, 10, 75, 22);

    // Título principal centrado y destacado
    doc.setTextColor(...this.colors.white);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const titleText = 'REPORTE DE CONSUMOS DE COMBUSTIBLE';
    const titleWidth = doc.getTextWidth(titleText);
    const centerX = (297 - titleWidth) / 2;
    doc.text(titleText, centerX, 14);

    // 🆕 SUBTÍTULO CON NOMBRE DE FAENA
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const subtitleText = nombreFaena;
    const subtitleWidth = doc.getTextWidth(subtitleText);
    const subtitleCenterX = (297 - subtitleWidth) / 2;
    doc.text(subtitleText, subtitleCenterX, 20);

    // Línea separadora elegante
    doc.setDrawColor(...this.colors.white);
    doc.setLineWidth(0.8);
    doc.line(230, 10, 230, 22);

    // Info corporativa más alejada hacia la derecha
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, 235, 12);
    doc.text('3H Copper ', 235, 16);
    doc.text('https://m3h.cl/', 235, 20);

    return 40; // Más espacio después del header
  }

  // Filtros con diseño mejorado
  addImprovedFiltersInfo(doc, filters, yPosition) {
    const hasFilters = filters.dateFrom || filters.dateTo || filters.equipoFilter;

    if (hasFilters) {
      // Caja con sombra y bordes redondeados (simulados)
      doc.setFillColor(...this.colors.primaryLight);
      doc.rect(15, yPosition - 2, 267, 22, 'F');

      // Borde elegante
      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition - 2, 267, 22);

      // Título de filtros con icono
      doc.setTextColor(...this.colors.primaryDark);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('  FILTROS APLICADOS', 20, yPosition + 4);

      yPosition += 10;

      // Layout en columnas para los filtros
      let currentX = 25;
      const colWidth = 80;

      if (filters.dateFrom) {
        doc.setTextColor(...this.colors.darkGray);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Desde:', currentX, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(this.formatDate(filters.dateFrom), currentX, yPosition + 4);
        currentX += colWidth;
      }

      if (filters.dateTo) {
        doc.setTextColor(...this.colors.darkGray);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Hasta:', currentX, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(this.formatDate(filters.dateTo), currentX, yPosition + 4);
        currentX += colWidth;
      }

      if (filters.equipoFilter) {
        doc.setTextColor(...this.colors.darkGray);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Equipo:', currentX, yPosition);
        doc.setFont(undefined, 'bold');
        const equipoText = filters.equipoFilter.length > 20 ?
          filters.equipoFilter.substring(0, 20) + '...' : filters.equipoFilter;
        doc.text(equipoText, currentX, yPosition + 4);
      }

      yPosition += 15;
    } else {
      // Estilo para "sin filtros"
      doc.setFillColor(...this.colors.lightGray);
      doc.rect(15, yPosition - 2, 267, 10, 'F');

      doc.setTextColor(...this.colors.gray);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('REPORTE COMPLETO - Sin filtros aplicados', 20, yPosition + 3);
      yPosition += 15;
    }

    return yPosition;
  }

  // Estadísticas con diseño profesional corregido
  addEnhancedStatistics(doc, stats, yPosition) {
    // Calcular altura dinámica según contenido
    let boxHeight = 15; // Altura base
    if (stats.equipo_mas_usado && stats.equipo_mas_usado !== 'N/A') {
      boxHeight += 8; // Espacio adicional para equipo más usado
    }

    // Fondo gris claro profesional
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPosition - 3, 267, boxHeight, 'F');

    // Borde sutil
    doc.setDrawColor(...this.colors.mediumGray);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition - 3, 267, boxHeight);

    // Título de estadísticas
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN EJECUTIVO - 3H COPPER', 20, yPosition + 5);

    yPosition += 12;

    // Layout en grid 2x2 para mejor organización
    const statsData = [
      {
        icon: '',
        label: 'Total Consumos',
        value: stats.total_consumos?.toLocaleString() || '0'
      },
      {
        icon: '',
        label: 'Total Litros',
        value: `${this.formatNumber(stats.total_litros || 0)} L`
      }
    ];

    // Renderizar estadísticas con mejor espaciado
    const startX = 25;
    const colWidth = 125; // Más espacio horizontal
    const rowHeight = 9;   // Más espacio vertical

    statsData.forEach((stat, index) => {
      const x = startX + (index % 2) * colWidth;
      const y = yPosition + Math.floor(index / 2) * rowHeight;

      // Todo en negro - un solo color
      doc.setTextColor(0, 0, 0); // Negro para etiquetas
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`${stat.icon} ${stat.label}:`, x, y);

      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // Gris oscuro para valores
      doc.text(stat.value, x + 45, y);
    });

    yPosition += 15;

    return yPosition;
  }

  // Tabla armoniosa con diseño equilibrado - mejorado
  addHarmoniousTableWithPagination(doc, consumos, startY) {
    if (!consumos || consumos.length === 0) {
      // Estado vacío elegante
      doc.setFillColor(...this.colors.lightGray);
      doc.rect(15, startY, 267, 30, 'F');

      doc.setTextColor(...this.colors.gray);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('No hay consumos para mostrar', 130, startY + 15);

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Intenta ajustar los filtros de búsqueda', 125, startY + 22);
      
      // Paginación para estado vacío
      this.addPagePaginationInfo(doc, 0, 0, 180);
      return;
    }

    let yPosition = startY + 2;
    let recordsOnCurrentPage = 0;
    let pageStartRecord = 1;

    // Distribución optimizada - medición más angosta y espacio redistribuido
    const cols = {
      fechaHora: 18,       // 28mm - Fecha/Hora (+4mm)
      equipo: 48,          // 45mm - Equipo (+5mm)
      litros: 95,          // 32mm - Litros (+4mm)
      solicitante: 129,    // 60mm - Solicitante (+5mm)
      estanque: 191,       // 55mm - Estanques (+5mm)
      medicion: 248        // 25mm - Medición (más angosta)
    };

    // Definir anchos de columna para alineación correcta
    const colWidths = {
      fechaHora: 28,       // +4mm redistribuido
      equipo: 45,          // +5mm redistribuido
      litros: 32,          // +4mm redistribuido
      solicitante: 60,     // +5mm redistribuido
      estanque: 55,        // +5mm redistribuido
      medicion: 25         // Cambio: Más angosta (de 35 a 25, -10mm total)
    };

    // Header de tabla armonioso
    this.addCleanTableHeader(doc, cols, colWidths, yPosition);
    yPosition += 12;

    // Configuración de tabla - letra más grande
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...this.colors.darkGray);
    doc.setFontSize(9); // Cambio: De 8 a 9 (letra más grande)

    consumos.forEach((consumo, index) => {
      // Control de página mejorado
      if (yPosition > 160) {
        const pageEndRecord = pageStartRecord + recordsOnCurrentPage - 1;
        this.addPagePaginationInfo(doc, pageStartRecord, pageEndRecord, 175);

        doc.addPage();
        this.paginationTracker.currentPageNumber++;
        
        pageStartRecord = pageStartRecord + recordsOnCurrentPage;
        recordsOnCurrentPage = 0;
        yPosition = 25;
        
        this.addCleanTableHeader(doc, cols, colWidths, yPosition);
        yPosition += 12;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...this.colors.darkGray);
        doc.setFontSize(9); // Cambio: Letra más grande
      }

      recordsOnCurrentPage++;

      const isMultipleStanques = consumo.cantidad_estanques > 1;
      const rowHeight = isMultipleStanques ? 16 : 8;

      // Fondo alternado sutil y elegante
      if (index % 2 === 0) {
        doc.setFillColor(250, 251, 252);
        doc.rect(15, yPosition - 1, 267, rowHeight, 'F');
      }

      // Borde sutil entre filas
      doc.setDrawColor(...this.colors.mediumGray);
      doc.setLineWidth(0.05);
      doc.line(15, yPosition + rowHeight - 1, 282, yPosition + rowHeight - 1);

      // Renderizar contenido centrado
      this.renderCleanTableRow(doc, consumo, cols, colWidths, yPosition, isMultipleStanques);

      yPosition += rowHeight;
    });

    // Paginación al final
    const pageEndRecord = pageStartRecord + recordsOnCurrentPage - 1;
    this.addPagePaginationInfo(doc, pageStartRecord, pageEndRecord, yPosition + 10);
  }

  // Header de tabla limpio y profesional - con letra más grande
  addCleanTableHeader(doc, cols, colWidths, yPosition) {
    // Fondo del header
    doc.setFillColor(...this.colors.primary);
    doc.rect(15, yPosition - 2, 267, 10, 'F');

    // Líneas separadoras entre columnas
    doc.setDrawColor(...this.colors.primaryDark);
    doc.setLineWidth(0.3);

    const columnPositions = [
      cols.equipo - 1, 
      cols.litros - 1,
      cols.solicitante - 1,
      cols.estanque - 1, 
      cols.medicion - 1
    ];

    columnPositions.forEach(x => {
      doc.line(x, yPosition - 2, x, yPosition + 8);
    });

    // Textos del header centrados
    doc.setTextColor(...this.colors.white);
    doc.setFontSize(10); // Cambio: De 9 a 10 (letra más grande)
    doc.setFont(undefined, 'bold');

    const headers = [
      { text: 'Fecha/Hora', col: 'fechaHora' },
      { text: 'Equipo', col: 'equipo' },
      { text: 'Litros', col: 'litros' },
      { text: 'Solicitante', col: 'solicitante' },
      { text: 'Estanque(s)', col: 'estanque' },
      { text: 'Medición', col: 'medicion' }
    ];

    headers.forEach(header => {
      if (header.col === 'medicion') {
        // Medición alineada a la derecha
        const textWidth = doc.getTextWidth(header.text);
        const rightAlignX = cols[header.col] + colWidths[header.col] - textWidth - 2;
        doc.text(header.text, rightAlignX, yPosition + 4);
      } else {
        // Resto centrado como antes
        const textWidth = doc.getTextWidth(header.text);
        const centerX = cols[header.col] + (colWidths[header.col] - textWidth) / 2;
        doc.text(header.text, centerX, yPosition + 4);
      }
    });
  }

  // Renderizado optimizado de filas con letra más grande y medición a la derecha
  renderCleanTableRow(doc, consumo, cols, colWidths, yPosition, isMultipleStanques) {
    const centerY = yPosition + (isMultipleStanques ? 8 : 4);

    // === FECHA/HORA CENTRADA ===
    const fechaCompacta = this.formatDateCompact(consumo.fecha_consumo);
    const horaCompacta = this.formatTimeCompact(consumo.fecha_consumo);

    doc.setFontSize(9); // Cambio: De 8 a 9 (letra más grande)
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...this.colors.darkGray);
    
    const fechaWidth = doc.getTextWidth(fechaCompacta);
    const fechaCenterX = cols.fechaHora + (colWidths.fechaHora - fechaWidth) / 2;
    doc.text(fechaCompacta, fechaCenterX, centerY - 1);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8); // Cambio: De 7 a 8 (letra más grande)
    doc.setTextColor(...this.colors.gray);
    const horaWidth = doc.getTextWidth(horaCompacta);
    const horaCenterX = cols.fechaHora + (colWidths.fechaHora - horaWidth) / 2;
    doc.text(horaCompacta, horaCenterX, centerY + 2);

    // === EQUIPO ALINEADO A LA IZQUIERDA ===
    doc.setTextColor(...this.colors.darkGray); // Cambio: Color plomo en lugar de naranja
    doc.setFontSize(9); // Cambio: De 8 a 9 (letra más grande)
    doc.setFont(undefined, 'bold');
    const equipoNombre = consumo.nombre_maquina || 'N/A';
    const equipoDisplay = this.smartTruncate(equipoNombre, 32); // Cambio: Ajustado para nuevo ancho
    doc.text(equipoDisplay, cols.equipo + 2, centerY);

    // === LITROS DESTACADOS Y CENTRADOS ===
    doc.setTextColor(...this.colors.primary); // Mantener: Color naranja
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10); // Cambio: De 9 a 10 (letra más grande)
    const litrosText = `${this.formatNumber(consumo.litros_consumidos)} L`;
    const litrosWidth = doc.getTextWidth(litrosText);
    const litrosCenterX = cols.litros + (colWidths.litros - litrosWidth) / 2;
    doc.text(litrosText, litrosCenterX, centerY);

    // === SOLICITANTE ALINEADO A LA IZQUIERDA ===
    doc.setTextColor(...this.colors.darkGray); // Mantener: Color plomo
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9); // Cambio: De 8 a 9 (letra más grande)
    const solicitanteNombre = consumo.solicitante_nombre || 'N/A';
    const solicitanteDisplay = this.smartTruncate(solicitanteNombre, 40); // Cambio: Ajustado para nuevo ancho
    doc.text(solicitanteDisplay, cols.solicitante + 2, centerY);

    // === ESTANQUE CON MÚLTIPLES LÍNEAS Y MÁS ESPACIO ===
    this.renderMultiLineEstanqueInfo(doc, consumo, cols.estanque, colWidths.estanque, yPosition, isMultipleStanques);

    // === MEDICIÓN ALINEADA A LA DERECHA ===
    const medicionText = this.formatMedicion(consumo);
    doc.setFontSize(9); // Cambio: De 8 a 9 (letra más grande)
    doc.setTextColor(...this.colors.primary); // Cambio: Color naranja
    doc.setFont(undefined, 'bold'); // Nuevo: Bold para destacar como litros
    const medicionWidth = doc.getTextWidth(medicionText);
    // Nuevo: Alinear a la derecha de la columna
    const rightAlignX = cols.medicion + colWidths.medicion - medicionWidth - 2;
    doc.text(medicionText, rightAlignX, centerY);
  }

  // Renderizado de estanques con más espacio vertical - letra más grande
  renderMultiLineEstanqueInfo(doc, consumo, x, colWidth, yPosition, isMultiple) {
    const cantidad = consumo.cantidad_estanques || 1;

    if (cantidad > 1) {
      // === MÚLTIPLES ESTANQUES - CON MÁS ESPACIO ===
      
      const estanques = this.getEstanquesList(consumo);
      
      // Mostrar cada estanque con mejor espaciado vertical
      estanques.forEach((nombreEstanque, index) => {
        if (index < 4) { // Máximo 4 líneas
          const yLinePosition = yPosition + 3 + (index * 3.5);
          
          doc.setTextColor(...this.colors.darkGray);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8); // Cambio: De 7 a 8 (letra más grande)
          
          const nombreLimpio = this.cleanEstanqueName(nombreEstanque);
          const nombreTruncado = this.smartTruncate(nombreLimpio, 35); // Cambio: Ajustado para nuevo ancho de estanque
          const nombreWidth = doc.getTextWidth(nombreTruncado);
          const nombreCenterX = x + (colWidth - nombreWidth) / 2;
          
          doc.text(nombreTruncado, nombreCenterX, yLinePosition);
        }
      });
      
    } else {
      // === ESTANQUE ÚNICO CENTRADO ===
      const estanqueNombre = consumo.estanque || 'N/A';
      const nombreLimpio = this.cleanEstanqueName(estanqueNombre);
      const nombreFinal = this.smartTruncate(nombreLimpio, 37); // Cambio: Ajustado para nuevo ancho de estanque
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8); // Cambio: De 7 a 8 (letra más grande)
      doc.setTextColor(...this.colors.darkGray);
      const nombreWidth = doc.getTextWidth(nombreFinal);
      const nombreCenterX = x + (colWidth - nombreWidth) / 2;
      doc.text(nombreFinal, nombreCenterX, yPosition + 4);
    }
  }

  // Función para obtener lista real de estanques - con limpieza individual
  getEstanquesList(consumo) {
    const estanqueNombre = consumo.estanque || 'N/A';
    const cantidad = consumo.cantidad_estanques || 1;
    
    if (cantidad === 1) {
      return [this.cleanEstanqueName(estanqueNombre)];
    }
    
    // Dividir estanques por separadores comunes
    let estanques = [];
    
    // Buscar separadores comunes: " / ", " - ", " | ", " y ", " Y "
    if (estanqueNombre.includes(' / ')) {
      estanques = estanqueNombre.split(' / ');
    } else if (estanqueNombre.includes(' - ')) {
      estanques = estanqueNombre.split(' - ');
    } else if (estanqueNombre.includes(' | ')) {
      estanques = estanqueNombre.split(' | ');
    } else if (estanqueNombre.includes(' y ')) {
      estanques = estanqueNombre.split(' y ');
    } else if (estanqueNombre.includes(' Y ')) {
      estanques = estanqueNombre.split(' Y ');
    } else {
      // Si no hay separadores, intentar generar nombres basados en la cantidad
      const nombreBase = estanqueNombre.replace(/\s*\d+\s*$/, '');
      for (let i = 1; i <= Math.min(cantidad, 4); i++) {
        estanques.push(`${nombreBase} ${i}`);
      }
    }
    
    // Limpiar cada estanque individualmente
    estanques = estanques
      .map(est => est.trim()) // Quitar espacios
      .filter(est => est && est !== '') // Filtrar vacíos
      .map(est => this.cleanEstanqueName(est)) // Limpiar cada uno
      .slice(0, 4); // Máximo 4 estanques
    
    return estanques;
  }

  // Nueva función: información de paginación por página
  addPagePaginationInfo(doc, startRecord, endRecord, yPosition) {
    // Fondo elegante
    doc.setFillColor(...this.colors.mediumGray);
    doc.rect(15, yPosition - 1, 267, 8, 'F');

    // Borde sutil
    doc.setDrawColor(...this.colors.mediumGray);
    doc.setLineWidth(0.3);
    doc.rect(15, yPosition - 1, 267, 8);

    // Texto de paginación mejorado
    doc.setFontSize(8);
    doc.setTextColor(...this.colors.darkGray);
    doc.setFont(undefined, 'normal');

    let paginationText = '';
    
    if (startRecord === 0 && endRecord === 0) {
      paginationText = `Página ${this.paginationTracker.currentPageNumber} • Sin registros • Total general: ${this.paginationTracker.totalItems?.toLocaleString() || '0'}`;
    } else {
      paginationText = `Página ${this.paginationTracker.currentPageNumber} • Registros ${startRecord}-${endRecord} • Total general: ${this.paginationTracker.totalItems?.toLocaleString() || '0'}`;
    }

    // Centrar el texto
    const textWidth = doc.getTextWidth(paginationText);
    const centerX = (297 - textWidth) / 2;
    doc.text(paginationText, centerX, yPosition + 4);

    // Información adicional
    doc.setFontSize(7);
    doc.setTextColor(...this.colors.gray);
    
    if (startRecord > 0) {
      const recordsOnPage = endRecord - startRecord + 1;
      doc.text(`${recordsOnPage} reg. en página`, 235, yPosition + 4);
    }
  }

  // Footer profesional
  addProfessionalFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Fondo del footer
      doc.setFillColor(...this.colors.lightGray);
      doc.rect(0, 190, 297, 20, 'F');

      // Línea superior decorativa
      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(1.5);
      doc.line(0, 190, 297, 190);

      // Información corporativa
      doc.setFontSize(9);
      doc.setTextColor(...this.colors.darkGray);
      doc.setFont(undefined, 'bold');
      doc.text('3H COPPER', 20, 196);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('Sistema de Gestión de Combustible v2.0', 20, 200);

      doc.setFontSize(7);
      doc.setTextColor(...this.colors.gray);
      doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 20, 204);
      doc.text('Confidencial - Solo para uso interno', 20, 207);

      // Número de página elegante
      doc.setTextColor(...this.colors.primary);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text(`${i}`, 270, 196);

      doc.setTextColor(...this.colors.gray);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`de ${pageCount}`, 275, 196);

      // Logo pequeño
      doc.setTextColor(...this.colors.copper);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('3H', 250, 204);
    }
  }

  // === FUNCIONES DE UTILIDAD ===

  smartTruncate(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 2) + '..';
  }

  cleanEstanqueName(nombre) {
    if (!nombre) return 'N/A';
    return nombre
      .replace(/Cabildo\s*(esta?\.?\.\.)?\s*/gi, 'Cabildo ')
      .replace(/\s*\(\d+\s*estanq?\.*\.*\)/gi, '') // Quitar "(2 estanq..)" con puntos extra
      .replace(/\s*\(\d+\s*est\.*\.*\)/gi, '')     // Quitar "(2 est..)" con puntos extra
      .replace(/\s*\d+\s*estanq?\.*\.*$/gi, '')    // Quitar "2 estanq.." al final
      .replace(/\s*\d+\s*est\.*\.*$/gi, '')        // Quitar "2 est.." al final
      .replace(/\s*\(\d+\s*estanques?\)/gi, '')    // Quitar "(2 estanques)"
      .replace(/\s+/g, ' ')
      .trim();
  }

  formatDateCompact(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  formatTimeCompact(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRUT(rut) {
    if (!rut || rut === 'N/A' || rut === '0.000.000-0') return 'N/A';
    return rut;
  }

  formatMedicion(consumo) {
    if (!consumo.medicion) return 'N/A';
    const valor = this.formatNumber(consumo.medicion);
    const unidad = consumo.tipo_medicion === 'Kilometraje' ? 'km' : 'hrs';
    return `${valor} ${unidad}`;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatNumber(num) {
    return parseFloat(num || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // 🆕 GENERAR NOMBRE DE ARCHIVO CON FAENA
  generateFileName(filters, nombreFaena) {
    const timestamp = new Date().toISOString().slice(0, 10);
    let fileName = `3H-Copper-Consumos`;

    // Incluir faena si no es "todas"
    if (nombreFaena && !nombreFaena.includes('Todas las faenas') && nombreFaena !== 'Sistema de Gestión de Petróleo') {
      const faenaSafe = nombreFaena.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 15);
      fileName += `-${faenaSafe}`;
    }

    fileName += `-${timestamp}`;

    if (filters.dateFrom || filters.dateTo) {
      fileName += '-Filtrado';
    }

    if (filters.equipoFilter) {
      const equipoClean = filters.equipoFilter.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 15);
      fileName += `-${equipoClean}`;
    }

    return `${fileName}.pdf`;
  }
}

export default new PDFService();