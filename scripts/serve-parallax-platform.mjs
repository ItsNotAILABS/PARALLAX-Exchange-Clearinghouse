#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const appRoot=path.join(root,'apps','universal-trading');
const { route }=await import(pathToFileURL(path.join(root,'apps','agent-api','worker.js')));
const port=Number(process.env.PORT||8787);
const stateFile=path.join(root,'.parallax','vault-state.local.json');
fs.mkdirSync(path.dirname(stateFile),{recursive:true});
const localKv={async get(){return fs.existsSync(stateFile)?fs.readFileSync(stateFile,'utf8'):null},async put(_k,v){fs.writeFileSync(stateFile,v)}};
const env={PARALLAX_VAULT_STATE:localKv};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const serve=(res,file)=>{if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file)]||'text/plain; charset=utf-8'});fs.createReadStream(file).pipe(res)};
http.createServer(async(req,res)=>{const url=new URL(req.url,`http://localhost:${port}`);if(url.pathname.startsWith('/api/')){const chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request(url,{method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined,duplex:'half'});const response=await route(request,env);res.writeHead(response.status,Object.fromEntries(response.headers.entries()));res.end(Buffer.from(await response.arrayBuffer()));return}if(url.pathname.startsWith('/config/'))return serve(res,path.join(root,url.pathname));if(url.pathname==='/'||url.pathname==='/platform')return serve(res,path.join(appRoot,'index.html'));serve(res,path.join(appRoot,decodeURIComponent(url.pathname.replace(/^\//,''))))}).listen(port,()=>{console.log(`PARALLAX local virtual platform: http://localhost:${port}/platform`);console.log(`Canonical vault state: ${stateFile}`);console.log('Agent API: GET /api/status, POST /api/vaults, GET /api/snapshot, GET /api/recovery')});