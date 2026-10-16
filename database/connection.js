require('./env');
const mongoose = require('mongoose');

const DB_NAME = 'autogestionLubritecaDB';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/autogestionLubritecaDB';

const buildUri = () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || LOCAL_URI;

  // Si la URI no trae nombre de base de datos (ej. Atlas), lo agregamos.
  const [base, query] = uri.split('?');
  const hostPart = base.slice(base.indexOf('://') + 3);
  if (!hostPart.includes('/')) {
    const suffix = query ? `?${query}` : base.includes('mongodb+srv://') ? '?retryWrites=true&w=majority' : '';
    return `${base}/${DB_NAME}${suffix}`;
  }

  return uri;
};

const connection = async () => {
  try {
    const MONGO_URI = buildUri();
    const masked = MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@');
    console.log(`Conectando a MongoDB: ${masked}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      tlsAllowInvalidCertificates: false,
    });
    console.log("Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a la base de datos: ", error);
    throw error;
  }
}

module.exports = connection;
