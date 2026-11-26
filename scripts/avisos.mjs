// Robô de avisos do Assessor · Horn Films
// Roda no GitHub Actions a cada 10 min. Lê a agenda no Firestore e manda push pelo Firebase Cloud Messaging:
//  - 1h antes de cada item com horário (não concluído)
//  - às 20h, resumo do dia seguinte (só se tiver algo)
//  - "Novo job" quando alguém da agência envia um job pela página /agenda (só para o dono)
// Não imprime títulos nem dados da agenda nos logs (o repositório é público).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const OFFSET_H = -3;                 // America/Sao_Paulo (sem horário de verão)
const APP_URL = "https://pedro-horn.github.io/agenda-pedrohorn/";
const ANTES_MIN = 60;                // aviso 1h antes
const HORA_VESPERA = 20;             // resumo da véspera às 20h

export function agoraLocal(nowMs) {
  const d = new Date(nowMs + OFFSET_H * 3600e3);
  const p = n => String(n).padStart(2, "0");
  const hoje = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  const am = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  const amanha = `${am.getUTCFullYear()}-${p(am.getUTCMonth() + 1)}-${p(am.getUTCDate())}`;
  return { hoje, amanha, hora: d.getUTCHours() };
}
export function inicioMs(date, time) {
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - OFFSET_H * 3600e3;
}
export function devidos1h(itens, nowMs, enviados) {
  return itens.filter(i => !i.done && i.date && i.time).filter(i => {
    const ini = inicioMs(i.date, i.time);
    return nowMs >= ini - ANTES_MIN * 60e3 && nowMs < ini && !enviados[`${i.id}@${i.date}T${i.time}`];
  });
}
const curto = (s, n = 60) => (s || "").length > n ? s.slice(0, n - 1) + "…" : (s || "");

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.log("Sem FIREBASE_SERVICE_ACCOUNT configurado."); return; }
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(), fcm = getMessaging();
  const now = Date.now(), { hoje, amanha, hora } = agoraLocal(now);
  let enviadosTotal = 0;
  const eqSnap = await db.collection("config").doc("equipe").get();
  const donoUid = eqSnap.exists ? eqSnap.data().donoUid : null;

  for (const userRef of await db.collection("users").listDocuments()) {
    const tokSnap = await userRef.collection("tokens").get();
    const tokens = tokSnap.docs.map(d => ({ ref: d.ref, token: d.data().token })).filter(t => t.token);
    if (!tokens.length) continue;

    const metaRef = userRef.collection("meta").doc("avisos");
    const meta = (await metaRef.get()).data() || {};
    const enviados = meta.enviados || {};
    const itensSnap = await userRef.collection("items").where("date", "in", [hoje, amanha]).get();
    const itens = itensSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let ultimoJob = meta.ultimoJob || null;
    const msgs = [];
    if (userRef.id === donoUid) {
      const jobsSnap = await db.collection("jobs").where("dataEntrega", "in", [hoje, amanha]).get();
      for (const d of jobsSnap.docs) {
        const j = d.data();
        itens.push({ id: "job_" + d.id, title: j.titulo, date: j.dataEntrega, time: j.hora || null, project: j.cliente, done: j.status === "entregue" });
      }
      // jobs novos desde a última rodada
      const desde = ultimoJob || new Date(now).toISOString();
      const novosSnap = await db.collection("jobs").where("criadoEm", ">", desde).get();
      const novos = novosSnap.docs.map(d => d.data()).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
      if (ultimoJob) for (const j of novos.slice(0, 5)) {
        const [y, m, dd] = (j.dataEntrega || "").split("-");
        const nome = ((j.enviadoPor && j.enviadoPor.nome) || "Agência").trim().split(/\s+/)[0];
        msgs.push({ title: `Novo job · ${nome}`, body: `${curto(j.titulo, 70)} · ${j.cliente || ""}${dd ? ` · entrega ${dd}/${m}` : ""}${j.hora ? " " + j.hora : ""}` });
      }
      ultimoJob = novos.length ? novos[novos.length - 1].criadoEm : desde;
    }

    for (const i of devidos1h(itens, now, enviados)) {
      msgs.push({ title: `Em 1h · ${i.time}`, body: curto(i.title, 90) + (i.project ? ` · ${i.project}` : "") + (i.location ? ` · ${curto(i.location, 40)}` : "") });
      enviados[`${i.id}@${i.date}T${i.time}`] = now;
    }
    let vespera = meta.vespera;
    if (hora >= HORA_VESPERA && vespera !== hoje) {
      const am = itens.filter(i => i.date === amanha && !i.done).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
      if (am.length) msgs.push({ title: `Amanhã: ${am.length} ${am.length === 1 ? "item" : "itens"} na agenda`, body: am.slice(0, 4).map(i => `${i.time || "—"} ${curto(i.title, 40)}`).join("\n") + (am.length > 4 ? `\n+${am.length - 4}` : "") });
      vespera = hoje;
    }

    for (const m of msgs) {
      for (const t of tokens) {
        try {
          await fcm.send({ token: t.token, data: { title: m.title, body: m.body, url: APP_URL }, webpush: { headers: { Urgency: "high", TTL: "3600" } } });
          enviadosTotal++;
        } catch (e) {
          if (/registration-token-not-registered|invalid-argument|invalid-registration-token/.test(e.code || "")) await t.ref.delete();
          else console.log("Falha ao enviar:", e.code || e.message);
        }
      }
    }
    // guarda só os envios recentes (2 dias)
    for (const k of Object.keys(enviados)) if (now - enviados[k] > 2 * 864e5) delete enviados[k];
    await metaRef.set({ enviados, vespera: vespera || null, ultimoJob, atualizadoEm: new Date(now).toISOString() });
  }
  console.log(`OK · notificações enviadas: ${enviadosTotal}`);
}
if (process.argv[1] && process.argv[1].endsWith("avisos.mjs")) main().catch(e => { console.error("Erro:", e.code || e.message); process.exit(1); });
