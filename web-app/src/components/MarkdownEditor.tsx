'use client';

import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
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

// Add GFM table rule
turndownService.addRule('table', {
  filter: 'table',
  replacement(_content, node) {
    const table = node as HTMLTableElement;
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const toRow = (tr: Element) =>
      '| ' +
      Array.from(tr.querySelectorAll('th,td'))
        .map((cell) => (cell.textContent ?? '').trim().replace(/\|/g, '\\|'))
        .join(' | ') +
      ' |';

    const headerRow = rows[0];
    const headerCells = Array.from(headerRow.querySelectorAll('th,td'));
    const separator = '| ' + headerCells.map(() => '---').join(' | ') + ' |';

    const lines = [toRow(headerRow), separator, ...rows.slice(1).map(toRow)];
    return '\n\n' + lines.join('\n') + '\n\n';
  },
});

// Prevent turndown from trying to convert individual table elements
turndownService.addRule('tableCell', { filter: ['th', 'td'], replacement: (c) => c });
turndownService.addRule('tableRow', { filter: 'tr', replacement: (c) => c });
turndownService.addRule('tableSection', { filter: ['thead', 'tbody', 'tfoot'], replacement: (c) => c });

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
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: marked.parse(content || '') as string,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4',
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
    <div className="border border-gray-300 rounded-lg bg-white shadow-md m-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
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
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={toolbarBtn(false)}
          title="Insert Table"
        >
          ⊞ Table
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Add Column"
        >
          +Col
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Add Row"
        >
          +Row
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete Column"
        >
          -Col
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          className="px-3 py-1 rounded border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete Row"
        >
          -Row
        </button>
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className="px-3 py-1 rounded border border-transparent text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete Table"
        >
          ✕ Table
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
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
