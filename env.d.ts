declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: string;
      METAKEEP_API_KEY: string;
    }
  }
}
export {};
