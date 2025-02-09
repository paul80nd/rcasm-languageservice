'use strict';

import {
	DocumentHighlight, DocumentHighlightKind, Location,
	Position, Range, SymbolInformation, SymbolKind, TextDocument, DocumentSymbol
} from '../rcasmLanguageTypes';
import * as nodes from '../parser/rcasmNodes';
import { Symbols } from '../parser/rcasmSymbolScope';

type DocumentSymbolCollector = (name: string, kind: SymbolKind, symbolNodeOrRange: nodes.Node | Range, nameNodeOrRange: nodes.Node | Range | undefined, bodyNode: nodes.Node | undefined) => void;

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

	public findSymbolInformations(document: TextDocument, program: nodes.Program): SymbolInformation[] {
		const result: SymbolInformation[] = [];

		const addSymbolInformation = (name: string, kind: SymbolKind, symbolNodeOrRange: nodes.Node | Range) => {
			const range = symbolNodeOrRange instanceof nodes.Node ? getRange(symbolNodeOrRange, document) : symbolNodeOrRange;
			const entry: SymbolInformation = {
				name,
				kind,
				location: Location.create(document.uri, range)
			};
			result.push(entry);
		};

		this.collectDocumentSymbols(document, program, addSymbolInformation);

		return result;
	}

	public findDocumentSymbols(document: TextDocument, program: nodes.Program): DocumentSymbol[] {
		const result: DocumentSymbol[] = [];

		const parents: [DocumentSymbol, Range][] = [];

		const addDocumentSymbol = (name: string, kind: SymbolKind, symbolNodeOrRange: nodes.Node | Range, nameNodeOrRange: nodes.Node | Range | undefined, bodyNode: nodes.Node | undefined) => {
			const range = symbolNodeOrRange instanceof nodes.Node ? getRange(symbolNodeOrRange, document) : symbolNodeOrRange;
			const selectionRange = (nameNodeOrRange instanceof nodes.Node ? getRange(nameNodeOrRange, document) : nameNodeOrRange) ?? Range.create(range.start, range.start);
			const entry: DocumentSymbol = {
				name,
				kind,
				range,
				selectionRange
			};
			let top = parents.pop();
			while (top && !containsRange(top[1], range)) {
				top = parents.pop();
			}
			if (top) {
				const topSymbol = top[0];
				if (!topSymbol.children) {
					topSymbol.children = [];
				}
				topSymbol.children.push(entry);
				parents.push(top); // put back top
			} else {
				result.push(entry);
			}
			if (bodyNode) {
				parents.push([entry, getRange(bodyNode, document)]);
			}
		};

		this.collectDocumentSymbols(document, program, addDocumentSymbol);

		return result;
	}

	private collectDocumentSymbols(document: TextDocument, program: nodes.Program, collect: DocumentSymbolCollector): void {
		program.accept(node => {
			if (node instanceof nodes.Label) {
				collect(node.getName(), SymbolKind.Variable, node, node, undefined);
			}
			return true;
		});
	}
}

function getRange(node: nodes.Node, document: TextDocument): Range {
	return Range.create(document.positionAt(node.offset), document.positionAt(node.end));
}

/**
 * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
 */
function containsRange(range: Range, otherRange: Range): boolean {
	const otherStartLine = otherRange.start.line, otherEndLine = otherRange.end.line;
	const rangeStartLine = range.start.line, rangeEndLine = range.end.line;

	if (otherStartLine < rangeStartLine || otherEndLine < rangeStartLine) {
		return false;
	}
	if (otherStartLine > rangeEndLine || otherEndLine > rangeEndLine) {
		return false;
	}
	if (otherStartLine === rangeStartLine && otherRange.start.character < range.start.character) {
		return false;
	}
	if (otherEndLine === rangeEndLine && otherRange.end.character > range.end.character) {
		return false;
	}
	return true;
}

function getHighlightKind(node: nodes.Node): DocumentHighlightKind {

	if (node.type === nodes.NodeType.Label) {
		return DocumentHighlightKind.Write;
	}

	return DocumentHighlightKind.Read;
}