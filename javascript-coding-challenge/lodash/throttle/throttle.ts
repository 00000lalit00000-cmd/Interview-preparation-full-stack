function throttleT<T extends (...args: any[])=> void>(fn: T, wait=0) {
    let isThrottle = false;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        if(isThrottle) {
            return;
        }

        isThrottle = true;
        setTimeout(() => {
            isThrottle = false;
        }, wait);
        fn.apply(this, args);
    }
}

let counterT = 0;

function incrementT() {
    counterT++;
    console.log(counterT);
}

const throttleCounterT = throttleT(incrementT, 100);
setTimeout(() => throttleCounterT(), 50);
setTimeout(() => throttleCounterT(), 160);
setTimeout(() => throttleCounterT(), 200);