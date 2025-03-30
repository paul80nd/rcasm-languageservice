'use strict';

import { FoldingRangeKind } from 'vscode-languageserver-types';
import * as nodes from '../parser/rcasmNodes';
import { TextDocument, Range, FoldingRange } from "../rcasmLanguageTypes";

export function getFoldingRanges(document: TextDocument, program: nodes.Program, context: { rangeLimit?: number; }): FoldingRange[] {
	const ranges = computeFoldingRanges(document, program);
	return limitFoldingRanges(ranges, context);
}

function computeFoldingRanges(document: TextDocument, program: nodes.Program): FoldingRange[] {
	function getRange(node: nodes.Node) {
		return Range.create(document.positionAt(node.offset), document.positionAt(node.end));
	}

	const ranges: FoldingRange[] = [];

	program.accept(node => {
		if (node instanceof nodes.Scope) {
			const range = getRange(node);
			ranges.push({
				startLine: range.start.line,
				endLine: range.end.line,
				kind: 'region'
			});
			return false;
		} else if (node instanceof nodes.ForDirective) {
			const range = getRange(node);
			ranges.push({
				startLine: range.start.line,
				endLine: range.end.line,
				kind: 'region'
			});
			return false;
		}
		return true;
	});

	return ranges;
}

/**
 * - Sort regions
 * - Remove invalid regions (intersections)
 * - If limit exceeds, only return `rangeLimit` amount of ranges
 */
function limitFoldingRanges(ranges: FoldingRange[], context: { rangeLimit?: number; }): FoldingRange[] {
	const maxRanges = context && context.rangeLimit || Number.MAX_VALUE;

	const sortedRanges = ranges.sort((r1, r2) => {
		let diff = r1.startLine - r2.startLine;
		if (diff === 0) {
			diff = r1.endLine - r2.endLine;
		}
		return diff;
	});

	const validRanges: FoldingRange[] = [];
	let prevEndLine = -1;
	sortedRanges.forEach(r => {
		if (!(r.startLine < prevEndLine && prevEndLine < r.endLine)) {
			validRanges.push(r);
			prevEndLine = r.endLine;
		}
	});

	if (validRanges.length < maxRanges) {
		return validRanges;
	} else {
		return validRanges.slice(0, maxRanges);
	}
}