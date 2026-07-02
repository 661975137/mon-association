import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Users, Wallet, BarChart3, Settings, Plus, X, Pencil, Trash2,
  Search, AlertTriangle, TrendingUp, TrendingDown, Download, Printer,
  ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";

/* ======================== DESIGN TOKENS ======================== */
const C = {
  ink:       "#1C2541",
  paper:     "#F7F3E9",
  line:      "#DED5BE",
  cream:     "#FCFAF4",
  brass:     "#B8893B",
  brassDark: "#8C6526",
  sage:      "#4F6F52",
  sageL:     "#7C9B7E",
  rust:      "#A8442E",
  rustL:     "#C2604A",
  slate:     "#6B6558",
  gold:      "#D4AF37"
};

const FD = "Fraunces, serif";
const FB = "'IBM Plex Sans', sans-serif";
const FM = "'IBM Plex Mono', monospace";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;

const iStyle = {
  background: C.paper, border: `1px solid ${C.line}`, borderRadius: "2px",
  padding: "9px 10px", fontSize: "14px", color: C.ink, fontFamily: FB, width: "100%"
};

/* ======================== CONSTANTES ======================== */
const CAT_IN  = ["Cotisations","Dons","Subventions","Événements","Aide externe","Autres recettes"];
const CAT_OUT = ["Matériel","Location salle","Déplacement","Communication","Assurance","Événements","Fonctionnement","Autres dépenses"];
const STATUTS = [
  { value:"paid",    label:"Réglé",      color: C.sage },
  { value:"pending", label:"En attente", color: C.brass },
  { value:"late",    label:"En retard",  color: C.rust }
];
const MOIS_COURT = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"];
const MOIS_LONG  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const PAL = [C.ink,C.brass,C.sage,C.rust,C.slate,C.sageL,C.rustL,C.brassDark];

/* ======================== HELPERS ======================== */
function uid()     { return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function today()   { return new Date().toISOString().slice(0,10); }

function fcfa(n) {
  const v = Number(n)||0;
  return v.toLocaleString("fr-FR") + " FCFA";
}

function dateF(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
}

function moisLabel(key) {
  if (!key||key==="inconnu") return "Sans date";
  const [y,m] = key.split("-");
  return `${MOIS_LONG[Number(m)-1]} ${y}`;
}

function groupByMonth(txs) {
  const g={};
  txs.forEach(t=>{ const k=(t.date||"").slice(0,7)||"inconnu"; if(!g[k])g[k]=[]; g[k].push(t); });
  return Object.keys(g).sort((a,b)=>b.localeCompare(a)).map(k=>({
    key:k, label:moisLabel(k),
    items: g[k].sort((a,b)=>(b.date||"").localeCompare(a.date||"")),
    sous: g[k].reduce((s,t)=>s+(t.type==="income"?+t.amount:-+t.amount),0)
  }));
}

function catBreak(txs,type) {
  const m={};
  txs.filter(t=>t.type===type).forEach(t=>{ m[t.category]=(m[t.category]||0)+(+t.amount); });
  return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}

async function loadKey(k,fb) {
  try { const r=await window.storage.get(k,true); if(r&&typeof r.value==="string") return JSON.parse(r.value); return fb; }
  catch(e) { return fb; }
}
async function saveKey(k,v) {
  try { await window.storage.set(k,JSON.stringify(v),true); } catch(e) {}
}

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(";"), ...data.map(r=>keys.map(k=>`"${String(r[k]||"").replace(/"/g,'""')}"`).join(";"))];
  const blob = new Blob(["\uFEFF"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ======================== MICRO-COMPONENTS ======================== */

function StatusBadge({status}) {
  const s = STATUTS.find(x=>x.value===status)||STATUTS[1];
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      padding:"3px 10px", borderRadius:"99px",
      border:`2px dashed ${s.color}`, color:s.color,
      transform:"rotate(-3deg)", fontFamily:FM,
      fontSize:"10px", fontWeight:600, letterSpacing:"0.08em",
      textTransform:"uppercase", whiteSpace:"nowrap"
    }}>{s.label}</span>
  );
}

function StatCard({label,value,icon:Icon,accent,sub}) {
  return (
    <div className="p-4 sm:p-5 rounded-sm" style={{background:C.cream,borderTop:`3px solid ${accent||C.brass}`,boxShadow:"0 1px 3px rgba(28,37,65,0.08)"}}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest font-medium" style={{color:C.slate}}>{label}</span>
        {Icon && <Icon size={15} style={{color:accent||C.brass}}/>}
      </div>
      <div className="text-xl sm:text-2xl font-semibold" style={{fontFamily:FM,color:C.ink}}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{color:C.slate,fontFamily:FM}}>{sub}</div>}
    </div>
  );
}

function Field({label,children}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({title,onClose,children,wide}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className={`w-full ${wide?"sm:max-w-2xl":"sm:max-w-md"} rounded-t-2xl sm:rounded-sm overflow-y-auto`}
        style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({message,onConfirm,onCancel}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(28,37,65,0.6)"}} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-sm p-5" style={{background:C.cream}} onClick={e=>e.stopPropagation()}>
        <p className="text-sm mb-5" style={{color:C.ink}}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.rust,color:C.cream}}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

/* ======================== TRANSACTION ROW ======================== */
function TxRow({tx,onEdit,onDelete,readOnly}) {
  const isIn = tx.type==="income";
  return (
    <div className="flex items-center gap-3 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="w-[68px] sm:w-24 shrink-0" style={{fontFamily:FM,color:C.slate,fontSize:"11px"}}>{dateF(tx.date)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{color:C.ink}}>{tx.description||tx.category}</div>
        <div style={{color:C.slate,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{tx.category}</div>
      </div>
      <div className="text-sm font-semibold shrink-0 text-right" style={{fontFamily:FM,color:isIn?C.sage:C.rust,minWidth:"100px"}}>
        {isIn?"+ ":"− "}{fcfa(Math.abs(tx.amount))}
      </div>
      {!readOnly && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={()=>onEdit(tx)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>
          <button onClick={()=>onDelete(tx)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>
        </div>
      )}
    </div>
  );
}

/* ======================== MEMBER CARD ======================== */
function MemberCard({member,annee,onEdit,onDelete,onMarkPaid,onHistory}) {
  const cotAnnee = member.cotisations?.[annee]||{status:"pending",date:""};
  const [open,setOpen] = useState(false);
  return (
    <div style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button onClick={()=>setOpen(!open)} className="text-left">
              <div style={{color:C.ink,fontFamily:FD,fontSize:"17px"}}>{member.name}</div>
            </button>
            <div className="text-xs" style={{color:C.slate}}>
              {member.email||"Pas d'email"}{member.phone?` · ${member.phone}`:""}
            </div>
          </div>
          <StatusBadge status={cotAnnee.status}/>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{color:C.slate,fontFamily:FM,fontSize:"12px"}}>
          <span>Cotisation {annee} : {fcfa(member.cotisationAmount)}</span>
          {cotAnnee.date && <span>Payé le {dateF(cotAnnee.date)}</span>}
        </div>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {cotAnnee.status!=="paid" && (
            <button onClick={()=>onMarkPaid(member)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{background:C.sage,color:C.cream}}>
              ✓ Marquer réglé {annee}
            </button>
          )}
          <button onClick={()=>onHistory(member)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>
            Historique
          </button>
          <button onClick={()=>onEdit(member)} className="p-1.5 rounded hover:bg-black/5 ml-auto"><Pencil size={14} style={{color:C.slate}}/></button>
          <button onClick={()=>onDelete(member)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={14} style={{color:C.slate}}/></button>
        </div>
      </div>
    </div>
  );
}

/* ======================== MEMBER HISTORY MODAL ======================== */
function HistoryModal({member,onClose}) {
  const cots = member.cotisations||{};
  const annees = Object.keys(cots).sort((a,b)=>b.localeCompare(a));
  return (
    <ModalShell title={`Historique – ${member.name}`} onClose={onClose}>
      {annees.length===0
        ? <p className="text-sm text-center py-8" style={{color:C.slate}}>Aucun paiement enregistré.</p>
        : (
          <div className="flex flex-col gap-2">
            {annees.map(a=>{
              const e = cots[a];
              const s = STATUTS.find(x=>x.value===e.status)||STATUTS[1];
              return (
                <div key={a} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{background:C.paper}}>
                  <div>
                    <span style={{fontFamily:FM,color:C.ink,fontWeight:600}}>{a}</span>
                    {e.date && <span className="text-xs ml-2" style={{color:C.slate}}>Payé le {dateF(e.date)}</span>}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded" style={{background:`${s.color}18`,color:s.color}}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )
      }
      <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Fermer</button>
    </ModalShell>
  );
}

/* ======================== RECU MODAL ======================== */
function RecuModal({member,tx,assocName,onClose}) {
  const printRef = useRef();
  const handlePrint = () => {
    const w = window.open("","_blank","width=600,height=800");
    w.document.write(`<html><head><title>Reçu cotisation</title>
    <style>
      body{font-family:'Arial',sans-serif;padding:40px;color:#1C2541;background:#fff;}
      .header{text-align:center;margin-bottom:30px;border-bottom:3px solid #B8893B;padding-bottom:20px;}
      .asso{font-size:22px;font-weight:bold;color:#1C2541;}
      .subtitle{font-size:13px;color:#6B6558;margin-top:4px;}
      .badge{font-size:28px;font-weight:bold;text-align:center;border:3px solid #4F6F52;
             color:#4F6F52;padding:12px 30px;display:inline-block;margin:20px auto;
             transform:rotate(-2deg);border-radius:4px;}
      .body-wrap{text-align:center;}
      table{width:100%;border-collapse:collapse;margin-top:24px;}
      td{padding:8px 12px;border-bottom:1px solid #DED5BE;font-size:13px;}
      td:first-child{color:#6B6558;width:40%;}
      td:last-child{font-weight:600;}
      .footer{margin-top:40px;text-align:center;font-size:11px;color:#6B6558;}
      @media print{body{padding:20px;}button{display:none;}}
    </style></head><body>
    <div class="header">
      <div class="asso">${assocName}</div>
      <div class="subtitle">Reçu de cotisation</div>
    </div>
    <div class="body-wrap">
      <div class="badge">RÉGLÉ ✓</div>
    </div>
    <table>
      <tr><td>Bénéficiaire</td><td>${member.name}</td></tr>
      ${member.email?`<tr><td>Email</td><td>${member.email}</td></tr>`:""}
      <tr><td>Montant</td><td>${fcfa(tx?.amount||member.cotisationAmount)}</td></tr>
      <tr><td>Date de paiement</td><td>${dateF(tx?.date||today())}</td></tr>
      <tr><td>Référence</td><td>${tx?.id||"—"}</td></tr>
    </table>
    <div class="footer">
      Ce document tient lieu de reçu de cotisation. Merci de votre adhésion.<br/>
      Émis le ${dateF(today())} – ${assocName}
    </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),400);
  };
  return (
    <ModalShell title="Aperçu du reçu" onClose={onClose}>
      <div className="rounded-sm p-5 text-center mb-4" style={{background:C.paper,border:`1px dashed ${C.line}`}}>
        <div className="text-lg font-semibold mb-1" style={{fontFamily:FD,color:C.ink}}>{assocName}</div>
        <div className="text-xs uppercase tracking-widest mb-4" style={{color:C.slate}}>Reçu de cotisation</div>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-sm mb-4" style={{border:`2px solid ${C.sage}`,color:C.sage,transform:"rotate(-2deg)"}}>
          <CheckCircle2 size={16}/> <span style={{fontFamily:FM,fontWeight:700,fontSize:"13px"}}>RÉGLÉ</span>
        </div>
        <div className="text-left mt-4 flex flex-col gap-2">
          {[["Membre",member.name],[member.email&&"Email",member.email],["Montant",fcfa(tx?.amount||member.cotisationAmount)],["Date",dateF(tx?.date||today())]].filter(r=>r&&r[0]).map(([k,v])=>(
            <div key={k} className="flex justify-between text-sm" style={{borderBottom:`1px solid ${C.line}`,paddingBottom:"6px"}}>
              <span style={{color:C.slate}}>{k}</span>
              <span style={{color:C.ink,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>
        <Printer size={16}/> Imprimer / Télécharger PDF
      </button>
    </ModalShell>
  );
}

/* ======================== MEMBER MODAL ======================== */
function MemberModal({member,anneeEnCours,onClose,onSave}) {
  const init = member||{name:"",email:"",phone:"",cotisationAmount:"",joinDate:today(),status:"pending"};
  const [form,setForm] = useState(init);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = e => {
    e.preventDefault();
    if(!form.name?.trim()) return;
    const base = { ...form, id:member?member.id:uid(), cotisationAmount:Number(form.cotisationAmount)||0 };
    if(!base.cotisations) base.cotisations={};
    if(!base.cotisations[anneeEnCours]) base.cotisations[anneeEnCours]={status:form.status||"pending",date:""};
    else base.cotisations[anneeEnCours].status = form.status;
    onSave(base);
  };
  const currentStatus = form.cotisations?.[anneeEnCours]?.status || form.status || "pending";

  return (
    <ModalShell title={member?"Modifier le membre":"Nouveau membre"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom complet *">
          <input required value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Téléphone">
            <input value={form.phone||""} onChange={e=>set("phone",e.target.value)} style={iStyle}/>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Cotisation ${anneeEnCours} (FCFA)`}>
            <input type="number" min="0" step="100" value={form.cotisationAmount||""} onChange={e=>set("cotisationAmount",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Date d'adhésion">
            <input type="date" value={form.joinDate||""} onChange={e=>set("joinDate",e.target.value)} style={iStyle}/>
          </Field>
        </div>
        <Field label={`Statut cotisation ${anneeEnCours}`}>
          <select value={currentStatus} onChange={e=>set("status",e.target.value)} style={iStyle}>
            {STATUTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
          <button type="submit" className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>Enregistrer</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ======================== TRANSACTION MODAL ======================== */
function TxModal({tx,members,onClose,onSave}) {
  const [form,setForm] = useState(()=>tx||{type:"income",category:CAT_IN[0],amount:"",date:today(),description:"",memberId:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{
    const cats=form.type==="income"?CAT_IN:CAT_OUT;
    if(!cats.includes(form.category)) set("category",cats[0]);
  },[form.type]);
  const submit=e=>{
    e.preventDefault();
    if(!form.amount||Number(form.amount)<=0) return;
    onSave({...form,id:tx?tx.id:uid(),amount:Number(form.amount)});
  };
  const cats=form.type==="income"?CAT_IN:CAT_OUT;
  return (
    <ModalShell title={tx?"Modifier la transaction":"Nouvelle transaction"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[{v:"income",l:"+ Recette",bg:C.sage},{v:"expense",l:"− Dépense",bg:C.rust}].map(opt=>(
            <button key={opt.v} type="button" onClick={()=>set("type",opt.v)} className="py-2.5 rounded-sm text-sm font-medium"
              style={{background:form.type===opt.v?opt.bg:C.paper,color:form.type===opt.v?C.cream:C.slate,border:`1px solid ${form.type===opt.v?opt.bg:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
        <Field label="Catégorie">
          <select value={form.category} onChange={e=>set("category",e.target.value)} style={iStyle}>
            {cats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant (FCFA) *">
            <input required type="number" min="1" step="100" value={form.amount||""} onChange={e=>set("amount",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Date">
            <input type="date" value={form.date||""} onChange={e=>set("date",e.target.value)} style={iStyle}/>
          </Field>
        </div>
        <Field label="Description">
          <input value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="Ex. Location salle réunion" style={iStyle}/>
        </Field>
        <Field label="Membre concerné (optionnel)">
          <select value={form.memberId||""} onChange={e=>set("memberId",e.target.value)} style={iStyle}>
            <option value="">—</option>
            {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
          <button type="submit" className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>Enregistrer</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ======================== SETTINGS TAB ======================== */
function SettingsTab({config,onSave}) {
  const [form,setForm] = useState(config);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Configuration</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Paramètres</h1>
      </div>
      <div className="p-5 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Association</h2>
        <Field label="Nom de l'association">
          <input value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/>
        </Field>
        <Field label="Siège / Ville">
          <input value={form.city||""} onChange={e=>set("city",e.target.value)} placeholder="Ex. Abidjan" style={iStyle}/>
        </Field>
        <Field label="Contact (téléphone)">
          <input value={form.contact||""} onChange={e=>set("contact",e.target.value)} placeholder="Ex. +225 07 00 00 00 00" style={iStyle}/>
        </Field>
      </div>
      <div className="p-5 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Cotisations</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Année en cours">
            <input type="number" min="2000" max="2100" value={form.annee||new Date().getFullYear()} onChange={e=>set("annee",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Montant par défaut (FCFA)">
            <input type="number" min="0" step="100" value={form.defaultCot||""} onChange={e=>set("defaultCot",e.target.value)} style={iStyle}/>
          </Field>
        </div>
      </div>
      <button onClick={()=>onSave(form)} className="py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>
        Enregistrer les paramètres
      </button>
    </div>
  );
}

/* ======================== DASHBOARD ======================== */
function Dashboard({members,transactions,monthlyData,totals,annee,config}) {
  const retards = members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="late");
  const payés   = members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="paid").length;
  const recent  = [...transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,7);
  const tauxCot = members.length>0 ? Math.round(payés/members.length*100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Tableau de bord</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Vue d'ensemble</h1>
        {config.city && <p className="text-sm mt-1" style={{color:C.slate}}>{config.city}</p>}
      </div>

      {retards.length>0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-sm" style={{background:"rgba(168,68,46,0.08)",border:`1px solid ${C.rust}`}}>
          <AlertTriangle size={16} style={{color:C.rust,marginTop:"1px"}}/>
          <div className="text-sm" style={{color:C.rust}}>
            <strong>{retards.length} membre{retards.length>1?"s":""} en retard</strong> de cotisation {annee} :&nbsp;
            {retards.slice(0,3).map(m=>m.name).join(", ")}{retards.length>3?" ...":""}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Solde" value={fcfa(totals.balance)} icon={Wallet} accent={C.ink} sub={`Exercice ${annee}`}/>
        <StatCard label="Recettes" value={fcfa(totals.income)} icon={TrendingUp} accent={C.sage}/>
        <StatCard label="Dépenses" value={fcfa(totals.expense)} icon={TrendingDown} accent={C.rust}/>
        <StatCard label="Membres" value={members.length} icon={Users} accent={C.brass} sub={`${payés} réglés (${tauxCot}%)`}/>
      </div>

      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{color:C.slate}}>Taux de cotisation {annee}</h2>
          <span style={{fontFamily:FM,fontSize:"13px",color:C.brass}}>{tauxCot}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{background:C.line}}>
          <div className="h-full rounded-full" style={{width:`${tauxCot}%`,background:tauxCot>=80?C.sage:tauxCot>=50?C.brass:C.rust,transition:"width 0.5s ease"}}/>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Évolution 12 mois</h2>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid stroke={C.line} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:C.slate}} axisLine={{stroke:C.line}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.slate}} axisLine={false} tickLine={false} width={60}/>
              <Tooltip formatter={v=>fcfa(v)} contentStyle={{fontFamily:FM,fontSize:"12px",border:`1px solid ${C.line}`}}/>
              <Line type="monotone" dataKey="income" name="Recettes" stroke={C.sage} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="expense" name="Dépenses" stroke={C.rust} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-2" style={{color:C.slate}}>Dernières écritures</h2>
        {recent.length===0
          ? <p className="text-sm py-8 text-center" style={{color:C.slate}}>Aucune transaction. Commencez par ajouter une recette ou dépense.</p>
          : recent.map(tx=><TxRow key={tx.id} tx={tx} readOnly/>)
        }
      </div>
    </div>
  );
}

/* ======================== MEMBERS TAB ======================== */
function MembersTab({members,annee,search,onSearch,onNew,onEdit,onDelete,onMarkPaid,onHistory}) {
  const [filtre,setFiltre] = useState("all");
  const filtered = members
    .filter(m=>{
      const s=(m.cotisations?.[annee]?.status||"pending");
      return (filtre==="all"||s===filtre) && m.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a,b)=>a.name.localeCompare(b.name));

  const exportMembers = () => {
    exportCSV(members.map(m=>({
      Nom:m.name, Email:m.email||"", Telephone:m.phone||"",
      "Date adhésion":m.joinDate||"",
      [`Statut ${annee}`]:STATUTS.find(s=>s.value===(m.cotisations?.[annee]?.status||"pending"))?.label||"",
      [`Date paiement ${annee}`]:m.cotisations?.[annee]?.date||"",
      "Montant cotisation":m.cotisationAmount||0
    })),"membres.csv");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Registre — {annee}</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Membres</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportMembers} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>
            <Download size={14}/> Export CSV
          </button>
          <button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>
            <Plus size={15}/> Nouveau membre
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher un membre..." style={{...iStyle,paddingLeft:"36px"}}/>
        </div>
        <div className="flex gap-2">
          {[{v:"all",l:"Tous"},{v:"paid",l:"Réglés"},{v:"pending",l:"En attente"},{v:"late",l:"En retard"}].map(opt=>(
            <button key={opt.v} onClick={()=>setFiltre(opt.v)} className="px-3 py-2 rounded-sm text-xs font-medium"
              style={{background:filtre===opt.v?C.ink:C.paper,color:filtre===opt.v?C.cream:C.slate,border:`1px solid ${filtre===opt.v?C.ink:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length===0
        ? <div className="text-center py-16 rounded-sm" style={{background:C.cream}}>
            <Users size={28} className="mx-auto mb-3" style={{color:C.line}}/>
            <p className="text-sm" style={{color:C.slate}}>{members.length===0?"Aucun membre. Ajoutez le premier.":"Aucun résultat pour ce filtre."}</p>
          </div>
        : <div className="rounded-sm overflow-hidden" style={{background:C.cream}}>
            {filtered.map(m=><MemberCard key={m.id} member={m} annee={annee} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} onHistory={onHistory}/>)}
          </div>
      }
    </div>
  );
}

/* ======================== FINANCES TAB ======================== */
function FinancesTab({transactions,members,filter,onFilter,search,onSearch,onNew,onEdit,onDelete}) {
  const filtered = transactions.filter(t=>
    (filter==="all"||t.type===filter) &&
    ((t.description||"").toLowerCase().includes(search.toLowerCase())||(t.category||"").toLowerCase().includes(search.toLowerCase()))
  );
  const groups = groupByMonth(filtered);

  const exportTx = () => {
    exportCSV(transactions.map(t=>({
      Date:t.date||"",Type:t.type==="income"?"Recette":"Dépense",
      Categorie:t.category,Description:t.description||"",
      Montant:t.amount,Membre:members.find(m=>m.id===t.memberId)?.name||""
    })),"transactions.csv");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Grand livre</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Finances</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportTx} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>
            <Download size={14}/> Export CSV
          </button>
          <button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>
            <Plus size={15}/> Nouvelle transaction
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher..." style={{...iStyle,paddingLeft:"36px"}}/>
        </div>
        <div className="flex gap-2">
          {[{v:"all",l:"Tout"},{v:"income",l:"Recettes"},{v:"expense",l:"Dépenses"}].map(opt=>(
            <button key={opt.v} onClick={()=>onFilter(opt.v)} className="px-3 py-2 rounded-sm text-sm font-medium"
              style={{background:filter===opt.v?C.ink:C.paper,color:filter===opt.v?C.cream:C.slate,border:`1px solid ${filter===opt.v?C.ink:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {groups.length===0
        ? <div className="text-center py-16 rounded-sm" style={{background:C.cream}}>
            <Wallet size={28} className="mx-auto mb-3" style={{color:C.line}}/>
            <p className="text-sm" style={{color:C.slate}}>{transactions.length===0?"Aucune transaction. Enregistrez la première.":"Aucun résultat."}</p>
          </div>
        : groups.map(g=>(
          <div key={g.key} className="rounded-sm overflow-hidden" style={{background:C.cream}}>
            <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
              <span style={{color:C.ink,fontFamily:FD,fontSize:"15px"}}>{g.label}</span>
              <span className="text-sm font-semibold" style={{fontFamily:FM,color:g.sous>=0?C.sage:C.rust}}>
                {g.sous>=0?"+ ":"− "}{fcfa(Math.abs(g.sous))}
              </span>
            </div>
            <div className="px-4">
              {g.items.map(tx=><TxRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete}/>)}
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* ======================== REPORTS TAB ======================== */
function ReportsTab({members,transactions,monthlyData,totals,annee}) {
  const incBreak = catBreak(transactions,"income");
  const expBreak = catBreak(transactions,"expense");
  const sc={paid:0,pending:0,late:0};
  members.forEach(m=>{ const s=m.cotisations?.[annee]?.status||"pending"; sc[s]=(sc[s]||0)+1; });
  const totalCotAtt = members.reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const totalCotPerc = members.filter(m=>m.cotisations?.[annee]?.status==="paid").reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const donuts = [
    {name:"Réglé",value:sc.paid,color:C.sage},
    {name:"En attente",value:sc.pending,color:C.brass},
    {name:"En retard",value:sc.late,color:C.rust}
  ].filter(d=>d.value>0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Bilan</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Rapports</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Cotisations attendues ${annee}`} value={fcfa(totalCotAtt)} accent={C.brass}/>
        <StatCard label="Cotisations perçues" value={fcfa(totalCotPerc)} accent={C.sage}/>
        <StatCard label="Taux de recouvrement" value={totalCotAtt>0?Math.round(totalCotPerc/totalCotAtt*100)+"%":"—"} accent={C.ink}/>
        <StatCard label="Reste à percevoir" value={fcfa(totalCotAtt-totalCotPerc)} accent={C.rust}/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Statuts cotisation {annee}</h2>
          {members.length===0
            ? <p className="text-sm text-center py-8" style={{color:C.slate}}>Aucun membre.</p>
            : <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donuts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {donuts.map(d=><Cell key={d.name} fill={d.color}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend wrapperStyle={{fontSize:"12px"}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
          }
        </div>

        <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Recettes et dépenses 12 mois</h2>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid stroke={C.line} vertical={false}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:C.slate}} axisLine={{stroke:C.line}} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.slate}} axisLine={false} tickLine={false} width={55}/>
                <Tooltip formatter={v=>fcfa(v)} contentStyle={{fontFamily:FM,fontSize:"11px"}}/>
                <Legend wrapperStyle={{fontSize:"11px"}}/>
                <Bar dataKey="income" name="Recettes" fill={C.sage} radius={[2,2,0,0]}/>
                <Bar dataKey="expense" name="Dépenses" fill={C.rust} radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {[{title:"Recettes par catégorie",data:incBreak},{title:"Dépenses par catégorie",data:expBreak}].map(({title,data})=>(
          <div key={title} className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>{title}</h2>
            {data.length===0
              ? <p className="text-sm text-center py-8" style={{color:C.slate}}>Aucune donnée.</p>
              : <>
                  <div style={{height:200}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                          {data.map((_,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}
                        </Pie>
                        <Tooltip formatter={v=>fcfa(v)}/>
                        <Legend wrapperStyle={{fontSize:"11px"}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-col gap-1">
                    {data.map((d,i)=>(
                      <div key={d.name} className="flex items-center justify-between text-xs py-1" style={{borderBottom:`1px solid ${C.line}`}}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:PAL[i%PAL.length]}}/>
                          <span style={{color:C.ink}}>{d.name}</span>
                        </div>
                        <span style={{fontFamily:FM,color:C.slate}}>{fcfa(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== APP ROOT ======================== */
export default function App() {
  const [loading,  setLoading]  = useState(true);
  const [members,  setMembers]  = useState([]);
  const [txs,      setTxs]      = useState([]);
  const [config,   setConfig]   = useState({name:"Mon Association",city:"",contact:"",annee:String(new Date().getFullYear()),defaultCot:""});
  const [tab,      setTab]      = useState("dashboard");
  const [mbrModal, setMbrModal] = useState(null);
  const [txModal,  setTxModal]  = useState(null);
  const [histModal,setHistModal]= useState(null);
  const [recuInfo, setRecuInfo] = useState(null);
  const [mbrSearch,setMbrSearch]= useState("");
  const [txFilter, setTxFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [confirm,  setConfirm]  = useState(null);
  const [toast,    setToast]    = useState("");

  useEffect(()=>{
    (async()=>{
      const [m,t,c]=await Promise.all([loadKey("members",[]),loadKey("transactions",[]),loadKey("config",{name:"Mon Association",city:"",contact:"",annee:String(new Date().getFullYear()),defaultCot:""})]);
      setMembers(Array.isArray(m)?m:[]);
      setTxs(Array.isArray(t)?t:[]);
      setConfig({name:"Mon Association",city:"",contact:"",annee:String(new Date().getFullYear()),defaultCot:"",...c});
      setLoading(false);
    })();
  },[]);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const saveMbr = data => {
    const next = members.some(m=>m.id===data.id)?members.map(m=>m.id===data.id?data:m):[...members,data];
    setMembers(next); saveKey("members",next);
    setMbrModal(null); showToast("Membre enregistré.");
  };
  const delMbr = m => {
    const next=members.filter(x=>x.id!==m.id); setMembers(next); saveKey("members",next);
    setConfirm(null); showToast("Membre supprimé.");
  };
  const markPaid = m => {
    const d=today();
    const updM={...m,cotisations:{...(m.cotisations||{}),   [config.annee]:{status:"paid",date:d}}};
    const newTx={id:uid(),date:d,type:"income",category:"Cotisations",amount:Number(m.cotisationAmount)||0,description:`Cotisation ${config.annee} – ${m.name}`,memberId:m.id};
    const nextM=members.map(x=>x.id===m.id?updM:x);
    const nextT=[...txs,newTx];
    setMembers(nextM); saveKey("members",nextM);
    setTxs(nextT);    saveKey("transactions",nextT);
    showToast(`${m.name} marqué(e) réglé(e).`);
    setRecuInfo({member:updM,tx:newTx});
  };
  const saveTx = data => {
    const next=txs.some(t=>t.id===data.id)?txs.map(t=>t.id===data.id?data:t):[...txs,data];
    setTxs(next); saveKey("transactions",next);
    setTxModal(null); showToast("Transaction enregistrée.");
  };
  const delTx = t => {
    const next=txs.filter(x=>x.id!==t.id); setTxs(next); saveKey("transactions",next);
    setConfirm(null); showToast("Transaction supprimée.");
  };
  const saveConfig = cfg => {
    setConfig(cfg); saveKey("config",cfg); showToast("Paramètres enregistrés.");
  };

  const totals = useMemo(()=>{
    const income=txs.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0);
    const expense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0);
    return {income,expense,balance:income-expense};
  },[txs]);

  const monthlyData = useMemo(()=>{
    const now=new Date();
    return Array.from({length:12},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-11+i,1);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mt=txs.filter(t=>(t.date||"").slice(0,7)===k);
      const income=mt.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0);
      const expense=mt.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0);
      return {key:k,label:`${MOIS_COURT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,income,expense};
    });
  },[txs]);

  const NAV=[
    {id:"dashboard",label:"Tableau de bord",icon:LayoutDashboard},
    {id:"members",label:"Membres",icon:Users},
    {id:"finances",label:"Finances",icon:Wallet},
    {id:"reports",label:"Rapports",icon:BarChart3},
    {id:"settings",label:"Paramètres",icon:Settings}
  ];

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:C.paper}}>
      <style>{FONT_IMPORT}</style>
      <p style={{color:C.slate,fontFamily:FM,fontSize:"14px"}}>Ouverture du registre…</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{background:C.paper,fontFamily:FB}}>
      <style>{FONT_IMPORT}</style>

      {/* ---- SIDEBAR DESKTOP ---- */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 lg:min-h-screen lg:sticky lg:top-0" style={{background:C.ink}}>
        <div className="px-6 pt-7 pb-5" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{color:C.brass}}>Registre associatif</p>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:"17px",color:C.cream,lineHeight:"1.3"}}>{config.name}</p>
          {config.city && <p className="text-xs mt-1" style={{color:"rgba(247,243,233,0.5)"}}>{config.city}</p>}
        </div>
        <nav className="flex-1 px-3 pt-3">
          {NAV.map(item=>{
            const Icon=item.icon;
            const active=tab===item.id;
            return (
              <button key={item.id} onClick={()=>setTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm mb-1 text-sm"
                style={{background:active?"rgba(184,137,59,0.18)":"transparent",color:active?C.brass:C.cream,fontWeight:active?600:400}}>
                <Icon size={16}/> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-5" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{color:"rgba(247,243,233,0.45)"}}>Solde — {config.annee}</p>
          <p style={{fontFamily:FM,fontSize:"18px",color:totals.balance>=0?C.cream:C.rustL}}>{fcfa(totals.balance)}</p>
          <p className="text-xs mt-3" style={{color:"rgba(247,243,233,0.35)"}}>Données partagées entre tous les utilisateurs.</p>
        </div>
      </aside>

      {/* ---- HEADER MOBILE ---- */}
      <header className="lg:hidden sticky top-0 z-30" style={{background:C.ink}}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Registre</p>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:"15px",color:C.cream}}>{config.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{color:"rgba(247,243,233,0.45)"}}>Solde</p>
            <p style={{fontFamily:FM,fontSize:"14px",color:C.cream}}>{fcfa(totals.balance)}</p>
          </div>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
          {NAV.map(item=>{
            const Icon=item.icon;
            const active=tab===item.id;
            return (
              <button key={item.id} onClick={()=>setTab(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs whitespace-nowrap"
                style={{background:active?"rgba(184,137,59,0.2)":"transparent",color:active?C.brass:"rgba(247,243,233,0.8)"}}>
                <Icon size={13}/> {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ---- MAIN ---- */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">
          {tab==="dashboard" && <Dashboard members={members} transactions={txs} monthlyData={monthlyData} totals={totals} annee={config.annee} config={config}/>}
          {tab==="members" && (
            <MembersTab members={members} annee={config.annee} search={mbrSearch} onSearch={setMbrSearch}
              onNew={()=>setMbrModal({type:"new",defaultCot:config.defaultCot})}
              onEdit={m=>setMbrModal({type:"edit",member:m})}
              onDelete={m=>setConfirm({msg:`Supprimer ${m.name} du registre ?`,fn:()=>delMbr(m)})}
              onMarkPaid={markPaid}
              onHistory={m=>setHistModal(m)}
            />
          )}
          {tab==="finances" && (
            <FinancesTab transactions={txs} members={members} filter={txFilter} onFilter={setTxFilter}
              search={txSearch} onSearch={setTxSearch}
              onNew={()=>setTxModal({type:"new"})}
              onEdit={t=>setTxModal({type:"edit",tx:t})}
              onDelete={t=>setConfirm({msg:`Supprimer cette transaction de ${fcfa(t.amount)} ?`,fn:()=>delTx(t)})}
            />
          )}
          {tab==="reports"   && <ReportsTab members={members} transactions={txs} monthlyData={monthlyData} totals={totals} annee={config.annee}/>}
          {tab==="settings"  && <SettingsTab config={config} onSave={saveConfig}/>}
        </div>
      </main>

      {/* ---- MODALS ---- */}
      {mbrModal && (
        <MemberModal
          member={mbrModal.type==="edit"?mbrModal.member:{cotisationAmount:mbrModal.defaultCot||""}}
          anneeEnCours={config.annee}
          onClose={()=>setMbrModal(null)}
          onSave={saveMbr}
        />
      )}
      {txModal && (
        <TxModal tx={txModal.type==="edit"?txModal.tx:null} members={members} onClose={()=>setTxModal(null)} onSave={saveTx}/>
      )}
      {histModal && <HistoryModal member={histModal} onClose={()=>setHistModal(null)}/>}
      {recuInfo && <RecuModal member={recuInfo.member} tx={recuInfo.tx} assocName={config.name} onClose={()=>setRecuInfo(null)}/>}
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={()=>setConfirm(null)}/>}

      {/* ---- TOAST ---- */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-sm text-sm font-medium"
          style={{background:C.ink,color:C.cream,boxShadow:"0 4px 16px rgba(0,0,0,0.25)",fontFamily:FM}}>
          {toast}
        </div>
      )}
    </div>
  );
}
