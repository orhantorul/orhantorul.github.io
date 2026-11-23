'use strict';
const $=id=>document.getElementById(id);
const {series,bands,counts,decomp}=RESULTS;
const groups=Object.keys(decomp);
const countries=Object.keys(counts).filter(n=>n!=='Full sample'&&!groups.includes(n)).sort();
const palette=['#171717','#555555','#333333','#707070'];
const dashes=['none','10 4','2 4','10 4 2 4'];
const metrics={
 persistence:['Educational persistence','Probability of attaining the same education level as the better-educated parent.'],
 upward:['Upward mobility','Probability of reaching a higher education level than the better-educated parent.'],
 downward:['Downward mobility','Probability of attaining a lower education level than the better-educated parent.'],
 p_female:['Persistence among women','Probability that a female respondent matches the education level of her better-educated parent.'],
 p_male:['Persistence among men','Probability that a male respondent matches the education level of his better-educated parent.'],
 u_female:['Upward mobility among women','Probability that a female respondent exceeds the education level of her better-educated parent.'],
 u_male:['Upward mobility among men','Probability that a male respondent exceeds the education level of his better-educated parent.'],
 eo_low_high:['Tertiary opportunity ratio','Probability of tertiary attainment for children of low-educated parents divided by that for children of high-educated parents. A ratio of 1 means equal probabilities.'],
 beta:['Schooling regression slope (β)','Slope of respondent years of schooling on imputed parental years. Regional values average country slopes using cell sample sizes.'],
 rho:['Schooling correlation (ρ)','Correlation of respondent years of schooling with imputed parental years. Regional values average country correlations using cell sample sizes.'],
 rank_corr:['Rank correlation','Spearman correlation of the three education levels for respondents and parents. Regional values pool respondents within each region and birth cohort.']
};
const years=Array.from({length:46},(_,i)=>1940+i);
const pct=k=>!['eo_low_high','beta','rho','rank_corr'].includes(k);
const format=(v,k)=>v==null?'—':pct(k)?(v*100).toFixed(1)+'%':v.toFixed(3);
const options=(el,items)=>items.forEach(([v,t])=>el.add(new Option(t,v)));
options($('metric'),Object.entries(metrics).map(([k,v])=>[k,v[0]]));
options($('primary'),countries.map(n=>[n,n]));$('primary').value='Turkey';
options($('secondary'),[['','None'],...countries.map(n=>[n,n])]);
options($('sample'),['Full sample',...groups,...countries].map(n=>[n,n]));
function bars(node,name){
 const row=counts[name];node.innerHTML=['Parent','Child'].map(w=>{
 const pairs=['low','medium','high'].map(l=>100*row[w+' '+l]/row.N);
 return '<div class="barGroup"><div class="barLabel">'+(w==='Parent'?'Better-educated parent':'Respondent')+'</div><div class="stack">'+pairs.map((v,i)=>'<span class="'+['low','med','high'][i]+'" style="width:'+v+'%" title="'+['Low','Medium','High'][i]+' '+v.toFixed(1)+'%">'+(v>=6?v.toFixed(1)+'%':'')+'</span>').join('')+'</div></div>';
 }).join('');
}
function table(el,heads,rows){el.innerHTML='<thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((v,i)=>i?'<td>'+v+'</td>':'<th scope="row">'+v+'</th>').join('')+'</tr>').join('')+'</tbody>';}
function education(){const n=$('sample').value,r=counts[n];$('educationTitle').textContent='Educational attainment · '+n;$('sampleSize').textContent=r.N.toLocaleString('en-US')+' respondents. Each bar sums to 100% before rounding.';bars($('educationBars'),n);table($('eduTable'),['Education level','Parent count','Parent share','Respondent count','Respondent share'],['low','medium','high'].map(l=>[l[0].toUpperCase()+l.slice(1),...['Parent','Child'].flatMap(k=>[r[k+' '+l].toLocaleString('en-US'),(100*r[k+' '+l]/r.N).toFixed(1)+'%'])]));}
function names(){return $('scope').value==='regions'?groups:[...new Set([$('primary').value,$('secondary').value].filter(Boolean))];}
const txt=(x,y,v,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+v+'</text>';
const line=(x,y,xx,yy,color,dash='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="'+color+'" stroke-dasharray="'+dash+'"/>';
let plotMap;
function draw(){
 const k=$('metric').value,ns=names(),yr=+$('year').value,idx=yr-1940;
 const regional=$('scope').value==='regions',hasCI=regional&&Boolean(bands[groups[0]][k]),showCI=hasCI&&$('ci').checked;
 $('ciLabel').hidden=!hasCI;
 document.querySelectorAll('.country').forEach(e=>e.hidden=regional);
 $('trendTitle').textContent=metrics[k][0];$('definition').textContent=metrics[k][1];
 $('yearOut').textContent=yr;
 $('legend').innerHTML=ns.map((n,i)=>'<span><svg width="29" height="10" aria-hidden="true"><line x1="0" y1="5" x2="29" y2="5" stroke="'+palette[i]+'" stroke-width="2.5" stroke-dasharray="'+dashes[i]+'"/></svg>'+n+'</span>').join('');
 const node=$('plot'),w=Math.max(270,node.clientWidth),h=w<550?252:290,L=48,R=18,T=12,B=32;
 const all=ns.flatMap(n=>[...series[n][k],...(showCI?bands[n][k].flat():[])]).filter(Number.isFinite);
 let lo=Math.min(0,...all),hi=Math.max(.01,...all);const step=pct(k)&&hi<=1&&lo>=0?.2:Math.pow(10,Math.floor(Math.log10((hi-lo)/4)))*([1,2,5,10].find(x=>x>=((hi-lo)/4)/Math.pow(10,Math.floor(Math.log10((hi-lo)/4))))||10);
 lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;if(pct(k)&&hi<=1&&lo>=0)hi=1;
 const x=i=>L+i*(w-L-R)/45,y=v=>T+(hi-v)*(h-T-B)/(hi-lo);
 plotMap={w,L,R};let body='';
 for(let t=lo;t<=hi+step*.01;t+=step){body+=line(L,y(t),w-R,y(t),'#ddd')+txt(L-8,y(t)+4,pct(k)?Math.round(100*t)+'%':String(+t.toFixed(2)),'end');}
 for(const year of (w<480?[1940,1955,1970,1985]:[1940,1950,1960,1970,1980,1985]))body+=txt(x(year-1940),h-7,year,year===1985?'end':'middle');
 if(showCI)ns.forEach((n,j)=>{let run=[];const paint=()=>{if(run.length){const points=[...run.map(i=>[x(i),y(bands[n][k][i][0])]),...run.reverse().map(i=>[x(i),y(bands[n][k][i][1])])];body+='<polygon points="'+points.map(p=>p.join(',')).join(' ')+'" fill="'+palette[j]+'" opacity=".11"/>';run=[];}};bands[n][k].forEach((v,i)=>v.every(Number.isFinite)?run.push(i):paint());paint();});
 ns.forEach((n,j)=>{let d='',start=true;series[n][k].forEach((v,i)=>{if(v==null){start=true;return;}d+=(start?'M':'L')+x(i)+' '+y(v)+' ';start=false;});body+='<path d="'+d+'" fill="none" stroke="'+palette[j]+'" stroke-width="2.7" stroke-dasharray="'+dashes[j]+'" stroke-linejoin="round"/>';});
 body+=line(x(idx),T,x(idx),h-B,'#777','3 4');ns.forEach((n,j)=>{const v=series[n][k][idx];if(v!=null)body+='<circle cx="'+x(idx)+'" cy="'+y(v)+'" r="4.5" fill="'+palette[j]+'" stroke="white" stroke-width="1.5"/>';});
 node.innerHTML='<svg role="img" aria-label="'+metrics[k][0]+' by birth year. Use the birth cohort slider or annual estimates table for exact values." viewBox="0 0 '+w+' '+h+'">'+body+'</svg>';
 $('snapshot').innerHTML=ns.map((n,i)=>'<div style="border-color:'+palette[i]+'"><span>'+n+'</span><strong>'+format(series[n][k][idx],k)+'</strong>'+(showCI?'<span>95% interval '+bands[n][k][idx].map(v=>format(v,k)).join(' to ')+'</span>':'')+'</div>').join('');
 $('chartNote').textContent=(regional?'Group estimates':'Country estimates')+' by individual birth year. '+(['beta','rho','rank_corr'].includes(k)?'The paper also shows centered five-year moving averages. ':'')+(showCI?'Shading shows pointwise country-cluster bootstrap intervals. ':'')+'Gaps indicate unavailable estimates.';
}
function updateTable(){let k=$('metric').value,ns=names();table($('trendTable'),['Birth year',...ns],years.map((yr,i)=>[yr,...ns.map(n=>format(series[n][k][i],k))]));}
function refresh(){draw();updateTable();}
function decomposition(){
 const keys=['structural','compositional'];const host=$('decompChart'),w=Math.max(270,host.clientWidth),left=w<520?96:145,right=26,top=16,h=220;
 const x=v=>left+(v+40)/60*(w-left-right);let body='';
 for(let t=-40;t<=20;t+=10)body+=line(x(t),top,x(t),h-30,t===0?'#777':'#ddd')+txt(x(t),h-8,t);
 groups.forEach((n,i)=>{let yy=top+12+43*i;body+=txt(left-7,yy+7,n,'end');keys.forEach((k,j)=>{let v=100*decomp[n][k];body+='<rect x="'+Math.min(x(v),x(0))+'" y="'+(yy-7+12*j)+'" width="'+Math.abs(x(v)-x(0))+'" height="9" fill="'+['#262626','#888'][j]+'"/>';});});
 host.innerHTML='<svg role="img" aria-label="Contributions to persistence change in percentage points, detailed in the following table." viewBox="0 0 '+w+' '+h+'">'+body+'</svg>';
 const pp=v=>(v>0?'+':'')+(100*v).toFixed(1);
 table($('decompTable'),['Regional group','Structural (pp)','Compositional (pp)','Total (pp)'],groups.map(n=>[n,...[...keys,'total_change'].map(k=>pp(decomp[n][k]))]));
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(t=>{const active=t===b;t.setAttribute('aria-pressed',active);$(t.dataset.view).hidden=!active;});if(b.dataset.view==='decomp')decomposition();if(b.dataset.view==='trends')refresh();});
for(const id of ['primary','secondary','metric','scope','ci'])$(id).onchange=refresh;
$('year').oninput=draw;$('sample').onchange=education;
$('plot').onpointermove=e=>{if(e.pointerType==='mouse')pick(e);};$('plot').onclick=pick;
function pick(e){if(!plotMap)return;const {w,L,R}=plotMap,i=Math.max(0,Math.min(45,Math.round(45*(e.clientX-$('plot').getBoundingClientRect().left-L)/(w-L-R))));if(+$('year').value!==1940+i){$('year').value=1940+i;draw();}}
$('csv').onclick=()=>{const k=$('metric').value,ns=names(),csv=[['birth_year',...ns],...years.map((yr,i)=>[yr,...ns.map(n=>series[n][k][i]??'')])].map(r=>r.join(',')).join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='ieme-'+k+'-'+$('scope').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.addEventListener('resize',()=>{if(!$('trends').hidden)draw();if(!$('decomp').hidden)decomposition();});
education();refresh();
