import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes";
import bodyParser from "body-parser";

dotenv.config();
const port = process.env.PORT || 1555;

const app: Express = express();

app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
// for parsing application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

const corsOptions = {
  origin: function (origin: any, callback: any) {
    const whitelistedOrigins = [
        "https://banza-ec2bc.web.app",
        "https://alpha.banza.xyz"
    ];
    if (process.env.NODE_ENV == "dev") {
      whitelistedOrigins.push("http://localhost:3000");
    }
    if (whitelistedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
};
const checkForCors = (req: Request, res: Response, next: NextFunction) => {
  const corsHandler = cors(corsOptions);
  return corsHandler(req, res, next);
};

app.use(checkForCors);

app.use(routes);

app.listen(port, () =>
  console.log(`MetaKeep Proxy server up and running on port ${port}...🏃🏻`)
);
