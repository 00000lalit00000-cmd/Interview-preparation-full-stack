Function.prototype.myBind = function(thisArg, ...args){
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    const originalFunc = this;

    function boundFunction(...innerArgs) {
        if (this instanceof boundFunction) {
            return new originalFunc(...args, ...innerArgs);
        }

        const context = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);
        return originalFunc.apply(context, [...args, ...innerArgs]);
    }

    if (originalFunc.prototype) {
        boundFunction.prototype = Object.create(originalFunc.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

Function.prototype.myBind1 = function(thisArg, ...args){
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    const originalFunc = this;

    function boundFunction(...innerArgs) {
        if (this instanceof boundFunction) {
            return new originalFunc(...args, ...innerArgs);
        }

        const context = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);
        const uniqueId = Symbol('fn');

        Object.defineProperty(context, uniqueId, {
            value: originalFunc,
            enumerable: false,
            configurable: true,
            writable: true
        });

        let result;
        try {
            result = context[uniqueId](...args, ...innerArgs);
        } finally {
            delete context[uniqueId];
        }

        return result;
    }

    if (originalFunc.prototype) {
        boundFunction.prototype = Object.create(originalFunc.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

Function.prototype.myBind2 = function(thisArg, ...args){
    if (typeof this !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    const originalFunc = this;

    function boundFunction(...innerArgs) {
        if (this instanceof boundFunction) {
            return Reflect.construct(originalFunc, [...args, ...innerArgs]);
        }

        const context = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);
        return Reflect.apply(originalFunc, context, [...args, ...innerArgs]);
    }

    if (originalFunc.prototype) {
        boundFunction.prototype = Object.create(originalFunc.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

// ------------------------------------------------------

function fullName(greeting) {
    console.log(`${greeting}, I'm ${this.firstName} ${this.lastName}`);
}

const person1 = {
    firstName: 'Sudheer',
    lastName: 'Jonna'
};

const person2 = {
    firstName: "John",
    lastName: "Smith"
};

const boundFullName1 = fullName.myBind(person1, "Hello");
const boundFullName2 = fullName.myBind1(person2, "Hey");
const boundFullName3 = fullName.myBind2(person2, "Hi");

boundFullName1();
boundFullName2();
boundFullName3();