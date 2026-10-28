declare global {
    interface Function {
        myApply(thisArg: any, args?: any[]): any,
        myApply1(thisArg: any, args?: any[]): any,
        myApply2(thisArg: any, args?: any[]): any,
        myApply3(thisArg: any, args?: any[]): any,
    }
}

export {}

Function.prototype.myApply = function(
    thisArg: any, 
    args: any[] = []
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Apply must be on a function");
    }

    thisArg = (thisArg === undefined || thisArg === null) ? globalThis : Object(thisArg);

    const uniqueId = Symbol("fn");
    thisArg[uniqueId] = this;

    let result: any;

    try {
        result = thisArg[uniqueId](...args);
    } finally {
        delete thisArg[uniqueId];
    }

    return result;
}

Function.prototype.myApply1 = function(
    thisArg: any,
    args: any[] = []
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Apply must be on a function");
    }

    thisArg = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);

    const uniqueId = Symbol("fn");
    Object.defineProperty(thisArg, uniqueId, {
        value: this,
        enumerable: false,
        configurable: true,
        writable: true
    });

    let result: any;

    try {
        result = thisArg[uniqueId](...args);
    } finally {
        delete thisArg[uniqueId];
    }

    return result;
}

Function.prototype.myApply2 = function(
    thisArg: any,
    args: any[] = []
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Apply must be on a function");
    }

    return this.call(thisArg, ...args);
}

Function.prototype.myApply3 = function(
    thisArg: any,
    args: any[] = []
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Apply must be on a function");
    }

    return this.bind(thisArg, ...args)();
}

const person1 = {
  firstName: "Sudheer",
  lastName: "Jonna",
};

function details(
  this: typeof person1,
  age = 30
): string {
  return `${this.firstName} ${this.lastName} is ${age} years old`;
}

console.log(details.myApply(person1, [35]));
console.log(details.myApply1(person1, [35]));
console.log(details.myApply2(person1, [35]));
console.log(details.myApply3(person1, [35]));