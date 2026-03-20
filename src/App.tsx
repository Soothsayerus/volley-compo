import React, { useEffect, useMemo, useState } from "react";

/* ================================
   Types & constantes
==================================*/
type Position = "2 - Passe" | "3 - Centre" | "4 - Pointu" | "-";

type Player = {
  id: string;
  nom: string;
  prenom: string;
  licence: string;
  sexe: "Homme" | "Femme";
  pos1: Position;
  pos2: Position;
  pos3: Position;
  note?: string;
};

type Match = {
  id: string;
  date: string;
  opponent: string;
  venue: string;
  comment?: string;
};

type Presence = {
  matchId: string;
  playerId: string;
  present: boolean;
};

type Lineup = {
  matchId: string;
  slots: { zone: 1|2|3|4|5|6; playerId?: string; plannedPos?: Position }[];
};

const POSITIONS: Position[] = ["2 - Passe", "3 - Centre", "4 - Pointu", "-"];

const LS_KEYS = {
  players: "volley.players.v1",
  matches: "volley.matches.v1",
  presences: "volley.presences.v1",
  lineups:  "volley.lineups.v1",
};

/* ================================
   Helpers stockage local
==================================*/
function loadLS<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveLS<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

/* ================================
   Petits composants UI (sans Tailwind)
   (styles inline pour un rendu propre partout)
==================================*/
const card: React.CSSProperties = { background:"#fff", borderRadius:16, boxShadow:"0 6px 18px rgba(0,0,0,0.06)", padding:20 };
const hStack = (gap=8): React.CSSProperties => ({ display:"flex", alignItems:"center", gap });
const vStack = (gap=12): React.CSSProperties => ({ display:"flex", flexDirection:"column", gap });
const labelStyle: React.CSSProperties = { fontSize:12, color:"#475569" };
const inputStyle: React.CSSProperties = { border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 12px", fontSize:14, outline:"none" };
const buttonStyle: React.CSSProperties = { background:"#4f46e5", color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", cursor:"pointer" };
const ghostButton: React.CSSProperties = { background:"#f8fafc", color:"#0f172a", border:"1px solid #e2e8f0", borderRadius:10, padding:"8px 10px", cursor:"pointer" };
const tag: React.CSSProperties = { background:"#f1f5f9", color:"#0f172a", borderRadius:999, padding:"2px 8px", fontSize:12 };

const Section: React.FC<{title:string; subtitle?:string; right?:React.ReactNode;}> = ({title, subtitle, right, children}) => (
  <div style={card}>
    <div style={{...hStack(12), justifyContent:"space-between", marginBottom:12}}>
      <div>
        <div style={{ fontSize:18, fontWeight:700 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Field: React.FC<{label:string;}> = ({label, children}) => (
  <label style={vStack(6)}>
    <span style={labelStyle}>{label}</span>
    {children}
  </label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{...inputStyle, ...(props.style||{})}} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} style={{...inputStyle, ...(props.style||{})}} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({children, style, ...props}) => (
  <button {...props} style={{...buttonStyle, ...(style||{})}}>{children}</button>
);

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({children, style, ...props}) => (
  <button {...props} style={{...ghostButton, ...(style||{})}}>{children}</button>
);

const Tag: React.FC<{text:string;}> = ({text}) => <span style={tag}>{text}</span>;

function initials(nom:string, prenom:string){ return `${(prenom||"?").trim().charAt(0)||"?"}${(nom||"?").trim().charAt(0)||"?"}`.toUpperCase(); }

/* ================================
   App
==================================*/
export default function App() {
  const [players, setPlayers]     = useState<Player[]>(() => loadLS(LS_KEYS.players, []));
  const [matches, setMatches]     = useState<Match[]>(() => loadLS(LS_KEYS.matches, []));
  const [presences, setPresences] = useState<Presence[]>(() => loadLS(LS_KEYS.presences, []));
  const [lineups, setLineups]     = useState<Lineup[]>(() => loadLS(LS_KEYS.lineups, []));

  const [activeTab, setActiveTab] = useState<"players"|"matches"|"presences"|"lineup">("players");
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(() => matches[0]?.id);
  const [sortBy, setSortBy] = useState<"nom"|"pos1">("nom");

  useEffect(() => saveLS(LS_KEYS.players, players), [players]);
  useEffect(() => saveLS(LS_KEYS.matches, matches), [matches]);
  useEffect(() => saveLS(LS_KEYS.presences, presences), [presences]);
  useEffect(() => saveLS(LS_KEYS.lineups, lineups), [lineups]);

  // Données exemples minimales (pour démarrer)
  useEffect(() => {
    if (players.length === 0) {
      setPlayers([
        { id: crypto.randomUUID(), nom: "Dupont", prenom: "Alex", licence: "A1234", sexe: "Homme", pos1: "2 - Passe", pos2: "3 - Centre", pos3: "-", note: "Capitaine" },
        { id: crypto.randomUUID(), nom: "Martin", prenom: "Zoé",  licence: "B5678", sexe: "Femme", pos1: "3 - Centre", pos2: "4 - Pointu", pos3: "-", note: "" }
      ]);
    }
  }, []);

  useEffect(() => {
    if (matches.length === 0) {
      const m1: Match = { id: "M1", date: new Date().toISOString().slice(0,10), opponent: "US Rance", venue: "Domicile", comment: "Saison régulière" };
      setMatches([m1]); setSelectedMatchId(m1.id);
    }
  }, []);

  // Dérivés présences & lineup
  const presentPlayerIds = useMemo(() => {
    if (!selectedMatchId) return new Set<string>();
    return new Set(presences.filter(p => p.matchId === selectedMatchId && p.present).map(p => p.playerId));
  }, [presences, selectedMatchId]);

  const presentPlayers = useMemo(() => {
    const list = players.filter(p => presentPlayerIds.has(p.id));
    return sortBy === "nom"
      ? [...list].sort((a,b)=> (a.nom+b.prenom).localeCompare(b.nom+b.prenom))
      : [...list].sort((a,b)=> (a.pos1 || "").localeCompare(b.pos1 || ""));
  }, [players, presentPlayerIds, sortBy]);

  const sortedPlayers = useMemo(() => {
    return sortBy === "nom"
      ? [...players].sort((a,b)=> (a.nom+a.prenom).localeCompare(b.nom+b.prenom))
      : [...players].sort((a,b)=> (a.pos1 || "").localeCompare(b.pos1 || ""));
  }, [players, sortBy]);

  const currentLineup = useMemo<Lineup | undefined>(() => {
    if (!selectedMatchId) return undefined;
    let l = lineups.find(l => l.matchId === selectedMatchId);
    if (!l) { l = { matchId: selectedMatchId, slots: [1,2,3,4,5,6].map(z => ({ zone: z as 1|2|3|4|5|6 })) }; setLineups(prev => [...prev, l!]); }
    return l;
  }, [lineups, selectedMatchId]);

  const updateLineup = (updater:(l:Lineup)=>Lineup) => {
    if (!currentLineup) return;
    setLineups(prev => prev.map(l => l.matchId === currentLineup.matchId ? updater(l) : l));
  };

  // CRUD
  const addPlayer = (p: Omit<Player,"id">) => setPlayers(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setPresences(prev => prev.filter(pr => pr.playerId !== id));
    setLineups(prev => prev.map(l => ({...l, slots: l.slots.map(s => s.playerId === id ? {...s, playerId: undefined} : s)})));
  };
  const addMatch = (m: Match) => setMatches(prev => [...prev, m]);
  const setPresence = (matchId: string, playerId: string, present: boolean) => {
    setPresences(prev => {
      const idx = prev.findIndex(p => p.matchId === matchId && p.playerId === playerId);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], present }; return copy; }
      return [...prev, { matchId, playerId, present }];
    });
  };

  /* ================================
     Navigation (style lisse)
  ==================================*/
  const Nav = () => (
    <div style={{...hStack(8), marginBottom:16}}>
      {[
        { id: "players",   label: "Joueurs" },
        { id: "matches",   label: "Matchs" },
        { id: "presences", label: "Présences" },
        { id: "lineup",    label: "Compos" },
      ].map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
          style={{ ...(activeTab===t.id ? buttonStyle : ghostButton) }}>
          {t.label}
        </button>
      ))}
      <div style={{ marginLeft:"auto", fontSize:12, color:"#64748b" }}>Données locales (navigateur)</div>
    </div>
  );

  /* ================================
     Onglet JOUEURS
     (formulaire : 1 champ par ligne, plus “cards” de joueurs,
      tris par Nom/Position pour s’inspirer du flux VolleyMatch)
  ==================================*/
  const PlayersSection = () => {
    const [draft, setDraft] = useState<Omit<Player,"id">>({ nom:"", prenom:"", licence:"", sexe:"Homme", pos1:"-", pos2:"-", pos3:"-", note:"" });

    return (
      <Section
        title="Effectif"
        subtitle="Renseigne les joueurs puis organise leur compo"
        right={
          <div style={hStack(8)}>
            <span style={{fontSize:12, color:"#64748b"}}>Trier par</span>
            <Select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{padding:"6px 10px"}}>
              <option value="nom">Nom</option>
              <option value="pos1">Position N°1</option>
            </Select>
          </div>
        }
      >
        {/* Champs empilés (une ligne chacun, dans l'ordre demandé) */}
        <div style={vStack(12)}>
          <Field label="Nom"><TextInput value={draft.nom} onChange={e=>setDraft({...draft, nom:e.target.value})} placeholder="Dupont" /></Field>
          <Field label="Prénom"><TextInput value={draft.prenom} onChange={e=>setDraft({...draft, prenom:e.target.value})} placeholder="Alex" /></Field>
          <Field label="Licence"><TextInput value={draft.licence} onChange={e=>setDraft({...draft, licence:e.target.value})} placeholder="A1234" /></Field>
          <Field label="Sexe">
            <Select value={draft.sexe} onChange={e=>setDraft({...draft, sexe: e.target.value as "Homme" | "Femme"})}>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </Select>
          </Field>
          <Field label="1er poste"><Select value={draft.pos1} onChange={e=>setDraft({...draft, pos1: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="2ème poste"><Select value={draft.pos2} onChange={e=>setDraft({...draft, pos2: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="3ème poste"><Select value={draft.pos3} onChange={e=>setDraft({...draft, pos3: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
        </div>

        <div style={{ marginTop:12 }}>
          <Button onClick={()=>{
            if (!draft.nom || !draft.prenom) return;
            addPlayer(draft);
            setDraft({ nom:"", prenom:"", licence:"", sexe:"Homme", pos1:"-", pos2:"-", pos3:"-", note:"" });
          }}>Ajouter le joueur</Button>
        </div>

        {/* Liste de joueurs – cartes lisibles */}
        <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12 }}>
          {sortedPlayers.map(p => (
            <div key={p.id} style={{...card, padding:16}}>
              <div style={hStack(10)}>
                <div style={{width:40, height:40, borderRadius:999, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#3730a3"}}>
                  {initials(p.nom, p.prenom)}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{p.prenom} {p.nom}</div>
                  <div style={{fontSize:12, color:"#64748b"}}>Lic. {p.licence} • {p.sexe}</div>
                </div>
                <IconButton onClick={()=>removePlayer(p.id)}>Suppr</IconButton>
              </div>
              <div style={{marginTop:10, display:"flex", gap:6, flexWrap:"wrap"}}>
                <Tag text={p.pos1} />{p.pos2!=="-" && <Tag text={p.pos2}/>} {p.pos3!=="-" && <Tag text={p.pos3}/>}
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  };

  /* ================================
     Onglet MATCHS
  ==================================*/
  const MatchesSection = () => {
    const [draft, setDraft] = useState<Match>({ id:"", date:new Date().toISOString().slice(0,10), opponent:"", venue:"Domicile", comment:"" });

    return (
      <Section title="Matchs" subtitle="Crée tes rencontres et sélectionne le match courant"
        right={
          <div style={hStack(8)}>
            <span style={{fontSize:12, color:"#64748b"}}>Match courant</span>
            <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)} style={{padding:"6px 10px"}}>
              {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
            </Select>
          </div>
        }
      >
        <div style={vStack(12)}>
          <Field label="Match ID"><TextInput value={draft.id} onChange={e=>setDraft({...draft, id:e.target.value})} placeholder="M3"/></Field>
          <Field label="Date"><TextInput type="date" value={draft.date} onChange={e=>setDraft({...draft, date:e.target.value})}/></Field>
          <Field label="Adversaire"><TextInput value={draft.opponent} onChange={e=>setDraft({...draft, opponent:e.target.value})} placeholder="US Rance"/></Field>
          <Field label="Lieu"><TextInput value={draft.venue} onChange={e=>setDraft({...draft, venue:e.target.value})} placeholder="Domicile / Extérieur"/></Field>
          <Field label="Commentaires (facultatif)"><TextInput value={draft.comment} onChange={e=>setDraft({...draft, comment:e.target.value})}/></Field>
        </div>

        <div style={{ marginTop:12, ...hStack(8) }}>
          <Button onClick={()=>{
            if (!draft.id) return;
            addMatch(draft);
            setDraft({ id:"", date:new Date().toISOString().slice(0,10), opponent:"", venue:"Domicile", comment:"" });
          }}>Ajouter le match</Button>
        </div>

        {/* Liste match simple */}
        <div style={{marginTop:18}}>
          <table style={{width:"100%", fontSize:14}}>
            <thead>
              <tr style={{color:"#475569", textAlign:"left"}}>
                <th style={{padding:"8px 0"}}>ID</th><th>Date</th><th>Adversaire</th><th>Lieu</th><th>Commentaires</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} style={{ borderTop:"1px solid #e2e8f0" }}>
                  <td style={{padding:"10px 0"}}>{m.id}</td><td>{m.date}</td><td>{m.opponent}</td><td>{m.venue}</td><td style={{color:"#64748b"}}>{m.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    );
  };

  /* ================================
     Onglet PRESENCES
  ==================================*/
  const PresencesSection = () => {
    const match = matches.find(m => m.id === selectedMatchId);
    return (
      <Section title="Présences" subtitle="Marque les joueurs présents pour le match sélectionné"
        right={
          <div style={hStack(8)}>
            <span style={{fontSize:12, color:"#64748b"}}>Match</span>
            <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)} style={{padding:"6px 10px"}}>
              {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
            </Select>
          </div>
        }
      >
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div>
            <div style={{fontWeight:600, marginBottom:8}}>Effectif</div>
            <div style={vStack(8)}>
              {players.map(p => {
                const isPresent = presentPlayerIds.has(p.id);
                return (
                  <div key={p.id} style={{...hStack(10), justifyContent:"space-between", border:"1px solid #e2e8f0", borderRadius:12, padding:"10px 12px", background:isPresent?"#ecfdf5":"#fff"}}>
                    <div style={hStack(8)}>
                      <div style={{width:28, height:28, borderRadius:999, background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700}}>
                        {initials(p.nom, p.prenom)}
                      </div>
                      <div style={{fontWeight:500}}>{p.prenom} {p.nom}</div>
                      <Tag text={p.pos1}/>{p.pos2!=="-" && <Tag text={p.pos2}/>} {p.pos3!=="-" && <Tag text={p.pos3}/>}
                    </div>
                    <Button style={{background:isPresent?"#059669":"#4f46e5"}} onClick={()=> setPresence(selectedMatchId!, p.id, !isPresent)}>
                      {isPresent? "Présent" : "Marquer présent"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{fontWeight:600, marginBottom:8}}>Présents ({presentPlayers.length})</div>
            <div style={vStack(8)}>
              {presentPlayers.map(p => (
                <div key={p.id} style={{...hStack(10), justifyContent:"space-between", border:"1px solid #e2e8f0", borderRadius:12, padding:"10px 12px"}}>
                  <div style={hStack(8)}>
                    <div style={{width:28, height:28, borderRadius:999, background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700}}>
                      {initials(p.nom, p.prenom)}
                    </div>
                    <div style={{fontWeight:500}}>{p.prenom} {p.nom}</div>
                    <Tag text={p.pos1}/>{p.pos2!=="-" && <Tag text={p.pos2}/>} {p.pos3!=="-" && <Tag text={p.pos3}/>}
                  </div>
                  <IconButton onClick={()=> setPresence(selectedMatchId!, p.id, false)}>Retirer</IconButton>
                </div>
              ))}
              {presentPlayers.length===0 && <div style={{color:"#64748b"}}>Aucun joueur marqué présent.</div>}
            </div>
          </div>
        </div>
      </Section>
    );
  };

  /* ================================
     Onglet COMPOS (zones 1→6)
     (Anti‑doublon simple + répartition)
  ==================================*/
  const LineupSection = () => {
    const lineup = currentLineup!;
    const setSlot = (zone: 1|2|3|4|5|6, patch: Partial<{playerId: string|undefined; plannedPos: Position|undefined}>) => {
      updateLineup(l => ({ ...l, slots: l.slots.map(s => s.zone===zone? { ...s, ...patch } : s) }));
    };
    const occupied = new Set((lineup.slots ?? []).map(s => s.playerId).filter(Boolean) as string[]);

    const grid: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 };

    return (
      <Section title="Composition (Zones 1 → 6)" subtitle="Sélectionne parmi les joueurs présents">
        <div style={{...hStack(8), marginBottom:10}}>
          <span style={{fontSize:12, color:"#64748b"}}>Match</span>
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)} style={{padding:"6px 10px"}}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
          </Select>
          <div style={{marginLeft:"auto", fontSize:12, color:"#64748b"}}>{presentPlayers.length} présent(s)</div>
        </div>

        <div style={grid}>
          {lineup.slots.map(slot => (
            <div key={slot.zone} style={{ border:"1px solid #e2e8f0", borderRadius:16, padding:12 }}>
              <div style={{...hStack(8), justifyContent:"space-between", marginBottom:8}}>
                <div style={{fontWeight:700}}>Zone {slot.zone}</div>
                {slot.playerId && <IconButton onClick={()=> setSlot(slot.zone, { playerId: undefined })}>Vider</IconButton>}
              </div>
              <div style={vStack(10)}>
                <Field label="Joueur (présent)">
                  <Select value={slot.playerId ?? ""} onChange={e=> setSlot(slot.zone, { playerId: e.target.value || undefined })}>
                    <option value="">— Choisir —</option>
                    {presentPlayers.map(p => (
                      <option key={p.id} value={p.id} disabled={occupied.has(p.id) && slot.playerId !== p.id}>
                        {p.prenom} {p.nom}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Poste prévu">
                  <Select value={slot.plannedPos ?? "-"} onChange={e=> setSlot(slot.zone, { plannedPos: e.target.value as Position })}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div style={{...hStack(8), marginTop:12}}>
          <Button onClick={()=> window.print()}>Imprimer / PDF</Button>
          <IconButton onClick={()=> {
            const count = (role: Position) => lineup?.slots.filter(s => s.plannedPos===role).length ?? 0;
            alert(`Répartition rapide
2 - Passe : ${count("2 - Passe")}
3 - Centre : ${count("3 - Centre")}
4 - Pointu : ${count("4 - Pointu")}`);
          }}>Vérifier la répartition</IconButton>
        </div>
      </Section>
    );
  };

  /* ================================
     Render
  ==================================*/
  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", padding:"16px 16px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <header style={{ marginBottom:16 }}>
          <div style={{ fontSize:24, fontWeight:800 }}>Volley — Coach Board</div>
          <div style={{ color:"#64748b", marginTop:4, fontSize:14 }}>
            Inspiré de VolleyMatch : gestion claire des joueurs, présences et compositions (2‑Passe, 3‑Centre, 4‑Pointu).
          </div>
        </header>

        <Nav />

        {activeTab === "players"   && <PlayersSection />}
        {activeTab === "matches"   && <MatchesSection />}
        {activeTab === "presences" && <PresencesSection />}
        {activeTab === "lineup"    && <LineupSection />}

        <footer style={{ marginTop:24, textAlign:"center", fontSize:12, color:"#94a3b8" }}>
          v0.4 — Données stockées localement. Design épuré prêt pour “Tactique” & “Countdown”.
        </footer>
      </div>
    </div>
  );
}
