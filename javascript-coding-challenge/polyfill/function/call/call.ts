declare global {
    interface Function {
        myCall(thisArg: any, ...args: any[]): any,
        myCall1(thisArg: any, ...args: any[]): any,
        myCall2(thisArg: any, ...args: any[]): any,
        myCall3(thisArg: any, ...args: any[]): any,
    }
}

Function.prototype.myCall = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Call must be called on a function");
    }

    thisArg = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);
    const uniqueId = Symbol('fn');
    thisArg[uniqueId] = this;

    let result;

    try {
        result = thisArg[uniqueId](...args);
    } finally {
        delete thisArg[uniqueId];
    }

    return result;
}

Function.prototype.myCall1 = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Call must be called on a function");
    }

    thisArg = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);
    const uniqueId = Symbol('fn');

    Object.defineProperty(thisArg, uniqueId, {
        value: this,
        enumerable: false,
        configurable: true,
        writable: true
    });

    let result;

    try {
        result = thisArg[uniqueId](...args);
    } finally {
        delete thisArg[uniqueId];
    }

    return result;
}

Function.prototype.myCall2 = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Call must be on a function");
    }

    return this.apply(thisArg, args);
}

Function.prototype.myCall3 = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Call must be on a function");
    }
    
    return this.bind(thisArg, ...args)();
}

export {}

const person1 = {
    firstName: 'Sudheer',
    lastName: 'Jonna'
}

function details(this: typeof person1, age = 30) {
    return this.firstName + ' ' + this.lastName + ' is ' + age + ' years old';
}

console.log(details.myCall(person1, 35));
console.log(details.myCall1(person1, 35));
console.log(details.myCall2(person1, 35));
console.log(details.myCall3(person1, 35));