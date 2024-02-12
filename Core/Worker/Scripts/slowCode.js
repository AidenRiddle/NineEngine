function mySlowFunction(baseNumber) {
    const start = performance.now();
	let result = 0;	
	for (var i = Math.pow(baseNumber, 7); i >= 0; i--) {		
		result += Math.atan(i) * Math.tan(i);
	};
    console.log(performance.now() - start);
    return result;
}