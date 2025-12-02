

type SendEmailInput = { 
    from: string; 
    to: string; 
    subject: string; 
    html: string 
};

export async function sendEmail({ from, to, subject, html }: SendEmailInput) {
    const resendApiKey = process.env.RESEND_API_KEY!;
    if (!resendApiKey) {
        throw new Error("RESEND_API_KEY is not defined");
    }

    const payload = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        // ...(replyTo && { reply_to: replyTo }), // オプション
    };

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            // ===== 成功 =====
            if (res.ok) {
                const data = await res.json();
                console.log(`Email sent successfully: ${data}`);
                return data; // { id: "xxx" }
            }
                // ===== エラーレスポンスを取得 =====
            const errorText = await res.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            // ===== リトライ可能なエラー =====
            if (res.status === 429 || res.status >= 500) {
                const waitTime = 300 * 2 ** (attempt - 1); // 指数バックオフ
                console.warn(
                    `Resend API error (${res.status}), retrying in ${waitTime}ms... (attempt ${attempt}/${MAX_RETRIES})`
                );

                if (attempt < MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    continue; // 再試行
                }
            }
            // ===== リトライ不可能なエラー =====
            throw new Error(
                `Resend API failed (${res.status}): ${errorData.message || errorText}`
            );
        } catch (error) {
            // ネットワークエラーなど
            if (attempt < MAX_RETRIES) {
                const waitTime = 300 * 2 ** (attempt - 1);
                console.warn(
                    `Network error, retrying in ${waitTime}ms... (attempt ${attempt}/${MAX_RETRIES})`,
                    error
                );
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                continue;
            }
            
            // 最終試行でも失敗
            throw error;
        }
    }
}