declare global {
    interface Array<T> {
        myTMap<U>(
            callbackFn: (value: T, index: number, array: T[]) => U,
            thisArg?: unknown
        ): U[];
    }
}

Array.prototype.myTMap = function<T, U>(
    this: T[],
    callbackFn: (value: T, index: number, array: T[]) => U,
    thisArg? : unknown
): U[] {
    if(typeof callbackFn !== 'function') {
        throw new TypeError(`${callbackFn} is not a function`);
    }

    const result: U[] = new Array(this.length);

    for(let i=0; i<this.length; i++) {
        if(Object.hasOwn(this, i)) {
            result[i] = callbackFn.call(thisArg, this[i], i, this);
        }
    }

    return result;
}

export {}

// 1. Identity function
console.log([1, 2, 3].myTMap(x => x));
// Expected: [1, 2, 3]

// 2. Square each number
console.log([1, 2, 3, 4].myTMap(x => x * x));
// Expected: [1, 4, 9, 16]

// 3. Use of index
console.log(['a', 'b', 'c'].myTMap((_, i) => i));
// Expected: [0, 1, 2]

// 4. Empty array
console.log([].myTMap(x => x * 2));
// Expected: []

// 5. Sparse array handling (preserve holes)
const sparse = [1, , 3];
const result = sparse.myTMap(x => x);
console.log(result);
// Expected: [1, <1 empty item>, 3]
console.log(result.hasOwnProperty(1));
// Expected: false (hole preserved)