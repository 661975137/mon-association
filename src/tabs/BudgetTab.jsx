import React, { useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Target } from "lucide-react";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"8px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

function fcfa(n){return(Number(n)||0).toLocaleString("fr-FR")+" FCFA";}

const CAT_IN=["Cotisations","Dons","Subventions","Evenements","Aide externe","Autres recettes"];
const CAT_OUT=["Materiel","Location salle","Deplacement","Communication","Assurance","Evenements","Fonctionnement","Autres depenses"];

export default function BudgetTab({transactions,config,annee,onSaveBudget,saving}){
  const budget=config.budget?.[annee]||{lignes:[]};
  const [lignes,setLignes]=useState(budget.lignes||[]);
  const [changed,setChanged]=useState(false);

  const addLigne=(type)=>{
    const cats=type==="income"?CAT_IN:CAT_OUT;
    setLignes(v=>[...v,{id:Date.now().toString(36),type,categorie:cats[0],prevu:0}]);
    setChanged(true);
  };
  const updLigne=(id,k,v)=>{setLignes(prev=>prev.map(l=>l.id===id?{...l,[k]:v}:l));setChanged(true);};
  const delLigne=(id)=>{setLignes(v=>v.filter(l=>l.id!==id));setChanged(true);};
  const save=()=>{
    const newBudget={...config.budget||{},[annee]:{lignes}};
    onSaveBudget(newBudget);setChanged(false);
  };

  const actuel=useMemo(()=>{
    const txAnnee=transactions.filter(t=>(t.date||"").startsWith(annee));
    const map={};
    txAnnee.forEach(t=>{if(!map[t.category])map[t.category]=0;map[t.category]+=(+t.amount);});
    return map;
  },[transactions,annee]);

  const totalPrevuIn=lignes.filter(l=>l.type==="income").reduce((s,l)=>s+(+l.prevu||0),0);
  const totalPrevuOut=lignes.filter(l=>l.type==="expense").reduce((s,l)=>s+(+l.prevu||0),0);
  const totalReelIn=transactions.filter(t=>t.type==="income"&&(t.date||"").startsWith(annee)).reduce((s,t)=>s+(+t.amount),0);
  const totalReelOut=transactions.filter(t=>t.type==="expense"&&(t.date||"").startsWith(annee)).reduce((s,t)=>s+(+t.amount),0);

  return(
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Planification</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Budget {annee}</h1>
        </div>
        {changed&&<button onClick={save} disabled={saving} className="px-4 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,opacity:saving?0.6:1}}>{saving?"Enregistrement...":"Enregistrer le budget"}</button>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:`Recettes prevues`,v:fcfa(totalPrevuIn),a:C.sage,icon:TrendingUp},
          {l:`Recettes reelles`,v:fcfa(totalReelIn),a:C.sageL||C.sage,icon:TrendingUp},
          {l:`Depenses prevues`,v:fcfa(totalPrevuOut),a:C.rust,icon:TrendingDown},
          {l:`Depenses reelles`,v:fcfa(totalReelOut),a:C.rustL||C.rust,icon:TrendingDown}
        ].map(({l,v,a,icon:Icon})=>(
          <div key={l} className="p-4 rounded-sm" style={{background:C.cream,borderTop:`3px solid ${a}`,boxShadow:"0 1px 3px rgba(28,37,65,0.08)"}}>
            <div className="flex items-center justify-between mb-2"><span className="text-xs uppercase tracking-widest font-medium" style={{color:C.slate}}>{l}</span><Icon size={14} style={{color:a}}/></div>
            <div className="text-lg font-semibold" style={{fontFamily:FM,color:C.ink}}>{v}</div>
          </div>
        ))}
      </div>

      {["income","expense"].map(type=>{
        const typeLignes=lignes.filter(l=>l.type===type);
        const cats=type==="income"?CAT_IN:CAT_OUT;
        const color=type==="income"?C.sage:C.rust;
        const label=type==="income"?"Recettes":"Depenses";
        return(
          <div key={type} className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>{label} previsionnelles</h2>
              <button onClick={()=>addLigne(type)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium" style={{background:color,color:C.cream}}>
                <Plus size={12}/> Ajouter une ligne
              </button>
            </div>
            {typeLignes.length===0
              ?<p className="text-sm text-center py-6" style={{color:C.slate}}>Aucune ligne budgetaire. Ajoutez-en une.</p>
              :<div className="flex flex-col gap-3">
                {typeLignes.map(l=>{
                  const reel=actuel[l.categorie]||0;
                  const prevu=+l.prevu||0;
                  const pct=prevu>0?Math.min(Math.round(reel/prevu*100),100):0;
                  const over=prevu>0&&reel>prevu;
                  return(
                    <div key={l.id} className="p-3 rounded-sm" style={{background:C.paper}}>
                      <div className="flex items-center gap-3 mb-2">
                        <select value={l.categorie} onChange={e=>updLigne(l.id,"categorie",e.target.value)} style={{...iS,flex:1}}>
                          {cats.map(c=><option key={c}>{c}</option>)}
                        </select>
                        <input type="number" min="0" step="1000" value={l.prevu||""} onChange={e=>updLigne(l.id,"prevu",e.target.value)} placeholder="Montant prevu" style={{...iS,width:"160px",flexShrink:0}}/>
                        <button onClick={()=>delLigne(l.id)} className="p-1.5 rounded hover:bg-black/5 shrink-0"><Trash2 size={13} style={{color:C.slate}}/></button>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1" style={{color:C.slate}}>
                        <span>Reel: <strong style={{color:over?C.rust:C.sage,fontFamily:FM}}>{fcfa(reel)}</strong></span>
                        <span style={{fontFamily:FM,color:over?C.rust:C.slate}}>{pct}% consomme</span>
                      </div>
                      {prevu>0&&<div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:C.line}}>
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:over?C.rust:pct>80?C.brass:color,transition:"width 0.4s"}}/>
                      </div>}
                    </div>
                  );
                })}
              </div>
            }
          </div>
        );
      })}
    </div>
  );
}
