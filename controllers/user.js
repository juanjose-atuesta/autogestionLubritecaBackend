const User = require("../models/user");

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
const addUser = (req, res) => {
  let body = req.body;
  let userToSave = new User(body);
  userToSave.save()
    .then(userSaved => {
      if (!userSaved) return res.status(404).send({
        status: "error",
        message: "No se pudo guardar el usuario"
      })
      return res.status(200).send({
        status: "success",
        userSaved
      })
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
      // Duplicado por índice unique (por ejemplo id repetido)
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
  let id = req.params.id;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({});
    }
    return res.status(200).send({
      status: "success",
      recommendedUsers: user.recommendedUsers
    })
  } catch (e) {
    return res.status(500).send({});
  }
}

const addRecommendedUser = async (req, res) => {
  let id = req.params.id;
  // Acepta recommendedUserId (nuevo) o id (compat)
  let recommendedUserId = req.body.recommendedUserId || req.body.id;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({});
    }
    if (!recommendedUserId) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    user.recommendedUsers.push(recommendedUserId);
    user.pointsByRecommendation += 5;
    await user.save();
    return res.status(200).send({
      status: "success"
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

const setRecommended = async (req, res) => {
  let id = req.params.id;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "No se encontro el cliente"
      });
    }
    user.wasContacted = true;
    await user.save();
    return res.status(200).send({
      status: "success",
      userUpdated: user
    });
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
    const user = await User.findOne({ id: req.params.id });

    if (!user) return res.status(404).send({
      status: "error"
    });
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

const addRecommendedMe = (req, res) => {
  const id = req.params.id;
  const { recommendedMe } = req.body;
  if (!id) {
    return res.status(400).send({ status: "error", message: "No se proporcionó el id del usuario a editar" });
  }
  const camposActualizar = { recommendedMe };
  User.findOneAndUpdate({ id: id }, { $set: camposActualizar }, { new: true })
    .then(userUpdated => {
      if (!userUpdated) return res.status(404).send({});
      return res.status(200).send({
        status: "success"
      });
    })
    .catch(e => res.status(500).send({}));

}

const editUser = (req, res) => {
  const id = req.params.id;
  const { name, idNew, registrationDay, telephone, email } = req.body;
  if (!id) {
    return res.status(400).send({ status: "error", message: "No se proporcionó el id del usuario a editar" });
  }
  const camposActualizar = { name, idNew, registrationDay, telephone, email };
  User.findOneAndUpdate({ id: id }, { $set: camposActualizar }, { new: true })
    .then(userUpdated => {
      if (!userUpdated) return res.status(404).send({});
      return res.status(200).send({
        status: "success"
      });
    })
    .catch(e => res.status(500).send({}));

}

const deleteUser = (req, res) => {
  let id = req.params.id;
  User.findOneAndDelete({ id: id })
    .then(customerDeleted => {
      if (!customerDeleted) return res.status(404).send({
        status: "error",
        message: "No se encontro"
      });
      return res.status(200).send({
        status: "succes"
      })
    })
    .catch(e => {
      return res.status(500).send({
        status: "error",
        message: "Error al eliminar el cliente"
      });
    })
}

//Funciones para agregar puntos 
const addHighBuy = async (req, res) => {
  let id = req.params.id
  let idBill = req.body.idBill;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({});
    }
    if (!idBill) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    user.highBuy.push(idBill);
    user.pointsByHighBuy += 5;
    await user.save();
    return res.status(200).send({
      status: "success"
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

const addFrecuentBuy = async (req, res) => {
  let id = req.params.id
  let service = req.body.service;
  try {
    const user = await User.findOne({ id: id });
    if (!user) {
      return res.status(404).send({});
    }
    if (!service) {
      return res.status(400).send({
        status: 'error',
        message: 'Falta recommendedUserId'
      });
    }
    user.frecuentBuy.push(service);
    user.pointsByFrecuentBuy += 5;
    await user.save();
    return res.status(200).send({
      status: "success"
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }

}

module.exports = {
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
  addFrecuentBuy
}
