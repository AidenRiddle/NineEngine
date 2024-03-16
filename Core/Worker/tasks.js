export const JOB_FIBONACCI = `function fib(depth) {
    let a = 0, b = 1, c, i;
    if (depth == 0)
        return a;
    for (i = 2; i <= depth; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}`

export const JOB_PRINTERROR = `function printError(message){
    console.error(message);
}`

export const JOB_PRINTLOG = `function printLog(message){
    return new Promise((resolve) => {
        setTimeout(() => {console.log(message); resolve();}, 5000);
    })
}

function a(){ console.log("a"); }
function b(){ console.log("b"); }
function c(){ console.log("c"); }`

export const JOB_PRINTTRACE = `function printTrace(message){
    console.trace(message);
}`

export const JOB_SLOWCODE = `function mySlowFunction(baseNumber) {
    const start = performance.now();
	let result = 0;	
	for (var i = Math.pow(baseNumber, 7); i >= 0; i--) {		
		result += Math.atan(i) * Math.tan(i);
	};
    console.log(performance.now() - start);
    return result;
}`