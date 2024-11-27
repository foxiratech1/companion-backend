const express = require("express");
const connectDb = require("./config/dbConnection");
const path = require("path");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
connectDb();
const app = express();
app.use(cors());
const port = process.env.PORT;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
const directory = path.join(__dirname, "public");
app.use(express.static(directory));
app.use("/api/vendor", require("./routes/vendorRoutes"));
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
