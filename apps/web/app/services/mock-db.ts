import { MOCK_SESSIONS, type Session } from "~/data/mock-session-data";

// In-memory store (Mutable) - This acts as your "Database" for the session
// In the future, this file will be replaced by actual API calls.
class MockDB {
  private _data: Session[];

  constructor() {
    this._data = JSON.parse(JSON.stringify(MOCK_SESSIONS));
  }

  get sessions() {
    return this._data;
  }

  // Helper to commit changes (no-op here, but useful for debugging or localstorage sync)
  commit() {
    // console.log("DB Snapshot:", this._data);
  }
}

export const db = new MockDB();

export const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));