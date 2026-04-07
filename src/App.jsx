import { useState, useEffect, useCallback } from “react”;

const SOURCES = [“DJ”, “Agência”, “Pessoal”];

const AGENCY_CLIENTS = [
{ name: “Vila Fit”, amt: 1200 },
{ name: “Piazza Dei Fiori”, amt: 400 },
{ name: “Piazzale Itália”, amt: 400 },
{ name: “Flora Cafeteria”, amt: 400 },
{ name: “Dra Maria Clara Correia”, amt: 700 },
{ name: “Costa Barros Advogados”, amt: 1000 },
{ name: “Natal Pneus”, amt: 700 },
{ name: “Transcopel”, amt: 700 },
];
const AGENCY_MRR = AGENCY_CLIENTS.reduce((s, c) => s + c.amt, 0);
const AGENCY_FIXED_COSTS = [
{ name: “Letycia”, amt: 1900 },
{ name: “Hellen”, amt: 1600 },
{ name: “DAS MEI”, amt: 80.9 },
{ name: “Domínio”, amt: 112 },
];
const AGENCY_FIXED_TOTAL = AGENCY_FIXED_COSTS.reduce((s, c) => s + c.amt, 0);

const COMPROMISSOS = {
moradia: [
{ name: “Aluguel Apto”, amt: 1500.00 },
{ name: “Condomínio Apto”, amt: 490.79 },
{ name: “Cosern (energia)”, amt: 354.88 },
{ name: “Ultragaz”, amt: 25.28 },
],
saude: [
{ name: “Unimed”, amt: 707.02 },
{ name: “Prudential (seguro vida)”, amt: 489.49, note: “⚠️ cancelar quando possível” },
],
carro: [
{ name: “Financiamento Carro (Inter)”, amt: 1800.90 },
{ name: “Seguro do Carro”, amt: 230.20 },
],
comunicacao: [
{ name: “Claro Multi”, amt: 229.80 },
{ name: “Alares / Internet”, amt: 109.96 },
],
dividas: [
{ name: “Joalmi”, amt: 1250.00 },
{ name: “Acordo Serasa”, amt: 165.63 },
],
assinaturas: [
{ name: “Adobe”, amt: 189.00 },
{ name: “Kinghost (hospedagem)”, amt: 131.84 },
{ name: “Apple (iCloud/serviços)”, amt: 120.80 },
{ name: “Microsoft 365”, amt: 60.00 },
{ name: “Amazon Prime”, amt: 54.80 },
{ name: “Anuidade Porto Seguro”, amt: 39.00 },
{ name: “Globoplay”, amt: 14.90 },
],
parcelados: [
{ name: “Claro (21x)”, amt: 470.90, remaining: 14 },
{ name: “Airbnb Salvador (6x)”, amt: 888.90, remaining: 3 },
{ name: “ADY*Ingresse (4x)”, amt: 1058.75, remaining: 1 },
{ name: “Smiles Bilhete (6x)”, amt: 311.00, remaining: 3 },
{ name: “Esfera Milhas (12x)”, amt: 224.00, remaining: 9 },
{ name: “Smiles novo (6x)”, amt: 237.00, remaining: 5 },
{ name: “MP*6Produtos (12x)”, amt: 505.97, remaining: 6 },
{ name: “MP*6Produtos 2 (12x)”, amt: 28.56, remaining: 6 },
{ name: “Garmin (10x)”, amt: 149.32, remaining: 4 },
{ name: “Netshoes (10x)”, amt: 89.99, remaining: 4 },
{ name: “Club Wine (12x)”, amt: 71.25, remaining: 4 },
{ name: “Woom (5x)”, amt: 50.40, remaining: 4 },
{ name: “Amazon Mala (5x)”, amt: 109.80, remaining: 2 },
{ name: “Amazon BR (3x)”, amt: 71.75, remaining: 2 },
{ name: “X iPhone (10x)”, amt: 748.00, remaining: 1 },
{ name: “Cavalcanti Marinho (10x)”, amt: 169.90, remaining: 1 },
{ name: “Globoplay (12x)”, amt: 14.90, remaining: 4 },
],
};

const COMMIT_LABELS = {
moradia: “🏠 Moradia”,
saude: “💊 Saúde”,
carro: “🚗 Carro”,
comunicacao: “📡 Comunicação”,
dividas: “💳 Dívidas”,
assinaturas: “📱 Assinaturas”,
parcelados: “📦 Parcelados”,
};

const EXPENSE_CATS = [
{ name: “Alimentação”, emoji: “🍽️”, color: “#f1c40f” },
{ name: “Mercado”, emoji: “🛒”, color: “#2ecc71” },
{ name: “Carro”, emoji: “⛽”, color: “#3498db” },
{ name: “Pets”, emoji: “🐾”, color: “#e67e22” },
{ name: “Moradia”, emoji: “🏠”, color: “#9b59b6” },
{ name: “Saúde”, emoji: “💊”, color: “#1abc9c” },
{ name: “Compras”, emoji: “🛍️”, color: “#e74c3c” },
{ name: “Lazer”, emoji: “🎉”, color: “#ff6b35” },
{ name: “Viagem”, emoji: “✈️”, color: “#00bcd4” },
{ name: “Financiamento”, emoji: “💳”, color: “#c8f135” },
{ name: “Equip/Tech”, emoji: “📱”, color: “#607d8b” },
{ name: “Salários”, emoji: “👥”, color: “#ff9800” },
{ name: “Impostos”, emoji: “🧾”, color: “#78909c” },
{ name: “Outros”, emoji: “📦”, color: “#555” },
];

const MONTHS = [“Jan”,“Fev”,“Mar”,“Abr”,“Mai”,“Jun”,“Jul”,“Ago”,“Set”,“Out”,“Nov”,“Dez”];
function fmt(n) { return Number(n||0).toLocaleString(“pt-BR”,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function todayStr() { return new Date().toISOString().slice(0,10); }
function monthKey(d) { return d.slice(0,7); }
function monthLabel(k) { const [y,m]=k.split(”-”); return `${MONTHS[parseInt(m)-1]}/${y.slice(2)}`; }
function currentMonthKey() { return new Date().toISOString().slice(0,7); }

const TOTAL_FIXO = Object.entries(COMPROMISSOS).reduce((total, [key, items]) => {
if (key === “parcelados”) return total + items.reduce((s,i)=>s+i.amt,0);
return total + items.reduce((s,i)=>s+i.amt,0);
}, 0);

export default function App() {
const [entries, setEntries] = useState([]);
const [projects, setProjects] = useState([]);
const [view, setView] = useState(“dashboard”);
const [toast, setToast] = useState(null);
const [saving, setSaving] = useState(false);
const [filterMonth, setFilterMonth] = useState(currentMonthKey());
const [listSource, setListSource] = useState(“todos”);
const [projView, setProjView] = useState(false);
const [commitSection, setCommitSection] = useState(“moradia”);

const [type, setType] = useState(“entrada”);
const [desc, setDesc] = useState(””);
const [amt, setAmt] = useState(””);
const [cat, setCat] = useState(“Alimentação”);
const [date, setDate] = useState(todayStr());
const [entrySource, setEntrySource] = useState(“DJ”);
const [projClient, setProjClient] = useState(””);
const [projAmt, setProjAmt] = useState(””);
const [projDate, setProjDate] = useState(todayStr());
const [projPaid, setProjPaid] = useState(false);

useEffect(() => {
(async () => {
try {
const r = await window.storage.get(“financas_v2”);
if (r) { const d = JSON.parse(r.value); setEntries(d.entries||[]); setProjects(d.projects||[]); }
} catch {}
})();
}, []);

const save = useCallback(async (e, p) => {
setSaving(true);
try { await window.storage.set(“financas_v2”, JSON.stringify({entries:e,projects:p})); } catch {}
setSaving(false);
}, []);

const showToast = (msg, color=”#c8f135”) => { setToast({msg,color}); setTimeout(()=>setToast(null),2200); };

const addEntry = () => {
const parsed = parseFloat(amt.replace(”,”,”.”));
if (!desc.trim()||isNaN(parsed)||parsed<=0) { showToast(“Preencha todos os campos”,”#ff4444”); return; }
const e = {id:Date.now(),type,desc:desc.trim(),amt:parsed,cat:type===“saída”?cat:null,source:entrySource,date};
const updated = [e,…entries];
setEntries(updated); save(updated,projects);
setDesc(””); setAmt(””);
showToast(type===“entrada”?“Entrada registrada ✓”:“Saída registrada ✓”);
};

const addProject = () => {
const parsed = parseFloat(projAmt.replace(”,”,”.”));
if (!projClient.trim()||isNaN(parsed)||parsed<=0) { showToast(“Preencha cliente e valor”,”#ff4444”); return; }
const p = {id:Date.now(),client:projClient.trim(),amt:parsed,date:projDate,received:projPaid,month:monthKey(projDate)};
const updated = [p,…projects];
setProjects(updated); save(entries,updated);
setProjClient(””); setProjAmt(””); setProjPaid(false);
showToast(“Projeto registrado ✓”,”#35c8f1”);
};

const toggleReceived = (id) => {
const updated = projects.map(p=>p.id===id?{…p,received:!p.received}:p);
setProjects(updated); save(entries,updated);
};

const delEntry = (id) => { const u=entries.filter(e=>e.id!==id); setEntries(u); save(u,projects); };
const delProject = (id) => { const u=projects.filter(p=>p.id!==id); setProjects(u); save(entries,u); };

const allMonths = […new Set([…entries.map(e=>monthKey(e.date)),…projects.map(p=>p.month)])].sort().reverse();

function srcStats(src, month) {
const data = entries.filter(e=>monthKey(e.date)===month&&e.source===src);
const ins = data.filter(e=>e.type===“entrada”).reduce((s,e)=>s+e.amt,0);
const outs = data.filter(e=>e.type===“saída”).reduce((s,e)=>s+e.amt,0);
return {ins, outs, net: ins-outs};
}

const monthProjs = projects.filter(p=>p.month===filterMonth);
const projReceivedAmt = monthProjs.filter(p=>p.received).reduce((s,p)=>s+p.amt,0);
const projPendingAmt = monthProjs.filter(p=>!p.received).reduce((s,p)=>s+p.amt,0);

const dj = srcStats(“DJ”, filterMonth);
const ag = srcStats(“Agência”, filterMonth);
const pes = srcStats(“Pessoal”, filterMonth);
const agTotalIn = AGENCY_MRR + projReceivedAmt + ag.ins;
const agNet = agTotalIn - ag.outs - AGENCY_FIXED_TOTAL;
const totalNet = dj.net + agNet + pes.net;

const S = {
bg:”#0a0a0a”, surface:”#111”, surface2:”#161616”, border:”#1e1e1e”,
accent:”#c8f135”, text:”#f0f0f0”, muted:”#555”,
dj:”#ff6b35”, ag:”#35c8f1”, pes:”#a78bfa”, danger:”#ff4444”, warn:”#ffaa00”,
};
const srcColor = {“DJ”:S.dj,“Agência”:S.ag,“Pessoal”:S.pes};

const Label = ({children}) => <div style={{fontSize:10,color:S.muted,textTransform:“uppercase”,letterSpacing:1,display:“block”,marginBottom:6}}>{children}</div>;
const MiniStat = ({label,value,color}) => (
<div style={{flex:1,background:S.surface2,borderRadius:8,padding:“8px 10px”}}>
<div style={{fontSize:9,color:S.muted,marginBottom:3}}>{label}</div>
<div style={{fontSize:13,color,fontWeight:600}}>R$ {fmt(value)}</div>
</div>
);

const monthTabs = [currentMonthKey(),…allMonths.filter(m=>m!==currentMonthKey())].slice(0,6);

return (
<div style={{minHeight:“100vh”,background:S.bg,color:S.text,fontFamily:”‘IBM Plex Mono’,monospace”,maxWidth:480,margin:“0 auto”,paddingBottom:80}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} input{outline:none} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#222;border-radius:2px} @keyframes su{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}} .su{animation:su 0.2s ease} .row:hover{background:#1a1a1a!important} .delbtn{opacity:0;transition:opacity 0.15s} .row:hover .delbtn{opacity:1}`}</style>

```
  {/* HEADER */}
  <div style={{padding:"20px 20px 0",borderBottom:`1px solid ${S.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
      <div>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,color:S.accent}}>FINANCEIRO</div>
        <div style={{fontSize:10,color:S.muted,marginTop:2}}>{saving?"salvando...":monthLabel(filterMonth)}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:10,color:S.muted}}>resultado do mês</div>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:22,color:totalNet>=0?S.accent:S.danger}}>
          {totalNet>=0?"+":""}R$ {fmt(totalNet)}
        </div>
      </div>
    </div>
    <div style={{display:"flex"}}>
      {[["dashboard","📊"],["add","＋"],["list","☰"],["compromissos","🔒"]].map(([v,l])=>(
        <button key={v} onClick={()=>setView(v)} style={{
          flex:1,padding:"10px 0",background:"none",border:"none",
          borderBottom:view===v?`2px solid ${S.accent}`:"2px solid transparent",
          color:view===v?S.accent:S.muted,fontFamily:"'IBM Plex Mono'",fontSize:12,cursor:"pointer",fontWeight:600,
        }}>{l}</button>
      ))}
    </div>
  </div>

  {/* MONTH TABS */}
  {view !== "compromissos" && (
    <div style={{display:"flex",gap:6,overflowX:"auto",padding:"12px 20px 0"}}>
      {monthTabs.map(m=>(
        <button key={m} onClick={()=>setFilterMonth(m)} style={{
          flexShrink:0,padding:"5px 10px",borderRadius:4,cursor:"pointer",
          background:filterMonth===m?S.accent:S.surface,
          border:`1px solid ${filterMonth===m?S.accent:S.border}`,
          color:filterMonth===m?"#000":S.muted,
          fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600,
        }}>{monthLabel(m)}</button>
      ))}
    </div>
  )}

  {/* ── DASHBOARD ── */}
  {view==="dashboard" && (
    <div className="su" style={{padding:"12px 20px 0"}}>
      {/* DJ */}
      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,padding:16,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>🎧 DJ</span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:dj.net>=0?S.dj:S.danger}}>{dj.net>=0?"+":""}R$ {fmt(dj.net)}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <MiniStat label="RECEBIDO" value={dj.ins} color={S.accent}/>
          <MiniStat label="SAÍDAS" value={dj.outs} color={S.danger}/>
        </div>
      </div>

      {/* Agência */}
      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,padding:16,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>📣 Agência</span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:agNet>=0?S.ag:S.danger}}>{agNet>=0?"+":""}R$ {fmt(agNet)}</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <MiniStat label="MRR FIXO" value={AGENCY_MRR} color={S.ag}/>
          <MiniStat label="IDs RECEBIDAS" value={projReceivedAmt} color={S.accent}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <MiniStat label="IDs A RECEBER" value={projPendingAmt} color={S.warn}/>
          <MiniStat label="CUSTOS FIXOS" value={AGENCY_FIXED_TOTAL} color={S.danger}/>
        </div>
        {monthProjs.length>0 && (
          <div style={{marginTop:12,borderTop:`1px solid ${S.border}`,paddingTop:10}}>
            <div style={{fontSize:9,color:S.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>🎨 Identidades Visuais</div>
            {monthProjs.map(p=>(
              <div key={p.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",background:S.surface2,borderRadius:6,marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>toggleReceived(p.id)} style={{width:16,height:16,borderRadius:4,flexShrink:0,cursor:"pointer",border:`1.5px solid ${p.received?S.accent:S.muted}`,background:p.received?S.accent:"transparent"}}/>
                  <div>
                    <div style={{fontSize:11}}>{p.client}</div>
                    <div style={{fontSize:9,color:S.muted}}>{p.received?"✓ recebido":"pendente"}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:p.received?S.accent:S.warn,fontWeight:600}}>R$ {fmt(p.amt)}</span>
                  <button className="delbtn" onClick={()=>delProject(p.id)} style={{background:"none",border:"none",color:S.muted,cursor:"pointer",fontSize:12}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:10,fontSize:10,color:S.muted,borderTop:`1px solid ${S.border}`,paddingTop:8}}>
          Margem base (MRR − fixos): R$ {fmt(AGENCY_MRR-AGENCY_FIXED_TOTAL)}/mês
        </div>
      </div>

      {/* Pessoal */}
      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,padding:16,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:15}}>👤 Pessoal</span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:18,color:pes.net>=0?S.pes:S.danger}}>{pes.net>=0?"+":""}R$ {fmt(pes.net)}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <MiniStat label="ENTRADAS" value={pes.ins} color={S.accent}/>
          <MiniStat label="SAÍDAS" value={pes.outs} color={S.danger}/>
        </div>
      </div>

      {/* Compromissos resumo */}
      <div style={{background:S.surface,border:`1px solid #ff444433`,borderRadius:12,padding:16,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:14}}>🔒 Comprometido/mês</span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:S.danger}}>R$ {fmt(TOTAL_FIXO)}</span>
        </div>
        <div style={{fontSize:10,color:S.muted}}>fixos + parcelados + assinaturas · ver detalhes em 🔒</div>
      </div>
    </div>
  )}

  {/* ── ADD ── */}
  {view==="add" && (
    <div className="su" style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={()=>setProjView(false)} style={{flex:1,padding:10,borderRadius:8,cursor:"pointer",background:!projView?`${S.accent}15`:"transparent",border:`1px solid ${!projView?S.accent:S.border}`,color:!projView?S.accent:S.muted,fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600}}>Entrada / Saída</button>
        <button onClick={()=>setProjView(true)} style={{flex:1,padding:10,borderRadius:8,cursor:"pointer",background:projView?`${S.ag}15`:"transparent",border:`1px solid ${projView?S.ag:S.border}`,color:projView?S.ag:S.muted,fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600}}>🎨 ID Visual</button>
      </div>

      {!projView ? (
        <>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["entrada","saída"].map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"10px",borderRadius:8,cursor:"pointer",background:type===t?(t==="entrada"?S.accent:S.danger):"transparent",border:`1px solid ${type===t?(t==="entrada"?S.accent:S.danger):S.border}`,color:type===t?"#000":S.muted,fontFamily:"'IBM Plex Mono'",fontWeight:700,fontSize:13}}>{t==="entrada"?"↑ Entrada":"↓ Saída"}</button>
            ))}
          </div>

          <div style={{marginBottom:12}}>
            <Label>Fonte</Label>
            <div style={{display:"flex",gap:8}}>
              {SOURCES.map(s=>(
                <button key={s} onClick={()=>setEntrySource(s)} style={{flex:1,padding:"9px 4px",borderRadius:8,cursor:"pointer",background:entrySource===s?`${srcColor[s]}18`:"transparent",border:`1.5px solid ${entrySource===s?srcColor[s]:S.border}`,color:entrySource===s?srcColor[s]:S.muted,fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600}}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <Label>Descrição</Label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
              placeholder={entrySource==="DJ"&&type==="entrada"?"ex: Casamento João & Maria":"ex: Gasolina"}
              style={{width:"100%",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 14px",color:S.text,fontFamily:"'IBM Plex Mono'",fontSize:14}}/>
          </div>

          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{flex:1}}>
              <Label>Valor (R$)</Label>
              <input value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0,00" inputMode="decimal"
                style={{width:"100%",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 14px",color:type==="entrada"?S.accent:S.danger,fontFamily:"Syne",fontSize:18,fontWeight:700}}/>
            </div>
            <div style={{flex:1}}>
              <Label>Data</Label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{width:"100%",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 10px",color:S.text,fontFamily:"'IBM Plex Mono'",fontSize:12,colorScheme:"dark"}}/>
            </div>
          </div>

          {type==="saída" && (
            <div style={{marginBottom:14}}>
              <Label>Categoria</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {EXPENSE_CATS.map(c=>(
                  <button key={c.name} onClick={()=>setCat(c.name)} style={{padding:"5px 10px",borderRadius:20,cursor:"pointer",border:`1.5px solid ${cat===c.name?c.color:S.border}`,background:cat===c.name?`${c.color}18`:"transparent",color:cat===c.name?c.color:S.muted,fontSize:11,fontFamily:"'IBM Plex Mono'"}}>{c.emoji} {c.name}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={addEntry} style={{width:"100%",padding:14,background:type==="entrada"?S.accent:S.danger,border:"none",borderRadius:10,color:"#000",fontFamily:"Syne",fontWeight:800,fontSize:15,cursor:"pointer"}}>
            {type==="entrada"?"REGISTRAR ENTRADA":"REGISTRAR SAÍDA"}
          </button>
        </>
      ) : (
        <>
          <div style={{fontSize:11,color:S.muted,marginBottom:16,lineHeight:1.7,background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:12}}>
            Registre projetos de identidade visual. Marque ✓ quando o pagamento entrar.
          </div>
          <div style={{marginBottom:12}}>
            <Label>Cliente</Label>
            <input value={projClient} onChange={e=>setProjClient(e.target.value)} placeholder="ex: Maria Letícia"
              style={{width:"100%",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 14px",color:S.text,fontFamily:"'IBM Plex Mono'",fontSize:14}}/>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{flex:1}}>
              <Label>Valor (R$)</Label>
              <input value={projAmt} onChange={e=>setProjAmt(e.target.value)} placeholder="0,00" inputMode="decimal"
                style={{width:"100%",background:S.surface,border:`1px solid ${S.ag}`,borderRadius:8,padding:"12px 14px",color:S.ag,fontFamily:"Syne",fontSize:18,fontWeight:700}}/>
            </div>
            <div style={{flex:1}}>
              <Label>Data</Label>
              <input type="date" value={projDate} onChange={e=>setProjDate(e.target.value)}
                style={{width:"100%",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 10px",color:S.text,fontFamily:"'IBM Plex Mono'",fontSize:12,colorScheme:"dark"}}/>
            </div>
          </div>
          <button onClick={()=>setProjPaid(!projPaid)} style={{width:"100%",padding:"10px",borderRadius:8,cursor:"pointer",marginBottom:14,background:projPaid?`${S.accent}18`:"transparent",border:`1.5px solid ${projPaid?S.accent:S.border}`,color:projPaid?S.accent:S.muted,fontFamily:"'IBM Plex Mono'",fontSize:12,fontWeight:600}}>
            {projPaid?"✓ Já recebi este pagamento":"○ Pagamento pendente"}
          </button>
          <button onClick={addProject} style={{width:"100%",padding:14,background:S.ag,border:"none",borderRadius:10,color:"#000",fontFamily:"Syne",fontWeight:800,fontSize:15,cursor:"pointer"}}>REGISTRAR PROJETO</button>
        </>
      )}
    </div>
  )}

  {/* ── LIST ── */}
  {view==="list" && (
    <div className="su" style={{padding:"12px 20px 0"}}>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["todos",...SOURCES].map(s=>(
          <button key={s} onClick={()=>setListSource(s)} style={{padding:"5px 10px",borderRadius:4,fontSize:11,cursor:"pointer",background:listSource===s?`${s==="todos"?"#fff":srcColor[s]}15`:"transparent",border:`1px solid ${listSource===s?(s==="todos"?S.accent:srcColor[s]):S.border}`,color:listSource===s?(s==="todos"?S.accent:srcColor[s]):S.muted,fontFamily:"'IBM Plex Mono'",fontWeight:600}}>{s==="todos"?"Todos":s}</button>
        ))}
      </div>

      {(listSource==="todos"||listSource==="Agência") && monthProjs.map(p=>(
        <div key={p.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:S.surface,borderRadius:8,marginBottom:6,border:`1px solid ${S.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>toggleReceived(p.id)} style={{width:16,height:16,borderRadius:4,flexShrink:0,cursor:"pointer",border:`1.5px solid ${p.received?S.accent:S.muted}`,background:p.received?S.accent:"transparent"}}/>
            <div>
              <div style={{fontSize:12}}>🎨 {p.client}</div>
              <div style={{fontSize:10,color:S.muted}}>ID Visual · {p.received?"recebido":"a receber"}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:p.received?S.accent:S.warn}}>R$ {fmt(p.amt)}</span>
            <button className="delbtn" onClick={()=>delProject(p.id)} style={{background:"none",border:"none",color:S.muted,cursor:"pointer",fontSize:13}}>✕</button>
          </div>
        </div>
      ))}

      {entries.filter(e=>monthKey(e.date)===filterMonth&&(listSource==="todos"||e.source===listSource)).length===0&&monthProjs.length===0
        ? <div style={{textAlign:"center",color:S.muted,fontSize:13,marginTop:40}}>Nenhum registro</div>
        : entries.filter(e=>monthKey(e.date)===filterMonth&&(listSource==="todos"||e.source===listSource)).map(e=>{
          const catObj=EXPENSE_CATS.find(c=>c.name===e.cat);
          return (
            <div key={e.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:S.surface,borderRadius:8,marginBottom:6,border:`1px solid ${S.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <span style={{fontSize:14,color:e.type==="entrada"?S.accent:S.danger}}>{e.type==="entrada"?"↑":"↓"}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:190}}>{e.desc}</div>
                  <div style={{fontSize:10,color:S.muted}}>{e.date.split("-").reverse().join("/")} · <span style={{color:srcColor[e.source]}}>{e.source}</span>{e.cat?` · ${catObj?.emoji||""} ${e.cat}`:""}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:e.type==="entrada"?S.accent:S.danger}}>{e.type==="entrada"?"+":"-"}R$ {fmt(e.amt)}</span>
                <button className="delbtn" onClick={()=>delEntry(e.id)} style={{background:"none",border:"none",color:S.muted,cursor:"pointer",fontSize:13}}>✕</button>
              </div>
            </div>
          );
        })
      }
    </div>
  )}

  {/* ── COMPROMISSOS ── */}
  {view==="compromissos" && (
    <div className="su" style={{padding:"16px 20px 0"}}>
      {/* Total */}
      <div style={{background:S.surface,border:`1px solid #ff444433`,borderRadius:12,padding:16,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14}}>Total comprometido</div>
          <div style={{fontSize:10,color:S.muted,marginTop:2}}>todo mês, antes de gastar</div>
        </div>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:22,color:S.danger}}>R$ {fmt(TOTAL_FIXO)}</div>
      </div>

      {/* Section tabs */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2}}>
        {Object.keys(COMPROMISSOS).map(k=>(
          <button key={k} onClick={()=>setCommitSection(k)} style={{
            flexShrink:0,padding:"6px 10px",borderRadius:4,cursor:"pointer",fontSize:10,
            background:commitSection===k?S.accent:S.surface,
            border:`1px solid ${commitSection===k?S.accent:S.border}`,
            color:commitSection===k?"#000":S.muted,
            fontFamily:"'IBM Plex Mono'",fontWeight:600,
          }}>{COMMIT_LABELS[k]}</button>
        ))}
      </div>

      {/* Section total */}
      <div style={{fontSize:10,color:S.muted,textAlign:"right",marginBottom:8}}>
        subtotal: R$ {fmt(COMPROMISSOS[commitSection].reduce((s,i)=>s+i.amt,0))}
      </div>

      {/* Items */}
      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden"}}>
        {COMPROMISSOS[commitSection].map((item,i)=>(
          <div key={i} style={{padding:"12px 14px",borderBottom:i<COMPROMISSOS[commitSection].length-1?`1px solid ${S.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12}}>{item.name}</span>
              <span style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:item.note?S.warn:S.danger}}>R$ {fmt(item.amt)}</span>
            </div>
            {item.note && <div style={{fontSize:10,color:S.warn,marginTop:3}}>{item.note}</div>}
            {item.remaining !== undefined && (
              <div style={{fontSize:10,color:S.muted,marginTop:3}}>
                {item.remaining} {item.remaining===1?"parcela restante":"parcelas restantes"} · total restante: R$ {fmt(item.amt * item.remaining)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )}

  {toast&&(
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:S.surface,border:`1px solid ${S.border}`,borderRadius:8,padding:"10px 18px",fontSize:12,color:toast.color,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}>
      {toast.msg}
    </div>
  )}
</div>
```

);
}
