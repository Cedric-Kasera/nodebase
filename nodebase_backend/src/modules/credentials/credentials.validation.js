import { z } from "zod";
import { CredentialType } from "../../config/constants.js";

const credentialTypeValues = Object.values(CredentialType);

export const createCredentialSchema = z.object({
  name: z.string().min(1, "Credential name is required").max(255),
  value: z.string().min(1, "Credential value is required"),
  type: z.enum(credentialTypeValues, {
    errorMap: () => ({ message: "Invalid credential type" }),
  }),
});

export const updateCredentialSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  value: z.string().min(1).optional(),
});
