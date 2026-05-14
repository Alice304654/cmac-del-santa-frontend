const mongoose = require("mongoose");

const TransferSchema = new mongoose.Schema({

  emisor: {
    type: String,
    required: true
  },

  receptor: {
    type: String,
    required: true
  },

  monto: {
    type: Number,
    required: true
  },

  fecha: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  "Transfer",
  TransferSchema
);