declare namespace NodeJS {
  interface ProcessEnv {
    API_TOKEN: string;
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN: string;
    BOT_TOKEN: string;
    CHAT_ID: string;
  }
}
