/**
 * EJEMPLO DE USO DEL SERVICIO EXCEL
 *
 * Este archivo muestra cómo usar el servicio de export/import directamente
 * desde Node.js sin necesidad de los endpoints HTTP.
 *
 * Útil para scripts de mantenimiento, tareas programadas (cron jobs),
 * o integraciones personalizadas.
 */

const ExcelService = require('./src/services/excelService');
const mongoose = require('mongoose');

// Conexión a MongoDB (ajusta según tu configuración)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autogestionLubritecaDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Importar tus modelos (debes ajustar las rutas según tu estructura)
const Customer = require('./src/models/customer');
const Evento = require('./src/models/eventos');
const HistorialDB = require('./src/models/historialDB');
const Login = require('./src/models/login');
const Pedido = require('./src/models/pedidos');
const Reservation = require('./src/models/reservation');
const User = require('./src/models/user');

// Colección de todos los modelos
const models = {
  Customer,
  Evento,
  HistorialDB,
  Login,
  Pedido,
  Reservation,
  User
};

// Crear instancia del servicio
const excelService = new ExcelService(models);

async function ejemploExportImport() {
  try {
    console.log('���� Iniciando ejemplo de export/import a Excel...');

    // EJEMPLO 1: EXPORTAR A EXCEL
    console.log('\n���📥 Exportando base de datos a Excel...');
    const excelBuffer = await excelService.exportAllToExcel();

    // Guardar el buffer en un archivo (en un caso real, podrías enviarlo por email, subirlo a S3, etc.)
    const fs = require('fs');
    fs.writeFileSync(`backup_${new Date().toISOString().slice(0, 10)}.xlsx`, excelBuffer);
    console.log(`��✅ Exportación completada. Archivo guardado: backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
    console.log(`   Tamaño: ${(excelBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // EJEMPLO 2: IMPORTAR DESDE EXCEL
    console.log('\n���📤 Importando desde Excel...');
    // En este ejemplo, reimportamos el mismo archivo que acabamos de crear
    // En la práctica, este sería un archivo modificado externamente
    const stats = await excelService.importFromExcel(excelBuffer);

    console.log('��✅ Importación completada. Estadísticas:');
    console.log(`   �� 📊 Registros procesados: ${stats.processed}`);
    console.log(`   �� ➕ Registros creados: ${stats.created}`);
    console.log(`   �� 🔁 Registros actualizados: ${stats.updated}`);
    console.log(`   �� ❌ Errores encontrados: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n��⚠���� Detalles de errores:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n���🎉 Ejemplo completado exitosamente!');

  } catch (error) {
    console.error('��❌ Error durante el proceso:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.disconnect();
  }
}

// Ejecutar el ejemplo si este archivo se ejecuta directamente
if (require.main === module) {
  ejemploExportImport();
}

module.exports = { excelService };