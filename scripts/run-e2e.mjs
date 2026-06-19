/**
 * scripts/run-e2e.mjs — Lanza la suite E2E envolviendo con el emulador de Firebase.
 *
 * El emulador de Firestore necesita Java. Si existe un JRE local en `.jdk/` (instalado
 * sin sudo) lo antepone al PATH; si no, usa el Java del sistema (p.ej. en CI).
 * Pasa cualquier argumento extra a `playwright test` (ej: `node scripts/run-e2e.mjs --ui`).
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const env = { ...process.env };

const jdkRoot = join(root, '.jdk');
if (existsSync(jdkRoot)) {
  const dir = readdirSync(jdkRoot).find((d) => existsSync(join(jdkRoot, d, 'Contents/Home/bin/java')));
  if (dir) env.PATH = `${join(jdkRoot, dir, 'Contents/Home/bin')}:${env.PATH}`;
}

const pwArgs = process.argv.slice(2).join(' ');
// El emulador de Functions carga functions/lib/index.js → hay que compilar antes.
const build = spawnSync('npm --prefix functions run build', { stdio: 'inherit', env, shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const inner = `node scripts/seed-emulator.mjs && playwright test ${pwArgs}`.trim();
// shell:true → un único string; el comando interno va entre comillas para emulators:exec.
// --config firebase.test.json: firestore+auth+functions (evita webframeworks del hosting).
// El checkout ahora pega a las callables de functions/, así que el emulador de Functions
// debe estar arriba (PAYMENTS_MODE por defecto = mock).
const cmd = `firebase emulators:exec --only auth,firestore,functions --project theirgin --config firebase.test.json "${inner}"`;
const r = spawnSync(cmd, { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
