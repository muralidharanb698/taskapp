const TOKEN = "tf_token";
const NAME = "tf_name";

export const session = {
  token: () => localStorage.getItem(TOKEN),
  name: () => localStorage.getItem(NAME),
  save: (d) => { localStorage.setItem(TOKEN, d.token); localStorage.setItem(NAME, d.name); },
  clear: () => { localStorage.removeItem(TOKEN); localStorage.removeItem(NAME); },
};

async function request(path, { method = "GET", body } = {}) {
  const token = session.token();
  const res = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Token " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && token) { session.clear(); window.location.reload(); }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || Object.values(data).flat().join(" ") || "Request failed");
  return data;
}

export const api = {
  login: (b) => request("/auth/login/", { method: "POST", body: b }),
  register: (b) => request("/auth/register/", { method: "POST", body: b }),
  list: () => request("/tasks/"),
  create: (b) => request("/tasks/", { method: "POST", body: b }),
  update: (id, b) => request(`/tasks/${id}/`, { method: "PATCH", body: b }),
  remove: (id) => request(`/tasks/${id}/`, { method: "DELETE" }),
};
