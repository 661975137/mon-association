import React, { useState, useEffect } from "react";
import { MapPin, Users, Search } from "lucide-react";

const C={ink:"#1C2541",paper:"#F7F3E9",line:"#DED5BE",cream:"#FCFAF4",brass:"#B8893B",sage:"#4F6F52",rust:"#A8442E",slate:"#6B6558"};
const FD="Fraunces, serif",FM="'IBM Plex Mono', monospace",FB="'IBM Plex Sans', sans-serif";
const iS={background:C.paper,border:`1px solid ${C.line}`,borderRadius:"2px",padding:"9px 10px",fontSize:"14px",color:C.ink,fontFamily:FB,width:"100%"};

// Coordonnées des communes de Côte d'Ivoire
const CI_COORDS = {
  "Cocody":       [5.3599, -3.9986],
  "Yopougon":     [5.3384, -4.0724],
  "Plateau":      [5.3196, -4.0226],
  "Abobo":        [5.4191, -4.0153],
  "Adjame":       [5.3617, -4.0219],
  "Marcory":      [5.3012, -3.9915],
  "Koumassi":     [5.2929, -3.9831],
  "Port-Bouet":   [5.2548, -3.9375],
  "Treichville":  [5.2983, -4.0082],
  "Attecoubet":   [5.3467, -4.0467],
  "Bingerville":  [5.3560, -3.8845],
  "Anyama":       [5.5000, -4.0500],
  "Songon":       [5.3200, -4.1800],
  "Alepe":        [5.4919, -3.6289],
  "Grand-Bassam": [5.1960, -3.7366],
  "Abidjan":      [5.3600, -4.0083],
  "Bouake":       [7.6898, -5.0305],
  "Daloa":        [6.8773, -6.4502],
  "San-Pedro":    [4.7482, -6.6361],
  "Yamoussoukro": [6.8161, -5.2742],
  "Korhogo":      [9.4581, -5.6294],
  "Man":          [7.4128, -7.5534],
  "Abengourou":   [6.7282, -3.4964],
  "Gagnoa":       [6.1325, -5.9500],
  "Agboville":    [5.9266, -4.2166],
  "Divo":         [5.8374, -5.3571],
  "Grand-Lahou":  [5.1391, -5.0203],
  "Sassandra":    [4.9531, -6.0844],
  "Toumodi":      [6.5541, -5.0170],
  "Duekoue":      [6.7433, -7.3511],
  "Soubre":       [5.7887, -6.5945],
};

function statusColor(s){return s==="paid"?"#4F6F52":s==="late"?"#A8442E":s==="partial"?"#D4881A":"#B8893B";}
function fcfa(n){return(Number(n)||0).toLocaleString("fr-FR")+" FCFA";}

// Carte interactive via iframe OpenStreetMap
function LeafletMap({groupedByCommune,selectedCommune,onSelectCommune}){
  const [mapReady,setMapReady]=useState(false);
  const mapRef = React.useRef(null);

  useEffect(()=>{
    // Charger Leaflet dynamiquement
    if(window.L){setMapReady(true);return;}
    const link=document.createElement("link");
    link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script=document.createElement("script");
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload=()=>setMapReady(true);
    document.head.appendChild(script);
  },[]);

  useEffect(()=>{
    if(!mapReady||!mapRef.current) return;
    const L=window.L;
    // Nettoyer la carte précédente
    if(mapRef.current._leaflet_id) return;
    const map=L.map(mapRef.current).setView([6.5,[-6,-4][0]||5.5], 6);
    map.setView([6.8,-5.4],6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:18
    }).addTo(map);

    // Ajouter les marqueurs
    Object.entries(groupedByCommune).forEach(([commune,members])=>{
      const coords=CI_COORDS[commune];
      if(!coords) return;
      const count=members.length;
      const paid=members.filter(m=>m._statut==="paid").length;
      const color=paid===count?"#4F6F52":paid===0?"#A8442E":"#D4881A";
      const icon=L.divIcon({
        html:`<div style="background:${color};color:#fff;border-radius:50%;width:${Math.min(20+count*4,48)}px;height:${Math.min(20+count*4,48)}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${count>9?11:13}px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${count}</div>`,
        className:"",iconAnchor:[20,20]
      });
      const popup=`<div style="font-family:sans-serif;min-width:160px"><strong style="font-size:14px">${commune}</strong><br/><span style="color:#6B6558;font-size:12px">${count} membre${count>1?"s":""}</span><ul style="margin:8px 0 0;padding:0 0 0 16px;font-size:12px">${members.slice(0,5).map(m=>`<li style="color:${statusColor(m._statut)}">${m.name}</li>`).join("")}${count>5?`<li style="color:#6B6558">+${count-5} autres</li>`:""}</ul></div>`;
      L.marker(coords,{icon}).addTo(map).bindPopup(popup);
    });

    // Ajuster la vue si des marqueurs existent
    const points=Object.entries(groupedByCommune).filter(([c])=>CI_COORDS[c]).map(([c])=>CI_COORDS[c]);
    if(points.length>0){
      try{map.fitBounds(points,{padding:[40,40],maxZoom:11});}catch(e){}
    }
  },[mapReady,groupedByCommune]);

  if(!mapReady) return(
    <div className="flex items-center justify-center rounded-sm" style={{height:380,background:C.paper}}>
      <p className="text-sm" style={{color:C.slate}}>Chargement de la carte\u2026</p>
    </div>
  );
  return <div ref={mapRef} style={{height:380,borderRadius:"2px",zIndex:1}}/>;
}

export default function MapTab({members,annee,onEditMember,saving,canEdit}){
  const [search,setSearch]=useState("");
  const [selectedCommune,setSelectedCommune]=useState(null);

  // Enrichir les membres avec leur statut
  const enriched=members.map(m=>({...m,_statut:m.cotisations?.[annee]?.status||"pending"}));

  // Grouper par commune
  const grouped={};
  enriched.forEach(m=>{
    const c=m.commune||"Non renseigne";
    if(!grouped[c])grouped[c]=[];
    grouped[c].push(m);
  });

  const sortedCommunes=Object.entries(grouped).sort((a,b)=>b[1].length-a[1].length);
  const filtered=selectedCommune?enriched.filter(m=>(m.commune||"Non renseigne")===selectedCommune):
    search?enriched.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||((m.commune||"").toLowerCase().includes(search.toLowerCase()))):[];

  const sansCommune=members.filter(m=>!m.commune).length;

  return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{color:C.brass}}>Geographie</p>
          <h1 style={{fontFamily:FD,fontStyle:"italic",color:C.ink}} className="text-3xl">Carte des membres</h1>
        </div>
        {sansCommune>0&&<div className="text-xs px-3 py-2 rounded-sm self-start" style={{background:"rgba(184,137,59,0.1)",color:C.brass,border:`1px solid ${C.brass}`}}>
          {sansCommune} membre{sansCommune>1?"s":""} sans commune \u2014 editez leurs fiches pour les placer sur la carte.
        </div>}
      </div>

      {/* Carte Leaflet */}
      <div className="rounded-sm overflow-hidden" style={{boxShadow:"0 2px 8px rgba(28,37,65,0.12)"}}>
        <LeafletMap groupedByCommune={grouped} selectedCommune={selectedCommune} onSelectCommune={setSelectedCommune}/>
      </div>

      {/* Bulles par commune */}
      <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{color:C.slate}}>Membres par commune</h2>
        <div className="flex flex-wrap gap-2">
          {sortedCommunes.map(([commune,mbs])=>{
            const paid=mbs.filter(m=>m._statut==="paid").length;
            const taux=Math.round(paid/mbs.length*100);
            const bg=paid===mbs.length?C.sage:paid===0?C.rust:C.brass;
            const active=selectedCommune===commune;
            return(
              <button key={commune} onClick={()=>setSelectedCommune(active?null:commune)}
                className="flex items-center gap-2 px-3 py-2 rounded-sm transition-all"
                style={{background:active?bg:"rgba(28,37,65,0.06)",color:active?C.cream:C.ink,border:`1px solid ${active?bg:C.line}`}}>
                <MapPin size={13}/>
                <span className="text-sm font-medium">{commune}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:active?"rgba(255,255,255,0.2)":bg+"22",color:active?"rgba(255,255,255,0.9)":bg,fontFamily:FM}}>
                  {mbs.length}
                </span>
                <span className="text-xs" style={{color:active?"rgba(255,255,255,0.7)":C.slate,fontFamily:FM}}>{taux}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste filtrée */}
      {(selectedCommune||search)&&(
        <div className="p-4 sm:p-6 rounded-sm" style={{background:C.cream}}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{color:C.slate}}>
              {selectedCommune?`Membres \u2014 ${selectedCommune}`:"Resultats de recherche"} ({filtered.length})
            </h2>
            {selectedCommune&&<button onClick={()=>setSelectedCommune(null)} className="text-xs" style={{color:C.slate}}>Effacer</button>}
          </div>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.slate}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher\u2026" style={{...iS,paddingLeft:"36px"}}/>
          </div>
          <div className="flex flex-col gap-2">
            {(selectedCommune?filtered:search?filtered:[]).map(m=>{
              const color=m._statut==="paid"?C.sage:m._statut==="late"?C.rust:m._statut==="partial"?C.brass:C.slate;
              return(
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-sm" style={{background:C.paper}}>
                  <div>
                    <span className="text-sm font-medium" style={{color:C.ink}}>{m.name}</span>
                    {m.commune&&<span className="text-xs ml-2" style={{color:C.slate}}>{m.commune}</span>}
                  </div>
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full" style={{background:color+"18",color}}>{m._statut==="paid"?"Regle":m._statut==="late"?"Retard":m._statut==="partial"?"Partiel":"Attente"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedCommune&&!search&&(
        <div className="text-center py-6" style={{color:C.slate,fontSize:"13px"}}>
          Cliquez sur une commune ci-dessus pour voir ses membres.
        </div>
      )}
    </div>
  );
}
