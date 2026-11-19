import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const base = '/bodyweight-pwa/'
const storageKey = 'bwfit:data:v1'
const testTime = Date.UTC(2026, 0, 1)
const server = process.env.WORKOUT_CHECK_URL
  ? null
  : await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
const url = process.env.WORKOUT_CHECK_URL ?? `http://127.0.0.1:${server.httpServer.address().port}${base}`
let browser

async function workout(name, items, check) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  try {
    await context.addInitScript(({ key, items }) => {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        history: [],
        settings: { onboarded: true, prepSeconds: 0, sound: false, voice: false, vibrate: false },
        customPlans: [{ id: 'regression', name: '測試訓練', hue: 160, description: '', items }],
      }))
    }, { key: storageKey, items })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    if (items.some((item) => item.seconds)) await page.clock.setFixedTime(testTime)
    await page.goto(new URL('#/workout/regression', url).href)
    await page.getByRole('button', { name: '開始', exact: true }).tap()
    await check(page)
    console.log(`PASS ${name}`)
  } finally {
    await context.close()
  }
}

const button = (page, name) => page.getByRole('button', { name, exact: true })
const stored = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey)

async function result(page, heading, sets, completed) {
  await page.getByRole('heading', { name: heading, exact: true }).waitFor()
  await page.waitForFunction(({ key, sets }) => JSON.parse(localStorage.getItem(key)).history.length === (sets ? 1 : 0), { key: storageKey, sets })
  const data = await stored(page)
  if (sets) {
    assert.equal(data.history[0].sets, sets)
    assert.equal(data.history[0].completed, completed)
  }
  return data
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--enable-unsafe-swiftshader'],
  })
  const rep = { exerciseId: 'pushup', sets: 1, reps: 10, rest: 0 }
  const dumbbell = { exerciseId: 'dbgoblet', sets: 2, reps: 8, rest: 0 }
  const timed = { exerciseId: 'dbfarmer', sets: 1, seconds: 2, rest: 0 }
  const cases = [
    ['完成後跳過末組，只儲存已完成組數', [{ ...rep, sets: 2 }], async (page) => {
      await button(page, '完成這組').tap()
      await page.getByRole('group', { name: '目前訓練步驟' }).getByText('第 2 / 2 組').waitFor()
      await button(page, '跳過').tap()
      await result(page, '訓練結束', 1, false)
      await button(page, '查看紀錄').tap()
      await page.reload()
      assert.equal((await stored(page)).history[0].reps, 10)
    }],
    ['全跳過時不新增紀錄', [rep], async (page) => {
      await page.getByRole('heading', { name: '伏地挺身' }).waitFor()
      await button(page, '跳過').tap()
      await result(page, '訓練結束', 0, false)
    }],
    ['返回上一組會撤銷該組的啞鈴重量', [dumbbell], async (page) => {
      const step = page.getByRole('group', { name: '目前訓練步驟' })
      const reps = step.getByRole('spinbutton', { name: '這組實際完成次數' })
      await reps.fill('8')
      await step.getByRole('button', { name: '完成這組' }).tap()
      await step.getByText('第 2 / 2 組').waitFor()
      await button(page, '上一個').tap()
      await step.getByText('第 1 / 2 組').waitFor()
      assert.equal(await reps.inputValue(), '')
      await button(page, '跳過').tap()
      await step.getByText('第 2 / 2 組').waitFor()
      await reps.fill('7')
      await step.getByRole('button', { name: '完成這組' }).tap()
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).history.length === 1, storageKey)
      const [weight] = (await stored(page)).weights.dbgoblet
      assert.deepEqual(weight.kg, [10])
      assert.deepEqual(weight.setReps, [7])
      assert.equal(weight.done, false)
      await result(page, '訓練結束', 1, false)
    }],
    ['同一組連點兩下只記一組', [rep], async (page) => {
      await button(page, '完成這組').evaluate((element) => {
        element.click()
        element.click()
      })
      await result(page, '訓練完成！', 1, true)
      await page.reload()
      assert.equal((await stored(page)).history.length, 1)
    }],
    ['計時組暫停不計時，繼續後自動儲存', [timed], async (page) => {
      await button(page, '暫停').tap()
      await page.getByRole('heading', { name: '已暫停' }).waitFor()
      await page.clock.setFixedTime(testTime + 3000)
      assert.equal((await stored(page)).history.length, 0)
      await page.getByText('點一下任意處繼續').tap()
      await button(page, '暫停').waitFor()
      await page.clock.setFixedTime(testTime + 5000)
      const data = await result(page, '訓練完成！', 1, true)
      assert.equal(data.history[0].activeSeconds, 2)
      assert.deepEqual(data.weights.dbfarmer[0].setReps, [2])
    }],
  ]
  const failures = []
  for (const [name, items, check] of cases) {
    try {
      await workout(name, items, check)
    } catch (error) {
      failures.push(new Error(name, { cause: error }))
    }
  }
  if (failures.length) throw new AggregateError(failures, 'Workout regression checks failed.')
} finally {
  await browser?.close()
  if (server) await new Promise((resolve) => server.httpServer.close(resolve))
}
