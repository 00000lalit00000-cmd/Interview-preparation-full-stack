function groupByT<T, K extends PropertyKey>(arr: T[], callback: (item: T) => K): Record<K, T[]> {
    return arr.reduce((result, item) => {
        const key = callback(item);

        if(!result[key]) {
            result[key]  = [];
        }

        result[key].push(item);
        return result;
    }, {} as Record<K, T[]>);
}


const usersT = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 25 },
  { name: "David", age: 30 }
];

console.log(groupByT(usersT, (user: any) => user.age));