import React, { useEffect, useMemo, useState, useContext } from "react";

/* ================================
   Types & constantes (MAJ sans licence)
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
  slots: { zone: 1 | 2 | 3 | 4 | 5 | 6; playerId?: string; plannedPos?: Position }[];
};

const POSITIONS: Position[] = ["2 - Passe", "3 - Centre", "4 - Pointu", "-"];

const LS_KEYS = {
  players: "volley.players.v1",
  matches: "volley.matches.v1",
  presences: "volley.presences.v1",
  lineups: "volley.lineups.v1",
  theme: "volley.theme.v1",
};

/* ================================
   Helpers stockage local
==================================*/
function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/* ================================
   Thème (clair/sombre)
   — palette & styles centralisés
==================================*/
type Theme = "light" | "dark";

type Palette = {
  pageBg: string;
  text: string;
  muted: string;
  muted2: string;

  cardBg: string;
  border: string;
  inputBorder: string;

  primary: string;
  primaryText: string;

  ghostBg: string;
  ghostText: string;

  tagBg: string;

  avatarBg: string;
  avatarText: string;

  presentBg: string;
  success: string;
};

function makePalette(theme: Theme): Palette {
  if (theme === "dark") {
    return {
      pageBg: "#0f172a", // slate-900
      text: "#e2e8f0", // slate-200
      muted: "#94a3b8", // slate-400
      muted2: "#a1a1aa", // zinc-400

      cardBg: "#111827", // gray-900
      border: "#334155", // slate-700
      inputBorder: "#475569", // slate-600

      primary: "#6366f1", // indigo-500
      primaryText: "#ffffff",

      ghostBg: "#0b1220",
      ghostText: "#e2e8f0",

      tagBg: "#1f2937", // gray-800

      avatarBg: "#1f2937", // gray-800
      avatarText: "#c7d2fe", // indigo-200

      presentBg: "#0b3d2e",
      success: "#10b981", // emerald-500
    };
  }
  // light
  return {
    pageBg: "#f1f5f9", // slate-100
    text: "#0f172a", // slate-900
    muted: "#64748b", // slate-500
    muted2: "#475569", // slate-600

    cardBg: "#ffffff",
    border: "#e2e8f0",
    inputBorder: "#e5e7eb",

    primary: "#4f46e5", // indigo-600
    primaryText: "#ffffff",

    ghostBg: "#f8fafc",
    ghostText: "#0f172a",

    tagBg: "#f1f5f9",

    avatarBg: "#eef2ff",
    avatarText: "#3730a3",

    presentBg: "#ecfdf5",
    success: "#059669", // emerald-600
  };
}

type UIStyles = {
  colors: Palette;
  card: React.CSSProperties;
  labelStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  ghostButton: React.CSSProperties;
  tag: React.CSSProperties;
};

const hStack = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap });
const vStack = (gap = 12): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap });

function makeUI(theme: Theme): UIStyles {
  const c = makePalette(theme);
  return {
    colors: c,
    card: {
      background: c.cardBg,
      borderRadius: 16,
      boxShadow: theme === "light" ? "0 6px 18px rgba(0,0,0,0.06)" : "0 6px 18px rgba(0,0,0,0.35)",
      padding: 20,
      border: `1px solid ${c.border}`,
      color: c.text,
    },
    labelStyle: { fontSize: 12, color: c.muted2 },
    inputStyle: {
      background: c.cardBg,
      color: c.text,
      border: `1px solid ${c.inputBorder}`,
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 14,
      outline: "none",
    },
    buttonStyle: {
      background: c.primary,
      color: c.primaryText,
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      cursor: "pointer",
    },
    ghostButton: {
      background: c.ghostBg,
      color: c.ghostText,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: "8px 10px",
      cursor: "pointer",
    },
    tag: {
      background: c.tagBg,
      color: c.ghostText,
      borderRadius: 999,
      padding: "2px 8px",
      fontSize: 12,
    },
  };
}

/* ================================
   Contexte UI (pour accéder aux styles)
==================================*/
const UIContext = React.createContext<UIStyles>(makeUI("light"));
const useUI = () => useContext(UIContext);

/* ================================
   Petits composants UI (sans Tailwind)
==================================*/
const Section: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right, children }) => {
  const ui = useUI();
  return (
    <div style={ui.card}>
      <div style={{ ...hStack(12), justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: ui.colors.muted, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
};

const Field: React.FC<{ label: string }> = ({ label, children }) => {
  const ui = useUI();
  return (
    <label style={vStack(6)}>
      <span style={ui.labelStyle}>{label}</span>
      {children}
    </label>
  );
};

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const ui = useUI();
  return <input {...props} style={{ ...ui.inputStyle, ...(props.style || {}) }} />;
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  const ui = useUI();
  return <select {...props} style={{ ...ui.inputStyle, ...(props.style || {}) }} />;
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => {
  const ui = useUI();
  return (
    <button {...props} style={{ ...ui.buttonStyle, ...(style || {}) }}>
      {children}
    </button>
  );
};

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => {
  const ui = useUI();
  return (
    <button {...props} style={{ ...ui.ghostButton, ...(style || {}) }}>
      {children}
    </button>
  );
};

const Tag: React.FC<{ text: string }> = ({ text }) => {
  const ui = useUI();
  return <span style={ui.tag}>{text}</span>;
};

function initials(nom: string, prenom: string) {
  return `${(prenom || "?").trim().charAt(0) || "?"}${(nom || "?").trim().charAt(0) || "?"}`.toUpperCase();
}

/* ================================
   App
==================================*/
export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadLS(LS_KEYS.players, []));
  const [matches, setMatches] = useState<Match[]>(() => loadLS(LS_KEYS.matches, []));
  const [presences, setPresences] = useState<Presence[]>(() => loadLS(LS_KEYS.presences, []));
  const [lineups, setLineups] = useState<Lineup[]>(() => loadLS(LS_KEYS.lineups, []));

  const [activeTab, setActiveTab] = useState<"players" | "matches" | "presences" | "lineup">("players");
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(() => matches[0]?.id);
  const [sortBy, setSortBy] = useState<"nom" | "pos1">("nom");

  // Thème
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = loadLS<Theme | null>(LS_KEYS.theme, null);
    if (saved === "dark" || saved === "light") return saved;
    // fallback : clair
    return "light";
  });
  const ui = useMemo(() => makeUI(theme), [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  useEffect(() => saveLS(LS_KEYS.theme, theme), [theme]);

  // Persistance
  useEffect(() => saveLS(LS_KEYS.players, players), [players]);
  useEffect(() => saveLS(LS_KEYS.matches, matches), [matches]);
  useEffect(() => saveLS(LS_KEYS.presences, presences), [presences]);
  useEffect(() => saveLS(LS_KEYS.lineups, lineups), [lineups]);

  // Données exemples minimales (pour démarrer)
  useEffect(() => {
    if (players.length === 0) {
      setPlayers([
        { id: crypto.randomUUID(), nom: "Dupont", prenom: "Alex", sexe: "Homme", pos1: "2 - Passe", pos2: "3 - Centre", pos3: "-", note: "Capitaine" },
        { id: crypto.randomUUID(), nom: "Martin", prenom: "Zoé", sexe: "Femme", pos1: "3 - Centre", pos2: "4 - Pointu", pos3: "-", note: "" },
      ]);
    }
  }, []);

  useEffect(() => {
    if (matches.length === 0) {
      const m1: Match = { id: "M1", date: new Date().toISOString().slice(0, 10), opponent: "US Rance", venue: "Domicile", comment: "Saison régulière" };
      setMatches([m1]);
      setSelectedMatchId(m1.id);
    }
  }, []);

  // Dérivés présences & lineup
  const presentPlayerIds = useMemo(() => {
    if (!selectedMatchId) return new Set<string>();
    return new Set(presences.filter((p) => p.matchId === selectedMatchId && p.present).map((p) => p.playerId));
  }, [presences, selectedMatchId]);

  const presentPlayers = useMemo(() => {
    const list = players.filter((p) => presentPlayerIds.has(p.id));
    return sortBy === "nom"
      ? [...list].sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
      : [...list].sort((a, b) => (a.pos1 || "").localeCompare(b.pos1 || ""));
  }, [players, presentPlayerIds, sortBy]);

  const sortedPlayers = useMemo(() => {
    return sortBy === "nom"
      ? [...players].sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
      : [...players].sort((a, b) => (a.pos1 || "").localeCompare(b.pos1 || ""));
  }, [players, sortBy]);

  const currentLineup = useMemo<Lineup | undefined>(() => {
    if (!selectedMatchId) return undefined;
    let l = lineups.find((l) => l.matchId === selectedMatchId);
    if (!l) {
      l = { matchId: selectedMatchId, slots: [1, 2, 3, 4, 5, 6].map((z) => ({ zone: z as 1 | 2 | 3 | 4 | 5 | 6 })) };
      setLineups((prev) => [...prev, l!]);
    }
    return l;
  }, [lineups, selectedMatchId]);

  const updateLineup = (updater: (l: Lineup) => Lineup) => {
    if (!currentLineup) return;
    setLineups((prev) => prev.map((l) => (l.matchId === currentLineup.matchId ? updater(l) : l)));
  };

  // CRUD
  const addPlayer = (p: Omit<Player, "id">) => setPlayers((prev) => [...prev, { ...p, id: crypto.randomUUID() }]);
  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setPresences((prev) => prev.filter((pr) => pr.playerId !== id));
    setLineups((prev) => prev.map((l) => ({ ...l, slots: l.slots.map((s) => (s.playerId === id ? { ...s, playerId: undefined } : s)) })));
  };
  const addMatch = (m: Match) => setMatches((prev) => [...prev, m]);
  const setPresence = (matchId: string, playerId: string, present: boolean) => {
    setPresences((prev) => {
      const idx = prev.findIndex((p) => p.matchId === matchId && p.playerId === playerId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], present };
        return copy;
      }
      return [...prev, { matchId, playerId, present }];
    });
  };

  /* ================================
     Navigation
  ==================================*/
  const Nav = () => (
    <div style={{ ...hStack(8), marginBottom: 16 }}>
      {[
        { id: "players", label: "Joueurs" },
        { id: "matches", label: "Matchs" },
        { id: "presences", label: "Présences" },
        { id: "lineup", label: "Compos" },
      ].map((t) => (
        <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ ...(activeTab === t.id ? ui.buttonStyle : ui.ghostButton) }}>
          {t.label}
        </button>
      ))}
      <div style={{ marginLeft: "auto", ...hStack(8) }}>
        <IconButton onClick={toggleTheme} title={theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"}>
          {theme === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"}
        </IconButton>
      </div>
    </div>
  );

 /* ================================
   Onglet JOUEURS (pos1 obligatoire, pos2/pos3 facultatifs)
==================================*/
const PlayersSection = () => {
  const [draft, setDraft] = useState<Omit<Player, "id">>({
    nom: "",
    prenom: "",
    sexe: "Homme",
    pos1: "2 - Passe",    // obligatoire
    pos2: undefined,      // facultatif
    pos3: undefined,      // facultatif
    note: "",
  });

  return (
    <Section
      title="Effectif"
      subtitle="Renseigne les joueurs puis organise leur compo"
      right={
        <div style={hStack(8)}>
          <span style={{ fontSize: 12, color: ui.colors.muted }}>Trier par</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: "6px 10px" }}
          >
            <option value="nom">Nom</option>
            <option value="pos1">Position N°1</option>
          </Select>
        </div>
      }
    >
      {/* FORMULAIRE JOUEUR */}
      <div style={vStack(12)}>
        <Field label="Nom">
          <TextInput
            value={draft.nom}
            onChange={(e) => setDraft({ ...draft, nom: e.target.value })}
            placeholder="Dupont"
          />
        </Field>

        <Field label="Prénom">
          <TextInput
            value={draft.prenom}
            onChange={(e) => setDraft({ ...draft, prenom: e.target.value })}
            placeholder="Alex"
          />
        </Field>

        <Field label="Sexe">
          <Select
            value={draft.sexe}
            onChange={(e) =>
              setDraft({ ...draft, sexe: e.target.value as "Homme" | "Femme" })
            }
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </Select>
        </Field>

        {/* POS1 obligatoire */}
        <Field label="1er poste (obligatoire)">
          <Select
            value={draft.pos1}
            onChange={(e) =>
              setDraft({ ...draft, pos1: e.target.value as Position })
            }
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        {/* POS2 facultatif */}
        <Field label="2ème poste (facultatif)">
          <Select
            value={draft.pos2 ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                pos2: (e.target.value as Position) || undefined,
              })
            }
          >
            <option value=""></option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        {/* POS3 facultatif */}
        <Field label="3ème poste (facultatif)">
          <Select
            value={draft.pos3 ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                pos3: (e.target.value as Position) || undefined,
              })
            }
          >
            <option value=""></option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* AJOUT DU JOUEUR */}
      <div style={{ marginTop: 12 }}>
        <Button
          onClick={() => {
            if (!draft.nom || !draft.prenom || !draft.pos1) return;

            addPlayer(draft);

            setDraft({
              nom: "",
              prenom: "",
              sexe: "Homme",
              pos1: "2 - Passe",
              pos2: undefined,
              pos3: undefined,
              note: "",
            });
          }}
        >
          Ajouter le joueur
        </Button>
      </div>

      {/* LISTE DES JOUEURS */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {sortedPlayers.map((p) => (
          <div key={p.id} style={{ ...ui.card, padding: 16 }}>
            <div style={hStack(10)}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: ui.colors.avatarBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: ui.colors.avatarText,
                }}
              >
                {initials(p.nom, p.prenom)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {p.prenom} {p.nom}
                </div>
                <div style={{ fontSize: 12, color: ui.colors.muted }}>
                  {p.sexe}
                </div>
              </div>

              <IconButton onClick={() => removePlayer(p.id)}>Suppr</IconButton>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <Tag text={p.pos1} />
              {p.pos2 && <Tag text={p.pos2} />}
              {p.pos3 && <Tag text={p.pos3} />}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

/* ================================
   Onglet MATCHS — avec tri par date
==================================*/
const MatchesSection = () => {
  const [draft, setDraft] = useState<Match>({
    id: "",
    date: new Date().toISOString().slice(0, 10),
    opponent: "",
    venue: "Domicile",
    comment: "",
    matchType: "Saison Hiver",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  /* ========== TRI PAR DATE ========== */
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) =>
      b.date.localeCompare(a.date) // plus récent → plus ancien
    );
  }, [matches]);

  const resetDraft = () =>
    setDraft({
      id: "",
      date: new Date().toISOString().slice(0, 10),
      opponent: "",
      venue: "Domicile",
      comment: "",
      matchType: "Saison Hiver",
    });

  const startEdit = (m: Match) => {
    setEditingId(m.id);
    setDraft({ ...m });
    setSelectedMatchId(m.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetDraft();
  };

  const saveMatch = () => {
    if (editingId) {
      setMatches(prev =>
        prev.map(m =>
          m.id === editingId ? { ...m, ...draft, id: editingId } : m
        )
      );
      setEditingId(null);
      resetDraft();
      return;
    }

    if (!draft.id) return;

    if (matches.some(m => m.id === draft.id)) {
      alert(`Un match avec l'ID "${draft.id}" existe déjà.`);
      return;
    }

    addMatch(draft);
    resetDraft();
  };

  const removeMatch = (id: string) => {
    if (!confirm("Supprimer ce match ? Les données associées seront supprimées.")) return;

    setMatches(prev => prev.filter(m => m.id !== id));
    setPresences(prev => prev.filter(p => p.matchId !== id));
    setLineups(prev => prev.filter(l => l.matchId !== id));

    if (selectedMatchId === id) {
      const next = sortedMatches.find(m => m.id !== id)?.id;
      setSelectedMatchId(next);
    }

    if (editingId === id) {
      setEditingId(null);
      resetDraft();
    }
  };

  return (
    <Section
      title="Matchs"
      subtitle="Crée, modifie ou supprime des rencontres (triées par date)."
      right={
        <div style={hStack(8)}>
          <span style={{ fontSize: 12, color: ui.colors.muted }}>Match courant</span>
          <Select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            {sortedMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} • {m.opponent} • {m.date}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      {/* FORMULAIRE */}
      <div style={vStack(12)}>
        <Field label="Match ID">
          <TextInput
            value={draft.id}
            onChange={(e) => setDraft({ ...draft, id: e.target.value })}
            placeholder="M3"
            disabled={!!editingId}
          />
        </Field>

        <Field label="Date">
          <TextInput
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </Field>

        <Field label="Adversaire">
          <TextInput
            value={draft.opponent}
            onChange={(e) => setDraft({ ...draft, opponent: e.target.value })}
          />
        </Field>

        <Field label="Lieu">
          <TextInput
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </Field>

        <Field label="Type de match">
          <Select
            value={draft.matchType}
            onChange={(e) => setDraft({ ...draft, matchType: e.target.value as any })}
          >
            <option value="Saison Hiver">Saison Hiver</option>
            <option value="Saison Aller/Retour">Saison Aller/Retour</option>
            <option value="Coupe">Coupe</option>
          </Select>
        </Field>

        <Field label="Commentaires">
          <TextInput
            value={draft.comment}
            onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
          />
        </Field>
      </div>

      {/* ACTIONS */}
      <div style={{ marginTop: 12, ...hStack(8) }}>
        <Button onClick={saveMatch}>
          {editingId ? "Enregistrer" : "Ajouter"}
        </Button>

        {editingId && (
          <IconButton onClick={cancelEdit}>Annuler</IconButton>
        )}
      </div>

      {/* TABLEAU MATCHS */}
      <div style={{ marginTop: 18 }}>
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ color: ui.colors.muted2, textAlign: "left" }}>
              <th>ID</th>
              <th>Date</th>
              <th>Adversaire</th>
              <th>Lieu</th>
              <th>Type</th>
              <th>Commentaires</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedMatches.map((m) => (
              <tr key={m.id} style={{ borderTop: `1px solid ${ui.colors.border}` }}>
                <td>{m.id}</td>
                <td>{m.date}</td>
                <td>{m.opponent}</td>
                <td>{m.venue}</td>
                <td>{m.matchType}</td>
                <td style={{ color: ui.colors.muted }}>{m.comment}</td>

                <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <IconButton onClick={() => startEdit(m)}>Modifier</IconButton>
                    <IconButton onClick={() => removeMatch(m.id)} style={{ color: "#dc2626" }}>
                      Supprimer
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
};
/* ================================
   Onglet PRESENCES (version bouton + sans "-")
==================================*/
const PresencesSection = () => {
  return (
    <Section
      title="Présences"
      subtitle="Indique quels joueurs sont présents pour ce match"
      right={
        <div style={hStack(8)}>
          <span style={{ fontSize: 12, color: ui.colors.muted }}>Match</span>
          <Select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} • {m.opponent} • {m.date}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      {/* LISTE UNIQUE */}
      <div style={vStack(8)}>
        {players.map((p) => {
          const isPresent = presentPlayerIds.has(p.id);

          return (
            <div
              key={p.id}
              style={{
                ...hStack(10),
                justifyContent: "space-between",
                border: `1px solid ${ui.colors.border}`,
                borderRadius: 12,
                padding: "10px 12px",
                background: isPresent ? ui.colors.presentBg : ui.colors.cardBg,
              }}
            >
              {/* Infos joueur */}
              <div style={hStack(8)}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: ui.colors.avatarBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: ui.colors.avatarText,
                  }}
                >
                  {initials(p.nom, p.prenom)}
                </div>

                <div style={{ fontWeight: 500 }}>
                  {p.prenom} {p.nom}
                </div>

                <Tag text={p.pos1} />
                {p.pos2 && <Tag text={p.pos2} />}
                {p.pos3 && <Tag text={p.pos3} />}
              </div>

              {/* BOUTON Présent / Absent */}
              <Button
                style={{
                  background: isPresent ? ui.colors.success : ui.colors.primary,
                  padding: "8px 14px",
                }}
                onClick={() =>
                  setPresence(selectedMatchId!, p.id, !isPresent)
                }
              >
                {isPresent ? "Présent" : "Marquer présent"}
              </Button>
            </div>
          );
        })}

        {players.length === 0 && (
          <div style={{ color: ui.colors.muted }}>
            Aucun joueur dans l'effectif.
          </div>
        )}
      </div>
    </Section>
  );
};
/* ================================
   Onglet COMPOS — Sélection Banc → Tap Position (mobile-friendly)
   Lignes : 4‑3‑2 (haut) / 5‑6‑1 (bas)
   Rôles : 2&5 = Passe, 1&4 = Pointu, 3&6 = Centre
   1 joueur max par case
==================================*/
const LineupSection = () => {
  const lineup = currentLineup!;

  // Rôles par zone (corrigé selon ta demande)
  const ROLE_BY_ZONE: Record<1|2|3|4|5|6, Position> = {
    2: "2 - Passe",
    5: "2 - Passe",
    4: "4 - Pointu",
    1: "4 - Pointu",
    3: "3 - Centre",
    6: "3 - Centre",
  };

  // Disposition terrain
  const TOP_ROW: (1|2|3|4|5|6)[]    = [4, 3, 2];
  const BOTTOM_ROW: (1|2|3|4|5|6)[] = [5, 6, 1];

  // Récup slot par zone
  const getSlot = (zone: 1|2|3|4|5|6) =>
    lineup.slots.find(s => s.zone === zone) ?? { zone, playerId: undefined };

  // Sélection courante (joueur choisi dans le banc)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Joueurs “assignés” et “banc”
  const assignedIds = new Set(
    lineup.slots.map(s => s.playerId).filter(Boolean) as string[]
  );
  const benchPlayers = presentPlayers.filter(p => !assignedIds.has(p.id));

  // Indication : le joueur “match” le rôle attendu par zone ?
  const matchesRole = (p: Player, z: 1|2|3|4|5|6) =>
    [p.pos1, p.pos2, p.pos3].includes(ROLE_BY_ZONE[z]);

  // Placer un joueur dans une zone (retire d’abord toute précédente affectation)
  const placeSelectedInZone = (zone: 1|2|3|4|5|6) => {
    if (!selectedPlayerId) return;

    const plannedPos = ROLE_BY_ZONE[zone];
    updateLineup(l => {
      // 1) Retire le joueur de sa zone actuelle (si déjà posé)
      let slots = l.slots.map(s =>
        s.playerId === selectedPlayerId ? { ...s, playerId: undefined } : s
      );

      // 2) Si la zone ciblée est occupée, on renvoie l'occupant au banc (en le retirant seulement)
      const current = slots.find(s => s.zone === zone);
      if (current?.playerId && current.playerId !== selectedPlayerId) {
        slots = slots.map(s =>
          s.zone === zone ? { ...s, playerId: undefined } : s
        );
      }

      // 3) Place le joueur sélectionné
      slots = slots.map(s =>
        s.zone === zone ? { ...s, playerId: selectedPlayerId, plannedPos } : s
      );

      return { ...l, slots };
    });

    // On peut garder la sélection active pour enchaîner plusieurs placements
    // ou l'enlever pour éviter des “taps” involontaires. Ici je la garde active.
    // Si tu préfères, dé-commente la ligne ci-dessous pour la vider après placement.
    // setSelectedPlayerId(null);
  };

  // Vider une zone → remet le joueur au banc
  const clearZone = (zone: 1|2|3|4|5|6) => {
    updateLineup(l => ({
      ...l,
      slots: l.slots.map(s => s.zone === zone ? { ...s, playerId: undefined } : s)
    }));
  };

  // Vider toutes les positions
  const clearAll = () => {
    updateLineup(l => ({ ...l, slots: l.slots.map(s => ({ ...s, playerId: undefined })) }));
  };

  // Répartition auto (pos1 en priorité puis pos2/pos3) dans l’ordre 4‑3‑2 / 5‑6‑1
  const autoDistribute = () => {
    const order: (1|2|3|4|5|6)[] = [...TOP_ROW, ...BOTTOM_ROW];
    const available = [...presentPlayers];

    const pick = (role: Position) => {
      let i = available.findIndex(p => p.pos1 === role);
      if (i === -1) i = available.findIndex(p => p.pos2 === role || p.pos3 === role);
      return i >= 0 ? available.splice(i, 1)[0] : undefined;
    };

    updateLineup(l => {
      let slots = l.slots.map(s => ({ ...s, playerId: undefined }));
      for (const z of order) {
        const p = pick(ROLE_BY_ZONE[z]);
        if (p) slots = slots.map(s => s.zone === z ? { ...s, playerId: p.id } : s);
      }
      return { ...l, slots };
    });
  };

  // Styles
  const court: React.CSSProperties = {
    border: `2px solid ${ui.colors.border}`,
    borderRadius: 16,
    padding: 12,
    background: ui.colors.cardBg
  };
  const rowGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10
  };
  const zoneBox = (alert = false): React.CSSProperties => ({
    border: `1px dashed ${ui.colors.border}`,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: alert ? "#fca5a520" : ui.colors.cardBg,
    cursor: "pointer",
  });
  const avatar: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 999,
    background: ui.colors.avatarBg,
    display: "flex", justifyContent: "center", alignItems: "center",
    fontSize: 11, fontWeight: 700, color: ui.colors.avatarText
  };
  const benchPill: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", gap:6,
    border:`1px solid ${ui.colors.border}`, background: ui.colors.cardBg,
    padding:"8px 12px", borderRadius: 999,
    cursor:"pointer",
  };
  const benchPillActive: React.CSSProperties = {
    ...benchPill,
    outline: `2px solid ${ui.colors.primary}`,
    boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
  };

  const ZoneCell: React.FC<{ zone: 1|2|3|4|5|6 }> = ({ zone }) => {
    const slot = getSlot(zone);
    const p = players.find(pp => pp.id === slot.playerId);
    const ok = p ? matchesRole(p, zone) : false;

    return (
      <div>
        <div style={{ fontSize:12, color:ui.colors.muted, marginBottom:4 }}>
          Position {zone} • {ROLE_BY_ZONE[zone].split(" - ")[1]}
        </div>

        {/* Tap sur la case → place le joueur sélectionné si présent */}
        <div style={zoneBox(!!p && !ok)} onClick={() => placeSelectedInZone(zone)}>
          {p ? (
            <>

                {/* 👇 Uniquement le prénom dans la case */}
                <div style={{ fontWeight:700 }}>{p.prenom}</div>


              <IconButton onClick={(e) => { e.stopPropagation(); clearZone(zone); }}>
                Suppr
              </IconButton>
            </>
          ) : (
            <div style={{ color: ui.colors.muted }}>Tap pour placer le joueur sélectionné…</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Section
      title="Composition – Terrain (tap pour placer)"
      subtitle="Sélectionne un joueur dans le banc puis tape une position (4‑3‑2 / 5‑6‑1)."
    >
      {/* Sélecteur de match */}
      <div style={{ ...hStack(8), marginBottom:10 }}>
        <span style={{ fontSize:12, color:ui.colors.muted }}>Match</span>
        <Select value={selectedMatchId} onChange={(e)=>setSelectedMatchId(e.target.value)}>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.id} • {m.opponent} • {m.date}
            </option>
          ))}
        </Select>
        <div style={{ marginLeft:"auto", fontSize:12, color:ui.colors.muted }}>
          {presentPlayers.length} présent(s)
        </div>
      </div>

      {/* TERRAIN */}
      <div style={court}>
        {/* Ligne haute : 4 - 3 - 2 */}
        <div style={{ ...rowGrid, marginBottom:12 }}>
          {TOP_ROW.map(z => <ZoneCell key={z} zone={z} />)}
        </div>
        {/* Ligne basse : 5 - 6 - 1 */}
        <div style={rowGrid}>
          {BOTTOM_ROW.map(z => <ZoneCell key={z} zone={z} />)}
        </div>
      </div>

/* ================================
   Onglet COMPOS — Sélection Banc → Tap Position (mobile-friendly)
   Lignes : 4‑3‑2 (haut) / 5‑6‑1 (bas)
   Rôles : 2&5 = Passe, 1&4 = Pointu, 3&6 = Centre
   1 joueur max par case
==================================*/
const LineupSection = () => {
  const lineup = currentLineup!;

  // Rôles par zone (corrigé selon ta demande)
  const ROLE_BY_ZONE: Record<1|2|3|4|5|6, Position> = {
    2: "2 - Passe",
    5: "2 - Passe",
    4: "4 - Pointu",
    1: "4 - Pointu",
    3: "3 - Centre",
    6: "3 - Centre",
  };

  // Disposition terrain
  const TOP_ROW: (1|2|3|4|5|6)[]    = [4, 3, 2];
  const BOTTOM_ROW: (1|2|3|4|5|6)[] = [5, 6, 1];

  // Récup slot par zone
  const getSlot = (zone: 1|2|3|4|5|6) =>
    lineup.slots.find(s => s.zone === zone) ?? { zone, playerId: undefined };

  // Sélection courante (joueur choisi dans le banc)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Joueurs “assignés” et “banc”
  const assignedIds = new Set(
    lineup.slots.map(s => s.playerId).filter(Boolean) as string[]
  );
  const benchPlayers = presentPlayers.filter(p => !assignedIds.has(p.id));

  // Le joueur correspond-il au rôle attendu par la zone ?
  const matchesRole = (p: Player, z: 1|2|3|4|5|6) =>
    [p.pos1, p.pos2, p.pos3].includes(ROLE_BY_ZONE[z]);

  // Placer un joueur dans une zone (retire d’abord toute précédente affectation)
  const placeSelectedInZone = (zone: 1|2|3|4|5|6) => {
    if (!selectedPlayerId) return;

    const plannedPos = ROLE_BY_ZONE[zone];
    updateLineup(l => {
      // 1) Retire ce joueur s'il est déjà posé ailleurs
      let slots = l.slots.map(s =>
        s.playerId === selectedPlayerId ? { ...s, playerId: undefined } : s
      );

      // 2) Si la zone ciblée est occupée, on libère l’occupant (il retourne au banc)
      const current = slots.find(s => s.zone === zone);
      if (current?.playerId && current.playerId !== selectedPlayerId) {
        slots = slots.map(s =>
          s.zone === zone ? { ...s, playerId: undefined } : s
        );
      }

      // 3) Place le joueur sélectionné dans la zone
      slots = slots.map(s =>
        s.zone === zone ? { ...s, playerId: selectedPlayerId, plannedPos } : s
      );

      return { ...l, slots };
    });

    // Laisse la sélection active pour enchaîner des placements si tu veux :
    // setSelectedPlayerId(null);
  };

  // Vider une zone → remet le joueur au banc
  const clearZone = (zone: 1|2|3|4|5|6) => {
    updateLineup(l => ({
      ...l,
      slots: l.slots.map(s => s.zone === zone ? { ...s, playerId: undefined } : s)
    }));
  };

  // Vider toutes les positions
  const clearAll = () => {
    updateLineup(l => ({ ...l, slots: l.slots.map(s => ({ ...s, playerId: undefined })) }));
  };

  // Répartition auto (pos1 en priorité puis pos2/pos3) dans l’ordre 4‑3‑2 / 5‑6‑1
  const autoDistribute = () => {
    const order: (1|2|3|4|5|6)[] = [...TOP_ROW, ...BOTTOM_ROW];
    const available = [...presentPlayers];

    const pick = (role: Position) => {
      let i = available.findIndex(p => p.pos1 === role);
      if (i === -1) i = available.findIndex(p => p.pos2 === role || p.pos3 === role);
      return i >= 0 ? available.splice(i, 1)[0] : undefined;
    };

    updateLineup(l => {
      let slots = l.slots.map(s => ({ ...s, playerId: undefined }));
      for (const z of order) {
        const p = pick(ROLE_BY_ZONE[z]);
        if (p) slots = slots.map(s => s.zone === z ? { ...s, playerId: p.id } : s);
      }
      return { ...l, slots };
    });
  };

  // === STYLES ===
  const court: React.CSSProperties = {
    border: `2px solid ${ui.colors.border}`,
    borderRadius: 16,
    padding: 12,
    background: ui.colors.cardBg
  };
  const rowGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10
  };
  const zoneBox = (alert = false): React.CSSProperties => ({
    border: `1px dashed ${ui.colors.border}`,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: alert ? "#fca5a520" : ui.colors.cardBg,
    cursor: "pointer",
  });
  const avatar: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 999,
    background: ui.colors.avatarBg,
    display: "flex", justifyContent: "center", alignItems: "center",
    fontSize: 11, fontWeight: 700, color: ui.colors.avatarText
  };
  const benchPill: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", gap:6,
    border:`1px solid ${ui.colors.border}`, background: ui.colors.cardBg,
    padding:"8px 12px", borderRadius: 999,
    cursor:"pointer",
  };
  const benchPillActive: React.CSSProperties = {
    ...benchPill,
    outline: `2px solid ${ui.colors.primary}`,
    boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
  };

  // Couleur de bordure selon rôle principal (pos1) — JAUNE / VERT / ORANGE
  const getRoleColor = (p: Player) => {
    switch (p.pos1) {
      case "2 - Passe":   return "#eab308"; // jaune
      case "3 - Centre":  return "#22c55e"; // vert
      case "4 - Pointu":  return "#f97316"; // orange
      default:            return ui.colors.border;
    }
  };

  // === Cellule de position (terrain) – affiche UNIQUEMENT le PRÉNOM ===
  const ZoneCell: React.FC<{ zone: 1|2|3|4|5|6 }> = ({ zone }) => {
    const slot = getSlot(zone);
    const p = players.find(pp => pp.id === slot.playerId);
    const ok = p ? matchesRole(p, zone) : false;

    return (
      <div>
        <div style={{ fontSize:12, color:ui.colors.muted, marginBottom:4 }}>
          Position {zone} • {ROLE_BY_ZONE[zone].split(" - ")[1]}
        </div>

        <div
          style={zoneBox(!!p && !ok)}
          onClick={() => placeSelectedInZone(zone)}
        >
          {p ? (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={avatar}>{initials(p.nom, p.prenom)}</div>
                <div style={{ fontWeight:700 }}>{p.prenom}</div>
                {ok ? <Tag text="OK rôle" /> : <Tag text="? rôle" />}
              </div>

              <IconButton onClick={(e) => { e.stopPropagation(); clearZone(zone); }}>
                Suppr
              </IconButton>
            </>
          ) : (
            <div style={{ color: ui.colors.muted }}>
              Tap pour placer le joueur sélectionné…
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Section
      title="Composition – Terrain (tap pour placer)"
      subtitle="Sélectionne un joueur dans le banc puis tape une position (4‑3‑2 / 5‑6‑1)."
    >
      {/* Sélecteur de match */}
      <div style={{ ...hStack(8), marginBottom:10 }}>
        <span style={{ fontSize:12, color:ui.colors.muted }}>Match</span>
        <Select value={selectedMatchId} onChange={(e)=>setSelectedMatchId(e.target.value)}>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.id} • {m.opponent} • {m.date}
            </option>
          ))}
        </Select>
        <div style={{ marginLeft:"auto", fontSize:12, color: ui.colors.muted }}>
          {presentPlayers.length} présent(s)
        </div>
      </div>

      {/* TERRAIN */}
      <div style={court}>
        {/* Ligne haute : 4 - 3 - 2 */}
        <div style={{ ...rowGrid, marginBottom:12 }}>
          {TOP_ROW.map(z => <ZoneCell key={z} zone={z} />)}
        </div>
        {/* Ligne basse : 5 - 6 - 1 */}
        <div style={rowGrid}>
          {BOTTOM_ROW.map(z => <ZoneCell key={z} zone={z} />)}
        </div>
      </div>

      {/* BANC — sélectionner un joueur (tap) */}
      <div style={{ marginTop:14 }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>Banc (tap pour sélectionner)</div>

        <div
          style={{
            border:`1px solid ${ui.colors.border}`,
            borderRadius:12,
            padding:10,
            minHeight:60,
            display:"flex",
            flexWrap:"wrap",
            gap:8
          }}
        >
          {benchPlayers.length === 0 && (
            <div style={{ color:ui.colors.muted }}>Aucun joueur disponible</div>
          )}

          {benchPlayers.map(p => {
            const active = selectedPlayerId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                style={{
                  ...(active ? benchPillActive : benchPill),
                  borderColor: getRoleColor(p),   // couleur selon pos1
                }}
                title="Sélectionner ce joueur puis taper une position"
              >
                <div style={avatar}>{initials(p.nom, p.prenom)}</div>
                <span style={{ fontWeight:600 }}>{p.prenom} {p.nom}</span>
                <span style={{ display:"inline-flex", gap:6 }}>
                  <Tag text={p.pos1} />
                  {p.pos2 && <Tag text={p.pos2} />}
                  {p.pos3 && <Tag text={p.pos3} />}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ ...hStack(8), marginTop:12, flexWrap:"wrap" }}>
        <IconButton onClick={autoDistribute}>Répartition auto</IconButton>
        <IconButton onClick={clearAll}>Vider toutes les positions</IconButton>
      </div>
    </Section>
  );
};


  /* ================================
     Render
  ==================================*/
  return (
    <UIContext.Provider value={ui}>
      <div style={{ minHeight: "100vh", background: ui.colors.pageBg, padding: "16px 16px 60px", color: ui.colors.text }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <header style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Volley — Composition</div>
            <div style={{ color: ui.colors.muted, marginTop: 4, fontSize: 14 }}>
              Gestion des joueurs, présences et compositions en fonction des postes suivants : 2‑Passe, 3‑Centre, 4‑Pointu.
            </div>
          </header>

          <Nav />

          {activeTab === "players" && <PlayersSection />}
          {activeTab === "matches" && <MatchesSection />}
          {activeTab === "presences" && <PresencesSection />}
          {activeTab === "lineup" && <LineupSection />}

          <footer style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: ui.colors.muted }}>
            v0.5 — Données stockées localement.
          </footer>
        </div>
      </div>
    </UIContext.Provider>
  );
}
``
