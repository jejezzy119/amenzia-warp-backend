import type { FastifyInstance } from "fastify";

import { generateConfig } from "../services/configGenerator.js";
import { generateQrCode } from "../services/qr.js";
import { saveConfig } from "../services/configStore.js";
import { getConfig } from "../services/configStore.js";
import { getActiveConfig } from "../services/configAccess.js";
import { disableConfig } from "../services/configStore.js";
import { config } from "../config.js";

export async function configRoutes(app: FastifyInstance) {
  app.get("/configs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const stored = await getConfig(id);

    if (!stored) {
      return reply.status(404).send({
        success: false,
        error: "Configuration not found",
      });
    }

    if (stored.status !== "active") {
      return reply.status(403).send({
        success: false,
        error: "Configuration is disabled",
      });
    }

    if (stored.expiresAt !== null && stored.expiresAt <= new Date()) {
      return reply.status(403).send({
        success: false,
        error: "Configuration has expired",
      });
    }

    return {
      success: true,
      id: stored.id,
      config: stored.config,
      createdAt: stored.createdAt,
      expiresAt: stored.expiresAt,
      status: stored.status,
    };
  });

  app.post(
    "/configs",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            expiresInDays: {
              type: "integer",
              enum: [7, 30, 90],
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          expiresInDays?: 7 | 30 | 90;
        };

        const result = await generateConfig(body.expiresInDays);

        const stored = await saveConfig(
          result.id,
          result.config,
          result.expiresAt,
        );

        return {
          success: true,
          id: stored.id,
          config: stored.config,
          expiresAt: stored.expiresAt,
          status: stored.status,
        };
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          error: "Config generation failed",
        });
      }
    },
  );

  app.get("/configs/:id/qr", async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await getActiveConfig(id);

    if ("error" in result) {
      if (result.error === "not_found") {
        return reply.status(404).send({
          success: false,
          error: "Configuration not found",
        });
      }

      return reply.status(403).send({
        success: false,
        error:
          result.error === "expired"
            ? "Configuration has expired"
            : "Configuration is disabled",
      });
    }

    try {
      const qr = await generateQrCode(result.config.config);

      return {
        success: true,
        id,
        qr,
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: "QR generation failed",
      });
    }
  });

  app.get("/configs/:id/file", async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await getActiveConfig(id);

    if ("error" in result) {
      if (result.error === "not_found") {
        return reply.status(404).send({
          success: false,
          error: "Configuration not found",
        });
      }

      return reply.status(403).send({
        success: false,
        error:
          result.error === "expired"
            ? "Configuration has expired"
            : "Configuration is disabled",
      });
    }

    return reply
      .header("Content-Type", "application/octet-stream")
      .header(
        "Content-Disposition",
        `attachment; filename="warp-awg-${id}.conf"`,
      )
      .send(result.config.config);
  });

  app.patch("/configs/:id/disable", async (request, reply) => {
    const { id } = request.params as { id: string };

    const adminSecret = request.headers["x-admin-secret"];

    if (adminSecret !== config.adminSecret) {
      return reply.status(401).send({
        success: false,
        error: "Unauthorized",
      });
    }

    const disabled = await disableConfig(id);

    if (!disabled) {
      return reply.status(404).send({
        success: false,
        error: "Active configuration not found",
      });
    }

    return {
      success: true,
      id,
      status: "disabled",
    };
  });
}
