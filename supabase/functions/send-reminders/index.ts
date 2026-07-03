// Supabase Edge Function — Rappels de cotisation par email
// Déployer : supabase functions deploy send-reminders
// Déclencher depuis l'app ou via cron (Supabase > Edge Functions > Schedules)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Lire la config (nom asso, année active)
  const { data: cfg } = await supabase.from("config").select("data").eq("id", 1).single();
  const config = cfg?.data || {};
  const annee  = config.annee || new Date().getFullYear().toString();
  const asso   = config.name  || "Mon Association";

  // Lire tous les membres
  const { data: members } = await supabase.from("members").select("*");
  if (!members?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  // Filtrer ceux en attente ou en retard avec un email
  const toContact = members.filter(m => {
    const statut = m.cotisations?.[annee]?.status || "pending";
    return (statut === "pending" || statut === "late") && m.email;
  });

  let sent = 0;
  const errors: string[] = [];

  for (const member of toContact) {
    const statut = member.cotisations?.[annee]?.status || "pending";
    const montant = (member.cotisation_amount || 0).toLocaleString("fr-FR");
    const isLate  = statut === "late";

    const emailBody = `
Bonjour ${member.name},

${isLate
  ? `Nous vous rappelons que votre cotisation ${annee} de ${montant} FCFA pour ${asso} est en retard.`
  : `Nous vous rappelons que votre cotisation ${annee} de ${montant} FCFA pour ${asso} est en attente de règlement.`
}

Merci de régulariser votre situation dans les meilleurs délais.

Cordialement,
Le Bureau de ${asso}
    `.trim();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `${asso} <noreply@tondomaine.com>`,
        to: [member.email],
        subject: `${isLate ? "[URGENT] " : ""}Rappel cotisation ${annee} — ${asso}`,
        text: emailBody
      })
    });

    if (res.ok) { sent++; }
    else {
      const err = await res.json();
      errors.push(`${member.email}: ${err.message || "erreur"}`);
    }
  }

  return new Response(
    JSON.stringify({ sent, total: toContact.length, errors }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
