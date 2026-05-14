const express = require("express");

const router = express.Router();

const Transfer = require("../models/Transfer");
const User = require("../models/User");

router.post("/", async (req, res) => {

  try {

    const {
      emisor,
      receptor,
      monto
    } = req.body;

    const usuarioEmisor = await User.findOne({
      email: emisor
    });

    const usuarioReceptor = await User.findOne({
      email: receptor
    });

    if (!usuarioEmisor || !usuarioReceptor) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    if (usuarioEmisor.saldo < monto) {
      return res.status(400).json({
        message: "Saldo insuficiente"
      });
    }

    usuarioEmisor.saldo -= monto;

    usuarioReceptor.saldo += Number(monto);

    await usuarioEmisor.save();
    await usuarioReceptor.save();

    const nuevaTransferencia = new Transfer({
      emisor,
      receptor,
      monto
    });

    await nuevaTransferencia.save();

    res.json({
      message: "Transferencia realizada"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

router.get("/", async (req, res) => {

  try {

    const transferencias = await Transfer.find();

    res.json(transferencias);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

module.exports = router;