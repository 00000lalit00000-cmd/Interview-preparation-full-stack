function memoizeT<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>();

    return function (...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);

        if(cache.has(key)) {
            return cache.get(key)!;
        }

        const result = fn(...args);
        cache.set(key, result);

        return result;
    } as T;
}

function addT(a: number, b: number) {
  console.log("Calculating...");
  return a + b;
}

const memoizedAddT = memoizeT(addT);

console.log(memoizedAddT(2, 3));
// Calculating...
// 5

console.log(memoizedAddT(2, 3));
// 5

console.log(memoizedAddT(2, 3));
// 5