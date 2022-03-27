'use strict';

import {
	DocumentHighlight, DocumentHighlightKind,/* DocumentLink,*/ Location,
	Position, Range, SymbolInformation, SymbolKind, /*TextEdit, WorkspaceEdit,*/ TextDocument /*, DocumentContext*/
} from '../rcasmLanguageTypes';
import * as nodes from '../parser/rcasmNodes';
import { Symbols } from '../parser/rcasmSymbolScope';

export class RCASMNavigation {

	public findDefinition(document: TextDocument, position: Position, program: nodes.Program): Location | null {

		const symbols = new Symbols(program);
		const offset = document.offsetAt(position);
		const node = nodes.getNodeAtOffset(program, offset);

		if (!node) {
			return null;
		}

		const symbol = symbols.findSymbolFromNode(node);
		if (!symbol) {
			return null;
		}

		return {
			uri: document.uri,
			range: getRange(symbol.node, document)
		};
	}

	public findReferences(document: TextDocument, position: Position, program: nodes.Program): Location[] {
		const highlights = this.findDocumentHighlights(document, position, program);
		return highlights.map(h => {
			return {
				uri: document.uri,
				range: h.range
			};
		});
	}

	public findDocumentHighlights(document: TextDocument, position: Position, program: nodes.Program): DocumentHighlight[] {
		const result: DocumentHighlight[] = [];

		const offset = document.offsetAt(position);
		let node = nodes.getNodeAtOffset(program, offset);
		if (!node || node.type !== nodes.NodeType.Label && node.type !== nodes.NodeType.LabelRef) {
			return result;
		}

		const symbols = new Symbols(program);
		const symbol = symbols.findSymbolFromNode(node);
		const name = node.getText();

		program.accept(candidate => {
			if (symbol) {
				if (symbols.matchesSymbol(candidate, symbol)) {
					result.push({
						kind: getHighlightKind(candidate),
						range: getRange(candidate, document)
					});
					return false;
				}
			} else if (node && node.type === candidate.type && candidate.matches(name)) {
				// Same node type and data
				result.push({
					kind: getHighlightKind(candidate),
					range: getRange(candidate, document)
				});
			}
			return true;
		});

		return result;
	}

	public findDocumentSymbols(document: TextDocument, program: nodes.Program): SymbolInformation[] {
		const result: SymbolInformation[] = [];

		program.accept((node) => {
			const entry: SymbolInformation = {
				name: null!,
				kind: SymbolKind.Class,
				location: null!
			};
			let locationNode: nodes.Node | null = node;

			if (node instanceof nodes.Label) {
				entry.name = (<nodes.Label>node).getText();
				entry.kind = SymbolKind.Variable;
			}

			if (entry.name) {
				entry.location = Location.create(document.uri, getRange(locationNode, document));
				result.push(entry);
			}

			return true;
		});

		return result;
	}

}

function getHighlightKind(node: nodes.Node): DocumentHighlightKind {

	if (node instanceof nodes.Label) {
		return DocumentHighlightKind.Write;
	}

	return DocumentHighlightKind.Read;
}

function getRange(node: nodes.Node, document: TextDocument): Range {
	return Range.create(document.positionAt(node.offset), document.positionAt(node.end));
}