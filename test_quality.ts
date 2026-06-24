function processUserData(inputString: any) {
    // Triggers ESLint & Semgrep
    return eval(inputString);
}

// Triggers TypeScript Compiler (tsc)
let configurationPort: number = "8080"; 

export { processUserData, configurationPort };