const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema({

  usuario: {
    type: String,
    required: true
  },

  monto: {
    type: Number,
    required: true
  },

  cuotas: {
    type: Number,
    required: true
  },

  estado: {
    type: String,
    default: "En evaluación"
  },

  fecha: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  "Credit",
  CreditSchema
);