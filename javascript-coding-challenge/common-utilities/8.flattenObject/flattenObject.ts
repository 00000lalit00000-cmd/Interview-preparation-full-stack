function flattenTObject(obj: Record<string, unknown>, prefix=""): Record<string, unknown> {
    return Object.keys(obj).reduce<Record<string, unknown>>((acc, key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if(value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value as Record<string, unknown>, newKey));
        } else {
            acc[newKey] = value;
        }

        return acc;
    }, {});
}

const profile = {
  user: {
    name: "Alice",
    address: {
      city: "Singapore"
    }
  }
}

console.log(flattenTObject(profile));