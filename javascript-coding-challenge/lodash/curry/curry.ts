function curryT<T extends unknown[], R>(fn: (...args: T) => R): (...args: any[]) => any {
    return function curried(...args: any[]): any {
        if(args.length >= fn.length) {
            return fn(...(args as T));
        }

        return (...nextArgs: any[]) => {
            return curried(...args, ...nextArgs);
        }
    }
}


function addT(a:number, b:number, c:number) {
  return a + b + c;
}

const curriedAddT = curryT(add);

// 1. One argument at a time
console.log(curriedAddT(1)(2)(3));
// 6

// 2. Two arguments, then one
console.log(curriedAddT(1, 2)(3));
// 6

// 3. One argument, then two
console.log(curriedAddT(1)(2, 3));
// 6

// 4. All arguments at once
console.log(curriedAddT(1, 2, 3));
// 6