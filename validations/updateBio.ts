import { z } from "zod";

export const updateBioSchema = z.object({
    bio: z
        .string()
        .trim()
        .max(500, "自己紹介は500文字以内で入力してください。")
        .optional()
});