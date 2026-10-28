# call.js

`Function.prototype.call` polyfill examples implemented in 4 approaches.

## Current implementation

### 1) `myCall`
- Validates receiver: throws `TypeError('Call must be called on a function')`.
- Normalizes `thisArg`:
  - `null`/`undefined` -> `globalThis`
  - primitives -> boxed via `Object(thisArg)`
- Uses temporary Symbol assignment on `thisArg` and executes with `...args`.
- Deletes temporary Symbol key in `finally`.

### 2) `myCall1`
- Same core behavior as `myCall`.
- Uses `Object.defineProperty` for the temporary Symbol method.

### 3) `myCall2`
- Validates receiver, but current message is:
  - `TypeError('Bind must be called on a function')`
- Delegates to native `apply`:
  - `return this.apply(thisArg, [...args])`

### 4) `myCall3`
- Validates receiver, but current message is:
  - `TypeError('Bind must be called on a function')`
- Delegates to native `bind` and executes immediately:
  - `return this.bind(thisArg, ...args)()`

## Example from file

```javascript
const person1 = {
  firstName: 'Sudheer',
  lastName: 'Jonna'
};

function details(age = 30) {
  return this.firstName + ' ' + this.lastName + ' is ' + age + ' years old';
}

console.log(details.myCall(person1, 35));
console.log(details.myCall1(person1, 35));
console.log(details.myCall2(person1, 35));
console.log(details.myCall3(person1, 35));
```

## Notes
- Approaches 1 and 2 implement the mechanics directly.
- Approaches 3 and 4 delegate to native helpers (`apply`/`bind`).
- Error message text is currently inconsistent across approaches (`Call...` vs `Bind...`).
