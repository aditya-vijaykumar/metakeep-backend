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
import { Web3 } from "web3";

const BCN_TOKEN_ADDRESS = "0xc6E5740786236Ae58092f07b62B120753eB428d1";
const MOCK_USDC_ADDRESS = "0xe872EF7fEc4D9FC0583aA9AB67b9a9A0A2bA4628";

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
    await sendMailToUser({ ...transferInfo, tokenSymbol: "BCN" });
    EmailSenderSingleton.getInstance().unsetRequest(req.body.consentToken);

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

export const initiateTransferMockUSD = async (req: Request, res: Response) => {
  const functionName = "initiateTransferMockUSD";
  try {
    const schema = Joi.object({
      fromEmail: Joi.string().email().required(),
      toEmail: Joi.string().email().required(),
      amount: Joi.number().precision(2).min(1).required(),
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

    const walletAddressesRequests = [
      axios.post(
        "https://api.metakeep.xyz/v3/getWallet",
        {
          user: {
            email: req.body.fromEmail,
          },
        },
        {
          headers: {
            accept: "application/json",
            "x-api-key": process.env.METAKEEP_API_KEY,
          },
        }
      ),
      axios.post(
        "https://api.metakeep.xyz/v3/getWallet",
        {
          user: {
            email: req.body.toEmail,
          },
        },
        {
          headers: {
            accept: "application/json",
            "x-api-key": process.env.METAKEEP_API_KEY,
          },
        }
      ),
    ];
    const walletAddresses = await Promise.all(walletAddressesRequests);

    const amount = req.body.amount * 1000000; // Convert to micro USD
    const nonce = Web3.utils.randomHex(32);
    const typedMessage = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      domain: {
        name: "USD Coin",
        version: "2",
        chainId: 80002,
        verifyingContract: MOCK_USDC_ADDRESS,
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: walletAddresses[0].data.wallet.ethAddress,
        to: walletAddresses[1].data.wallet.ethAddress,
        value: amount.toString(),
        validAfter: 0,
        validBefore: Math.floor(Date.now() / 1000) + 3600, // Valid for an hour
        nonce: nonce,
      },
    };

    return responseSuccess(
      res,
      200,
      { typedMessage: typedMessage },
      "Typed message for signing the transaction."
    );
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};

export const completeTransferMockUSD = async (req: Request, res: Response) => {
  const functionName = "completeTransferMockUSD";
  try {
    const schema = Joi.object({
      typedMessage: Joi.object({
        types: Joi.object({
          EIP712Domain: Joi.array().items(Joi.object()),
          TransferWithAuthorization: Joi.array().items(Joi.object()),
        }),
        domain: Joi.object({
          name: Joi.string(),
          version: Joi.string(),
          chainId: Joi.number(),
          verifyingContract: Joi.string(),
        }),
        primaryType: Joi.string(),
        message: Joi.object({
          from: Joi.string(),
          to: Joi.string(),
          value: Joi.string(),
          validAfter: Joi.number(),
          validBefore: Joi.number(),
          nonce: Joi.string(),
        }),
      }).required(),
      signature: Joi.string().required(),
      fromEmail: Joi.string().email().required(),
      toEmail: Joi.string().email().required(),
      amount: Joi.number().precision(2).min(1).required(),
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

    const message = req.body.typedMessage.message;

    const requestData = {
      function: {
        name: "transferWithAuthorization",
        args: [
          message.from,
          message.to,
          `${message.value}`,
          `${message.validAfter}`,
          `${message.validBefore}`,
          message.nonce,
          req.body.signature,
        ],
      },
      description: {
        text: `Transfer ${req.body.amount} USDC`,
      },
      lambda: MOCK_USDC_ADDRESS,
      using: "BUSINESS_WALLET",
    };

    const submitTransferTx = await axios.post(
      "https://api.metakeep.xyz/v2/app/lambda/invoke",
      requestData,
      {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.METAKEEP_API_KEY,
          "Idempotency-Key": randomString(12),
        },
      }
    );

    if (submitTransferTx.status != 200) {
      return requestFailed(res, 500, "Failed to submit transaction.");
    }

    await sendMailToUser({
      amount: `${req.body.amount}`,
      receiverEmail: req.body.toEmail,
      senderEmail: req.body.fromEmail,
      tokenSymbol: "USDC",
    });

    return responseSuccess(
      res,
      200,
      {
        success: true,
        data: submitTransferTx.data,
      },
      "Successfully transferred tokens and sent an email to the receiver."
    );
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, error);
    return internalServerError(res, error);
  }
};

export const getUSDCBalance = async (req: Request, res: Response) => {
  const functionName = "getUSDCBalance";
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

    const walletAddress = await axios.post(
      "https://api.metakeep.xyz/v3/getWallet",
      {
        user: {
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

    const web3Provider = new Web3(
      new Web3.providers.HttpProvider("https://rpc-amoy.polygon.technology")
    );
    const contract = new web3Provider.eth.Contract(
      [
        {
          constant: true,
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      MOCK_USDC_ADDRESS
    );
    const balance: BigInt = await contract.methods
      .balanceOf(walletAddress.data.wallet.ethAddress)
      .call();

    if (!balance) {
      return requestFailed(res, 500, "Failed to fetch balance");
    }

    return responseSuccess(
      res,
      200,
      {
        miniUSDBalance: balance.toString(),
        usdBalance: Math.round(parseInt(balance.toString()) / 1000000),
      },
      "Fetched USDC Balance."
    );
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};

export const mintMockUSDCTokens = async (req: Request, res: Response) => {
  const functionName = "mintMockUSDCTokens";
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

    const userWalletAddress = await axios.post(
      "https://api.metakeep.xyz/v3/getWallet",
      {
        user: {
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

    if (!userWalletAddress.data.wallet.ethAddress) {
      return requestFailed(res, 500, "Failed to fetch wallet address.");
    }

    const address = userWalletAddress.data.wallet.ethAddress;
    const amount = req.body.amount * 1000000; // Convert to micro USD

    const requestData = {
      function: {
        name: "mintToAddress",
        args: [address, `${amount}`],
      },
      description: {
        text: `Mint ${req.body.amount} USDC`,
      },
      lambda: MOCK_USDC_ADDRESS,
      using: "BUSINESS_WALLET",
    };

    const mintTokensTx = await axios.post(
      "https://api.metakeep.xyz/v2/app/lambda/invoke",
      requestData,
      {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.METAKEEP_API_KEY,
          "Idempotency-Key": randomString(12),
        },
      }
    );

    if (mintTokensTx.status == 200) {
      const mintResponseData: {
        status: string;
        transactionChainScanUrl: string;
        transactionHash: string;
        transactionId: string;
      } = mintTokensTx.data;
      return responseSuccess(res, 200, mintResponseData, "Minted Tokens.");
    } else {
      return requestFailed(
        res,
        500,
        mintTokensTx.data.status ?? "API UNAVAILABLE"
      );
    }
  } catch (error: any) {
    console.error(functionName, {}, "API", error.message, req);
    return internalServerError(res, error);
  }
};
