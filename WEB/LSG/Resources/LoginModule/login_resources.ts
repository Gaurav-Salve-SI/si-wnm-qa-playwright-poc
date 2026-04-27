// Utils/ExcelUtils.ts
import * as XLSX from 'xlsx';
import * as path from 'path';

export function getExcelData(filePath: string, sheetName: string = 'Sheet1') 
{
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[sheetName];
        // Converts the Excel rows into an array of objects
        return XLSX.utils.sheet_to_json(sheet);
    } catch (error) {
        console.error(`Error reading Excel file: ${error}`);
        return [];
    }
}