import React, { useState, useEffect } from "react";
import { Plus, X, CheckCircle2, Lock, Vote, Users } from "lucide-react";
import { supabase } from "../supabase.js";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function today(){return new Date().toISOString().slice(0,10);}
function dateF(iso){if(!iso)return"\u2014";const d=new Date(iso);return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});}

function VoteModal({onClose,onSave,saving}){
  const [titre,setTitre]=useState("");
  const [description,setDescription]=useState("");
  const [options,setOptions]=useState(["","",""]);
  const [deadline,setDeadline]=useState("");

  const addOption=()=>setOptions(v=>[...v,""]);
  const setOption=(i,v)=>setOptions(prev=>prev.map((o,j)=>j===i?v:o));
  const removeOption=i=>setOptions(v=>v.filter((_,j)=>j!==i));

  const submit=e=>{
    e.preventDefault();
    const validOpts=options.map(o=>o.trim()).filter(Boolean);
    if(validOpts.length<2){alert("Minimum 2 options requises.");return;}
    onSave({id:uid(),titre:titre.trim(),description:description.trim(),options:validOpts,deadline:deadline||null,active:true,created_at:new Date().toISOString()});
  };

  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>Nouveau scrutin</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Question / Titre *</span><input required value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Ex. Election du president 2025" style={iS}/></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Description</span><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} placeholder="Contexte ou instructions..." style={{...iS,resize:"vertical"}}/></label>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Options de vote *</span>
            <div className="flex flex-col gap-2 mt-2">
              {options.map((o,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <input value={o} onChange={e=>setOption(i,e.target.value)} placeholder={`Option ${i+1}`} style={{...iS,flex:1}}/>
                  {options.length>2&&<button type="button" onClick={()=>removeOption(i)} className="p-1.5 rounded hover:bg-black/5"><X size={14} style={{color:C.slate}}/></button>}
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-xs text-left px-2 py-1 rounded-sm" style={{color:C.brass}}>+ Ajouter une option</button>
            </div>
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Date limite (optionnel)</span><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={iS}/></label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Lancer le scrutin"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VoteCard({vote,responses,members,currentUser,canManage,onToggle,onDelete}){
  const [myChoice,setMyChoice]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState("");

  const myResp=responses.find(r=>r.vote_id===vote.id&&r.voter_id===currentUser.id);
  const voteResponses=responses.filter(r=>r.vote_id===vote.id);
  const total=voteResponses.length;
  const isExpired=vote.deadline&&new Date(vote.deadline)<new Date();
  const canVote=vote.active&&!isExpired&&!myResp;

  const submit=async()=>{
    if(!myChoice){setError("Choisissez une option.");return;}
    setSubmitting(true);
    const{error:e}=await supabase.from("vote_responses").insert({id:uid(),vote_id:vote.id,voter_id:currentUser.id,choice:myChoice,created_at:new Date().toISOString()});
    if(e){setError("Erreur: "+e.message);}
    setSubmitting(false);
  };

  const optionCount=(opt)=>voteResponses.filter(r=>r.choice===opt).length;
  const showResults=!!myResp||!vote.active||isExpired;

  return(
    <div className="p-5 rounded-sm" style={{background:C.cream,boxShadow:"0 1px 3px rgba(28,37,65,0.08)"}}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 style={{color:C.ink,fontFamily:FD,fontSize:"17px"}}>{vote.titre}</h3>
            {!vote.active&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(107,101,88,0.12)",color:C.slate}}>Clos</span>}
            {isExpired&&vote.active&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(168,68,46,0.1)",color:C.rust}}>Expire</span>}
            {vote.active&&!isExpired&&!myResp&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(79,111,82,0.1)",color:C.sage}}>En cours</span>}
            {myResp&&<span className="flex items-center gap-1 text-xs" style={{color:C.sage}}><CheckCircle2 size={13}/> Vous avez vote</span>}
          </div>
          {vote.description&&<p className="text-sm mt-1" style={{color:C.slate}}>{vote.description}</p>}
          <div className="flex gap-3 mt-1" style={{color:C.slate,fontFamily:FM,fontSize:"11px"}}>
            {vote.deadline&&<span>Limite : {dateF(vote.deadline)}</span>}
            <span>{total} vote{total>1?"s":""} / {members.length} membre{members.length>1?"s":""}</span>
          </div>
        </div>
        {canManage&&(
          <div className="flex gap-1 shrink-0">
            <button onClick={()=>onToggle(vote)} className="text-xs px-2 py-1 rounded-sm font-medium" style={{border:`1px solid ${C.line}`,color:vote.active?C.rust:C.sage}}>
              {vote.active?"Clore":"Rouvrir"}
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mt-4">
        {(Array.isArray(vote.options)?vote.options:[]).map((opt,i)=>{
          const cnt=optionCount(opt);
          const pct=total>0?Math.round(cnt/total*100):0;
          const isWinner=showResults&&total>0&&cnt===Math.max(...(Array.isArray(vote.options)?vote.options:[]).map(o=>optionCount(o)));
          return(
            <div key={i}>
              {canVote
                ?<label className="flex items-center gap-3 p-3 rounded-sm cursor-pointer hover:bg-black/5 transition-colors"
                    style={{background:myChoice===opt?"rgba(28,37,65,0.06)":"transparent",border:`1px solid ${myChoice===opt?C.ink:C.line}`}}>
                  <input type="radio" name={`vote-${vote.id}`} value={opt} checked={myChoice===opt} onChange={()=>setMyChoice(opt)} className="shrink-0"/>
                  <span className="text-sm" style={{color:C.ink}}>{opt}</span>
                </label>
                :<div className="p-3 rounded-sm" style={{border:`1px solid ${isWinner&&showResults?"#4F6F52":C.line}`,background:isWinner&&showResults?"rgba(79,111,82,0.05)":"transparent"}}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{color:C.ink}}>{opt}{myResp?.choice===opt&&<span className="text-xs ml-2" style={{color:C.sage}}>votre choix</span>}</span>
                    <span style={{fontFamily:FM,fontSize:"12px",color:C.slate}}>{cnt} vote{cnt>1?"s":""} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{background:C.line}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:isWinner?C.sage:C.brass}}/>
                  </div>
                </div>
              }
            </div>
          );
        })}
      </div>

      {canVote&&(
        <div className="mt-3">
          {error&&<p className="text-xs mb-2" style={{color:C.rust}}>{error}</p>}
          <button onClick={submit} disabled={!myChoice||submitting} className="px-4 py-2.5 rounded-sm text-sm font-medium w-full"
            style={{background:myChoice?C.ink:C.line,color:C.cream,opacity:!myChoice||submitting?0.7:1}}>
            {submitting?"Enregistrement...":"Valider mon vote"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VotesTab({members,currentUser}){
  const [votes,setVotes]=useState([]);
  const [responses,setResponses]=useState([]);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [filtre,setFiltre]=useState("active");
  const canManage=currentUser?.role==="admin"||currentUser?.role==="secretaire";

  const load=async()=>{
    const[{data:v},{data:r}]=await Promise.all([
      supabase.from("votes").select("*").order("created_at",{ascending:false}),
      supabase.from("vote_responses").select("*")
    ]);
    setVotes(v||[]);setResponses(r||[]);
  };

  useEffect(()=>{
    load();
    const c1=supabase.channel("rt-votes").on("postgres_changes",{event:"*",schema:"public",table:"votes"},()=>load()).subscribe();
    const c2=supabase.channel("rt-vresp").on("postgres_changes",{event:"*",schema:"public",table:"vote_responses"},()=>load()).subscribe();
    return()=>{supabase.removeChannel(c1);supabase.removeChannel(c2);};
  },[]);

  const saveVote=async data=>{
    setSaving(true);
    const{error}=await supabase.from("votes").insert({...data,created_by:currentUser.id});
    if(error)alert("Erreur: "+error.message);
    else{await load();setShowModal(false);}
    setSaving(false);
  };

  const toggleVote=async vote=>{
    await supabase.from("votes").update({active:!vote.active}).eq("id",vote.id);
    setVotes(v=>v.map(x=>x.id===vote.id?{...x,active:!x.active}:x));
  };

  const filtered=votes.filter(v=>{
    if(filtre==="active") return v.active&&(!v.deadline||new Date(v.deadline)>=new Date());
    if(filtre==="closed") return !v.active||(v.deadline&&new Date(v.deadline)<new Date());
    return true;
  });

  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Democratie</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Votes & Elections</h1>
        </div>
        {canManage&&<button onClick={()=>setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.ink,color:C.cream}}><Plus size={15}/> Nouveau scrutin</button>}
      </div>

      <div className="flex gap-2">
        {[{v:"active",l:"En cours"},{v:"closed",l:"Clos"},{v:"all",l:"Tous"}].map(opt=>(
          <button key={opt.v} onClick={()=>setFiltre(opt.v)} className="px-3 py-2 rounded-sm text-xs font-medium"
            style={{background:filtre===opt.v?C.ink:C.paper,color:filtre===opt.v?C.cream:C.slate,border:`1px solid ${filtre===opt.v?C.ink:C.line}`}}>
            {opt.l}
          </button>
        ))}
      </div>

      {filtered.length===0
        ?<div className="text-center py-16 rounded-sm" style={{background:C.cream}}>
          <Vote size={28} className="mx-auto mb-3" style={{color:C.line}}/>
          <p className="text-sm" style={{color:C.slate}}>{votes.length===0?"Aucun scrutin. Creez le premier vote.":"Aucun vote dans cette categorie."}</p>
        </div>
        :<div className="flex flex-col gap-4">
          {filtered.map(v=><VoteCard key={v.id} vote={v} responses={responses} members={members} currentUser={currentUser} canManage={canManage} onToggle={toggleVote}/>)}
        </div>
      }

      {showModal&&<VoteModal onClose={()=>setShowModal(false)} onSave={saveVote} saving={saving}/>}
    </div>
  );
}
