// core/tools/calculator.ts
export async function calculator(args: { operation: 'add' | 'subtract' | 'multiply' | 'divide', a: number | string, b: number | string }): Promise<string> {
    const { operation, a, b } = args;
    const numA = parseFloat(String(a));
    const numB = parseFloat(String(b));

    if (isNaN(numA) || isNaN(numB)) {
        return "Error: Invalid numbers provided. Both 'a' and 'b' must be convertible to numbers.";
    }

    switch (operation) {
        case 'add': return `Result: ${numA + numB}`;
        case 'subtract': return `Result: ${numA - numB}`;
        case 'multiply': return `Result: ${numA * numB}`;
        case 'divide': 
            if (numB === 0) return "Error: Cannot divide by zero.";
            return `Result: ${numA / numB}`;
        default: 
            return `Error: Unknown operation '${operation}'. Available operations are: add, subtract, multiply, divide.`;
    }
}
