import * as nodes from '../parser/rcasmNodes';
import * as languageFacts from '../languageFacts/facts';
import { Range, Position, Hover, MarkedString, MarkupContent, MarkupKind } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ClientCapabilities } from '../rcasmLanguageTypes';
import { isDefined } from '../utils/objects';

export class RCASMHover {
	private supportsMarkdown: boolean | undefined;

	constructor(private clientCapabilities: ClientCapabilities | undefined) { }

	doHover(document: TextDocument, position: Position, program: nodes.Program): Hover | null {

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

			if (node instanceof nodes.Opcode) {
				const opcode = node as nodes.Opcode;
				const mnemonicName = nodes.OpcodeType[opcode.opcode].toLowerCase();
				const entry = languageFacts.rcasmDataManager.getMnemonic(mnemonicName);
				if (entry) {
					const paramNames = this.getParamNames(opcode);
					const content = languageFacts.getEntrySpecificDescription(entry, paramNames, this.doesSupportMarkdown());
					hover = {
						contents: content,
						range: getRange(node)
					};
				}
				continue;
			}
		}

		if (hover) {
			hover.contents = this.convertContents(hover.contents);
		}

		return hover;
	}

	private getParamNames(opcode: nodes.Opcode): string[] {
		let paramNames: string[] = [];

		if (opcode.primaryParam) {
			paramNames.push(this.getParamName(opcode.primaryParam, opcode.opcode));
		} else {
			paramNames.push('?');
		}

		if (opcode.secondaryParam) {
			paramNames.push(this.getParamName(opcode.secondaryParam, opcode.opcode));
		} else {
			paramNames.push('?');
		}

		return paramNames;
	}

	private getParamName(param: nodes.Node, opcode: nodes.OpcodeType): string {

		if (param.isErroneous()) {
			return '?';
		}

		if (param instanceof nodes.Register) {
			const regParam = param as nodes.Register;
			return nodes.RegisterType[regParam.register];
		}

		if (param instanceof nodes.LabelRef) {
			const regLabel = param as nodes.LabelRef;
			return `(${regLabel.getText()})`;
		}

		if (param instanceof nodes.Constant) {
			const constParam = param as nodes.Constant;
			if (opcode === nodes.OpcodeType.LDI && constParam.value > 15) {
				return `0x${constParam.value.toString(16).toUpperCase()}`;
			}
			return constParam.value.toString();
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

			const hover = this.clientCapabilities?.textDocument && this.clientCapabilities.textDocument.hover;
			this.supportsMarkdown = hover && hover.contentFormat && Array.isArray(hover.contentFormat) && hover.contentFormat.indexOf(MarkupKind.Markdown) !== -1;
		}
		return <boolean>this.supportsMarkdown;
	}
}
