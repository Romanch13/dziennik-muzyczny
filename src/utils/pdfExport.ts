import { jsPDF } from 'jspdf';
import autoTablePlugin from 'jspdf-autotable';
import { MonthData } from '../types/journal';
import { LIBERATION_SANS_REGULAR, LIBERATION_SANS_BOLD } from './polishFont';

// Resolve plugin function for ESM/bundler compatibility
const autoTable = (autoTablePlugin as any).default || autoTablePlugin;

export function exportMonthToPdf(month: MonthData, schoolName = 'Warsztat Muzyczny na Jagodnie') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // --- REGISTER UTF-8 POLISH FONTS ---
  doc.addFileToVFS('LiberationSans-Regular.ttf', LIBERATION_SANS_REGULAR);
  doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');
  doc.addFileToVFS('LiberationSans-Bold.ttf', LIBERATION_SANS_BOLD);
  doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');
  doc.setFont('LiberationSans', 'normal');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // --- 1. TOP BRAND HEADER ---
  // Dark navy background band
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Indigo accent line
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Logo emblem box
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.roundedRect(margin, 6, 20, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('LiberationSans', 'bold');
  doc.text('WM', margin + 4.5, 19);

  // School name & subtitle
  doc.setFontSize(13);
  doc.setFont('LiberationSans', 'bold');
  doc.text(schoolName.toUpperCase(), margin + 25, 14);

  doc.setFontSize(8.5);
  doc.setFont('LiberationSans', 'normal');
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Wrocław — Jagodno  |  Dziennik Lekcji i Rozliczeń Finansowych', margin + 25, 20);

  // Month Capsule Badge on Right
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.roundedRect(pageWidth - margin - 58, 8, 58, 16, 2, 2, 'F');
  doc.setTextColor(250, 204, 21); // Amber-400
  doc.setFontSize(9.5);
  doc.setFont('LiberationSans', 'bold');
  doc.text(month.name.toUpperCase(), pageWidth - margin - 53, 15);
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  const printDate = new Date().toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(`Data raportu: ${printDate}`, pageWidth - margin - 53, 21);

  // --- 2. EXECUTIVE KPI SUMMARY CARDS (Clean 2-card layout without DODATKOWO & FREKWENCJA cards) ---
  let currentY = 40;
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 20;

  // Card 1: Suma całkowita (All regular + additional)
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.setFont('LiberationSans', 'bold');
  doc.text('SUMA CAŁKOWITA (MIESIĄC + DODATKOWO)', margin + 5, currentY + 6);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${month.grandTotal.toLocaleString('pl-PL')} zł`, margin + 5, currentY + 15);

  // Card 2: Grafik regularny (Poniedziałki + Piątki)
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + cardWidth + cardGap, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('LiberationSans', 'bold');
  doc.text('GRAFIK REGULARNY (PONIEDZIAŁKI + PIĄTKI)', margin + cardWidth + cardGap + 5, currentY + 6);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${month.regularTotal.toLocaleString('pl-PL')} zł`, margin + cardWidth + cardGap + 5, currentY + 15);

  currentY += cardHeight + 8;

  // --- 3. WEEKS AND LESSON TABLES ---
  for (const week of month.weeks) {
    const days = [week.monday, week.friday, week.singleDay].filter(Boolean);
    if (!days.length) continue;

    // Check if new page needed
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 18;
    }

    const weekTotal =
      (week.monday?.total || 0) +
      (week.friday?.total || 0) +
      (week.singleDay?.total || 0);

    // Week header ribbon
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('LiberationSans', 'bold');
    doc.text(week.weekTitle, margin + 4, currentY + 5);

    doc.setFontSize(8);
    doc.setFont('LiberationSans', 'bold');
    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.text(`Suma tygodnia: ${weekTotal.toLocaleString('pl-PL')} zł`, pageWidth - margin - 45, currentY + 5);

    currentY += 8.5;

    // Collect lesson rows
    const tableBody: (string | number)[][] = [];

    for (const d of days) {
      if (!d) continue;
      for (const l of d.lessons) {
        if (!l.student && !l.price) continue;
        let statusDisplay = 'Był';
        if (l.status === 'Nie był') {
          statusDisplay = l.excused === 'Liczę' ? 'Nie był (Liczę)' : 'Nie był (0 zł)';
        }
        tableBody.push([
          d.date || d.title,
          d.dayOfWeek,
          l.student || '(brak imienia)',
          l.duration,
          `${l.price} zł`,
          statusDisplay,
          `${l.sum} zł`,
        ]);
      }
    }

    if (tableBody.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Dzień', 'Uczeń', 'Czas', 'Stawka', 'Obecność', 'Suma']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          font: 'LiberationSans',
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2,
        },
        styles: {
          font: 'LiberationSans',
          fontSize: 7.8,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        alternateRowStyles: {
          font: 'LiberationSans',
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 23 },
          1: { cellWidth: 26 },
          2: { cellWidth: 46, fontStyle: 'bold' },
          3: { cellWidth: 21, halign: 'center' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 28, halign: 'center' },
          6: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = String(data.cell.raw);
            if (val.includes('Był') && !val.includes('Nie był')) {
              data.cell.styles.textColor = [16, 185, 129]; // Emerald
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('Nie był (Liczę)')) {
              data.cell.styles.textColor = [147, 51, 234]; // Purple
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('Nie był')) {
              data.cell.styles.textColor = [225, 29, 72]; // Rose
            }
          }
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // --- 4. DODATKOWO SECTION ---
  if (month.additional && month.additional.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFillColor(88, 28, 135); // Purple-900
    doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('LiberationSans', 'bold');
    doc.text('DODATKOWO (dowolny dzień pn–sb + data)', margin + 4, currentY + 5);

    doc.setFontSize(8);
    doc.setTextColor(233, 213, 255);
    doc.text(`Suma: ${month.additionalTotal.toLocaleString('pl-PL')} zł`, pageWidth - margin - 35, currentY + 5);

    currentY += 8.5;

    const addBody = month.additional.map((a) => [
      a.date || '—',
      a.day,
      a.student,
      a.duration,
      `${a.price} zł`,
      a.status || 'Był',
      `${a.sum} zł`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Dzień', 'Uczeń', 'Czas', 'Stawka', 'Obecność', 'Suma']],
      body: addBody,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234], // Purple-600
        textColor: [255, 255, 255],
        font: 'LiberationSans',
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        font: 'LiberationSans',
        fontSize: 7.8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 26 },
        2: { cellWidth: 46, fontStyle: 'bold' },
        3: { cellWidth: 21, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 28, halign: 'center' },
        6: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- 5. FINANCIAL SUMMARY ROW ---
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('LiberationSans', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Grafik (pon + pt): ${month.regularTotal.toLocaleString('pl-PL')} zł`, margin + 6, currentY + 8.5);
  doc.text(`Dodatkowo: ${month.additionalTotal.toLocaleString('pl-PL')} zł`, margin + 65, currentY + 8.5);
  doc.setTextColor(79, 70, 229);
  doc.text(`ŁĄCZNA SUMA: ${month.grandTotal.toLocaleString('pl-PL')} zł`, pageWidth - margin - 65, currentY + 8.5);

  currentY += 22;

  // --- 6. SIGNATURE BLOCK ---
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + contentWidth - 65, currentY + 10, margin + contentWidth, currentY + 10);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7.5);
  doc.setFont('LiberationSans', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Podpis osoby upoważnionej / Prowadzącego', margin + contentWidth - 63, currentY + 14);

  // --- 7. NUMBER OF PAGES FOOTER ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(7);
    doc.setFont('LiberationSans', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${schoolName}  •  Wrocław — Jagodno  •  Raport miesięczny: ${month.name}`, margin, pageHeight - 6);
    doc.text(`Strona ${i} z ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  // Save PDF with sanitized filename
  const cleanMonthName = month.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '');
  doc.save(`Warsztat_Muzyczny_${cleanMonthName}.pdf`);
}
