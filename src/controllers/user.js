const User = require("../models/user");

const {
  esCedulaRegistrada,
  buscarDuplicadosAlta,
  localizarUsuarioUnico
} = require('../services/usuarios');

const { notificar } = require('../../utils/sse');

// Identifica el usuario de req.params.id + req.body.telephone (o ?telephone=).
// Deja el documento en req.usuario o responde con el detalle de duplicados.
async function identificarUsuario(req, res, next) {
  const telephone = req.body?.telephone ?? req.query?.telephone ?? '';
  const { usuario, error } = await localizarUsuarioUnico(req.params.id, telephone);
  if (error) {
    return res.status(error.codigo).send({ status: "error", ...error });
  }
  req.usuario = usuario;
  return next();
}
const getUsers = (req, res) => {
  User.find()
    .then(users => {
      if (!users) return res.status(404).send({
        status: "error",
        message: "No se encontraron usuarios"
      });

      return res.status(200).send({
        status: "success",
        users
      });
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener los usuarios"
      })
    })
}
const addUser = async (req, res) => {
  let body = req.body || {};

  const name = String(body.name || '').trim();
  const id = String(body.id || '').trim();
  const telephone = String(body.telephone || '').trim();

  if (!name || !id || !telephone) {
    return res.status(400).send({
      status: "error",
      message: "Nombre, cédula y teléfono son obligatorios"
    });
  }

  // Con cédula real se validan cédula, nombre y teléfono; si el cliente no da
  // cédula (".") solo se comparan nombre y teléfono.
  const duplicados = await buscarDuplicadosAlta({ id, name, telephone });
  if (duplicados.length) {
    const campos = [...new Set(duplicados.flatMap(duplicado => duplicado.coincideEn))];
    return res.status(409).send({
      status: "error",
      motivo: "usuarios-duplicados",
      message: `No se admite el usuario: ya existe un usuario registrado con el mismo ${campos.join(", ")}.`,
      camposDuplicados: campos,
      cedulaRegistrada: esCedulaRegistrada(id),
      cedula: id,
      duplicados
    });
  }

  let userToSave = new User(body);
  userToSave.save()
    .then(userSaved => {
      if (!userSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el usuario"
      })
      res.status(200).send({
        status: "success",
        userSaved
      })
      notificar('usuario-agregado', { id: userSaved.id, usuario: userSaved });
    })
    .catch(e => {
      // Evita responder 500 por errores esperables (validación / duplicados)
      if (e?.name === 'ValidationError') {
        return res.status(400).send({
          status: 'error',
          message: 'Datos inválidos para crear el usuario',
          details: Object.fromEntries(Object.entries(e.errors || {}).map(([k, v]) => [k, v?.message]))
        });
      }
      // Índice unique pendiente de eliminar en bases antiguas (id repetido)
      if (e?.code === 11000) {
        return res.status(409).send({
          status: 'error',
          message: 'El usuario ya existe (campo único duplicado)',
          duplicateKey: e?.keyValue || e?.keyPattern
        });
      }
      console.error('Error addUser:', e);
      return res.status(500).send({
        status: "error",
        message: "Error interno al guardar el usuario"
      });
    })

}
//Esto aca tenemos que revisarlo 
/*
const updatePoints = async (req, res) => {
  let id = req.params.id;
  let pointsToAdd = req.body.delta;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
    }
    user.acommulatedPoints += pointsToAdd;
    await user.save();
    return res.status(200).send({
      status: "success",
      userUpdated: user
    });
  } catch (e) {
    return res.status(500).send({});
  }
}
const addPoint = async (req, res) => {
  let id = req.params.id;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
    }
    user.acommulatedPoints += 1;
    await user.save();
    return res.status(200).send({
      status: "success",
      userUpdated: user
    });
  } catch (e) {
    return res.status(500).send({});
  }
}

const subtractPoint = async (req, res) => {
  let id = req.params.id;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
    }
    user.acommulatedPoints -= 1;
    await user.save();
    return res.status(200).send({
      status: "success",
      userUpdated: user
    });
  } catch (e) {
    return res.status(500).send({});
  }
}
*/

// FUnciones de usuarios recomendados 
const getRecommendedUsers = async (req, res) => {
  const user = req.usuario;
  try {
    return res.status(200).send({
      status: "success",
      recommendedUsers: user.recommendedUsers
    })
  } catch (e) {
    return res.status(500).send({});
  }
}

const addRecommendedUser = async (req, res) => {
  // Acepta recommendedUserId (nuevo) o id (compat)
  let recommendedUserId = req.body.recommendedUserId || req.body.id;
  try {
    const user = req.usuario;
    if (!recommendedUserId) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    // El recomendado tambien debe ser un usuario unico
    const { usuario: recomendado, error } = await localizarUsuarioUnico(
      recommendedUserId,
      req.body.recommendedTelephone
    );
    if (error) {
      return res.status(error.codigo).send({ status: "error", ...error });
    }
    user.recommendedUsers.push(String(recomendado.id || '').trim());
    user.pointsByRecommendation += 5;
    user.totalPoints += 5;
    await user.save();
    res.status(200).send({
      status: "success"
    });
    notificar('usuarioRecomendado-agregado', { id: user.id, usuario: user });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

const setRecommended = async (req, res) => {
  try {
    const user = req.usuario;
    user.wasContacted = true;
    await user.save();
    res.status(200).send({
      status: "success",
      userUpdated: user
    });
    notificar('meRecomendaron-editado', { id: user.id, usuario: user });
  } catch (e) {
    return res.status(500).send({});
  }
}


const getUsersNotContacted = async (req, res) => {
  try {
    const users = await User.find({ wasContacted: false });
    return res.status(200).send({
      status: "success",
      users
    });
  } catch (e) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener usuarios no contactados"
    });
  }
};

const getRecommendedMe = async (req, res) => {
  try {
    const user = req.usuario;
    const recommendedMe = user.recommendedMe;
    return res.status(200).send({
      status: "success",
      recommendedMe
    });
  } catch (e) {
    return res.status(500).send({
      status: "error"
    });

  }

}

const addRecommendedMe = async (req, res) => {
  const { recommendedMe } = req.body;
  try {
    // recommendedMe identifica a quien hizo la recomendación: también debe ser único
    const { usuario: recomendador, error } = await localizarUsuarioUnico(
      recommendedMe,
      req.body.recommendedMeTelephone
    );
    if (error) {
      return res.status(error.codigo).send({ status: "error", ...error });
    }
    const recommendedMeValue = String(recomendador.id || '').trim();
    const userUpdated = await User.findByIdAndUpdate(
      req.usuario._id,
      { $set: { recommendedMe: recommendedMeValue } },
      { new: true }
    );
    if (!userUpdated) return res.status(404).send({});
    res.status(200).send({
      status: "success"
    });
    notificar('meRecomendo-agregado', { id: userUpdated.id, usuario: userUpdated });
  } catch (e) {
    console.error('Error addRecommendedMe:', e);
    return res.status(500).send({});
  }
}

const editUser = async (req, res) => {
  const { name, idNew, registrationDay, telephone, email } = req.body;
  try {
    const usuario = req.usuario;

    // La cédula es el identificador principal: si viene "idNew" se actualiza "id"
    const cedulaNueva = String(req.body.id ?? idNew ?? '').trim();
    const camposActualizar = { name, registrationDay, telephone, email };
    if (cedulaNueva && cedulaNueva !== String(usuario.id || '').trim()) {
      const duplicados = await buscarDuplicadosAlta({
        id: cedulaNueva,
        name: String(name ?? usuario.name).trim(),
        telephone: String(telephone ?? usuario.telephone).trim()
      });
      const otros = duplicados.filter(otro => String(otro._id) !== String(usuario._id));
      if (otros.length) {
        const campos = [...new Set(otros.flatMap(otro => otro.coincideEn))];
        return res.status(409).send({
          status: "error",
          motivo: "usuarios-duplicados",
          message: `No se admite la edición: ya existe un usuario con el mismo ${campos.join(", ")}.`,
          camposDuplicados: campos,
          cedula: cedulaNueva,
          duplicados: otros
        });
      }
      camposActualizar.id = cedulaNueva;
    }

    const userUpdated = await User.findByIdAndUpdate(usuario._id, { $set: camposActualizar }, { new: true });
    if (!userUpdated) return res.status(404).send({});
    res.status(200).send({
      status: "success"
    });
    notificar('usuario-editado', { id: userUpdated.id, usuario: userUpdated });
  } catch (e) {
    console.error('Error editUser:', e);
    return res.status(500).send({});
  }
}

const deleteUser = async (req, res) => {
  // identificarUsuario ya garantiza un único usuario con esa cédula
  try {
    const userDeleted = await User.findByIdAndDelete(req.usuario._id);
    if (!userDeleted) return res.status(404).send({
      status: "error",
      message: "No se encontro"
    });
    notificar('usuario-eliminado', { id: userDeleted.id, usuario: userDeleted });
    return res.status(200).send({
      status: "succes"
    });
  } catch (e) {
    console.error('Error deleteUser:', e);
    res.status(500).send({
      status: "error",
      message: "Error al eliminar el cliente"
    });
  }
}

//Funciones para agregar puntos 
const addHighBuy = async (req, res) => {
  let idBill = req.body.idBill;
  try {
    const user = req.usuario;
    if (!idBill) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    user.highBuy.push(idBill);
    user.pointsByHighBuy += 5;
    user.totalPoints += 5;
    await user.save();
    res.status(200).send({
      status: "success"
    });
    notificar('agregarPuntos-compraAlta', { id: user.id, usuario: user });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

const addFrecuentBuy = async (req, res) => {
  let service = req.body.service;
  try {
    const user = req.usuario;
    if (!service) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    user.frecuentBuy.push(service);
    user.pointsByFrecuentBuy += 5;
    user.totalPoints += 5;
    await user.save();
    res.status(200).send({
      status: "success"
    });
    notificar('agregarPuntos-compraRecurrente', { id: user.id, usuario: user });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

// Editar puntos de un usuario y recalcular totalPoints
const editPoints = async (req, res) => {
  const id = req.params.id;
  const {
    pointsByRecommendation,
    pointsByFrecuentBuy,
    pointsByHighBuy
  } = req.body;

  try {
    const user = req.usuario;

    // Solo actualiza los campos que vengan en el body
    if (pointsByRecommendation !== undefined) user.pointsByRecommendation = Number(pointsByRecommendation) || 0;
    if (pointsByFrecuentBuy !== undefined) user.pointsByFrecuentBuy = Number(pointsByFrecuentBuy) || 0;
    if (pointsByHighBuy !== undefined) user.pointsByHighBuy = Number(pointsByHighBuy) || 0;

    // Recalcular total
    user.totalPoints = user.pointsByRecommendation + user.pointsByFrecuentBuy + user.pointsByHighBuy;

    await user.save();
    res.status(200).send({ status: 'success', userUpdated: user });
    notificar('puntosEditados', { id: user.id, usuario: user });
  } catch (e) {
    console.error('Error editPoints:', e);
    return res.status(500).send({ status: 'error', message: 'Error al actualizar puntos' });
  }
};

// Obtener ranking de usuarios por puntos (para estadísticas)
const getRankingUsuarios = async (req, res) => {
  try {
    // Se incluye _id y telephone para poder identificar al usuario (cédula ".")
    const users = await User.find(
      {},
      'name id telephone pointsByRecommendation pointsByFrecuentBuy pointsByHighBuy totalPoints'
    ).sort({ totalPoints: -1 });

    return res.status(200).send({ status: 'success', users });
  } catch (e) {
    return res.status(500).send({ status: 'error', message: 'Error al obtener ranking' });
  }
};
// En user.js (controlador)
const getAvailableUsersToRecommend = async (req, res) => {
  const origenId = String(req.params.id || '').trim();
  if (!origenId) {
    return res.status(400).send({ status: 'error', message: 'Falta el id del usuario origen' });
  }

  try {
    // El usuario origen (ya validado como único en req.usuario)
    const usuarioOrigen = req.usuario;

    // ID de quien lo recomendó (para excluirlo)
    const idQueMeRecomendo = String(usuarioOrigen.recommendedMe || '').trim();

    // Traer todos los no contactados, excluyendo origen y quien lo recomendó
    const exclusiones = [origenId];
    if (idQueMeRecomendo) exclusiones.push(idQueMeRecomendo);

    const usuarios = await User.find({
      wasContacted: false,
      id: { $nin: exclusiones }
    });

    return res.status(200).send({ status: 'success', users: usuarios });
  } catch (e) {
    console.error('Error getAvailableUsersToRecommend:', e);
    return res.status(500).send({ status: 'error', message: 'Error interno' });
  }
};

module.exports = {
  identificarUsuario,
  getUsers,
  addUser,
  //addPoint,
  //subtractPoint,
  getRecommendedUsers,
  //updatePoints,
  addRecommendedUser,
  editUser,
  deleteUser,
  getUsersNotContacted,
  setRecommended,
  getRecommendedMe,
  addRecommendedMe,
  addHighBuy,
  addFrecuentBuy,
  getRankingUsuarios,
  editPoints,
  getAvailableUsersToRecommend
}
