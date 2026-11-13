import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {replay,fingerprint} from '../web/replay.js';
test('synthetic replay passes and matches published fingerprint',async()=>{
 const report=replay(), anchor=JSON.parse(await readFile(new URL('../web/demo-anchor.json',import.meta.url)));
 assert.equal(report.pass,true);
 assert.equal(report.ending,10900);
 assert.equal(await fingerprint(report),anchor.sha256);
 assert.notEqual(await fingerprint({...report,ending:11000}),anchor.sha256);
});
