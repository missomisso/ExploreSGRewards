import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Bootstrap the shared routes handling the API, passing null since Vercel
// serverless handles the proxying directly instead of via a local httpServer.
registerRoutes(null, app).catch(console.error);

export default app;
