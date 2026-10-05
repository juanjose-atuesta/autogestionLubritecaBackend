const User = require("../models/user");

// La cédula es el identificador principal del usuario, pero el cliente puede
// negarse a darla. En ese caso se guarda "." y varios usuarios pueden compartirla,
// por eso la duplicidad se valida siempre contra nombre + teléfono.
const CEDULA_SIN_DATO = ".";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizarTelefono(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Compara por los ultimos 10 digitos para que "+57 3001234567" y
// "3001234567" se reconozcan como el mismo numero.
function digitosComparables(valor) {
  const digitos = normalizarTelefono(valor);
  return digitos.length > 10 ? digitos.slice(-10) : digitos;
}

function normalizarCedula(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}

function esCedulaRegistrada(valor) {
  const cedula = normalizarCedula(valor);
  return cedula.length > 0 && cedula !== CEDULA_SIN_DATO;
}

function escaparRegex(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nombresCoinciden(a, b) {
  const nombre = normalizarTexto(a);
  return nombre.length > 0 && nombre === normalizarTexto(b);
}

function telefonosCoinciden(a, b) {
  const digitos = digitosComparables(a);
  return digitos.length > 0 && digitos === digitosComparables(b);
}

function cedulasCoinciden(a, b) {
  if (!esCedulaRegistrada(a) || !esCedulaRegistrada(b)) return false;
  return normalizarCedula(a) === normalizarCedula(b);
}

// El teléfono puede venir guardado como "300 123 4567", "+300-1234567" o sin
// separadores: el regex acepta cualquier separador entre los dígitos.
function construirRegexTelefono(telefono) {
  const original = String(telefono ?? "").trim();
  if (!original) return null;
  const digitos = normalizarTelefono(original);
  if (digitos.length >= 6) {
    return new RegExp(digitos.split("").map(escaparRegex).join("[^0-9]*"), "i");
  }
  return new RegExp(escaparRegex(original), "i");
}

// Trae candidatos con un query laxo (para no perder registros por diferencias de
// formato) y luego confirma en memoria con la comparación normalizada.
async function usuariosQueCoinciden({ id, name, telephone } = {}) {
  const condiciones = [];

  if (esCedulaRegistrada(id)) {
    condiciones.push({ id: new RegExp(escaparRegex(String(id).trim()), "i") });
  }
  if (String(name ?? "").trim()) {
    condiciones.push({ name: new RegExp(escaparRegex(String(name).trim()), "i") });
  }
  const regexTelefono = construirRegexTelefono(telephone);
  if (regexTelefono) condiciones.push({ telephone: regexTelefono });

  if (!condiciones.length) return [];

  const candidatos = await User.find({ $or: condiciones }).lean();
  return candidatos.filter(usuario => coincideCon(usuario, { id, name, telephone }));
}

function coincideCon(usuario = {}, { id, name, telephone } = {}) {
  if (cedulasCoinciden(usuario.id, id)) return true;
  if (nombresCoinciden(usuario.name, name)) return true;
  if (telefonosCoinciden(usuario.telephone, telephone)) return true;
  return false;
}

function camposQueCoinciden(usuario = {}, { id, name, telephone } = {}) {
  const campos = [];
  if (cedulasCoinciden(usuario.id, id)) campos.push("cédula");
  if (nombresCoinciden(usuario.name, name)) campos.push("nombre");
  if (telefonosCoinciden(usuario.telephone, telephone)) campos.push("teléfono");
  return campos;
}

function resumenUsuario(usuario = {}) {
  return {
    _id: usuario._id,
    name: usuario.name,
    id: usuario.id,
    telephone: usuario.telephone,
    registrationDay: usuario.registrationDay,
    totalPoints: usuario.totalPoints
  };
}

// Alta de usuario: con cédula real se comparan cédula, nombre y teléfono;
// con cédula "." solo nombre y teléfono.
async function buscarDuplicadosAlta({ id, name, telephone } = {}) {
  const duplicados = await usuariosQueCoinciden({ id, name, telephone });
  return duplicados.map(usuario => ({
    ...resumenUsuario(usuario),
    coincideEn: camposQueCoinciden(usuario, { id, name, telephone })
  }));
}

// Búsqueda de todos los usuarios que comparten una cédula (incluye los ".")
async function usuariosConMismaCedula(id) {
  const cedula = String(id ?? "").trim();
  if (!cedula) return [];

  const candidatos = esCedulaRegistrada(cedula)
    ? await User.find({ id: new RegExp(escaparRegex(cedula), "i") }).lean()
    : await User.find({ id: new RegExp(`^\\s*${escaparRegex(CEDULA_SIN_DATO)}\\s*$`) }).lean();

  return candidatos.filter(usuario =>
    esCedulaRegistrada(cedula)
      ? cedulasCoinciden(usuario.id, cedula)
      : String(usuario.id ?? "").trim() === CEDULA_SIN_DATO
  );
}

// Identificación segura para editar/eliminar/agregar compras/recomendaciones:
// exactamente un usuario con esa cédula y, si viene, el teléfono debe coincidir.
async function localizarUsuarioUnico(id, telephone) {
  const cedula = String(id ?? "").trim();
  if (!cedula) {
    return { error: { codigo: 400, message: "No se proporcionó la cédula del usuario" } };
  }

  const candidatos = await usuariosConMismaCedula(cedula);

  if (!candidatos.length) {
    return {
      error: {
        codigo: 404,
        message: `No se encontró ningún usuario con la cédula "${cedula}"`
      }
    };
  }

  if (candidatos.length > 1) {
    return {
      error: {
        codigo: 409,
        motivo: "usuarios-duplicados",
        message: `Hay ${candidatos.length} usuarios registrados con la cédula "${cedula}". `
          + "Por seguridad no se puede modificar ni eliminar automáticamente: "
          + "elimínalos de forma manual y notifica al desarrollador.",
        cedula,
        duplicados: candidatos.map(resumenUsuario)
      }
    };
  }

  const usuario = candidatos[0];
  const telefono = String(telephone ?? "").trim();
  if (telefono && !telefonosCoinciden(usuario.telephone, telefono)) {
    return {
      error: {
        codigo: 409,
        motivo: "telefono-no-coincide",
        message: `El teléfono no coincide con el usuario de la cédula "${cedula}".`,
        cedula,
        telefonoEsperado: usuario.telephone
      }
    };
  }

  return { usuario };
}

module.exports = {
  CEDULA_SIN_DATO,
  normalizarTexto,
  normalizarTelefono,
  normalizarCedula,
  esCedulaRegistrada,
  digitosComparables,
  nombresCoinciden,
  telefonosCoinciden,
  cedulasCoinciden,
  usuariosQueCoinciden,
  usuariosConMismaCedula,
  buscarDuplicadosAlta,
  localizarUsuarioUnico,
  resumenUsuario
};