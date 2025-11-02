// Simple wrapper for fetch with JSON and auth
export async function apiFetch(path, opts={}){
  const res = await fetch(path, opts);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}