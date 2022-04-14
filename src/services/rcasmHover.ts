'use strict';

import * as rcasm from '@paul80nd/rcasm';
import * as languageFacts from '../languageFacts/facts';
import { TextDocument, Range, Position, Hover, MarkedString, MarkupContent, MarkupKind, ClientCapabilities, IMnemonicData } from '../rcasmLanguageTypes';
import { isDefined } from '../utils/objects';

export class RCASMHover {
	private supportsMarkdown: boolean | undefined;

	constructor(private readonly clientCapabilities: ClientCapabilities | undefined) {
	}

	public doHover(document: TextDocument, position: Position): Hover | null {

		// Parse and find line
		const program = rcasm.parseOnly(document.getText());
		const line = program?.lines?.find(l => l.loc.start.line === position.line + 1);
		if (!line || !line.stmt) { return null; }

		// Confirm position within statement (not label or comment)
		const offset = document.offsetAt(position);
		if (offset < line.stmt.loc.start.offset || offset > line.stmt.loc.end.offset) { return null; }

		// Make hover for statement
		let hover: Hover | null = null;
		const stmt = line.stmt;
		if (stmt.type === 'insn') {
			const mnemonicName = stmt.mnemonic.toLowerCase();
			const entry = languageFacts.rcasmDataManager.getMnemonic(mnemonicName);
			if (entry) {
				const paramNames = this.getParamNames(entry, stmt);
				const content = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
				hover = {
					contents: content,
					range: Range.create(document.positionAt(stmt.loc.start.offset), document.positionAt(stmt.loc.end.offset))
				};
			}
		}

		if (hover) {
			hover.contents = this.convertContents(hover.contents);
		}

		return hover;
	}

	private getParamNames(entry: IMnemonicData, stmt: rcasm.StmtInsn): string[] {
		let paramNames: string[] = [];

		if (stmt.p1) {
			paramNames.push(this.getParamName(stmt.p1, stmt.mnemonic));
		} else if (entry.class === 'ALU') {
			paramNames.push('A');
		} else {
			paramNames.push('?');
		}

		if (stmt.p2) {
			paramNames.push(this.getParamName(stmt.p2, stmt.mnemonic));
		} else {
			paramNames.push('?');
		}

		return paramNames;
	}

	private getParamName(param: rcasm.Operand, mnemonic: string): string {

		switch (param.type) {
			case 'register':
				return param.value.toUpperCase();
			case 'qualified-ident':
				return `(${param.path[0]})`;
			case 'literal':
				if (mnemonic.toLowerCase() === 'ldi' && param.value > 15) {
					return `0x${param.value.toString(16).toUpperCase()}`;
				}
				return param.value.toString();
			default:
				return '?';
		}
	}

	private convertContents(contents: MarkupContent | MarkedString | MarkedString[]): MarkupContent | MarkedString | MarkedString[] {
		if (!this.doesSupportMarkdown()) {
			if (typeof contents === 'string') {
				return contents;
			}
			// MarkupContent
			else if ('kind' in contents) {
				return {
					kind: 'plaintext',
					value: contents.value
				};
			}
			// MarkedString[]
			else if (Array.isArray(contents)) {
				return contents.map(c => {
					return typeof c === 'string' ? c : c.value;
				});
			}
			// MarkedString
			else {
				return contents.value;
			}
		}

		return contents;
	}

	private doesSupportMarkdown() {
		if (!isDefined(this.supportsMarkdown)) {
			if (!isDefined(this.clientCapabilities)) {
				this.supportsMarkdown = true;
				return this.supportsMarkdown;
			}

			const hover = this.clientCapabilities.textDocument && this.clientCapabilities.textDocument.hover;
			this.supportsMarkdown = hover && hover.contentFormat && Array.isArray(hover.contentFormat) && hover.contentFormat.indexOf(MarkupKind.Markdown) !== -1;
		}
		return <boolean>this.supportsMarkdown;
	}
}
