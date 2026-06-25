// test_quality.ts

// Triggers TypeScript Compiler (tsc)
let configurationPort: number = "8080";  

// Triggers security, eslint
function checkLinting() {
    // 1. Triggers 'no-eval' 
    eval("console.log('test')");

    // 2. Triggers 'no-console'
    console.log("This is a log statement");

    // 3. Triggers 'no-unused-vars'
    let unusedVariable = "I am not used anywhere";
}

export { checkLinting, configurationPort, processUserData };