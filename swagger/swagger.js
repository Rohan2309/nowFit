// swagger/swagger.js
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const path = require("path");

module.exports = (app) => {
  try {
    const swaggerDocument = yaml.load(
      path.join(__dirname, "swagger.yaml")
    );

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );

    console.log("📘 Swagger Docs loaded at http://localhost:5000/api-docs");
  } catch (err) {
    console.error("❌ Swagger Load Error:", err.message);
  }
};
