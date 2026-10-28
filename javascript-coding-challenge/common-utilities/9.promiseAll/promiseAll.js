function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        const results = [];
        let completed = 0;

        if(promises.length === 0) {
            resolve([]);
            return;
        }

        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) =>  {
                    // Preserve input order
                    results[index] = value;
                    completed++;

                    // Resolve only when all promises finish
                    if(completed === promises.length) {
                        resolve(results);
                    }
                })
                .catch(reject);
        });
    });
}

// ==========================================
// Test 1: All promises resolve
// ==========================================

promiseAll([
  Promise.resolve("A"),
  Promise.resolve("B"),
  Promise.resolve("C")
])
.then((result) => {
  console.log(result);
});

// ["A", "B", "C"]


// ==========================================
// Test 2: Different completion times
// ==========================================

const p1 = new Promise(resolve =>
  setTimeout(() => resolve("A"), 3000)
);

const p2 = new Promise(resolve =>
  setTimeout(() => resolve("B"), 1000)
);

const p3 = new Promise(resolve =>
  setTimeout(() => resolve("C"), 2000)
);

promiseAll([p1, p2, p3])
.then((result) => {
  console.log(result);
});

// Completion: B → C → A
// Result:    ["A", "B", "C"]


// ==========================================
// Test 3: One promise rejects
// ==========================================

promiseAll([
  Promise.resolve("A"),
  Promise.reject("Something went wrong"),
  Promise.resolve("C")
])
.then((result) => {
  console.log(result);
})
.catch((error) => {
  console.log(error);
});

// Something went wrong


// ==========================================
// Test 4: Mix promises and normal values
// ==========================================

promiseAll([
  Promise.resolve(10),
  20,
  Promise.resolve(30),
  40
])
.then((result) => {
  console.log(result);
});

// [10, 20, 30, 40]