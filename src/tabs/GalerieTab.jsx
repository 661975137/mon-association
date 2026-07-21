import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Image, Upload } from "lucide-react";
import { supabase } from "../supabase.js";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function dateF(iso){if(!iso)return"\u2014";const d=new Date(iso);return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});}

function UploadModal({evenements,onClose,onUpload,uploading}){
  const [files,setFiles]=useState([]);
  const [eventId,setEventId]=useState("");
  const [captions,setCaptions]=useState({});
  const inputRef=useRef(null);

  const handleFiles=e=>{
    const arr=Array.from(e.target.files||[]).filter(f=>f.type.startsWith("image/"));
    setFiles(arr);
  };

  const submit=async e=>{
    e.preventDefault();
    if(!files.length)return;
    onUpload(files,eventId,captions);
  };

  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:"rgba(28,37,65,0.6)"}} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-sm overflow-y-auto" style={{background:C.cream,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{background:C.cream,borderBottom:`1px solid ${C.line}`}}>
          <h3 style={{fontFamily:FD,fontStyle:"italic",fontSize:"19px",color:C.ink}}>Ajouter des photos</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} style={{color:C.slate}}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div
            onClick={()=>inputRef.current?.click()}
            className="border-2 border-dashed rounded-sm p-8 text-center cursor-pointer hover:bg-black/5 transition-colors"
            style={{borderColor:files.length?C.sage:C.line}}>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden"/>
            <Upload size={28} className="mx-auto mb-3" style={{color:files.length?C.sage:C.slate}}/>
            {files.length===0
              ?<><p className="text-sm font-medium" style={{color:C.ink}}>Cliquer pour choisir des photos</p><p className="text-xs mt-1" style={{color:C.slate}}>JPG, PNG, WebP — plusieurs fichiers acceptes</p></>
              :<><p className="text-sm font-medium" style={{color:C.sage}}>{files.length} photo{files.length>1?"s":""} selectionnee{files.length>1?"s":""}</p><p className="text-xs mt-1" style={{color:C.slate}}>Cliquer pour changer</p></>
            }
          </div>
          {files.length>0&&(
            <div className="grid grid-cols-3 gap-2">
              {files.slice(0,9).map((f,i)=>(
                <div key={i} className="relative aspect-square rounded-sm overflow-hidden" style={{background:C.paper}}>
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover"/>
                  <input value={captions[i]||""} onChange={e=>setCaptions(c=>({...c,[i]:e.target.value}))}
                    placeholder="Legende..." className="absolute bottom-0 left-0 right-0 text-xs p-1"
                    style={{background:"rgba(28,37,65,0.75)",color:C.cream,border:"none",outline:"none"}}/>
                </div>
              ))}
              {files.length>9&&<div className="aspect-square rounded-sm flex items-center justify-center text-sm font-medium" style={{background:C.paper,color:C.slate}}>+{files.length-9}</div>}
            </div>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide" style={{color:C.slate}}>Lier a un evenement (optionnel)</span>
            <select value={eventId} onChange={e=>setEventId(e.target.value)} style={{background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"}}>
              <option value="">Sans evenement</option>
              {evenements.map(e=><option key={e.id} value={e.id}>{e.titre}</option>)}
            </select>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
            <button type="submit" disabled={!files.length||uploading} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.ink,color:C.cream,opacity:!files.length||uploading?0.6:1}}>
              {uploading?"Upload en cours...":"Ajouter les photos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LightboxModal({photo,onClose,onDelete,canDelete}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.9)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="relative max-w-4xl w-full">
        <img src={photo.url} alt={photo.caption||""} className="w-full rounded-sm" style={{maxHeight:"80vh",objectFit:"contain"}}/>
        <div className="flex items-center justify-between mt-3">
          <div>
            {photo.caption&&<p className="text-sm text-white">{photo.caption}</p>}
            <p className="text-xs" style={{color:"rgba(255,255,255,0.5)"}}>{dateF(photo.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {canDelete&&<button onClick={()=>onDelete(photo)} className="px-3 py-1.5 rounded-sm text-xs font-medium" style={{background:C.rust,color:"#fff"}}><Trash2 size={13}/></button>}
            <button onClick={onClose} className="px-3 py-1.5 rounded-sm text-xs font-medium" style={{background:"rgba(255,255,255,0.2)",color:"#fff"}}><X size={13}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalerieTab({evenements,currentUser,canDelete}){
  const [photos,setPhotos]=useState([]);
  const [filterEvent,setFilterEvent]=useState("all");
  const [showUpload,setShowUpload]=useState(false);
  const [lightbox,setLightbox]=useState(null);
  const [uploading,setUploading]=useState(false);
  const [confirm,setConfirm]=useState(null);

  const load=async()=>{
    const{data}=await supabase.from("photos").select("*").order("created_at",{ascending:false});
    setPhotos(data||[]);
  };

  useEffect(()=>{
    load();
    const ch=supabase.channel("rt-photos").on("postgres_changes",{event:"*",schema:"public",table:"photos"},()=>load()).subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const handleUpload=async(files,eventId,captions)=>{
    setUploading(true);
    for(let i=0;i<files.length;i++){
      const f=files[i];
      const ext=f.name.split(".").pop();
      const path=`${uid()}.${ext}`;
      const{error:ue}=await supabase.storage.from("photos").upload(path,f,{contentType:f.type,upsert:false});
      if(ue){console.error("Upload error:",ue);continue;}
      const{data:{publicUrl}}=supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("photos").insert({id:uid(),event_id:eventId||null,url:publicUrl,caption:captions[i]||null,uploaded_by:currentUser.id});
    }
    await load();
    setUploading(false);
    setShowUpload(false);
  };

  const deletePhoto=async(photo)=>{
    const path=photo.url.split("/photos/").pop();
    await supabase.storage.from("photos").remove([path]);
    await supabase.from("photos").delete().eq("id",photo.id);
    setPhotos(v=>v.filter(p=>p.id!==photo.id));
    setLightbox(null);
    setConfirm(null);
  };

  const filtered=filterEvent==="all"?photos:photos.filter(p=>(p.event_id||"none")===filterEvent);

  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Souvenirs</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Galerie photos</h1>
        </div>
        <button onClick={()=>setShowUpload(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium self-start" style={{background:C.ink,color:C.cream}}>
          <Plus size={15}/> Ajouter des photos
        </button>
      </div>

      {/* Filtre par événement */}
      {evenements.length>0&&(
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setFilterEvent("all")} className="px-3 py-1.5 rounded-sm text-xs font-medium"
            style={{background:filterEvent==="all"?C.ink:C.paper,color:filterEvent==="all"?C.cream:C.slate,border:`1px solid ${filterEvent==="all"?C.ink:C.line}`}}>
            Toutes ({photos.length})
          </button>
          {evenements.map(ev=>{
            const cnt=photos.filter(p=>p.event_id===ev.id).length;
            if(!cnt)return null;
            return<button key={ev.id} onClick={()=>setFilterEvent(ev.id)} className="px-3 py-1.5 rounded-sm text-xs font-medium"
              style={{background:filterEvent===ev.id?C.ink:C.paper,color:filterEvent===ev.id?C.cream:C.slate,border:`1px solid ${filterEvent===ev.id?C.ink:C.line}`}}>
              {ev.titre} ({cnt})
            </button>;
          })}
        </div>
      )}

      {/* Grille */}
      {filtered.length===0
        ?<div className="text-center py-20 rounded-sm" style={{background:C.cream}}>
          <Image size={32} className="mx-auto mb-3" style={{color:C.line}}/>
          <p className="text-sm" style={{color:C.slate}}>Aucune photo. Ajoutez les premiers souvenirs !</p>
        </div>
        :<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map(p=>(
            <button key={p.id} onClick={()=>setLightbox(p)} className="relative aspect-square rounded-sm overflow-hidden hover:opacity-90 transition-opacity group">
              <img src={p.url} alt={p.caption||""} className="w-full h-full object-cover"/>
              {p.caption&&(
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{background:"rgba(28,37,65,0.75)"}}>
                  <p className="text-xs text-white truncate">{p.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      }

      {showUpload&&<UploadModal evenements={evenements} onClose={()=>setShowUpload(false)} onUpload={handleUpload} uploading={uploading}/>}
      {lightbox&&<LightboxModal photo={lightbox} onClose={()=>setLightbox(null)} canDelete={canDelete}
        onDelete={p=>setConfirm({photo:p})}/>}
      {confirm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(28,37,65,0.6)"}} onClick={()=>setConfirm(null)}>
          <div className="w-full max-w-sm rounded-sm p-5" style={{background:C.cream}} onClick={e=>e.stopPropagation()}>
            <p className="text-sm mb-5" style={{color:C.ink}}>Supprimer cette photo definitivement ?</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirm(null)} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{border:`1px solid ${C.line}`,color:C.slate}}>Annuler</button>
              <button onClick={()=>deletePhoto(confirm.photo)} className="flex-1 py-2.5 rounded-sm text-sm font-medium" style={{background:C.rust,color:C.cream}}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
