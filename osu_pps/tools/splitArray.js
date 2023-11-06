module.exports = (arr, len = null) => {
    if (typeof len === 'undefined' || len === null || len === 0) {
        return arr;
    }

    if (typeof arr !== 'object'){
        throw new Error('split_array > array is not the object');
    }

    let chunks = [];
    let i = 0;

    while (i < arr.length) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}
