function flattenObject(obj, prefix="") {
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if(value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value, newKey));
        } else {
            acc[newKey] = value;
        }

        return acc;
    }, {});
}

const obj = {
  user: {
    name: "Alice",
    address: {
      city: "Singapore"
    }
  }
}

console.log(flattenObject(obj));