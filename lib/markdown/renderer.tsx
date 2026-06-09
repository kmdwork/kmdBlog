import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { markdownProseClassName } from "./constants";
import { createMarkdownComponents } from "./components";
import type { MarkdownRendererProps } from "./types";

export function MarkdownRenderer({
    markdown,
    className = markdownProseClassName,
    origin,
    fallbackOrigin,
    sanitize = false,
    enableLinkCard = true,
    emptyFallback,
}: MarkdownRendererProps) {
    const rehypePlugins = sanitize ? [rehypeSanitize] : undefined;
    const components = createMarkdownComponents({
        origin,
        fallbackOrigin,
        enableLinkCard,
    });

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={rehypePlugins}
                components={components}
            >
                {markdown || emptyFallback || ""}
            </ReactMarkdown>
        </div>
    );
}
