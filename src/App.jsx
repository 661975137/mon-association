import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Wallet, BarChart3, Settings, Plus, X, Pencil, Trash2,
  Search, AlertTriangle, TrendingUp, TrendingDown, Download, Printer,
  Bell, LogOut, Eye, EyeOff, UserPlus, CheckCircle2, Lock, Shield
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

/* ===================== DESIGN TOKENS ===================== */
const C = {
  ink:"#1C2541", paper:"#F7F3E9", line:"#DED5BE", cream:"#FCFAF4",
  brass:"#B8893B", brassDark:"#8C6526", sage:"#4F6F52", sageL:"#7C9B7E",
  rust:"#A8442E", rustL:"#C2604A", slate:"#6B6558"
};
const FD="Fraunces, serif", FB="'IBM Plex Sans', sans-serif", FM="'IBM Plex Mono', monospace";
const FONT_IMPORT=`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;
const iStyle={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

/* ===================== HELPERS & CONSTANTES ===================== */
const STATUTS=[{value:"paid",label:"Regle",color:C.sage},{value:"partial",label:"Partiel",color:"#D4881A"},{value:"pending",label:"En attente",color:C.brass},{value:"late",label:"En retard",color:C.rust}];

function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function today() { return new Date().toISOString().slice(0,10); }
function fcfa(n) { return (Number(n)||0).toLocaleString("fr-FR")+" FCFA"; }
function dateF(iso) { if(!iso) return "\u2014"; const d=new Date(iso); return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString("fr-FR"); }

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

/* ===================== MEMBER MODAL ===================== */
function MemberModal({member,anneeEnCours,defaultCot,onClose,onSave}) {
  const init=member||{name:"",email:"",phone:"",cotisationAmount:defaultCot||"",joinDate:today(),status:"pending"};
  const [form,setForm]=useState(init);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  
  const submit=(e)=>{
    e.preventDefault();
    if(!form.name?.trim()) return;
    const base={...form,id:member?member.id:uid(),cotisationAmount:Number(form.cotisationAmount)||0};
    if(!base.cotisations) base.cotisations={};
    base.cotisations[anneeEnCours]={status:form.status||"pending",date:base.cotisations[anneeEnCours]?.date||""};
    onSave(base);
  };

  return (
    <ModalShell title={member?"Modifier le membre":"Nouveau membre"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom complet *"><input required value={form.name||""} onChange={e=>set("name",e.target.value)} style={iStyle}/></Field>
        <Field label="Email"><input type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} style={iStyle}/></Field>
        <Field label="Telephone"><input value={form.phone||""} onChange={e=>set("phone",e.target.value)} style={iStyle}/></Field>
        <Field label="Montant cotisation"><input type="number" value={form.cotisationAmount||""} onChange={e=>set("cotisationAmount",e.target.value)} style={iStyle}/></Field>
        <button type="submit" className="py-2.5 rounded-sm text-sm font-medium mt-2" style={{background:C.ink,color:C.cream}}>Enregistrer</button>
      </form>
    </ModalShell>
  );
}

// ... Le reste de votre code App.jsx principal (la logique de rendu et les autres tabs)
// Assurez-vous que votre fonction export default App() suit ici.