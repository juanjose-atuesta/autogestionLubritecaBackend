const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

/**
 * Servicio para exportar e importar datos a/desde Excel
 * Implementa la funcionalidad de exportar toda la base de datos a una sola hoja de Excel
 * y importar desde Excel para actualizar la base de datos
 */
class ExcelService {
  constructor(models) {
    // Los modelos se pasan como objeto con nombre: modelo
    this.models = models || {};
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Exporta todos los datos de todos los modelos a un solo archivo Excel
   * @returns {Promise<Buffer>} Buffer del archivo Excel generado
   */
  async exportAllToExcel() {
    try {
      // Limpiar workbook previo
      this.workbook = new ExcelJS.Workbook();

      // Crear una sola hoja para todos los datos
      const worksheet = this.workbook.addWorksheet('Todos los Datos');

      // Obtener todos los datos de todos los modelos
      const allData = await this._collectAllData();

      if (allData.length === 0) {
        // Agregar al menos una fila de encabezado aunque no haya datos
        worksheet.addRow(['No hay datos para exportar']);
        return await this.workbook.xlsx.writeBuffer();
      }

      // Determinar todas las columnas posibles
      const allColumns = this._getAllPossibleColumns(allData);

      // Crear encabezados
      const headers = ['Tipo de Entidad', 'ID', ...allColumns];
      worksheet.addRow(headers);

      // Estilizar encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF366092' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Agregar datos
      for (const item of allData) {
        const rowData = this._flattenItemForExcel(item, allColumns);
        worksheet.addRow(rowData);
      }

      // Ajustar ancho de columnas automáticamente
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellValue = cell.value;
          if (cellValue !== null && cellValue !== undefined) {
            const cellLength = cellValue.toString().length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });
        const adjustedWidth = Math.min(maxLength + 2, 50); // Máximo 50 caracteres
        column.width = adjustedWidth;
      });

      // Congelar fila de encabezado
      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1
        }
      ];

      // Devolver buffer
      return await this.workbook.xlsx.writeBuffer();
    } catch (error) {
      throw new Error(`Error exportando a Excel: ${error.message}`);
    }
  }

  /**
   * Importa datos desde un archivo Excel y actualiza la base de datos
   * @param {Buffer} excelBuffer - Buffer del archivo Excel a importar
   * @returns {Promise<Object>} Estadísticas del proceso de importación
   */
  async importFromExcel(excelBuffer) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(excelBuffer);

      const worksheet = workbook.getWorksheet(1); // Primera hoja
      if (!worksheet) {
        throw new Error('No se encontró ninguna hoja en el archivo Excel');
      }

      const stats = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: []
      };

      // Obtener encabezados
      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values.slice(1); // Ignorar índice 0 (vacío en exceljs)

      if (headers.length < 2 || headers[0] !== 'Tipo de Entidad' || headers[1] !== 'ID') {
        throw new Error('Formato de Excel no válido. Se esperaba columnas "Tipo de Entidad" y "ID" como primeras columnas');
      }

      // Procesar cada fila (empezando desde la fila 2)
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar encabezado

        try {
          const rowValues = row.values.slice(1); // Ignorar índice 0
          const entityType = rowValues[0];
          const docId = rowValues[1];

          if (!entityType || !docId) {
            stats.errors++;
            stats.errorDetails.push(`Fila ${rowNumber}: Tipo de entidad o ID faltante`);
            return;
          }

          // Construir objeto de datos desde los encabezados y valores
          const data = {};
          headers.forEach((header, index) => {
            if (header && header !== 'Tipo de Entidad' && header !== 'ID') {
              data[header] = rowValues[index];
            }
          });

          // Convertir tipos de datos apropiados
          const typedData = this._convertDataTypes(data);

          // Buscar o crear documento
          const model = this.models[entityType];
          if (!model) {
            stats.errors++;
            stats.errorDetails.push(`Fila ${rowNumber}: Modelo "${entityType}" no encontrado`);
            return;
          }

          // Upsert: actualizar si existe, crear si no
          const updateResult = model.findByIdAndUpdate(
            docId,
            typedData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );

          // Verificar si fue actualización o inserción
          // Nota: En mongoose, upsert con findByIdAndUpdate no distingue claramente
          // entre insert y update en el resultado, por lo que asumimos actualización
          // si encontramos un documento existente antes de la operación
          stats.processed++;
          stats.updated++; // Por simplicidad, contamos todos como actualizados

        } catch (error) {
          stats.errors++;
          stats.errorDetails.push(`Fila ${rowNumber}: ${error.message}`);
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Error importando desde Excel: ${error.message}`);
    }
  }

  /**
   * Recopila todos los datos de todos los modelos
   * @returns {Promise<Array>} Array de todos los documentos de todos los modelos
   */
  async _collectAllData() {
    const allData = [];

    for (const [modelName, model] of Object.entries(this.models)) {
      try {
        const documents = await model.find({});
        // Agregar tipo de entidad a cada documento para el import
        const typedDocuments = documents.map(doc => ({
          ...doc.toObject ? doc.toObject() : doc,
          _tipoEntidad: modelName
        }));
        allData.push(...typedDocuments);
      } catch (error) {
        console.error(`Error recopilando datos del modelo ${modelName}:`, error);
        // Continuar con otros modelos incluso si uno falla
      }
    }

    return allData;
  }

  /**
   * Obtiene todas las columnas posibles de un conjunto de documentos
   * @param {Array} documents - Array de documentos
   * @returns {Array} Array de nombres de columnas
   */
  _getAllPossibleColumns(documents) {
    const columnsSet = new Set();

    for (const doc of documents) {
      const flatDoc = this._flattenDocument(doc);
      Object.keys(flatDoc).forEach(key => columnsSet.add(key));
    }

    // Ordenar alfabéticamente para consistencia
    return Array.from(columnsSet).sort();
  }

  /**
   * Aplana un documento eliminando niveles de anidamiento y convirtiéndolo en formato plano
   * @param {Object} document - Documento de MongoDB
   * @returns {Object} Documento aplana
   */
  _flattenDocument(document) {
    const flat = {};

    function flatten(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;

          if (value && typeof value === 'object' && !Array.isArray(value) &&
            !(value instanceof Date) &&
            !(value instanceof mongoose.Types.ObjectId) &&
            !Buffer.isBuffer(value)) {
            // Recursivamente aplanar objetos (pero no arrays, fechas, ObjectId o buffers)
            flatten(value, newKey);
          } else {
            // Valor primitivo o array - mantener tal cual
            flat[newKey] = value;
          }
        }
      }
    }

    // Eliminar campos de MongoDB que no queremos exportar
    const cleanDoc = { ...document };
    delete cleanDoc.__v; // Eliminar versionKey si existe
    delete cleanDoc._tipoEntidad; // Campo interno del servicio
    // No eliminamos _id porque lo necesitamos para referencias

    flatten(cleanDoc);
    return flat;
  }

  /**
   * Prepara un elemento para ser agregado a la hoja de Excel
   * @param {Object} item - Elemento aplanar
   * @param {Array} allColumns - Todas las columnas posibles
   * @returns {Array} Array de valores para la fila de Excel
   */
  _flattenItemForExcel(item, allColumns) {
    const flatItem = this._flattenDocument(item);

    // Construir fila: [Tipo de Entidad, ID, valor_col1, valor_col2, ...]
    const rowData = [
      item._tipoEntidad || 'Desconocido',
      item._id || item.id || 'Sin ID'
    ];

    // Agregar valores para cada columna posible
    allColumns.forEach(column => {
      rowData.push(flatItem[column] !== undefined ? flatItem[column] : '');
    });

    return rowData;
  }

  /**
   * Convierte tipos de datos de string (como vienen de Excel) a tipos apropiados
   * @param {Object} data - Objeto con datos de tipo string
   * @returns {Object} Objeto con tipos convertidos
   */
  _convertDataTypes(data) {
    const converted = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === null || value === undefined) {
        converted[key] = null;
        continue;
      }

      // Excel ya los lee con tipo: números, booleanos y fechas se mantienen tal cual
      if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
        converted[key] = value;
        continue;
      }

      // Intentar convertir a número
      if (!isNaN(value) && value.trim() !== '' && !value.includes(' ')) {
        const numValue = parseFloat(value);
        // Si es un número entero sin punto decimal, mantener como entero
        if (Number.isInteger(numValue)) {
          converted[key] = numValue;
        } else {
          converted[key] = numValue;
        }
        continue;
      }

      // Intentar convertir a boolean
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === 'false') {
          converted[key] = lowerValue === 'true';
          continue;
        }

        // Intentar convertir a fecha (formato ISO)
        const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z?)$/);
        if (dateMatch) {
          converted[key] = new Date(value);
          continue;
        }
      }

      // Por defecto, mantener como string
      converted[key] = value;
    }

    return converted;
  }
}

module.exports = ExcelService;