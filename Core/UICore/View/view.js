const ulDom = document.getElementById("hierarchy");
const listedObjs = [];

window.addEventListener("message", (event) => {
    let difference = event.data.filter(x => !listedObjs.includes(x));
    for(const diff of difference){ listedObjs.push(diff); }
    UpdateUI(difference);
}, false);

const UpdateUI = (data) => {
    for (const so of data) {
        const childObj = document.createElement("li");
        childObj.innerText = so;
        ulDom.appendChild(childObj);
    }
}