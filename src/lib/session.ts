import { sessionRepository } from "@repositories/session";
import { signJWT } from "./jwt";
import { DB } from "@middleware/db";
import { refreshTokenRepository } from "@repositories/refresh-token";
import { ExistingUser, NewUser } from "@repositories/user";

export const createSession = async (db: DB, user: NewUser | ExistingUser) => {
  const session = await sessionRepository.createSession(db, user.id!);

  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + 1000 * 60 * 15); // 15 minutes

  const token = await signJWT({
    userId: user.id,
    sessionId: session.id,
    exp: expiresAt,
    iat: new Date(),
  });

  const refreshToken = await refreshTokenRepository.createRefreshToken(
    db,
    user.id!,
    session.id
  );

  return { token, refreshToken };
};
