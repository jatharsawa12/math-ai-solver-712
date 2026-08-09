const $=id=>document.getElementById(id);
function fmt(n){if(!Number.isFinite(n))return "undefined"; if(Math.abs(n-Math.round(n))<1e-10)return String(Math.round(n)); return String(Number(n.toFixed(10)));}
function clean(s){return s.replace(/[−–]/g,"-").replace(/×/g,"*").replace(/÷/g,"/").replace(/²/g,"^2").replace(/³/g,"^3").trim();}
function arithmetic(s){
  if(!/^[0-9+\-*/().%\s^√]+$/.test(s)) return null;
  try{
    s=s.replace(/√\s*(\d+(?:\.\d+)?)/g,"Math.sqrt($1)").replace(/(\d+(?:\.\d+)?)%/g,"($1/100)").replace(/\^/g,"**");
    const v=Function('"use strict";return ('+s+')')();
    return Number.isFinite(v)?`Answer: ${fmt(v)}`:null;
  }catch{return null}
}
function linear(s){
  let m=s.match(/(?:solve[:\s]*)?([+-]?\s*[\d.]*\.?\d*)\s*x\s*([+-]\s*[\d.]+)?\s*=\s*([+-]?\s*[\d.]+)/i);
  if(!m)return null;
  let a=parseFloat((m[1]||"1").replace(/\s/g,"")); if(m[1]==="-"||m[1]==="+") a=m[1]==="-"?-1:1;
  let b=parseFloat((m[2]||"0").replace(/\s/g,"").replace(/^([+-])/, "$1"))||0, c=parseFloat(m[3].replace(/\s/g,""));
  let x=(c-b)/a;
  return `Step 1: ${fmt(a)}x ${b>=0?"+ ":"- "}${fmt(Math.abs(b))} = ${fmt(c)}\nStep 2: ${fmt(a)}x = ${fmt(c-b)}\nStep 3: Divide both sides by ${fmt(a)}\n\nAnswer: x = ${fmt(x)}`;
}
function quadratic(s){
  let m=s.match(/([+-]?\s*[\d.]+)?\s*x\^2\s*([+-]\s*[\d.]+)?\s*x\s*([+-]\s*[\d.]+)?\s*=\s*0/i);
  if(!m)return null;
  let a=m[1]?parseFloat(m[1].replace(/\s/g,"")):1,b=m[2]?parseFloat(m[2].replace(/\s/g,"")):0,c=m[3]?parseFloat(m[3].replace(/\s/g,"")):0;
  let D=b*b-4*a*c;
  if(D<0)return `Discriminant D = ${fmt(D)}\nD < 0, so there are no real roots.`;
  let r1=(-b+Math.sqrt(D))/(2*a),r2=(-b-Math.sqrt(D))/(2*a);
  return `Step 1: Identify a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}\nStep 2: Discriminant D = b² − 4ac = ${fmt(D)}\nStep 3: x = (−b ± √D)/(2a)\n\nAnswer: x = ${fmt(r1)} or x = ${fmt(r2)}`;
}
function derivative(s){
  let expr=s.replace(/.*?(differentiate|derivative)\s*:?\s*/i,"").replace(/\s/g,"");
  let terms=expr.match(/[+-]?[^+-]+/g); if(!terms)return null;
  let out=[];
  for(let t of terms){
    let m=t.match(/^([+-]?\d*\.?\d*)\*?x(?:\^(\d+))?$/i);
    if(m){let a=m[1]===""||m[1]==="+"?1:m[1]==="-"?-1:parseFloat(m[1]),n=m[2]?parseInt(m[2]):1; let coef=a*n; if(n===1)out.push(fmt(coef)); else out.push(`${fmt(coef)}x${n-1===1?"":`^${n-1}`}`);}
    else if(!/[xX]/.test(t) && !/^\d/.test(t)) return null;
  }
  return out.length?`Differentiate each term:\n${expr}\n\nAnswer: ${out.join(" + ").replace(/\+\s-/g,"- ")}`:null;
}
function mean(s){
  let nums=s.match(/-?\d+(?:\.\d+)?/g); if(!nums||nums.length<2)return null;
  if(!/(mean|average)/i.test(s))return null;
  let a=nums.map(Number),sum=a.reduce((x,y)=>x+y,0);
  return `Step 1: Add the values = ${fmt(sum)}\nStep 2: Number of values = ${a.length}\nStep 3: Mean = ${fmt(sum)} ÷ ${a.length}\n\nAnswer: ${fmt(sum/a.length)}`;
}
function geometry(s){
  let m=s.match(/(?:area.*circle|circle.*area).*?(?:radius|r)\s*=?\s*(\d+(?:\.\d+)?)/i);
  if(m){let r=+m[1];return `Formula: Area = πr²\nSubstitute r = ${r}\nArea = π × ${r}² = ${fmt(Math.PI*r*r)} square units`;}
  return null;
}
function solve(){
 let q=clean($("question").value), level=$("level").value;
 if(!q){$("result").textContent="Please enter a question.";return;}
 let r=linear(q)||quadratic(q)||derivative(q)||mean(q)||geometry(q)||arithmetic(q);
 if(!r) r=`I couldn't solve this format offline yet.\n\nTry a question such as:\n• Solve: 3x + 7 = 22\n• Solve: x^2 - 5x + 6 = 0\n• Differentiate: x^3 + 2x^2 - 4x\n• What is the mean of 4, 7, 9, 10\n• What is 25% of 360\n\nClass selected: ${level}`;
 $("result").textContent=r;
}
$("solve").onclick=solve;
$("clear").onclick=()=>{$("question").value="";$("result").textContent="Your step-by-step solution will appear here.";};
$("question").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")solve();});
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
let deferred;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("install").style.display="inline-block";});
$("install").onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;}};
