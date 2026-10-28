function promiseAllT<T>(promises: Promise<T>[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const result: T[] = [];
        let completed = 0;

        if(promises.length === 0) {
            resolve([]);
            return;
        }

        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) => {
                    result[index] = value;
                    completed++;

                    if(completed === promises.length) {
                        resolve(result);
                    }
                })
                .catch(reject);
        });
     });
}


// ==========================================
// Test 1: All promises resolve
// ==========================================

promiseAllT([
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

const p11 = new Promise(resolve =>
  setTimeout(() => resolve("A"), 3000)
);

const p21 = new Promise(resolve =>
  setTimeout(() => resolve("B"), 1000)
);

const p31 = new Promise(resolve =>
  setTimeout(() => resolve("C"), 2000)
);

promiseAllT([p11, p21, p31])
.then((result) => {
  console.log(result);
});

// Completion: B → C → A
// Result:    ["A", "B", "C"]


// ==========================================
// Test 3: One promise rejects
// ==========================================

promiseAllT([
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
