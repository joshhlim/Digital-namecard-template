#!/usr/bin/env node
// Generates the static site in dist/ from card.json. Usage: npm run build
// Optional arguments, mainly for testing: node scripts/build.js [config] [outDir]
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const CONFIG = path.resolve(process.argv[2] || path.join(ROOT, 'card.json'));
const OUT = path.resolve(process.argv[3] || path.join(ROOT, 'dist'));
const ACCENT = '#0f766e';
const LINK_ICONS = JSON.parse(fs.readFileSync(path.join(SRC, 'link-icons.json'), 'utf8'));
const LINK_LABELS = { linkedin: 'LinkedIn', github: 'GitHub', x: 'X', website: 'Website' };

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function loadCard() {
  if (!fs.existsSync(CONFIG)) {
    fail(`Couldn't find ${path.basename(CONFIG)}. Create it from the blank template:\n  cp card.example.json card.json`);
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  } catch (error) {
    fail(`${path.basename(CONFIG)} isn't valid JSON: ${error.message}`);
  }

  const text = (value) => String(value ?? '').trim();
  const card = {
    firstName: text(raw.firstName),
    lastName: text(raw.lastName),
    title: text(raw.title),
    organization: text(raw.organization),
    organizationShort: text(raw.organizationShort),
    bio: text(raw.bio),
    url: text(raw.url),
    phone: text(raw.phone).replace(/[^\d+]/g, ''),
    emails: (raw.emails || []).filter((email) => text(email.address)),
    links: (raw.links || []).filter((link) => text(link.url)),
    photo: {
      file: text(raw.photo?.file),
      focusX: Number(raw.photo?.focusX ?? 0.5),
      focusY: Number(raw.photo?.focusY ?? 0.3),
    },
  };

  const problems = [];
  if (!card.firstName) problems.push('firstName is required');
  if (!card.title) problems.push('title is required');
  if (!/^https:\/\/[^\s/]+\.[^\s]+$/.test(card.url)) {
    problems.push('url must be the full https:// address your card will live at');
  }
  for (const key of ['focusX', 'focusY']) {
    const value = card.photo[key];
    if (!(value >= 0 && value <= 1)) problems.push(`photo.${key} must be between 0 and 1`);
  }
  for (const email of card.emails) {
    if (!text(email.label)) problems.push(`email ${email.address} needs a label`);
  }
  for (const link of card.links) {
    if (!/^https?:\/\//.test(text(link.url))) problems.push(`link ${link.url} must start with https://`);
  }
  if (problems.length) {
    fail(`Please fix ${path.basename(CONFIG)}:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
  }

  card.url = card.url.endsWith('/') ? card.url : `${card.url}/`;
  card.name = [card.firstName, card.lastName].filter(Boolean).join(' ');
  card.initials = [card.firstName, card.lastName]
    .filter(Boolean)
    .map((part) => [...part][0].toUpperCase())
    .join('');
  card.role = card.organization ? `${card.title} at ${card.organization}` : card.title;
  return card;
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function renderBanner(card, photo) {
  const content = photo
    ? `<img src="photo.jpg" alt="${escapeHtml(card.name)}">`
    : `<span class="banner-initials" aria-hidden="true">${escapeHtml(card.initials)}</span>`;
  const style = photo ? ` style="--photo-edge: ${photo.edgeColor}; --focus-y: ${photo.focusY}"` : '';
  return `        <div class="banner"${style}>\n          ${content}\n        </div>`;
}

function renderEmails(card) {
  if (!card.emails.length) return '';
  const rows = card.emails.map(({ label, address }) => (
    `              <li><a href="mailto:${escapeHtml(address)}"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(address)}</span></a></li>`
  )).join('\n');
  return `

          <section aria-labelledby="email-heading">
            <h2 id="email-heading">email</h2>
            <ul class="rows">
${rows}
            </ul>
          </section>`;
}

const linkLabel = (link) => link.label || LINK_LABELS[link.type] || 'Website';

function renderLinks(card) {
  if (!card.links.length) return '';
  const items = card.links.map((link) => {
    const label = escapeHtml(linkLabel(link));
    return `              <li>
                <a href="${escapeHtml(link.url)}" aria-label="${label}" title="${label}">
                  ${LINK_ICONS[link.type] || LINK_ICONS.website}
                </a>
              </li>`;
  }).join('\n');
  return `

          <section aria-labelledby="links-heading">
            <h2 id="links-heading">links</h2>
            <ul class="icons">
${items}
            </ul>
          </section>`;
}

function renderHtml(card, photo) {
  const details = card.bio ? `${card.role}. ${card.bio}` : card.role;
  const orgLabel = card.organizationShort
    ? `${card.organization} (${card.organizationShort})`
    : card.organization;
  const shareData = JSON.stringify({
    title: `${card.name} | ${card.title}`,
    text: `${card.name}, ${card.role}`,
    url: card.url,
  }).replace(/</g, '\\u003c');

  const values = {
    name: escapeHtml(card.name),
    title: escapeHtml(card.title),
    url: escapeHtml(card.url),
    pageTitle: escapeHtml(`${card.name} | ${card.title}`),
    description: escapeHtml(`${card.name}, ${details}`),
    ogDescription: escapeHtml(details),
    ogImageUrl: escapeHtml(`${card.url}og-image.jpg`),
    summary: escapeHtml(`${card.name}, ${card.role}`),
    banner: renderBanner(card, photo),
    orgLine: orgLabel ? `\n            <p class="org">${escapeHtml(orgLabel)}</p>` : '',
    bioLine: card.bio ? `\n            <p class="bio">${escapeHtml(card.bio)}</p>` : '',
    emailSection: renderEmails(card),
    linksSection: renderLinks(card),
    shareData,
  };
  const template = fs.readFileSync(path.join(SRC, 'index.template.html'), 'utf8');
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]);
}

function contactFilename(card) {
  const slug = card.name
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'contact'}.vcf`;
}

const escapeVcard = (value) => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;')
  .replace(/\r?\n/g, '\\n');

// vCard lines are limited to 75 bytes; longer ones continue after a leading space.
function foldLine(line) {
  const parts = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > 75) {
      parts.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}

function renderVcard(card, contactPhoto) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVcard(card.lastName)};${escapeVcard(card.firstName)};;;`,
    `FN:${escapeVcard(card.name)}`,
  ];
  if (card.organization) lines.push(`ORG:${escapeVcard(card.organization)}`);
  lines.push(`TITLE:${escapeVcard(card.title)}`);
  for (const email of card.emails) {
    lines.push(`EMAIL;TYPE=INTERNET,${email.type === 'work' ? 'WORK' : 'HOME'}:${email.address}`);
  }
  if (card.phone) lines.push(`TEL;TYPE=CELL,VOICE:${card.phone}`);
  card.links.forEach((link, index) => {
    lines.push(`item${index + 1}.URL:${link.url}`, `item${index + 1}.X-ABLabel:${escapeVcard(linkLabel(link))}`);
  });
  if (card.bio) lines.push(`NOTE:${escapeVcard(card.bio)}`);
  if (contactPhoto) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${contactPhoto.toString('base64')}`);
  lines.push('END:VCARD');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

async function preparePhoto(card) {
  if (!card.photo.file) return null;
  const file = path.resolve(path.dirname(CONFIG), card.photo.file);
  if (!fs.existsSync(file)) fail(`Couldn't find the photo at ${card.photo.file}`);

  const upright = await sharp(file).rotate().flatten({ background: '#000000' }).toBuffer();
  const { width, height } = await sharp(upright).metadata();

  // The layout expects a square photo, so crop to the largest square around the face.
  const side = Math.min(width, height);
  const left = Math.round(clamp(card.photo.focusX * width - side / 2, 0, width - side));
  const top = Math.round(clamp(card.photo.focusY * height - side / 2, 0, height - side));
  const square = await sharp(upright).extract({ left, top, width: side, height: side }).toBuffer();
  const focusX = (card.photo.focusX * width - left) / side;
  const focusY = (card.photo.focusY * height - top) / side;

  const edgeRows = Math.max(1, Math.round(side * 0.005));
  // stats() reads the input image and ignores any crop, so crop to a buffer first.
  const edge = await sharp(square)
    .extract({ left: 0, top: 0, width: side, height: edgeRows })
    .toBuffer();
  const { channels } = await sharp(edge).stats();
  const edgeColor = `#${channels.slice(0, 3)
    .map(({ mean }) => Math.round(mean).toString(16).padStart(2, '0'))
    .join('')}`;

  const page = await sharp(square)
    .resize(800, 800, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const cropSide = Math.round(side * 0.45);
  const contact = await sharp(square)
    .extract({
      left: Math.round(clamp(focusX * side - cropSide / 2, 0, side - cropSide)),
      top: Math.round(clamp(focusY * side - cropSide / 2, 0, side - cropSide)),
      width: cropSide,
      height: cropSide,
    })
    .resize(320, 320)
    .jpeg({ quality: 75 })
    .toBuffer();

  return { square, page, contact, edgeColor, focusY: Number(focusY.toFixed(4)) };
}

const escapeXml = escapeHtml;

function iconSvg(initials, size) {
  const cell = size / 8;
  const lines = Array.from({ length: 7 }, (_, index) => {
    const at = cell * (index + 1);
    return `<path d="M${at} 0V${size}M0 ${at}H${size}" stroke="#ffffff" stroke-opacity="0.1" stroke-width="${Math.max(1, size / 192)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${ACCENT}"/>${lines}
    <text x="50%" y="${size * 0.635}" text-anchor="middle" fill="#ffffff" font-family="Menlo, Consolas, monospace" font-size="${size * 0.38}">${escapeXml(initials)}</text>
  </svg>`;
}

function wrapText(value, maxChars) {
  const lines = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderOgImage(card, photo) {
  const WIDTH = 1200;
  const HEIGHT = 630;
  const textX = 694;
  const nameSize = card.name.length > 12 ? Math.max(44, Math.round(76 * 12 / card.name.length)) : 76;
  const orgLines = wrapText(card.organization, 34).slice(0, 2);
  const titleSize = Math.min(34, Math.floor(480 / (card.title.length * 0.6)));
  const panelHeight = 26 + 44 + nameSize + 62 + (orgLines.length ? 14 : 0) + orgLines.length * 42;
  let y = (HEIGHT - panelHeight) / 2 + 26;
  const row = (content, size, color, family, weight = 400) => (
    `<text x="${textX}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}">${escapeXml(content)}</text>`
  );
  const sans = 'Helvetica Neue, Arial, sans-serif';
  const mono = 'Menlo, Consolas, monospace';
  const rows = [row('// digital card', 26, ACCENT, mono)];
  y += 44 + nameSize * 0.8;
  rows.push(row(card.name, nameSize, '#16202a', sans, 700));
  y += 62;
  rows.push(row(card.title, titleSize, ACCENT, mono));
  if (orgLines.length) y += 14;
  for (const line of orgLines) {
    y += 42;
    rows.push(row(line, 30, '#57636f', sans));
  }
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <rect x="630" width="4" height="${HEIGHT}" fill="${ACCENT}"/>${rows.join('')}
  </svg>`;

  const portrait = photo
    ? await sharp(photo.square).resize(630, 630).toBuffer()
    : await sharp(Buffer.from(iconSvg(card.initials, 630))).png().toBuffer();

  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } })
    .composite([
      { input: portrait, left: 0, top: 0 },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();
}

function renderManifest(card) {
  return `${JSON.stringify({
    name: card.name,
    short_name: card.name,
    description: `${card.name}'s digital card`,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#f6f8fa',
    theme_color: '#ffffff',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2)}\n`;
}

async function main() {
  const card = loadCard();
  const photo = await preparePhoto(card);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const write = (name, contents) => fs.writeFileSync(path.join(OUT, name), contents);

  write('index.html', renderHtml(card, photo));
  fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(OUT, 'styles.css'));
  const headers = fs.readFileSync(path.join(SRC, '_headers'), 'utf8');
  write('_headers', headers.replace('__CONTACT_FILENAME__', contactFilename(card)));
  write('contact.vcf', renderVcard(card, photo?.contact));
  write('manifest.webmanifest', renderManifest(card));
  write('qr.svg', await QRCode.toString(card.url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  }));
  write('og-image.jpg', await renderOgImage(card, photo));
  if (photo) write('photo.jpg', photo.page);

  for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
    write(name, await sharp(Buffer.from(iconSvg(card.initials, size))).png().toBuffer());
  }

  const assets = ['./', 'styles.css', 'qr.svg', 'contact.vcf', 'manifest.webmanifest', 'favicon-32.png'];
  if (photo) assets.push('photo.jpg');
  const worker = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  write('sw.js', worker.replace('__ASSETS__', JSON.stringify(assets)));

  console.log(`Built ${card.name}'s card in ${path.relative(process.cwd(), OUT) || '.'}`);
  console.log(`The QR code points to ${card.url}`);
}

main().catch((error) => fail(error.stack));
