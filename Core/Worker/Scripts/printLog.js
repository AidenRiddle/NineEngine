function simplePrint(message){
    return new Promise((resolve) => {
        setTimeout(() => {console.log(message); resolve();}, 5000);
    })
}

function a(){ console.log("a"); }
function b(){ console.log("b"); }
function c(){ console.log("c"); }