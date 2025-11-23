# rcasm-languageservice

** ARCHIVED: Functionality replaced by <https://github.com/paul80nd/rcasm-lsp> **

Relay Computer Assembly language service designed for use in either VSCode or the Monaco editor
(based on [microsoft/vscode-css-languageservice](https://github.com/microsoft/vscode-css-languageservice)).

## Why?

The _rcasm-languageservice_ contains the language smarts behind the Relay Computer Assembly editing experience of Visual Studio Code and the Monaco editor.

- _doValidation_ analyses an input string and returns syntax and lint errors.
- _doComplete_ provides completion proposals for a given location.
- _doHover_ provides hover information at a given location.
- _findDefinition_ finds the definition of the symbol at the given location.
- _findReferences_ finds all references to the symbol at the given location.
- _findDocumentHighlights_ finds all symbols connected to the given location.
- _findDocumentSymbols_ provides all symbols in the given document
- _doCodeActions_ evaluates code actions for the given location, typically to fix a problem.
- _doRename_ renames all symbols connected to the given location.
- _prepareRename_ the range of the node that can be renamed.
- _getFoldingRanges* returns folding ranges in the given document.

 For the complete API see [rcasmLanguageService.ts](./src/rcasmLanguageService.ts) and [rcasmLanguageTypes.ts](./src/rcasmLanguageTypes.ts)

## Installation

    npm install --save @paul80nd/vscode-rcasm-languageservice

## Development

- clone this repo, run `npm i`
- `npm test` to compile and run tests

How can I run and debug the service?

- open the folder in VSCode.
- set breakpoints, e.g. in `rcasmCompletion.ts`
- run the Unit tests from the run viewlet and wait until a breakpoint is hit.

## License

(MIT License)

Based on vscode-css-languageservice:
Copyright 2016-2023, Microsoft
