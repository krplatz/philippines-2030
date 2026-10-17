/* No third-party libraries or browser network calls. Model is deterministic and auditable. */
(() => {
  "use strict";
  if (!window.PH2030Model) return;
  const M = window.PH2030Model;
  const preset = document.getElementById("preset");
  const controls = ["adoption","substitution","newRoles","revenueGrowth","realWageAnnual","localCapture"];
  const el = id => document.getElementById(id);
  const current = {};
  const svgNS = "http://www.w3.org/2000/svg";
  function svg(tag, attributes, text) {
    const e = document.createElementNS(svgNS, tag);
    for (const [k,v] of Object.entries(attributes||{})) e.setAttribute(k,v);
    if (text!==undefined)e.textContent=text;
    return e;
  }
  function valueFromUi(id) {
    const raw=Number(el(id).value);
    return ["adoption","substitution","revenueGrowth","realWageAnnual","localCapture"].includes(id)?raw/100:raw/1000;
  }
  function uiFromValue(id,v) {
    return ["adoption","substitution","revenueGrowth","realWageAnnual"].includes(id)?v*100:v*1000;
  }
  function textValue(id,v){
    if(id==="newRoles")return Math.round(v*1000).toLocaleString("en-US")+"K";
    return (v*100).toFixed(id==="revenueGrowth"||id==="realWageAnnual"?1:0)+"%";
  }
  function loadPreset() {
    Object.assign(current,M.parameters(preset.value));
    for(const id of controls) el(id).value=String(uiFromValue(id,current[id]));
    draw();
  }
  function drawChart(rows){
    const host=el("employment-chart");
    const ns="http://www.w3.org/2000/svg";
    Array.from(host.children).forEach(node=>{if(!["title","desc"].includes(node.localName))node.remove()});
    const left=61,right=24,top=31,bottom=48,width=650,height=300;
    const ymin=.5,ymax=2.2,x=y=>left+(y-2026)/6*(width-left-right);
    const y=v=>top+(ymax-v)/(ymax-ymin)*(height-top-bottom);
    for(let val=.5;val<=2.00001;val+=.5){
      host.appendChild(svg("line",{x1:left,y1:y(val),x2:width-right,y2:y(val),stroke:"#ded6c8","stroke-width":"1"}));
      host.appendChild(svg("text",{x:left-12,y:y(val)+4,"text-anchor":"end",fill:"#6b6e76","font-size":"12","font-family":"monospace"},val.toFixed(1)));
    }
    for(const r of rows)host.appendChild(svg("text",{x:x(r.year),y:height-20,"text-anchor":"middle",fill:"#626776","font-size":"11","font-family":"monospace"},String(r.year)));
    const points=rows.map(r=>x(r.year).toFixed(2)+","+y(r.headcount).toFixed(2)).join(" ");
    host.appendChild(svg("polyline",{points,fill:"none",stroke:"#b4452c","stroke-width":"3","stroke-linecap":"round","stroke-linejoin":"round"}));
    for(const r of rows){
      const circle=svg("circle",{cx:x(r.year),cy:y(r.headcount),r:4.4,fill:"#b4452c",stroke:"#fffdf9","stroke-width":2});
      circle.appendChild(svg("title",{},r.year+": "+r.headcount.toFixed(3)+" million employees"));
      host.appendChild(circle);
    }
    // The official IBPAP 2028 industry outlook is an interval, not a model target.
    const xband=x(2028),min=y(2.14),max=y(1.85);
    host.appendChild(svg("line",{x1:xband+12,y1:min,x2:xband+12,y2:max,stroke:"#5b7b54","stroke-width":"4","stroke-dasharray":"4 4"}));
    host.appendChild(svg("text",{x:xband+20,y:min-9,fill:"#5b7b54","font-size":"10","font-family":"sans-serif"},"IBPAP 2028"));
    host.appendChild(svg("text",{x:width-right,y:18,"text-anchor":"end",fill:"#6b6e76","font-size":"10","font-family":"sans-serif"},"Conditional projection · not observed"));
  }
  function draw(){
    const custom={};
    for(const id of controls){custom[id]=valueFromUi(id);el("out-"+id).value=textValue(id,custom[id]);}
    const result=M.project(preset.value,custom);
    const r=result.rows.find(x=>x.year===2030);
    el("result-jobs").textContent=M.formatM(r.headcount);
    el("result-jobs-change").textContent=((r.headcount/M.BASE.observedEmployment-1)*100).toFixed(1)+"% versus 2025";
    el("result-revenue").textContent=M.formatB(r.revenue);
    el("result-productivity").textContent="$"+Math.round(r.revPerWorker).toLocaleString("en-US");
    el("result-local-capture").textContent="$"+Math.round(100*custom.localCapture)+"M";
    el("model-tbody").replaceChildren(...result.rows.map(x=>{
      const tr=document.createElement("tr");
      for(const val of [x.year,x.headcount.toFixed(3),x.revenue.toFixed(2),x.realWageIndex.toFixed(1),x.remittanceIndex.toFixed(1)]){
        const td=document.createElement("td");td.textContent=String(val);tr.appendChild(td);
      }
      return tr;
    }));
    el("current-settings").textContent="Selected condition set: "+M.PRESETS[preset.value].label+". Values are adjustable author assumptions, not observed data.";
    drawChart(result.rows);
  }
  preset.addEventListener("change",loadPreset);
  for(const id of controls) el(id).addEventListener("input",draw);
  el("reset-model").addEventListener("click",loadPreset);
  loadPreset();
})();
