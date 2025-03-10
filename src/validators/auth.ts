import { z } from "zod";

export const createUserWithPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8), // TODO: ask Dr. Mai for the password requirements
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  unitId: z.string().nonempty(),
});
