function curry(fn) {
    return function curried(...args) {
        if(args.length >= fn.length) {
            return fn(...args);
        }

        return (...nextArgs) => {
            return curried(...args, ...nextArgs);
        }
    }
}

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);

// 1. One argument at a time
console.log(curriedAdd(1)(2)(3));
// 6

// 2. Two arguments, then one
console.log(curriedAdd(1, 2)(3));
// 6

// 3. One argument, then two
console.log(curriedAdd(1)(2, 3));
// 6

// 4. All arguments at once
console.log(curriedAdd(1, 2, 3));
// 6