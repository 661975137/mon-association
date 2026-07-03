import React, { useState } from "react";
import { Plus, X, Pencil, Trash2, Search, Printer, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";

// ... (Gardez vos constantes C, FD, FB, iS et les fonctions uid, today, dateF, printPV, MeetingModal, MeetingCard telles quelles)

export default function MeetingsTab({reunions, members, onNew, onEdit, onDelete, onPrint, currentUser, modal, onCloseModal, onSave, saving, assocName}){
  const [search,setSearch]=useState("");

  // PROTECTION AJOUTÉE ICI :
  if (!reunions || !members) {
    return <div className="p-10 text-center" style={{color: C.slate}}>Chargement des données...</div>;
  }

  const filtered = reunions.filter(r => (r.titre || "").toLowerCase().includes(search.toLowerCase())).sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  const cedit = !!(currentUser && (currentUser.role === "admin" || currentUser.role === "tresorier" || currentUser.role === "secretaire"));
  const cdel = !!(currentUser && (currentUser.role === "admin" || currentUser.role === "tresorier"));
  
  return(
    <div className="flex flex-col gap-5">
      {/* ... (Le reste de votre JSX inchangé) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div><p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Assemblee</p><h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Reunions & PV</h1></div>
        {cedit && <button onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouvelle reunion</button>}
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une reunion\u2026" style={{...iS,paddingLeft:"36px"}}/>
      </div>
      {filtered.length === 0
        ? <div className="text-center py-16 rounded-sm" style={{background:C.cream}}><div className="text-4xl mb-3">\u{1F4CB}</div><p className="text-sm" style={{color:C.slate}}>Aucun resultat.</p></div>
        : <div className="rounded-sm overflow-hidden" style={{background:C.cream}}>
          {filtered.map(r => <MeetingCard key={r.id} reunion={r} members={members} onEdit={onEdit} onDelete={onDelete} onPrint={r => printPV(r, members, assocName || "Association")} canEdit={cedit} canDelete={cdel}/>)}
        </div>
      }
      {modal && <MeetingModal reunion={modal === "new" ? null : modal.reunion} members={members} onClose={onCloseModal} onSave={onSave} saving={saving}/>}
    </div>
  );
}