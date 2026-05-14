const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const User = require("../models/User");

router.post("/register", async (req, res) => {

  try {

    const { nombre, email, password } = req.body;

    const usuarioExiste = await User.findOne({ email });

    if (usuarioExiste) {
      return res.status(400).json({
        message: "El usuario ya existe"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      nombre,
      email,
      password: passwordHash
    });

    await nuevoUsuario.save();

    res.status(201).json({
      message: "Usuario registrado"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const usuario = await User.findOne({ email });

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const passwordCorrecto = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!passwordCorrecto) {
      return res.status(401).json({
        message: "Contraseña incorrecta"
      });
    }

    const token = jwt.sign(
      {
        id: usuario._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login exitoso",
      token,
      usuario
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

module.exports = router;