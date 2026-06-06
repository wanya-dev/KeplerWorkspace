/**
 * Build a SIGNED Tizen .wgt using the official `tizen` CLI.
 *
 * A real device/emulator rejects unsigned packages (author-signature check),
 * so we sign with a security profile instead of just zipping.
 *
 * Prereqs (one-time):
 *   1. Tizen Studio installed (provides the `tizen` CLI).
 *   2. A security profile created from your author certificate, e.g.:
 *        tizen security-profiles add -n skyworth \
 *          -a /path/to/author.p12 -p '<p12 password>'
 *
 * Usage:
 *   node scripts/package-wgt.js            # uses profile "skyworth"
 *   TIZEN_PROFILE=myprofile node scripts/package-wgt.js
 *
 * Output: dist/<AppName>.wgt   (named from config.xml)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {execFileSync} = require('child_process');

const appRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(appRoot, 'dist');
const configXml = path.resolve(appRoot, 'config.xml');
const profile = process.env.TIZEN_PROFILE || 'skyworth';

// ── Locate the tizen CLI ─────────────────────────────────────────────────────
function resolveTizenCli() {
  const candidates = [
    'tizen', // on PATH
    path.join(os.homedir(), 'tizen-studio/tools/ide/bin/tizen'),
    '/opt/tizen-studio/tools/ide/bin/tizen',
  ];
  for (const c of candidates) {
    try {
      execFileSync(c, ['version'], {stdio: 'ignore'});
      return c;
    } catch (_) {
      /* try next */
    }
  }
  console.error(
    'Error: `tizen` CLI not found. Install Tizen Studio or add its\n' +
      'tools/ide/bin to PATH. Looked in:\n  ' +
      candidates.join('\n  '),
  );
  process.exit(1);
}

// ── Pre-flight ───────────────────────────────────────────────────────────────
if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ not found. Run "yarn build" first.');
  process.exit(1);
}
if (!fs.existsSync(configXml)) {
  console.error('Error: config.xml not found at ' + configXml);
  process.exit(1);
}

// `tizen package` operates on a directory whose root holds config.xml.
fs.copyFileSync(configXml, path.join(distDir, 'config.xml'));

// config.xml references icon.png; the package fails if it is missing.
// Use a real icon if provided, otherwise drop in a placeholder from assets.
const iconDest = path.join(distDir, 'icon.png');
const providedIcon = path.join(appRoot, 'icon.png');
if (fs.existsSync(providedIcon)) {
  fs.copyFileSync(providedIcon, iconDest);
} else if (!fs.existsSync(iconDest)) {
  const placeholder = path.resolve(
    appRoot,
    '../../packages/shared/src/assets/home.png',
  );
  if (fs.existsSync(placeholder)) {
    fs.copyFileSync(placeholder, iconDest);
    console.warn('⚠️  No icon.png found — using a placeholder. Add apps/tizen/icon.png for a real icon.');
  }
}

// Remove any stale .wgt so the new one is unambiguous.
for (const f of fs.readdirSync(distDir)) {
  if (f.endsWith('.wgt')) fs.unlinkSync(path.join(distDir, f));
}

// ── Sign + package ───────────────────────────────────────────────────────────
const tizen = resolveTizenCli();
console.log(`Signing with security profile "${profile}" via ${tizen}`);
try {
  execFileSync(tizen, ['package', '-t', 'wgt', '-s', profile, '--', distDir], {
    stdio: 'inherit',
  });
} catch (e) {
  console.error(
    '\n❌ tizen package failed. Common causes:\n' +
      `  • Profile "${profile}" does not exist. Create it:\n` +
      '      tizen security-profiles add -n ' + profile + ' -a <author.p12> -p <password>\n' +
      '    or set TIZEN_PROFILE to an existing profile.\n' +
      '  • Wrong .p12 password when the profile was created.\n',
  );
  process.exit(1);
}

const wgt = fs.readdirSync(distDir).find(f => f.endsWith('.wgt'));
const wgtPath = path.join(distDir, wgt);

// `tizen package` exits 0 even when the profile is missing — it just warns and
// emits an UNSIGNED package, which every device/emulator will reject. Verify
// the author signature is actually inside before claiming success.
const zipList = execFileSync('unzip', ['-l', wgtPath], {encoding: 'utf8'});
if (!zipList.includes('author-signature.xml')) {
  console.error(
    `\n❌ Package is NOT signed (no author-signature.xml in ${wgt}).\n` +
      `   The security profile "${profile}" almost certainly does not exist.\n` +
      `   Create it, then re-run:\n` +
      `     tizen security-profiles add -n ${profile} -a <author.p12> -p '<password>'\n` +
      `   Check with: tizen security-profiles list\n`,
  );
  process.exit(1);
}

console.log(`\n✅ Signed Tizen package: ${wgtPath}`);
console.log('\nInstall on the Windows emulator:');
console.log('  1. Copy the .wgt to the Windows machine');
console.log('  2. Launch the TV emulator (Emulator Manager)');
console.log('  3. sdb devices                      # note the emulator serial');
console.log(`  4. tizen install -n "${wgt}" -t <serial>`);
