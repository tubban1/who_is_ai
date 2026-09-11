export const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:8787';

export async function post(path, data) {
  const res = await fetch(`${API}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  const json = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(json.error || `Request failed ${res.status}`);
  return json;
}
export async function get(path) {
  const res = await fetch(`${API}${path}`); const json=await res.json();
  if(!res.ok) throw new Error(json.error||`Request failed ${res.status}`); return json;
}
