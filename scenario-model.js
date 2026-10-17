/* Philippines 2030 · deterministic, transparent scenario accounting, October 2026.
   No sampling, pseudo-probabilities, server calls, local storage, or personal data.
   Units: millions of jobs, US$ billions; the model illustrates conditional pathways. */
(function(root,factory){ const api=factory(); if(typeof module==="object"&&module.exports)module.exports=api; root.PH2030Model=api; })(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const BASE={year:2026,employment:1.96,revenue:42.3,observedEmployment:1.89,observedRevenue:40.3};
const ASSUMED_EXPOSED=0.58; // authored task-equivalent job pool. NOT ILO occupation exposure.
const WEIGHTS={2026:0,2027:0.07,2028:0.17,2029:0.50,2030:1,2031:1.18,2032:1.36};
const PRESETS={
 managed:{label:"Managed adaptation",adoption:0.62,substitution:0.75,newRoles:0.279,revenueGrowth:0.058,realWageAnnual:-0.005,remittance2030:0.99,localCapture:0.55},
 accelerated:{label:"Divided economy",adoption:0.77,substitution:0.84,newRoles:0.195,revenueGrowth:0.028,realWageAnnual:-0.05,remittance2030:0.93,localCapture:0.35},
 crisis:{label:"Structural crisis",adoption:0.92,substitution:0.92,newRoles:0.154,revenueGrowth:-0.052,realWageAnnual:-0.08,remittance2030:0.75,localCapture:0.22}
};
const LIMITS={adoption:[0,1],substitution:[0,1],newRoles:[0,0.6],revenueGrowth:[-0.15,0.15],realWageAnnual:[-0.15,0.1],remittance2030:[0.4,1.2],localCapture:[0,1]};
function assertNumber(name,n){ if(typeof n!=="number"||!Number.isFinite(n)) throw Error(name+" must be a finite number"); const b=LIMITS[name];if(b&&(n<b[0]||n>b[1]))throw Error(name+" must be between "+b[0]+" and "+b[1]);return n; }
function parameters(key="accelerated",overrides={}){if(!Object.prototype.hasOwnProperty.call(PRESETS,key))throw Error("Unknown scenario");const p={...PRESETS[key]};for(const [k,v] of Object.entries(overrides)){if(!Object.prototype.hasOwnProperty.call(LIMITS,k))throw Error("Unknown parameter: "+k);p[k]=assertNumber(k,v);}return p;}
function project(key="accelerated",overrides={}){
 const p=parameters(key,overrides);
 const grossPotential=BASE.employment*ASSUMED_EXPOSED*p.adoption*p.substitution;
 const rows=[];
 for(let year=2026;year<=2032;year++){
   const t=year-2026;
   const w=WEIGHTS[year];
   // Gross displaced task-equivalent jobs minus net additions. No claim that people have the same transitions.
   const gross=grossPotential*w;
   const additions=p.newRoles*w;
   const jobs=Math.max(0,BASE.employment-gross+additions);
   const revenue=BASE.revenue*Math.pow(1+p.revenueGrowth,t);
   const realWage=100*Math.pow(1+p.realWageAnnual,t);
   const remittanceIndex=100*Math.pow(p.remittance2030,t/4); // percentage index; not national remittance level
   rows.push({year,headcount:jobs,revenue,revPerWorker:jobs>0?revenue*1000/jobs:null,grossDisplaced:gross,newRoles:additions,realWageIndex:realWage,remittanceIndex,retainedShare:p.localCapture});
 }
 return {name:key,parameters:p,assumptions:{exposedTaskShare:ASSUMED_EXPOSED,weights:WEIGHTS},baseline:BASE,rows};
}
function formatM(n){return n.toFixed(2)+"M";}
function formatB(n){return "$"+n.toFixed(1)+"B";}
return {BASE,PRESETS,LIMITS,ASSUMED_EXPOSED,WEIGHTS,parameters,project,formatM,formatB};
});
