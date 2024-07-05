declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: string;
      METAKEEP_API_KEY: string;
      MAILER_APP_PASSWORD: string;
      MAILER_FROM_EMAIL: string;
    }
  }
}
export {};
