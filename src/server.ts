import Fastify from "fastify";
import cors from "@fastify/cors";

// routes
import { healthRoutes } from "./routes/health.js";
import { configRoutes } from "./routes/configs.js";

import { config } from "./config.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(healthRoutes, {
  prefix: "/api",
});

await app.register(configRoutes, {
  prefix: "/api",
});

app.get("/", async () => {
  return {
    message: "WARP AWG Backend",
  };
});

app.listen({
  port: config.port,
  host: "0.0.0.0",
});
