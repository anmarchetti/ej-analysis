/*
 * return new array where item should be array from items in array
 * @props array - source array
 * @props chunk - the number of array elements in one array item
 *
 */

export function splitToChunksArray(array: any[], chunk: number) {
    const chunkArray = array.slice();
    const out: any[] = [];
    const n = Math.ceil(chunkArray.length / chunk);
    let i = 0;

    while (i < n) {
        out.push(chunkArray.splice(0, i == n - 1 && chunk < chunkArray.length ? chunkArray.length : chunk));
        i++;
    }

    return out;
}

/**
 * Split array into N arrays if it's possible.
 * The first N-1 arrays will be equal length, the last one will contain the remaining items.
 * (e.g. For [1,2,3,4,5,6,7], N=3, returns [[1,2,3], [4,5,6], [7]])
 * @param array - initial array
 * @param numberOfChunks - number of arrays
 * @return chunks - array of non-empty chunks (from the large chunk to small).
 */

export function splitArrayIntoNChunks(array: any[], numberOfChunks: number) {
    if (numberOfChunks < 1) {
        return array;
    }

    const chunks: any[] = [];
    const size = Math.ceil(array.length / numberOfChunks);
    let i = 0;

    while (i < array.length) {
        chunks.push(array.slice(i, (i += size)));
    }

    return chunks;
}
