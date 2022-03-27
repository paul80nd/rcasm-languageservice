import { TokenType } from '../rcasmLanguageTypes';

export interface IToken {
	type: TokenType;
	text: string;
	offset: number;
	len: number;
}

class MultiLineStream {

	private source: string;
	private len: number;
	private position: number;

	constructor(source: string, position: number) {
		this.source = source;
		this.len = source.length;
		this.position = position;
	}

	public substring(from: number, to: number = this.position): string {
		return this.source.substring(from, to);
	}

	public eos(): boolean {
		return this.len <= this.position;
	}

	public pos(): number {
		return this.position;
	}

	public advance(n: number): void {
		this.position += n;
	}

	public nextChar(): number {
		return this.source.charCodeAt(this.position++) || 0;
	}

	public peekChar(n: number = 0): number {
		return this.source.charCodeAt(this.position + n) || 0;
	}

	public advanceIfChar(ch: number): boolean {
		if (ch === this.source.charCodeAt(this.position)) {
			this.position++;
			return true;
		}
		return false;
	}

	public advanceWhileChar(condition: (ch: number) => boolean): number {
		const posNow = this.position;
		while (this.position < this.len && condition(this.source.charCodeAt(this.position))) {
			this.position++;
		}
		return this.position - posNow;
	}
}

const _0 = '0'.charCodeAt(0);
const _1 = '1'.charCodeAt(0);
const _9 = '9'.charCodeAt(0);
const _a = 'a'.charCodeAt(0);
const _A = 'A'.charCodeAt(0);
const _b = 'b'.charCodeAt(0);
const _B = 'B'.charCodeAt(0);
const _f = 'f'.charCodeAt(0);
const _F = 'F'.charCodeAt(0);
const _x = 'x'.charCodeAt(0);
const _X = 'X'.charCodeAt(0);
const _z = 'z'.charCodeAt(0);
const _Z = 'Z'.charCodeAt(0);
const _NWL = '\n'.charCodeAt(0);
const _CAR = '\r'.charCodeAt(0);
const _LFD = '\f'.charCodeAt(0);
const _WSP = ' '.charCodeAt(0);
const _TAB = '\t'.charCodeAt(0);
const _MIN = '-'.charCodeAt(0);
const _PLS = '+'.charCodeAt(0);
const _CMA = ','.charCodeAt(0);
const _COL = ':'.charCodeAt(0);
const _DOT = '.'.charCodeAt(0);
const _SEM = ';'.charCodeAt(0);

const staticTokenTable: { [code: number]: TokenType; } = {};
staticTokenTable[_CMA] = TokenType.Comma;
staticTokenTable[_MIN] = TokenType.Minus;
staticTokenTable[_PLS] = TokenType.Plus;

export class Scanner {

	public stream: MultiLineStream = new MultiLineStream('', 0);
	public ignoreComment = true;
	public ignoreWhitespace = true;

	public setSource(input: string, initialOffset = 0): void {
		this.stream = new MultiLineStream(input, initialOffset);
	}

	public finishToken(offset: number, type: TokenType, text?: string): IToken {
		return {
			offset: offset,
			len: this.stream.pos() - offset,
			type: type,
			text: text || this.stream.substring(offset)
		};
	}

	public scan(): IToken {

		// processes all leading whitespace
		this._whitespace();
		const offset = this.stream.pos();

		// End of file/input
		if (this.stream.eos()) {
			return this.finishToken(offset, TokenType.EOF);
		}

		return this.scanNext(offset);
	}

	protected scanNext(offset: number): IToken {

		let content: string[] = [];

		// EOL
		if (this._newline()) {
			return this.finishToken(offset, TokenType.EOL);
		}

		// Comment
		if (this._comment()) {
			return this.finishToken(offset, TokenType.Comment);
		}

		// single character tokens
		const tokenType = <TokenType>staticTokenTable[this.stream.peekChar()];
		if (typeof tokenType !== 'undefined') {
			this.stream.advance(1);
			return this.finishToken(offset, tokenType);
		}

		// Identifier [a-zA-Z] [a-zA-Z0-9.]* (or label with :)
		if (this._identifier()) {
			if (this.stream.peekChar() === _COL) {
				const labelToken = this.finishToken(offset, TokenType.Label);
				this.stream.advance(1);		// Ignore ':' - only used to denote label
				return labelToken;
			}
			return this.finishToken(offset, TokenType.Identifier);
		}

		// Binary '0b' [0-1]+
		if (this._binary()) {
			return this.finishToken(offset, TokenType.Binary);
		}

		// Hexadecimal '0x' [0-9a-fA-F]+
		if (this._hexadecimal()) {
			return this.finishToken(offset, TokenType.Hexadecimal);
		}

		// Integer [0-9]+
		if (this._number()) {
			return this.finishToken(offset, TokenType.Integer);
		}

		// Unknown char
		this.stream.nextChar();
		return this.finishToken(offset, TokenType.InvalidChar);
	}

	private _comment(): boolean {
		// COMMENT: ';' ~ [\r\n]* -> skip;
		if (this.stream.advanceIfChar(_SEM)) {
			this.stream.advanceWhileChar((ch) => ch !== _CAR && ch !== _LFD && ch !== _NWL);
			return true;
		}

		return false;
	}

	private _identifier(): boolean {
		if (this._identFirstChar()) {
			while (this._identChar()) { }
			return true;
		}

		return false;
	}

	private _identFirstChar(): boolean {
		const ch = this.stream.peekChar();
		if (ch >= _a && ch <= _z || // a-z
			ch >= _A && ch <= _Z) { // A-Z
			this.stream.advance(1);
			return true;
		}
		return false;
	}

	private _identChar(): boolean {
		const ch = this.stream.peekChar();
		if (ch === _DOT || // .
			ch >= _a && ch <= _z || // a-z
			ch >= _A && ch <= _Z || // A-Z
			ch >= _0 && ch <= _9) { // 0/9
			this.stream.advance(1);
			return true;
		}
		return false;
	}

	private _binary(): boolean {
		const ch1 = this.stream.peekChar(0);
		const ch2 = this.stream.peekChar(1);
		if (ch1 === _0 && (ch2 === _B || ch2 === _b)) {
			this.stream.advance(2);
			this.stream.advanceWhileChar((ch) => {
				return ch === _0 || ch === _1;
			});
			return true;
		}

		return false;
	}

	private _hexadecimal(): boolean {
		const ch1 = this.stream.peekChar(0);
		const ch2 = this.stream.peekChar(1);
		if (ch1 === _0 && (ch2 === _X || ch2 === _x)) {
			this.stream.advance(2);
			let ch = this.stream.peekChar();
			while (ch >= _0 && ch <= _9 || ch >= _a && ch <= _f || ch >= _A && ch <= _F) {
				this.stream.advance(1);
				ch = this.stream.peekChar();
			}
			return true;
		}

		return false;
	}

	private _number(): boolean {
		let ch: number;
		ch = this.stream.peekChar();
		if (ch >= _0 && ch <= _9) {
			this.stream.advance(1);
			this.stream.advanceWhileChar((ch) => {
				return ch >= _0 && ch <= _9;
			});
			return true;
		}
		return false;
	}

	private _newline(): boolean {
		const ch = this.stream.peekChar();
		switch (ch) {
			case _CAR:
			case _LFD:
			case _NWL:
				this.stream.advance(1);
				if (ch === _CAR) {
					this.stream.advanceIfChar(_NWL);
				}
				return true;
		}

		return false;
	}

	private _whitespace(): boolean {
		const n = this.stream.advanceWhileChar((ch) => {
			return ch === _WSP || ch === _TAB;
		});
		return n > 0;
	}
}