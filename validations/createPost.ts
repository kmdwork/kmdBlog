import { z } from "zod";

export const createPostSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "タイトルは必須です")
        .max(200, "タイトルが長すぎます"),
    slug: z
        .string()
        .trim()
        .min(3, "スラッグは3文字以上にしてください")
        .max(100, "スラッグが長すぎます")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "半角英数字とハイフンのみです"),
    tags: z
        .string()
        .trim()
        .optional()
        .default(""),
    content: z
        .string()
        .trim()
        .min(20, "本文は20文字以上にしてください"),

    // "on" か undefined みたいな生の値ではなく、呼び出し元で boolean にした後を受け取る
    publish: z.boolean(),
    publishDate: z
        .union([
            z.instanceof(Date),
            z.null(),
        ])
        .refine(
            (val) => val === null || !isNaN(val.getTime()),
            { message: "公開日時の形式が不正です" }
        ),
})