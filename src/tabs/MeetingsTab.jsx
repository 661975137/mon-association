import React, { useState } from "react";
import { Plus, X, Pencil, Trash2, Search, Printer, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function today(){return new Date().toISOString().slice(0,10);}
function dateF(iso){if(!iso)return"\u2014";const d=new Date(iso);if(isNaN(d.getTime()))return"\u2014";return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});}

function printPV(reunion,members,assocName){
  const presents=members.filter(m=>(reunion.presents||[]).includes(m.id));
  const absents=members.filter(m=>!(reunion.presents||[]).includes(m.id));
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>PV ${reunion.titre}</title>
  <style>body{font-family:Arial,sans-serif;color:#1C2541;padding:40px;font-size:12px;}
  h1{font-size:20px;margin-bottom:4px;}h2{font-size:14px;margin:20px 0 8px;border-bottom:2px solid #B8893B;padding-bottom:4px;}
  .header{border-bottom:3px solid #B8893B;padding-bottom:16px;margin-bottom:24px;}
  .meta{color:#6B6558;font-size:11px;margin-top:4px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .member{padding:4px 0;border-bottom:1px solid #DED5BE;font-size:11px;}
  .pv-text{white-space:pre-wrap;line-height:1.8;font-size:12px;color:#1C2541;}
  .footer{margin-top:40px;border-top:1px solid #DED5BE;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:11px;color:#6B6558;}
  .sig-line{border-bottom:1px solid #1C2541;margin-top:40px;margin-bottom:4px;}
  @media print{body{padding:20px;}}</style></head><body>
  <div class="header">
    <h1>${reunion.titre}</h1>
    <div class="meta">${assocName} &middot; ${dateF(reunion.date)}${reunion.lieu?" &middot; "+reunion.lieu:""}</div>
  </div>
  ${reunion.ordre_du_jour?`<h2>Ordre du jour</h2><p style="white-space:pre-wrap;line-height:1.6">${reunion.ordre_du_jour}</p>`:""}
  <h2>Presence (${presents.length}/${members.length} membres)</h2>
  <div class="grid">${presents.map(m=>`<div class="member">\u2713 ${m.name}</div>`).join("")}
  ${absents.map(m=>`<div class="member" style="color:#6B6558">\u2717 ${m.name}</div>`).join("")}</div>
  ${reunion.pv?`<h2>Proces-verbal</h2><div class="pv-text">${reunion.pv}</div>`:""}
  <div class="footer">
    <div><p>Le Secretaire</p><div class="sig-line"></div><p>Signature</p></div>
    <div><p>Le President</p><div class="sig-line"></div><p>Signature</p></div>
  </div>
  </body></html>`;
  const w=window.open("","_blank","width=800,height=700");
  w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);
}

function MeetingModal({reunion,members,onClose,onSave,saving}){
  const [form,setForm]=useState(reunion||{titre:"",date:today(),lieu:"",ordre_du_jour:"",pv:"",presents:[]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggle=id=>set("presents",form.presents.includes(id)?form.presents.filter(x=>x!==id):[...form.presents,id]);
  const allPresent=members.every(m=>form.presents.includes(m.id));
  const toggleAll=()=>set("presents",allPresent?[]:members.map(m=>m.id));
  const submit=e=>{e.preventDefault();if(!form.titre?.trim())return;onSave({...form,id:reunion?reunion.id:uid()});};
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"94vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>{reunion?"Modifier la reunion":"Nouvelle reunion"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Titre de la reunion *</span><input required value={form.titre||""} onChange={e=>set("titre",e.target.value)} style={iS}/></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Date</span><input type="date" value={form.date||""} onChange={e=>set("date",e.target.value)} style={iS}/></label>
            <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Lieu</span><input value={form.lieu||""} onChange={e=>set("lieu",e.target.value)} placeholder="Ex. Siege" style={iS}/></label>
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Ordre du jour</span><textarea value={form.ordre_du_jour||""} onChange={e=>set("ordre_du_jour",e.target.value)} rows={3} placeholder="1. Point financier&#10;2. Cotisations&#10;3. Questions diverses" style={{...iS,resize:"vertical"}}/></label>
          {members.length>0&&<div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Feuille de presence ({form.presents.length}/{members.length})</p>
              <button type="button" onClick={toggleAll} className="text-xs px-2 py-1 rounded-sm" style={{border:`1px solid ${C.line}`,color:C.slate}}>{allPresent?"Tout decocher":"Tout cocher"}</button>
            </div>
            <div className="max-h-44 overflow-y-auto rounded-sm p-2" style={{background:C.paper}}>
              {members.sort((a,b)=>a.name.localeCompare(b.name)).map(m=>(
                <button key={m.id} type="button" onClick={()=>toggle(m.id)} className="w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-black/5 text-left">
                  {form.presents.includes(m.id)?<CheckSquare size={15} style={{color:C.sage,flexShrink:0}}/>:<Square size={15} style={{color:C.slate,flexShrink:0}}/>}
                  <span className="text-sm" style={{color:C.ink}}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>}
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Proces-verbal</span><textarea value={form.pv||""} onChange={e=>set("pv",e.target.value)} rows={6} placeholder="Rediger ici le compte-rendu de la reunion..." style={{...iS,resize:"vertical"}}/></label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Enregistrer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MeetingCard({reunion,members,onEdit,onDelete,onPrint,canEdit,canDelete}){
  const [open,setOpen]=useState(false);
  const presents=members.filter(m=>(reunion.presents||[]).includes(m.id));
  const absents=members.filter(m=>!(reunion.presents||[]).includes(m.id));
  return(
    <div style={{borderBottom:`1px solid ${C.line}`}}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button onClick={()=>setOpen(!open)} className="text-left flex-1 min-w-0">
            <div style={{color:C.ink,fontFamily:FD,fontSize:"17px"}}>{reunion.titre}</div>
            <div className="text-xs mt-0.5" style={{color:C.slate}}>
              {dateF(reunion.date)}{reunion.lieu?` \u00b7 ${reunion.lieu}`:""} \u00b7 <span style={{color:presents.length===members.length?C.sage:C.brass}}>{presents.length}/{members.length} presents</span>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={()=>onPrint(reunion)} className="p-1.5 rounded hover:bg-black/5" title="Imprimer PV"><Printer size={13} style={{color:C.slate}}/></button>
            {canEdit&&<button onClick={()=>onEdit(reunion)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={13} style={{color:C.slate}}/></button>}
            {canDelete&&<button onClick={()=>onDelete(reunion)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={13} style={{color:C.slate}}/></button>}
            <button onClick={()=>setOpen(!open)} className="p-1.5 rounded hover:bg-black/5">{open?<ChevronUp size={14} style={{color:C.slate}}/>:<ChevronDown size={14} style={{color:C.slate}}/>}</button>
          </div>
        </div>
        {open&&<div className="mt-3 pt-3" style={{borderTop:`1px solid ${C.line}`}}>
          {reunion.ordre_du_jour&&<div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:C.slate}}>Ordre du jour</p>
            <p className="text-sm" style={{color:C.ink,whiteSpace:"pre-wrap",lineHeight:"1.6"}}>{reunion.ordre_du_jour}</p>
          </div>}
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {presents.length>0&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:C.sage}}>Presents ({presents.length})</p>
              {presents.map(m=><div key={m.id} className="text-sm py-0.5" style={{color:C.ink}}>\u2713 {m.name}</div>)}
            </div>}
            {absents.length>0&&<div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:C.rust}}>Absents ({absents.length})</p>
              {absents.map(m=><div key={m.id} className="text-sm py-0.5" style={{color:C.slate}}>\u2717 {m.name}</div>)}
            </div>}
          </div>
          {reunion.pv&&<div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:C.slate}}>Proces-verbal</p>
            <p className="text-sm p-3 rounded-sm" style={{color:C.ink,background:C.paper,whiteSpace:"pre-wrap",lineHeight:"1.7",maxHeight:"200px",overflowY:"auto"}}>{reunion.pv}</p>
          </div>}
        </div>}
      </div>
    </div>
  );
}

export default function MeetingsTab({reunions=[],members=[],onNew,onEdit,onDelete,onPrint,currentUser,modal,onCloseModal,onSave,saving,assocName}){
  const [search,setSearch]=useState("");
  const filtered=reunions.filter(r=>(r.titre||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const cedit=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"||currentUser.role==="secretaire"));
  const cdel=!!(currentUser&&(currentUser.role==="admin"||currentUser.role==="tresorier"));
  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Assemblee</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Reunions & PV</h1>
        </div>
        {cedit&&<button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouvelle reunion</button>}
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une reunion\u2026" style={{...iS,paddingLeft:"36px"}}/>
      </div>
      {filtered.length===0
        ?<div className="text-center py-16 rounded-sm" style={{background:C.cream}}><div className="text-4xl mb-3">📋</div><p className="text-sm" style={{color:C.slate}}>{reunions.length===0?"Aucune reunion enregistree.":"Aucun resultat."}</p></div>
        :<div className="rounded-sm overflow-hidden" style={{background:C.cream}}>
          {filtered.map(r=><MeetingCard key={r.id} reunion={r} members={members} onEdit={onEdit} onDelete={onDelete} onPrint={r=>printPV(r,members,assocName||"Association")} canEdit={cedit} canDelete={cdel}/>)}
        </div>
      }
      {modal&&<MeetingModal reunion={modal==="new"?null:modal.reunion} members={members} onClose={onCloseModal} onSave={onSave} saving={saving}/>}
    </div>
  );
}
