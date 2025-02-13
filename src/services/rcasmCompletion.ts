import * as nodes from '../parser/rcasmNodes';
import * as languageFacts from '../languageFacts/facts';
import { Position, CompletionList, CompletionItemKind, Range, TextEdit, CompletionItem, MarkupKind } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { InsertTextFormat, ClientCapabilities } from '../rcasmLanguageTypes';

import { isDefined } from '../utils/objects';
import { RCASMDataManager } from '../languageFacts/dataManager';

export class RCASMCompletion {

	private supportsMarkdown: boolean | undefined;

	position!: Position;
	offset!: number;
	currentWord!: string;
	textDocument!: TextDocument;
	program!: nodes.Program;
	defaultReplaceRange!: Range;

	constructor(private clientCapabilities: ClientCapabilities | undefined, private rcasmDataManager: RCASMDataManager) {
	}

	doComplete(document: TextDocument, position: Position, program: nodes.Program): CompletionList {

		this.offset = document.offsetAt(position);
		this.position = position;
		this.currentWord = getCurrentWord(document, this.offset);
		this.defaultReplaceRange = Range.create(Position.create(this.position.line, this.position.character - this.currentWord.length), this.position);
		this.textDocument = document;
		this.program = program;

		try {

			const result: CompletionList = {
				isIncomplete: false,
				items: []
			};

			var textOnLine = document.getText(Range.create(Position.create(this.position.line, 0), this.position));

			// Provide mnemonic or directive completions following label or tabs/spaces at start of line only
			// Further letters then refine to mnemonic or an exclamation mark to directives
			if (textOnLine.match(/^([a-z]+:)?([ \t]+)?([a-z]{0,3})$/i)) {
				this.getCompletionsForMnemonic(result);
			}

			// Similar for directives but triggered by the exclamation mark
			if (textOnLine.match(/^([a-z]+:)?([ \t]+)?([\!]?[a-z]*)$/i)) {
				this.getCompletionsForDirective(result);
			}

			return result;

		} finally {
			// don't hold on any state, clear symbolContext
			this.position = null!;
			this.currentWord = null!;
			this.textDocument = null!;
			this.program = null!;
			this.defaultReplaceRange = null!;
		}
	}

	public getCompletionsForMnemonic(result: CompletionList): CompletionList {

		const properties = this.rcasmDataManager.getMnemonics();
		properties.forEach(entry => {
			let range: Range;
			let insertText: string;
			range = this.getCompletionRange(null);
			insertText = entry.snippet ?? entry.name;

			const item: CompletionItem = {
				label: entry.name,
				detail: entry.summary,
				documentation: languageFacts.getEntryDescription(entry, this.doesSupportMarkdown()),
				textEdit: TextEdit.replace(range, insertText),
				insertTextFormat: InsertTextFormat.Snippet,
				kind: CompletionItemKind.Method
			};

			result.items.push(item);
		});

		return result;
	}

	public getCompletionsForDirective(result: CompletionList): CompletionList {

		const directives = this.rcasmDataManager.getDirectives();
		directives.forEach(entry => {
			let range: Range;
			let insertText: string;
			range = this.getCompletionRange(null);
			insertText = entry.snippet ?? entry.name;

			const item: CompletionItem = {
				label: entry.name,
				detail: entry.summary,
				documentation: languageFacts.getEntryDescription(entry, this.doesSupportMarkdown()),
				textEdit: TextEdit.replace(range, insertText),
				insertTextFormat: InsertTextFormat.Snippet,
				kind: CompletionItemKind.Property,
				sortText: entry.name.substring(1)
			};

			result.items.push(item);
		});

		return result;
	}

	private doesSupportMarkdown(): boolean {
		if (!isDefined(this.supportsMarkdown)) {
			if (!isDefined(this.clientCapabilities)) {
				this.supportsMarkdown = true;
				return this.supportsMarkdown;
			}

			const hover = this.clientCapabilities && this.clientCapabilities.textDocument && this.clientCapabilities.textDocument.hover;
			this.supportsMarkdown = hover && hover.contentFormat && Array.isArray(hover.contentFormat) && hover.contentFormat.indexOf(MarkupKind.Markdown) !== -1;
		}
		return <boolean>this.supportsMarkdown;
	}

	protected getCompletionRange(existingNode: nodes.Node | null) {
		if (existingNode && existingNode.offset <= this.offset && this.offset <= existingNode.end) {
			const end = existingNode.end !== -1 ? this.textDocument.positionAt(existingNode.end) : this.position;
			const start = this.textDocument.positionAt(existingNode.offset);
			if (start.line === end.line) {
				return Range.create(start, end); // multi line edits are not allowed
			}
		}
		return this.defaultReplaceRange;
	}
}

function getCurrentWord(document: TextDocument, offset: number): string {
	let i = offset - 1;
	const text = document.getText();
	while (i >= 0 && ' \t\n\r:,'.indexOf(text.charAt(i)) === -1) {
		i--;
	}
	return text.substring(i + 1, offset);
}
