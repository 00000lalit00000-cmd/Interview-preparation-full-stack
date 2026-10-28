class EventEmitter {
    constructor() {
        this.events = [];
    }

    on(event, listener) {
        if(!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(listener);
        return this;
    }

    emit(event, ...args) {
        if(!this.events[event]) return false;

        this.events[event].forEach((listener) => listener(...args));

        return true;
    }

    off(event, listener) {
        if(!this.events[event]) return this;

        this.events[event] = this.events[event].filter((fn) => fn != listener);
        return this;
    }

    once(event, listener) {
        const wrapper = (...args) => {
            this.off(event, listener);
            listener(...args);
        }

        this.on(event, wrapper);
        return this;
    }
}

const emitter = new EventEmitter();
const greet = (name) => {
    console.log(`Hello ${name}`)
}

emitter.on("greet", greet);

emitter.emit("greet", "Alice");//Hello Alice
emitter.emit("greet", "Bob"); //Hello Bob

emitter.off("greet", greet);
emitter.emit("greet", "John"); //Nothing

const login = (name) => {
    console.log(`Logged in: ${name}`);
}

emitter.once("login", login);
emitter.emit("login", "John");//Logged in: John
emitter.emit("login", "John"); //Nothing

