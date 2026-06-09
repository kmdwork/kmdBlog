export type MarkdownRendererProps = {
    markdown: string;
    className?: string;
    origin?: string;
    fallbackOrigin?: string;
    sanitize?: boolean;
    enableLinkCard?: boolean;
    emptyFallback?: string;
};

export type MarkdownComponentOptions = {
    origin?: string;
    fallbackOrigin?: string;
    enableLinkCard: boolean;
};
