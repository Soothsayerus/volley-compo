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
  id: string; // unique key (e.g., "M1")
  date: string; // ISO date
  opponent: string;
  venue: "Domicile" | "Extérieur" | string;
  comment?: string;
};

type Presence = {
  matchId: string;
  playerId: string;
  present: boolean;
  remark?: string;
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
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// --- UI atoms ---
const Section: React.FC<{title: string; subtitle?: string; right?: React.ReactNode;}> = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-2xl shadow p-5 mb-6">
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Field: React.FC<{label: string; className?: string;}> = ({ label, className, children }) => (
  <label className={`flex flex-col gap-1 ${className ?? ""}`}>
    <span className="text-sm text-gray-600">{label}</span>
    {children}
  </label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ""}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ""}`} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button {...props} className={`inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 ${className ?? ""}`} />
);

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button {...props} className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 hover:bg-gray-50 ${className ?? ""}`} />
);

const Tag: React.FC<{text: string; color?: string;}> = ({ text, color }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color ?? "bg-gray-100 text-gray-700"}`}>{text}</span>
);

// --- Main App ---
export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadLS<Player[]>(LS_KEYS.players, []));
  const [matches, setMatches] = useState<Match[]>(() => loadLS<Match[]>(LS_KEYS.matches, []));
  const [presences, setPresences] = useState<Presence[]>(() => loadLS<Presence[]>(LS_KEYS.presences, []));
  const [lineups, setLineups] = useState<Lineup[]>(() => loadLS<Lineup[]>(LS_KEYS.lineups, []));

  const [activeTab, setActiveTab] = useState<"players"|"matches"|"presences"|"lineup">("players");
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(() => matches[0]?.id);

  // Persist
  useEffect(() => saveLS(LS_KEYS.players, players), [players]);
  useEffect(() => saveLS(LS_KEYS.matches, matches), [matches]);
  useEffect(() => saveLS(LS_KEYS.presences, presences), [presences]);
  useEffect(() => saveLS(LS_KEYS.lineups, lineups), [lineups]);

  // Seed demo if empty
  useEffect(() => {
    if (players.length === 0) {
      const seedPlayers: Player[] = [
        { id: crypto.randomUUID(), name: "Alex Dupont", pos1: "Passeur", pos2: "Réceptionneur-Attaquant", pos3: "-", note: "Capitaine" },
        { id: crypto.randomUUID(), name: "Zoé Martin", pos1: "Central", pos2: "Pointu", pos3: "Réceptionneur-Attaquant" },
        { id: crypto.randomUUID(), name: "Nico Lefebvre", pos1: "Réceptionneur-Attaquant", pos2: "Libéro", pos3: "Pointu" },
        { id: crypto.randomUUID(), name: "Emma Leroy", pos1: "Pointu", pos2: "Réceptionneur-Attaquant", pos3: "-" },
        { id: crypto.randomUUID(), name: "Léo Caron", pos1: "Central", pos2: "-", pos3: "-" },
        { id: crypto.randomUUID(), name: "Mila Robert", pos1: "Libéro", pos2: "Réceptionneur-Attaquant", pos3: "-" },
      ];
      setPlayers(seedPlayers);
    }
  }, []);

  useEffect(() => {
    if (matches.length === 0) {
      const seedMatches: Match[] = [
        { id: "M1", date: new Date().toISOString().slice(0,10), opponent: "US Rance", venue: "Domicile", comment: "Saison régulière" },
        { id: "M2", date: new Date().toISOString().slice(0,10), opponent: "REC B", venue: "Extérieur" },
      ];
      setMatches(seedMatches);
      setSelectedMatchId(seedMatches[0].id);
    }
  }, []);

  // Derived
  const presentPlayerIds = useMemo(() => {
    if (!selectedMatchId) return new Set<string>();
    const list = presences.filter(p => p.matchId === selectedMatchId && p.present).map(p => p.playerId);
    return new Set(list);
  }, [presences, selectedMatchId]);

  const presentPlayers = players.filter(p => presentPlayerIds.has(p.id));

  const currentLineup = useMemo<Lineup | undefined>(() => {
    if (!selectedMatchId) return undefined;
    let l = lineups.find(l => l.matchId === selectedMatchId);
    if (!l) {
      l = { matchId: selectedMatchId, slots: [1,2,3,4,5,6].map(z => ({ zone: z as 1|2|3|4|5|6 })) };
      setLineups(prev => [...prev, l!]);
    }
    return l;
  }, [lineups, selectedMatchId]);

  const updateLineup = (updater: (l: Lineup) => Lineup) => {
    if (!currentLineup) return;
    setLineups(prev => prev.map(l => l.matchId === currentLineup.matchId ? updater(l) : l));
  };

  // --- CRUD helpers ---
  const addPlayer = (p: Omit<Player, "id">) => setPlayers(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setPresences(prev => prev.filter(pr => pr.playerId !== id));
    setLineups(prev => prev.map(l => ({...l, slots: l.slots.map(s => s.playerId === id ? {...s, playerId: undefined} : s)})));
  };
  const addMatch = (m: Match) => setMatches(prev => [...prev, m]);
  const removeMatch = (id: string) => {
    setMatches(prev => prev.filter(m => m.id !== id));
    setPresences(prev => prev.filter(p => p.matchId !== id));
    setLineups(prev => prev.filter(l => l.matchId !== id));
    if (selectedMatchId === id) setSelectedMatchId(undefined);
  };

  const setPresence = (matchId: string, playerId: string, present: boolean) => {
    setPresences(prev => {
      const idx = prev.findIndex(p => p.matchId === matchId && p.playerId === playerId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], present };
        return copy;
        } else {
        return [...prev, { matchId, playerId, present }];
      }
    });
  };

  // --- UI components ---
  const Nav = () => (
    <div className="flex items-center gap-2 mb-6">
      {[
        { id: "players", label: "Joueurs" },
        { id: "matches", label: "Matchs" },
        { id: "presences", label: "Présences" },
        { id: "lineup", label: "Compos" },
      ].map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-2 rounded-xl border ${activeTab===t.id? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50"}`}>
          {t.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
        <span>Les données sont stockées localement (navigateur).</span>
      </div>
    </div>
  );

  const PlayersSection = () => {
const [draft, setDraft] = useState<Omit<Player, "id">>({ nom: "", prenom: "", licence: "", sexe: "Homme", pos1: "-", pos2: "-", pos3: "-", note: "" });
    const canAdd = draft.name.trim().length > 1;

    return (
      <Section title="Base Joueurs" subtitle="Nom + 3 positions possibles (ordre de préférence)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Nom joueur"><TextInput value={draft.name} onChange={e=>setDraft({...draft, name: e.target.value})} placeholder="Ex: Alex Dupont"/></Field>
          <Field label="Position N°1"><Select value={draft.pos1} onChange={e=>setDraft({...draft, pos1: e.target.value as Position})}>{POSITIONS.map(p=> <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="Position N°2"><Select value={draft.pos2} onChange={e=>setDraft({...draft, pos2: e.target.value as Position})}>{POSITIONS.map(p=> <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="Position N°3"><Select value={draft.pos3} onChange={e=>setDraft({...draft, pos3: e.target.value as Position})}>{POSITIONS.map(p=> <option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="Commentaires" className="md:col-span-1"><TextInput value={draft.note} onChange={e=>setDraft({...draft, note: e.target.value})} placeholder="Capitaine, gaucher, etc."/></Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button disabled={!canAdd} onClick={()=>{ addPlayer(draft); setDraft({ name: "", pos1: "-", pos2: "-", pos3: "-", note: "" }); }}>Ajouter le joueur</Button>
          <span className="text-sm text-gray-500">Positions possibles : Passeur, Central, Pointu, Réceptionneur-Attaquant, Libéro</span>
        </div>

        <div className="mt-6 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Nom</th>
                <th>Pos. N°1</th>
                <th>Pos. N°2</th>
                <th>Pos. N°3</th>
                <th>Commentaires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{p.name}</td>
                  <td><Tag text={p.pos1} color="bg-amber-100 text-amber-800"/></td>
                  <td><Tag text={p.pos2} color="bg-indigo-100 text-indigo-800"/></td>
                  <td><Tag text={p.pos3} color="bg-teal-100 text-teal-800"/></td>
                  <td className="text-gray-500">{p.note ?? ""}</td>
                  <td className="text-right"><IconButton onClick={()=>removePlayer(p.id)}>Suppr</IconButton></td>
                </tr>
              ))}
              {players.length===0 && (
                <tr><td className="py-6 text-gray-500" colSpan={6}>Aucun joueur. Ajoute ton premier joueur ci-dessus.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    );
  };

  const MatchesSection = () => {
    const [draft, setDraft] = useState<Match>({ id: "", date: new Date().toISOString().slice(0,10), opponent: "", venue: "Domicile", comment: "" });
    const canAdd = draft.id.trim().length>0 && draft.opponent.trim().length>0;
    return (
      <Section title="Matchs" subtitle="Crée un ID unique (ex: M3), saisis la date et l'adversaire" right={
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Match courant:</span>
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
          </Select>
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Match ID"><TextInput placeholder="M3" value={draft.id} onChange={e=>setDraft({...draft, id: e.target.value})}/></Field>
          <Field label="Date"><TextInput type="date" value={draft.date} onChange={e=>setDraft({...draft, date: e.target.value})}/></Field>
          <Field label="Adversaire"><TextInput placeholder="US Rance" value={draft.opponent} onChange={e=>setDraft({...draft, opponent: e.target.value})}/></Field>
          <Field label="Lieu"><Select value={draft.venue} onChange={e=>setDraft({...draft, venue: e.target.value})}>
            {["Domicile","Extérieur"].map(v=> <option key={v} value={v}>{v}</option>)}
          </Select></Field>
          <Field label="Commentaires"><TextInput value={draft.comment} onChange={e=>setDraft({...draft, comment: e.target.value})}/></Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button disabled={!canAdd} onClick={()=>{ addMatch(draft); setDraft({ id: "", date: new Date().toISOString().slice(0,10), opponent: "", venue: "Domicile", comment: "" });}}>Ajouter le match</Button>
          <IconButton onClick={()=>{ if (selectedMatchId) removeMatch(selectedMatchId); }}>Supprimer le match courant</IconButton>
        </div>

        <div className="mt-6 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">ID</th><th>Date</th><th>Adversaire</th><th>Lieu</th><th>Commentaires</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} className="border-t">
                  <td className="py-2">{m.id}</td><td>{m.date}</td><td>{m.opponent}</td><td>{m.venue}</td><td className="text-gray-500">{m.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    );
  };

  const PresencesSection = () => {
    const match = matches.find(m => m.id === selectedMatchId);
    return (
      <Section title="Présences" subtitle="Coche les joueurs présents pour le match sélectionné">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-500">Match:</span>
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
          </Select>
          {match && <Tag text={`${presentPlayerIds.size} présent(s)`} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Effectif</h3>
            <div className="space-y-2">
              {players.map(p => {
                const isPresent = presentPlayerIds.has(p.id);
                return (
                  <div key={p.id} className={`flex items-center justify-between border rounded-xl px-3 py-2 ${isPresent? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <Tag text={p.pos1} color="bg-amber-100 text-amber-800"/>
                      {p.pos2 !== "-" && <Tag text={p.pos2} color="bg-indigo-100 text-indigo-800"/>}
                      {p.pos3 !== "-" && <Tag text={p.pos3} color="bg-teal-100 text-teal-800"/>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className={isPresent? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={()=> setPresence(selectedMatchId!, p.id, !isPresent)}>
                        {isPresent? "Présent" : "Marquer présent"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Présents ({presentPlayers.length})</h3>
            <div className="space-y-2">
              {presentPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <Tag text={p.pos1} color="bg-amber-100 text-amber-800"/>
                    {p.pos2 !== "-" && <Tag text={p.pos2} color="bg-indigo-100 text-indigo-800"/>}
                    {p.pos3 !== "-" && <Tag text={p.pos3} color="bg-teal-100 text-teal-800"/>}
                  </div>
                  <IconButton onClick={()=> setPresence(selectedMatchId!, p.id, false)}>Retirer</IconButton>
                </div>
              ))}
              {presentPlayers.length===0 && <p className="text-gray-500">Aucun joueur marqué présent pour ce match.</p>}
            </div>
          </div>
        </div>
      </Section>
    );
  };

  const LineupSection = () => {
    const lineup = currentLineup;

    const setSlot = (zone: 1|2|3|4|5|6, patch: Partial<{playerId: string|undefined; plannedPos: Position|undefined}>) => {
      updateLineup(l => ({
        ...l,
        slots: l.slots.map(s => s.zone===zone? { ...s, ...patch } : s)
      }));
    };

    // Prevent duplicate same player twice in 6
    const occupied = new Set((lineup?.slots ?? []).map(s => s.playerId).filter(Boolean) as string[]);

    return (
      <Section title="Compo (zones 1 → 6)" subtitle="Ne liste que les joueurs présents sur ce match">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">Match:</span>
          <Select value={selectedMatchId} onChange={e=>setSelectedMatchId(e.target.value)}>
            {matches.map(m => <option key={m.id} value={m.id}>{m.id} • {m.opponent} • {m.date}</option>)}
          </Select>
          <Tag text={`${presentPlayers.length} présent(s)`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(lineup?.slots ?? []).map(slot => (
            <div key={slot.zone} className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Zone {slot.zone}</h4>
                {slot.playerId && <IconButton onClick={()=> setSlot(slot.zone, { playerId: undefined })}>Vider</IconButton>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Joueur (présent)">
                  <Select value={slot.playerId ?? ""} onChange={e=> setSlot(slot.zone, { playerId: e.target.value || undefined })}>
                    <option value="">— Choisir —</option>
                    {presentPlayers.map(p => (
                      <option key={p.id} value={p.id} disabled={occupied.has(p.id) && slot.playerId !== p.id}>
                        {p.name}
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
              {slot.playerId && (
                <div className="mt-3 text-xs text-gray-600">
                  <p>
                    Postes préférés du joueur : {players.find(p => p.id===slot.playerId)?.pos1} → {players.find(p => p.id===slot.playerId)?.pos2} → {players.find(p => p.id===slot.playerId)?.pos3}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={()=> window.print()}>Imprimer / Export PDF</Button>
          <IconButton onClick={()=> {
            // simple balance hint: count roles
            const count = (role: Position) => lineup?.slots.filter(s => s.plannedPos===role).length ?? 0;
            alert(`Répartition rapide\nPasseur: ${count("Passeur")}\nCentrals: ${count("Central")}\nR-A: ${count("Réceptionneur-Attaquant")}\nPointu: ${count("Pointu")}\nLibéro (hors 6): ${presentPlayers.filter(p=>p.pos1==="Libéro").length}`);
          }}>Vérifier la répartition</IconButton>
        </div>
      </Section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Volley — Base joueurs, présences & compos</h1>
          <p className="text-gray-600 mt-1">Interface simple pour gérer : joueurs (Nom + positions N°1→N°3), sélection des présents par match, et composition des 6.</p>
        </header>

        <Nav />

        {activeTab === "players" && <PlayersSection />}
        {activeTab === "matches" && <MatchesSection />}
        {activeTab === "presences" && <PresencesSection />}
        {activeTab === "lineup" && <LineupSection />}

        <footer className="mt-10 text-center text-xs text-gray-400">v0.1 — Données stockées localement dans votre navigateur.</footer>
      </div>
    </div>
  );
}
