import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  Columns3,
  Plus,
  Minus,
  RowsIcon,
  Trash2,
} from 'lucide-react';

interface NoteEditorProps {
  content: string;
  onSave: (html: string) => void;
  className?: string;
}

export function NoteEditor({ content, onSave, className = '' }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TableKit,
    ],
    content,
    editorProps: {
      attributes: {
        class: `tiptap ${className}`,
      },
    },
    onBlur({ editor: e }) {
      onSave(e.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      if (editor) {
        onSave(editor.getHTML());
      }
    };
  }, [editor]);

  if (!editor) return null;

  const isInTable = editor.isActive('table');

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-royal/5 border border-royal/10 border-b-0 rounded-t-sm">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Fet"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kursiv"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Overskrift 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Overskrift 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Punktliste"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Nummerert liste"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <span className="w-px h-6 bg-royal/20 mx-1" aria-hidden />

        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Sett inn tabell"
        >
          <Table size={16} />
        </ToolbarButton>

        {isInTable && (
          <>
            <span className="w-px h-6 bg-royal/20 mx-1" aria-hidden />
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Legg til kolonne"
            >
              <Columns3 size={14} />
              <Plus size={10} className="inline -ml-0.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Fjern kolonne"
            >
              <Columns3 size={14} />
              <Minus size={10} className="inline -ml-0.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Legg til rad"
            >
              <RowsIcon size={14} />
              <Plus size={10} className="inline -ml-0.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Fjern rad"
            >
              <RowsIcon size={14} />
              <Minus size={10} className="inline -ml-0.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Slett tabell"
            >
              <Trash2 size={14} />
            </ToolbarButton>
          </>
        )}
      </div>
      <div className="border border-royal/10 rounded-b-sm bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface NoteContentProps {
  content: string;
  className?: string;
}

export function NoteContent({ content, className = '' }: NoteContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TableKit,
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: `tiptap tiptap-readonly ${className}`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor || !content?.trim()) return null;

  return <EditorContent editor={editor} />;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-royal/20 text-royal'
          : 'text-royal/60 hover:text-royal hover:bg-royal/10'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
