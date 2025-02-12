import { RCASMDataV1 as RCASMDataV1 } from '../../rcasmLanguageTypes';

export const rcasmData: RCASMDataV1 = {
	"version": 1,
	"mnemonics": [
		{
			"name": "add",
			"class": "ALU",
			"summary": "Arithmetic Add",
			"description": "Adds the contents of register B and C (B+C) placing the result in register A or D.",
			"synopsis": "{0} = B + C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "and",
			"class": "ALU",
			"summary": "Logic And",
			"description": "Performs a bitwise AND operation on register B and C (B&C) placing the result in register A or D.",
			"synopsis": "{0} = B & C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "bcs",
			"class": "GOTO",
			"summary": "Branch if Carry Set",
			"snippet": "bcs ${1:label}",
			"description": "Jumps to the given address if the carry flag is set.",
			"synopsis": "PC = {0} [if CY]",
			"syntax": "<label>"
		},
		{
			"name": "beq",
			"class": "GOTO",
			"summary": "Branch if Equal/Zero",
			"snippet": "beq ${1:label}",
			"description": "Jumps to the given address if the zero flag is set (equal).",
			"synopsis": "PC = {0} [if Z]",
			"syntax": "<label>"
		},
		{
			"name": "ble",
			"class": "GOTO",
			"summary": "Branch if Less Than or Equal (Sign+Zero)",
			"snippet": "ble ${1:label}",
			"description": "Jumps to the given address if the sign or zero flag is set (less than or equal).",
			"synopsis": "PC = {0} [if S or Z]",
			"syntax": "<label>"
		},
		{
			"name": "blt",
			"class": "GOTO",
			"summary": "Branch if Less Than (Sign)",
			"snippet": "blt ${1:label}",
			"description": "Jumps to the given address if the sign flag is set (less than).",
			"synopsis": "PC = {0} [if S]",
			"syntax": "<label>"
		},
		{
			"name": "bmi",
			"class": "GOTO",
			"summary": "Branch if Minus/Sign",
			"snippet": "bmi ${1:label}",
			"description": "Jumps to the given address if the sign flag is set (negative).",
			"synopsis": "PC = {0} [if S]",
			"syntax": "<label>"
		},
		{
			"name": "bne",
			"class": "GOTO",
			"summary": "Branch if Not Equal/Zero",
			"snippet": "bne ${1:label}",
			"description": "Jumps to the given address if the zero flag is not set (not equal).",
			"synopsis": "PC = {0} [if not Z]",
			"syntax": "<label>"
		},
		{
			"name": "clr",
			"class": "MOV8|MOV16",
			"summary": "Zero Value",
			"description": "Clears the content (=0) of a given register.",
			"synopsis": "{0} = 0",
			"syntax": "<target>{a,d|m1|m2|x|y|xy}"
		},
		{
			"name": "cmp",
			"class": "ALU",
			"summary": "Compare (Logic Xor)",
			"description": "Compares the values in register B and C setting the zero flag if the same (affects register A or D) (equivalent to eor).",
			"synopsis": "{0} = B ^ C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "eor",
			"class": "ALU",
			"summary": "Logic Xor",
			"description": "Performs a bitwise XOR operation on register B and C (B^C) placing the result in register A or D.",
			"synopsis": "{0} = B ^ C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "inc",
			"class": "ALU",
			"summary": "Increment",
			"description": "Increments contents of register B placing the result in register A or D",
			"synopsis": "{0} = B + 1",
			"syntax": "[ a | d ]"
		},
		{
			"name": "hlt",
			"class": "MISC",
			"summary": "Halt",
			"description": "Halts execution of the program",
			"synopsis": "HALT (PC = PC + 1)",
			"syntax": "<label>"
		},
		{
			"name": "hlr",
			"class": "MISC",
			"summary": "Halt and Reload",
			"description": "Halts execution of the program and sets the program counter from the address switches",
			"synopsis": "HALT (PC = AS)",
			"syntax": "<label>"
		},
		{
			"name": "ixy",
			"class": "INCXY",
			"summary": "Increments contents of 16-bit register XY",
			"synopsis": "XY = XY + 1"
		},
		{
			"name": "lds",
			"class": "MISC",
			"summary": "Load Switches",
			"description": "Takes the 8-bit value on the main switches and loads register A or D.",
			"synopsis": "{0} = DS",
			"syntax": "[ a | d ]"
		},
		{
			"name": "ldr",
			"class": "LOAD",
			"summary": "Load Register from Memory",
			"snippet": "ldr ${1:a}",
			"description": "Loads the contents of memory at the address in register M into register A-D.",
			"synopsis": "{0} = (M)",
			"syntax": "[ a | b | c | d ]"
		},
		{
			"name": "jmp",
			"class": "GOTO",
			"summary": "Jump to Label",
			"snippet": "jmp ${1:label}",
			"description": "Unconditionally jumps to the given address.",
			"synopsis": "PC = {0}",
			"syntax": "<label>"
		},
		{
			"name": "jsr",
			"class": "GOTO",
			"summary": "Call Subroutine (Jump and Link)",
			"snippet": "jsr ${1:label}",
			"description": "Calls the subroutine at the given address.",
			"synopsis": "XY = PC, PC = {0}",
			"syntax": "<label>"
		},
		{
			"name": "rts",
			"class": "MOV16",
			"summary": "Return from Subroutine",
			"description": "Jumps back from a jsr call.",
			"synopsis": "PC = XY"
		},
		{
			"name": "ldi",
			"class": "SETAB|GOTO",
			"summary": "Load Immediate",
			"snippet": "ldi ${1:a},${2:0}",
			"description": "Loads an 8-bit value in to register A/B or a 16-bit value in to register M/J.",
			"synopsis": "{0} = {1}",
			"syntax": "[ <target>{a|b} , <value>{-16,15} ] | [ <target>{m|j} , [ <value>{0x0000,0xFFFF} | <label> ] ]"
		},
		{
			"name": "mov",
			"class": "MOV8|MOV16",
			"summary": "Copy Register to Register",
			"snippet": "mov ${1:b},${2:a}",
			"description": "Copies the content of one register to another.",
			"synopsis": "{0} = {1}",
			"syntax": "[ <destination>{a,d|m1|m2|x|y} , <source>{a,d|m1|m2|x|y} | <destination>{xy|pc} , <source>{m|xy|j|as} ]"
		},
		{
			"name": "not",
			"class": "ALU",
			"summary": "Logic Not",
			"description": "Performs a bitwise NOT operation on register B (~B) placing the result in register A or D.",
			"synopsis": "{0} = ~B",
			"syntax": "[ a | d ]"
		},
		{
			"name": "opc",
			"class": "PSEUDO",
			"summary": "Literal Opcode",
			"snippet": "opc ${1:opcode}",
			"description": "Performs the given machine opcode directly.",
			"syntax": "[ <opcode>{0x00,0xFF} | <opcode>{0b00000000,0b11111111} ]"
		},
		{
			"name": "orr",
			"class": "ALU",
			"summary": "Logic Or",
			"description": "Performs a bitwise OR operation on register B and C (B|C) placing the result in register A or D.",
			"synopsis": "{0} = B | C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "rol",
			"class": "ALU",
			"summary": "Bitwise Circular Shift Left",
			"description": "Performs a bitwise left rotation on register B (<<B) placing the result in register A or D.",
			"synopsis": "{0} = <<B",
			"syntax": "[ a | d ]"
		},
		{
			"name": "str",
			"class": "STORE",
			"summary": "Store Register into Memory",
			"snippet": "str ${1:a}",
			"description": "Stores the contents register A-D into memory at the address in register M.",
			"synopsis": "(M) = {0}",
			"syntax": "[ a | b | c | d ]"
		},
		{
			"name": "org",
			"class": "PSEUDO",
			"summary": "Set Program Counter",
			"description": "Sets the program counter to the given address such that the following instructions start from that location.",
			"synopsis": "PC = {0}",
			"syntax": "<value>{0x0000,0xFFFF}"
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
		}
	]
};