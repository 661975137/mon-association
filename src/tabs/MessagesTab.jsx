import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { supabase } from "../supabase.js";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function timeF(iso){if(!iso)return"";const d=new Date(iso);return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function dateGroupF(iso){if(!iso)return"";const d=new Date(iso);return d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});}

export default function MessagesTab({currentUser,users}){
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);

  const senderName=(id)=>{const u=users.find(x=>x.id===id);return u?.name||u?.username||"Utilisateur";};

  const load=async()=>{
    const{data}=await supabase.from("messages").select("*").eq("channel","general").order("created_at",{ascending:true}).limit(200);
    setMessages(data||[]);setLoading(false);
  };

  useEffect(()=>{
    load();
    const ch=supabase.channel("rt-messages")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},p=>{
        if(p.new.channel==="general") setMessages(v=>[...v,p.new]);
      }).subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const send=async()=>{
    const text=input.trim();
    if(!text||sending)return;
    setSending(true);
    const msg={id:uid(),sender_id:currentUser.id,channel:"general",content:text,created_at:new Date().toISOString()};
    // Optimistic update
    setMessages(v=>[...v,msg]);
    setInput("");
    await supabase.from("messages").insert(msg);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};

  // Grouper par date
  const groups=[];
  let lastDate="";
  messages.forEach(m=>{
    const d=new Date(m.created_at).toDateString();
    if(d!==lastDate){groups.push({type:"date",label:dateGroupF(m.created_at),key:"d"+d});lastDate=d;}
    groups.push({type:"msg",...m});
  });

  const isMe=id=>id===currentUser.id;

  return(
    <div className="flex flex-col" style={{height:"calc(100vh - 160px)",minHeight:"400px"}}>
      {/* Header */}
      <div className="pb-4">
        <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Canal general</p>
        <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Messagerie</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-sm p-4 flex flex-col gap-2" style={{background:C.cream}}>
        {loading&&<p className="text-sm text-center py-8" style={{color:C.slate}}>Chargement des messages...</p>}
        {!loading&&messages.length===0&&(
          <div className="flex flex-col items-center justify-center flex-1 py-16">
            <MessageSquare size={32} className="mb-3" style={{color:C.line}}/>
            <p className="text-sm" style={{color:C.slate}}>Aucun message. Soyez le premier a ecrire !</p>
          </div>
        )}
        {groups.map((item,i)=>{
          if(item.type==="date") return(
            <div key={item.key} className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{background:C.line}}/>
              <span className="text-xs px-2" style={{color:C.slate}}>{item.label}</span>
              <div className="flex-1 h-px" style={{background:C.line}}/>
            </div>
          );
          const me=isMe(item.sender_id);
          return(
            <div key={item.id} className={`flex ${me?"justify-end":"justify-start"} gap-2`}>
              {!me&&(
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-1"
                  style={{background:C.ink,color:C.cream}}>
                  {senderName(item.sender_id).slice(0,1).toUpperCase()}
                </div>
              )}
              <div style={{maxWidth:"70%"}}>
                {!me&&<p className="text-xs mb-1 ml-1" style={{color:C.slate}}>{senderName(item.sender_id)}</p>}
                <div className="px-3 py-2 rounded-2xl" style={{
                  background:me?C.ink:"rgba(28,37,65,0.06)",
                  color:me?C.cream:C.ink,
                  borderBottomRightRadius:me?"4px":"16px",
                  borderBottomLeftRadius:me?"16px":"4px"
                }}>
                  <p className="text-sm" style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{item.content}</p>
                </div>
                <p className="text-xs mt-0.5 px-1" style={{color:C.slate,textAlign:me?"right":"left"}}>{timeF(item.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="pt-3 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ecrire un message... (Entree pour envoyer)"
          rows={2}
          style={{flex:1,background:C.cream,border:`1px solid ${C.line}`,borderRadius:"8px",padding:"10px 12px",fontSize:"14px",color:C.ink,fontFamily:FB,resize:"none",outline:"none"}}
        />
        <button onClick={send} disabled={!input.trim()||sending}
          className="px-4 rounded-lg flex items-center justify-center"
          style={{background:input.trim()?C.ink:C.line,color:C.cream,flexShrink:0,transition:"background 0.2s"}}>
          <Send size={18}/>
        </button>
      </div>
      <p className="text-xs mt-1.5" style={{color:C.slate}}>Entree pour envoyer, Shift+Entree pour un saut de ligne</p>
    </div>
  );
}
