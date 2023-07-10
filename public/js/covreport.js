async function main() {
    const url = new URL(document.URL);

    const fileName = url.searchParams.get('path');
    const response = await fetch(`/file/${fileName}`);
    const data = await response.json();
    console.log(data);

    let fileTxt = data.txt;

    let prevPos = 0;
    let fileTxtInstr = '';

    let objectives = [];

    for (const [fcnIdx, fcnObjectives] of Object.entries(data.objectives)) {
        for (const [objIdx, offset] of Object.entries(fcnObjectives)) {
            const start = offset.flat()[0];
            objectives.push({objIdx, fcnIdx, start});
        }
    }

    for (const obj of objectives) {
        fileTxtInstr += fileTxt.slice(prevPos, obj.start-1);
        fileTxtInstr += '__FOO__';
        prevPos = obj.start-1;
    }
    fileTxtInstr += fileTxt.slice(prevPos);

    fileTxtInstr = fileTxtInstr.replaceAll('<', '&lt');
    fileTxtInstr = fileTxtInstr.replaceAll('>', '&gt');

    let lineNum = 0;
    fileTxtInstr = fileTxtInstr.replaceAll(/^/mg, (m) => {
        lineNum += 1;

        let prefix = `${lineNum} `.padStart(5, ' ');
        return `${m}${prefix}`;
    });

    let objIdx = 0;
    fileTxtInstr = fileTxtInstr.replaceAll(/__FOO__/g, () => {
        let retstr = '';
        const obj = objectives[objIdx];
        objIdx += 1;

        retstr += `<span class="objective" data-objIdx="${obj.objIdx}" data-fcnIdx="${obj.fcnIdx}">?</span>`;
        retstr += ' ';

        return retstr;
    });

    const fileDiv = document.querySelector('#file');
    fileDiv.innerHTML = `<pre>${fileTxtInstr}</pre>`;

    const choiceDiv = document.querySelector('div#choice');
    const summaryDiv = document.querySelector('#summary');
    let currentObjDiv = null;
    let currentSelection = new Set();

    choiceDiv.querySelector('button').addEventListener('click', () => {
        const selectedChoice = choiceDiv.querySelector('input:checked').value;

        const objIdx = parseInt(currentObjDiv.dataset['objidx']);
        const fcnIdx = parseInt(currentObjDiv.dataset['fcnidx']);

        currentObjDiv.innerHTML = selectedChoice;

        currentSelection.delete(`{"fcnIdx": ${fcnIdx}, "objIdx": ${objIdx}}`);
        currentSelection.delete(`{"fcnIdx": ${fcnIdx}, "objIdx": ${objIdx+1}}`);

        if (selectedChoice === 'T') {
            currentSelection.add(`{"fcnIdx": ${fcnIdx}, "objIdx": ${objIdx}}`);
        } else if (selectedChoice == 'F') {
            currentSelection.add(`{"fcnIdx": ${fcnIdx}, "objIdx": ${objIdx+1}}`);
        }

        choiceDiv.style.display = 'none';
        summaryDiv.innerHTML = `Selected ${currentSelection.size} constraints`
        console.log(currentSelection);
    });

    document.querySelectorAll('span.objective').forEach((el) => {
        el.addEventListener('click', (ev) => {
            ev.stopPropagation();

            choiceDiv.style.display = 'block';
            choiceDiv.style.top = `${ev.pageY}px`;
            choiceDiv.style.left = `${ev.pageX}px`;
            currentObjDiv = el;
        });
    });

    fileDiv.addEventListener('click', () => {
        choiceDiv.style.display = 'none';
    });

    const getTestsDiv = document.querySelector("#gettests");
    let runCmd = '';
    getTestsDiv.addEventListener('click', async () => {
        const objectives = [];

        for (const objStr of currentSelection.keys()) {
            objectives.push(JSON.parse(objStr));
        }
        const resp = await fetch('/testsfor', {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ fileName, objectives })
        });
        const json = await resp.json();
        const { totalNumTests, tests } = json;
        runCmd = '';
        for (const test of tests) {
            runCmd += test.cmd + '\n';
        }

        document.querySelector('#numTotalTests').innerHTML = `Found ${totalNumTests} tests. A sampling of those tests is below`;
        document.querySelector('#testresults').innerHTML = `<pre>${runCmd}</pre>`;
    });

    document.querySelector('#copytests').addEventListener('click', () => {
        navigator.clipboard.writeText(runCmd);
    });
}
main();
