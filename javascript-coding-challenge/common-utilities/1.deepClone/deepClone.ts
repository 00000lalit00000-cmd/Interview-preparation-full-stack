function deepCloneT1(value: unknown): unknown {
    //Primitives and nulls
    if(typeof value !== 'object' || value === null ) {
        return value;
    }

    //Arrays
    if(Array.isArray(value)) {
        return value.map((item) => deepCloneT1(item));
    }

    //objects
    const objCopy: Record<string, unknown> = {};

    for(const key of Object.keys(value)) {
        objCopy[key] = deepCloneT1((value as Record<string, unknown>)[key]);
    }

    return objCopy;
}

function deepCloneT2<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function deepCloneT3<T>(value: T): T {
    return structuredClone(value);
}


// ==========================================
// Test
// ==========================================

// ==========================================
// Test
// ==========================================

const objT1 = {
  employee: {
    name: "John",
    age: 30
  }
};


// T1
const clonedObjT1 = deepCloneT1(objT1);

console.log(clonedObjT1);


// T2
const clonedObjT2 = deepCloneT2(objT1);

clonedObjT2.employee.age = 35;

console.log(clonedObjT2.employee.age); // 35
console.log(objT1.employee.age);       // 30


// Array test
const objT2 = {
  fruits: [
    { name: "banana" },
    { name: "apple" }
  ]
};

const clonedObjT2Array = deepCloneT2(objT2);

objT2.fruits[1].name = "orange";

console.log(objT2.fruits[1].name);          // orange
console.log(clonedObjT2Array.fruits[1].name); // apple


// T2 and T3
console.log(deepCloneT2(objT1));
console.log(deepCloneT3(objT1));