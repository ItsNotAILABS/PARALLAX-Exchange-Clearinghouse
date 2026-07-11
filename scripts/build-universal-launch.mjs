import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist/universal-trading');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'apps'), { recursive: true });
await mkdir(resolve(dist, 'config'), { recursive: true });

await cp(resolve(root, 'apps/universal-trading'), resolve(dist, 'apps/universal-trading'), { recursive: true });
await cp(resolve(root, 'config/chains'), resolve(dist, 'config/chains'), { recursive: true });
await cp(resolve(root, 'config/wallets'), resolve(dist, 'config/wallets'), { recursive: true });
await cp(resolve(root, 'config/assets'), resolve(dist, 'config/assets'), { recursive: true });
await cp(resolve(root, 'config/agents'), resolve(dist, 'config/agents'), { recursive: true });
await cp(resolve(root, 'config/liquidity'), resolve(dist, 'config/liquidity'), { recursive: true });

await writeFile(resolve(dist, '.nojekyll'), '');
await writeFile(resolve(dist, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=./apps/universal-trading/"><title>PARALLAX</title></head><body><a href="./apps/universal-trading/">Open PARALLAX Universal Trading World</a></body></html>\n`);
await writeFile(resolve(dist, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PARALLAX route not found</title></head><body><main><h1>Route not found</h1><a href="./apps/universal-trading/">Return to PARALLAX</a></main></body></html>\n`);

console.log(`Built PARALLAX universal launch at ${dist}`);
