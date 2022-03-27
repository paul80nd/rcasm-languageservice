'use strict';

import * as assert from 'assert';
import { Scanner } from '../parser/rcasmScanner';
import { TokenType } from '../rcasmLanguageTypes';

suite('rcasm - Scanner', () => {

	function assertSingleToken(scan: Scanner, source: string, len: number, offset: number, text: string, ...tokenTypes: TokenType[]): void {
		scan.setSource(source);
		let token = scan.scan();
		assert.equal(token.len, len, "Token length incorrect");
		assert.equal(token.offset, offset, "Token offset incorrect");
		assert.equal(token.text, text, "Token text incorrect");
		assert.equal(token.type, tokenTypes[0], "Token type incorrect");
		for (let i = 1; i < tokenTypes.length; i++) {
			assert.equal(scan.scan().type, tokenTypes[i], source);
		}
		assert.equal(scan.scan().type, TokenType.EOF, source);
	}

	test('EOF', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '', 0, 0, '', TokenType.EOF);
	});

	test('Whitespace', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '    ', 0, 4, '', TokenType.EOF);
		assertSingleToken(scanner, '  \t  ', 0, 5, '', TokenType.EOF);
	});

	test('EOL', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '\n', 1, 0, '\n', TokenType.EOL);
		assertSingleToken(scanner, '\f', 1, 0, '\f', TokenType.EOL);
		assertSingleToken(scanner, '\r', 1, 0, '\r', TokenType.EOL);
		assertSingleToken(scanner, '\r\n', 2, 0, '\r\n', TokenType.EOL);
	});

	test('Comment', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, ';abcde', 6, 0, ';abcde', TokenType.Comment);
		assertSingleToken(scanner, ';abcde\n', 6, 0, ';abcde', TokenType.Comment, TokenType.EOL);
	});

	test('Integer', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '0', 1, 0, '0', TokenType.Integer);
		assertSingleToken(scanner, '123', 3, 0, '123', TokenType.Integer);
		assertSingleToken(scanner, '456789', 6, 0, '456789', TokenType.Integer);
		assertSingleToken(scanner, '0246', 4, 0, '0246', TokenType.Integer);
	});

	test('Binary', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '0b0101', 6, 0, '0b0101', TokenType.Binary);
		assertSingleToken(scanner, '0B10110', 7, 0, '0B10110', TokenType.Binary);
	});

	test('Hexadecimal', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, '0x0a3f', 6, 0, '0x0a3f', TokenType.Hexadecimal);
		assertSingleToken(scanner, '0XA3FE9', 7, 0, '0XA3FE9', TokenType.Hexadecimal);
	});

	test('Identifiers', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, 'action', 6, 0, 'action', TokenType.Identifier);
		assertSingleToken(scanner, 'ACTION', 6, 0, 'ACTION', TokenType.Identifier);
		assertSingleToken(scanner, 'PaRsE', 5, 0, 'PaRsE', TokenType.Identifier);
		assertSingleToken(scanner, 'x123', 4, 0, 'x123', TokenType.Identifier);
		assertSingleToken(scanner, 'abc.def', 7, 0, 'abc.def', TokenType.Identifier);
	});

	test('Single Char Tokens', function () {
		let scanner = new Scanner();
		assertSingleToken(scanner, ',', 1, 0, ',', TokenType.Comma);
		assertSingleToken(scanner, '+', 1, 0, '+', TokenType.Plus);
		assertSingleToken(scanner, '-', 1, 0, '-', TokenType.Minus);
	});

});

suite('rcasm - Scanner Sequences', () => {

	function assertTokenSequence(scan: Scanner, source: string, ...tokens: TokenType[]): void {
		scan.setSource(source);
		let token = scan.scan();
		let i = 0;
		while (tokens.length > i) {
			assert.equal(token.type, tokens[i]);
			token = scan.scan();
			i++;
		}
	}

	test('Statement Sequence', function () {
		let scanner = new Scanner();

		assertTokenSequence(scanner, 'mov a,b',
			TokenType.Identifier, TokenType.Identifier, TokenType.Comma, TokenType.Identifier);

		assertTokenSequence(scanner, 'ldi a,14 ;comment',
			TokenType.Identifier, TokenType.Identifier, TokenType.Comma, TokenType.Integer, TokenType.Comment);

		assertTokenSequence(scanner, 'label: ldi b, 0b1010 ;comment',
			TokenType.Label, 
			TokenType.Identifier, TokenType.Identifier, TokenType.Comma, TokenType.Binary, TokenType.Comment);

		assertTokenSequence(scanner, ';comment\n ldi m, 0x00FE',
			TokenType.Comment, TokenType.EOL,
			TokenType.Identifier, TokenType.Identifier, TokenType.Comma, TokenType.Hexadecimal);

	});

	test('Weird Literals and Oddities', function () {
		let scanner = new Scanner();

		assertTokenSequence(scanner, '0b0011986',TokenType.Binary, TokenType.Integer);
		assertTokenSequence(scanner, '98675ffee',TokenType.Integer, TokenType.Identifier);
		assertTokenSequence(scanner, '#',TokenType.InvalidChar);
	
	});

});
