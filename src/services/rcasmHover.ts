'use strict';

import * as nodes from '../parser/rcasmNodes';
import * as languageFacts from '../languageFacts/facts';
import { TextDocument, Range, Position, Hover, MarkedString, MarkupContent, MarkupKind, ClientCapabilities, IMnemonicData } from '../rcasmLanguageTypes';
import { isDefined } from '../utils/objects';

export class RCASMHover {
	private supportsMarkdown: boolean | undefined;

	constructor(private readonly clientCapabilities: ClientCapabilities | undefined) {
	}

	public doHover(document: TextDocument, position: Position, program: nodes.Program): Hover | null {
		function getRange(node: nodes.Node) {
			return Range.create(document.positionAt(node.offset), document.positionAt(node.end));
		}
		const offset = document.offsetAt(position);
		const nodepath = nodes.getNodePath(program, offset);

		/**
		 * nodepath is top-down
		 * Build up the hover by appending inner node's information
		 */
		let hover: Hover | null = null;

		for (let i = 0; i < nodepath.length; i++) {
			const node = nodepath[i];

			if (node instanceof nodes.Instruction) {
				const mnemonicName = node.mnemonic;
				const entry = languageFacts.rcasmDataManager.getMnemonic(mnemonicName);
				if (entry) {
					const paramNames = this.getParamNames(entry, node);
					const content = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
					hover = {
						contents: content,
						range: getRange(node)
					};
				}
			}

			if (node instanceof nodes.SetPC) {
				const entry = languageFacts.rcasmDataManager.getMnemonic('org');
				if (entry) {
					const paramNames = [ node.pcExpr.getText() ];
					const content = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
					hover = {
						contents: content,
						range: getRange(node)
					};
				}
			}

			if (node instanceof nodes.Data) {
				const dtype = node.getText().slice(0,3).toLowerCase();
				const entry = languageFacts.rcasmDataManager.getMnemonic(dtype);
				if (entry) {
					const content = languageFacts.getEntryDescription(entry, this.doesSupportMarkdown());
					hover = {
						contents: content,
						range: getRange(node)
					};			
				}
			}
		}

		if (hover) {
			hover.contents = this.convertContents(hover.contents);
		}

		return hover;
	}

	private getParamNames(entry: IMnemonicData, insn: nodes.Instruction): string[] {
		let paramNames: string[] = [];

		if (insn.p1) {
			paramNames.push(this.getParamName(insn.p1, insn.mnemonic));
		} else if (entry.class === 'ALU') {
			paramNames.push('A');
		} else {
			paramNames.push('?');
		}

		if (insn.p2) {
			paramNames.push(this.getParamName(insn.p2, insn.mnemonic));
		} else {
			paramNames.push('?');
		}

		return paramNames;
	}

	private getParamName(param: nodes.Operand, mnemonic: string): string {

		if (param instanceof nodes.Register) {
			return param.value;
		}

		if (param instanceof nodes.LabelRef) {
			return `(${param.getText()})`;
		}

		if (param instanceof nodes.Literal) {
			if (mnemonic.toLowerCase() === 'ldi' && +param.value > 15) {
				return `0x${param.value.toString(16).toUpperCase()}`;
			}
			return param.value.toString();
		}

		return '?';
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
