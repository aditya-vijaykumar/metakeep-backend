import express, { Request, Response } from "express";
import {
  completeTransferMockUSD,
  emailOnTransferTokens,
  getBalances,
  getUSDCBalance,
  initiateTransferMockUSD,
  mintMockUSDCTokens,
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

// USDC Routes
router.post("/transfer-usdc", initiateTransferMockUSD);
router.post("/confirm-transfer-usdc", completeTransferMockUSD);
router.post("/balance-usdc", getUSDCBalance);
router.post("/mint-usdc", mintMockUSDCTokens);


export default router;
