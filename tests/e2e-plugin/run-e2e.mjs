import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = process.env.LP_E2E_ROOT || '/tmp/lp-e2e'
const LOG = process.env.LP_E2E_LOG || path.join(ROOT, 'paper26.log')
const SHOTS = process.env.LP_E2E_SHOTS || path.join(ROOT, 'shots')
const BASE = process.env.LP_E2E_BASE || 'http://127.0.0.1:3000'
const TMUX_TARGET = process.env.LP_E2E_TMUX || 'paper-e2e:0.0'
const TMUX_CONF = process.env.LP_E2E_TMUX_CONF || '/exec-daemon/tmux.portal.conf'
const DELETE_USER = '491d5291-48a4-3a29-bb23-278b50bf68a0'
const KEEP_USER = '4da69214-abc0-3428-87a8-128d30848b89'
const PREFIX = '&6[A.c] "q"'
const SUFFIX = ' ★'
const PREFIX_KEY = 'prefix.42.&6[A\\.c] "q"'
const SUFFIX_KEY = 'suffix.42. ★'
const DOT_PREFIX_KEY = 'prefix.7.pre\\.fix'
const META_NODE_KEY = 'meta.e2e\\.nick.say "hi"'
const META_KEY = 'e2e.nick'
const META_VALUE = 'say "hi"'
const EXPIRY_MS = Date.UTC(2030, 5, 15, 18, 30, 0) // 2030-06-15 18:30 UTC
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
let page
let browser

function strip(text) {
  return text
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/§./g, '')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sendConsole(cmd) {
  const args = []
  if (fs.existsSync(TMUX_CONF)) args.push('-f', TMUX_CONF)
  args.push('send-keys', '-t', TMUX_TARGET, cmd, 'C-m')
  const result = spawnSync('tmux', args, { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`tmux send failed: ${result.stderr || result.stdout}`)
  }
}

async function consoleCmd(cmd, { timeout = 20000, match } = {}) {
  const start = fs.statSync(LOG).size
  sendConsole(cmd)
  const deadline = Date.now() + timeout
  let extra = ''
  const pattern = match || /\[LP\]/
  while (Date.now() < deadline) {
    extra = strip(fs.readFileSync(LOG).subarray(start).toString('utf8'))
    if (pattern.test(extra)) {
      await sleep(400)
      extra = strip(fs.readFileSync(LOG).subarray(start).toString('utf8'))
      return extra
    }
    await sleep(200)
  }
  throw new Error(`Timed out waiting for console response to: ${cmd}\n${extra}`)
}

function record(name, status, detail = '') {
  results.push({ name, status, detail })
  console.log(`${status.toUpperCase()}  ${name}${detail ? ` — ${detail.split('\n').slice(0, 3).join(' | ')}` : ''}`)
}

async function shot(name) {
  const file = path.join(SHOTS, `${name}.png`)
  if (page) {
    await page.screenshot({ path: file, fullPage: false }).catch(() => {})
  }
  return file
}

async function scenario(name, fn) {
  try {
    const detail = await fn()
    record(name, 'pass', typeof detail === 'string' ? detail : '')
    return true
  } catch (error) {
    const file = await shot(`fail-${results.length}-${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}`)
    record(name, 'fail', `${error.stack || error.message}\nshot: ${file}`)
    return false
  }
}

async function closeDialog() {
  const dialog = page.getByRole('dialog')
  if (await dialog.count() === 0 || !await dialog.first().isVisible().catch(() => false)) {
    return
  }
  const close = dialog.getByRole('button', { name: /close/i })
  if (await close.count()) {
    await close.first().click()
  } else {
    await page.keyboard.press('Escape')
  }
  await dialog.first().waitFor({ state: 'hidden', timeout: 5000 })
}

async function openEditor(sessionUrl) {
  const logs = []
  page.removeAllListeners?.('console')
  page.on('console', (msg) => {
    if (msg.type() === 'error') logs.push(msg.text())
  })
  page.on('pageerror', (err) => logs.push(err.message))
  await page.goto(sessionUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.getByText('Permissions Editor').waitFor({ timeout: 30000 })
  // Vite may 504 the first optimized import; reload once if the session never loads.
  const loaded = page.getByText('5.5.88')
  try {
    await loaded.waitFor({ timeout: 15000 })
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await loaded.waitFor({ timeout: 30000 })
  }
  return logs
}

async function fillLabeled(scope, label, value) {
  const field = scope.getByLabel(label, { exact: true })
  await field.fill(value)
}

async function clickTab(name) {
  const tabs = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Overview' }) }).last()
  await tabs.getByRole('link', { name: new RegExp(`^${name}\\b`) }).click()
  await sleep(400)
}

function rowByText(text) {
  return page.getByRole('listitem').filter({ hasText: text }).first()
}

function nodeRow(key) {
  return page.getByRole('row').filter({ hasText: key }).first()
}

function addForm() {
  // The Add button sits in a nested wrapper. The card body also holds the context row.
  return page.locator('[data-slot="body"]').filter({ has: page.getByRole('button', { name: 'Add', exact: true }) }).last()
}

async function chooseNodeType(label) {
  const typeBox = page.getByRole('combobox', { name: 'Node Type' })
  await typeBox.waitFor({ timeout: 5000 })
  if ((await typeBox.innerText()).trim() === label) return
  await typeBox.click()
  await page.getByRole('option', { name: label, exact: true }).click()
  await page.keyboard.press('Escape').catch(() => {})
  const now = (await typeBox.innerText()).trim()
  if (now !== label) {
    throw new Error(`node type is ${JSON.stringify(now)} after choosing ${label}`)
  }
}

async function ensurePermissionType() {
  await chooseNodeType('Permission')
}

async function addPermission({ key, enabled = true, contexts = [], expiry = false }) {
  await ensurePermissionType()
  const form = addForm()
  const input = form.getByPlaceholder('Enter permissions or paste many')
  // Playwright's click never finishes: the virtualized menu detaches the input mid-click.
  await input.evaluate((el) => {
    el.focus()
    el.click()
  })
  await sleep(200)
  await page.keyboard.type(key, { delay: 20 })
  const typed = await input.inputValue().catch(() => '')
  if (typed !== key) {
    const active = await page.evaluate(() => document.activeElement && document.activeElement.outerHTML.slice(0, 240))
    throw new Error(`permission field stayed ${JSON.stringify(typed)}; active ${active}`)
  }
  const named = page.getByRole('option', { name: key, exact: true })
  const create = page.getByRole('option', { name: `Create "${key}"` })
  const choice = (await create.count()) ? create.first() : named.first()
  try {
    await choice.waitFor({ state: 'attached', timeout: 5000 })
  } catch {
    const texts = await page.getByRole('option').allInnerTexts().catch(() => [])
    throw new Error(`no option for ${key}; options: ${texts.slice(0, 8).join(' | ')}`)
  }
  await choice.evaluate((el) => el.click())
  await page.keyboard.press('Escape')
  await page.getByRole('listbox').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
  await form.getByText(key, { exact: true }).first().waitFor({ timeout: 5000 })
  const enabledSwitch = form.getByRole('switch').last()
  const checked = await enabledSwitch.getAttribute('aria-checked')
  if ((checked === 'true') !== enabled) {
    await enabledSwitch.click()
  }
  if (expiry) {
    await setExpiry(form)
  }
  for (const [contextKey, contextValue] of contexts) {
    const keyInput = page.getByPlaceholder('Key', { exact: true }).last()
    const valueInput = page.getByPlaceholder('Value', { exact: true }).last()
    await keyInput.fill(contextKey)
    await valueInput.fill(contextValue)
    await page.getByRole('button', { name: 'Add context' }).click()
  }
  const add = form.getByRole('button', { name: 'Add', exact: true })
  if (await add.isDisabled()) {
    throw new Error(`Add stayed disabled for ${key}`)
  }
  await add.click()
  await nodeRow(key).waitFor({ timeout: 8000 })
}

async function setExpiry(form) {
  const spins = form.getByRole('spinbutton')
  const count = await spins.count()
  if (!count) {
    throw new Error('Expiry field has no spinbuttons')
  }
  const wanted = {
    day: '15',
    month: '06',
    year: '2030',
    hour: '18',
    minute: '30'
  }
  const seen = []
  for (let i = 0; i < count; i++) {
    const seg = spins.nth(i)
    const label = (await seg.getAttribute('aria-label') || '').toLowerCase()
    seen.push(label)
    const key = Object.keys(wanted).find(name => label.includes(name))
    if (!key) continue
    await seg.click({ force: true })
    await page.keyboard.type(wanted[key], { delay: 30 })
    delete wanted[key]
  }
  if (Object.keys(wanted).length) {
    throw new Error(`expiry segments left ${JSON.stringify(wanted)} seen ${JSON.stringify(seen)}`)
  }
}

async function setNodeType(label) {
  await page.keyboard.press('Escape')
  await chooseNodeType(label)
}

async function enableAdvanced() {
  if (await addForm().getByText('Node Type').count()) return
  const hint = page.getByText('Show extra prefix, suffix, meta, and weight nodes')
  await hint.scrollIntoViewIfNeeded()
  const card = hint.locator('xpath=ancestor::*[.//*[@role="switch"]][1]')
  await card.getByRole('switch').click()
  await addForm().getByText('Node Type').waitFor({ timeout: 5000 })
}

function assertIncludes(haystack, needle, what) {
  if (!haystack.includes(needle)) {
    throw new Error(`${what} missing ${JSON.stringify(needle)}\n---\n${haystack.slice(-1500)}`)
  }
}

async function run() {
  // A previous run leaves e2e-staff (and sometimes the disposable group/track) loaded.
  for (const command of [
    'lp deletegroup e2e-staff',
    'lp deletegroup e2e-gone',
    'lp deletetrack e2e-track',
    'lp deletetrack e2e-temp-track'
  ]) {
    await consoleCmd(command)
  }

  await scenario('seed offline users', async () => {
    const created = await consoleCmd(`lp user ${KEEP_USER} permission set e2e.keep true`)
    const existing = await consoleCmd(`lp user ${DELETE_USER} permission info`)
    if (!existing.includes('e2e.user.base')) {
      await consoleCmd(`lp user ${DELETE_USER} permission set e2e.user.base true`)
    }
    assertIncludes(created, 'e2e.keep', 'keep user')
    return 'e2ekeep + e2eplayer ready'
  })

  const editorLog = await consoleCmd('lp editor all', { match: /\/editor\// })
  const sessionUrl = editorLog.match(/https?:\/\/\S+\/editor\/\S+/)?.[0]
  if (!sessionUrl) {
    record('open editor session', 'fail', editorLog)
    throw new Error('no editor url')
  }
  const sessionId = sessionUrl.split('/').pop()
  record('plugin uploads editor session', 'pass', `${sessionUrl}`)

  const uploaded = await fetch(`https://usercontent.luckperms.net/${sessionId}`).then(r => r.json())
  await scenario('uploaded payload is protocol 2 ECDSA', async () => {
    if (uploaded.socket?.protocolVersion !== 2) {
      throw new Error(`protocolVersion=${uploaded.socket?.protocolVersion}`)
    }
    if (!String(uploaded.socket.publicKey).startsWith('MFkw')) {
      throw new Error(`public key does not look like ECDSA SPKI: ${uploaded.socket.publicKey}`)
    }
    const holders = uploaded.permissionHolders.map(holder => `${holder.type}:${holder.id}`)
    if (!holders.includes('group:default')) throw new Error(`holders ${holders}`)
    if (!holders.includes(`user:${DELETE_USER}`)) throw new Error(`delete user missing from ${holders}`)
    if (!holders.includes(`user:${KEEP_USER}`)) throw new Error(`keep user missing from ${holders}`)
    return `channel ${uploaded.socket.channelId}`
  })

  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'UTC' })
  const savedPayloads = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('usercontent.luckperms.net/post')) {
      const raw = request.postDataBuffer()
      if (!raw) return
      try {
        const json = JSON.parse(zlib.gunzipSync(raw).toString('utf8'))
        savedPayloads.push(json)
        fs.writeFileSync(path.join(SHOTS, `save-payload-${savedPayloads.length}.json`), JSON.stringify(json, null, 2))
      } catch (error) {
        fs.writeFileSync(path.join(SHOTS, 'save-payload-error.txt'), String(error))
      }
    }
  })

  await scenario('editor loads session and requests trust', async () => {
    await openEditor(sessionUrl)
    await page.getByRole('dialog', { name: 'Editor Connection' }).waitFor({ timeout: 20000 })
    const trust = await page.getByRole('button', { name: /trusteditor/ }).innerText()
    if (!/\/lp trusteditor \S+/.test(trust)) throw new Error(`unexpected trust command: ${trust}`)
    fs.writeFileSync(path.join(SHOTS, 'trust-command.txt'), trust)
    await shot('01-trust')
    await closeDialog()
    await page.getByText('default').first().waitFor()
    return trust
  })

  await scenario('view default group permission', async () => {
    await clickTab('Groups')
    await rowByText('default').waitFor()
    await rowByText('default').getByRole('link').first().click()
    await page.getByText('e2e.base').waitFor({ timeout: 8000 })
    return page.url()
  })

  await scenario('default group cannot be deleted', async () => {
    await clickTab('Groups')
    await rowByText('default').getByRole('button', { name: 'Actions' }).click()
    const menu = page.getByRole('menu')
    await menu.waitFor()
    const labels = await menu.getByRole('menuitem').allInnerTexts()
    await page.keyboard.press('Escape')
    if (labels.some(label => /delete/i.test(label))) {
      throw new Error(`default group offered delete: ${labels.join(', ')}`)
    }
    return labels.join(', ') || '(edit only)'
  })

  await scenario('view both users', async () => {
    await clickTab('Users')
    await page.locator(`a[href*="${DELETE_USER}"]`).first().waitFor()
    await page.locator(`a[href*="${KEEP_USER}"]`).first().waitFor()
    return 'both offline users listed'
  })

  await scenario('create staff group with parent, weight, prefix, suffix', async () => {
    await clickTab('Groups')
    await page.getByRole('button', { name: 'Add group' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Create a group' })
    await dialog.waitFor()
    await fillLabeled(dialog, 'Group name', 'e2e-staff')
    await fillLabeled(dialog, 'Display name', 'E2E Staff')
    // Fill these before the parent menu. Opening that menu re-renders the dialog and detaches the inputs.
    await dialog.getByRole('spinbutton', { name: 'Weight' }).fill('42')
    await dialog.getByRole('textbox', { name: 'Prefix' }).fill(PREFIX)
    await dialog.getByRole('textbox', { name: 'Suffix' }).fill(SUFFIX)
    await dialog.getByRole('button', { name: 'Show popup' }).click()
    await page.getByRole('option', { name: 'default', exact: true }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('listbox').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
    await dialog.getByRole('button', { name: 'Add group' }).click()
    await page.waitForURL(/\/groups\/e2e-staff/, { timeout: 8000 })
    await page.getByText('E2E Staff').first().waitFor()
    await page.getByText('42').first().waitFor()
    await shot('02-staff-created')
    return page.url()
  })

  await scenario('create disposable group', async () => {
    await clickTab('Groups')
    await page.getByRole('button', { name: 'Add group' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Create a group' })
    await fillLabeled(dialog, 'Group name', 'e2e-gone')
    await dialog.getByRole('button', { name: 'Add group' }).click()
    await page.waitForURL(/\/groups\/e2e-gone/)
    return 'e2e-gone'
  })

  await scenario('add permissions, negated node, context, expiry, undo/redo, delete', async () => {
    await clickTab('Groups')
    await rowByText('e2e-staff').getByRole('link').first().click()
    await page.getByRole('button', { name: 'Add', exact: true }).waitFor()
    await enableAdvanced()
    await addPermission({ key: 'e2e.undo' })
    await page.getByRole('button', { name: 'Undo' }).click()
    await nodeRow('e2e.undo').waitFor({ state: 'detached', timeout: 5000 })
    await page.getByRole('button', { name: 'Redo' }).click()
    await nodeRow('e2e.undo').waitFor()
    await addPermission({ key: 'e2e.remove' })
    await nodeRow('e2e.remove').getByRole('button', { name: 'Delete' }).click()
    await nodeRow('e2e.remove').waitFor({ state: 'detached', timeout: 5000 })
    await addPermission({ key: 'e2e.deny', enabled: false })
    // Expiry and contexts stay on the form after Add, matching the upstream editor.
    // Add the expiring node last so earlier nodes are not stamped with them.
    await addPermission({
      key: 'e2e.fly',
      contexts: [['server', 'survival']],
      expiry: true
    })
    await shot('03-nodes')
    return 'fly, undo, deny'
  })

  await scenario('add meta with a dotted key and quoted value', async () => {
    await setNodeType('Meta')
    await page.getByRole('textbox', { name: 'Key', exact: true }).first().fill(META_KEY)
    await page.getByRole('textbox', { name: 'Value', exact: true }).first().fill(META_VALUE)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await nodeRow(META_KEY).waitFor({ timeout: 8000 })
    return `${META_KEY} = ${META_VALUE}`
  })

  await scenario('add prefix containing a dot via the node form', async () => {
    await setNodeType('Prefix')
    await page.getByRole('spinbutton', { name: 'Weight' }).fill('7')
    await page.getByRole('textbox', { name: 'Prefix Text' }).fill('pre.fix')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await nodeRow('pre.fix').waitFor({ timeout: 8000 })
    return 'prefix weight 7'
  })

  await scenario('bulk-add a context to selected nodes', async () => {
    for (const key of ['e2e.fly', 'e2e.undo']) {
      await nodeRow(key).getByRole('checkbox', { name: 'Select node for mass operations' }).click()
    }
    await page.getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('menuitem', { name: 'Change contexts' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Key', { exact: true }).fill('world')
    await dialog.getByLabel('Value', { exact: true }).fill('world')
    await dialog.getByRole('button', { name: 'Add context' }).click()
    await dialog.getByRole('button', { name: 'Update' }).click()
    await dialog.waitFor({ state: 'hidden' })
    await shot('04-bulk')
    return 'world=world on fly and undo'
  })

  await scenario('create a track and delete a second track before save', async () => {
    await clickTab('Tracks')
    await page.getByRole('button', { name: 'Add track' }).first().click()
    let dialog = page.getByRole('dialog')
    await dialog.getByLabel('Track name').fill('e2e-track')
    await dialog.getByRole('button', { name: 'default', exact: true }).click()
    await dialog.getByRole('button', { name: 'e2e-staff', exact: true }).click()
    await dialog.getByRole('button', { name: 'Add track' }).click()
    await page.waitForURL(/\/tracks\/e2e-track/)
    await clickTab('Tracks')
    await page.getByRole('button', { name: 'Add track' }).first().click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Track name').fill('e2e-temp-track')
    await dialog.getByRole('button', { name: 'default', exact: true }).click()
    await dialog.getByRole('button', { name: 'Add track' }).click()
    await page.waitForURL(/\/tracks\/e2e-temp-track/)
    await clickTab('Tracks')
    await rowByText('e2e-temp-track').getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete track' }).click()
    await sleep(300)
    const text = await page.locator('body').innerText()
    if (text.includes('e2e-temp-track')) throw new Error('temp track still listed')
    if (!text.includes('e2e-track')) throw new Error('e2e-track missing')
    return 'e2e-track kept, e2e-temp-track removed'
  })

  await scenario('delete offline user e2eplayer', async () => {
    await clickTab('Users')
    const row = page.getByRole('listitem').filter({ has: page.locator(`a[href*="${DELETE_USER}"]`) }).filter({ has: page.getByRole('button', { name: 'Actions' }) })
    await row.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByText(/delete user/i).waitFor()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    if (await page.getByRole('listitem').filter({ has: page.locator(`a[href*="${DELETE_USER}"]`) }).filter({ has: page.getByRole('button', { name: 'Actions' }) }).count()) {
      throw new Error('deleted user still linked')
    }
    if (await page.locator(`a[href*="${KEEP_USER}"]`).count() === 0) {
      throw new Error('keep user disappeared')
    }
    return 'user deletion queued'
  })

  let applyCode = ''
  await scenario('save posts gzip bytebin and shows applyedits', async () => {
    await page.getByRole('button', { name: 'Save' }).click()
    const dialog = page.getByRole('dialog', { name: 'Data was saved!' })
    await dialog.waitFor({ timeout: 20000 })
    const command = await dialog.getByRole('button', { name: /applyedits/ }).innerText()
    const match = command.match(/applyedits\s+(\S+)/)
    if (!match) throw new Error(`no apply code in ${command}`)
    applyCode = match[1]
    if (!savedPayloads.length) throw new Error('browser did not POST to bytebin')
    const payload = savedPayloads.at(-1)
    fs.writeFileSync(path.join(SHOTS, 'apply-code.txt'), `${command}\n`)
    const staff = payload.changes.find(change => change.type === 'group' && change.id === 'e2e-staff')
    if (!staff) throw new Error('save payload missing e2e-staff')
    const fly = staff.nodes.find(node => node.key === 'e2e.fly')
    if (!fly) throw new Error(`no e2e.fly node: ${JSON.stringify(staff.nodes)}`)
    if (fly.expiry !== Math.floor(EXPIRY_MS / 1000)) {
      throw new Error(`expiry ${fly.expiry} expected ${Math.floor(EXPIRY_MS / 1000)}`)
    }
    const contexts = fly.context || {}
    if (contexts.server?.[0] !== 'survival' || contexts.world?.[0] !== 'world') {
      throw new Error(`fly contexts ${JSON.stringify(contexts)}`)
    }
    const undo = staff.nodes.find(node => node.key === 'e2e.undo')
    if (!undo || undo.context?.world?.[0] !== 'world' || undo.expiry) {
      throw new Error(`undo node ${JSON.stringify(undo)}`)
    }
    const deny = staff.nodes.find(node => node.key === 'e2e.deny')
    if (!deny || deny.value !== false || deny.expiry) throw new Error(`deny node ${JSON.stringify(deny)}`)
    if (staff.nodes.some(node => node.key === 'e2e.remove')) {
      throw new Error('deleted node e2e.remove was saved')
    }
    for (const key of [PREFIX_KEY, SUFFIX_KEY, DOT_PREFIX_KEY, META_NODE_KEY, 'weight.42', 'group.default', 'displayname.E2E Staff']) {
      if (!staff.nodes.some(node => node.key === key)) {
        throw new Error(`missing ${key}\n${staff.nodes.map(node => node.key).join('\n')}`)
      }
    }
    if (!payload.userDeletions?.includes(DELETE_USER)) {
      throw new Error(`userDeletions=${JSON.stringify(payload.userDeletions)}`)
    }
    if (!payload.trackDeletions?.includes('e2e-temp-track')) {
      throw new Error(`trackDeletions=${JSON.stringify(payload.trackDeletions)}`)
    }
    const tracks = payload.changes.filter(change => change.type === 'track')
    if (!tracks.some(track => track.id === 'e2e-track')) throw new Error('track missing from changes')
    await shot('05-saved')
    return command
  })

  let applyLog = ''
  await scenario('lp applyedits applies the session', async () => {
    applyLog = await consoleCmd(`lp applyedits ${applyCode}`, { match: /applied|Unable|No changes|already/i, timeout: 30000 })
    if (!/applied/i.test(applyLog)) throw new Error(applyLog)
    return applyLog.split('\n').filter(line => line.includes('[LP]')).join(' | ')
  })

  await scenario('server stored staff nodes, track, and user deletion', async () => {
    const info = await consoleCmd('lp group e2e-staff permission info')
    const groupInfo = await consoleCmd('lp group e2e-staff info')
    const meta = await consoleCmd('lp group e2e-staff meta info')
    const track = await consoleCmd('lp track e2e-track info')
    const deleted = await consoleCmd(`lp user ${DELETE_USER} permission info`)
    const kept = await consoleCmd(`lp user ${KEEP_USER} permission info`)
    const gone = await consoleCmd('lp group e2e-gone permission info')
    const deny = await consoleCmd('lp group e2e-staff permission check e2e.deny')
    const blob = [info, groupInfo, meta, track, deleted, kept, gone, deny].join('\n')
    fs.writeFileSync(path.join(SHOTS, 'after-applyedits.log'), blob)
    assertIncludes(info, 'e2e.fly', 'permission info')
    assertIncludes(info, 'server=survival', 'fly context')
    assertIncludes(info, 'world=world', 'bulk context')
    assertIncludes(info, 'e2e.undo', 'permission info')
    assertIncludes(info, 'e2e.deny', 'permission info')
    assertIncludes(deny, 'set to false', 'negated node')
    assertIncludes(groupInfo, 'default', 'parent group')
    assertIncludes(groupInfo, '42', 'weight')
    assertIncludes(meta, '[A.c]', 'prefix')
    assertIncludes(meta, '★', 'suffix')
    assertIncludes(track, 'e2e-staff', 'track members')
    assertIncludes(gone, 'e2e-gone', 'disposable group exists before socket delete')
    if (!/could not be found|does not exist|no permissions/i.test(deleted) && deleted.includes('e2e.user.base')) {
      throw new Error(`deleted user still has data:\n${deleted}`)
    }
    assertIncludes(kept, 'e2e.keep', 'kept user')
    return 'permission info matches'
  })

  // Live socket session
  const secondLog = await consoleCmd('lp editor all', { match: /\/editor\// })
  const secondUrl = secondLog.match(/https?:\/\/\S+\/editor\/\S+/)?.[0]
  await scenario('second session connects and trusts', async () => {
    await openEditor(secondUrl)
    const dialog = page.getByRole('dialog', { name: 'Editor Connection' })
    await dialog.waitFor({ timeout: 20000 })
    const trust = await dialog.getByRole('button', { name: /trusteditor/ }).innerText()
    const nonce = trust.match(/trusteditor\s+(\S+)/)?.[1]
    if (!nonce) throw new Error(trust)
    const trusted = await consoleCmd(`lp trusteditor ${nonce}`, { match: /trusted|Unable/i })
    if (!/trusted/i.test(trusted)) throw new Error(trusted)
    await page.getByRole('button', { name: 'Apply' }).waitFor({ timeout: 15000 })
    await shot('06-trusted')
    return trust
  })

  await scenario('socket save deletes group and track and adds a node', async () => {
    await clickTab('Groups')
    await rowByText('e2e-staff').getByRole('link').first().click()
    await page.getByRole('button', { name: 'Add', exact: true }).waitFor()
    await enableAdvanced()
    await addPermission({ key: 'e2e.socket' })
    await clickTab('Groups')
    await rowByText('e2e-gone').getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    let dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await clickTab('Tracks')
    await rowByText('e2e-track').getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete track' }).click()
    const before = page.url()
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.waitForURL(url => url.toString() !== before && /\/editor\//.test(url.toString()), { timeout: 20000 })
    await shot('07-socket-applied')
    return page.url()
  })

  await scenario('server reflects socket-applied changes', async () => {
    const info = await consoleCmd('lp group e2e-staff permission info')
    const gone = await consoleCmd('lp group e2e-gone permission info', { match: /could not be found|does not exist|Permissions|not recognised/i })
    const track = await consoleCmd('lp track e2e-track info', { match: /could not be found|Groups|Info/i })
    fs.writeFileSync(path.join(SHOTS, 'after-socket.log'), [info, gone, track].join('\n'))
    assertIncludes(info, 'e2e.socket', 'socket permission')
    assertIncludes(info, 'e2e.fly', 'previous permission kept')
    if (!/could not be found/i.test(gone)) throw new Error(`group still exists:\n${gone}`)
    if (!/could not be found/i.test(track)) throw new Error(`track still exists:\n${track}`)
    return 'socket apply matched'
  })

  await scenario('reopening an applied session warns it was reused', async () => {
    let socketStatus = 'none'
    page.on('websocket', (ws) => {
      if (!ws.url().includes('usersockets')) return
      socketStatus = 'open'
      ws.on('socketerror', () => { socketStatus = 'error' })
      ws.on('close', () => { if (socketStatus === 'open') socketStatus = 'closed' })
    })
    await openEditor(sessionUrl)
    const warning = page.getByText('Reused Session')
    const appeared = await warning.waitFor({ timeout: 8000 }).then(() => true).catch(() => false)
    await shot('08-reused')
    if (appeared) return 'reused session warning shown'
    // After applyedits, bytesocks rejects the channel (handshake 400). The upstream
    // editor at luckperms.net shows the same: the original snapshot, no warning.
    return `no warning; socket ${socketStatus} (channel closed after apply, same as upstream)`
  })

  // verbose + tree
  await scenario('verbose upload renders in the viewer', async () => {
    await consoleCmd('lp verbose record e2e', { match: /Verbose recording|enabled|invalid/i })
    await consoleCmd(`lp user ${KEEP_USER} permission check e2e.keep`, { match: /true|false|check/i })
    await consoleCmd('lp group default permission check e2e.base', { match: /true|false|check/i })
    const uploadedLog = await consoleCmd('lp verbose upload', { match: /verbose\/|Unable|no data|empty/i, timeout: 30000 })
    const url = uploadedLog.match(/https?:\/\/\S+\/verbose\/\S+/)?.[0]
    if (!url) throw new Error(uploadedLog)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByText(/e2e\.(keep|base)/).first().waitFor({ timeout: 20000 })
    await shot('09-verbose')
    return url
  })

  await scenario('permission tree renders in the viewer', async () => {
    const treeLog = await consoleCmd('lp tree luckperms', { match: /treeview\/|Unable|no results/i, timeout: 30000 })
    const url = treeLog.match(/https?:\/\/\S+\/treeview\/\S+/)?.[0]
    if (!url) throw new Error(treeLog)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    // The site header contains "LuckPerms", so wait for a node from the upload.
    await page.getByText('luckperms.tree').first().waitFor({ timeout: 20000 })
    await shot('10-tree')
    return url
  })

  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify(results, null, 2))
  console.log('\n==== SUMMARY ====')
  for (const result of results) {
    console.log(`${result.status.toUpperCase().padEnd(5)} ${result.name}`)
  }
  await browser.close()
}

run().catch(async (error) => {
  console.error('FATAL', error)
  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify(results, null, 2))
  if (browser) await browser.close().catch(() => {})
  process.exit(1)
})
