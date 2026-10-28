//First approach: Using Symbol to create a unique property on the thisArg object to avoid conflicts with existing properties.
// The function is then called using this unique property, and finally, the property is deleted to clean up.
Function.prototype.myApply = function(thisArg, args=[]) {
    if (typeof this !== 'function') {
        throw new TypeError('Apply must be called on a function');
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

Function.prototype.myApply1 = function(thisArg, args=[]) {
    if (typeof this !== 'function') {
        throw new TypeError('Apply must be called on a function');
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

Function.prototype.myApply2 = function(thisArg, args=[]) {
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    return this.call(thisArg, ...args)
}

Function.prototype.myApply3 = function(thisArg, args=[]) {
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
    return this.firstName + ' '+this.lastName + ' is ' + age + ' years old';
}

console.log(details.myApply(person1, [35]));
console.log(details.myApply1(person1, [35]));
console.log(details.myApply2(person1, [35]));
console.log(details.myApply3(person1, [35]));