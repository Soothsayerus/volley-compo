import React, { useEffect, useMemo, useState } from "react";

// --- Types ---
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

// --- Constantes ---
const POSITIONS: Position[] = ["2 - Passe", "3 - Centre", "4 - Pointu", "-"];

// --- Helpers LocalStorage ---
const LS_KEYS = {
  players: "volley.players.v1",
  matches: "volley.matches.v1",
  presences: "volley.presences.v1",
  lineups: "volley.lineups.v1",
};

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- UI Components ---
const Section = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-2xl shadow p-5 mb-6">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-600">{label}</span>
    {children}
  </label>
);

const TextInput = (props) => <input {...props} className="border rounded-lg px-3 py-2" />;

const Select = (props) => <select {...props} className="border rounded-lg px-3 py-2 bg-white" />;

const Button = ({ children, ...props }) => (
  <button {...props} className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700" >
    {children}
  </button>
);

const IconButton = ({ children, ...props }) => (
  <button {...props} className="border rounded-lg px-3 py-1.5 hover:bg-gray-100">
    {children}
  </button>
);

const Tag = ({ text }) => (
  <span className="px-2.5 py-0.5 text-xs bg-gray-100 rounded-full">{text}</span>
);

// --- Main App ---
export default function App() {

  const [players, setPlayers] = useState<Player[]>(() => loadLS(LS_KEYS.players, []));
  const [matches, setMatches] = useState<Match[]>(() => loadLS(LS_KEYS.matches, []));
  const [presences, setPresences] = useState<Presence[]>(() => loadLS(LS_KEYS.presences, []));
  const [lineups, setLineups] = useState<Lineup[]>(() => loadLS(LS_KEYS.lineups, []));

  const [activeTab, setActiveTab] = useState("players");
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id);

  useEffect(() => saveLS(LS_KEYS.players, players), [players]);
  useEffect(() => saveLS(LS_KEYS.matches, matches), [matches]);
  useEffect(() => saveLS(LS_KEYS.presences, presences), [presences]);
  useEffect(() => saveLS(LS_KEYS.lineups, lineups), [lineups]);

  // Seed demo data if empty
  useEffect(() => {
    if (players.length === 0) {
      setPlayers([
        { id: crypto.randomUUID(), nom: "Dupont", prenom: "Alex", licence: "A1234", sexe: "Homme", pos1: "2 - Passe", pos2: "3 - Centre", pos3: "-", note: "Capitaine" }
      ]);
    }
  }, []);

  useEffect(() => {
    if (matches.length === 0) {
      setMatches([
        { id: "M1", date: new Date().toISOString().slice(0, 10), opponent: "US Rance", venue: "Domicile" }
      ]);
      setSelectedMatchId("M1");
    }
  }, []);

  const presentPlayerIds = useMemo(() => {
    return new Set(presences.filter(p => p.matchId === selectedMatchId && p.present).map(p => p.playerId));
  }, [presences, selectedMatchId]);

  const presentPlayers = players.filter(p => presentPlayerIds.has(p.id));

  const currentLineup = useMemo(() => {
    const found = lineups.find(l => l.matchId === selectedMatchId);
    if (found) return found;
    const newLineup = { matchId: selectedMatchId, slots: [1,2,3,4,5,6].map(n => ({ zone:n }))};
    setLineups(l => [...l, newLineup]);
    return newLineup;
  }, [lineups, selectedMatchId]);

  const updateLineup = (fn) => {
    setLineups(prev => prev.map(l => l.matchId === currentLineup.matchId ? fn(l) : l));
  };

  // CRUD
  const addPlayer = (p) => setPlayers(prev => [...prev, {...p, id: crypto.randomUUID()}]);
  const removePlayer = (id: string) => setPlayers(prev => prev.filter(p => p.id !== id));
  const setPresence = (matchId, playerId, present) =>
    setPresences(prev => {
      const idx = prev.findIndex(p => p.matchId===matchId && p.playerId===playerId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].present = present;
        return updated;
      }
      return [...prev, { matchId, playerId, present }];
    });

  // --- Nav Tabs ---
  const Nav = () => (
    <div className="flex gap-2 mb-6">
      {["players","matches","presences","lineup"].map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-xl border ${activeTab===tab ? "bg-indigo-600 text-white" : "bg-white"}`}>
          {tab === "players" ? "Joueurs" : tab === "matches" ? "Matchs" : tab === "presences" ? "Présences" : "Compos"}
        </button>
      ))}
    </div>
  );

  // --- PLAYERS TAB ---
  const PlayersSection = () => {

    const [draft, setDraft] = useState<Omit<Player, "id">>({ nom:"", prenom:"", licence:"", sexe:"Homme", pos1:"-", pos2:"-", pos3:"-", note:"" });

    return (
      <Section title="Base Joueurs">

        {/* Formulaire sur une seule ligne */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">

          <Field label="Nom"><TextInput value={draft.nom} onChange={e=>setDraft({...draft,nom:e.target.value})}/></Field>

          <Field label="Prénom"><TextInput value={draft.prenom} onChange={e=>setDraft({...draft,prenom:e.target.value})}/></Field>

          <Field label="Licence"><TextInput value={draft.licence} onChange={e=>setDraft({...draft,licence:e.target.value})}/></Field>

          <Field label="Sexe">
            <Select value={draft.sexe} onChange={e=>setDraft({...draft,sexe:e.target.value})}>
              <option>Homme</option>
              <option>Femme</option>
            </Select>
          </Field>

          <Field label="Poste 1">
            <Select value={draft.pos1} onChange={e=>setDraft({...draft,pos1:e.target.value as Position})}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>

          <Field label="Poste 2">
            <Select value={draft.pos2} onChange={e=>setDraft({...draft,pos2:e.target.value as Position})}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>

          <Field label="Poste 3">
            <Select value={draft.pos3} onChange={e=>setDraft({...draft,pos3:e.target.value as Position})}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>

        </div>

        <div className="mt-3">
          <Button onClick={() => { addPlayer(draft); setDraft({nom:"",prenom:"",licence:"",sexe:"Homme",pos1:"-",pos2:"-",pos3:"-",note:""}); }}>
            Ajouter joueur
          </Button>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Nom</th><th>Prénom</th><th>Licence</th><th>Sexe</th>
              <th>Pos1</th><th>Pos2</th><th>Pos3</th><th></th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} className="border-t">
                <td>{p.nom}</td>
                <td>{p.prenom}</td>
                <td>{p.licence}</td>
                <td>{p.sexe}</td>
                <td><Tag text={p.pos1}/></td>
                <td><Tag text={p.pos2}/></td>
                <td><Tag text={p.pos3}/></td>
                <td><IconButton onClick={()=>removePlayer(p.id)}>Suppr</IconButton></td>
              </tr>
            ))}
          </tbody>
        </table>

      </Section>
    );
  };

  // --- MATCHES TAB ---
  const MatchesSection = () => {
    const [draft, setDraft] = useState<Match>({ id:"", date:new Date().toISOString().slice(0,10), opponent:"", venue:"Domicile" });

    return (
      <Section title="Matchs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="ID"><TextInput value={draft.id} onChange={e=>setDraft({...draft,id:e.target.value})}/></Field>
          <Field label="Date"><TextInput type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></Field>
          <Field label="Adversaire"><TextInput value={draft.opponent} onChange={e=>setDraft({...draft,opponent:e.target.value})}/></Field>
          <Field label="Lieu"><TextInput value={draft.venue} onChange={e=>setDraft({...draft,venue:e.target.value})}/></Field>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={()=>{ setMatches(m=>[...m,draft]); setDraft({id:"",date:new Date().toISOString().slice(0,10),opponent:"",venue:"Domicile"}); }}>Ajouter</Button>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead><tr><th>ID</th><th>Date</th><th>Adv.</th><th>Lieu</th></tr></thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id} className="border-t">
                <td>{m.id}</td><td>{m.date}</td><td>{m.opponent}</td><td>{m.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  };

  // --- PRESENCES TAB ---
  const PresencesSection = () => {

    return (
      <Section title="Présences">

        <div className="mb-3">
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </Select>
        </div>

        <div className="space-y-2">
          {players.map(p => {
            const isPresent = presentPlayerIds.has(p.id);
            return (
              <div key={p.id} className="flex justify-between border rounded-xl px-3 py-2">
                <div>{p.nom} {p.prenom}</div>
                <Button onClick={()=>setPresence(selectedMatchId, p.id, !isPresent)}>
                  {isPresent ? "Présent" : "Marquer présent"}
                </Button>
              </div>
            );
          })}
        </div>

      </Section>
    );
  };

  // --- COMPOS TAB ---
  const LineupSection = () => {

    const setSlot = (zone, patch) => updateLineup(l => ({
      ...l,
      slots: l.slots.map(s => s.zone===zone ? {...s, ...patch} : s)
    }));

    const occupied = new Set(currentLineup.slots.map(s => s.playerId).filter(Boolean));

    return (
      <Section title="Composition">

        <div className="mb-3">
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLineup.slots.map(slot => (
            <div key={slot.zone} className="border p-4 rounded-xl">
              <h4 className="font-semibold mb-2">Zone {slot.zone}</h4>

              <Field label="Joueur">
                <Select value={slot.playerId ?? ""} onChange={e=>setSlot(slot.zone,{playerId:e.target.value||undefined})}>
                  <option value="">— Choisir —</option>
                  {presentPlayers.map(p => (
                    <option key={p.id} value={p.id} disabled={occupied.has(p.id) && slot.playerId !== p.id}>
                      {p.nom} {p.prenom}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Poste">
                <Select value={slot.plannedPos ?? "-"} onChange={e=>setSlot(slot.zone,{plannedPos:e.target.value as Position})}>
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </Select>
              </Field>

            </div>
          ))}
        </div>

      </Section>
    );
  };

  // --- Render ---
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Volley — Gestion des joueurs & compos</h1>

      <Nav />

      {activeTab==="players" && <PlayersSection />}
      {activeTab==="matches" && <MatchesSection />}
      {activeTab==="presences" && <PresencesSection />}
      {activeTab==="lineup" && <LineupSection />}

    </div>
  );
}
