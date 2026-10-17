/* Run with: node --test tests/site.test.cjs
   Uses built-in Node test runner. No dependencies or network access. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const M = require("../scenario-model.js");

test("baseline and conditional 2030 employment endpoints are preserved", () => {
  assert.equal(M.BASE.employment,1.96);
  const results = ["managed","accelerated","crisis"].map(k=>M.project(k).rows.find(x=>x.year===2030).headcount);
  assert.ok(Math.abs(results[0]-1.71)<0.005);
  assert.ok(Math.abs(results[1]-1.42)<0.005);
  assert.ok(Math.abs(results[2]-1.15)<0.005);
  assert.ok(results[0]>results[1] && results[1]>results[2]);
});

test("model handles all paths and baseline without NaNs", () => {
  for (const key of Object.keys(M.PRESETS)) {
    const data=M.project(key);
    assert.deepEqual(data.rows.map(x=>x.year),[2026,2027,2028,2029,2030,2031,2032]);
    assert.equal(data.rows[0].headcount,1.96);
    assert.equal(data.rows[0].revenue,42.3);
    assert.equal(data.rows[0].realWageIndex,100);
    assert.equal(data.rows[0].remittanceIndex,100);
    for (const row of data.rows) for (const field of ["headcount","revenue","revPerWorker","grossDisplaced","newRoles","realWageIndex","remittanceIndex","retainedShare"])
      assert.ok(Number.isFinite(row[field]),`invalid ${field} in ${key} / ${row.year}`);
  }
});

test("economic sensitivities behave in the correct directions", () => {
  const row=(opts)=>M.project("accelerated",opts).rows.find(x=>x.year===2030);
  assert.ok(row({adoption:.95}).headcount < row({adoption:.4}).headcount);
  assert.ok(row({substitution:.95}).headcount < row({substitution:.4}).headcount);
  assert.ok(row({newRoles:.4}).headcount > row({newRoles:.1}).headcount);
  assert.ok(row({revenueGrowth:.08}).revenue > row({revenueGrowth:-.03}).revenue);
  assert.ok(row({realWageAnnual:.03}).realWageIndex > row({realWageAnnual:-.05}).realWageIndex);
  assert.equal(row({localCapture:.5}).retainedShare,.5);
});

test("invalid parameters are rejected instead of silently accepted", () => {
  assert.throws(()=>M.project("bogus"),/Unknown scenario/);
  assert.throws(()=>M.project("managed",{adoption:-.1}),/must be between/);
  assert.throws(()=>M.project("managed",{substitution:1.1}),/must be between/);
  assert.throws(()=>M.project("managed",{nonsense:12}),/Unknown parameter/);
});

test("HTML navigation references local pages and paths actually in branch", () => {
  for (const file of ["index.html","Research.html","model.html","crisis.html","research-archive.html"]) {
    const html=read(file);
    const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]).filter(href=>!href.startsWith("#")&&!/^(?:https?:|mailto:)/.test(href));
    for(const href of links){
      const url=href.split("#")[0].split("?")[0];
      if (!url) continue;
      assert.ok(fs.existsSync(path.join(root,url)),`${file}: missing ${url}`);
    }
  }
});

test("IDs are unique and all new narrative choices have accessible panels", () => {
  for(const file of ["index.html","Research.html","model.html"]){
    const ids=[...read(file).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,`duplicate id in ${file}`);
  }
  const page=read("index.html");
  for(const key of ["managed","accelerated","crisis"]){
    assert.match(page,new RegExp('role="tab" id="tab-'+key+'"'));
    assert.match(page,new RegExp('role="tabpanel" aria-labelledby="tab-'+key+'"'));
    assert.match(page,new RegExp('id="panel-'+key+'"'));
  }
  assert.match(page,/id="tab-accelerated"[^>]*aria-selected="true"/);
  assert.match(read("three-futures.js"),/hashchange/);
  assert.match(read("three-futures.js"),/ArrowRight/);
});

test("the model lab wires every financial lever and accessible fallback table", () => {
  const html=read("model.html");
  for(const name of ["adoption","substitution","newRoles","revenueGrowth","realWageAnnual","localCapture"]){
    assert.match(html,new RegExp('id="'+name+'"'));
    assert.match(html,new RegExp('id="out-'+name+'"'));
  }
  assert.match(html,/id="model-tbody"/);
  assert.match(html,/id="employment-chart"/);
  assert.match(read("scenario-lab.js"),/replaceChildren/);
  assert.match(read("Research.html"),/IBPAP/);
  assert.match(read("Research.html"),/2026/);
});

test("the original narrative and research are preserved as separate archives", () => {
  assert.ok(read("crisis.html").length>150000);
  assert.ok(read("research-archive.html").length>100000);
  assert.ok(read("index.html").length>55000);
  assert.ok(read("Research.html").length>30000);
});

test("all required scripts use local dependencies only", () => {
  const main=read("index.html"), lab=read("model.html");
  assert.match(main,/three-futures\.js/);
  assert.match(lab,/scenario-model\.js/);
  assert.match(lab,/scenario-lab\.js/);
  for(const page of [main,lab]){
    assert.doesNotMatch(page,/<script[^>]+src="https?:\/\//);
  }
});
