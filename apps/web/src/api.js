// When running in production browser, always use relative path '' so requests go to the same domain (Nginx /api)
// When running locally on Vite dev server (port 5173, 5174, etc.), fallback to http://localhost:8787
const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isLocalDev = isLocalHost && window.location.port !== '8787' && window.location.port !== '';
export const API = import.meta.env.VITE_SERVER_URL || (isLocalDev ? 'http://localhost:8787' : '');

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
