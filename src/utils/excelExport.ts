import ExcelJS from 'exceljs';
import { MonthData, Week, DaySchedule } from '../types/journal';

/**
 * Exports the month schedule to an Excel (.xlsx) workbook
 * styled identically to the original school template spreadsheet.
 */
export async function exportMonthToExcel(
  month: MonthData,
  schoolName = 'Warsztat Muzyczny na Jagodnie'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = schoolName;
  workbook.created = new Date();

  // Create sheet with sanitized month name
  const sheetName = month.name.slice(0, 31).replace(/[:\\\/?*\[\]]/g, '');
  const ws = workbook.addWorksheet(sheetName || 'Dziennik lekcji', {
    views: [{ showGridLines: true }]
  });

  // --- PALETTE CONSTANTS (Matching template screenshot) ---
  const C_TITLE_FILL = 'FFBDD7EE';       // Light Soft Blue (Row 1)
  const C_WEEK_FILL = 'FFD9E1F2';        // Soft slate blue/gray for week ribbon
  const C_DAY_HEADER_FILL = 'FF2F5597';  // Deep steel blue for day subheaders
  const C_COL_HEADER_FILL = 'FFBDD7EE';  // Soft blue for columns Data, Imię, Czas, etc.
  const C_DATA_CREAM = 'FFFEF9E7';       // Pale cream/warm light yellow data row
  const C_SUMMARY_GREEN = 'FF70AD47';    // Medium green for day summary rows
  const C_PURPLE_HEADER = 'FF7030A0';    // Royal purple for DODATKOWO header
  const C_PURPLE_SUBHEAD = 'FFD9D2E9';   // Light lavender for DODATKOWO subheaders
  const C_YELLOW_BOX = 'FFFFC000';       // Golden yellow for month total box
  const C_ORANGE_BOX = 'FFED7D31';       // Rich orange for grand total box
  const C_BORDER_GRAY = 'FFBFBFBF';      // Border lines
  const C_DARK_BORDER = 'FF000000';      // Outer borders

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: C_BORDER_GRAY } },
    left: { style: 'thin', color: { argb: C_BORDER_GRAY } },
    bottom: { style: 'thin', color: { argb: C_BORDER_GRAY } },
    right: { style: 'thin', color: { argb: C_BORDER_GRAY } },
  };

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: C_DARK_BORDER } },
    left: { style: 'medium', color: { argb: C_DARK_BORDER } },
    bottom: { style: 'medium', color: { argb: C_DARK_BORDER } },
    right: { style: 'medium', color: { argb: C_DARK_BORDER } },
  };

  // Helper to style a cell
  const setCell = (
    cell: ExcelJS.Cell,
    val: ExcelJS.CellValue,
    opts?: {
      font?: Partial<ExcelJS.Font>;
      fill?: string;
      alignment?: Partial<ExcelJS.Alignment>;
      border?: Partial<ExcelJS.Borders>;
    }
  ) => {
    cell.value = val;
    if (opts?.font) cell.font = opts.font;
    if (opts?.fill) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: opts.fill }
      };
    }
    if (opts?.alignment) cell.alignment = opts.alignment;
    if (opts?.border) cell.border = opts.border;
  };

  // Helper to format a block of cells (useful after merge)
  const formatRange = (
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    opts: {
      fill?: string;
      border?: Partial<ExcelJS.Borders>;
      font?: Partial<ExcelJS.Font>;
      alignment?: Partial<ExcelJS.Alignment>;
    }
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(r, c);
        if (opts.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: opts.fill }
          };
        }
        if (opts.border) cell.border = opts.border;
        if (opts.font) cell.font = opts.font;
        if (opts.alignment) cell.alignment = opts.alignment;
      }
    }
  };

  // Column widths:
  // Cols 1-7: Left table (A to G)
  // Col 8: Separator (H)
  // Cols 9-15: Right table (I to O)
  ws.columns = [
    { key: 'A', width: 13 }, // Data
    { key: 'B', width: 17 }, // Imię ucznia
    { key: 'C', width: 11 }, // Czas
    { key: 'D', width: 9 },  // Cena
    { key: 'E', width: 13 }, // Był/Nie był
    { key: 'F', width: 10 }, // Suma
    { key: 'G', width: 18 }, // Nie było, ale liczę
    { key: 'H', width: 4 },  // Separator
    { key: 'I', width: 13 }, // Data
    { key: 'J', width: 17 }, // Imię ucznia
    { key: 'K', width: 11 }, // Czas
    { key: 'L', width: 9 },  // Cena
    { key: 'M', width: 13 }, // Był/Nie był
    { key: 'N', width: 10 }, // Suma
    { key: 'O', width: 18 }, // Nie było, ale liczę
  ];

  let curRow = 1;

  // --- 1. TITLE ROW (Row 1) ---
  ws.mergeCells(curRow, 1, curRow, 15);
  formatRange(1, curRow, 15, curRow, {
    fill: C_TITLE_FILL,
    border: thinBorder,
    font: { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F4E79' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  });
  ws.getCell(curRow, 1).value = `Dziennik lekcji — ${month.name}`;
  ws.getRow(curRow).height = 26;
  curRow++;

  // --- 2. RATES ROW (Row 2) ---
  ws.getCell(curRow, 1).value = 'Ceny:';
  ws.getCell(curRow, 1).font = { name: 'Calibri', size: 9.5, bold: true };
  ws.getCell(curRow, 1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  ws.mergeCells(curRow, 2, curRow, 15);
  ws.getCell(curRow, 2).value = '30 min = 40 zł  |  45 min = 60 zł  |  60 min = 70 zł';
  ws.getCell(curRow, 2).font = { name: 'Calibri', size: 9.5 };
  ws.getCell(curRow, 2).alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(curRow).height = 18;
  curRow++;

  // --- 3. LAYOUT INSTRUCTIONS ROW (Row 3) ---
  ws.getCell(curRow, 1).value = 'Układ:';
  ws.getCell(curRow, 1).font = { name: 'Calibri', size: 9, bold: true };
  ws.getCell(curRow, 1).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells(curRow, 2, curRow, 15);
  ws.getCell(curRow, 2).value =
    'Poniedziałek / Piątek tego samego tygodnia obok siebie. Jeśli w tygodniu tylko jeden dzień — osobno. Jeśli «Nie był» — wiersz przekreślony i nie liczy się do sumy. Kolumna «Nie było, ale liczę»: wybierz Liczę, aby doliczyć mimo nieobecności.';
  ws.getCell(curRow, 2).font = { name: 'Calibri', size: 8.5, color: { argb: 'FF333333' } };
  ws.getCell(curRow, 2).alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(curRow).height = 18;
  curRow++;

  // Spacer row
  ws.getRow(curRow).height = 10;
  curRow++;

  // --- 4. WEEKS WITH 2-COLUMN TABLES ---
  for (const week of month.weeks) {
    const leftDay: DaySchedule | null = week.monday || week.singleDay || null;
    const rightDay: DaySchedule | null = week.monday && week.friday ? week.friday : null;

    if (!leftDay && !rightDay) continue;

    // --- A. WEEK HEADER BAR ---
    ws.mergeCells(curRow, 1, curRow, 15);
    formatRange(1, curRow, 15, curRow, {
      fill: C_WEEK_FILL,
      border: thinBorder,
      font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F4E79' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    });
    ws.getCell(curRow, 1).value = week.weekTitle;
    ws.getRow(curRow).height = 20;
    curRow++;

    // --- B. DAY SUBHEADERS ---
    // Left day
    if (leftDay) {
      ws.mergeCells(curRow, 1, curRow, 7);
      formatRange(1, curRow, 7, curRow, {
        fill: C_DAY_HEADER_FILL,
        border: thinBorder,
        font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 }
      });
      ws.getCell(curRow, 1).value = leftDay.date 
        ? `${leftDay.dayOfWeek}, ${leftDay.date}`
        : leftDay.title;
    }

    // Right day
    if (rightDay) {
      ws.mergeCells(curRow, 9, curRow, 15);
      formatRange(9, curRow, 15, curRow, {
        fill: C_DAY_HEADER_FILL,
        border: thinBorder,
        font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } },
        alignment: { vertical: 'middle', horizontal: 'left', indent: 1 }
      });
      ws.getCell(curRow, 9).value = rightDay.date
        ? `${rightDay.dayOfWeek}, ${rightDay.date}`
        : rightDay.title;
    }
    ws.getRow(curRow).height = 19;
    curRow++;

    // --- C. COLUMN SUBHEADERS ---
    const subheaders = ['Data', 'Imię ucznia', 'Czas', 'Cena', 'Był/Nie był', 'Suma', 'Nie było, ale liczę'];
    
    // Left table headers
    if (leftDay) {
      for (let i = 0; i < subheaders.length; i++) {
        const c = ws.getCell(curRow, i + 1);
        setCell(c, subheaders[i], {
          font: { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1F4E79' } },
          fill: C_COL_HEADER_FILL,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });
      }
    }

    // Right table headers
    if (rightDay) {
      for (let i = 0; i < subheaders.length; i++) {
        const c = ws.getCell(curRow, i + 9);
        setCell(c, subheaders[i], {
          font: { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1F4E79' } },
          fill: C_COL_HEADER_FILL,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });
      }
    }
    ws.getRow(curRow).height = 18;
    curRow++;

    // --- D. DATA ROWS (Min 10 rows per day like screenshot) ---
    const leftCount = leftDay ? leftDay.lessons.length : 0;
    const rightCount = rightDay ? rightDay.lessons.length : 0;
    const maxRows = Math.max(leftCount, rightCount, 10);

    for (let r = 0; r < maxRows; r++) {
      ws.getRow(curRow).height = 18;

      // Render Left Day row
      if (leftDay) {
        const l = r < leftCount ? leftDay.lessons[r] : null;
        const dateStr = leftDay.date || '';
        const isAbsent = l ? l.status === 'Nie był' : false;
        const isExcused = l && l.excused === 'Liczę';
        const isStruck = isAbsent && !isExcused;

        const rowFont: Partial<ExcelJS.Font> = {
          name: 'Calibri',
          size: 9,
          strike: isStruck,
          color: isStruck ? { argb: 'FFC00000' } : isExcused ? { argb: 'FF7030A0' } : undefined,
        };

        // Col 1: Data
        setCell(ws.getCell(curRow, 1), dateStr, {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 2: Imię ucznia
        setCell(ws.getCell(curRow, 2), l ? l.student : '', {
          font: { ...rowFont, bold: Boolean(l) },
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
          border: thinBorder,
        });

        // Col 3: Czas
        setCell(ws.getCell(curRow, 3), l ? l.duration : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 4: Cena
        setCell(ws.getCell(curRow, 4), l ? l.price : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'right' },
          border: thinBorder,
        });

        // Col 5: Był/Nie był
        setCell(ws.getCell(curRow, 5), l ? l.status : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 6: Suma
        setCell(ws.getCell(curRow, 6), l ? l.sum : 0, {
          font: { ...rowFont, bold: Boolean(l && l.sum > 0) },
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'right' },
          border: thinBorder,
        });

        // Col 7: Nie było, ale liczę
        setCell(ws.getCell(curRow, 7), l && l.excused === 'Liczę' ? 'Liczę' : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });
      }

      // Render Right Day row
      if (rightDay) {
        const l = r < rightCount ? rightDay.lessons[r] : null;
        const dateStr = rightDay.date || '';
        const isAbsent = l ? l.status === 'Nie był' : false;
        const isExcused = l && l.excused === 'Liczę';
        const isStruck = isAbsent && !isExcused;

        const rowFont: Partial<ExcelJS.Font> = {
          name: 'Calibri',
          size: 9,
          strike: isStruck,
          color: isStruck ? { argb: 'FFC00000' } : isExcused ? { argb: 'FF7030A0' } : undefined,
        };

        // Col 9: Data
        setCell(ws.getCell(curRow, 9), dateStr, {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 10: Imię ucznia
        setCell(ws.getCell(curRow, 10), l ? l.student : '', {
          font: { ...rowFont, bold: Boolean(l) },
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
          border: thinBorder,
        });

        // Col 11: Czas
        setCell(ws.getCell(curRow, 11), l ? l.duration : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 12: Cena
        setCell(ws.getCell(curRow, 12), l ? l.price : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'right' },
          border: thinBorder,
        });

        // Col 13: Był/Nie był
        setCell(ws.getCell(curRow, 13), l ? l.status : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });

        // Col 14: Suma
        setCell(ws.getCell(curRow, 14), l ? l.sum : 0, {
          font: { ...rowFont, bold: Boolean(l && l.sum > 0) },
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'right' },
          border: thinBorder,
        });

        // Col 15: Nie było, ale liczę
        setCell(ws.getCell(curRow, 15), l && l.excused === 'Liczę' ? 'Liczę' : '', {
          font: rowFont,
          fill: C_DATA_CREAM,
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: thinBorder,
        });
      }

      curRow++;
    }

    // --- E. SUMMARY ROW ---
    ws.getRow(curRow).height = 20;

    // Left day summary
    if (leftDay) {
      ws.mergeCells(curRow, 1, curRow, 5);
      formatRange(1, curRow, 5, curRow, {
        fill: C_SUMMARY_GREEN,
        border: thinBorder,
        font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } },
        alignment: { vertical: 'middle', horizontal: 'right' }
      });
      ws.getCell(curRow, 1).value = `Podsumowanie ${leftDay.date}:`;

      // Col 6: Sum
      setCell(ws.getCell(curRow, 6), leftDay.total, {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } },
        fill: C_SUMMARY_GREEN,
        alignment: { vertical: 'middle', horizontal: 'right' },
        border: thinBorder,
      });

      // Col 7: Empty
      setCell(ws.getCell(curRow, 7), '', {
        fill: C_SUMMARY_GREEN,
        border: thinBorder,
      });
    }

    // Right day summary
    if (rightDay) {
      ws.mergeCells(curRow, 9, curRow, 13);
      formatRange(9, curRow, 13, curRow, {
        fill: C_SUMMARY_GREEN,
        border: thinBorder,
        font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } },
        alignment: { vertical: 'middle', horizontal: 'right' }
      });
      ws.getCell(curRow, 9).value = `Podsumowanie ${rightDay.date}:`;

      // Col 14: Sum
      setCell(ws.getCell(curRow, 14), rightDay.total, {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } },
        fill: C_SUMMARY_GREEN,
        alignment: { vertical: 'middle', horizontal: 'right' },
        border: thinBorder,
      });

      // Col 15: Empty
      setCell(ws.getCell(curRow, 15), '', {
        fill: C_SUMMARY_GREEN,
        border: thinBorder,
      });
    }
    curRow++;

    // Spacer row after week
    ws.getRow(curRow).height = 10;
    curRow++;
  }

  // --- 5. DODATKOWO SECTION ---
  ws.mergeCells(curRow, 1, curRow, 7);
  formatRange(1, curRow, 7, curRow, {
    fill: C_PURPLE_HEADER,
    border: thinBorder,
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 }
  });
  ws.getCell(curRow, 1).value = 'DODATKOWO (dowolny dzień pn-sb + data)';
  ws.getRow(curRow).height = 19;
  curRow++;

  // DODATKOWO subheaders
  const extraHeaders = ['Dzień', 'Data', 'Imię', 'Czas', 'Cena', 'Był/Nie był', 'Suma'];
  for (let i = 0; i < extraHeaders.length; i++) {
    const c = ws.getCell(curRow, i + 1);
    setCell(c, extraHeaders[i], {
      font: { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF4A148C' } },
      fill: C_PURPLE_SUBHEAD,
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    });
  }
  ws.getRow(curRow).height = 18;
  curRow++;

  const extraLessons = month.additional || [];
  const extraRowsCount = Math.max(extraLessons.length, 10);

  for (let r = 0; r < extraRowsCount; r++) {
    ws.getRow(curRow).height = 18;
    const l = r < extraLessons.length ? extraLessons[r] : null;
    const isAbsent = l ? l.status === 'Nie był' : false;

    const rowFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 9,
      strike: isAbsent,
      color: isAbsent ? { argb: 'FFC00000' } : undefined,
    };

    // Col 1: Dzień
    setCell(ws.getCell(curRow, 1), l ? l.day : '', {
      font: rowFont,
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    });

    // Col 2: Data
    setCell(ws.getCell(curRow, 2), l ? l.date : '', {
      font: rowFont,
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    });

    // Col 3: Imię
    setCell(ws.getCell(curRow, 3), l ? l.student : '', {
      font: { ...rowFont, bold: Boolean(l) },
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
      border: thinBorder,
    });

    // Col 4: Czas
    setCell(ws.getCell(curRow, 4), l ? l.duration : '', {
      font: rowFont,
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    });

    // Col 5: Cena
    setCell(ws.getCell(curRow, 5), l ? l.price : '', {
      font: rowFont,
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'right' },
      border: thinBorder,
    });

    // Col 6: Był/Nie był
    setCell(ws.getCell(curRow, 6), l ? (l.status || 'Był') : '', {
      font: rowFont,
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    });

    // Col 7: Suma
    setCell(ws.getCell(curRow, 7), l ? l.sum : 0, {
      font: { ...rowFont, bold: Boolean(l && l.sum > 0) },
      fill: C_DATA_CREAM,
      alignment: { vertical: 'middle', horizontal: 'right' },
      border: thinBorder,
    });

    curRow++;
  }

  // DODATKOWO summary
  ws.mergeCells(curRow, 1, curRow, 6);
  formatRange(1, curRow, 6, curRow, {
    fill: C_SUMMARY_GREEN,
    border: thinBorder,
    font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'right' }
  });
  ws.getCell(curRow, 1).value = 'Podsumowanie Dodatkowo:';

  setCell(ws.getCell(curRow, 7), month.additionalTotal, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } },
    fill: C_SUMMARY_GREEN,
    alignment: { vertical: 'middle', horizontal: 'right' },
    border: thinBorder,
  });
  ws.getRow(curRow).height = 20;
  curRow++;

  // Spacer
  ws.getRow(curRow).height = 10;
  curRow++;

  // --- 6. GRAND TOTALS BOXES (Yellow & Orange) ---
  // Box 1: Regular Month Total (Pon + Pt)
  ws.mergeCells(curRow, 1, curRow, 5);
  formatRange(1, curRow, 5, curRow, {
    fill: C_YELLOW_BOX,
    border: mediumBorder,
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'right' }
  });
  ws.getCell(curRow, 1).value = 'SUMA ZA MIESIĄC (pon + pt):';

  ws.mergeCells(curRow, 6, curRow, 7);
  formatRange(6, curRow, 7, curRow, {
    fill: C_YELLOW_BOX,
    border: mediumBorder,
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF000000' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  });
  ws.getCell(curRow, 6).value = `${month.regularTotal.toLocaleString('pl-PL')} zł`;
  ws.getRow(curRow).height = 22;
  curRow++;

  // Box 2: Total Month (Regular + Additional)
  ws.mergeCells(curRow, 1, curRow, 5);
  formatRange(1, curRow, 5, curRow, {
    fill: C_ORANGE_BOX,
    border: mediumBorder,
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { vertical: 'middle', horizontal: 'right' }
  });
  ws.getCell(curRow, 1).value = 'SUMA CAŁKOWITA (miesiąc + Dodatkowo):';

  ws.mergeCells(curRow, 6, curRow, 7);
  formatRange(6, curRow, 7, curRow, {
    fill: C_ORANGE_BOX,
    border: mediumBorder,
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { vertical: 'middle', horizontal: 'center' }
  });
  ws.getCell(curRow, 6).value = `${month.grandTotal.toLocaleString('pl-PL')} zł`;
  ws.getRow(curRow).height = 24;

  // --- 7. EXPORT WORKBOOK FILE IN BROWSER ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = month.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  a.download = `Warsztat_muzyczny_na_Jagodnie_${cleanName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
