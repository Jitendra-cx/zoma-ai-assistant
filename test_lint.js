// test_lint.js
function checkLinting() {
    // 1. Triggers 'no-eval' 
    eval("console.log('test')");

    // 2. Triggers 'no-console'
    console.log("This is a log statement");

    // 3. Triggers 'no-unused-vars'
    let unusedVariable = "I am not used anywhere";
}

export { checkLinting };