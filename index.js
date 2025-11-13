import express from "express";
import {ApolloServer} from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { expressMiddleware } from '@apollo/server/express4';
import connectDB from "./db.js";
import typeDefs from "./schemas/typeDefs.js";
import resolvers from "./resolvers/resolvers.js";
import { verifyToken } from "./utils/auth.js";
import { UAParser } from 'ua-parser-js';
import dotenv from "dotenv";
dotenv.config();


await connectDB();
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
});
app.use(
  "/graphql",
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
app.listen(process.env.PORT || 10000, () => {
  console.log("Server running on port", process.env.PORT || 10000);
});

