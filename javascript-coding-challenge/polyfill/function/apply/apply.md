# apply.js

`Function.prototype.apply` polyfill examples implemented in 4 approaches.

## Current implementation

### 1) `myApply`
- Validates receiver: throws `TypeError('Apply must be called on a function')` when `this` is not a function.
- Normalizes `thisArg`:
  - `null`/`undefined` -> `globalThis`
  - primitives -> boxed with `Object(thisArg)`
- Uses a temporary `Symbol` key on `thisArg` to invoke with proper `this`.
- Cleans temporary key in `finally`.

### 2) `myApply1`
- Same behavior as `myApply`.
- Uses `Object.defineProperty(..., { enumerable: false })` for the temporary Symbol property.

### 3) `myApply2`
- Validates receiver, but current message is:
  - `TypeError('Bind must be called on a function')`
- Delegates to native `call`:
  - `return this.call(thisArg, ...args)`

### 4) `myApply3`
- Validates receiver, but current message is:
  - `TypeError('Bind must be called on a function')`
- Delegates to native `bind` and invokes immediately:
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

console.log(details.myApply(person1, [35]));
console.log(details.myApply1(person1, [35]));
console.log(details.myApply2(person1, [35]));
console.log(details.myApply3(person1, [35]));
```

## Notes
- Approaches 1 and 2 are standalone-style implementations.
- Approaches 3 and 4 rely on native function helpers (`call`/`bind`).
- Error message text is currently inconsistent across approaches (`Apply...` vs `Bind...`).
