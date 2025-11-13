import cors from "cors";
import express from "express";
import {ApolloServer} from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import connectDB from "./db.js";
import typeDefs from "./schemas/typeDefs.js";
import resolvers from "./resolvers/resolvers.js";
import { verifyToken } from "./utils/auth.js";
import { UAParser } from 'ua-parser-js';
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "https://userdashboard-11938.web.app",
    "http://localhost:5173"
  ],
  credentials: true
}));


const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
});

async function start() {
  try {
    await connectDB();
    await server.start();

    app.use(
      "/graphql",
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "Unknown";
          const parser = new UAParser(req.headers["user-agent"]);
          const ua = parser.getResult();
          const device = `${ua.os.name} ${ua.os.version} - ${ua.browser.name} ${ua.browser.version}`;

          const auth = req?.headers?.authorization ?? "";
          const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
          const payload = token ? verifyToken(token) : null;

          return {
            user: payload ? { id: payload.userId, isAdmin: !!payload.isAdmin } : null,
            ip,
            device,
          };
        },
      })
    );

    const port = process.env.PORT || 10000;
    app.listen(port, () => {
      console.log("Server running on port", port);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();