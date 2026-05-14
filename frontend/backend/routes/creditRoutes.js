const express = require("express");

const router = express.Router();

const Credit = require("../models/Credit");

router.post("/", async (req, res) => {

  try {

    const {
      usuario,
      monto,
      cuotas
    } = req.body;

    const nuevoCredito = new Credit({
      usuario,
      monto,
      cuotas
    });

    await nuevoCredito.save();

    res.json({
      message: "Solicitud enviada"
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

    const creditos = await Credit.find();

    res.json(creditos);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

module.exports = router;