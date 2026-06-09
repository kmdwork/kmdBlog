"use client";

import {
    Compartment,
    EditorSelection,
    EditorState,
    type Extension,
} from "@codemirror/state";
import {
    EditorView,
    keymap,
    placeholder as placeholderExtension,
} from "@codemirror/view";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { basicSetup } from "codemirror";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";

export type MarkdownEditorHandle = {
    focus: () => void;
    insertText: (text: string) => void;
};

type MarkdownEditorProps = {
    value: string;
    onChange: (value: string) => void;
    name?: string;
    placeholder?: string;
    minLength?: number;
    required?: boolean;
    disabled?: boolean;
    className?: string;
};

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
    function MarkdownEditor(
        {
            value,
            onChange,
            name,
            placeholder,
            minLength,
            required,
            disabled,
            className,
        },
        ref
    ) {
        const rootRef = useRef<HTMLDivElement>(null);
        const viewRef = useRef<EditorView | null>(null);
        const editableCompartment = useMemo(() => new Compartment(), []);
        const placeholderCompartment = useMemo(() => new Compartment(), []);

        useEffect(() => {
            const parent = rootRef.current;
            if (!parent) return;

            const theme = EditorView.theme({
                "&": {
                    height: "100%",
                    backgroundColor: "transparent",
                    color: "inherit",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                },
                ".cm-editor": {
                    minHeight: "400px",
                    backgroundColor: "transparent",
                },
                ".cm-scroller": {
                    minHeight: "400px",
                    fontFamily: "inherit",
                },
                ".cm-content": {
                    minHeight: "400px",
                    padding: "0.75rem",
                    fontFamily: "inherit",
                },
                ".cm-line": {
                    padding: "0",
                },
                ".cm-focused": {
                    outline: "none",
                },
                ".cm-cursor, .cm-dropCursor": {
                    borderLeftColor: "var(--accent-cyan)",
                },
                ".cm-selectionBackground, ::selection": {
                    backgroundColor: "rgba(34, 211, 238, 0.25)",
                },
                ".cm-activeLine": {
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                },
                ".cm-gutters": {
                    display: "none",
                },
                ".cm-placeholder": {
                    color: "rgba(255,255,255,0.35)",
                    fontStyle: "normal",
                },
            });

            const extensions: Extension[] = [
                basicSetup,
                keymap.of(markdownKeymap),
                markdown(),
                EditorView.lineWrapping,
                theme,
                EditorView.updateListener.of((update) => {
                    if (!update.docChanged) return;
                    onChange(update.state.doc.toString());
                }),
                editableCompartment.of(EditorView.editable.of(!disabled)),
                placeholderCompartment.of(
                    placeholderExtension(placeholder ?? "")
                ),
            ];

            const state = EditorState.create({
                doc: value,
                extensions,
            });

            const view = new EditorView({
                state,
                parent,
            });

            viewRef.current = view;

            return () => {
                view.destroy();
                viewRef.current = null;
            };
        }, []);

        useEffect(() => {
            const view = viewRef.current;
            if (!view) return;

            const current = view.state.doc.toString();
            if (current === value) return;

            const selection = view.state.selection.main;
            const nextPos = Math.min(selection.from, value.length);

            view.dispatch({
                changes: { from: 0, to: current.length, insert: value },
                selection: EditorSelection.cursor(nextPos),
            });
        }, [value]);

        useEffect(() => {
            const view = viewRef.current;
            if (!view) return;

            view.dispatch({
                effects: editableCompartment.reconfigure(EditorView.editable.of(!disabled)),
            });
        }, [disabled, editableCompartment]);

        useEffect(() => {
            const view = viewRef.current;
            if (!view) return;

            view.dispatch({
                effects: placeholderCompartment.reconfigure(
                    placeholderExtension(placeholder ?? "")
                ),
            });
        }, [placeholder, placeholderCompartment]);

        useImperativeHandle(ref, () => ({
            focus() {
                viewRef.current?.focus();
            },
            insertText(text: string) {
                const view = viewRef.current;
                if (!view) return;

                const { from, to } = view.state.selection.main;
                const nextPos = from + text.length;

                view.dispatch({
                    changes: { from, to, insert: text },
                    selection: EditorSelection.cursor(nextPos),
                    userEvent: "input",
                });
                view.focus();
            },
        }), [onChange]);

        return (
            <div className={className}>
                <div ref={rootRef} />
                <textarea
                    name={name}
                    value={value}
                    readOnly
                    required={required}
                    minLength={minLength}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="sr-only"
                />
            </div>
        );
    }
);
