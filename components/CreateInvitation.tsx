// 'use client'

// import { createAndSendInvite } from "@/lib/actions/invites"
// import { useActionState } from "react"


// type ActionState = {
//   success: boolean;
//   errors: {
//     email?: string[];
//     role?: string[];
//     days?: string[];
//     form?: string[];  // フォーム全体の汎用エラーにも対応したい場合
//   };
// };


// export default function createInvitation() {
//     const [state, formAction] = useActionState<ActionState, FormData>(createAndSendInvite, {
//         success: false, errors: {}
//     })

//     return (
//         <div className="p-6 space-y-6 max-w-xl">
//             <h1 className="text-2xl font-bold">招待の作成</h1>

//             {state.success && (
//                 <p className="text-green-600">正常に更新しました</p>
//             )}

//             <form action={formAction} className="space-y-5">
//                 <div className="space-y-1">
//                 <label className="block text-sm opacity-80">メールアドレス（必須）</label>
//                 <input
//                     name="email"
//                     type="email"
//                     required
//                     className="w-full border rounded px-3 py-2 bg-transparent"
//                     placeholder="user@example.com"
//                 />
//                 </div>

//                 <fieldset className="space-y-2">
//                 <legend className="block text-sm opacity-80">ロール（必須）</legend>
//                 <div className="flex gap-6">
//                     <label className="inline-flex items-center gap-2">
//                     <input type="radio" name="role" value="editor" defaultChecked />
//                     <span>editor</span>
//                     </label>
//                     <label className="inline-flex items-center gap-2">
//                     <input type="radio" name="role" value="author" />
//                     <span>author</span>
//                     </label>
//                     <label className="inline-flex items-center gap-2">
//                     <input type="radio" name="role" value="reader" />
//                     <span>reader</span>
//                     </label>
//                 </div>
//                 </fieldset>

//                 <div className="space-y-1">
//                 <label className="block text-sm opacity-80">有効期限（日・必須）</label>
//                 <input
//                     name="days"
//                     type="number"
//                     min={1}
//                     max={60}
//                     defaultValue={7}
//                     required
//                     className="w-40 border rounded px-3 py-2 bg-transparent"
//                 />
//                 <p className="text-xs opacity-70 mt-1">1〜60 の範囲で設定できます。</p>
//                 </div>

//                 <button className="px-4 py-2 rounded-xl border">招待メールを送る</button>
//             </form>
//         </div>
//     )
// }
