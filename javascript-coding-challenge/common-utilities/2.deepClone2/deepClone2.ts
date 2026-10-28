function isNonObjectT(inputVal: unknown): inputVal is null | undefined | string | boolean | number | bigint | symbol {
    return typeof inputVal !== 'object' || inputVal === null;
}

function getTypeT(inputVal: object): string {
    return Object.prototype.toString.call(inputVal).slice(8, -1).toLowerCase();
}

function deepCloneT2<T>(inputVal: T): T {
    return deepCloneWithCacheT(inputVal, new WeakMap<object, object>()) as T;
}

function deepCloneWithCacheT(inputVal: unknown, cache: WeakMap<object, object>): unknown {
    if(isNonObjectT(inputVal)) {
        return inputVal;
    }

    //circular/shared reference
    if(cache.has(inputVal)) {
        return cache.get(inputVal);
    }

    const type = getTypeT(inputVal);
    let cloned: any;

    switch(type) {
        case 'set':
            const set = inputVal as Set<unknown>;
            cloned = new Set<unknown>();
            cache.set(inputVal, cloned);
            for(const item of set) {
                cloned.add(deepCloneWithCacheT(item, cache));
            }
            break;

        case 'map':
            const map = inputVal as Map<unknown, unknown>;
            cloned = new Map<unknown, unknown>();
            cache.set(inputVal, cloned);
            for(const [key, val] of map) {
                cloned.set(deepCloneWithCacheT(key, cache), deepCloneWithCacheT(val, cache));
            }
            break;

        case 'array':
            const arr = inputVal as unknown[];
            cloned = [];
            cache.set(inputVal, cloned);
            for(const item of arr) {
                cloned.push(deepCloneWithCacheT(item, cache));
            }
            break;
        case 'date':
            const date = inputVal as Date;
            cloned = new Date(date.getTime());
            cache.set(inputVal, cloned);
            break;
        case 'regexp':
            const regex = inputVal as RegExp;
            cloned = new RegExp(regex.source, regex.flags);
            cloned.lastIndex = regex.lastIndex;
            cache.set(inputVal, cloned);
            break;
        default:
            cloned = Object.create(Object.getPrototypeOf(inputVal));
            cache.set(inputVal, cloned);
            for(const key of Reflect.ownKeys(inputVal)) {
                const desc = Object.getOwnPropertyDescriptor(inputVal, key);
                if(!desc) {
                    continue;
                }
                if(desc.get || desc.set) {
                    Object.defineProperty(cloned, key, desc);
                } else {
                    desc.value = deepCloneWithCacheT(desc.value, cache);
                    Object.defineProperty(cloned, key, desc);
                }
            }
    }
    return cloned;
}



// ==========================================
// Test object
// ==========================================

const objT1 = {
  str: "",
  num: 0,
  bool: true,
  undef: undefined,
  null: null,

  map: new Map<string, unknown>(),

  set: new Set<unknown>(),

  obj: {
    name: "John",
    age: 37
  },

  arr: [1, 2, 3],

  date: new Date(),

  reg: /xyz/g,

  [Symbol("x")]: "abc"
};


const clonedObj1 = deepCloneT2(objT1);

clonedObj1.num = 10;

console.log(clonedObj1);
console.log(objT1.num);
// 10
// 0