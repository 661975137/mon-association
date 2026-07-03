import React, { useState } from "react";
import { Plus, X, Pencil, Trash2, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558",partial:"#D4881A"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

const TYPES_SANCTION=["Absence non justifiee","Retard de cotisation","Non-respect des statuts","Comportement inapproprie","Non-participation aux activites","Autre"];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function today(){return new Date().toISOString().slice(0,10);}
function fcfa(n){return(Number(n)||0).toLocaleString("fr-FR")+" FCFA";}
function dateF(iso){if(!iso)return"\u2014";const d=new Date(iso);if(isNaN(d.getTime()))return"\u2014";return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});}

function SanctionModal({sanction,members,onClose,onSave,saving}){
  const [form,setForm]=useState(sanction||{member_id:"",date:today(),type:TYPES_SANCTION[0],description:"",montant:0,paid:false});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=e=>{
    e.preventDefault();
    if(!form.member_id){alert("Veuillez choisir un membre.");return;}
    onSave({...form,id:sanction?sanction.id:uid(),montant:Number(form.montant)||0});
  };
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>{sanction?"Modifier la sanction":"Nouvelle sanction"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Membre concerne *</span>
            <select required value={form.member_id} onChange={e=>set("member_id",e.target.value)} style={iS}>
              <option value="">\u2014 Choisir un membre \u2014</option>
              {members.sort((a,b)=>a.name.localeCompare(b.name)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Date</span>
              <input type="date" value={form.date||""} onChange={e=>set("date",e.target.value)} style={iS}/>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Amende (FCFA)</span>
              <input type="number" min="0" step="100" value={form.montant||""} onChange={e=>set("montant",e.target.value)} style={iS}/>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Type de sanction</span>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={iS}>
              {TYPES_SANCTION.map(t=><option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Description / motif</span>
            <textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={3} placeholder="Preciser le motif de la sanction..." style={{...iS,resize:"vertical"}}/>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.paid||false} onChange={e=>set("paid",e.target.checked)}/>
            <span className="text-sm" style={{color:C.ink}}>Amende deja reglee</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.rust,color:C.cream,opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Enregistrer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SanctionRow({sanction,members,onEdit,onDelete,onMarkPaid,canEdit,canDelete}){
  const member=members.find(m=>m.id===sanction.member_id);
  return(
    <div className="p-4 flex flex-col gap-2" style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{color:C.ink,fontWeight:600,fontSize:"15px"}}>{member?.name||"Membre inconnu"}</span>
            <span className="text-xs px-2 py-0.5 rounded-sm" style={{background:"rgba(168,68,46,0.1)",color:C.rust}}>{sanction.type}</span>
          </div>
          {sanction.description&&<p className="text-sm mt-0.5" style={{color:C.slate}}>{sanction.description}</p>}
          <div className="flex flex-wrap gap-x-4 mt-1" style={{color:C.slate,fontFamily:FM,fontSize:"12px"}}>
            <span>{dateF(sanction.date)}</span>
            {sanction.montant>0&&<span style={{color:sanction.paid?C.sage:C.rust}}>{fcfa(sanction.montant)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {sanction.paid
            ?<span className="flex items-center gap-1 text-xs font-medium" style={{color:C.sage}}><CheckCircle2 size={14}/> Reglee</span>
            :(canEdit&&sanction.montant>0&&<button onClick={()=>onMarkPaid(sanction)} className="text-xs px-2 py-1 rounded-sm font-medium" style={{background:C.sage,color:C.cream}}>Regler</button>)
          }
          {canEdit&&<button onClick={()=>onEdit(sanction)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>}
          {canDelete&&<button onClick={()=>onDelete(sanction)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>}
        </div>
      </div>
    </div>
  );
}

export default function SanctionsTab({sanctions,members,onNew,onEdit,onDelete,onMarkPaid,currentUser,modal,onCloseModal,onSave,saving}){
  const [search,setSearch]=useState("");
  const [filtre,setFiltre]=useState("all");
  const cedit=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"||currentUser.role==="secretaire"));
  const cdel=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"));

  const filtered=sanctions.filter(s=>{
    const m=members.find(x=>x.id===s.member_id);
    const matchSearch=(m?.name||"").toLowerCase().includes(search.toLowerCase())||(s.type||"").toLowerCase().includes(search.toLowerCase());
    const matchFilter=filtre==="all"||(filtre==="paid"&&s.paid)||(filtre==="unpaid"&&!s.paid);
    return matchSearch&&matchFilter;
  }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const totalAmendes=sanctions.reduce((s,x)=>s+(+x.montant||0),0);
  const totalReglees=sanctions.filter(x=>x.paid).reduce((s,x)=>s+(+x.montant||0),0);
  const totalDues=totalAmendes-totalReglees;

  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Discipline</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Sanctions & Amendes</h1>
        </div>
        {cedit&&<button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.rust,color:C.cream}}><Plus size={15}/> Nouvelle sanction</button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{l:"Total amendes",v:totalAmendes,a:C.slate},{l:"Reglees",v:totalReglees,a:C.sage},{l:"Dues",v:totalDues,a:C.rust}].map(({l,v,a})=>(
          <div key={l} className="p-3 sm:p-4 rounded-sm" style={{background:C.cream,borderTop:`3px solid ${a}`,boxShadow:"0 1px 3px rgba(28,37,65,0.08)"}}>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{color:C.slate}}>{l}</div>
            <div className="text-lg font-semibold" style={{fontFamily:FM,color:C.ink}}>{(v).toLocaleString("fr-FR")} FCFA</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par membre ou type\u2026" style={{...iS,paddingLeft:"36px"}}/>
        </div>
        <div className="flex gap-2">
          {[{v:"all",l:"Toutes"},{v:"unpaid",l:"Dues"},{v:"paid",l:"Reglees"}].map(opt=>(
            <button key={opt.v} onClick={()=>setFiltre(opt.v)} className="px-3 py-2 rounded-sm text-xs font-medium"
              style={{background:filtre===opt.v?C.ink:C.paper,color:filtre===opt.v?C.cream:C.slate,border:`1px solid ${filtre===opt.v?C.ink:C.line}`}}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length===0
        ?<div className="text-center py-16 rounded-sm" style={{background:C.cream}}>
            <AlertTriangle size={28} className="mx-auto mb-3" style={{color:C.line}}/>
            <p className="text-sm" style={{color:C.slate}}>{sanctions.length===0?"Aucune sanction enregistree. Bonne discipline !":"Aucun resultat pour ce filtre."}</p>
          </div>
        :<div className="rounded-sm overflow-hidden" style={{background:C.cream}}>
            {filtered.map(s=><SanctionRow key={s.id} sanction={s} members={members} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} canEdit={cedit} canDelete={cdel}/>)}
          </div>
      }

      {modal&&<SanctionModal sanction={modal==="new"?null:modal.sanction} members={members} onClose={onCloseModal} onSave={onSave} saving={saving}/>}
    </div>
  );
}
