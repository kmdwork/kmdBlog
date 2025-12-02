import { z } from "zod";

export const updatePostSchema = z.object({
//   postId: z.string().min(1, "postIdがありません"),
    title: z.string().min(1, "タイトルは必須です").max(200, "タイトルが長すぎます"),
    // slug: z
    //     .string()
    //     .min(3, "スラッグは3文字以上にしてください")
    //     .max(100, "スラッグが長すぎます")
    //     .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "半角英数字とハイフンのみです"),
    content: z.string().min(20, "本文は20文字以上にしてください"),
    tags: z.string().optional().default(""),
    // publish: z.boolean(),
    // publishDate: z
    //     .union([
    //         z.instanceof(Date),
    //         z.null(),
    //     ])
    //     .refine(
    //         (val) => val === null || !isNaN(val.getTime()),
    //         { message: "公開日時の形式が不正です" }
    //     ),
    // publishDate: z.preprocess(
    //     (v) => (typeof v === "string" && v.trim() ? new Date(v) : null),
    //     z.date().nullable()
    // ),
});