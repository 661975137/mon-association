import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, Wallet, BarChart3, Settings, Plus, X, Pencil, Trash2,
  Search, AlertTriangle, TrendingUp, TrendingDown, Download, Printer,
  Bell, LogOut, Eye, EyeOff, UserPlus, CheckCircle2, Lock, Shield,
  BookOpen, CalendarDays, Layers, MapPin, ShieldCheck, RefreshCw, Phone,
  MessageSquare, Camera, Vote, Smartphone, ExternalLink, Building2,
  Globe, CreditCard, Users2, ChevronRight, Star, Zap, Check
} from "lucide-react";
import { supabase } from "./supabase.js";
import MainApp from "./App_main.jsx";
import MeetingsTab  from "./tabs/MeetingsTab.jsx";
import EventsTab    from "./tabs/EventsTab.jsx";
import BudgetTab    from "./tabs/BudgetTab.jsx";
import SanctionsTab from "./tabs/SanctionsTab.jsx";
import MapTab       from "./tabs/MapTab.jsx";
import MessagesTab  from "./tabs/MessagesTab.jsx";
import GalerieTab   from "./tabs/GalerieTab.jsx";
import VotesTab     from "./tabs/VotesTab.jsx";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558",partial:"#D4881A"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const FONT_IMPORT=`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{font-family:${FB};background:${C.paper};}`;
const iStyle={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function today(){return new Date().toISOString().slice(0,10);}
function fcfa(n){return(Number(n)||0).toLocaleString("fr-FR")+" FCFA";}

/* ===================== LANDING PAGE ===================== */
function LandingPage({onLogin,onRegister}){
  const FEATURES=[
    {icon:<Users size={20}/>,title:"Gestion des membres",desc:"Cotisations, historique, statuts en temps réel"},
    {icon:<Wallet size={20}/>,title:"Comptabilité complète",desc:"Recettes, dépenses, rapports PDF en FCFA"},
    {icon:<Vote size={20}/>,title:"Votes & Elections",desc:"Scrutins en ligne avec résultats en direct"},
    {icon:<MessageSquare size={20}/>,title:"Messagerie interne",desc:"Communication entre membres en temps réel"},
    {icon:<Smartphone size={20}/>,title:"Mobile Money",desc:"Paiements Orange, MTN, Wave, Moov intégrés"},
    {icon:<MapPin size={20}/>,title:"Carte des membres",desc:"Localisation par commune en Côte d'Ivoire"},
  ];
  return(
    <div style={{fontFamily:FB,background:C.ink,minHeight:"100vh"}}>
      <style>{FONT_IMPORT}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{background:`rgba(184,137,59,0.2)`,border:`1px solid ${C.brass}`}}>
            <span style={{color:C.brass,fontWeight:700,fontSize:"13px"}}>RA</span>
          </div>
          <span style={{color:C.cream,fontWeight:600,fontFamily:FD,fontSize:"17px",fontStyle:"italic"}}>Registre Associatif</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="px-4 py-2 rounded-sm text-sm font-medium" style={{color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)"}}>Se connecter</button>
          <button onClick={onRegister} className="px-4 py-2 rounded-sm text-sm font-medium" style={{background:C.brass,color:C.ink}}>Essai gratuit</button>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium" style={{background:"rgba(184,137,59,0.15)",color:C.brass,border:`1px solid rgba(184,137,59,0.3)`}}>
          <Zap size={12}/> 30 jours d'essai gratuit — sans carte bancaire
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{color:C.cream,fontFamily:FD,fontStyle:"italic",lineHeight:1.2}}>
          Gérez votre association<br/>en toute simplicité
        </h1>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{color:"rgba(247,243,233,0.6)"}}>
          La plateforme complète pour les associations en Côte d'Ivoire. Membres, cotisations, finances, votes — tout en un.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onRegister} className="px-6 py-3 rounded-sm text-sm font-semibold flex items-center justify-center gap-2" style={{background:C.brass,color:C.ink}}>
            Créer mon compte association <ChevronRight size={16}/>
          </button>
          <button onClick={onLogin} className="px-6 py-3 rounded-sm text-sm font-medium" style={{border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.8)"}}>
            Déjà inscrit ? Se connecter
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f,i)=>(
            <div key={i} className="p-5 rounded-sm" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div className="mb-3" style={{color:C.brass}}>{f.icon}</div>
              <h3 className="font-semibold mb-1 text-sm" style={{color:C.cream}}>{f.title}</h3>
              <p className="text-xs" style={{color:"rgba(255,255,255,0.45)"}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-6 pb-20 max-w-sm mx-auto text-center">
        <div className="p-8 rounded-sm" style={{background:C.cream}}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:C.brass}}>Tarif unique</div>
          <div className="text-4xl font-bold mb-1" style={{color:C.ink,fontFamily:FM}}>10 000</div>
          <div className="text-sm mb-6" style={{color:C.slate}}>FCFA / mois · sans engagement</div>
          {["Membres illimités","Toutes les fonctionnalités","Support par WhatsApp","Mises à jour incluses"].map(f=>(
            <div key={f} className="flex items-center gap-2 mb-2 text-sm text-left" style={{color:C.ink}}>
              <Check size={14} style={{color:C.sage,flexShrink:0}}/> {f}
            </div>
          ))}
          <button onClick={onRegister} className="w-full py-3 rounded-sm text-sm font-semibold mt-4" style={{background:C.ink,color:C.cream}}>
            Démarrer l'essai gratuit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== INSCRIPTION ASSOCIATION ===================== */
function RegisterPage({onSuccess,onBack}){
  const [form,setForm]=useState({assocName:"",city:"",contact:"",email:"",adminName:"",username:"",password:"",confirm:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async e=>{
    e.preventDefault();
    if(form.password!==form.confirm){setError("Les mots de passe ne correspondent pas.");return;}
    if(form.password.length<4){setError("Mot de passe trop court (min. 4 caractères).");return;}
    setLoading(true);setError("");
    const assocId=uid();
    const{error:ae}=await supabase.from("associations").insert({
      id:assocId,name:form.assocName,city:form.city,contact:form.contact,
      email:form.email,subscription:"trial",validated:false
    });
    if(ae){setError("Erreur : "+ae.message);setLoading(false);return;}
    const{error:ue}=await supabase.from("app_users").insert({
      id:uid(),name:form.adminName,username:form.username,
      password:form.password,role:"admin",association_id:assocId
    });
    if(ue){setError("Erreur : "+ue.message);setLoading(false);return;}
    await supabase.from("config").insert({id:assocId,association_id:assocId,data:{name:form.assocName,city:form.city,contact:form.contact,annee:new Date().getFullYear().toString(),defaultCot:5000,nb_tranches:1}});
    setDone(true);setLoading(false);
  };

  if(done) return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:"rgba(79,111,82,0.2)",border:`1px solid ${C.sage}`}}>
          <CheckCircle2 size={28} style={{color:C.sage}}/>
        </div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:"24px",color:C.cream}} className="mb-2">Inscription envoyée !</h2>
        <p className="text-sm mb-6" style={{color:"rgba(255,255,255,0.5)"}}>Votre compte est en attente de validation. Vous recevrez une confirmation sous 24h.</p>
        <button onClick={onBack} className="px-6 py-2.5 rounded-sm text-sm font-medium" style={{background:C.brass,color:C.ink}}>Retour à l'accueil</button>
      </div>
    </div>
  );

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-xs mb-6 flex items-center gap-1" style={{color:"rgba(255,255,255,0.4)"}}>← Retour</button>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:"26px",color:C.cream}} className="mb-1">Créer votre espace association</h1>
        <p className="text-sm mb-6" style={{color:"rgba(255,255,255,0.4)"}}>30 jours gratuits · Aucune carte bancaire requise</p>
        <div className="rounded-sm p-6" style={{background:C.cream}}>
          {error&&<div className="p-3 rounded-sm mb-4 text-sm" style={{background:"rgba(168,68,46,0.1)",color:C.rust}}>{error}</div>}
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide pt-1" style={{color:C.brass}}>Votre association</div>
            <input required value={form.assocName} onChange={e=>set("assocName",e.target.value)} placeholder="Nom de l'association *" style={iStyle}/>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Ville / Siège" style={iStyle}/>
              <input value={form.contact} onChange={e=>set("contact",e.target.value)} placeholder="Téléphone" style={iStyle}/>
            </div>
            <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="Email de contact" style={iStyle}/>
            <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{color:C.brass}}>Compte administrateur</div>
            <input required value={form.adminName} onChange={e=>set("adminName",e.target.value)} placeholder="Votre nom complet *" style={iStyle}/>
            <input required value={form.username} onChange={e=>set("username",e.target.value)} placeholder="Identifiant de connexion *" style={iStyle}/>
            <div className="grid grid-cols-2 gap-2">
              <input required type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Mot de passe *" style={iStyle}/>
              <input required type="password" value={form.confirm} onChange={e=>set("confirm",e.target.value)} placeholder="Confirmer *" style={iStyle}/>
            </div>
            <button type="submit" disabled={loading} className="py-3 rounded-sm text-sm font-semibold mt-2" style={{background:C.ink,color:C.cream,opacity:loading?0.7:1}}>
              {loading?"Création en cours...":"Créer mon espace gratuit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ===================== LOGIN PAGE SAAS ===================== */
function LoginPage({onLogin,onBack,onSuperAdmin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [showPwd,setShowPwd]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [saMode,setSaMode]=useState(false); // Mode super admin

  const submit=async e=>{
    e.preventDefault();
    setLoading(true);setError("");

    // Mode Super Admin
    if(saMode){
      const ok=await onSuperAdmin(username,password);
      if(!ok){setError("Identifiants super admin incorrects.");}
      setLoading(false);return;
    }

    // Mode association normale
    const{data,error:err}=await supabase.from("app_users").select("*").ilike("username",username).eq("password",password).maybeSingle();
    if(err||!data){setError("Identifiant ou mot de passe incorrect.");setLoading(false);return;}
    if(!data.association_id){setError("Compte non lié à une association.");setLoading(false);return;}
    const{data:asso}=await supabase.from("associations").select("*").eq("id",data.association_id).maybeSingle();
    if(!asso){setError("Association introuvable.");setLoading(false);return;}
    if(!asso.validated){setError("Votre association est en attente de validation. Merci de patienter.");setLoading(false);return;}
    if(asso.subscription==="suspended"){setError("Votre abonnement est suspendu. Contactez le support.");setLoading(false);return;}
    onLogin(data,asso);
    setLoading(false);
  };

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:C.ink}}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="text-xs mb-6 flex items-center gap-1" style={{color:"rgba(255,255,255,0.4)"}}>← Accueil</button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-3" style={{background:"rgba(184,137,59,0.2)",border:`1px solid ${C.brass}`}}>
            <Lock size={18} style={{color:C.brass}}/>
          </div>
          <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:"24px",color:C.cream}}>{saMode?"Super Admin":"Connexion"}</h1>
          <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.4)"}}>{saMode?"Accès administrateur plateforme":"Registre Associatif"}</p>
        </div>
        <div className="p-6 rounded-sm" style={{background:C.cream}}>
          {error&&<div className="p-3 rounded-sm mb-4 text-sm" style={{background:"rgba(168,68,46,0.1)",color:C.rust}}>{error}</div>}
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Identifiant" autoCapitalize="none" style={iStyle}/>
            <div className="relative">
              <input required type={showPwd?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" style={iStyle}/>
              <button type="button" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPwd?<EyeOff size={15} style={{color:C.slate}}/>:<Eye size={15} style={{color:C.slate}}/>}</button>
            </div>
            <button type="submit" disabled={loading} className="py-3 rounded-sm text-sm font-semibold mt-1" style={{background:C.ink,color:C.cream,opacity:loading?0.7:1}}>
              {loading?"Vérification...":"Se connecter"}
            </button>
          </form>
        </div>
        <p className="text-center mt-4 text-xs" style={{color:"rgba(255,255,255,0.3)"}}>Pas encore inscrit ? <button onClick={onBack} style={{color:C.brass,background:"none",border:"none",cursor:"pointer"}}>Créer un espace gratuit</button></p>
        <p className="text-center mt-4 text-xs">
          <button onClick={()=>{setSaMode(v=>!v);setError("");setUsername("");setPassword("");}}
            style={{color:"rgba(255,255,255,0.3)",background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"4px",cursor:"pointer",fontSize:"10px",padding:"4px 10px"}}>
            {saMode?"← Retour connexion normale":"🔧 Accès Super Admin"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ===================== SUPER ADMIN ===================== */
function SuperAdminDashboard({onLogout}){
  const [assos,setAssos]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("associations").select("*").order("created_at",{ascending:false}).then(({data})=>{setAssos(data||[]);setLoading(false);});
  },[]);

  const validate=async(asso)=>{
    await supabase.from("associations").update({validated:true,validated_at:new Date().toISOString(),subscription:"trial"}).eq("id",asso.id);
    setAssos(v=>v.map(a=>a.id===asso.id?{...a,validated:true}:a));
  };
  const suspend=async(asso)=>{
    const s=asso.subscription==="suspended"?"active":"suspended";
    await supabase.from("associations").update({subscription:s}).eq("id",asso.id);
    setAssos(v=>v.map(a=>a.id===asso.id?{...a,subscription:s}:a));
  };

  const stats={total:assos.length,validated:assos.filter(a=>a.validated).length,trial:assos.filter(a=>a.subscription==="trial").length,active:assos.filter(a=>a.subscription==="active").length};

  return(
    <div style={{minHeight:"100vh",background:C.paper,fontFamily:FB}}>
      <style>{FONT_IMPORT}</style>
      <div className="px-6 py-4 flex items-center justify-between" style={{background:C.ink}}>
        <div>
          <span style={{color:C.brass,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.1em"}}>Super Admin</span>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.cream,fontSize:"20px"}}>Registre Associatif</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs px-3 py-2 rounded-sm" style={{border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)"}}>
          <LogOut size={13}/> Déconnexion
        </button>
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[{l:"Total associations",v:stats.total,c:C.ink},{l:"Validées",v:stats.validated,c:C.sage},{l:"Essai gratuit",v:stats.trial,c:C.brass},{l:"Abonnées",v:stats.active,c:C.sage}].map(s=>(
            <div key={s.l} className="p-4 rounded-sm" style={{background:C.cream,borderTop:`3px solid ${s.c}`}}>
              <div className="text-xs uppercase tracking-wide mb-1" style={{color:C.slate}}>{s.l}</div>
              <div className="text-2xl font-bold" style={{color:C.ink,fontFamily:FM}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-sm overflow-hidden" style={{background:C.cream}}>
          <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:`1px solid ${C.line}`}}>
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>Toutes les associations</h2>
          </div>
          {loading?<div className="p-8 text-center text-sm" style={{color:C.slate}}>Chargement...</div>:
          assos.map(a=>(
            <div key={a.id} className="px-4 py-3 flex items-center justify-between" style={{borderBottom:`1px solid ${C.line}`}}>
              <div>
                <div className="font-semibold text-sm" style={{color:C.ink}}>{a.name}</div>
                <div className="text-xs mt-0.5" style={{color:C.slate}}>{a.city||"—"} · {a.email||"—"} · Créé le {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:a.validated?"rgba(79,111,82,0.1)":"rgba(184,137,59,0.1)",color:a.validated?C.sage:C.brass}}>{a.validated?"Validée":"En attente"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(28,37,65,0.06)",color:C.slate}}>{a.subscription}</span>
                {!a.validated&&<button onClick={()=>validate(a)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{background:C.sage,color:C.cream}}>Valider</button>}
                <button onClick={()=>suspend(a)} className="text-xs px-3 py-1.5 rounded-sm font-medium" style={{background:a.subscription==="suspended"?C.sage:C.rust,color:C.cream}}>{a.subscription==="suspended"?"Réactiver":"Suspendre"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== ASSOC APP — Délégue à l'app principale ===================== */
function AssocApp({currentUser,association,onLogout}){
  return <MainApp externalUser={currentUser} externalAsso={association} externalLogout={onLogout}/>;
}

/* ===================== APP ROOT SAAS ===================== */
export default function App(){
  const [screen,setScreen]=useState("landing"); // landing, register, login, app, superadmin
  const [currentUser,setCurrentUser]=useState(null);
  const [currentAsso,setCurrentAsso]=useState(null);
  const [superAdmin,setSuperAdmin]=useState(null);

  useEffect(()=>{
    const saved=sessionStorage.getItem("currentUserId");
    const savedAsso=sessionStorage.getItem("currentAssoId");
    const savedSA=sessionStorage.getItem("superAdmin");
    if(savedSA){setSuperAdmin(JSON.parse(savedSA));setScreen("superadmin");return;}
    if(saved&&savedAsso){
      Promise.all([
        supabase.from("app_users").select("*").eq("id",saved).maybeSingle(),
        supabase.from("associations").select("*").eq("id",savedAsso).maybeSingle()
      ]).then(([{data:u},{data:a}])=>{
        if(u&&a){setCurrentUser(u);setCurrentAsso(a);setScreen("app");}
      });
    }
  },[]);

  const handleLogin=(user,asso)=>{
    setCurrentUser(user);setCurrentAsso(asso);
    sessionStorage.setItem("currentUserId",user.id);
    sessionStorage.setItem("currentAssoId",asso.id);
    setScreen("app");
  };

  const handleSuperLogin=async(username,password)=>{
    const{data}=await supabase.from("super_admins").select("*").eq("username",username).eq("password",password).maybeSingle();
    if(data){setSuperAdmin(data);sessionStorage.setItem("superAdmin",JSON.stringify(data));setScreen("superadmin");}
    return !!data;
  };

  const handleLogout=()=>{
    setCurrentUser(null);setCurrentAsso(null);setSuperAdmin(null);
    sessionStorage.clear();setScreen("landing");
  };

  if(screen==="landing") return<LandingPage onLogin={()=>setScreen("login")} onRegister={()=>setScreen("register")}/>;
  if(screen==="register") return<RegisterPage onSuccess={()=>setScreen("login")} onBack={()=>setScreen("landing")}/>;
  if(screen==="login") return<LoginPage onLogin={handleLogin} onBack={()=>setScreen("landing")} onSuperAdmin={handleSuperLogin}/>;
  if(screen==="superadmin") return<SuperAdminDashboard onLogout={handleLogout}/>;
  if(screen==="app"&&currentUser&&currentAsso) return<AssocApp currentUser={currentUser} association={currentAsso} onLogout={handleLogout}/>;
  return<LandingPage onLogin={()=>setScreen("login")} onRegister={()=>setScreen("register")}/>;
}


