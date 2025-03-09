import { sql } from "drizzle-orm";
import { db } from "../db/client";

export const retrieveApiKey = async (key: string) => {
  const data = await db.query.apiKeys.findFirst({
    where: (fields) =>
      sql`${fields.encryptedKey} = crypt(${key}, ${fields.encryptedKey}) and ${
        fields.isActive
      } = ${true}`,
  });
  return data && data.isActive;
};
