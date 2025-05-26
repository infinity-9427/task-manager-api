import express from "express";
import cors from "cors";
import morgan from "morgan";
import fileUpload from "express-fileupload";

const app = express();

export const createApp = ({ port }: { port: number | string }) => {
  app.use(morgan("dev"));

  app.use(
    cors({
      origin: "https://task-manager-puce-one.vercel.app/",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" })); // URL-encoded parser
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  );

  return { app, port };
};