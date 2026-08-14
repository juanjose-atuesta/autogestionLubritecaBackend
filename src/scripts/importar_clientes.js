const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/autogestionLubritecaDB');
  const path = require('path');
const User = require(path.join(__dirname, '..', 'models', 'user'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, '..', '..', 'Estado de Clientes - importar.xlsx'));
  const ws = wb.getWorksheet(1);

  const rows = [];
  ws.eachRow({ includeEmpty: true }, (row, rn) => {
    if (rn === 1) return;
    rows.push({
      id: String(row.getCell(3).value).trim(),
      name: String(row.getCell(4).value).trim(),
      telephone: String(row.getCell(5).value).trim()
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
      await User.create({ id: r.id, name: r.name, telephone: r.telephone });
      created++;
    } catch (e) {
      errors++;
      console.error(`${r.id}:`, e.message);
    }
  }

  console.log(`Total: ${rows.length} | creados: ${created} | ya existían: ${existing} | errores: ${errors}`);
  await mongoose.disconnect();
})();