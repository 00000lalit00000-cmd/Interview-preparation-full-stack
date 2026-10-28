function debounceT<T extends (...args: any[]) => void>(
    func: T,
    wait = 0
) {
    let timeoutId : ReturnType<typeof setTimeout> | null = null;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        clearTimeout(timeoutId ?? undefined);

        timeoutId = setTimeout(
            () => {
                timeoutId = null;
                func.apply(this, args);
            }, wait)
    }
}

let counterT = 0;
function incrementT(): void {
    counterT++;
    console.log(counterT);
}

const debouncedCounterT = debounceT(incrementT, 100);
setTimeout(() => debouncedCounterT(), 50);
setTimeout(() => debouncedCounterT(), 100);
setTimeout(() => debouncedCounterT(), 200);
setTimeout(() => debouncedCounterT(), 300);