import React from "react";

// Assurez-vous que les constantes (C) sont accessibles ici 
// ou importées depuis un fichier de configuration partagé
const C = {
  ink:"#1C2541", paper:"#F7F3E9", line:"#DED5BE", cream:"#FCFAF4",
  brass:"#B8893B", sage:"#4F6F52", rust:"#A8442E", slate:"#6B6558"
};

function MeetingsTab({ filtered, onEdit, onDelete, printPV, assocName }) {
  return (
    <div className="flex flex-col gap-6">
      {/* SECTION RÉUNION */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-sm border border-dashed" style={{ background: C.cream, borderColor: C.line }}>
          <p className="text-sm" style={{ color: C.slate }}>
            Aucune réunion trouvée.
          </p>
        </div>
      ) : (
        <div className="rounded-sm overflow-hidden border" style={{ borderColor: C.line, background: C.cream }}>
          {filtered.map((r) => (
            <div key={r.id}>
              {/* Votre logique de MeetingCard ici */}
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: C.line }}>
                <div>
                  <h4 className="font-semibold" style={{ color: C.ink }}>{r.title}</h4>
                  <p className="text-xs" style={{ color: C.slate }}>{r.date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(r)} className="p-2 hover:bg-black/5 rounded">
                    Modifier
                  </button>
                  <button onClick={() => onDelete(r.id)} className="p-2 hover:bg-black/5 rounded text-red-600">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MeetingsTab;