import { MOCK_SESSIONS, type Session } from "~/data/mock-session-data";

const loadDB = (): Session[] => JSON.parse(JSON.stringify(MOCK_SESSIONS));

export const db = {
  data: loadDB(),
  
  commit: () => {
    console.log("Mock DB updated:", db.data); 
  }
};

// simulate latency
export const delay = (ms?: number) => 
  new Promise((resolve) => setTimeout(resolve, ms ?? 300));