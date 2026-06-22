// test.js
const express = require('express');
const app = express();

app.get('/run', (req, res) => {
    const userInput = req.query.code;
    
    // 🚨 CRITICAL SECURITY FLAW: Remote Code Execution (RCE) via eval()
    eval(userInput); 

console.lo('foo ABCDEF')

    res.send('Executed!');
});