Function.prototype.myCall = function(thisArg, ...args) {
    if (typeof this !== 'function') {
        throw new TypeError('Call must be called on a function');
    }

    // Properly handle null/undefined as globalThis, and convert primitives to objects
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

Function.prototype.myCall1 = function(thisArg, ...args) {
    if (typeof this !== 'function') {
        throw new TypeError('Call must be called on a function');
    }

    // Properly handle null/undefined as globalThis, and convert primitives to objects
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

Function.prototype.myCall2 = function(thisArg, ...args) {
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    return this.apply(thisArg, args);
}

Function.prototype.myCall3 = function(thisArg, ...args) {
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    return this.bind(thisArg, ...args)();
}

const person1 = {
    firstName: 'Sudheer',
    lastName: 'Jonna'
}

function details(age = 30) {
    return this.firstName + ' ' + this.lastName + ' is ' + age + ' years old';
}

console.log(details.myCall(person1, 35));
console.log(details.myCall1(person1, 35));
console.log(details.myCall2(person1, 35));
console.log(details.myCall3(person1, 35));