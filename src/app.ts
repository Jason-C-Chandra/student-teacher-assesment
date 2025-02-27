const express = require("express");

import { AppDataSource } from "./database";
import baseRoutes from "./routes";


const app = express();

app.use(express.json());

app.use("/api", baseRoutes);

const PORT = process.env.PORT ?? 3000;

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.error("Error connecting to database", error));
