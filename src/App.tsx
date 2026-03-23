import React, { useEffect, useMemo, useState } from "react";

/* ================================
   Types & constantes
==================================*/
type Position = "2 - Passe" | "3 - Centre" | "4 - Pointu" | "-";

type Player = {
  id: string;
  nom: string;
  prenom: string;
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

type Theme = "light" | "dark";

type SharedState = {
  players: Player[];
  matches: Match[];
  presences: Presence[];
  lineups: Lineup[];
  selectedMatchId?: string;
  theme?: Theme;
};

const POSITIONS: Position[] = ["2 - Passe", "3 - Centre", "4 - Pointu", "-"];

const LS_KEYS = {
  players: "volley.players.v1",
  matches: "volley.matches.v1",
  presences: "volley.presences.v1",
  lineups:  "volley.lineups.v1",
  theme:    "volley.theme.v1",
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
   Helpers partage URL (Base64 UTF-8)
==================================*/
function encodeStateToBase64(obj: unknown): string {
  const json = JSON.stringify(obj);
  const utf8 = new TextEncoder().encode(json);
  let binary = "";
  utf8.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
function decodeStateFromBase64<T>(b64: string): T {
  const binary = atob(b64);
  const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as T;
}

/* ================================
   Styles avec thèmes (inline)
   (tokens + petites factories)
==================================*/
function tokens(theme: Theme) {
  if (theme === "dark") {
    return {
      pageBg: "#0b1220",
      text: "#e5e7eb",
      textMuted: "#94a3b8",
      label: "#a1a1aa",
      cardBg: "#0f172a",
      border: "#334155",
      inputBg: "#0b1220",
      inputBorder: "#334155",
      primary: "#6366f1",
      primaryHover: "#5459e8",
      ghostBg: "#0b1220",
      ghostText: "#e5e7eb",
      ghostBorder: "#334155",
      tagBg: "#1f2937",
      tagText: "#e5e7eb",
      avatarBg: "#1e293b",
      avatarText: "#c7d2fe",
      accentZone: "#1f2937",
      presentBg: "rgba(5,150,105,0.15)",
      shadow: "0 6px 18px rgba(0,0,0,0.25)",
      headerTitle: "#e2e8f0",
      headerSub: "#94a3b8",
    };
  }
  return {
    pageBg: "#f1f5f9",
    text: "#0f172a",
    textMuted: "#64748b",
    label: "#475569",
    cardBg: "#ffffff",
    border: "#e2e8f0",
    inputBg: "#ffffff",
    inputBorder: "#e5e7eb",
    primary: "#4f46e5",
    primaryHover: "#4338ca",
    ghostBg: "#f8fafc",
    ghostText: "#0f172a",
    ghostBorder: "#e2e8f0",
    tagBg: "#f1f5f9",
    tagText: "#0f172a",
    avatarBg: "#eef2ff",
    avatarText: "#3730a3",
    accentZone: "#ffffff",
    presentBg: "#ecfdf5",
    shadow: "0 6px 18px rgba(0,0,0,0.06)",
    headerTitle: "#0f172a",
    headerSub: "#64748b",
  };
}
const hStack = (gap=8): React.CSSProperties => ({ display:"flex", alignItems:"center", gap });
const vStack = (gap=12): React.CSSProperties => ({ display:"flex", flexDirection:"column", gap });

const card = (t: ReturnType<typeof tokens>): React.CSSProperties => ({
  background: t.cardBg, borderRadius:16, boxShadow: t.shadow, padding:20, border: `1px solid ${t.border}`
});
const labelStyle = (t: ReturnType<typeof tokens>): React.CSSProperties => ({ fontSize:12, color: t.label });
const inputStyle = (t: ReturnType<typeof tokens>): React.CSSProperties => ({
  background: t.inputBg, color: t.text, border:`1px solid ${t.inputBorder}`, borderRadius:10, padding:"10px 12px", fontSize:14, outline:"none"
});
const buttonStyle = (t: ReturnType<typeof tokens>): React.CSSProperties => ({
  background: t.primary, color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", cursor:"pointer"
});
const ghostButton = (t: ReturnType<typeof tokens>): React.CSSProperties => ({
  background: t.ghostBg, color: t.ghostText, border:`1px solid ${t.ghostBorder}`, borderRadius:10, padding:"8px 10px", cursor:"pointer"
});
const tag = (t: ReturnType<typeof tokens>): React.CSSProperties => ({
  background: t.tagBg, color: t.tagText, borderRadius:999, padding:"2px 8px", fontSize:12, border:`1px solid ${t.border}`
});

const Section: React.FC<{title:string; subtitle?:string; right?:React.ReactNode; themeTokens: ReturnType<typeof tokens>}> = ({title, subtitle, right, children, themeTokens: t}) => (
  <div style={card(t)}>
    <div style={{...hStack(12), justifyContent:"space-between", marginBottom:12}}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color: t.text }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color: t.textMuted, marginTop:4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Field: React.FC<{label:string; themeTokens: ReturnType<typeof tokens>}> = ({label, children, themeTokens: t}) => (
  <label style={vStack(6)}>
    <span style={labelStyle(t)}>{label}</span>
    {children}
  </label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {themeTokens: ReturnType<typeof tokens>}> = ({themeTokens: t, style, ...props}) => (
  <input {...props} style={{...inputStyle(t), ...(style||{})}} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {themeTokens: ReturnType<typeof tokens>}> = ({themeTokens: t, style, ...props}) => (
  <select {...props} style={{...inputStyle(t), ...(style||{})}} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {themeTokens: ReturnType<typeof tokens>}> = ({children, style, themeTokens: t, ...props}) => (
  <button
    {...props}
    style={{...buttonStyle(t), ...(style||{})}}
    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.primaryHover; }}
    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.primary; }}
  >{children}</button>
);

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {themeTokens: ReturnType<typeof tokens>}> = ({children, style, themeTokens: t, ...props}) => (
  <button {...props} style={{...ghostButton(t), ...(style||{})}}>{children}</button>
);

const Tag: React.FC<{text:string; themeTokens: ReturnType<typeof tokens>}> = ({text, themeTokens: t}) => <span style={tag(t)}>{text}</span>;

function initials(nom:string, prenom:string){ return `${(prenom||"?").trim().charAt(0)||"?"}${(nom||"?").trim().charAt(0)||"?"}`.toUpperCase(); }

/* ================================
   App
==================================*/
export default function App() {
  // Thème
  const [theme, setTheme] = useState<Theme>(() => loadLS<Theme>(LS_KEYS.theme, (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "light"));
  const t = tokens(theme);

  const [players, setPlayers]     = useState<Player[]>(() => loadLS(LS_KEYS.players, []));
  const [matches, setMatches]     = useState<Match[]>(() => loadLS(LS_KEYS.matches, []));
  const [presences, setPresences] = useState<Presence[]>(() => loadLS(LS_KEYS.presences, []));
  const [lineups, setLineups]     = useState<Lineup[]>(() => loadLS(LS_KEYS.lineups, []));

  const [activeTab, setActiveTab] = useState<"players"|"matches"|"presences"|"lineup">("players");
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(() => (loadLS<Match[]>(LS_KEYS.matches, [])[0]?.id));
  const [sortBy, setSortBy] = useState<"nom"|"pos1">("nom");
  const [importedFromURL, setImportedFromURL] = useState<boolean>(false);

  useEffect(() => saveLS(LS_KEYS.theme, theme), [theme]);
  useEffect(() => saveLS(LS_KEYS.players, players), [players]);
  useEffect(() => saveLS(LS_KEYS.matches, matches), [matches]);
  useEffect(() => saveLS(LS_KEYS.presences, presences), [presences]);
  useEffect(() => saveLS(LS_KEYS.lineups, lineups), [lineups]);

  // Import depuis URL ?s=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("s");
      if (s) {
        const state = decodeStateFromBase64<SharedState>(s);
        if (state.players) setPlayers(state.players);
        if (state.matches) setMatches(state.matches);
        if (state.presences) setPresences(state.presences);
        if (state.lineups) setLineups(state.lineups);
        if (state.theme) setTheme(state.theme);
        const sm = state.selectedMatchId ?? state.matches?.[0]?.id;
        setSelectedMatchId(sm);
        setImportedFromURL(true);
        // Nettoyer l'URL (facultatif) pour ne pas réimporter à chaque refresh
        const url = new URL(window.location.href);
        url.searchParams.delete("s");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error("Erreur d'import d'état via URL:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Données exemples minimales (pour démarrer) — uniquement si rien et pas d'import URL
  useEffect(() => {
    if (importedFromURL) return;
    if (players.length === 0) {
      setPlayers([
        { id: crypto.randomUUID(), nom: "Dupont", prenom: "Alex", sexe: "Homme", pos1: "2 - Passe", pos2: "3 - Centre", pos3: "-", note: "Capitaine" },
        { id: crypto.randomUUID(), nom: "Martin", prenom: "Zoé",  sexe: "Femme", pos1: "3 - Centre", pos2: "4 - Pointu", pos3: "-", note: "" }
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (importedFromURL) return;
    if (matches.length === 0) {
      const m1: Match = { id: "M1", date: new Date().toISOString().slice(0,10), opponent: "US Rance", venue: "Domicile", comment: "Saison régulière" };
      setMatches([m1]); setSelectedMatchId(m1.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dérivés présences & lineup
  const presentPlayerIds = useMemo(() => {
    if (!selectedMatchId) return new Set<string>();
    return new Set(presences.filter(p => p.matchId === selectedMatchId && p.present).map(p => p.playerId));
  }, [presences, selectedMatchId]);

  const presentPlayers = useMemo(() => {
    const list = players.filter(p => presentPlayerIds.has(p.id));
    return sortBy === "nom"
      ? [...list].sort((a,b)=> (a.nom+a.prenom).localeCompare(b.nom+b.prenom))
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

  // Partage — construit l'URL + copie presse-papier
  const shareURL = async () => {
    const state: SharedState = { players, matches, presences, lineups, selectedMatchId, theme };
    const encoded = encodeStateToBase64(state);
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien de partage copié dans le presse‑papier !");
    } catch {
      // Fallback
      prompt("Copie le lien ci‑dessous :", url);
    }
  };

  /* ================================
     Navigation
  ==================================*/
  const Nav = () => (
    <div style={{...hStack(8), marginBottom:16}}>
      {[
        { id: "players",   label: "Joueurs" },
        { id: "matches",   label: "Matchs" },
        { id: "presences", label: "Présences" },
        { id: "lineup",    label: "Compos" },
      ].map(ti => (
        <button key={ti.id} onClick={() => setActiveTab(ti.id as any)}
          style={{ ...(activeTab===ti.id ? buttonStyle(t) : ghostButton(t)) }}>
          {ti.label}
        </button>
      ))}
      <div style={{ marginLeft:"auto", ...hStack(8) }}>
        <IconButton themeTokens={t} onClick={() => setTheme(prev => prev==="light"?"dark":"light")}>
          {theme==="light" ? "🌙 Mode sombre" : "☀️ Mode clair"}
        </IconButton>
        <IconButton themeTokens={t} onClick={shareURL}>Partager</IconButton>
        <div style={{ fontSize:12, color:t.textMuted }}>Données locales (navigateur)</div>
      </div>
    </div>
  );

  /* ================================
     Onglet JOUEURS
  ==================================*/
  const PlayersSection = () => {
    const [draft, setDraft] = useState<Omit<Player,"id">>({ nom:"", prenom:"", sexe:"Homme", pos1:"-", pos2:"-", pos3:"-", note:"" });

    return (
      <Section
        title="Effectif"
        subtitle="Renseigne les joueurs puis organise leur compo"
        right={
          <div style={hStack(8)}>
            <span style={{fontSize:12, color:t.textMuted}}>Trier par</span>
            <Select themeTokens={t} value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{padding:"6px 10px"}}>
              <option value="nom">Nom</option>
              <option value="pos1">Position N°1</option>
            </Select>
          </div>
        }
        themeTokens={t}
      >
        {/* Champs empilés */}
        <div style={vStack(12)}>
          <Field label="Nom" themeTokens={t}><TextInput themeTokens={t} value={draft.nom} onChange={e=>setDraft({...draft, nom:e.target.value})} placeholder="Dupont" /></Field>
          <Field label="Prénom" themeTokens={t}><TextInput themeTokens={t} value={draft.prenom} onChange={e=>setDraft({...draft, prenom:e.target.value})} placeholder="Alex" /></Field>
          <Field label="Sexe" themeTokens={t}>
            <Select themeTokens={t} value={draft.sexe} onChange={e=>setDraft({...draft, sexe: e.target.value as "Homme" | "Femme"})}>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </Select>
          </Field>
          <Field label="1er poste" themeTokens={t}><Select themeTokens={t} value={draft.pos1} onChange={e=>setDraft({...draft, pos1: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="2ème poste" themeTokens={t}><Select themeTokens={t} value={draft.pos2} onChange={e=>setDraft({...draft, pos2: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="3ème poste" themeTokens={t}><Select themeTokens={t} value={draft.pos3} onChange={e=>setDraft({...draft, pos3: e.target.value as Position})}>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></Field>
        </div>

        <div style={{ marginTop:12 }}>
          <Button themeTokens={t} onClick={()=>{
            if (!draft.nom || !draft.prenom) return;
            addPlayer(draft);
            setDraft({ nom:"", prenom:"", sexe:"Homme", pos1:"-", pos2:"-", pos3:"-", note:"" });
          }}>Ajouter le joueur</Button>
        </div>

        {/* Liste de joueurs – cartes lisibles */}
        <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12 }}>
          {sortedPlayers.map(p => (
            <div key={p.id} style={{...card(t), padding:16}}>
              <div style={hStack(10)}>
                <div style={{width:40, height:40, borderRadius:999, background:t.avatarBg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:t.avatarText}}>
                  {initials(p.nom, p.prenom)}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, color:t.text}}>{p.prenom} {p.nom}</div>
                  <div style={{fontSize:12, color:t.textMuted}}>{p.sexe}</div>
                </div>
                <IconButton themeTokens={t} onClick={()=>removePlayer(p.id)}>Suppr</IconButton>
              </div>
              <div style={{marginTop:10, display:"flex", gap:6, flexWrap:"wrap"}}>
                <Tag themeTokens={t} text={p.pos1} />{p.pos2!=="-" && <Tag themeTokens={t} text={p.pos2}/>} {p.pos3!=="-" && <Tag themeTokens={t} text={p.pos3}/>}
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
            <span style={{fontSize:12, color:t.textMuted}}>Match courant</span>
            <Select themeTokens={t} value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)} style={{padding:"6px 10px"}}>
              {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
            </Select>
          </div>
        }
        themeTokens={t}
      >
        <div style={vStack(12)}>
          <Field label="Match ID" themeTokens={t}><TextInput themeTokens={t} value={draft.id} onChange={e=>setDraft({...draft, id:e.target.value})} placeholder="M3"/></Field>
          <Field label="Date" themeTokens={t}><TextInput themeTokens={t} type="date" value={draft.date} onChange={e=>setDraft({...draft, date:e.target.value})}/></Field>
          <Field label="Adversaire" themeTokens={t}><TextInput themeTokens={t} value={draft.opponent} onChange={e=>setDraft({...draft, opponent:e.target.value})} placeholder="US Rance"/></Field>
          <Field label="Lieu" themeTokens={t}><TextInput themeTokens={t} value={draft.venue} onChange={e=>setDraft({...draft, venue:e.target.value})} placeholder="Domicile / Extérieur"/></Field>
          <Field label="Commentaires (facultatif)" themeTokens={t}><TextInput themeTokens={t} value={draft.comment} onChange={e=>setDraft({...draft, comment:e.target.value})}/></Field>
        </div>

        <div style={{ marginTop:12, ...hStack(8) }}>
