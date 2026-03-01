'use client';

import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// Initialize turndown service for HTML → Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export default function MarkdownEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: MarkdownEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: marked.parse(content || '') as string,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && content) {
      const currentMarkdown = turndownService.turndown(editor.getHTML());
      if (content !== currentMarkdown) {
        const html = marked.parse(content) as string;
        editor.commands.setContent(html);
      }
    }
  }, [content, editor]);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isUnderline: ctx.editor?.isActive('underline') ?? false,
      isH1: ctx.editor?.isActive('heading', { level: 1 }) ?? false,
      isH2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
      isH3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
      isBlockquote: ctx.editor?.isActive('blockquote') ?? false,
      canUndo: ctx.editor?.can().undo() ?? false,
      canRedo: ctx.editor?.can().redo() ?? false,
    }),
  });

  if (!editor) {
    return null;
  }

  const toolbarBtn = (active: boolean) =>
    `px-3 py-1 rounded border transition-colors ${
      active
        ? 'bg-indigo-100 text-indigo-800 border-indigo-400 shadow-inner'
        : 'text-gray-700 border-transparent hover:bg-gray-200 hover:border-gray-300'
    }`;

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-md m-6 p-0">
      {/* Toolbar */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editorState?.isBold ?? false)}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editorState?.isItalic ?? false)}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolbarBtn(editorState?.isUnderline ?? false)}
          title="Underline"
        >
          <u>U</u>
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={toolbarBtn(editorState?.isH1 ?? false)}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toolbarBtn(editorState?.isH2 ?? false)}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={toolbarBtn(editorState?.isH3 ?? false)}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editorState?.isBulletList ?? false)}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editorState?.isOrderedList ?? false)}
          title="Numbered List"
        >
          1. List
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toolbarBtn(editorState?.isBlockquote ?? false)}
          title="Quote"
        >
          " Quote
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!(editorState?.canUndo ?? false)}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!(editorState?.canRedo ?? false)}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Redo"
        >
          ↷ Redo
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
