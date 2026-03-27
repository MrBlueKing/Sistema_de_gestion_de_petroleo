import jsPDF from 'jspdf';
import logoEmpresa from '../../assets/Syc.png';

const COLORS = {
  primary:     [249, 115, 22],
  primaryDark: [194, 65,  12],
  primaryLight:[254, 215, 170],
  blue:        [59,  130, 246],
  blueDark:    [29,  78,  216],
  blueLight:   [219, 234, 254],
  green:       [34,  197, 94],
  red:         [239, 68,  68],
  white:       [255, 255, 255],
  darkGray:    [51,  65,  85],
  gray:        [107, 114, 128],
  lightGray:   [248, 250, 252],
  mediumGray:  [226, 232, 240],
};

const PAGE_W  = 297;
const PAGE_H  = 210;
const MARGIN  = 12;
const CONTENT = PAGE_W - MARGIN * 2;

const fmt = (n, dec = 2) =>
  parseFloat(n || 0).toLocaleString('es-CL', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const variacion = (a, b) => {
  if (!a || a === 0) return null;
  return ((b - a) / a) * 100;
};

const labelMes = (mes, anio) => {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[mes - 1]} ${anio}`;
};

class ReporteComparativoService {

  // ─── HEADER ───────────────────────────────────────────────────────────────
  _addHeader(doc, periodoA, periodoB, faenasNombres) {
    doc.setFillColor(...COLORS.primaryDark);
    doc.rect(0, 0, PAGE_W, 28, 'F');
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 26, PAGE_W, 3, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    const title = 'REPORTE COMPARATIVO DE CONSUMO Y RENDIMIENTO';
    doc.text(title, (PAGE_W - doc.getTextWidth(title)) / 2, 12);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const sub = periodoB
      ? `Periodo A: ${labelMes(periodoA.mes, periodoA.anio)}   vs   Periodo B: ${labelMes(periodoB.mes, periodoB.anio)}`
      : `Periodo: ${labelMes(periodoA.mes, periodoA.anio)}`;
    doc.text(sub, (PAGE_W - doc.getTextWidth(sub)) / 2, 20);

    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 232, 10);
    doc.text('3H Copper', 232, 15);
    doc.text(`Faenas: ${faenasNombres}`, 232, 20);

    return 36;
  }

  // ─── SECTION TITLE ────────────────────────────────────────────────────────
  _sectionTitle(doc, y, text, color = COLORS.primary) {
    doc.setFillColor(...color);
    doc.rect(MARGIN, y, CONTENT, 7, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(text, MARGIN + 4, y + 5);
    return y + 11;
  }

  // ─── RESUMEN EJECUTIVO ────────────────────────────────────────────────────
  // maquinasA/B: array of machine objects from InformesController
  // faenasA/B: array of faena objects from InformesController
  _addResumen(doc, y, maquinasA, maquinasB, faenasA, faenasB, periodoA, periodoB) {
    y = this._sectionTitle(doc, y, '  RESUMEN EJECUTIVO');

    const totA     = faenasA.reduce((s, f) => s + parseFloat(f.litros_consumidos || 0), 0);
    const totB     = faenasB ? faenasB.reduce((s, f) => s + parseFloat(f.litros_consumidos || 0), 0) : null;
    const consA    = faenasA.reduce((s, f) => s + parseInt(f.total_maquinas || 0), 0);
    const consB    = faenasB ? faenasB.reduce((s, f) => s + parseInt(f.total_maquinas || 0), 0) : null;
    const conRendA = maquinasA.filter(m => parseFloat(m.rendimiento?.valor || 0) > 0).length;
    const conRendB = maquinasB ? maquinasB.filter(m => parseFloat(m.rendimiento?.valor || 0) > 0).length : null;

    const cards = [
      { label: 'Total Litros',           valA: `${fmt(totA)} L`,          valB: totB     !== null ? `${fmt(totB)} L`      : null, var: totB     !== null ? variacion(totA,     totB)     : null, color: COLORS.primary   },
      { label: 'Equipos por Faena',      valA: consA.toString(),           valB: consB    !== null ? consB.toString()      : null, var: consB    !== null ? variacion(consA,    consB)    : null, color: COLORS.blue      },
      { label: 'Con Rendimiento',        valA: conRendA.toString(),        valB: conRendB !== null ? conRendB.toString()   : null, var: conRendB !== null ? variacion(conRendA, conRendB) : null, color: [16, 185, 129]   },
      { label: 'Total Equipos',          valA: maquinasA.length.toString(),valB: maquinasB ? maquinasB.length.toString()  : null, var: null,                                                     color: [139, 92, 246]   },
    ];

    const GAP   = 4;
    const cardW = (CONTENT - GAP * (cards.length - 1)) / cards.length;
    const cardH = 32;
    let x = MARGIN;

    cards.forEach(card => {
      // Fondo
      doc.setFillColor(...COLORS.white);
      doc.rect(x, y, cardW, cardH, 'F');
      // Borde
      doc.setDrawColor(...card.color);
      doc.setLineWidth(0.6);
      doc.rect(x, y, cardW, cardH);
      // Franja color izquierda
      doc.setFillColor(...card.color);
      doc.rect(x, y, 3, cardH, 'F');

      // Label
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text(card.label, x + 7, y + 9);

      // Valor A
      doc.setTextColor(...card.color);
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text(card.valA, x + 7, y + 19);

      if (card.valB !== null) {
        // Valor B
        doc.setTextColor(...COLORS.blue);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`B: ${card.valB}`, x + 7, y + 27);

        // Variación
        if (card.var !== null) {
          const up      = card.var >= 0;
          const varText = `${up ? '▲' : '▼'} ${Math.abs(card.var).toFixed(1)}%`;
          doc.setTextColor(...(up ? COLORS.green : COLORS.red));
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          const tw = doc.getTextWidth(varText);
          doc.text(varText, x + cardW - tw - 4, y + 27);
        }
      }

      x += cardW + GAP;
    });

    return y + cardH + 6;
  }

  // ─── CONSUMO POR FAENA (tabla + barras) ──────────────────────────────────
  // faenasA/B: array of { id_faena, nombre_faena, litros_consumidos, total_maquinas }
  _addConsumoPorFaena(doc, y, faenasA, faenasB, periodoA, periodoB) {
    y = this._sectionTitle(doc, y, '  CONSUMO POR FAENA', COLORS.blue);

    const mapB = {};
    if (faenasB) faenasB.forEach(f => { mapB[f.id_faena] = f; });

    const maxLitros = Math.max(
      ...faenasA.map(f => parseFloat(f.litros_consumidos || 0)),
      ...(faenasB ? faenasB.map(f => parseFloat(f.litros_consumidos || 0)) : [0]),
      1
    );

    const cols = {
      faena:     MARGIN,
      litrosA:   MARGIN + 55,
      litrosB:   MARGIN + 100,
      varLitros: MARGIN + 145,
      consumosA: MARGIN + 175,
      consumosB: MARGIN + 210,
    };

    doc.setFillColor(...COLORS.darkGray);
    doc.rect(MARGIN, y, CONTENT, 7, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Faena',                                                cols.faena    + 2, y + 5);
    doc.text(`Litros ${labelMes(periodoA.mes, periodoA.anio)}`,     cols.litrosA  + 2, y + 5);
    if (faenasB) {
      doc.text(`Litros ${labelMes(periodoB.mes, periodoB.anio)}`,   cols.litrosB  + 2, y + 5);
      doc.text('Var %',                                              cols.varLitros + 2, y + 5);
    }
    doc.text('Equipos A',                                            cols.consumosA + 2, y + 5);
    if (faenasB) doc.text('Equipos B',                              cols.consumosB + 2, y + 5);
    y += 9;

    const BAR_MAX = 55;
    faenasA.forEach((faena, i) => {
      const rowH = 14;
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(MARGIN, y, CONTENT, rowH, 'F'); }
      doc.setDrawColor(...COLORS.mediumGray);
      doc.setLineWidth(0.1);
      doc.line(MARGIN, y + rowH, MARGIN + CONTENT, y + rowH);

      const litA = parseFloat(faena.litros_consumidos || 0);
      const fB   = mapB[faena.id_faena];
      const litB = fB !== undefined ? parseFloat(fB.litros_consumidos || 0) : null;
      const conA = parseInt(faena.total_maquinas || 0);
      const conB = fB !== undefined ? parseInt(fB.total_maquinas || 0) : null;
      const vr   = litB !== null ? variacion(litA, litB) : null;
      const nombre = (faena.nombre_faena || 'Sin faena').substring(0, 20);

      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(nombre, cols.faena + 2, y + 5);

      const barA = maxLitros > 0 ? (litA / maxLitros) * BAR_MAX : 0;
      doc.setFillColor(...COLORS.primary);
      doc.rect(cols.faena + 2, y + 7, barA, 2.5, 'F');

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.darkGray);
      doc.text(`${fmt(litA)} L`, cols.litrosA + 2, y + 5);

      if (litB !== null) {
        const barB = maxLitros > 0 ? (litB / maxLitros) * BAR_MAX : 0;
        doc.setFillColor(...COLORS.blue);
        doc.rect(cols.faena + 2, y + 10.5, barB, 2.5, 'F');

        doc.setTextColor(...COLORS.blue);
        doc.text(`${fmt(litB)} L`, cols.litrosB + 2, y + 5);

        if (vr !== null) {
          const up = vr >= 0;
          doc.setTextColor(...(up ? COLORS.green : COLORS.red));
          doc.setFont(undefined, 'bold');
          doc.text(`${up ? '▲' : '▼'} ${Math.abs(vr).toFixed(1)}%`, cols.varLitros + 2, y + 7);
        }
      }

      doc.setTextColor(...COLORS.darkGray);
      doc.setFont(undefined, 'normal');
      doc.text(conA.toString(), cols.consumosA + 2, y + 7);
      if (conB !== null) doc.text(conB.toString(), cols.consumosB + 2, y + 7);

      y += rowH;
    });

    y += 4;
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, y, 8, 3, 'F');
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    doc.text(`Periodo A: ${labelMes(periodoA.mes, periodoA.anio)}`, MARGIN + 10, y + 2.5);
    if (faenasB) {
      doc.setFillColor(...COLORS.blue);
      doc.rect(MARGIN + 60, y, 8, 3, 'F');
      doc.text(`Periodo B: ${labelMes(periodoB.mes, periodoB.anio)}`, MARGIN + 70, y + 2.5);
    }

    return y + 8;
  }

  // ─── RENDIMIENTO POR MÁQUINA ──────────────────────────────────────────────
  // maquinasA/B: array of machine objects with rendimiento: { valor, interpretacion, unidad }
  _addRendimiento(doc, y, maquinasA, maquinasB, periodoA, periodoB) {
    y = this._sectionTitle(doc, y, '  RENDIMIENTO POR MÁQUINA', [16, 185, 129]);

    const mapB = {};
    if (maquinasB) maquinasB.forEach(m => { mapB[m.id_maquina] = m; });

    const maquinas = maquinasA
      .filter(m => parseFloat(m.rendimiento?.valor || 0) > 0 ||
        (maquinasB && parseFloat(mapB[m.id_maquina]?.rendimiento?.valor || 0) > 0))
      .sort((a, b) => (parseFloat(b.litros_consumidos) || 0) - (parseFloat(a.litros_consumidos) || 0))
      .slice(0, 20);

    if (maquinas.length === 0) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(9);
      doc.text('No hay datos de rendimiento disponibles para el período seleccionado.', MARGIN + 4, y + 6);
      return y + 14;
    }

    const hasB = !!maquinasB;
    doc.setFillColor(...COLORS.darkGray);
    doc.rect(MARGIN, y, CONTENT, 7, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.text('Máquina',             MARGIN + 2,   y + 5);
    doc.text('Faena',               MARGIN + 55,  y + 5);
    doc.text('Litros A',            MARGIN + 90,  y + 5);
    doc.text('Rend A (L/h|km)',     MARGIN + 118, y + 5);
    if (hasB) {
      doc.text('Litros B',          MARGIN + 152, y + 5);
      doc.text('Rend B (L/h|km)',   MARGIN + 180, y + 5);
      doc.text('Var Rend',          MARGIN + 222, y + 5);
    }
    doc.text('Interpretación',      hasB ? MARGIN + 250 : MARGIN + 152, y + 5);
    y += 9;

    maquinas.forEach((m, i) => {
      if (y > PAGE_H - 25) { doc.addPage(); this._addMiniHeader(doc); y = 20; }
      const rowH = 9;
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(MARGIN, y, CONTENT, rowH, 'F'); }
      doc.setDrawColor(...COLORS.mediumGray);
      doc.setLineWidth(0.1);
      doc.line(MARGIN, y + rowH, MARGIN + CONTENT, y + rowH);

      const mB    = mapB[m.id_maquina];
      const rendA = parseFloat(m.rendimiento?.valor || 0);
      const rendB = mB ? parseFloat(mB.rendimiento?.valor || 0) : null;
      const vr    = (rendA > 0 && rendB > 0) ? variacion(rendA, rendB) : null;

      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      doc.text((m.nombre_maquina || 'N/A').substring(0, 26), MARGIN + 2, y + 6);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.text((m.nombre_faena || '').substring(0, 18), MARGIN + 55, y + 6);

      // Litros A
      doc.setTextColor(...COLORS.primary);
      doc.text(`${fmt(m.litros_consumidos)} L`, MARGIN + 90, y + 6);

      // Rendimiento A
      if (rendA > 0) {
        const unidad = m.tipo_medicion === 'Kilometraje' ? 'L/km' : 'L/h';
        const color  = rendA < 5 ? COLORS.green : rendA < 10 ? COLORS.primary : COLORS.red;
        doc.setTextColor(...color);
        doc.setFont(undefined, 'bold');
        doc.text(`${fmt(rendA, 2)} ${unidad}`, MARGIN + 118, y + 6);
      } else {
        doc.setTextColor(...COLORS.gray);
        doc.setFont(undefined, 'normal');
        doc.text('Sin datos', MARGIN + 118, y + 6);
      }

      if (hasB && mB) {
        doc.setTextColor(...COLORS.blue);
        doc.setFont(undefined, 'normal');
        doc.text(`${fmt(mB.litros_consumidos)} L`, MARGIN + 152, y + 6);

        if (rendB > 0) {
          const unidad = mB.tipo_medicion === 'Kilometraje' ? 'L/km' : 'L/h';
          const color  = rendB < 5 ? COLORS.green : rendB < 10 ? COLORS.primary : COLORS.red;
          doc.setTextColor(...color);
          doc.setFont(undefined, 'bold');
          doc.text(`${fmt(rendB, 2)} ${unidad}`, MARGIN + 180, y + 6);
        } else {
          doc.setTextColor(...COLORS.gray);
          doc.setFont(undefined, 'normal');
          doc.text('Sin datos', MARGIN + 180, y + 6);
        }

        if (vr !== null) {
          const up = vr <= 0; // Menos L/h = mejor eficiencia
          doc.setTextColor(...(up ? COLORS.green : COLORS.red));
          doc.setFont(undefined, 'bold');
          doc.text(`${up ? '▼' : '▲'} ${Math.abs(vr).toFixed(1)}%`, MARGIN + 222, y + 6);
        }
      }

      doc.setTextColor(...COLORS.gray);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(6.5);
      const interp = (m.rendimiento?.interpretacion || '').substring(0, 30);
      doc.text(interp, hasB ? MARGIN + 250 : MARGIN + 152, y + 6);

      y += rowH;
    });

    return y + 4;
  }

  // ─── MINI HEADER (páginas 2+) ─────────────────────────────────────────────
  _addMiniHeader(doc) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE_W, 10, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE COMPARATIVO - 3H COPPER', MARGIN, 7);
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  _addFooter(doc) {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(0, PAGE_H - 10, PAGE_W, 10, 'F');
      doc.setDrawColor(...COLORS.primary);
      doc.setLineWidth(0.8);
      doc.line(0, PAGE_H - 10, PAGE_W, PAGE_H - 10);

      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('3H Copper — Sistema de Gestión de Combustible', MARGIN, PAGE_H - 4);
      doc.text('Documento confidencial — Solo para uso interno', MARGIN + 100, PAGE_H - 4);

      doc.setTextColor(...COLORS.primary);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text(`${i} / ${pages}`, PAGE_W - MARGIN - 6, PAGE_H - 4);
    }
  }

  // ─── MÉTODO PRINCIPAL ─────────────────────────────────────────────────────
  // datosA/B: { maquinas: [...], faenas: [...] }  from InformesController response
  async generar({ periodoA, periodoB, datosA, datosB, faenas, faenasNombres, secciones }) {
    const maquinasA = datosA?.maquinas || [];
    const faenasA   = datosA?.faenas   || [];
    const maquinasB = datosB?.maquinas || null;
    const faenasB   = datosB?.faenas   || null;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let y = this._addHeader(doc, periodoA, periodoB, faenasNombres);

    // Resumen ejecutivo (siempre)
    y = this._addResumen(doc, y, maquinasA, maquinasB, faenasA, faenasB, periodoA, periodoB);

    // Consumo por faena
    if (secciones.consumoPorFaena) {
      if (y > PAGE_H - 60) { doc.addPage(); this._addMiniHeader(doc); y = 18; }
      y = this._addConsumoPorFaena(doc, y, faenasA, faenasB, periodoA, periodoB);
    }

    // Rendimiento por maquina
    if (secciones.rendimiento) {
      doc.addPage();
      this._addMiniHeader(doc);
      y = 18;
      y = this._addRendimiento(doc, y, maquinasA, maquinasB, periodoA, periodoB);
    }

    this._addFooter(doc);

    const mA = labelMes(periodoA.mes, periodoA.anio).replace(' ', '-');
    const mB = periodoB ? `_vs_${labelMes(periodoB.mes, periodoB.anio).replace(' ', '-')}` : '';
    doc.save(`Reporte-Comparativo_${mA}${mB}.pdf`);
  }
}

export default new ReporteComparativoService();
