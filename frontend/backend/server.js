const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const transferRoutes = require("./routes/transferRoutes");
const creditRoutes = require("./routes/creditRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/credits", creditRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB conectado");
})
.catch((error) => {
  console.log(error);
});

app.get("/", (req, res) => {
  res.send("API CMAC funcionando");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});