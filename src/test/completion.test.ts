import { testCompletionFor } from "./completionUtil";

suite('RCASM Completion', () => {

	test('Basic Completion', function (): any {

		testCompletionFor('|', {
			items: [{ label: 'ldi', resultText: 'ldi ${1:a},${2:0}' }, { label: 'add', resultText: 'add' }]
		});

		testCompletionFor(' |', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' }, { label: 'add', resultText: ' add' }]
		});

		testCompletionFor(' l|', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' }]
		});

		testCompletionFor('label: |', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }, { label: 'add', resultText: 'label: add' }]
		});
		
		testCompletionFor('label: l|', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }]
		});

		testCompletionFor(' ld| a,5', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0} a,5' }]
		});

		testCompletionFor('label: l| ; comment', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0} ; comment' }]
		});

	});
	
	test('Completion includes detail', () => {
		testCompletionFor('bc|', {
			items: [
				{ label: 'bcs', detail: 'Branch if Carry Set [GOTO]' }
			]
		});
	});

	test('Completion includes documentation', () => {
		testCompletionFor('ad|', {
			items: [
				{
					label: 'add',
					documentation: {
						kind: 'markdown',
						value:
							'Adds the contents of register B and C (B+C) placing the result in register A or D.\n\nSyntax: `[ a | d ]`'
					}
				}
			]
		});
	});
});
