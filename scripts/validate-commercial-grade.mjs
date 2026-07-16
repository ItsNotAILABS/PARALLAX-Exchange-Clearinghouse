#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const exists = (path) => fs.existsSync(path);
const text = (path) => fs.readFileSync(path, 'utf8');
const assertions = [];
const assert = (name, ok) => assertions.push({ name, ok: Boolean(ok) });

const standard = readJson('config/commercial/parallax.commercial-grade.json');
const pkg = readJson('package.json');