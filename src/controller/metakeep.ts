import { Request, Response } from "express";
import {
  internalServerError,
  requestFailed,
  responseInvalidArgumentsError,
  responseSuccess,
} from "../utils/commonFunctions";
import Joi from "joi";
import axios from "axios";
import { randomString } from "../utils/randomString";
import { sendMailToUser } from "../utils/nodeMailer";
import { EmailSenderSingleton } from "../utils/EmailSenderSingleton";

const BCN_TOKEN_ADDRESS = "0xc6E5740786236Ae58092f07b62B120753eB428d1";

export const getBalances = async (req: Request, res: Response) => {
  const functionName = "getBalances";
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const requestValidation = schema.validate(req.body);
    if (requestValidation.error) {
      console.error(
        functionName,
        {},
        "",
        requestValidation.error.details[0].context?.value,
        req
      );
      return responseInvalidArgumentsError(res, requestValidation);
    }

    const getBalances = await axios.post(
      "https://api.metakeep.xyz/v2/app/coin/balance",
      {
        coins: {
          currencies: [BCN_TOKEN_ADDRESS],
        },
        of: {
          email: req.body.email,
        },
      },
      {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.METAKEEP_API_KEY,
        },
      }
    );

    if (getBalances.status == 200) {
      const balancesData: {
        status: string;
        balances: {
          currency: string;
          balance: string;
          name: string;
          symbol: string;
          locked?: string;
        }[];
      } = getBalances.data;
      return responseSuccess(res, 200, balancesData, "Fetched Balances.");
    } else {
      return requestFailed(res, 500, getBalances.data.status);
    }
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};

export const mintTestTokens = async (req: Request, res: Response) => {
  const functionName = "mintTestTokens";
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      amount: Joi.number().precision(0).min(1).required(),
    });

    const requestValidation = schema.validate(req.body);
    if (requestValidation.error) {
      console.error(
        functionName,
        {},
        "",
        requestValidation.error.details[0].context?.value,
        req
      );
      return responseInvalidArgumentsError(res, requestValidation);
    }

    const mintTokens = await axios.post(
      "https://api.metakeep.xyz/v2/app/coin/mint",
      {
        coin: {
          currency: BCN_TOKEN_ADDRESS,
        },
        amount: `${req.body.amount}`,
        to: {
          email: req.body.email,
        },
        locked: false,
      },
      {
        headers: {
          accept: "application/json",
          "Idempotency-Key": randomString(12),
          "x-api-key": process.env.METAKEEP_API_KEY,
        },
      }
    );

    if (mintTokens.status == 200) {
      const mintResponseData: {
        status: string;
        transactionChainScanUrl: string;
        transactionHash: string;
        transactionId: string;
      } = mintTokens.data;
      return responseSuccess(res, 200, mintResponseData, "Minted Tokens.");
    } else {
      return requestFailed(
        res,
        500,
        mintTokens.data.status ?? "API UNAVAILABLE"
      );
    }
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};

export const transferTestTokens = async (req: Request, res: Response) => {
  const functionName = "transferTestTokens";
  try {
    const schema = Joi.object({
      fromEmail: Joi.string().email().required(),
      toEmail: Joi.string().email().required(),
      amount: Joi.number().precision(0).min(1).required(),
    });

    const requestValidation = schema.validate(req.body);
    if (requestValidation.error) {
      console.error(
        functionName,
        {},
        "",
        requestValidation.error.details[0].context?.value,
        req
      );
      return responseInvalidArgumentsError(res, requestValidation);
    }

    const transferTokens = await axios.post(
      "https://api.metakeep.xyz/v2/app/coin/transfer",
      {
        coin: {
          currency: BCN_TOKEN_ADDRESS,
        },
        amount: `${req.body.amount}`,
        from: {
          email: req.body.fromEmail,
        },
        to: {
          email: req.body.toEmail,
        },
      },
      {
        headers: {
          accept: "application/json",
          "Idempotency-Key": randomString(12),
          "x-api-key": process.env.METAKEEP_API_KEY,
        },
      }
    );

    if (transferTokens.status == 200) {
      const transferResponseData: {
        status: string;
        consentToken: string;
      } = transferTokens.data;
      EmailSenderSingleton.getInstance().setNewRequest(
        transferResponseData.consentToken,
        {
          receiverEmail: req.body.toEmail,
          amount: `${req.body.amount}`,
          senderEmail: req.body.fromEmail,
        }
      );
      return responseSuccess(
        res,
        200,
        transferResponseData,
        "Transferred Tokens."
      );
    } else {
      return requestFailed(
        res,
        500,
        transferTokens.data.status ?? "API UNAVAILABLE"
      );
    }
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};

export const emailOnTransferTokens = async (req: Request, res: Response) => {
  const functionName = "emailOnTransferTokens";
  try {
    const schema = Joi.object({
      consentToken: Joi.string().required(),
    });

    const requestValidation = schema.validate(req.body);
    if (requestValidation.error) {
      console.error(
        functionName,
        {},
        "",
        requestValidation.error.details[0].context?.value,
        req
      );
      return responseInvalidArgumentsError(res, requestValidation);
    }
    const transferInfo = EmailSenderSingleton.getInstance().getInfoForToken(
      req.body.consentToken
    );

    if (
      !EmailSenderSingleton.getInstance().checkIfRequestExistsForToken(
        req.body.consentToken
      ) ||
      !transferInfo
    ) {
      return requestFailed(res, 400, "Consent Token wasn't registered.");
    }
    await sendMailToUser(transferInfo);

    return responseSuccess(
      res,
      200,
      { success: true, data: null },
      "Successfully sent an email to the receiver."
    );
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};
