declare global {
    interface Function {
        myBind(thisArg: any, ...args: any[]): any;
        myBind1(thisArg: any, ...args: any[]): any;
        myBind2(thisArg: any, ...args: any[]): any;
    }
}

export {};

Function.prototype.myBind = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Bind must be called on a function");
    }

    const originalFunction = this;
    function boundFunction(this: any, ...innerArgs: any[]): any {
        //called using new
        if(this instanceof boundFunction) {
            return new originalFunction(...args, ...innerArgs);
        }

        const context = (thisArg === undefined || thisArg === null) ? globalThis : Object(thisArg);
        return originalFunction.apply(context, [...args, ...innerArgs]);
    }

    if(originalFunction.prototype) {
        boundFunction.prototype = Object.create(originalFunction.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

Function.prototype.myBind1 = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Bind must be called on a function");
    }

    const originalFunction = this;

    function boundFunction(this: any, ...innerArgs: any[]) {
        //called using new
        if(this instanceof boundFunction) {
            return new originalFunction(...args, ...innerArgs);
        }

        const context = (thisArg === null || thisArg === undefined) ? globalThis : Object(thisArg);

        const uniqueId = Symbol('fn');
        Object.defineProperty(context, uniqueId, {
            value: originalFunction,
            enumerable: false,
            configurable: true,
            writable: true
        });

        let result: any;

        try {
            result = context[uniqueId](...args, ...innerArgs);
        } finally {
            delete context[uniqueId];
        }

        return result;
    }

    if(originalFunction.prototype) {
        boundFunction.prototype = Object.create(originalFunction.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

Function.prototype.myBind2 = function(
    thisArg: any,
    ...args: any[]
): any {
    if(typeof this !== 'function') {
        throw new TypeError("Bind must be called on a function");
    }

    const originalFunction = this;

    function boundFunction(this: any, ...innerArgs: any[]) {
        // called using new
        if(this instanceof boundFunction) {
            return Reflect.construct(originalFunction, [...args, ...innerArgs]);
        }

        const context = (thisArg ===  null || thisArg === undefined) ? globalThis : Object(thisArg);

        return Reflect.apply(originalFunction, context, [...args, ...innerArgs]);
    }

    if(originalFunction.prototype) {
        boundFunction.prototype = Object.create(originalFunction.prototype);
        boundFunction.prototype.constructor = boundFunction;
    }

    return boundFunction;
}

// ------------------------------------------------------

function fullName(this: typeof person1 | typeof person2, greeting: string) {
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