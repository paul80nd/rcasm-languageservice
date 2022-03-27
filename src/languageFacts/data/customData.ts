import { RCASMDataV1 as RCASMDataV1 } from '../../rcasmLanguageTypes';

export const rcasmData: RCASMDataV1 = {
	"version": 1,
	"mnemonics": [
		{
			"name": "add",
			"summary": "Arithmetic Add [ALU]",
			"description": "Adds the contents of register B and C (B+C) placing the result in register A or D.",
			"synopsis": "{0} = B + C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "and",
			"summary": "Logic And [ALU]",
			"description": "Performs a bitwise AND operation on register B and C (B&C) placing the result in register A or D.",
			"synopsis": "{0} = B & C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "bcs",
			"summary": "Branch if Carry Set [GOTO]",
			"snippet": "bcs ${1:label}",
			"description": "Jumps to the given address if the carry flag is set.",
			"synopsis": "PC = {0} [if CY]",
			"syntax": "<label>"
		},
		{
			"name": "beq",
			"summary": "Branch if Equal/Zero [GOTO]",
			"snippet": "beq ${1:label}",
			"description": "Jumps to the given address if the zero flag is set (equal).",
			"synopsis": "PC = {0} [if Z]",
			"syntax": "<label>"
		},
		{
			"name": "ble",
			"summary": "Branch if Less Than or Equal (Sign+Zero) [GOTO]",
			"snippet": "ble ${1:label}",
			"description": "Jumps to the given address if the sign or zero flag is set (less than or equal).",
			"synopsis": "PC = {0} [if S or Z]",
			"syntax": "<label>"
		},
		{
			"name": "blt",
			"summary": "Branch if Less Than (Sign) [GOTO]",
			"snippet": "blt ${1:label}",
			"description": "Jumps to the given address if the sign flag is set (less than).",
			"synopsis": "PC = {0} [if S]",
			"syntax": "<label>"
		},
		{
			"name": "bmi",
			"summary": "Branch if Minus/Sign [GOTO]",
			"snippet": "bmi ${1:label}",
			"description": "Jumps to the given address if the sign flag is set (negative).",
			"synopsis": "PC = {0} [if S]",
			"syntax": "<label>"
		},
		{
			"name": "bne",
			"summary": "Branch if Not Equal/Zero [GOTO]",
			"snippet": "bne ${1:label}",
			"description": "Jumps to the given address if the zero flag is not set (not equal).",
			"synopsis": "PC = {0} [if not Z]",
			"syntax": "<label>"
		},
		{
			"name": "clr",
			"summary": "Zero Value [MOV8]",
			"description": "Clears the content (=0) of a given 8-bit register.",
			"synopsis": "{0} = 0",
			"syntax": "<target>{a,d}"
		},
		{
			"name": "cmp",
			"summary": "Compare (Logic Xor) [ALU]",
			"description": "Compares the values in register B and C setting the zero flag if the same (affects register A or D) (equivalent to eor).",
			"synopsis": "{0} = B != C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "eor",
			"summary": "Logic Xor [ALU]",
			"description": "Performs a bitwise XOR operation on register B and C (B^C) placing the result in register A or D.",
			"synopsis": "{0} = B ^ C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "inc",
			"summary": "Increment [ALU]",
			"description": "Increments contents of register B placing the result in register A or D",
			"synopsis": "{0} = B + 1",
			"syntax": "[ a | d ]"
		},
		{
			"name": "jmp",
			"summary": "Jump to Label [GOTO]",
			"snippet": "jmp ${1:label}",
			"description": "Unconditionally jumps to the given address.",
			"synopsis": "PC = {0}",
			"syntax": "<label>"
		},
		{
			"name": "jsr",
			"summary": "Call Subroutine (Jump and Link) [GOTO]",
			"snippet": "jsr ${1:label}",
			"description": "Calls the subroutine at the given address.",
			"synopsis": "XY = PC, PC = {0}",
			"syntax": "<label>"
		},
		{
			"name": "ldi",
			"summary": "Load Immediate [SETAB]",
			"snippet": "ldi ${1:a},${2:0}",
			"description": "Loads an 8-bit value in to register A/B or a 16-bit value in to register M/J.",
			"synopsis": "{0} = {1}",
			"syntax": "[ <target>{a|b} , <value>{-16,15} ] | [ <target>{m|j} , [ <value>{0x0000,0xFFFF} | <label> ] ]"
		},
		{
			"name": "mov",
			"summary": "Copy Register to Register [MOV8]",
			"snippet": "mov ${1:b},${2:a}",
			"description": "Copies the content of one 8-bit register to another.",
			"synopsis": "{0} = {1}",
			"syntax": "<destination>{a,d} , <source>{a,d}"
		},
		{
			"name": "not",
			"summary": "Logic Not [ALU]",
			"description": "Performs a bitwise NOT operation on register B (~B) placing the result in register A or D.",
			"synopsis": "{0} = ~B",
			"syntax": "[ a | d ]"
		},
		{
			"name": "opc",
			"summary": "Literal Opcode",
			"snippet": "opc ${1:opcode}",
			"description": "Performs the given machine opcode directly.",
			"syntax": "[ <opcode>{0x00,0xFF} | <opcode>{0b00000000,0b11111111} ]"
		},
		{
			"name": "orr",
			"summary": "Logic Or [ALU]",
			"description": "Performs a bitwise OR operation on register B and C (B|C) placing the result in register A or D.",
			"synopsis": "{0} = B | C",
			"syntax": "[ a | d ]"
		},
		{
			"name": "rol",
			"summary": "Bitwise Circular Shift Left [ALU]",
			"description": "Performs a bitwise left rotation on register B (<<B) placing the result in register A or D.",
			"synopsis": "{0} = <<B",
			"syntax": "[ a | d ]"
		},
	]
};