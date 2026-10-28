declare global {
    interface Array<T> {
        //No initial value
        myTReduce(
            callbackFn: (
                accumulator: T,
                currentValue: T,
                index: number,
                array: T[]
            ) => T,
        ): T;
        //Has initial value
        myTReduce<U>(
            callbackFn: (
                accumulator: U,
                currentValue: T,
                index: number,
                array: T[]
            ) => U,
            initialValue: U
        ): U;
    }
}

Array.prototype.myTReduce = function<T, U>(
    this: T[],
    callbackFn: (accumulator: U, currentValue: T, index: number, array: T[]) => U,
    initialValue?: U
) : U {
    if(typeof callbackFn !== 'function') {
        throw new TypeError(`${callbackFn} must be a function`);
    }

    const hasInitialValue = arguments.length >= 2;

    let accumulator : U;
    let startIndex = 0;

    if(hasInitialValue) {
        accumulator = initialValue as U;
    } else {
        //find first non-hole element
        while(startIndex < this.length && !Object.hasOwn(this, startIndex)) {
            startIndex++;
        }

        if(startIndex == this.length) {
            throw new TypeError("Reduce of empty array with no initial value");
        }

        accumulator = this[startIndex] as unknown as U;
        startIndex++;
    }

    for(let i=startIndex; i<this.length; i++) {
        if(Object.hasOwn(this, i)) {
            accumulator = callbackFn(accumulator, this[i], i, this);
        }
    }

    return accumulator;
}

export {}

// 1. Sum all numbers (no initial value)
console.log([1, 2, 3, 4].myTReduce((acc, val) => acc + val));
// Expected: 10

// 2. Product with initial value
console.log([2, 3, 4].myTReduce((acc, val) => acc * val, 2));
// Expected: 48

// 3. Concatenate strings
console.log(['a', 'b', 'c'].myTReduce((acc, val) => acc + val));
// Expected: 'abc'

// 4. Use of index (sum of values at even indices)
console.log([10, 20, 30, 40].myTReduce((acc, val, idx) => idx % 2 === 0 ? acc + val : acc, 0));
// Expected: 40

// 5. Empty array with initial value
console.log([].myTReduce((acc, val) => acc + val, 100));
// Expected: 100