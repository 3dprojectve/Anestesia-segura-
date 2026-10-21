// Genera el PDF de la cotización (jsPDF + autoTable).
window.CotizacionPDF = (() => {
  const NAVY = [27, 31, 122];
  const BLUE = [21, 101, 192];
  const CYAN = [0, 188, 212];
  const LIGHT = [236, 244, 253];
  const TEXT = [33, 37, 60];
  const GRAY = [100, 108, 130];

  const PAGE_W = 210, PAGE_H = 297, M = 15, CONTENT_W = PAGE_W - M * 2;
  const BOTTOM = PAGE_H - 22;

  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fecha = (d) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function gradientLine(doc, x, y, w, h) {
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      doc.setFillColor(
        Math.round(NAVY[0] + (CYAN[0] - NAVY[0]) * t),
        Math.round(NAVY[1] + (CYAN[1] - NAVY[1]) * t),
        Math.round(NAVY[2] + (CYAN[2] - NAVY[2]) * t)
      );
      doc.rect(x + (w / steps) * i, y, w / steps + 0.2, h, 'F');
    }
  }

  function sectionTitle(doc, y, text) {
    const FONT = doc.__font || 'helvetica';
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, 3, 6, 1, 1, 'F');
    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(text, M + 6, y + 4.6);
    return y + 10;
  }

  // Cotizaciones viejas (solo péptidos) no tienen "items": se arman aquí.
  function itemsDe(q) {
    if (q.items && q.items.length) return q.items;
    return [{
      descripcion: `${q.medicamento.nombre} — ${q.medicamento.presentacion}\n${q.plan.nombre} (${q.plan.detalle})`,
      cantidad: q.cantidad, precio: q.precio,
    }];
  }

  function generar(q) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let FONT = 'helvetica';
    if (window.PDF_FONTS) {
      try {
        [['Regular', 'normal'], ['Bold', 'bold'], ['Italic', 'italic']].forEach(([w, st]) => {
          doc.addFileToVFS(`Montserrat-${w}.ttf`, window.PDF_FONTS[w]);
          doc.addFont(`Montserrat-${w}.ttf`, 'Montserrat', st);
        });
        FONT = 'Montserrat';
        doc.__font = FONT;
      } catch (e) {}
    }
    const C = window.CONFIG;
    let y;

    const ensure = (h) => {
      if (y + h <= BOTTOM) return;
      doc.addPage();
      try { doc.addImage(window.LOGO_DATA, 'PNG', M, 6, 20, 20 * (597 / 677), 'logo', 'FAST'); } catch (e) {}
      doc.setFont(FONT, 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
      doc.text('COTIZACIÓN', PAGE_W - M, 13, { align: 'right' });
      doc.setFont(FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
      doc.text(`N° ${q.numero} · ${q.paciente}`, PAGE_W - M, 18, { align: 'right' });
      gradientLine(doc, M, 25, CONTENT_W, 0.8);
      y = 34;
    };

    // ---------- Encabezado ----------
    const logoW = 40, logoH = logoW * (597 / 677);
    try { doc.addImage(window.LOGO_DATA, 'PNG', M, 8, logoW, logoH, 'logo', 'FAST'); } catch (e) {}

    doc.setFont(FONT, 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...NAVY);
    doc.text('COTIZACIÓN', PAGE_W - M, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text(C.doctor.marca.toUpperCase(), PAGE_W - M, 26, { align: 'right' });

    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const vence = new Date(q.fecha); vence.setDate(vence.getDate() + C.validezDias);
    doc.text(`N° ${q.numero}`, PAGE_W - M, 33, { align: 'right' });
    doc.text(`Fecha: ${fecha(q.fecha)}`, PAGE_W - M, 38, { align: 'right' });
    doc.text(`Válida hasta: ${fecha(vence)}`, PAGE_W - M, 43, { align: 'right' });

    gradientLine(doc, M, 8 + logoH + 3, CONTENT_W, 1.2);
    y = 8 + logoH + 9;

    // ---------- Datos ----------
    const filas = [
      ['Cliente', q.cliente],
      ['Paciente', q.paciente],
      ['Cédula', q.cedula || '—'],
      ['Teléfono', q.telefono || '—'],
      ['Edad', q.edad ? q.edad + ' años' : '—'],
      ['Sexo', q.sexo || '—'],
    ];
    if (q.tipo === 'servicios') {
      filas.push(
        ['Procedim.', q.procedimiento || '—'],
        ['Cirujano', q.cirujano || '—'],
        ['Clínica', q.clinica || '—'],
        ['Fecha cx.', q.fechaCirugia ? fecha(q.fechaCirugia + 'T12:00') : '—'],
      );
    }
    const boxH = 6 + Math.ceil(filas.length / 2) * 7;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M, y, CONTENT_W, boxH, 2.5, 2.5, 'F');
    filas.forEach(([k, v], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + 5 + col * (CONTENT_W / 2);
      const yy = y + 7.5 + row * 7;
      doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
      doc.text(k + ':', x, yy);
      doc.setFont(FONT, 'normal'); doc.setTextColor(...TEXT);
      const val = doc.splitTextToSize(String(v), CONTENT_W / 2 - 28)[0];
      doc.text(val, x + 20, yy);
    });
    y += boxH + 7;

    // ---------- Detalle ----------
    y = sectionTitle(doc, y, 'DETALLE DE LA COTIZACIÓN');
    doc.autoTable({
      startY: y,
      margin: { left: M, right: M },
      head: [['Descripción', 'Cant.', 'Precio unit.', 'Total']],
      body: itemsDe(q).map((it) => [it.descripcion, it.cantidad, money(it.precio), money(it.cantidad * it.precio)]),
      foot: [[{ content: 'TOTAL A PAGAR', colSpan: 3, styles: { halign: 'right' } }, money(q.total)]],
      theme: 'grid',
      styles: { font: FONT, fontSize: 9.5, textColor: TEXT, lineColor: [210, 220, 240], lineWidth: 0.2, cellPadding: 3 },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 11 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
      },
    });
    y = doc.lastAutoTable.finalY + 4;

    doc.setFont(FONT, 'italic'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
    doc.text('Precios expresados en dólares estadounidenses (USD).', M, y + 2);
    y += 8;

    if (q.plan && q.plan.incluye && q.plan.incluye.length) {
      ensure(10 + q.plan.incluye.length * 5.5);
      y = sectionTitle(doc, y, 'EL PLAN INCLUYE');
      doc.setFont(FONT, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...TEXT);
      q.plan.incluye.forEach((t) => {
        doc.setFillColor(...CYAN); doc.circle(M + 3, y - 1.2, 1, 'F');
        doc.text(t, M + 7, y);
        y += 5.5;
      });
      y += 3;
    }

    // ---------- Exámenes ----------
    if (q.examenes && q.examenes.length) {
      ensure(30);
      y = sectionTitle(doc, y, 'EXÁMENES A REALIZAR');
      doc.setFont(FONT, 'italic'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
      const sub = doc.splitTextToSize('Como protocolo para administración de Análogos de GLP-1 para pérdida de peso. Deben presentarse antes de iniciar el tratamiento.', CONTENT_W);
      doc.text(sub, M, y); y += sub.length * 4 + 3;

      doc.setFont(FONT, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...TEXT);
      const colW = CONTENT_W / 2 - 4;
      const items = q.examenes.map((t) => doc.splitTextToSize(t, colW - 8));
      const mitad = Math.ceil(items.length / 2);
      const cols = [items.slice(0, mitad), items.slice(mitad)];
      const altoCol = (c) => c.reduce((s, l) => s + l.length * 4.4 + 2, 0);
      ensure(Math.max(altoCol(cols[0]), altoCol(cols[1])) + 4);
      let maxY = y;
      cols.forEach((col, ci) => {
        let yy = y;
        const x = M + ci * (CONTENT_W / 2 + 2);
        col.forEach((lines) => {
          doc.setDrawColor(...BLUE); doc.setLineWidth(0.35);
          doc.roundedRect(x, yy - 3, 3.4, 3.4, 0.6, 0.6, 'S');
          doc.setDrawColor(...CYAN); doc.setLineWidth(0.6);
          doc.line(x + 0.7, yy - 1.4, x + 1.5, yy - 0.5);
          doc.line(x + 1.5, yy - 0.5, x + 2.9, yy - 2.5);
          doc.text(lines, x + 6, yy);
          yy += lines.length * 4.4 + 2;
        });
        maxY = Math.max(maxY, yy);
      });
      y = maxY + 4;
    }

    // ---------- Pago ----------
    if (q.pagos.length) {
      ensure(22);
      y = sectionTitle(doc, y, 'MÉTODO DE PAGO') + 3;
      doc.setFont(FONT, 'normal'); doc.setFontSize(9);
      let x = M;
      q.pagos.forEach((p) => {
        const w = doc.getTextWidth(p) + 8;
        if (x + w > PAGE_W - M) { x = M; y += 9; }
        doc.setFillColor(...LIGHT); doc.setDrawColor(...BLUE); doc.setLineWidth(0.3);
        doc.roundedRect(x, y - 4.5, w, 6.5, 3, 3, 'FD');
        doc.setTextColor(...NAVY);
        doc.text(p, x + 4, y);
        x += w + 3;
      });
      y += 10;
    }

    // ---------- Observaciones ----------
    if (q.notas) {
      const lines = doc.splitTextToSize(q.notas, CONTENT_W);
      ensure(12 + lines.length * 4.5);
      y = sectionTitle(doc, y, 'OBSERVACIONES');
      doc.setFont(FONT, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...TEXT);
      doc.text(lines, M, y); y += lines.length * 4.5 + 4;
    }

    // ---------- Términos ----------
    ensure(30);
    y = sectionTitle(doc, y, 'TÉRMINOS Y CONDICIONES');
    doc.setFontSize(8.3);
    q.terminos.forEach((t, i) => {
      const lines = doc.splitTextToSize(t, CONTENT_W - 7);
      ensure(lines.length * 3.7 + 2);
      doc.setFont(FONT, 'bold'); doc.setTextColor(...BLUE);
      doc.text(`${i + 1}.`, M, y);
      doc.setFont(FONT, 'normal'); doc.setTextColor(...TEXT);
      doc.text(lines, M + 7, y);
      y += lines.length * 3.7 + 1.8;
    });

    // ---------- Firmas ----------
    ensure(34);
    y += 18;
    const sw = 70;
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.4);
    doc.line(M + 5, y, M + 5 + sw, y);
    doc.line(PAGE_W - M - 5 - sw, y, PAGE_W - M - 5, y);
    doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text('Firma del paciente', M + 5 + sw / 2, y + 5, { align: 'center' });
    doc.text(C.doctor.nombre, PAGE_W - M - 5 - sw / 2, y + 5, { align: 'center' });
    doc.setFont(FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
    doc.text(`${q.paciente}${q.cedula ? ' · C.I. ' + q.cedula : ''}`, M + 5 + sw / 2, y + 9.5, { align: 'center' });
    doc.text(C.doctor.titulo, PAGE_W - M - 5 - sw / 2, y + 9.5, { align: 'center' });

    // ---------- Pie en todas las páginas ----------
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      gradientLine(doc, 0, PAGE_H - 13, PAGE_W, 0.8);
      doc.setFillColor(...NAVY);
      doc.rect(0, PAGE_H - 12.2, PAGE_W, 12.2, 'F');
      doc.setFont(FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
      doc.text(`${C.doctor.nombre} · ${C.doctor.titulo} · Tel. ${C.doctor.telefono}`, M, PAGE_H - 5);
      doc.text(`Pág. ${p}/${total}`, PAGE_W - M, PAGE_H - 5, { align: 'right' });
    }

    return doc;
  }

  const nombreArchivo = (q) =>
    `Cotizacion_${q.numero}_${(q.paciente || 'paciente').trim().replace(/\s+/g, '_').replace(/[^\wÁÉÍÓÚáéíóúÑñ_-]/g, '')}.pdf`;

  return { generar, nombreArchivo, money };
})();
