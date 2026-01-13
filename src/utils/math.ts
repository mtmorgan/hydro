/**
 * Standard O(log N) Lower Bound implementation for 2026 projects. Thanks
 * Gemini!
 */
export const lowerBound = <T>(
	array: T[],
	target: number,
	keySelector: (item: T) => number
): number => {
	let low = 0;
	let high = array.length;
	while (low < high) {
		const mid = (low + high) >>> 1;
		if (keySelector(array[mid]) < target) low = mid + 1;
		else high = mid;
	}
	return low;
};
