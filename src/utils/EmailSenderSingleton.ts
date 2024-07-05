export class EmailSenderSingleton {
  private static instance: EmailSenderSingleton | null = null;

  private transferIntent: Map<
    String,
    {
      senderEmail: string;
      receiverEmail: string;
      amount: string;
    }
  >;

  private constructor() {
    this.transferIntent = new Map<
      String,
      {
        senderEmail: string;
        receiverEmail: string;
        amount: string;
      }
    >();
  }

  public static getInstance() {
    if (!EmailSenderSingleton.instance) {
      EmailSenderSingleton.instance = new EmailSenderSingleton();
    }
    return EmailSenderSingleton.instance;
  }

  public setNewRequest(
    consentToken: string,
    transferInfo: { senderEmail: string; receiverEmail: string; amount: string }
  ) {
    consentToken = consentToken.toLowerCase();
    const requestObj = this.transferIntent.get(consentToken);
    if (requestObj) {
      return false;
    } else {
      this.transferIntent.set(consentToken, transferInfo);
      return true;
    }
  }

  public checkIfRequestExistsForToken(consentToken: string): boolean {
    consentToken = consentToken.toLowerCase();
    return this.transferIntent.get(consentToken) != undefined;
  }

  public getInfoForToken(consentToken: string) {
    consentToken = consentToken.toLowerCase();
    return this.transferIntent.get(consentToken);
  }

  public unsetRequest(consentToken: string): boolean {
    consentToken = consentToken.toLowerCase();
    return this.transferIntent.delete(consentToken);
  }

  public resetAll() {
    this.transferIntent = new Map<
      String,
      {
        senderEmail: string;
        receiverEmail: string;
        amount: string;
      }
    >();
    return;
  }
}
