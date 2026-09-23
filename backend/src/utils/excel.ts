import ExcelJS from "exceljs";

/** Bold white-on-rose header row with Excel's filter arrows. */
export function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE11D48" } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
}

export const USD_FORMAT = "$#,##0.00";
export const DATE_TIME_FORMAT = "yyyy-mm-dd hh:mm";
