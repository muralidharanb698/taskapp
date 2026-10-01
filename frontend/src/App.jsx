import { useEffect, useMemo, useState } from "react";
import { api, session } from "./api";

const COLS = [["todo", "To Do"], ["doing", "In Progress"], ["done", "Done"]];
const EMPTY = { title: "", description: "", priority: "medium", due_date: "", status: "todo" };

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = mode === "login" ? await api.login(f) : await api.register(f);
      session.save(data);
      onLogin();
    } catch (ex) { setErr(ex.message); }
  }

  return (
    <div className="auth">
      <h1>TaskFlow</h1>
      <p className="muted">{mode === "login" ? "Sign in to your tasks" : "Create your account"}</p>
      <form onSubmit={submit}>
        {mode === "register" && (<><label>Name</label><input value={f.name} onChange={set("name")} /></>)}
        <label>Email</label>
        <input type="email" value={f.email} onChange={set("email")} required />
        <label>Password</label>
        <input type="password" value={f.password} onChange={set("password")} required />
        {err && <p className="err">{err}</p>}
        <button className="primary full">{mode === "login" ? "Sign in" : "Register"}</button>
      </form>
      <p className="center">
        <button className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
          {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
        </button>
      </p>
    </div>
  );
}

function TaskForm({ task, onSave, onClose }) {
  const [t, setT] = useState(task || EMPTY);
  const set = (k) => (e) => setT({ ...t, [k]: e.target.value });
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(t); }}>
        <h2>{task ? "Edit task" : "New task"}</h2>
        <label>Title</label>
        <input value={t.title} onChange={set("title")} required autoFocus />
        <label>Description</label>
        <textarea rows="3" value={t.description} onChange={set("description")} />
        <label>Priority</label>
        <select value={t.priority} onChange={set("priority")}>
          <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
        </select>
        <label>Due date</label>
        <input type="date" value={t.due_date || ""} onChange={set("due_date")} />
        <label>Status</label>
        <select value={t.status} onChange={set("status")}>
          {COLS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <div className="row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function Board({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [pf, setPf] = useState("all");
  const [err, setErr] = useState("");

  const load = async () => {
    try { setTasks(await api.list()); setErr(""); } catch (e) { setErr(e.message); }
  };
  // Polls the API every 5 s so changes made on another device/tab appear automatically.
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);

  const run = async (fn) => { try { await fn(); await load(); } catch (e) { alert(e.message); } };
  const save = (t) => run(async () => {
    const body = { title: t.title.trim(), description: t.description, priority: t.priority, status: t.status, due_date: t.due_date || null };
    t.id ? await api.update(t.id, body) : await api.create(body);
    setEditing(null);
  });
  const move = (t, status) => run(() => api.update(t.id, { status }));
  const del = (t) => confirm("Delete this task?") && run(() => api.remove(t.id));

  const shown = useMemo(() => tasks.filter((t) =>
    (pf === "all" || t.priority === pf) && (t.title + " " + t.description).toLowerCase().includes(q.toLowerCase())
  ), [tasks, q, pf]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="wrap">
      <header>
        <div><h1>TaskFlow</h1><span className="live">● Auto-refresh on · {session.name()}</span></div>
        <div className="row">
          <button className="primary" onClick={() => setEditing({})}>+ New task</button>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>
      {err && <p className="err">{err}</p>}
      <div className="stats">
        {COLS.map(([k, l]) => (
          <div className="stat" key={k}><b>{tasks.filter((t) => t.status === k).length}</b><span>{l}</span></div>
        ))}
      </div>
      <div className="filters">
        <input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={pf} onChange={(e) => setPf(e.target.value)}>
          <option value="all">All priorities</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div className="board">
        {COLS.map(([k, l], i) => {
          const items = shown.filter((t) => t.status === k);
          return (
            <section className="col" key={k}>
              <h2><span>{l}</span><span>{items.length}</span></h2>
              {items.length === 0 && <div className="empty">Nothing here</div>}
              {items.map((t) => (
                <article className={"task " + (k === "done" ? "done" : "")} key={t.id}>
                  <h3>{t.title}</h3>
                  {t.description && <p>{t.description}</p>}
                  <div className="row">
                    <span className={"badge " + t.priority}>{t.priority}</span>
                    {t.due_date && <span className={"due" + (t.due_date < today && k !== "done" ? " late" : "")}>Due {t.due_date}</span>}
                  </div>
                  <div className="row between">
                    <div className="row">
                      {i > 0 && <button onClick={() => move(t, COLS[i - 1][0])}>←</button>}
                      {i < 2 && <button onClick={() => move(t, COLS[i + 1][0])}>→</button>}
                    </div>
                    <div className="row">
                      <button onClick={() => setEditing(t)}>Edit</button>
                      <button onClick={() => del(t)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {editing && <TaskForm task={editing.id ? editing : null} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!session.token());
  const logout = () => { session.clear(); setAuthed(false); };
  return authed ? <Board onLogout={logout} /> : <Auth onLogin={() => setAuthed(true)} />;
}
