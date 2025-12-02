import { z } from "zod";

export const updateRoleSchema = z.enum(["editor", "author", "reader"]); 