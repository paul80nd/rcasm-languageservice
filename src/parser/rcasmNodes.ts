'use strict';

import * as rcasm from '@paul80nd/rcasm';

export enum NodeType {
	Program,
	Line,
	Label,
	LabelRef,
	Instruction,
	Literal,
	Register,
	SetPC,
	Expr
}

export enum ReferenceType {
	Label
}

// export enum RegisterType {
// 	A,
// 	B,
// 	C,
// 	D,
// 	J,
// 	J1,
// 	J2,
// 	M,
// 	M1,
// 	M2,
// 	X,
// 	XY,
// 	Y
// }

// export enum OpcodeType {
// 	NOP,
// 	ADD, INC, AND, ORR, EOR, NOT, ROL, CMP,
// 	MOV, CLR, LDI, OPC,
// 	JMP, JSR, RTS,
// 	BNE, BEQ, BLT, BLE, BMI, BCS
// }

export function getNodeAtOffset(node: Node, offset: number): Node | null {

	let candidate: Node | null = null;
	if (!node || offset < node.offset || offset > node.end) {
		return null;
	}

	// Find the shortest node at the position
	node.accept((node) => {
		if (node.offset === -1 && node.length === -1) {
			return true;
		}
		if (node.offset <= offset && node.end >= offset) {
			if (!candidate) {
				candidate = node;
			} else if (node.length <= candidate.length) {
				candidate = node;
			}
			return true;
		}
		return false;
	});
	return candidate;
}

export function getNodePath(node: Node, offset: number): Node[] {

	let candidate = getNodeAtOffset(node, offset);
	const path: Node[] = [];

	while (candidate) {
		path.unshift(candidate);
		candidate = candidate.parent;
	}

	return path;
}

export interface ITextProvider {
	(offset: number, length: number): string;
}

export class Node {

	public parent: Node | null;

	public offset: number;
	public length: number;
	public get end() { return this.offset + this.length; }

	public textProvider: ITextProvider | undefined; // only set on the root node

	private children: Node[] | undefined;
	// 	private issues: IMarker[] | undefined;

	constructor(rnode: rcasm.Node | undefined, private nodeType: NodeType) {
		this.parent = null;
		this.offset = rnode?.loc.start.offset ?? 0;
		this.length = (rnode?.loc.end.offset ?? 0) - this.offset;
	}

	// 	public set type(type: NodeType) {
	// 		this.nodeType = type;
	// 	}

	public get type(): NodeType {
		return this.nodeType;
	}

	private getTextProvider(): ITextProvider {
		let node: Node | null = this;
		while (node && !node.textProvider) {
			node = node.parent;
		}
		if (node) {
			return node.textProvider!;
		}
		return () => { return 'unknown'; };
	}

	public getText(): string {
		return this.getTextProvider()(this.offset, this.length);
	}

	public matches(str: string): boolean {
		return this.length === str.length && this.getTextProvider()(this.offset, this.length) === str;
	}

	public accept(visitor: IVisitorFunction): void {
		if (visitor(this) && this.children) {
			for (const child of this.children) {
				child.accept(visitor);
			}
		}
	}

	public acceptVisitor(visitor: IVisitor): void {
		this.accept(visitor.visitNode.bind(visitor));
	}

	protected adoptChild(node: Node): Node {
		// 		if (node.parent && node.parent.children) {
		// 			const idx = node.parent.children.indexOf(node);
		// 			if (idx >= 0) {
		// 				node.parent.children.splice(idx, 1);
		// 			}
		// 		}
		node.parent = this;
		let children = this.children;
		if (!children) {
			children = this.children = [];
		}
		children.push(node);
		return node;
	}

	// 	public attachTo(parent: Node, index: number = -1): Node {
	// 		if (parent) {
	// 			parent.adoptChild(this, index);
	// 		}
	// 		return this;
	// 	}

	// 	public collectIssues(results: any[]): void {
	// 		if (this.issues) {
	// 			results.push.apply(results, this.issues);
	// 		}
	// 	}

	// 	public addIssue(issue: IMarker): void {
	// 		if (!this.issues) {
	// 			this.issues = [];
	// 		}
	// 		this.issues.push(issue);
	// 	}

	// 	public isErroneous(recursive: boolean = false): boolean {
	// 		if (this.issues && this.issues.length > 0) {
	// 			return true;
	// 		}
	// 		return recursive && Array.isArray(this.children) && this.children.some(c => c.isErroneous(true));
	// 	}

	// 	public setNode(field: keyof this, node: Node | null, index: number = -1): boolean {
	// 		if (node) {
	// 			node.attachTo(this, index);
	// 			(<any>this)[field] = node;
	// 			return true;
	// 		}
	// 		return false;
	// 	}

	// 	public addChild(node: Node | null): node is Node {
	// 		if (node) {
	// 			if (!this.children) {
	// 				this.children = [];
	// 			}
	// 			node.attachTo(this);
	// 			this.updateOffsetAndLength(node);
	// 			return true;
	// 		}
	// 		return false;
	// 	}

	// 	private updateOffsetAndLength(node: Node): void {
	// 		if (node.offset < this.offset || this.offset === -1) {
	// 			this.offset = node.offset;
	// 		}
	// 		const nodeEnd = node.end;
	// 		if ((nodeEnd > this.end) || this.length === -1) {
	// 			this.length = nodeEnd - this.offset;
	// 		}
	// 	}

	// 	public getChildren(): Node[] {
	// 		return this.children ? this.children.slice(0) : [];
	// 	}

	// 	public getParent(): Node | null {
	// 		let result = this.parent;
	// 		while (result instanceof Nodelist) {
	// 			result = result.parent;
	// 		}
	// 		return result;
	// 	}

	// }

	// export interface NodeConstructor {
	// 	new(offset: number, len: number): Node;
	// }

	// export class Nodelist extends Node {
	// 	constructor(parent: Node, index: number = -1) {
	// 		super(-1, -1);
	// 		this.attachTo(parent, index);
	// 		this.offset = -1;
	// 		this.length = -1;
	// 	}
}

export function adapt(p: rcasm.Program): Program {
	return new Program(p);
}

export class Program extends Node {
	constructor(p: rcasm.Program | undefined) {
		super(p, NodeType.Program);
		p?.lines?.forEach(l => this.adoptChild(new Line(l)));
	}
}

class Line extends Node {
	constructor(l: rcasm.Line) {
		super(l, NodeType.Line);
		if (l.label) { this.adoptChild(new Label(l.label)); }
		if (l.stmt) {
			switch (l.stmt.type) {
				case 'insn':
					this.adoptChild(new Instruction(l.stmt));
					break;
				case 'setpc':
					this.adoptChild(new SetPC(l.stmt));
			}
		}
	}
}

export class Label extends Node {
	constructor(l: rcasm.Label) {
		super(l, NodeType.Label);
		this.length--;	// ignore colon
	}
}

//#region Pseudos

export class SetPC extends Node {

	public pcExpr: Expr;

	constructor(spc: rcasm.StmtSetPC) {
		super(spc, NodeType.SetPC);
		this.pcExpr = this.adoptChild(new Expr(spc.pc));
	}
}

export class Expr extends Node {
	constructor(e: rcasm.Expr) {
		super(e, NodeType.Expr);
	}
}

//#endregion

//#region Instructions 

export class Instruction extends Node {

	public mnemonic: string;
	public p1?: Operand;
	public p2?: Operand;

	constructor(si: rcasm.StmtInsn) {
		super(si, NodeType.Instruction);
		const addParam = (p: rcasm.Expr): Node | undefined => {
			switch (p.type) {
				case 'literal':
					return this.adoptChild(new Literal(p));
				case 'register':
					return this.adoptChild(new Register(p));
				case 'qualified-ident':
					return this.adoptChild(new LabelRef(p));
				default:
					return undefined;
			}
		};
		this.mnemonic = si.mnemonic.toLowerCase();
		if (si.p1) { this.p1 = addParam(si.p1); }
		if (si.p2) { this.p2 = addParam(si.p2); }
	}
}

export type Operand = LabelRef | Literal | Register;

export class LabelRef extends Node {
	constructor(sqi: rcasm.ScopeQualifiedIdent) {
		super(sqi, NodeType.LabelRef);
	}
}

export class Literal extends Node {

	public value: number | string;

	constructor(l: rcasm.Literal) {
		super(l, NodeType.Literal);
		this.value = l.lit;
	}
}

export class Register extends Node {

	public value: string;

	constructor(r: rcasm.Register) {
		super(r, NodeType.Register);
		this.value = r.value.toUpperCase();
	}
}

//#endregion 

export interface IVisitor {
	visitNode: (node: Node) => boolean;
}

export interface IVisitorFunction {
	(node: Node): boolean;
}