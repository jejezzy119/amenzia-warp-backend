import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),

  nodeEnv: process.env.NODE_ENV ?? "development",

  adminSecret: process.env.ADMIN_SECRET,

  database: {
    url: process.env.DATABASE_URL,
  },

  warp: {
    apiVersion: process.env.WARP_API_VERSION ?? "v0a4005",
  },
};
