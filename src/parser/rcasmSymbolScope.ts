'use strict';

import * as nodes from './rcasmNodes';

export class Scope {

	private symbols: Symbol[];

	constructor(offset: number, length: number) {
		this.symbols = [];
	}

	public addSymbol(symbol: Symbol): void {
		this.symbols.push(symbol);
	}

	public getSymbol(name: string, type: nodes.ReferenceType): Symbol | null {
		for (let index = 0; index < this.symbols.length; index++) {
			const symbol = this.symbols[index];
			if (symbol.name === name && symbol.type === type) {
				return symbol;
			}
		}
		return null;
	}
}

export class GlobalScope extends Scope {

	constructor() {
		super(0, Number.MAX_VALUE);
	}

}

export class Symbol {

	public name: string;
	public value: string | undefined;
	public type: nodes.ReferenceType;
	public node: nodes.Node;

	constructor(name: string, value: string | undefined, node: nodes.Node, type: nodes.ReferenceType) {
		this.name = name;
		this.value = value;
		this.node = node;
		this.type = type;
	}
}

export class ScopeBuilder implements nodes.IVisitor {

	public scope: Scope;

	constructor(scope: Scope) {
		this.scope = scope;
	}

	private addSymbol(node: nodes.Node, name: string, value: string | undefined, type: nodes.ReferenceType): void {
		if (node.offset !== -1) {
			this.scope.addSymbol(new Symbol(name, value, node, type));
		}
	}

	public visitNode(node: nodes.Node): boolean {
		switch (node.type) {
			case nodes.NodeType.Label:
				this.addSymbol(node, (<nodes.Label>node).getText(), void 0, nodes.ReferenceType.Label);
				return true;
		}
		return true;
	}

}

export class Symbols {

	private global: Scope;

	constructor(node: nodes.Node) {
		this.global = new GlobalScope();
		node.acceptVisitor(new ScopeBuilder(this.global));
	}

	private internalFindSymbol(node: nodes.Node, referenceTypes: nodes.ReferenceType[]): Symbol | null {
		const name = node.getText();
		let scope = this.global;
		for (let index = 0; index < referenceTypes.length; index++) {
			const type = referenceTypes[index];
			const symbol = scope.getSymbol(name, type);
			if (symbol) {
				return symbol;
			}
		}
		return null;
	}

	private evaluateReferenceTypes(node: nodes.Node): nodes.ReferenceType[] | null {
		if (node instanceof nodes.LabelRef || node instanceof nodes.Label) {
			return [nodes.ReferenceType.Label];
		}
		return null;
	}

	public findSymbolFromNode(node: nodes.Node): Symbol | null {
		if (!node) {
			return null;
		}

		const referenceTypes = this.evaluateReferenceTypes(node);
		if (referenceTypes) {
			return this.internalFindSymbol(node, referenceTypes);
		}
		return null;
	}

	public matchesSymbol(node: nodes.Node, symbol: Symbol): boolean {
		if (!node) {
			return false;
		}
		if (!node.matches(symbol.name)) {
			return false;
		}

		const referenceTypes = this.evaluateReferenceTypes(node);
		if (!referenceTypes || referenceTypes.indexOf(symbol.type) === -1) {
			return false;
		}

		const nodeSymbol = this.internalFindSymbol(node, referenceTypes);
		return nodeSymbol === symbol;
	}

}