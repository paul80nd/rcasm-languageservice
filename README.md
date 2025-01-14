# rcasm-languageservice

Relay Computer Assembly language service designed for use in either VSCode or the Monaco editor
(based on [microsoft/vscode-html-languageservice](https://github.com/microsoft/vscode-html-languageservice)).

Why?
----

The _rcasm-languageservice_ contains the language smarts behind the Relay Computer Assembly editing experience of Visual Studio Code and the Monaco editor.

- *doValidation* analyses an input string and returns syntax and lint errors.
 - *doComplete* provides completion proposals for a given location.
 - *doHover* provides hover information at a given location.
 - *findDefinition* finds the definition of the symbol at the given location.
 - *findReferences* finds all references to the symbol at the given location.
 - *findDocumentHighlights* finds all symbols connected to the given location.
 - *findDocumentSymbols* provides all symbols in the given document
 - *doCodeActions* evaluates code actions for the given location, typically to fix a problem.
 - *findColorSymbols* evaluates all color symbols in the given document
 - *doRename* renames all symbols connected to the given location.
  - *getFoldingRanges* returns folding ranges in the given document.

 For the complete API see [rcasmLanguageService.ts](./src/rcasmLanguageService.ts) and [rcasmLanguageTypes.ts](./src/rcasmLanguageTypes.ts) 

Installation
------------

    npm install --save @paul80nd/vscode-rcasm-languageservice

Development
-----------

- clone this repo, run `npm i`
- `npm test` to compile and run tests

How can I run and debug the service?

- open the folder in VSCode.
- set breakpoints, e.g. in `rcasmCompletion.ts`
- run the Unit tests from the run viewlet and wait until a breakpoint is hit.

License
-------

(MIT License)

Based on vscode-html-languageservice:
Copyright 2016-2023, Microsoft
