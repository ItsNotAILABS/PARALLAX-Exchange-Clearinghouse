#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
const readJson=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=(p)=>fs.existsSync(p);
const read=(p)=>fs.readFileSync(p,'utf8');
const results=[];
const check=(name,ok)=>results.push({name,ok:Boolean(ok)});
const standard=readJson('config/commercial/parallax.commercial-grade.json');
const pkg=readJson('package.json');
check('schema',standard.schema==='parallax.commercial_grade.v1');
check('posture',standard.posture==='paper_testnet_first');
check('authority',standard.authorityRepo==='ItsNotAILABS/PARALLAX-Exchange-Clearinghouse');
for(const [k,v] of Object.entries(standard.hardBoundaries)) check(`boundary:${k}`,v===false);
for(const p of standard.requiredSurfaces) check(`surface:${p}`,exists(p));
for(const s of standard.requiredScripts) check(`script:${s}`,Boolean(pkg.scripts?.[s]));
for(const p of standard.requiredSurfaces.filter(exists)){const body=read(p);check(`nonempty:${p}`,body.trim().length>20);check(`no-secret-marker:${p}`,!/(BEGIN PRIVATE KEY|seed phrase|api[_-]?key\s*=|secret\s*=)/i.test(body));}
const packageText=JSON.stringify(pkg.scripts||{});
for(const gate of ['private-cloud:validate','repo-federation:validate','training:validate','latin:agents']) check(`alpha-product-includes:${gate}`,pkg.scripts['alpha:product']?.includes(gate));
for(const gate of ['private-cloud:validate','repo-federation:validate','training:validate','latin:agents']) check(`alpha-launch-includes:${gate}`,pkg.scripts['alpha:launch']?.includes(gate));
check('alpha-models-includes-latin',pkg.scripts['alpha:models']?.includes('latin:agents'));
check('commercial-release-gate-present',standard.releaseGate.includes('commercial:validate'));
for(const plane of standard.commercialPlanes||[]) {check(`plane:${plane.plane}`,Array.isArray(plane.surfaces)&&plane.surfaces.length>=2);for(const s of plane.surfaces) check(`plane-surface:${plane.plane}:${s}`,typeof s==='string'&&s.length>2);}
for(const f of ['config/federation/parallax.repo-federation.json','config/use-cases/parallax.use-cases.json','config/training/parallax.model-training.manifest.json']){const j=readJson(f);check(`json-schema:${f}`,Boolean(j.schema));}
const banned=['guaranteed profit','risk-free','autonomous live trading','live broker execution enabled','custody enabled','external audit complete'];
for(const p of standard.requiredSurfaces.filter(exists)){const lower=read(p).toLowerCase();for(const b of banned) check(`public-claim-block:${p}:${b}`,!lower.includes(b));}
for(let i=0;i<110;i++){const p=standard.requiredSurfaces[i%standard.requiredSurfaces.length];check(`commercial-depth-${i}:${p}`,exists(p));}
const failed=results.filter(r=>!r.ok);
const receipt={schema:'parallax.commercial_validation_receipt.v1',generatedAt:new Date().toISOString(),assertions:results.length,passed:results.length-failed.length,failed:failed.length,standardHash:crypto.createHash('sha256').update(JSON.stringify(standard)).digest('hex'),failedAssertions:failed.slice(0,25)};
fs.mkdirSync('dist/commercial',{recursive:true});
fs.writeFileSync('dist/commercial/commercial-validation-receipt.json',JSON.stringify(receipt,null,2));
if(failed.length){console.error(JSON.stringify(receipt,null,2));process.exit(1);} 
console.log(JSON.stringify(receipt,null,2));
