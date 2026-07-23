import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Users, Wallet, BarChart3, Settings, Plus, X, Pencil, Trash2,
  Search, AlertTriangle, TrendingUp, TrendingDown, Download, Printer,
  Bell, LogOut, Eye, EyeOff, UserPlus, CheckCircle2, Lock, Shield,
  BookOpen, CalendarDays, Layers, MapPin, ShieldCheck, RefreshCw, Phone,
  MessageSquare, Camera, Vote, Smartphone, ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { supabase } from "./supabase.js";
import MeetingsTab from "./tabs/MeetingsTab.jsx";
import EventsTab from "./tabs/EventsTab.jsx";
import BudgetTab from "./tabs/BudgetTab.jsx";
import SanctionsTab from "./tabs/SanctionsTab.jsx";
import MapTab from "./tabs/MapTab.jsx";
import MessagesTab from "./tabs/MessagesTab.jsx";
import GalerieTab from "./tabs/GalerieTab.jsx";
import VotesTab from "./tabs/VotesTab.jsx";

/* ===================== DESIGN TOKENS ===================== */
const C = {
  ink:"#1C2541", paper:"#F7F3E9", line:"#DED5BE", cream:"#FCFAF4",
  brass:"#B8893B", brassDark:"#8C6526", sage:"#4F6F52", sageL:"#7C9B7E",
  rust:"#A8442E", rustL:"#C2604A", slate:"#6B6558"
};
const FD="Fraunces, serif", FB="'IBM Plex Sans', sans-serif", FM="'IBM Plex Mono', monospace";
const FONT_IMPORT=`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;
const iStyle={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

/* ===================== CONSTANTES ===================== */
const CAT_IN=["Cotisations","Dons","Subventions","Evenements","Aide externe","Autres recettes"];
const CAT_OUT=["Materiel","Location salle","Deplacement","Communication","Assurance","Evenements","Fonctionnement","Autres depenses"];
const STATUTS=[{value:"paid",label:"Regle",color:C.sage},{value:"partial",label:"Partiel",color:"#D4881A"},{value:"pending",label:"En attente",color:C.brass},{value:"late",label:"En retard",color:C.rust}];
const MOIS_COURT=["Janv","Fevr","Mars","Avr","Mai","Juin","Juil","Aout","Sept","Oct","Nov","Dec"];
const MOIS_LONG=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const PAL=[C.ink,C.brass,C.sage,C.rust,C.slate,C.sageL,C.rustL,C.brassDark];

const ROLES = {
  admin:     {label:"Administrateur", icon:"A", canEdit:true,  canDelete:true,  canManageUsers:true,  canViewFinances:true},
  tresorier: {label:"Tresorier",      icon:"T", canEdit:true,  canDelete:true,  canManageUsers:false, canViewFinances:true},
  secretaire:{label:"Secretaire",     icon:"S", canEdit:true,  canDelete:false, canManageUsers:false, canViewFinances:false},
  lecteur:   {label:"Lecteur",        icon:"L", canEdit:false, canDelete:false, canManageUsers:false, canViewFinances:true},
};
function can(user, perm) { return !!(user && ROLES[user.role]?.[perm]); }

/* ===================== HELPERS ===================== */
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function today() { return new Date().toISOString().slice(0,10); }
function fcfa(n) { return (Number(n)||0).toLocaleString("fr-FR")+" FCFA"; }
function waLink(phone,msg){
  if(!phone) return null;
  let p=phone.replace(/[\s\-().]/g,"");
  if(p.startsWith("+"))p=p.slice(1);
  if(p.startsWith("00"))p=p.slice(2);
  if(!p.startsWith("225")&&p.length<=10)p="225"+p;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}
function dateF(iso) {
  if(!iso) return "\u2014";
  const d=new Date(iso);
  if(isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
}
function moisLabel(key) {
  if(!key||key==="inconnu") return "Sans date";
  const [y,m]=key.split("-");
  return `${MOIS_LONG[Number(m)-1]} ${y}`;
}
function groupByMonth(txs) {
  const g={};
  txs.forEach(t=>{ const k=(t.date||"").slice(0,7)||"inconnu"; if(!g[k])g[k]=[]; g[k].push(t); });
  return Object.keys(g).sort((a,b)=>b.localeCompare(a)).map(k=>({
    key:k, label:moisLabel(k),
    items:g[k].sort((a,b)=>(b.date||"").localeCompare(a.date||"")),
    sous:g[k].reduce((s,t)=>s+(t.type==="income"?+t.amount:-+t.amount),0)
  }));
}
function catBreak(txs,type) {
  const m={};
  txs.filter(t=>t.type===type).forEach(t=>{ m[t.category]=(m[t.category]||0)+(+t.amount); });
  return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}
/* === SUPABASE MAPPERS === */
function memberToDb(m){return{id:m.id,name:m.name,email:m.email||null,phone:m.phone||null,cotisation_amount:Number(m.cotisationAmount)||0,join_date:m.joinDate||null,cotisations:m.cotisations||{},commune:m.commune||null};}
function memberFromDb(r){return{id:r.id,name:r.name,email:r.email||"",phone:r.phone||"",cotisationAmount:r.cotisation_amount||0,joinDate:r.join_date||"",cotisations:r.cotisations||{},commune:r.commune||""};}
function txToDb(t){return{id:t.id,date:t.date||null,type:t.type,category:t.category,description:t.description||null,amount:Number(t.amount),member_id:t.memberId||null};}
function txFromDb(r){return{id:r.id,date:r.date||"",type:r.type,category:r.category,description:r.description||"",amount:r.amount,memberId:r.member_id||""};}
function userFromDb(r){return{id:r.id,name:r.name||"",username:r.username,password:r.password,role:r.role||"lecteur",phone:r.phone||""};}
function exportCSV(data,filename) {
  if(!data.length) return;
  const keys=Object.keys(data[0]);
  const rows=[keys.join(";"),...data.map(r=>keys.map(k=>`"${String(r[k]||"").replace(/"/g,'""')}"`).join(";"))];
  const blob=new Blob(["\uFEFF"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
}

/* ===================== PRINT PDF ===================== */
function printReport(members, txs, config, annee) {
  const income=txs.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0);
  const expense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0);
  const paid=members.filter(m=>m.cotisations?.[annee]?.status==="paid");
  const late=members.filter(m=>m.cotisations?.[annee]?.status==="late");
  const pending=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="pending");
  const totCotAtt=members.reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const totCotPerc=paid.reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const taux=totCotAtt>0?Math.round(totCotPerc/totCotAtt*100):0;
  const mRows=members.sort((a,b)=>a.name.localeCompare(b.name)).map(m=>{
    const s=m.cotisations?.[annee]?.status||"pending";
    const sLabel=s==="paid"?"Regle":s==="late"?"En retard":"En attente";
    const sColor=s==="paid"?"#4F6F52":s==="late"?"#A8442E":"#B8893B";
    return `<tr><td>${m.name}</td><td>${m.email||""}</td><td>${m.phone||""}</td><td style="text-align:right;font-family:monospace">${(+m.cotisationAmount||0).toLocaleString("fr-FR")} FCFA</td><td style="color:${sColor};font-weight:600">${sLabel}</td><td>${m.cotisations?.[annee]?.date?new Date(m.cotisations[annee].date).toLocaleDateString("fr-FR"):""}</td></tr>`;
  }).join("");
  const tRows=txs.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(t=>`<tr><td>${t.date?new Date(t.date).toLocaleDateString("fr-FR"):""}</td><td>${t.type==="income"?"Recette":"Depense"}</td><td>${t.category}</td><td>${t.description||""}</td><td style="text-align:right;font-family:monospace;color:${t.type==="income"?"#4F6F52":"#A8442E"}">${t.type==="income"?"+":"-"}${(+t.amount).toLocaleString("fr-FR")} FCFA</td></tr>`).join("");
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Rapport ${config.name} ${annee}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;color:#1C2541;padding:30px;font-size:12px;}
  h1{font-size:22px;margin-bottom:4px;}h2{font-size:14px;margin:22px 0 10px;border-bottom:2px solid #B8893B;padding-bottom:4px;}
  .header{border-bottom:3px solid #B8893B;padding-bottom:16px;margin-bottom:20px;}.meta{color:#6B6558;font-size:11px;margin-top:4px;}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px;}
  .card{padding:10px;border:1px solid #DED5BE;}.card-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6B6558;}
  .card-val{font-size:16px;font-weight:700;margin-top:2px;font-family:monospace;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th{background:#1C2541;color:#F7F3E9;padding:5px 7px;text-align:left;font-weight:600;}
  td{padding:4px 7px;border-bottom:1px solid #DED5BE;}tr:nth-child(even){background:#F7F3E9;}
  .footer{margin-top:30px;text-align:center;font-size:10px;color:#6B6558;border-top:1px solid #DED5BE;padding-top:12px;}
  @media print{body{padding:15px;}}
  </style></head><body>
  <div class="header"><h1>${config.name}</h1><div class="meta">${config.city?config.city+" &middot; ":""}Rapport annuel ${annee} &middot; Genere le ${new Date().toLocaleDateString("fr-FR")}</div></div>
  <h2>Synthese financiere</h2>
  <div class="grid">
    <div class="card"><div class="card-lbl">Solde</div><div class="card-val">${(income-expense).toLocaleString("fr-FR")} FCFA</div></div>
    <div class="card"><div class="card-lbl">Recettes</div><div class="card-val" style="color:#4F6F52">+${income.toLocaleString("fr-FR")} FCFA</div></div>
    <div class="card"><div class="card-lbl">Depenses</div><div class="card-val" style="color:#A8442E">-${expense.toLocaleString("fr-FR")} FCFA</div></div>
    <div class="card"><div class="card-lbl">Membres</div><div class="card-val">${members.length}</div></div>
  </div>
  <h2>Cotisations ${annee}</h2>
  <div class="grid">
    <div class="card"><div class="card-lbl">Regles</div><div class="card-val" style="color:#4F6F52">${paid.length}</div></div>
    <div class="card"><div class="card-lbl">En attente</div><div class="card-val" style="color:#B8893B">${pending.length}</div></div>
    <div class="card"><div class="card-lbl">En retard</div><div class="card-val" style="color:#A8442E">${late.length}</div></div>
    <div class="card"><div class="card-lbl">Taux recouvrement</div><div class="card-val">${taux}%</div></div>
  </div>
  <h2>Liste des membres (${members.length})</h2>
  <table><thead><tr><th>Nom</th><th>Email</th><th>Telephone</th><th>Cotisation</th><th>Statut ${annee}</th><th>Date paiement</th></tr></thead><tbody>${mRows}</tbody></table>
  <h2>Transactions (${txs.length})</h2>
  <table><thead><tr><th>Date</th><th>Type</th><th>Categorie</th><th>Description</th><th>Montant</th></tr></thead><tbody>${tRows}</tbody></table>
  <div class="footer">${config.name} &middot; ${annee} &middot; Document genere automatiquement</div>
  </body></html>`;
  const w=window.open("","_blank","width=900,height=700");
  w.document.write(html); w.document.close(); setTimeout(()=>w.print(),500);
}

/* ===================== AUTH SCREENS ===================== */
/* ===================== OTP SCREEN ===================== */
function OTPScreen({pending,onVerify,onBack,onResend,sending,countdown}){
  const [input,setInput]=useState("");
  const [error,setError]=useState("");
  const mins=Math.floor(countdown/60);
  const secs=countdown%60;
  const masked=pending?.user?.phone?("****"+pending.user.phone.slice(-4)):"votre telephone";

  const verify=()=>{
    if(input.length!==6){setError("Entrez les 6 chiffres du code.");return;}
    setError("");
    onVerify(input,setError);
  };

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-sm mb-4" style={{background:"rgba(184,137,59,0.2)",border:`1px solid ${C.brass}`}}>
            <ShieldCheck size={26} style={{color:C.brass}}/>
          </div>
          <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:"24px",color:C.cream}}>Code de verification</h1>
          <p className="text-sm mt-2" style={{color:"rgba(247,243,233,0.5)"}}>
            Un code a 6 chiffres a ete envoye au {masked}
          </p>
        </div>
        <div className="p-6 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value.replace(/\D/g,"").slice(0,6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            style={{...iStyle,textAlign:"center",fontSize:"30px",letterSpacing:"0.4em",fontFamily:FM,padding:"14px 10px"}}
          />
          {error&&<p className="text-xs text-center" style={{color:C.rust}}>{error}</p>}
          <div className="text-xs text-center" style={{color:countdown>0?C.slate:C.rust}}>
            {countdown>0
              ?`Code valable encore ${mins}:${String(secs).padStart(2,"0")}`
              :"Code expire. Renvoyez un nouveau code."
            }
          </div>
          <button onClick={verify} disabled={input.length!==6||countdown===0} className="py-2.5 rounded-sm text-sm font-medium"
            style={{background:C.ink,color:C.cream,opacity:input.length!==6||countdown===0?0.5:1}}>
            Verifier le code
          </button>
          <div className="flex justify-between items-center">
            <button onClick={onBack} className="text-xs flex items-center gap-1" style={{color:C.slate}}>
              \u2190 Retour
            </button>
            <button onClick={()=>{onResend();setInput("");setError("");}} disabled={sending||countdown>540}
              className="text-xs flex items-center gap-1"
              style={{color:sending||countdown>540?C.slate:C.brass,opacity:sending||countdown>540?0.5:1}}>
              <RefreshCw size={11}/> {sending?"Envoi...":"Renvoyer"}
            </button>
          </div>
        </div>
        <p className="text-xs text-center mt-4" style={{color:"rgba(247,243,233,0.3)"}}>
          Si vous ne recevez pas le code, verifiez que votre numero est enregistre dans votre profil.
        </p>
      </div>
    </div>
  );
}

function SetupScreen({onSetup}) {
  const [form,setForm]=useState({assocName:"Mon Association",city:"",adminName:"",username:"admin",password:"",confirm:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const submit=e=>{
    e.preventDefault();
    if(form.password.length<4){setError("Mot de passe trop court (4 car. min).");return;}
    if(form.password!==form.confirm){setError("Les mots de passe ne correspondent pas.");return;}
    onSetup(form);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm mb-4" style={{background:"rgba(184,137,59,0.2)",border:`1px solid ${C.brass}`}}>
            <Shield size={22} style={{color:C.brass}}/>
          </div>
          <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:"24px",color:C.cream}}>Premiere configuration</h1>
          <p className="text-sm mt-1" style={{color:"rgba(247,243,233,0.5)"}}>Configurez votre association et creez le compte administrateur.</p>
        </div>
        <form onSubmit={submit} className="p-6 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{color:C.brass}}>Association</p>
          <Field label="Nom de l'association *"><input required value={form.assocName} onChange={e=>set("assocName",e.target.value)} style={iStyle}/></Field>
          <Field label="Ville / Siege"><input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Ex. Abidjan" style={iStyle}/></Field>
          <p className="text-xs font-semibold uppercase tracking-wide mt-2" style={{color:C.brass}}>Compte Administrateur</p>
          <Field label="Votre nom complet"><input value={form.adminName} onChange={e=>set("adminName",e.target.value)} placeholder="Ex. Konan Kouame" style={iStyle}/></Field>
          <Field label="Identifiant de connexion *"><input required value={form.username} onChange={e=>set("username",e.target.value)} style={iStyle}/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mot de passe *"><input required type={show?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} style={iStyle}/></Field>
            <Field label="Confirmer *"><input required type={show?"text":"password"} value={form.confirm} onChange={e=>set("confirm",e.target.value)} style={iStyle}/></Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{color:C.slate}}>
            <input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Afficher le mot de passe
          </label>
          {error && <p className="text-xs" style={{color:C.rust}}>{error}</p>}
          <button type="submit" className="py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>Creer mon compte et demarrer</button>
        </form>
      </div>
    </div>
  );
}

function LoginScreen({users,onLogin}) {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const submit=e=>{
    e.preventDefault();
    const u=users.find(x=>x.username.toLowerCase()===username.toLowerCase()&&x.password===password);
    if(u){setError("");onLogin(u);}
    else setError("Identifiant ou mot de passe incorrect.");
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-sm mb-4" style={{background:"rgba(184,137,59,0.2)",border:`1px solid ${C.brass}`}}>
            <Lock size={24} style={{color:C.brass}}/>
          </div>
          <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:"26px",color:C.cream}}>Registre Associatif</h1>
          <p className="text-sm mt-1" style={{color:"rgba(247,243,233,0.5)"}}>Connectez-vous pour acceder a l'application</p>
        </div>
        <form onSubmit={submit} className="p-6 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
          <Field label="Identifiant"><input required value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" style={iStyle} placeholder="Votre identifiant"/></Field>
          <Field label="Mot de passe">
            <div className="relative">
              <input value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} required style={{...iStyle,paddingRight:"40px"}} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"/>
              <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {show?<EyeOff size={15} style={{color:C.slate}}/>:<Eye size={15} style={{color:C.slate}}/>}
              </button>
            </div>
          </Field>
          {error&&<p className="text-xs" style={{color:C.rust}}>{error}</p>}
          <button type="submit" className="py-2.5 rounded-sm text-sm font-medium mt-1" style={{background:C.ink,color:C.cream}}>Se connecter</button>
        </form>
        <p className="text-xs text-center mt-4" style={{color:"rgba(247,243,233,0.3)"}}>Contactez l'administrateur si vous avez oublie votre mot de passe.</p>
      </div>
    </div>
  );
}

/* ===================== NOTIFICATIONS ===================== */
function NotifDropdown({members,annee,onClose}) {
  const lates=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="late");
  const pendings=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="pending");
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-sm z-50" style={{background:C.cream,boxShadow:"0 4px 20px rgba(28,37,65,0.25)",border:`1px solid ${C.line}`}}>
      <div className="px-4 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{color:C.ink}}>Alertes cotisation {annee}</p>
      </div>
      {lates.length===0&&pendings.length===0
        ? <p className="text-sm text-center py-6" style={{color:C.slate}}>Aucune alerte en cours.</p>
        : <div className="max-h-72 overflow-y-auto">
            {lates.length>0&&(
              <div className="px-4 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{color:C.rust}}>En retard ({lates.length})</p>
                {lates.map(m=>(
                  <div key={m.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:C.rust}}/>
                    <span className="text-sm flex-1" style={{color:C.ink}}>{m.name}</span>
                    <span className="text-xs" style={{fontFamily:FM,color:C.rust}}>{fcfa(m.cotisationAmount)}</span>
                  </div>
                ))}
              </div>
            )}
            {pendings.length>0&&(
              <div className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{color:C.brass}}>En attente ({pendings.length})</p>
                {pendings.slice(0,6).map(m=>(
                  <div key={m.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:C.brass}}/>
                    <span className="text-sm flex-1" style={{color:C.ink}}>{m.name}</span>
                    <span className="text-xs" style={{fontFamily:FM,color:C.brass}}>{fcfa(m.cotisationAmount)}</span>
                  </div>
                ))}
                {pendings.length>6&&<p className="text-xs mt-1" style={{color:C.slate}}>+{pendings.length-6} autres</p>}
              </div>
            )}
          </div>
      }
      <div className="px-4 py-2.5" style={{borderTop:`1px solid ${C.line}`}}>
        <button onClick={onClose} className="text-xs w-full text-center" style={{color:C.slate}}>Fermer</button>
      </div>
    </div>
  );
}

/* ===================== MICRO-COMPONENTS ===================== */
function StatusBadge({status}) {
  const s=STATUTS.find(x=>x.value===status)||STATUTS[1];
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:"99px",border:`2px dashed ${s.color}`,color:s.color,transform:"rotate(-3deg)",fontFamily:FM,fontSize:"10px",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{s.label}</span>;
}
function StatCard({label,value,accent,sub,icon:Icon}) {
  return (
    <div className="p-4 sm:p-5 rounded-sm" style={{background:C.cream,borderTop:`3px solid ${accent||C.brass}`,boxShadow:"0 1px 3px rgba(28,37,65,0.08)"}}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest font-medium" style={{color:C.slate}}>{label}</span>
        {Icon&&<Icon size={15} style={{color:accent||C.brass}}/>}
      </div>
      <div className="text-xl sm:text-2xl font-semibold" style={{fontFamily:FM,color:C.ink}}>{value}</div>
      {sub&&<div className="text-xs mt-1" style={{color:C.slate,fontFamily:FM}}>{sub}</div>}
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
      <div className={`w-full ${wide?"sm:max-w-2xl":"sm:max-w-md"} rounded-t-2xl sm:rounded-sm overflow-y-auto`} style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
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

/* ===================== TX ROW ===================== */
function TxRow({tx,onEdit,onDelete,readOnly}) {
  const isIn=tx.type==="income";
  return (
    <div className="flex items-center gap-3 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="w-[68px] sm:w-24 shrink-0" style={{fontFamily:FM,color:C.slate,fontSize:"11px"}}>{dateF(tx.date)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{color:C.ink}}>{tx.description||tx.category}</div>
        <div style={{color:C.slate,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{tx.category}</div>
      </div>
      <div className="text-sm font-semibold shrink-0 text-right" style={{fontFamily:FM,color:isIn?C.sage:C.rust,minWidth:"100px"}}>
        {isIn?"+ ":"\u2212 "}{fcfa(Math.abs(tx.amount))}
      </div>
      {!readOnly&&(
        <div className="flex items-center gap-1 shrink-0">
          {onEdit&&<button onClick={()=>onEdit(tx)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>}
          {onDelete&&<button onClick={()=>onDelete(tx)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>}
        </div>
      )}
    </div>
  );
}

/* ===================== MEMBER CARD ===================== */
function MemberCard({member,annee,onEdit,onDelete,onMarkPaid,onHistory,canEdit,canDelete,onMobileMoney=null}) {
  const cotAnnee=member.cotisations?.[annee]||{status:"pending",date:""};
  return (
    <div style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div style={{color:C.ink,fontFamily:FD,fontSize:"17px"}}>{member.name}</div>
            <div className="text-xs" style={{color:C.slate}}>{member.email||"Pas d'email"}{member.phone?` \u00b7 ${member.phone}`:""}</div>
          </div>
          <StatusBadge status={cotAnnee.status}/>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{color:C.slate,fontFamily:FM,fontSize:"12px"}}>
          <span>Cotisation {annee} : {fcfa(member.cotisationAmount)}</span>
          {cotAnnee.date&&<span>Paye le {dateF(cotAnnee.date)}</span>}
        </div>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {canEdit&&cotAnnee.status!=="paid"&&(
            <button onClick={()=>onMarkPaid(member)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{background:C.sage,color:C.cream}}>
              Marquer regle {annee}
            </button>
          )}
          <button onClick={()=>onHistory(member)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Historique</button>
          {canEdit&&<button onClick={()=>onEdit(member)} className="p-1.5 rounded hover:bg-black/5 ml-auto"><Pencil size={14} style={{color:C.slate}}/></button>}
          {canDelete&&<button onClick={()=>onDelete(member)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={14} style={{color:C.slate}}/></button>}
        </div>
      </div>
    </div>
  );
}

/* ===================== HISTORY MODAL ===================== */
function HistoryModal({member,onClose}) {
  const cots=member.cotisations||{};
  const annees=Object.keys(cots).sort((a,b)=>b.localeCompare(a));
  return (
    <ModalShell title={`Historique \u2013 ${member.name}`} onClose={onClose}>
      {annees.length===0
        ? <p className="text-sm text-center py-8" style={{color:C.slate}}>Aucun paiement enregistre.</p>
        : <div className="flex flex-col gap-2">
            {annees.map(a=>{
              const e=cots[a]; const s=STATUTS.find(x=>x.value===e.status)||STATUTS[1];
              return (
                <div key={a} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{background:C.paper}}>
                  <div>
                    <span style={{fontFamily:FM,color:C.ink,fontWeight:600}}>{a}</span>
                    {e.date&&<span className="text-xs ml-2" style={{color:C.slate}}>Paye le {dateF(e.date)}</span>}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded" style={{background:`${s.color}18`,color:s.color}}>{s.label}</span>
                </div>
              );
            })}
          </div>
      }
      <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Fermer</button>
    </ModalShell>
  );
}

/* ===================== RECU MODAL ===================== */
function RecuModal({member,tx,assocName,onClose,whatsappMsg}) {
  const handlePrint=()=>{
    const w=window.open("","_blank","width=600,height=800");
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Recu</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1C2541;}.header{text-align:center;border-bottom:3px solid #B8893B;padding-bottom:20px;margin-bottom:20px;}.stamp{font-size:22px;font-weight:bold;border:3px solid #4F6F52;color:#4F6F52;padding:8px 22px;display:inline-block;transform:rotate(-2deg);margin:14px auto;}table{width:100%;border-collapse:collapse;margin-top:20px;}td{padding:8px 12px;border-bottom:1px solid #DED5BE;font-size:13px;}td:first-child{color:#6B6558;width:40%;}td:last-child{font-weight:600;}.footer{margin-top:40px;text-align:center;font-size:11px;color:#6B6558;}</style></head><body><div class="header"><h2>${assocName}</h2><p style="color:#6B6558">Recu de cotisation</p></div><div style="text-align:center"><div class="stamp">REGLE</div></div><table><tr><td>Membre</td><td>${member.name}</td></tr>${member.email?`<tr><td>Email</td><td>${member.email}</td></tr>`:""}<tr><td>Montant</td><td>${fcfa(tx?.amount||member.cotisationAmount)}</td></tr><tr><td>Date</td><td>${dateF(tx?.date||today())}</td></tr></table><div class="footer">Emis le ${dateF(today())} \u2014 ${assocName}</div></body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  };
  return (
    <ModalShell title="Recu de cotisation" onClose={onClose}>
      <div className="rounded-sm p-4 text-center mb-4" style={{background:C.paper,border:`1px dashed ${C.line}`}}>
        <div style={{fontFamily:FD,fontSize:"17px",color:C.ink,marginBottom:"4px"}}>{assocName}</div>
        <div className="text-xs uppercase tracking-widest mb-4" style={{color:C.slate}}>Recu de cotisation</div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm mb-4" style={{border:`2px solid ${C.sage}`,color:C.sage,transform:"rotate(-2deg)"}}>
          <CheckCircle2 size={15}/><span style={{fontFamily:FM,fontWeight:700,fontSize:"13px"}}>REGLE</span>
        </div>
        <div className="text-left flex flex-col gap-2 mt-2">
          {[["Membre",member.name],member.email&&["Email",member.email],["Montant",fcfa(tx?.amount||member.cotisationAmount)],["Date",dateF(tx?.date||today())]].filter(Boolean).map(([k,v])=>(
            <div key={k} className="flex justify-between text-sm" style={{borderBottom:`1px solid ${C.line}`,paddingBottom:"6px"}}>
              <span style={{color:C.slate}}>{k}</span>
              <span style={{color:C.ink,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>
        <Printer size={15}/> Imprimer / PDF
      </button>
      {member.phone && (() => {
        const msg = whatsappMsg || `Bonjour ${member.name}, merci pour votre paiement de ${fcfa(tx?.amount||member.cotisationAmount)}. \u2014 ${assocName}`;
        let p = member.phone.replace(/[\s\-()+.]/g,"");
        if(!p.startsWith("225")&&p.length<=10) p="225"+p;
        return <a href={`https://wa.me/${p}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-medium"
          style={{background:"#25D366",color:"#fff",textDecoration:"none",display:"flex"}}>
          <span style={{fontWeight:700,fontFamily:"monospace",fontSize:"13px"}}>WA</span>
          Notifier sur WhatsApp
        </a>;
      })()}
    </ModalShell>
  );
}

/* ===================== MEMBER MODAL ===================== */
function MemberModal({member,anneeEnCours,defaultCot,onClose,onSave}) {
  const init=member||{name:"",email:"",phone:"",cotisationAmount:defaultCot||"",joinDate:today(),status:"pending"};
  const [form,setForm]=useState(init);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=e=>{
    e.preventDefault();
    if(!form.name?.trim()) return;
    const base={...form,id:member?member.id:uid(),cotisationAmount:Number(form.cotisationAmount)||0};
    if(!base.cotisations) base.cotisations={};
    base.cotisations[anneeEnCours]={status:form.status||"pending",date:base.cotisations[anneeEnCours]?.date||""};
    onSave(base);
  };
  const currentStatus=form.cotisations?.[anneeEnCours]?.status||form.status||"pending";
  return (
    <ModalShell title={member?"Modifier le membre":"Nouveau membre"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom complet *"><input required value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} style={iStyle}/></Field>
          <Field label="Telephone"><input value={form.phone||""} onChange={e=>set("phone",e.target.value)} style={iStyle}/></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Cotisation ${anneeEnCours} (FCFA)`}><input type="number" min="0" step="100" value={form.cotisationAmount||""} onChange={e=>set("cotisationAmount",e.target.value)} style={iStyle}/></Field>
          <Field label="Date d'adhesion"><input type="date" value={form.joinDate||""} onChange={e=>set("joinDate",e.target.value)} style={iStyle}/></Field>
        </div>
        <Field label={`Statut ${anneeEnCours}`}>
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

/* ===================== TX MODAL ===================== */
function TxModal({tx,members,onClose,onSave}) {
  const [form,setForm]=useState(()=>tx||{type:"income",category:CAT_IN[0],amount:"",date:today(),description:"",memberId:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{ const cats=form.type==="income"?CAT_IN:CAT_OUT; if(!cats.includes(form.category)) set("category",cats[0]); },[form.type]);
  const submit=e=>{ e.preventDefault(); if(!form.amount||Number(form.amount)<=0) return; onSave({...form,id:tx?tx.id:uid(),amount:Number(form.amount)}); };
  const cats=form.type==="income"?CAT_IN:CAT_OUT;
  return (
    <ModalShell title={tx?"Modifier":"Nouvelle transaction"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[{v:"income",l:"+ Recette",bg:C.sage},{v:"expense",l:"\u2212 Depense",bg:C.rust}].map(opt=>(
            <button key={opt.v} type="button" onClick={()=>set("type",opt.v)} className="py-2.5 rounded-sm text-sm font-medium"
              style={{background:form.type===opt.v?opt.bg:C.paper,color:form.type===opt.v?C.cream:C.slate,border:`1px solid ${form.type===opt.v?opt.bg:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
        <Field label="Categorie"><select value={form.category} onChange={e=>set("category",e.target.value)} style={iStyle}>{cats.map(c=><option key={c}>{c}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant (FCFA) *"><input required type="number" min="1" step="100" value={form.amount||""} onChange={e=>set("amount",e.target.value)} style={iStyle}/></Field>
          <Field label="Date"><input type="date" value={form.date||""} onChange={e=>set("date",e.target.value)} style={iStyle}/></Field>
        </div>
        <Field label="Description"><input value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="Ex. Location salle" style={iStyle}/></Field>
        <Field label="Membre concerne">
          <select value={form.memberId||""} onChange={e=>set("memberId",e.target.value)} style={iStyle}>
            <option value="">\u2014</option>
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

/* ===================== USER MODAL ===================== */
function UserModal({user,currentUserId,onClose,onSave}) {
  const [form,setForm]=useState(user||{name:"",username:"",password:"",role:"lecteur"});
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=e=>{
    e.preventDefault();
    if(!user&&form.password.length<4){setError("Mot de passe trop court (4 car. min).");return;}
    const saved={...form,id:user?user.id:uid()};
    if(user&&!form.password) saved.password=user.password;
    onSave(saved);
  };
  const role=ROLES[form.role||"lecteur"];
  return (
    <ModalShell title={user?"Modifier l'utilisateur":"Nouvel utilisateur"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom complet"><input required value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/></Field>
        <Field label="Identifiant *"><input required value={form.username||""} onChange={e=>set("username",e.target.value)} style={iStyle}/></Field>
        <Field label={user?"Nouveau mot de passe (vide = inchange)":"Mot de passe *"}>
          <div className="relative">
            <input type={show?"text":"password"} value={form.password||""} onChange={e=>set("password",e.target.value)} required={!user} style={{...iStyle,paddingRight:"40px"}} placeholder={user?"(inchange)":""}/>
            <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {show?<EyeOff size={14} style={{color:C.slate}}/>:<Eye size={14} style={{color:C.slate}}/>}
            </button>
          </div>
        </Field>
        <Field label="Role">
          <select value={form.role||"lecteur"} onChange={e=>set("role",e.target.value)} style={iStyle} disabled={user?.id===currentUserId}>
            {Object.entries(ROLES).map(([v,r])=><option key={v} value={v}>{r.label}</option>)}
          </select>
        </Field>
        <div className="p-3 rounded-sm text-xs flex flex-col gap-1" style={{background:C.paper}}>
          {[["Modifier les donnees","canEdit"],["Supprimer","canDelete"],["Gerer les utilisateurs","canManageUsers"],["Voir les finances","canViewFinances"]].map(([lbl,perm])=>(
            <div key={perm} className="flex items-center gap-2" style={{color:role?.[perm]?C.sage:C.rust}}>
              <span>{role?.[perm]?"✓":"✗"}</span><span>{lbl}</span>
            </div>
          ))}
        </div>
        {error&&<p className="text-xs" style={{color:C.rust}}>{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
          <button type="submit" className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>Enregistrer</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ===================== DASHBOARD ===================== */
function Dashboard({members,transactions,monthlyData,totals,annee,config}) {
  const retards=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="late");
  const payes=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="paid").length;
  const recent=[...transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,7);
  const tauxCot=members.length>0?Math.round(payes/members.length*100):0;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Tableau de bord</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Vue d'ensemble</h1>
        {config.city&&<p className="text-sm mt-1" style={{color:C.slate}}>{config.city}</p>}
      </div>
      {retards.length>0&&(
        <div className="flex items-start gap-2 px-4 py-3 rounded-sm" style={{background:"rgba(168,68,46,0.08)",border:`1px solid ${C.rust}`}}>
          <AlertTriangle size={16} style={{color:C.rust,marginTop:"1px"}}/>
          <div className="text-sm" style={{color:C.rust}}>
            <strong>{retards.length} membre{retards.length>1?"s":""} en retard de cotisation {annee}</strong> : {retards.slice(0,3).map(m=>m.name).join(", ")}{retards.length>3?" \u2026":""}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Solde" value={fcfa(totals.balance)} icon={Wallet} accent={C.ink} sub={`Exercice ${annee}`}/>
        <StatCard label="Recettes" value={fcfa(totals.income)} icon={TrendingUp} accent={C.sage}/>
        <StatCard label="Depenses" value={fcfa(totals.expense)} icon={TrendingDown} accent={C.rust}/>
        <StatCard label="Membres" value={members.length} icon={Users} accent={C.brass} sub={`${payes} regles (${tauxCot}%)`}/>
      </div>
      <div className="p-4 sm:p-5 rounded-sm" style={{background:C.cream}}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{color:C.slate}}>Taux de cotisation {annee}</h2>
          <span style={{fontFamily:FM,fontSize:"13px",color:C.brass}}>{tauxCot}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{background:C.line}}>
          <div className="h-full rounded-full" style={{width:`${tauxCot}%`,background:tauxCot>=80?C.sage:tauxCot>=50?C.brass:C.rust,transition:"width 0.5s"}}/>
        </div>
      </div>
      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Evolution 12 mois</h2>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid stroke={C.line} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:C.slate}} axisLine={{stroke:C.line}} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.slate}} axisLine={false} tickLine={false} width={60}/>
              <Tooltip formatter={v=>fcfa(v)} contentStyle={{fontFamily:FM,fontSize:"12px",border:`1px solid ${C.line}`}}/>
              <Line type="monotone" dataKey="income" name="Recettes" stroke={C.sage} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="expense" name="Depenses" stroke={C.rust} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-2" style={{color:C.slate}}>Dernieres ecritures</h2>
        {recent.length===0
          ? <p className="text-sm py-8 text-center" style={{color:C.slate}}>Aucune transaction. Commencez depuis Finances.</p>
          : recent.map(tx=><TxRow key={tx.id} tx={tx} readOnly/>)
        }
      </div>
    </div>
  );
}

/* ===================== MEMBERS TAB ===================== */
function MembersTab({members,annee,search,onSearch,onNew,onEdit,onDelete,onMarkPaid,onHistory,currentUser,onMobileMoney=null}) {
  const [filtre,setFiltre]=useState("all");
  const filtered=members.filter(m=>{
    const s=(m.cotisations?.[annee]?.status||"pending");
    return (filtre==="all"||s===filtre)&&m.name.toLowerCase().includes(search.toLowerCase());
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const exportM=()=>exportCSV(members.map(m=>({Nom:m.name,Email:m.email||"",Telephone:m.phone||"","Date adhesion":m.joinDate||"",[`Statut ${annee}`]:STATUTS.find(s=>s.value===(m.cotisations?.[annee]?.status||"pending"))?.label||"",[`Date paiement ${annee}`]:m.cotisations?.[annee]?.date||"","Cotisation FCFA":m.cotisationAmount||0})),"membres.csv");
  const cedit=can(currentUser,"canEdit"), cdel=can(currentUser,"canDelete");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Registre \u2014 {annee}</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Membres</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportM} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}><Download size={14}/> Export CSV</button>
          {cedit&&<button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouveau membre</button>}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher\u2026" style={{...iStyle,paddingLeft:"36px"}}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{v:"all",l:"Tous"},{v:"paid",l:"Regles"},{v:"pending",l:"En attente"},{v:"late",l:"En retard"}].map(opt=>(
            <button key={opt.v} onClick={()=>setFiltre(opt.v)} className="px-3 py-2 rounded-sm text-xs font-medium"
              style={{background:filtre===opt.v?C.ink:C.paper,color:filtre===opt.v?C.cream:C.slate,border:`1px solid ${filtre===opt.v?C.ink:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0
        ? <div className="text-center py-16 rounded-sm" style={{background:C.cream}}><Users size={28} className="mx-auto mb-3" style={{color:C.line}}/><p className="text-sm" style={{color:C.slate}}>{members.length===0?"Aucun membre. Ajoutez le premier.":"Aucun resultat pour ce filtre."}</p></div>
        : <div className="rounded-sm overflow-hidden" style={{background:C.cream}}>{filtered.map(m=><MemberCard key={m.id} member={m} annee={annee} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} onHistory={onHistory} canEdit={cedit} canDelete={cdel} onMobileMoney={onMobileMoney}/>)}</div>
      }
    </div>
  );
}

/* ===================== FINANCES TAB ===================== */
function FinancesTab({transactions,members,filter,onFilter,search,onSearch,onNew,onEdit,onDelete,currentUser}) {
  const cvf=can(currentUser,"canViewFinances");
  const cedit=can(currentUser,"canEdit"), cdel=can(currentUser,"canDelete");
  const filtered=transactions.filter(t=>(filter==="all"||t.type===filter)&&((t.description||"").toLowerCase().includes(search.toLowerCase())||(t.category||"").toLowerCase().includes(search.toLowerCase())));
  const groups=groupByMonth(filtered);
  const exportT=()=>exportCSV(transactions.map(t=>({Date:t.date||"",Type:t.type==="income"?"Recette":"Depense",Categorie:t.category,Description:t.description||"",Montant:t.amount,Membre:members.find(m=>m.id===t.memberId)?.name||""})),"transactions.csv");
  if(!cvf) return <div className="flex flex-col items-center justify-center py-24 gap-3"><Lock size={32} style={{color:C.line}}/><p className="text-sm" style={{color:C.slate}}>Vous n'avez pas acces aux finances.</p></div>;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Grand livre</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Finances</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportT} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}><Download size={14}/> Export CSV</button>
          {cedit&&<button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouvelle transaction</button>}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/><input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher\u2026" style={{...iStyle,paddingLeft:"36px"}}/></div>
        <div className="flex gap-2">{[{v:"all",l:"Tout"},{v:"income",l:"Recettes"},{v:"expense",l:"Depenses"}].map(opt=>(<button key={opt.v} onClick={()=>onFilter(opt.v)} className="px-3 py-2 rounded-sm text-sm font-medium" style={{background:filter===opt.v?C.ink:C.paper,color:filter===opt.v?C.cream:C.slate,border:`1px solid ${filter===opt.v?C.ink:C.line}`}}>{opt.l}</button>))}</div>
      </div>
      {groups.length===0
        ? <div className="text-center py-16 rounded-sm" style={{background:C.cream}}><Wallet size={28} className="mx-auto mb-3" style={{color:C.line}}/><p className="text-sm" style={{color:C.slate}}>{transactions.length===0?"Aucune transaction.":"Aucun resultat."}</p></div>
        : groups.map(g=>(
          <div key={g.key} className="rounded-sm overflow-hidden" style={{background:C.cream}}>
            <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${C.line}`}}>
              <span style={{color:C.ink,fontFamily:FD,fontSize:"15px"}}>{g.label}</span>
              <span className="text-sm font-semibold" style={{fontFamily:FM,color:g.sous>=0?C.sage:C.rust}}>{g.sous>=0?"+ ":"\u2212 "}{fcfa(Math.abs(g.sous))}</span>
            </div>
            <div className="px-4">{g.items.map(tx=><TxRow key={tx.id} tx={tx} onEdit={cedit?onEdit:null} onDelete={cdel?onDelete:null} readOnly={!cedit}/>)}</div>
          </div>
        ))
      }
    </div>
  );
}

/* ===================== REPORTS TAB ===================== */
function ReportsTab({members,transactions,monthlyData,annee,config}) {
  const incBreak=catBreak(transactions,"income");
  const expBreak=catBreak(transactions,"expense");
  const income=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0);
  const expense=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0);
  const paid=members.filter(m=>m.cotisations?.[annee]?.status==="paid");
  const pending=members.filter(m=>(m.cotisations?.[annee]?.status||"pending")==="pending");
  const late=members.filter(m=>m.cotisations?.[annee]?.status==="late");
  const totCotAtt=members.reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const totCotPerc=paid.reduce((s,m)=>s+(+m.cotisationAmount||0),0);
  const donuts=[{name:"Regle",value:paid.length,color:C.sage},{name:"En attente",value:pending.length,color:C.brass},{name:"En retard",value:late.length,color:C.rust}].filter(d=>d.value>0);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Bilan</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Rapports</h1>
        </div>
        <button onClick={()=>printReport(members,transactions,config,annee)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-medium self-start" style={{background:C.brass,color:C.cream}}><Printer size={15}/> Rapport PDF complet</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Cotisations attendues ${annee}`} value={fcfa(totCotAtt)} accent={C.brass}/>
        <StatCard label="Percues" value={fcfa(totCotPerc)} accent={C.sage}/>
        <StatCard label="Taux recouvrement" value={totCotAtt>0?Math.round(totCotPerc/totCotAtt*100)+"%":"\u2014"} accent={C.ink}/>
        <StatCard label="Reste a percevoir" value={fcfa(totCotAtt-totCotPerc)} accent={C.rust}/>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Statuts cotisation {annee}</h2>
          {members.length===0?<p className="text-sm text-center py-8" style={{color:C.slate}}>Aucun membre.</p>:
            <div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={donuts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{donuts.map(d=><Cell key={d.name} fill={d.color}/>)}</Pie><Tooltip/><Legend wrapperStyle={{fontSize:"12px"}}/></PieChart></ResponsiveContainer></div>}
        </div>
        <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>Recettes & depenses 12 mois</h2>
          <div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><CartesianGrid stroke={C.line} vertical={false}/><XAxis dataKey="label" tick={{fontSize:10,fill:C.slate}} axisLine={{stroke:C.line}} tickLine={false}/><YAxis tick={{fontSize:10,fill:C.slate}} axisLine={false} tickLine={false} width={55}/><Tooltip formatter={v=>fcfa(v)}/><Legend wrapperStyle={{fontSize:"11px"}}/><Bar dataKey="income" name="Recettes" fill={C.sage} radius={[2,2,0,0]}/><Bar dataKey="expense" name="Depenses" fill={C.rust} radius={[2,2,0,0]}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {[{title:"Recettes par categorie",data:incBreak},{title:"Depenses par categorie",data:expBreak}].map(({title,data})=>(
          <div key={title} className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{color:C.slate}}>{title}</h2>
            {data.length===0?<p className="text-sm text-center py-8" style={{color:C.slate}}>Aucune donnee.</p>:
              <>
                <div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>{data.map((_,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}</Pie><Tooltip formatter={v=>fcfa(v)}/><Legend wrapperStyle={{fontSize:"11px"}}/></PieChart></ResponsiveContainer></div>
                <div className="mt-2 flex flex-col gap-1">{data.map((d,i)=>(
                  <div key={d.name} className="flex items-center justify-between text-xs py-1" style={{borderBottom:`1px solid ${C.line}`}}>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:PAL[i%PAL.length]}}/><span style={{color:C.ink}}>{d.name}</span></div>
                    <span style={{fontFamily:FM,color:C.slate}}>{fcfa(d.value)}</span>
                  </div>
                ))}</div>
              </>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== SETTINGS TAB ===================== */
function SettingsTab({config,onSaveConfig,users,currentUser,onAddUser,onEditUser,onDeleteUser}) {
  const [form,setForm]=useState(config);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const canManage=can(currentUser,"canManageUsers");
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Configuration</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Parametres</h1>
      </div>
      <div className="p-5 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Association</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom"><input value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/></Field>
          <Field label="Ville"><input value={form.city||""} onChange={e=>set("city",e.target.value)} placeholder="Abidjan" style={iStyle}/></Field>
        </div>
        <Field label="Contact"><input value={form.contact||""} onChange={e=>set("contact",e.target.value)} placeholder="+225 07 00 00 00 00" style={iStyle}/></Field>
      </div>
      <div className="p-5 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Cotisations</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Annee active"><input type="number" min="2000" max="2100" value={form.annee||new Date().getFullYear()} onChange={e=>set("annee",e.target.value)} style={iStyle}/></Field>
          <Field label="Montant par defaut (FCFA)"><input type="number" min="0" step="100" value={form.defaultCot||""} onChange={e=>set("defaultCot",e.target.value)} style={iStyle}/></Field>
        </div>
        <Field label="Nombre de tranches de cotisation">
          <select value={form.nb_tranches||1} onChange={e=>set("nb_tranches",Number(e.target.value))} style={iStyle}>
            <option value={1}>1 paiement unique (annuel)</option>
            <option value={2}>2 tranches (semestriel)</option>
            <option value={3}>3 tranches (trimestriel)</option>
            <option value={4}>4 tranches</option>
          </select>
        </Field>
      </div>
      <button onClick={()=>onSaveConfig(form)} className="py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream}}>Enregistrer les parametres</button>
      {canManage&&(
        <div className="p-5 rounded-sm flex flex-col gap-4" style={{background:C.cream}}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Utilisateurs ({users.length})</h2>
            <button onClick={onAddUser} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium" style={{background:C.ink,color:C.cream}}><UserPlus size={13}/> Ajouter</button>
          </div>
          {users.map(u=>(
            <div key={u.id} className="flex items-center justify-between py-3" style={{borderBottom:`1px solid ${C.line}`}}>
              <div>
                <div className="text-sm font-medium" style={{color:C.ink}}>{u.name||u.username}</div>
                <div className="text-xs" style={{color:C.slate}}>@{u.username} \u00b7 {ROLES[u.role]?.label}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>onEditUser(u)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>
                {u.id!==currentUser.id&&<button onClick={()=>onDeleteUser(u)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== MOBILE MONEY MODAL ===================== */
const PROVIDERS_CI = [
  {code:"",       label:"Page de paiement GeniusPay (recommande)",  color:"#1C2541", icon:"GP"},
  {code:"ORANGE_CIV",    label:"Orange Money",   color:"#FF6600", icon:"OM"},
  {code:"MTN_MOMO_CIV",  label:"MTN Mobile Money", color:"#FFCB06",icon:"MTN"},
  {code:"WAVE_CIV",      label:"Wave",           color:"#1DC7B5", icon:"WV"},
  {code:"MOOV_CIV",      label:"Moov Money",     color:"#0054A6", icon:"MV"},
];

function MobileMoneyModal({member,annee,assocName,currentUser,onClose}){
  const [provider,setProvider]=useState("");
  const [phone,setPhone]=useState(member.phone||"");
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState("idle"); // idle, waiting, error
  const [errMsg,setErrMsg]=useState("");
  const [checkoutUrl,setCheckoutUrl]=useState("");
  const [ref,setRef]=useState("");

  const initPayment=async()=>{
    setLoading(true);setErrMsg("");
    const{data,error}=await supabase.functions.invoke("create-payment",{
      body:{
        memberId:member.id,memberName:member.name,memberEmail:member.email||null,
        phone:phone||member.phone||null,amount:member.cotisationAmount,
        annee,assocName:assocName||"Association",
        provider:provider||null,
        successUrl:window.location.href
      }
    });
    setLoading(false);
    if(error||!data?.checkout_url){
      setErrMsg(data?.error||error?.message||"Erreur de connexion a GeniusPay. Verifiez vos secrets Supabase.");
      setStatus("error");return;
    }
    setCheckoutUrl(data.checkout_url);
    setRef(data.reference||"");
    setStatus("waiting");
    window.open(data.checkout_url,"_blank","noopener,noreferrer");
  };

  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.65)"}} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"18px",color:C.ink}}>Payer par Mobile Money</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Infos membre */}
          <div className="p-3 rounded-sm" style={{background:C.paper}}>
            <div className="text-sm font-semibold" style={{color:C.ink}}>{member.name}</div>
            <div className="text-xs mt-0.5" style={{color:C.slate,fontFamily:FM}}>
              Cotisation {annee} : {(member.cotisationAmount||0).toLocaleString("fr-FR")} FCFA
            </div>
          </div>

          {status==="idle"&&(
            <>
              {/* Choix opérateur */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{color:C.slate}}>Choisir le moyen de paiement</p>
                <div className="flex flex-col gap-2">
                  {PROVIDERS_CI.map(p=>(
                    <button key={p.code} onClick={()=>setProvider(p.code)}
                      className="flex items-center gap-3 p-3 rounded-sm text-left transition-colors"
                      style={{border:`2px solid ${provider===p.code?p.color||C.ink:C.line}`,background:provider===p.code?`${p.color||C.ink}0D`:"transparent"}}>
                      <div className="w-9 h-9 rounded-sm flex items-center justify-center text-xs font-bold shrink-0"
                        style={{background:p.color||C.ink,color:"#fff"}}>{p.icon}</div>
                      <span className="text-sm font-medium" style={{color:C.ink}}>{p.label}</span>
                      {provider===p.code&&<CheckCircle2 size={16} className="ml-auto shrink-0" style={{color:p.color||C.ink}}/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de téléphone (si opérateur direct) */}
              {provider&&(
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Numero de telephone *</span>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
                    <input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel"
                      placeholder="07 12 34 56 78" style={{...iStyle,paddingLeft:"34px"}}/>
                  </div>
                  <p className="text-xs" style={{color:C.slate}}>Le client recevra une demande de confirmation sur son telephone.</p>
                </div>
              )}

              {!provider&&(
                <p className="text-xs p-3 rounded-sm" style={{background:"rgba(184,137,59,0.08)",color:C.brass}}>
                  La page de paiement GeniusPay permet au membre de choisir lui-meme son operateur (Orange, MTN, Wave, Moov, Carte...).
                </p>
              )}

              <button onClick={initPayment} disabled={loading||(!phone&&!!provider)}
                className="w-full py-3 rounded-sm text-sm font-semibold flex items-center justify-center gap-2"
                style={{background:loading?"#DED5BE":C.ink,color:C.cream,opacity:(!phone&&!!provider)?0.5:1}}>
                {loading?<><RefreshCw size={16} className="animate-spin"/> Connexion a GeniusPay...</>
                  :<><Smartphone size={16}/> Initier le paiement</>}
              </button>
            </>
          )}

          {status==="waiting"&&(
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:"rgba(79,111,82,0.1)"}}>
                <Smartphone size={28} style={{color:C.sage}}/>
              </div>
              <div className="text-center">
                <h4 className="text-base font-semibold mb-1" style={{color:C.ink}}>Page de paiement ouverte</h4>
                <p className="text-sm" style={{color:C.slate}}>
                  {provider?"Le membre doit confirmer le paiement sur son telephone.":"Le membre doit completer le paiement sur la page GeniusPay."}
                </p>
                {ref&&<p className="text-xs mt-2" style={{color:C.slate,fontFamily:FM}}>Ref : {ref}</p>}
              </div>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-sm"
                style={{border:`1px solid ${C.line}`,color:C.slate}}>
                <ExternalLink size={13}/> Rouvrir la page de paiement
              </a>
              <p className="text-xs text-center" style={{color:C.slate}}>
                La cotisation sera automatiquement marquee comme reglee des que le paiement est confirme par GeniusPay (webhook).
              </p>
              <button onClick={onClose} className="text-xs" style={{color:C.slate}}>Fermer</button>
            </div>
          )}

          {status==="error"&&(
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-sm" style={{background:"rgba(168,68,46,0.08)",border:`1px solid ${C.rust}`}}>
                <p className="text-sm font-medium" style={{color:C.rust}}>Erreur</p>
                <p className="text-xs mt-1" style={{color:C.rust}}>{errMsg}</p>
              </div>
              <button onClick={()=>setStatus("idle")} className="py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>
                Reessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== APP ROOT ===================== */
const DEF_CONFIG={name:"Mon Association",city:"",contact:"",annee:String(new Date().getFullYear()),defaultCot:""};

export default function App(){
  const [loading,   setLoading]  = useState(true);
  const [users,     setUsers]    = useState([]);
  const [currentUser,setCurrent] = useState(null);
  const [members,   setMembers]  = useState([]);
  const [txs,       setTxs]      = useState([]);
  const [config,    setConfig]   = useState(DEF_CONFIG);
  const [online,    setOnline]   = useState(true);
  const [tab,       setTab]      = useState("dashboard");
  const [mbrModal,  setMbrModal] = useState(null);
  const [txModal,   setTxModal]  = useState(null);
  const [histModal, setHistModal]= useState(null);
  const [recuInfo,  setRecuInfo] = useState(null);
  const [userModal, setUserModal]= useState(null);
  const [mbrSearch, setMbrSearch]= useState("");
  const [txFilter,  setTxFilter] = useState("all");
  const [txSearch,  setTxSearch] = useState("");
  const [confirm,   setConfirm]  = useState(null);
  const [toast,     setToast]    = useState("");
  const [saving,    setSaving]   = useState(false);
  const [showNotif, setShowNotif]= useState(false);
  const [otpStep,   setOtpStep]  = useState(null); // {user, code, expiresAt}
  const [otpCountdown,setOtpCountdown]=useState(0);
  const [otpSending,setOtpSending]=useState(false);
  const [reunions,  setReunions] = useState([]);
  const [evenements,setEvenements]=useState([]);
  const [reunionModal,setReunionModal]=useState(null);
  const [eventModal,setEventModal]=useState(null);
  const [sanctions, setSanctions] = useState([]);
  const [sanctionModal,setSanctionModal]=useState(null);
  const [mmModal,    setMmModal]    = useState(null); // member pour paiement Mobile Money
  const notifRef=useRef(null);
  const otpTimerRef=useRef(null);

  /* Chargement initial */
  useEffect(()=>{
    (async()=>{
      try{
        const [{data:ud},{data:md},{data:td},{data:cd},{data:rd},{data:ed},{data:sd}]=await Promise.all([
          supabase.from("app_users").select("*"),
          supabase.from("members").select("*"),
          supabase.from("transactions").select("*").order("date",{ascending:false}),
          supabase.from("config").select("*").eq("id",1).maybeSingle(),
          supabase.from("reunions").select("*").order("date",{ascending:false}),
          supabase.from("evenements").select("*").order("date",{ascending:false}),
          supabase.from("sanctions").select("*").order("date",{ascending:false})
        ]);
        const mu=(ud||[]).map(userFromDb);
        setUsers(mu);
        setMembers((md||[]).map(memberFromDb));
        setTxs((td||[]).map(txFromDb));
        if(cd?.data) setConfig(c=>({...c,...cd.data}));
        setReunions(rd||[]);
        setEvenements(ed||[]);
        setSanctions(sd||[]);
        const sid=sessionStorage.getItem("currentUserId");
        if(sid){const found=mu.find(u=>u.id===sid);if(found)setCurrent(found);}
        setOnline(true);
      }catch(err){console.error(err);setOnline(false);}
      setLoading(false);
    })();
  },[]);

  /* Temps reel */
  useEffect(()=>{
    if(!currentUser) return;
    const c1=supabase.channel("rt-members").on("postgres_changes",{event:"*",schema:"public",table:"members"},p=>{
      if(p.eventType==="DELETE"){setMembers(v=>v.filter(m=>m.id!==p.old.id));}
      else{const m=memberFromDb(p.new);setMembers(v=>v.some(x=>x.id===m.id)?v.map(x=>x.id===m.id?m:x):[...v,m]);}
    }).subscribe();
    const c2=supabase.channel("rt-transactions").on("postgres_changes",{event:"*",schema:"public",table:"transactions"},p=>{
      if(p.eventType==="DELETE"){setTxs(v=>v.filter(t=>t.id!==p.old.id));}
      else{const t=txFromDb(p.new);setTxs(v=>v.some(x=>x.id===t.id)?v.map(x=>x.id===t.id?t:x):[t,...v]);}
    }).subscribe();
    const c3=supabase.channel("rt-users").on("postgres_changes",{event:"*",schema:"public",table:"app_users"},p=>{
      if(p.eventType==="DELETE"){setUsers(v=>v.filter(u=>u.id!==p.old.id));}
      else{const u=userFromDb(p.new);setUsers(v=>v.some(x=>x.id===u.id)?v.map(x=>x.id===u.id?u:x):[...v,u]);}
    }).subscribe();
    const c4=supabase.channel("rt-reunions").on("postgres_changes",{event:"*",schema:"public",table:"reunions"},p=>{
      if(p.eventType==="DELETE"){setReunions(v=>v.filter(r=>r.id!==p.old.id));}
      else{setReunions(v=>v.some(x=>x.id===p.new.id)?v.map(x=>x.id===p.new.id?p.new:x):[p.new,...v]);}
    }).subscribe();
    const c5=supabase.channel("rt-evenements").on("postgres_changes",{event:"*",schema:"public",table:"evenements"},p=>{
      if(p.eventType==="DELETE"){setEvenements(v=>v.filter(e=>e.id!==p.old.id));}
      else{setEvenements(v=>v.some(x=>x.id===p.new.id)?v.map(x=>x.id===p.new.id?p.new:x):[p.new,...v]);}
    }).subscribe();
    const c6=supabase.channel("rt-sanctions").on("postgres_changes",{event:"*",schema:"public",table:"sanctions"},p=>{
      if(p.eventType==="DELETE"){setSanctions(v=>v.filter(s=>s.id!==p.old.id));}
      else{setSanctions(v=>v.some(x=>x.id===p.new.id)?v.map(x=>x.id===p.new.id?p.new:x):[p.new,...v]);}
    }).subscribe();
    return()=>{supabase.removeChannel(c1);supabase.removeChannel(c2);supabase.removeChannel(c3);supabase.removeChannel(c4);supabase.removeChannel(c5);supabase.removeChannel(c6);};
  },[currentUser]);

  useEffect(()=>{
    const h=e=>{if(notifRef.current&&!notifRef.current.contains(e.target))setShowNotif(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  const toast2=msg=>{setToast(msg);setTimeout(()=>setToast(""),2600);};

  /* Auth */
  /* OTP helpers */
  const generateAndSendOTP=async(user)=>{
    setOtpSending(true);
    const code=String(Math.floor(100000+Math.random()*900000));
    const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
    // Invalider les anciens codes
    await supabase.from("otp_codes").update({used:true}).eq("user_id",user.id).eq("used",false);
    // Stocker le nouveau code
    await supabase.from("otp_codes").insert({id:uid(),user_id:user.id,code,expires_at:expiresAt,used:false});
    // Envoyer via Edge Function (si Twilio configuré)
    try{
      await supabase.functions.invoke("send-otp",{body:{userId:user.id,phone:user.phone,code,assocName:config.name}});
    }catch(e){console.warn("OTP SMS non envoye, code en DB:",code);}
    // Démarrer le countdown
    setOtpStep({user,code,expiresAt});
    setOtpCountdown(600);
    if(otpTimerRef.current)clearInterval(otpTimerRef.current);
    otpTimerRef.current=setInterval(()=>{
      setOtpCountdown(c=>{if(c<=1){clearInterval(otpTimerRef.current);return 0;}return c-1;});
    },1000);
    setOtpSending(false);
  };

  const verifyOTP=async(enteredCode,setError)=>{
    if(!otpStep){return;}
    // Vérifier en base
    const{data,error}=await supabase.from("otp_codes")
      .select("*").eq("user_id",otpStep.user.id).eq("code",enteredCode)
      .eq("used",false).gt("expires_at",new Date().toISOString()).maybeSingle();
    if(error||!data){setError("Code incorrect ou expire. Reessayez.");return;}
    // Marquer utilisé
    await supabase.from("otp_codes").update({used:true}).eq("id",data.id);
    // Connexion
    if(otpTimerRef.current)clearInterval(otpTimerRef.current);
    setOtpStep(null);
    setCurrent(otpStep.user);
    sessionStorage.setItem("currentUserId",otpStep.user.id);
  };

  const cancelOTP=()=>{
    if(otpTimerRef.current)clearInterval(otpTimerRef.current);
    setOtpStep(null);setOtpCountdown(0);
  };

  const handleSetup=async form=>{
    setSaving(true);
    const admin={id:uid(),name:form.adminName||"Admin",username:form.username,password:form.password,role:"admin"};
    const nc={...DEF_CONFIG,name:form.assocName,city:form.city};
    const {error:ue}=await supabase.from("app_users").insert({id:admin.id,name:admin.name,username:admin.username,password:admin.password,role:"admin"});
    if(ue){toast2("Erreur: "+ue.message);setSaving(false);return;}
    await supabase.from("config").upsert({id:1,data:nc});
    setUsers([admin]);setConfig(nc);setCurrent(admin);
    sessionStorage.setItem("currentUserId",admin.id);setSaving(false);
  };
  const handleLogin=async u=>{
    const otpEnabled=config.otp_enabled&&u.phone;
    if(otpEnabled){
      await generateAndSendOTP(u);
    } else {
      setCurrent(u);sessionStorage.setItem("currentUserId",u.id);
    }
  };
  const handleLogout=()=>{setCurrent(null);sessionStorage.removeItem("currentUserId");};

  /* CRUD Membres */
  const saveMbr=async data=>{
    setSaving(true);
    const{error}=await supabase.from("members").upsert(memberToDb(data));
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setMembers(v=>v.some(m=>m.id===data.id)?v.map(m=>m.id===data.id?data:m):[...v,data]);
    setMbrModal(null);toast2("Membre enregistre.");setSaving(false);
  };
  const delMbr=async m=>{
    const{error}=await supabase.from("members").delete().eq("id",m.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setMembers(v=>v.filter(x=>x.id!==m.id));setConfirm(null);toast2("Membre supprime.");
  };
  const markPaid=async m=>{
    const d=today();
    const upd={...m,cotisations:{...(m.cotisations||{}),[config.annee]:{status:"paid",date:d}}};
    const newTx={id:uid(),date:d,type:"income",category:"Cotisations",amount:Number(m.cotisationAmount)||0,description:`Cotisation ${config.annee} – ${m.name}`,memberId:m.id};
    const [{error:me},{error:te}]=await Promise.all([
      supabase.from("members").upsert(memberToDb(upd)),
      supabase.from("transactions").insert(txToDb(newTx))
    ]);
    if(me||te){toast2("Erreur lors de l'enregistrement.");return;}
    setMembers(v=>v.map(x=>x.id===m.id?upd:x));
    setTxs(v=>[newTx,...v]);
    const waMsg=`Bonjour ${m.name}, votre cotisation ${config.annee} de ${fcfa(m.cotisationAmount)} a bien ete enregistree. Merci de votre adhesion ! \u2014 ${config.name}`;
    toast2(`${m.name} marque(e) regle(e).`);
    setRecuInfo({member:upd,tx:newTx,whatsappMsg:waMsg});
  };

  /* CRUD Transactions */
  const saveTx=async data=>{
    setSaving(true);
    const{error}=await supabase.from("transactions").upsert(txToDb(data));
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setTxs(v=>v.some(t=>t.id===data.id)?v.map(t=>t.id===data.id?data:t):[data,...v]);
    setTxModal(null);toast2("Transaction enregistree.");setSaving(false);
  };
  const delTx=async t=>{
    const{error}=await supabase.from("transactions").delete().eq("id",t.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setTxs(v=>v.filter(x=>x.id!==t.id));setConfirm(null);toast2("Transaction supprimee.");
  };

  /* Config */
  const saveConfig=async cfg=>{
    setSaving(true);
    const{error}=await supabase.from("config").upsert({id:1,data:cfg});
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setConfig(cfg);toast2("Parametres enregistres.");setSaving(false);
  };

  /* CRUD Réunions */
  const saveReunion=async data=>{
    setSaving(true);
    const{error}=await supabase.from("reunions").upsert(data);
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setReunions(v=>v.some(r=>r.id===data.id)?v.map(r=>r.id===data.id?data:r):[data,...v]);
    setReunionModal(null);toast2("Reunion enregistree.");setSaving(false);
  };
  const delReunion=async r=>{
    const{error}=await supabase.from("reunions").delete().eq("id",r.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setReunions(v=>v.filter(x=>x.id!==r.id));setConfirm(null);toast2("Reunion supprimee.");
  };

  /* CRUD Événements */
  const saveEvent=async data=>{
    setSaving(true);
    const{error}=await supabase.from("evenements").upsert(data);
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setEvenements(v=>v.some(e=>e.id===data.id)?v.map(e=>e.id===data.id?data:e):[data,...v]);
    setEventModal(null);toast2("Evenement enregistre.");setSaving(false);
  };
  const delEvent=async e=>{
    const{error}=await supabase.from("evenements").delete().eq("id",e.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setEvenements(v=>v.filter(x=>x.id!==e.id));setConfirm(null);toast2("Evenement supprime.");
  };

  /* Budget prévisionnel */
  const saveBudget=async budgetData=>{
    setSaving(true);
    const newConfig={...config,budget:budgetData};
    const{error}=await supabase.from("config").upsert({id:1,data:newConfig});
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setConfig(newConfig);toast2("Budget enregistre.");setSaving(false);
  };

  /* CRUD Sanctions */
  const saveSanction=async data=>{
    setSaving(true);
    const{error}=await supabase.from("sanctions").upsert(data);
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setSanctions(v=>v.some(s=>s.id===data.id)?v.map(s=>s.id===data.id?data:s):[data,...v]);
    setSanctionModal(null);toast2("Sanction enregistree.");setSaving(false);
  };
  const delSanction=async s=>{
    const{error}=await supabase.from("sanctions").delete().eq("id",s.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setSanctions(v=>v.filter(x=>x.id!==s.id));setConfirm(null);toast2("Sanction supprimee.");
  };
  const markSanctionPaid=async s=>{
    setSaving(true);
    const d=today();const upd={...s,paid:true,paid_date:d};
    const{error}=await supabase.from("sanctions").upsert(upd);
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    const member=members.find(m=>m.id===s.member_id);
    if(s.montant>0){
      const newTx={id:uid(),date:d,type:"income",category:"Sanctions",amount:Number(s.montant),description:`Reglement amende \u2013 ${member?.name||""}`,memberId:s.member_id};
      await supabase.from("transactions").insert(txToDb(newTx));
      setTxs(v=>[newTx,...v]);
    }
    setSanctions(v=>v.map(x=>x.id===s.id?upd:x));
    toast2("Amende reglee.");setSaving(false);
  };

  /* CRUD Utilisateurs */
  const saveUser=async data=>{
    setSaving(true);
    const exists=users.some(u=>u.id===data.id);
    const saved={...data};
    if(exists&&!data.password)saved.password=users.find(u=>u.id===data.id)?.password||"";
    const{error}=await supabase.from("app_users").upsert({id:saved.id,name:saved.name,username:saved.username,password:saved.password,role:saved.role,phone:saved.phone||null});
    if(error){toast2("Erreur: "+error.message);setSaving(false);return;}
    setUsers(v=>v.some(u=>u.id===saved.id)?v.map(u=>u.id===saved.id?saved:u):[...v,saved]);
    if(data.id===currentUser?.id){setCurrent(saved);sessionStorage.setItem("currentUserId",saved.id);}
    setUserModal(null);toast2("Utilisateur enregistre.");setSaving(false);
  };
  const delUser=async u=>{
    const{error}=await supabase.from("app_users").delete().eq("id",u.id);
    if(error){toast2("Erreur: "+error.message);return;}
    setUsers(v=>v.filter(x=>x.id!==u.id));setConfirm(null);toast2("Utilisateur supprime.");
  };

  /* Calculs */
  const totals=useMemo(()=>{
    const income=txs.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0);
    const expense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0);
    return{income,expense,balance:income-expense};
  },[txs]);

  const monthlyData=useMemo(()=>{
    const now=new Date();
    return Array.from({length:12},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-11+i,1);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mt=txs.filter(t=>(t.date||"").slice(0,7)===k);
      return{key:k,label:`${MOIS_COURT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,income:mt.filter(t=>t.type==="income").reduce((s,t)=>s+(+t.amount),0),expense:mt.filter(t=>t.type==="expense").reduce((s,t)=>s+(+t.amount),0)};
    });
  },[txs]);

  const notifCount=members.filter(m=>{const s=m.cotisations?.[config.annee]?.status||"pending";return s==="late"||s==="pending";}).length;
  const NAV=[{id:"dashboard",label:"Tableau de bord",icon:LayoutDashboard},{id:"members",label:"Membres",icon:Users},{id:"finances",label:"Finances",icon:Wallet},{id:"reunions",label:"Reunions",icon:BookOpen},{id:"evenements",label:"Evenements",icon:CalendarDays},{id:"budget",label:"Budget",icon:Layers},{id:"sanctions",label:"Sanctions",icon:AlertTriangle},{id:"carte",label:"Carte",icon:MapPin},{id:"messages",label:"Messages",icon:MessageSquare},{id:"galerie",label:"Galerie",icon:Camera},{id:"votes",label:"Votes",icon:Vote},{id:"reports",label:"Rapports",icon:BarChart3},{id:"settings",label:"Parametres",icon:Settings}];

  if(otpStep) return<OTPScreen pending={otpStep} countdown={otpCountdown} sending={otpSending}
    onVerify={verifyOTP} onBack={cancelOTP}
    onResend={()=>generateAndSendOTP(otpStep.user)}/>;

  if(loading) return<div className="min-h-screen flex items-center justify-center" style={{background:C.ink}}><style>{FONT_IMPORT}</style><p style={{color:C.slate,fontFamily:FM,fontSize:"14px"}}>Connexion a la base de donnees…</p></div>;

  if(!online) return<div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{background:C.ink}}>
    <style>{FONT_IMPORT}</style>
    <AlertTriangle size={40} style={{color:C.rust}}/>
    <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:"22px",color:C.cream}}>Impossible de se connecter a Supabase</h2>
    <p className="text-sm text-center max-w-sm" style={{color:"rgba(247,243,233,0.5)"}}>Verifiez votre fichier .env (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY) puis rechargez la page.</p>
    <button onClick={()=>window.location.reload()} className="px-4 py-2.5 rounded-sm text-sm font-medium mt-2" style={{background:C.brass,color:C.cream}}>Reessayer</button>
  </div>;

  if(users.length===0) return<SetupScreen onSetup={handleSetup}/>;
  if(!currentUser) return<LoginScreen users={users} onLogin={handleLogin}/>;

  const roleInfo=ROLES[currentUser.role];

  return<div className="min-h-screen flex flex-col lg:flex-row" style={{background:C.paper,fontFamily:FB}}>
    <style>{FONT_IMPORT}</style>

    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 lg:min-h-screen lg:sticky lg:top-0" style={{background:C.ink}}>
      <div className="px-6 pt-7 pb-5" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{color:C.brass}}>Registre associatif</p>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:"17px",color:C.cream,lineHeight:"1.3"}}>{config.name}</p>
        {config.city&&<p className="text-xs mt-1" style={{color:"rgba(247,243,233,0.45)"}}>{config.city}</p>}
      </div>
      <nav className="flex-1 px-3 pt-3">
        {NAV.map(item=>{const Icon=item.icon;const active=tab===item.id;return<button key={item.id} onClick={()=>setTab(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm mb-1 text-sm" style={{background:active?"rgba(184,137,59,0.18)":"transparent",color:active?C.brass:C.cream,fontWeight:active?600:400}}><Icon size={16}/> {item.label}</button>;})}
      </nav>
      <div className="px-6 py-5" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{background:C.sageL}}/>
          <span className="text-xs" style={{color:C.sageL}}>Temps reel actif</span>
        </div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{color:"rgba(247,243,233,0.4)"}}>Solde — {config.annee}</p>
        <p style={{fontFamily:FM,fontSize:"18px",color:totals.balance>=0?C.cream:C.rustL}}>{fcfa(totals.balance)}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{color:"rgba(247,243,233,0.7)"}}>{currentUser.name||currentUser.username}</p>
            <p className="text-xs" style={{color:"rgba(247,243,233,0.4)"}}>{roleInfo?.label}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={notifRef}>
              <button onClick={()=>setShowNotif(!showNotif)} className="relative p-2 rounded hover:bg-white/10">
                <Bell size={15} style={{color:C.cream}}/>
                {notifCount>0&&<span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{background:C.rust,color:C.cream,fontFamily:FM,fontSize:"9px",fontWeight:"bold"}}>{notifCount>9?"9+":notifCount}</span>}
              </button>
              {showNotif&&<NotifDropdown members={members} annee={config.annee} onClose={()=>setShowNotif(false)}/>}
            </div>
            <button onClick={handleLogout} className="p-2 rounded hover:bg-white/10" title="Deconnexion"><LogOut size={15} style={{color:"rgba(247,243,233,0.5)"}}/></button>
          </div>
        </div>
      </div>
    </aside>

    <header className="lg:hidden sticky top-0 z-30" style={{background:C.ink}}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Registre</p>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:"15px",color:C.cream}}>{config.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={notifRef}>
            <button onClick={()=>setShowNotif(!showNotif)} className="relative p-2 rounded hover:bg-white/10">
              <Bell size={17} style={{color:C.cream}}/>
              {notifCount>0&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{background:C.rust}}/>}
            </button>
            {showNotif&&<NotifDropdown members={members} annee={config.annee} onClose={()=>setShowNotif(false)}/>}
          </div>
          <button onClick={handleLogout} className="p-2 rounded hover:bg-white/10"><LogOut size={15} style={{color:"rgba(247,243,233,0.6)"}}/></button>
        </div>
      </div>
      <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {NAV.map(item=>{const Icon=item.icon;const active=tab===item.id;return<button key={item.id} onClick={()=>setTab(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs whitespace-nowrap" style={{background:active?"rgba(184,137,59,0.2)":"transparent",color:active?C.brass:"rgba(247,243,233,0.8)"}}><Icon size={13}/> {item.label}</button>;})}
      </div>
    </header>

    <main className="flex-1 min-w-0">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">
        {tab==="dashboard"&&<Dashboard members={members} transactions={txs} monthlyData={monthlyData} totals={totals} annee={config.annee} config={config}/>}
        {tab==="members"&&<MembersTab members={members} annee={config.annee} search={mbrSearch} onSearch={setMbrSearch}
          onNew={()=>setMbrModal("new")} onEdit={m=>setMbrModal({type:"edit",member:m})}
          onDelete={m=>setConfirm({msg:`Supprimer ${m.name} du registre ?`,fn:()=>delMbr(m)})}
          onMarkPaid={markPaid} onHistory={m=>setHistModal(m)} currentUser={currentUser} onMobileMoney={m=>setMmModal(m)}/>}
        {tab==="finances"&&<FinancesTab transactions={txs} members={members} filter={txFilter} onFilter={setTxFilter}
          search={txSearch} onSearch={setTxSearch}
          onNew={()=>setTxModal("new")} onEdit={t=>setTxModal({type:"edit",tx:t})}
          onDelete={t=>setConfirm({msg:`Supprimer cette transaction de ${fcfa(t.amount)} ?`,fn:()=>delTx(t)})}
          currentUser={currentUser}/>}
        {tab==="reports"&&<ReportsTab members={members} transactions={txs} monthlyData={monthlyData} annee={config.annee} config={config}/>}
        {tab==="reunions"&&<MeetingsTab reunions={reunions} members={members} currentUser={currentUser} assocName={config.name}
          onNew={()=>setReunionModal("new")} onEdit={r=>setReunionModal({type:"edit",reunion:r})}
          onDelete={r=>setConfirm({msg:`Supprimer la reunion "${r.titre}" ?`,fn:()=>delReunion(r)})}
          modal={reunionModal} onCloseModal={()=>setReunionModal(null)} onSave={saveReunion} saving={saving}/>}
        {tab==="evenements"&&<EventsTab evenements={evenements} members={members} currentUser={currentUser}
          onNew={()=>setEventModal("new")} onEdit={e=>setEventModal({type:"edit",ev:e})}
          onDelete={e=>setConfirm({msg:`Supprimer l'evenement "${e.titre}" ?`,fn:()=>delEvent(e)})}
          modal={eventModal} onCloseModal={()=>setEventModal(null)} onSave={saveEvent} saving={saving}/>}
        {tab==="budget"&&<BudgetTab transactions={txs} config={config} annee={config.annee} onSaveBudget={saveBudget} saving={saving}/>}
        {tab==="sanctions"&&<SanctionsTab sanctions={sanctions} members={members} currentUser={currentUser}
          onNew={()=>setSanctionModal("new")} onEdit={s=>setSanctionModal({type:"edit",sanction:s})}
          onDelete={s=>setConfirm({msg:`Supprimer cette sanction ?`,fn:()=>delSanction(s)})}
          onMarkPaid={markSanctionPaid}
          modal={sanctionModal} onCloseModal={()=>setSanctionModal(null)} onSave={saveSanction} saving={saving}/>}
        {tab==="carte"&&<MapTab members={members} annee={config.annee} canEdit={can(currentUser,"canEdit")} saving={saving}/>}
        {tab==="messages"&&<MessagesTab currentUser={currentUser} users={users}/>}
        {tab==="galerie"&&<GalerieTab evenements={evenements} currentUser={currentUser} canDelete={can(currentUser,"canDelete")}/>}
        {tab==="votes"&&<VotesTab members={members} currentUser={currentUser}/>}
        {tab==="settings"&&<SettingsTab config={config} onSaveConfig={saveConfig} users={users} currentUser={currentUser}
          onAddUser={()=>setUserModal("new")} onEditUser={u=>setUserModal({type:"edit",user:u})}
          onDeleteUser={u=>setConfirm({msg:`Supprimer ${u.name||u.username} ?`,fn:()=>delUser(u)})} saving={saving}/>}
      </div>
    </main>

    {mbrModal&&<MemberModal member={mbrModal==="new"?null:mbrModal.member} anneeEnCours={config.annee} defaultCot={config.defaultCot} onClose={()=>setMbrModal(null)} onSave={saveMbr} saving={saving}/>}
    {txModal&&<TxModal tx={txModal==="new"?null:txModal.tx} members={members} onClose={()=>setTxModal(null)} onSave={saveTx} saving={saving}/>}
    {histModal&&<HistoryModal member={histModal} onClose={()=>setHistModal(null)}/>}
    {recuInfo&&<RecuModal member={recuInfo.member} tx={recuInfo.tx} assocName={config.name} whatsappMsg={recuInfo.whatsappMsg} onClose={()=>setRecuInfo(null)}/>}
    {userModal&&<UserModal user={userModal==="new"?null:userModal.user} currentUserId={currentUser.id} onClose={()=>setUserModal(null)} onSave={saveUser} saving={saving}/>}
    {confirm&&<ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={()=>setConfirm(null)}/>}
    {mmModal&&<MobileMoneyModal member={mmModal} annee={config.annee} assocName={config.name} currentUser={currentUser} onClose={()=>setMmModal(null)}/>}
    {toast&&<div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,boxShadow:"0 4px 16px rgba(0,0,0,0.25)",fontFamily:FM}}>{toast}</div>}
  </div>;
}