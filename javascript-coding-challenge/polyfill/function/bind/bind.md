# bind.js

`Function.prototype.bind` polyfill examples implemented in 3 approaches.

## Current implementation

### 1) `myBind`
- Validates receiver: throws `TypeError('Bind must be called on a function')`.
- Captures original function and bind-time args.
- Returned `boundFunction` supports:
  - constructor call (`new boundFunction(...)`) via `this instanceof boundFunction`
  - normal call via `originalFunc.apply(context, [...args, ...innerArgs])`
- Normalizes context for normal calls:
  - `null`/`undefined` -> `globalThis`
  - primitives -> boxed with `Object(thisArg)`
- Sets prototype chain:
  - `boundFunction.prototype = Object.create(originalFunc.prototype)`
  - `boundFunction.prototype.constructor = boundFunction`

### 2) `myBind1`
- Same receiver validation as `myBind`.
- Supports constructor path with `this instanceof boundFunction`.
- For normal calls, normalizes context and invokes using temporary Symbol method on context.
- Cleans Symbol key with `try/finally`.
- Also sets prototype chain like `myBind`.

### 3) `myBind2`
Current code is:

```javascript
Function.prototype.myBind2 = function(thisArg, ...args){
    if (typeof originalFunc !== 'function') {
        throw new TypeError('Bind must be called on a function');
    }

    const originalFunc = this;
    // ...
}
```

- `originalFunc` is checked before it is declared.
- Because `originalFunc` is a `const`, this hits the temporal dead zone and throws a runtime `ReferenceError` when `myBind2` is called.
- Intended normal-call behavior (if reordered) is `Reflect.apply(...)` with normalized context.
- Intended constructor path uses `Reflect.construct(...)`.

## Runtime status from current file

Running `bind.js` currently fails when this line executes:

```javascript
const boundFullName3 = fullName.myBind2(person2, "Hi");
```

with:

```text
ReferenceError: Cannot access 'originalFunc' before initialization
```

## Example section in file

```javascript
const boundFullName1 = fullName.myBind(person1, "Hello");
const boundFullName2 = fullName.myBind1(person2, "Hey");
const boundFullName3 = fullName.myBind2(person2, "Hi");

boundFullName1();
boundFullName2();
boundFullName3();
```

## Notes
- `myBind` and `myBind1` currently include constructor-aware behavior.
- `myBind2` currently has a declaration-order bug and does not execute as intended until fixed.
- All three approaches are designed around partial application (`...args` at bind time + `...innerArgs` at call time).
