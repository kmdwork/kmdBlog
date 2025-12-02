import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import Script from "next/script";
import { cookies } from "next/headers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
      default: "KMD WORKS",
      template: "%s | KMD WORKS",
    },
    description: "KMD WORKS のホームページ",
};

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="ja">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {children}
//       </body>
//     </html>
//   );
// }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies()
  const cookieTheme = (await cookieStore).get('theme')?.value as 'light'|'dark'|undefined
  // サーバ側で data-theme を確定（なければ light/dark のデフォルト決め打ち）
  const initialTheme = cookieTheme ?? 'dark'

  return (
    <html lang="ja" data-theme={initialTheme}>
      <head>
        {/* 初回描画前に data-theme を即設定（localStorage or OS設定） */}
        <Script id="theme-init" strategy="beforeInteractive">{
          `(function(){
            try {
              var t = localStorage.getItem('theme');
              var d = t ? t : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-theme', d);
            } catch(e) {
            
            }
          })();`
        }</Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}