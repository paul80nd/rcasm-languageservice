'use strict';

import * as nodes from '../parser/rcasmNodes';
import * as languageFacts from '../languageFacts/facts';
import { TextDocument, Range, Position, Hover, MarkedString, MarkupContent, MarkupKind, ClientCapabilities, IMnemonicData } from '../rcasmLanguageTypes';
import { isDefined } from '../utils/objects';
import { RCASMDataManager } from '../languageFacts/dataManager';

export class RCASMHover {
	private supportsMarkdown: boolean | undefined;

	constructor(
		private readonly clientCapabilities: ClientCapabilities | undefined,
		private readonly rcasmDataManager: RCASMDataManager) {
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
				const entry = this.rcasmDataManager.getMnemonic(mnemonicName);
				if (entry) {
					const paramNames = this.getParamNames(entry, node);
					const contents = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
					if (contents) {
						hover = { contents, range: getRange(node) };
					} else {
						hover = null;
					}
				}
				break;
			}

			if (node instanceof nodes.SetPC) {
				const entry = this.rcasmDataManager.getMnemonic('org');
				if (entry) {
					const paramNames = [node.pcExpr.getText()];
					const contents = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
					if (contents) {
						hover = { contents, range: getRange(node) };
					} else {
						hover = null;
					}
				}
				break;
			}

			if (node instanceof nodes.ForDirective || node instanceof nodes.IfDirective) {
				// Only respond if on first line of node (node includes the for directive and the body)
				const range = getRange(node);
				if (position.line !== range.start.line) {
					continue;
				}

				const dtype = node.getText().slice(0, 4).toLowerCase().trim();
				const entry = this.rcasmDataManager.getDirective(dtype);
				if (entry) {
					const contents = languageFacts.getEntryDescription(entry, this.doesSupportMarkdown());
					if (contents) {
						hover = { contents, range: getRange(node), };
					} else {
						hover = null;
					}
				}
				break;
			}

			if (node instanceof nodes.DataDirective || node instanceof nodes.FillDirective) {
				const dtype = node.getText().slice(0, 5).toLowerCase();
				const entry = this.rcasmDataManager.getDirective(dtype);
				if (entry) {
					const contents = languageFacts.getEntryDescription(entry, this.doesSupportMarkdown());
					if (contents) {
						hover = { contents, range: getRange(node), };
					} else {
						hover = null;
					}
				}
				break;
			}

			if (node instanceof nodes.AlignDirective) {
				const dtype = node.getText().slice(0, 6).toLowerCase();
				const entry = this.rcasmDataManager.getDirective(dtype);
				if (entry) {
					const contents = languageFacts.getEntryDescription(entry, this.doesSupportMarkdown());
					if (contents) {
						hover = { contents, range: getRange(node), };
					} else {
						hover = null;
					}
				}
				break;
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
			paramNames.push(this.getParamName(entry, insn.p1, insn.mnemonic));
		} else if (entry.class === 'ALU') {
			paramNames.push('A');
		} else {
			paramNames.push('?');
		}

		if (insn.p2) {
			paramNames.push(this.getParamName(entry, insn.p2, insn.mnemonic));
		} else {
			paramNames.push('?');
		}

		return paramNames;
	}

	private getParamName(entry: IMnemonicData, param: nodes.Operand, mnemonic: string): string {

		if (param instanceof nodes.Register) {
			return param.value;
		}

		if (param instanceof nodes.LabelRef) {
			return `(${param.getText().trim()})`;
		}

		if (param instanceof nodes.Expression) {
			return param.getText().trim();
		}

		if (param instanceof nodes.Literal) {
			if (mnemonic.toLowerCase() === 'ldi' && +param.value > 15) {
				return `0x${param.value.toString(16).toUpperCase()}`;
			} else if (entry.class === "GOTO") {
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
