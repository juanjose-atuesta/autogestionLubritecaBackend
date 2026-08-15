const path = require('path');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const Customer = require(path.join(__dirname, '..', 'models', 'customer'));

const toDateString = (v) => {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
};

const getMileage = (v) => {
  if (v === null || v === undefined) return '.';
  const str = String(v).trim();
  if (str === '' || str === '.') return '.';
  if (/^[,.\s]+$/.test(str) || /km/i.test(str)) return '.';
  const num = parseFloat(str.replace(',', '.'));
  if (isNaN(num)) return '.';
  return String(num);
};

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/autogestionLubritecaDB');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, '..', '..', 'Estado de Clientes.xlsx'));
  const ws = wb.getWorksheet(1);

  const rows = [];
  ws.eachRow({ includeEmpty: true }, (row, rn) => {
    if (rn < 3) return;
    const cedula = row.getCell(7).value;
    const nombre = row.getCell(5).value;
    const telefono = row.getCell(6).value;
    const placa = row.getCell(9).value;
    const evento = row.getCell(8).value;
    const km = row.getCell(10).value;

    if (cedula === null || cedula === undefined || cedula === '') return;
    const cedStr = String(cedula).trim().toUpperCase();
    if (cedStr === 'KM PROXIMO' || cedStr === 'N/A' || cedStr === 'S/A') return;

    rows.push({
      id: cedStr,
      name: String(nombre).trim().toUpperCase(),
      telephone: String(telefono).trim(),
      plate: String(placa).trim().toUpperCase(),
      entryDate: toDateString(row.getCell(3).value),
      nextContact: toDateString(row.getCell(4).value),
      service: String(evento).trim().toUpperCase(),
      mileage: getMileage(km)
    });
  });

  let created = 0, existing = 0, errors = 0;
  for (const r of rows) {
    try {
      const found = await Customer.findOne({
        name: r.name,
        telephone: r.telephone,
        entryDate: r.entryDate,
        nextContact: r.nextContact,
        service: r.service,
        mileage: r.mileage
      });
      if (found) {
        existing++;
        continue;
      }
      await Customer.create(r);
      created++;
    } catch (e) {
      errors++;
      console.error(`${r.id}:`, e.message);
    }
  }

  console.log(`Total: ${rows.length} | creados: ${created} | ya existían: ${existing} | errores: ${errors}`);
  await mongoose.disconnect();
})();