const path = require('path');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const User = require(path.join(__dirname, '..', 'models', 'user'));

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/autogestionLubritecaDB');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, '..', '..', 'Estado de Clientes.xlsx'));
  const ws = wb.getWorksheet(1);

  const rows = [];
  const seen = new Set();
  ws.eachRow({ includeEmpty: true }, (row, rn) => {
    if (rn < 3) return;
    const cedula = row.getCell(7).value;
    const nombre = row.getCell(5).value;
    const telefono = row.getCell(6).value;

    if (cedula === null || cedula === undefined || cedula === '') return;
    const cedStr = String(cedula).trim().toUpperCase();
    if (cedStr === 'KM PROXIMO' || cedStr === 'N/A' || cedStr === 'S/A') return;
    if (seen.has(cedStr)) return;
    seen.add(cedStr);

    rows.push({
      id: cedStr,
      name: String(nombre).trim().toUpperCase(),
      telephone: String(telefono).trim()
    });
  });

  let created = 0, existing = 0, errors = 0;
  for (const r of rows) {
    try {
      const found = await User.findOne({ id: r.id });
      if (found) {
        existing++;
        continue;
      }
      await User.create(r);
      created++;
    } catch (e) {
      errors++;
      console.error(`${r.id}:`, e.message);
    }
  }

  console.log(`Total: ${rows.length} | creados: ${created} | ya existían: ${existing} | errores: ${errors}`);
  await mongoose.disconnect();
})();