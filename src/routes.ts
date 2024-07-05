import express, { Request, Response } from "express";
import {
  emailOnTransferTokens,
  getBalances,
  mintTestTokens,
  transferTestTokens,
} from "./controller/metakeep";

const router = express.Router();

router.get("/hello", (req: Request, res: Response) => {
  res.send("Hello World");
});

router.post("/balance", getBalances);
router.post("/mint", mintTestTokens);
router.post("/transfer", transferTestTokens);
router.post("/confirm-transfer", emailOnTransferTokens);

export default router;
