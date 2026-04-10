/**
 * Editor entry point — bundled by esbuild into /scripts/editor-bundle.js.
 * Exposes window.initEditor({ containerEl, filenameEl, onChange, getCitekeys })
 * Returns an object with: open(name, content), getContent(), insertAtCursor(text)
 */
import { EditorView, keymap, lineNumbers, highlightActiveLine,
         highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle,
         bracketMatching, StreamLanguage } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap,
         completionKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches } from '@codemirror/search';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { LATEX_COMMANDS } from './utils/latex-completions.js';

/** Completion source: LaTeX commands triggered after \ */
function latexCommandSource(context) {
  const word = context.matchBefore(/\\[a-zA-Z]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: LATEX_COMMANDS.map(cmd => ({ label: cmd, type: 'keyword' })),
    validFor: /^\\[a-zA-Z]*$/,
  };
}

/** Completion source: citekeys triggered inside \cite{...} */
function citekeySource(getCitekeys) {
  return (context) => {
    const line  = context.state.doc.lineAt(context.pos);
    const before = line.text.slice(0, context.pos - line.from);
    const match  = before.match(/\\cite[a-z]*\{([^}]*)$/);
    if (!match) return null;
    const typed = match[1];
    return {
      from: context.pos - typed.length,
      options: getCitekeys().map(k => ({
        label: k,
        type: 'variable',
        detail: 'citekey',
      })),
      validFor: /^[^}]*$/,
    };
  };
}

/** Light theme matching the app's design tokens */
const appTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  '.cm-scroller': {
    overflow: 'auto',
    lineHeight: '1.7',
    fontFamily: 'inherit',
  },
  '.cm-content': {
    padding: '16px',
    caretColor: '#111827',
  },
  '.cm-gutters': {
    background: '#f9fafb',
    border: 'none',
    borderRight: '1px solid #e5e7eb',
    color: '#9ca3af',
    paddingRight: '4px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 4px',
    minWidth: '32px',
  },
  '.cm-activeLine': { background: '#eff6ff' },
  '.cm-activeLineGutter': { background: '#eff6ff' },
  '.cm-selectionBackground, ::selection': { background: '#dbeafe !important' },
  '.cm-cursor': { borderLeftColor: '#185FA5' },
  // Autocomplete popup
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    background: '#fff',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  '.cm-completionLabel': { color: '#111827' },
  '.cm-completionDetail': { color: '#6b7280', marginLeft: '8px' },
  'li[aria-selected].cm-completion': { background: '#eff6ff', color: '#185FA5' },
});

window.initEditor = function({ containerEl, filenameEl, onChange, getCitekeys }) {
  const view = new EditorView({
    state: EditorState.create({
      doc: '',
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        history(),
        highlightSelectionMatches(),
        StreamLanguage.define(stex),
        autocompletion({
          override: [latexCommandSource, citekeySource(getCitekeys)],
          activateOnTyping: true,
        }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChange?.(update.state.doc.toString());
        }),
        appTheme,
      ],
    }),
    parent: containerEl,
  });

  return {
    open(name, content) {
      filenameEl.textContent = name;
      const current = view.state.doc.toString();
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content ?? '' },
        // Reset undo history when switching files
        effects: [],
      });
    },

    getContent() {
      return view.state.doc.toString();
    },

    insertAtCursor(text) {
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: { anchor: sel.from + text.length },
      });
      view.focus();
      onChange?.(view.state.doc.toString());
    },
  };
};
