import * as nodes from '../parser/rcasmNodes';
import * as languageFacts from '../languageFacts/facts';
import { Position, CompletionList, CompletionItemKind, Range, TextEdit, CompletionItem, MarkupKind } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { InsertTextFormat, ClientCapabilities } from '../rcasmLanguageTypes';

import { isDefined } from '../utils/objects';

export class RCASMCompletion {

	private supportsMarkdown: boolean | undefined;

	position!: Position;
	offset!: number;
	currentWord!: string;
	textDocument!: TextDocument;
	program!: nodes.Program;
	defaultReplaceRange!: Range;

	constructor(private clientCapabilities: ClientCapabilities | undefined) {
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

			// Provide mnemonic completions following label or tabs/spaces at start of line only
			if (textOnLine.match(/^([a-z]+:)?([ \t]+)?([a-z]{0,3})$/i)) {
				this.getCompletionsForMnemonic(result);
				return result;
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

		const properties = languageFacts.rcasmDataManager.getMnemonics();

		properties.forEach(entry => {
			let range: Range;
			let insertText: string;
			range = this.getCompletionRange(null);
			insertText = entry.snippet ?? entry.name;

			const item: CompletionItem = {
				label: entry.name,
				detail: entry.class ? `${entry.summary} [${entry.class}]` : entry.summary,
				documentation: languageFacts.getEntryDescription(entry, this.doesSupportMarkdown()),
				textEdit: TextEdit.replace(range, insertText),
				insertTextFormat: InsertTextFormat.Snippet,
				kind: CompletionItemKind.Function
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
