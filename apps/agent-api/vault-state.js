const now=()=>new Date().toISOString();
const stable=(v)=>JSON.stringify(v,Object.keys(v||{}).sort());
const hash=(v)=>{let h=2166136261;for(const c of JSON.stringify(v))h=Math.imul(h^c.charCodeAt(0),16777619);return `px_${(h>>>0).toString(16).padStart(8,'0')}`};
const day=()=>new Date().toISOString().slice(0,10);
const seed=()=>({schema:'parallax.canonical_vault_state.v1',version:1,updatedAt:now(),ledgers:[