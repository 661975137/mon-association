import React, { useState } from "react";
import { Plus, X, Pencil, Trash2, Search, Calendar, Users, CheckSquare, Square, Printer } from "lucide-react";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function today(){return new Date().toISOString().slice(0,10);}
function fcfa(n){return(Number(n)||0).toLocaleString("fr-FR")+" FCFA";}
function dateF(iso){if(!iso)return"\u2014";const d=new Date(iso);if(isNaN(d.getTime()))return"\u2014";return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});}

function EventModal({ev,members,onClose,onSave,saving}){
  const [form,setForm]=useState(ev||{titre:"",date:today(),lieu:"",description:"",budget_prevu:0,inscrits:[]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleMember=id=>set("inscrits",form.inscrits.includes(id)?form.inscrits.filter(x=>x!==id):[...form.inscrits,id]);
  const submit=e=>{e.preventDefault();if(!form.titre?.trim())return;onSave({...form,id:ev?ev.id:uid()});};
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>{ev?"Modifier l'evenement":"Nouvel evenement"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Titre *</span><input required value={form.titre||""} onChange={e=>set("titre",e.target.value)} style={iS}/></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Date</span><input type="date" value={form.date||""} onChange={e=>set("date",e.target.value)} style={iS}/></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Budget prevu (FCFA)</span><input type="number" min="0" step="1000" value={form.budget_prevu||""} onChange={e=>set("budget_prevu",e.target.value)} style={iS}/></label>
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Lieu</span><input value={form.lieu||""} onChange={e=>set("lieu",e.target.value)} placeholder="Ex. Salle communautaire" style={iS}/></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Description</span><textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={3} style={{...iS,resize:"vertical"}}/></label>
          {members.length>0&&<div>
            <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{color:C.slate}}>Inscrits ({form.inscrits.length}/{members.length})</p>
            <div className="max-h-48 overflow-y-auto rounded-sm p-2" style={{background:C.paper}}>
              {members.sort((a,b)=>a.name.localeCompare(b.name)).map(m=>(
                <button key={m.id} type="button" onClick={()=>toggleMember(m.id)} className="w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-black/5 text-left">
                  {form.inscrits.includes(m.id)?<CheckSquare size={15} style={{color:C.sage,flexShrink:0}}/>:<Square size={15} style={{color:C.slate,flexShrink:0}}/>}
                  <span className="text-sm" style={{color:C.ink}}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Enregistrer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventCard({ev,members,onEdit,onDelete,canEdit,canDelete}){
  const [open,setOpen]=useState(false);
  const inscrits=members.filter(m=>(ev.inscrits||[]).includes(m.id));
  return(
    <div style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <button onClick={()=>setOpen(!open)} className="text-left w-full">
              <div style={{color:C.ink,fontFamily:FD,fontSize:"17px"}}>{ev.titre}</div>
              <div className="text-xs mt-0.5" style={{color:C.slate}}>{dateF(ev.date)}{ev.lieu?` \u00b7 ${ev.lieu}`:""}</div>
            </button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-1 rounded-sm" style={{background:"rgba(79,111,82,0.1)",color:C.sage,fontFamily:FM}}>{inscrits.length} inscrits</span>
            {canEdit&&<button onClick={()=>onEdit(ev)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>}
            {canDelete&&<button onClick={()=>onDelete(ev)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>}
          </div>
        </div>
        {ev.budget_prevu>0&&<div className="text-xs" style={{color:C.slate,fontFamily:FM}}>Budget prevu : {fcfa(ev.budget_prevu)}</div>}
        {open&&(
          <div className="mt-3 pt-3" style={{borderTop:`1px solid ${C.line}`}}>
            {ev.description&&<p className="text-sm mb-3" style={{color:C.slate}}>{ev.description}</p>}
            {inscrits.length>0&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:C.slate}}>Liste des inscrits</p>
              <div className="grid grid-cols-2 gap-1">
                {inscrits.map(m=><div key={m.id} className="text-sm py-1 px-2 rounded-sm" style={{background:C.paper,color:C.ink}}>{m.name}</div>)}
              </div>
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsTab({evenements=[],members=[],onNew,onEdit,onDelete,currentUser,modal,onCloseModal,onSave,saving}){
  const [search,setSearch]=useState("");
  const filtered=evenements.filter(e=>(e.titre||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const cedit=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"||currentUser.role==="secretaire"));
  const cdel=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"));
  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Agenda</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Evenements</h1>
        </div>
        {cedit&&<button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouvel evenement</button>}
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un evenement\u2026" style={{...iS,paddingLeft:"36px"}}/>
      </div>
      {filtered.length===0
        ?<div className="text-center py-16 rounded-sm" style={{background:C.cream}}><Calendar size={28} className="mx-auto mb-3" style={{color:C.line}}/><p className="text-sm" style={{color:C.slate}}>{evenements.length===0?"Aucun evenement. Creez le premier.":"Aucun resultat."}</p></div>
        :<div className="rounded-sm overflow-hidden" style={{background:C.cream}}>{filtered.map(e=><EventCard key={e.id} ev={e} members={members} onEdit={onEdit} onDelete={onDelete} canEdit={cedit} canDelete={cdel}/>)}</div>
      }
      {modal&&<EventModal ev={modal==="new"?null:modal.ev} members={members} onClose={onCloseModal} onSave={onSave} saving={saving}/>}
    </div>
  );
}
