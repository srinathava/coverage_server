const express = require('express')
const connectLivereload = require("connect-livereload");
const livereload = require("livereload");
const path = require("path");
const fs = require("fs").promises;

const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

const app = express()
const port = 3000
app.use(connectLivereload());
app.use(express.static('public'))
app.use(express.json());

COV_DATA_DIR = '/home/savadhan/code/coverage/derived/processedLogs1'

app.get('/file/*', async (req, res) => {
  const fileName = req.params[0];
  const txt = await fs.readFile(path.join(COV_DATA_DIR, fileName), 'utf8');
  const data = JSON.parse(txt);

  res.json(data);
});

async function* walkdir(dirname) {
  const workvec = [await fs.opendir(dirname)];
  while (workvec.length > 0) {
    const curd = workvec.pop();
    for await (const dirent of curd.entries()) {
      yield dirent;
      if (dirent.isDirectory()) {
        workvec.push(await fs.opendir(dirent.path));
      }
    }
  }
}

app.get('/dir', async (req, res) => {
  let entries = [];
  for await (const entry of walkdir(COV_DATA_DIR)) {
    if (entry.path.endsWith('cpp')) {
      entries.push(entry.path.slice(COV_DATA_DIR.length+1));
    }
  }
  res.json(entries);
});

let jobInfo = null;

async function getJobInfo() {
  if (jobInfo === null) {
    const filePath = path.join(COV_DATA_DIR, 'jobCoverage.json');
    const txt = await fs.readFile(filePath)
    jobInfo = JSON.parse(txt);
  }
  return jobInfo;
}

async function getFileInfo(fileName) {
  const txt = await fs.readFile(path.join(COV_DATA_DIR, fileName))
  return JSON.parse(txt);
}

function isSuperSet(biggerSet, smallerSet) {
  return smallerSet.every(val => biggerSet.includes(val));
}

async function getTestsForFcnObjectives(fcnCovInfo, reqdObjectives) {
  const jobInfo = await getJobInfo();

  let foundTests = [];

  for (const [objSeqId, testSeqId] of Object.entries(fcnCovInfo)) {
    let objectiveSeq = jobInfo.id2ifseq[objSeqId];
    if (!(objectiveSeq instanceof Array)) {
      objectiveSeq = [objectiveSeq];
    }
    if (isSuperSet(objectiveSeq, reqdObjectives)) {
      const testSeq = jobInfo.id2testseq[testSeqId];
      foundTests.push(...testSeq);
    }
  }

  return new Set(foundTests);
}

function intersection(s1, s2) {
  return new Set([...s1].filter(v => s2.has(v)));
}

app.post('/testsfor', async (req, res) => {
  const input = req.body;
  const fileName = input.fileName;
  const objectives = input.objectives;
  console.log(objectives);

  let fcnObjectives = {};
  for (const obj of objectives) {
    if (!fcnObjectives[obj.fcnIdx]) {
      fcnObjectives[obj.fcnIdx] = [];
    }
    fcnObjectives[obj.fcnIdx].push(obj.objIdx);
  }

  const fileInfo = (await getFileInfo(fileName)).runtimecoverage;

  let allTests = undefined;
  for (const [fcnIdx, reqdObjectives] of Object.entries(fcnObjectives)) {
    const fcnCovInfo = fileInfo[fcnIdx];
    const fcnTests = await getTestsForFcnObjectives(fcnCovInfo, reqdObjectives);
    if (allTests === undefined) {
      allTests = fcnTests;
    } else {
      allTests = intersection(allTests, fcnTests);
    }
  }

  let jobInfo = await getJobInfo();
  let tests = [];
  for (const testId of allTests) {
    tests.push(jobInfo.testInfo[testId]);
    if (tests.length == 10) {
      break;
    }
  }

  const totalNumTests = allTests.size;
  res.json({totalNumTests, tests});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
