Array.prototype.myReduce = function(callbackFunc, initialValue) {
    if(typeof callbackFunc !== 'function') {
        throw new TypeError(`${callbackFunc} must be a function`);
    }

    const hasInitialValue = arguments.length >= 2;

    let accumulator;
    let startIndex = 0;

    if(hasInitialValue) {
        accumulator = initialValue;
    } else {
        while(startIndex < this.length && !Object.hasOwn(this, startIndex)) {
            startIndex++;
        }

        if(startIndex === this.length) {
            throw new TypeError('Reduce of empty array with no initial value');
        }

        accumulator = this[startIndex];
        startIndex++;
    }

    for(let i = startIndex;  i < this.length; i++) {
        if(Object.hasOwn(this, i)) {
            accumulator = callbackFunc(accumulator, this[i], i, this);
        }
    }

    return accumulator;
}

// 1. Sum all numbers (no initial value)
console.log([1, 2, 3, 4].myReduce((acc, val) => acc + val));
// Expected: 10

// 2. Product with initial value
console.log([2, 3, 4].myReduce((acc, val) => acc * val, 2));
// Expected: 48

// 3. Concatenate strings
console.log(['a', 'b', 'c'].myReduce((acc, val) => acc + val));
// Expected: 'abc'

// 4. Use of index (sum of values at even indices)
console.log([10, 20, 30, 40].myReduce((acc, val, idx) => idx % 2 === 0 ? acc + val : acc, 0));
// Expected: 40

// 5. Empty array with initial value
console.log([].myReduce((acc, val) => acc + val, 100));
// Expected: 100