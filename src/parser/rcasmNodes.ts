'use strict';

export enum NodeType {
	Undefined,
	Program,
	Comment,
	Instruction,
	Constant,
	Label,
	LabelRef,
	Register,
	Opcode
}

export enum ReferenceType {
	Label
}

export enum RegisterType {
	A,
	B,
	C,
	D,
	J,
	J1,
	J2,
	M,
	M1,
	M2,
	X,
	XY,
	Y
}

export enum OpcodeType {
	NOP,
	ADD, INC, AND, ORR, EOR, NOT, ROL, CMP,
	MOV, CLR, LDI, OPC,
	JMP, JSR, RTS,
	BNE, BEQ, BLT, BLE, BMI, BCS
}

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
	private issues: IMarker[] | undefined;

	private nodeType: NodeType | undefined;

	constructor(offset: number = -1, len: number = -1, nodeType?: NodeType) {
		this.parent = null;
		this.offset = offset;
		this.length = len;
		if (nodeType) {
			this.nodeType = nodeType;
		}
	}

	public set type(type: NodeType) {
		this.nodeType = type;
	}

	public get type(): NodeType {
		return this.nodeType || NodeType.Undefined;
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

	public adoptChild(node: Node, index: number = -1): Node {
		if (node.parent && node.parent.children) {
			const idx = node.parent.children.indexOf(node);
			if (idx >= 0) {
				node.parent.children.splice(idx, 1);
			}
		}
		node.parent = this;
		let children = this.children;
		if (!children) {
			children = this.children = [];
		}
		if (index !== -1) {
			children.splice(index, 0, node);
		} else {
			children.push(node);
		}
		return node;
	}

	public attachTo(parent: Node, index: number = -1): Node {
		if (parent) {
			parent.adoptChild(this, index);
		}
		return this;
	}

	public collectIssues(results: any[]): void {
		if (this.issues) {
			results.push.apply(results, this.issues);
		}
	}

	public addIssue(issue: IMarker): void {
		if (!this.issues) {
			this.issues = [];
		}
		this.issues.push(issue);
	}

	public isErroneous(recursive: boolean = false): boolean {
		if (this.issues && this.issues.length > 0) {
			return true;
		}
		return recursive && Array.isArray(this.children) && this.children.some(c => c.isErroneous(true));
	}

	public setNode(field: keyof this, node: Node | null, index: number = -1): boolean {
		if (node) {
			node.attachTo(this, index);
			(<any>this)[field] = node;
			return true;
		}
		return false;
	}

	public addChild(node: Node | null): node is Node {
		if (node) {
			if (!this.children) {
				this.children = [];
			}
			node.attachTo(this);
			this.updateOffsetAndLength(node);
			return true;
		}
		return false;
	}

	private updateOffsetAndLength(node: Node): void {
		if (node.offset < this.offset || this.offset === -1) {
			this.offset = node.offset;
		}
		const nodeEnd = node.end;
		if ((nodeEnd > this.end) || this.length === -1) {
			this.length = nodeEnd - this.offset;
		}
	}

	public getChildren(): Node[] {
		return this.children ? this.children.slice(0) : [];
	}

	public getParent(): Node | null {
		let result = this.parent;
		while (result instanceof Nodelist) {
			result = result.parent;
		}
		return result;
	}

}

export interface NodeConstructor {
	new(offset: number, len: number): Node;
}

export class Nodelist extends Node {
	private _nodeList: void; // workaround for https://github.com/Microsoft/TypeScript/issues/12083

	constructor(parent: Node, index: number = -1) {
		super(-1, -1);
		this.attachTo(parent, index);
		this.offset = -1;
		this.length = -1;
	}
}

export class Program extends Node {

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Program;
	}
}

export class Comment extends Node {

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Comment;
	}

}

export class Instruction extends Node {

	public label?: Label;
	public opcode?: Opcode;
	public comment?: Comment;


	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Instruction;
	}

	public setLabel(node: Label | null): node is Label {
		return this.setNode('label', node);
	}
	public getLabel(): Label | undefined {
		return this.label;
	}

	public setOpcode(node: Opcode | null): node is Opcode {
		return this.setNode('opcode', node);
	}
	public getOpcode(): Opcode | undefined {
		return this.opcode;
	}

	public setComment(node: Comment | null): node is Comment {
		return this.setNode('comment', node);
	}
	public getComment(): Comment | undefined {
		return this.opcode;
	}
}

export class Label extends Node {

	constructor(offset: number, length: number) {
		super(offset, length);
	}	

	public get type(): NodeType {
		return NodeType.Label;
	}

}

export class LabelRef extends Node {

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.LabelRef;
	}

}

export class Constant extends Node {

	public value: number = 0;

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Constant;
	}

}

export class Opcode extends Node {

	public opcode: OpcodeType = OpcodeType.NOP;
	public primaryParam?: Node;
	public secondaryParam?: Node;

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Opcode;
	}

	public setPrimaryParam(node: Node | null): node is Node {
		return this.setNode('primaryParam', node);
	}
	public getPrimaryParam(): Node | undefined {
		return this.primaryParam;
	}

	public setSecondaryParam(node: Node | null): node is Node {
		return this.setNode('secondaryParam', node);
	}
	public getSecondaryParam(): Node | undefined {
		return this.secondaryParam;
	}

}

export class Register extends Node {

	public register: RegisterType = RegisterType.A;

	constructor(offset: number, length: number) {
		super(offset, length);
	}

	public get type(): NodeType {
		return NodeType.Register;
	}

}

export interface IRule {
	id: string;
	message: string;
}

export enum Level {
	Ignore = 1,
	Warning = 2,
	Error = 4
}

export interface IMarker {
	getNode(): Node;
	getMessage(): string;
	getOffset(): number;
	getLength(): number;
	getRule(): IRule;
	getLevel(): Level;
}

export class Marker implements IMarker {

	private node: Node;
	private rule: IRule;
	private level: Level;
	private message: string;
	private offset: number;
	private length: number;

	constructor(node: Node, rule: IRule, level: Level, message?: string, offset: number = node.offset, length: number = node.length) {
		this.node = node;
		this.rule = rule;
		this.level = level;
		this.message = message || rule.message;
		this.offset = offset;
		this.length = length;
	}

	public getRule(): IRule {
		return this.rule;
	}

	public getLevel(): Level {
		return this.level;
	}

	public getOffset(): number {
		return this.offset;
	}

	public getLength(): number {
		return this.length;
	}

	public getNode(): Node {
		return this.node;
	}

	public getMessage(): string {
		return this.message;
	}
}

export interface IVisitor {
	visitNode: (node: Node) => boolean;
}

export interface IVisitorFunction {
	(node: Node): boolean;
}

export class ParseErrorCollector implements IVisitor {

	static entries(node: Node): IMarker[] {
		const visitor = new ParseErrorCollector();
		node.acceptVisitor(visitor);
		return visitor.entries;
	}

	public entries: IMarker[];

	constructor() {
		this.entries = [];
	}

	public visitNode(node: Node): boolean {

		if (node.isErroneous()) {
			node.collectIssues(this.entries);
		}
		return true;
	}
}