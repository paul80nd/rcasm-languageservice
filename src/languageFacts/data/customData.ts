import { RCASMDataV1 as RCASMDataV1 } from '../../rcasmLanguageTypes';

export const rcasmData: RCASMDataV1 = {
	"version": 1,
	"mnemonics": [
		{
			"name": "add",
			"class": "ALU", "cycles": 8,
			"summary": "Arithmetic Add",
			"description": "Adds the contents of register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero), S (sign) and C (carry) flags.",
			"synopsis": "{0} = B + C",
			"syntax": "add [<dest>{a|d}]"
		},
		{
			"name": "and",
			"class": "ALU", "cycles": 8,
			"summary": "Logic And",
			"description": "Performs a bitwise AND on register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags.",
			"synopsis": "{0} = B & C",
			"syntax": "and [<dest>{a|d}]"
		},
		{
			"name": "bcs",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Carry Set",
			"snippet": "bcs ${1:label}",
			"description": "Jumps to label if C is set (last ALU operation resulted in a carry).",
			"synopsis": "PC = {0} [if CY]",
			"syntax": "bcs <label>"
		},
		{
			"name": "beq",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Equal (zero)",
			"snippet": "beq ${1:label}",
			"description": "Jumps to label if Z flag is set (last ALU operation result was 0).",
			"synopsis": "PC = {0} [if Z]",
			"syntax": "beq <label>"
		},
		{
			"name": "ble",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Less Than or Equal (sign or zero)",
			"snippet": "ble ${1:label}",
			"description": "Jumps to label if S or Z is set (last ALU operation resulted in a zero or negative value).",
			"synopsis": "PC = {0} [if S or Z]",
			"syntax": "ble <label>"
		},
		{
			"name": "blt",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Less Than (sign set)",
			"snippet": "blt ${1:label}",
			"description": "Jumps to label if S is set (last ALU operation has most significant bit set / is negative). Synonym of `bmi`.",
			"synopsis": "PC = {0} [if S]",
			"syntax": "blt <label>"
		},
		{
			"name": "bmi",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Minus/Sign",
			"snippet": "bmi ${1:label}",
			"description": "Jumps to label if S is set (last ALU operation has most significant bit set / is negative). Synonym of `blt`.",
			"synopsis": "PC = {0} [if S]",
			"syntax": "bmi <label>"
		},
		{
			"name": "bne",
			"class": "GOTO", "cycles": 24,
			"summary": "Branch if Not Equal (not zero)",
			"snippet": "bne ${1:label}",
			"description": "Jumps to label if Z is not set (last ALU operation result was not 0).",
			"synopsis": "PC = {0} [if not Z]",
			"syntax": "bne <label>"
		},
		{
			"name": "clr",
			"class": "MOV8", "cycles": 8,
			"summary": "8-bit Register Clear",
			"description": "Clears (sets to 0) general purpose 8-bit register dst. This is the equivalent of `mov dst,dst`.",
			"synopsis": "{0} = 0",
			"syntax": "clr <dst>{a|b|c|d|m1|m2|x|y}",
			"variants": [
				{
					"class": "MOV16", "cycles": 10,
					"summary": "16-bit Register Clear",
					"description": "Clears (sets to 0) 16-bit register xy. This is the equivalent of `mov xy,xy`.",
					"syntax": "clr xy",
					"whenFirstParamIs": ["xy"]
				}
			]
		},
		{
			"name": "cmp",
			"class": "ALU", "cycles": 8,
			"summary": "Compare (Logic Xor)",
			"description": "Compares the values in register b and c setting condition flag Z (zero) if the values are the same. Overwrites dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags. Synonym of `eor`.",
			"synopsis": "{0} = B ^ C",
			"syntax": "cmp [<dest>{a|d}]"
		},
		{
			"name": "div",
			"class": "INCXY", "cycles": 24,
			"summary": "Integer Division ⚠️EXPERIMENTAL⚠️",
			"description": "Performs an integer division of register b by register c placing the quotient result in dst (a or d). If dst is not specified then register a is assumed.",
			"synopsis": "{0} = B / C",
			"syntax": "div [<dest>{a|d}]"
		},
		{
			"name": "dvr",
			"class": "INCXY", "cycles": 24,
			"summary": "Remainder Division ⚠️EXPERIMENTAL⚠️",
			"description": "Performs a further division of the last `div` or `mod` remainder by register c placing the quotient result in dst (a or d). Register B should be set to 0. If dst is not specified then register a is assumed.",
			"synopsis": "{0} = R / C",
			"syntax": "dvr [<dest>{a|d}]"
		},
		{
			"name": "eor",
			"class": "ALU", "cycles": 8,
			"summary": "Logic Xor",
			"description": "Performs a bitwise XOR (exlusive OR) on register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags. Synonym of `cmp`.",
			"synopsis": "{0} = B ^ C",
			"syntax": "eor [<dest>{a|d}]"
		},
		{
			"name": "inc",
			"class": "ALU", "cycles": 8,
			"summary": "Increment",
			"description": "Adds one to the contents of register b (register c is ignored) placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero), S (sign) and C (carry) flags.",
			"synopsis": "{0} = B + 1",
			"syntax": "inc [<dest>{a|d}]"
		},
		{
			"name": "hlt",
			"class": "MISC", "cycles": 10,
			"summary": "Halt",
			"description": "Halts execution of the program.",
			"synopsis": "HALT (PC = PC + 1)"
		},
		{
			"name": "hlr",
			"class": "MISC", "cycles": 10,
			"summary": "Halt and Reload",
			"description": "Halts execution of the program and sets the program counter to the value on the primary switches.",
			"synopsis": "HALT (PC = AS)"
		},
		{
			"name": "ixy",
			"class": "INCXY", "cycles": 14,
			"summary": "XY Increment",
			"description": "Increments the 16-bit value in the xy register by 1.",
			"synopsis": "XY = XY + 1"
		},
		{
			"name": "lds",
			"class": "MISC", "cycles": 10,
			"summary": "Load Register from Switches",
			"description": "Loads register dst (a or d) from the front panel switches",
			"synopsis": "{0} = DS",
			"snippet": "lds ${1:a}",
			"syntax": "lds <dst>{a|d}"
		},
		{
			"name": "ldr",
			"class": "LOAD", "cycles": 12,
			"summary": "Load Register from Memory",
			"snippet": "ldr ${1:b}",
			"description": "Loads register dst (a, b, c or d) with the byte in memory currently referenced by register m.",
			"synopsis": "{0} = (M)",
			"syntax": "ldr <dst>{a|b|c|d}"
		},
		{
			"name": "mod",
			"class": "INCXY", "cycles": 24,
			"summary": "Modulo Operation ⚠️EXPERIMENTAL⚠️",
			"description": "Performs an integer division of register b by register c placing the remainder result in dst (a or d). If dst is not specified then register a is assumed.",
			"synopsis": "{0} = B % C",
			"syntax": "mod [<dest>{a|d}]"
		},
		{
			"name": "mdr",
			"class": "INCXY", "cycles": 24,
			"summary": "Remainder Modulo ⚠️EXPERIMENTAL⚠️",
			"description": "Performs a further modulo of the last `div` or `mod` remainder by register c placing the remainder result in dst (a or d). Register B should be set to 0. If dst is not specified then register a is assumed.",
			"synopsis": "{0} = R % C",
			"syntax": "dvr [<dest>{a|d}]"
		},
		{
			"name": "jmp",
			"class": "GOTO", "cycles": 24,
			"summary": "Unconditional Jump",
			"snippet": "jmp ${1:label}",
			"description": "Unconditionally jumps to label (via register j).",
			"synopsis": "PC = {0}",
			"syntax": "jmp <label>"
		},
		{
			"name": "jsr",
			"class": "GOTO", "cycles": 24,
			"summary": "Jump Subroutine",
			"snippet": "jsr ${1:label}",
			"description": "Saves the address of the next instruction into register xy and then unconditionally jumps to label (via register j). Notionally behaves as a 'call subroutine' operation.",
			"synopsis": "XY = PC, PC = {0}",
			"syntax": "jsr <label>"
		},
		{
			"name": "rts",
			"class": "MOV16", "cycles": 10,
			"summary": "Return from Subroutine",
			"description": "Copies the value in register xy to the program counter pc. Notionally behaves as a 'return' operation to a previous jsr call.",
			"synopsis": "PC = XY"
		},
		{
			"name": "ldi",
			"class": "SETAB", "cycles": 8,
			"summary": "8-bit Load Immediate",
			"snippet": "ldi ${1:a},${2:0}",
			"description": "Loads an 8-bit constant value into dst (register a or b), value must be between -16 and 15.",
			"synopsis": "{0} = {1}",
			"syntax": "ldi <dst>{a|b} , <value>{-16,15}",
			"variants": [
				{
					"class": "GOTO", "cycles": 24,
					"summary": "16-bit Load Immediate",
					"description": "Loads a 16-bit constant value into dst (register m or j), value can be between 0x0000 and 0xFFFF.",
					"syntax": "ldi <dst>{m|j} , [ <value>{0x0000,0xFFFF} | <label> ]",
					"whenFirstParamIs": ["m", "j"]
				}
			]
		},
		{
			"name": "mov",
			"class": "MOV8", "cycles": 8,
			"summary": "8-bit Register to Register Copy",
			"snippet": "mov ${1:b},${2:a}",
			"description": "Copies a value from src to dst between any of the eight general purpose 8-bit registers. If dst and src are the same then dst will be set to 0.",
			"synopsis": "{0} = {1}",
			"syntax": "mov <dst>{a-d|m1|m2|x|y} , <src>{a-d|m1|m2|x|y}",
			"variants": [
				{
					"class": "MOV16", "cycles": 10,
					"summary": "16-bit Register to Register Copy",
					"description": "Copies a value between the 16-bit src registers (m, xy or j) and dst (xy or the program counter pc). If dst and src are the same then dst will be set to 0.",
					"syntax": "mov <dst>{xy|pc} , <src>{m|xy|j|as}",
					"whenFirstParamIs": ["xy", "pc"]
				}
			]
		},
		{
			"name": "not",
			"class": "ALU", "cycles": 8,
			"summary": "Logic Not",
			"description": "Performs a bitwise NOT on register b (register c is ignored) placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags.",
			"synopsis": "{0} = ~B",
			"syntax": "not [<dest>{a|d}]"
		},
		{
			"name": "orr",
			"class": "ALU", "cycles": 8,
			"summary": "Logic Or",
			"description": "Performs a bitwise OR on register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags.",
			"synopsis": "{0} = B | C",
			"syntax": "orr [<dest>{a|d}]"
		},
		{
			"name": "rol",
			"class": "ALU", "cycles": 8,
			"summary": "Bitwise Circular Shift Left",
			"description": "Performs a bitwise left-rotation on register b (register c is ignored) placing the result in dst (a or d). If dst is not specified then register a is assumed. Every bit shifts one place to the left with the left most bit rotated around to right. Affects Z (zero) and S (sign) flags.",
			"synopsis": "{0} = <<<B",
			"syntax": "rol [<dest>{a|d}]"

		},
		{
			"name": "str",
			"class": "STORE", "cycles": 12,
			"summary": "Store Register into Memory",
			"snippet": "str ${1:a}",
			"description": "Stores register src (a, b, c or d) into the byte of memory currently referenced by register m.",
			"synopsis": "(M) = {0}",
			"syntax": "str <src>{a|b|c|d}"
		}
	],
	"directives": [
		{
			"name": "!align",
			"summary": "Define Align",
			"description": "Writes 8-bit zeros into the output until the current location is a multiple of the given value.",
			"snippet": "!align ${1:8}",
			"syntax": "<value>{2,4,8,16...}"
		},
		{
			"name": "!byte",
			"summary": "Define Byte Data",
			"description": "Writes the given 8-bit values directly into the output starting from current location.",
			"snippet": "!byte ${1:0x00}",
			"syntax": "<value>{0x00,0xFF} [ ,...n ]"
		},
		{
			"name": "!word",
			"summary": "Define Word Data",
			"description": "Writes the given 16-bit values directly into the output starting from current location.",
			"snippet": "!word ${1:0x0000}",
			"syntax": "<value>{0x0000,0xFFFF} [ ,...n ]"
		},
		{
			"name": "!fill",
			"summary": "Define Fill Space",
			"description": "Writes the given 8-bit value n times directly into the output starting from current location.",
			"snippet": "!fill ${1:8},${2:0x00}",
			"syntax": "<count>{0,255}, <value>{0x00,0xFF}"
		},
		{
			"name": "!for",
			"summary": "Define For Loop",
			"description": "Defines a loop that will be expanded at assembly time. The loop will be expanded n times.",
			"snippet": "!for ${1:i} in range(${2:5}) {\n        ${3:add}\n}",
			"syntax": "<variable> in range([<start> ,] <end>)"
		},
		{
			"name": "!if",
			"summary": "Define Conditional Block",
			"description": "Defines a block of code that will be output at assembly time if the condition is met.",
			"snippet": "!if (${1:i == 0}) {\n        ${2:add}\n}",
			"syntax": "(<condition>)"
		},
		{
			"name": "!let",
			"summary": "Define Variable",
			"description": "Defines a variable that can be substituted into the output at assembly time.",
			"snippet": "!let ${1:i} = ${2:0}",
			"syntax": "<variable> = <value>"
		},
		{
			"name": "!error",
			"summary": "Throw Assembly Error",
			"description": "Intentionally raises an error at assembly time. Typically used within an !if directive to assert that a condition is met.",
			"snippet": "!if (${1:i == 0}) { !error \"${2:Error message}\" }",
			"syntax": "\"<message>\""
		}
	]
};