import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { createHeadingId } from "./utils";

export type TocItem = {
    level: 2 | 3;
    text: string;
    id: string;
};

type MdastNode = {
    type?: string;
    value?: string;
    alt?: string;
    depth?: number;
    children?: MdastNode[];
};

function extractHeadingText(node: MdastNode): string {
    if (typeof node.value === "string") return node.value;
    if (typeof node.alt === "string") return node.alt;
    if (!Array.isArray(node.children)) return "";

    return node.children.map((child) => extractHeadingText(child)).join("");
}

export function extractTableOfContents(markdown: string): TocItem[] {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastNode;
    const items: TocItem[] = [];
    let headingIndex = 0;

    function visit(node: MdastNode) {
        if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
            const text = extractHeadingText(node).trim();
            if (text) {
                items.push({
                    level: node.depth,
                    text,
                    id: createHeadingId(text, headingIndex),
                });
                headingIndex += 1;
            }
        }

        if (!Array.isArray(node.children)) return;
        node.children.forEach(visit);
    }

    visit(tree);
    return items;
}
