import { MOCK_SESSIONS, type Session } from "~/data/mock-session-data";

/**
 * Singleton in-memory database to simulate backend persistence.
 */
class MockDB {
  private _sessions: Session[];

  constructor() {
    this._sessions = JSON.parse(JSON.stringify(MOCK_SESSIONS));
  }

  get sessions() {
    return this._sessions;
  }

  commit() {
    // Placeholder: This is where you'd trigger localStorage saves or API calls.
  }
}

export const db = new MockDB();
export const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));