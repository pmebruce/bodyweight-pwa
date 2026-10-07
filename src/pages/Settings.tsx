import { motion } from 'framer-motion'
import { useRef, useState, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import { PageHeader, Stepper, Toggle, toast, useConfirm } from '../components/ui'
import Icon from '../components/Icon'
import { beep, speak, unlockMedia, wakeLockSupported } from '../lib/cues'
import { pad } from '../lib/format'
import type { AppData } from '../types'

function Row({ icon, title, desc, children }: { icon: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="set-row">
      <span className="set-icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="set-text">
        <span>{title}</span>
        {desc && <small className="muted">{desc}</small>}
      </div>
      <div className="set-ctrl">{children}</div>
    </div>
  )
}

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

export default function Settings() {
  const { data, updateSettings, replaceAll, clearAll } = useStore()
  const s = data.settings
  const [confirm, confirmEl] = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(s.nickname)

  const exportData = async () => {
    const d = new Date()
    const fname = `徒手健身備份-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`
    const json = JSON.stringify(data, null, 2)
    const file = new File([json], fname, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '徒手健身備份' })
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast('已匯出備份檔')
  }

  const importData = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text()) as AppData
      if (!parsed || (!Array.isArray(parsed.history) && !Array.isArray(parsed.customPlans))) throw new Error('bad')
      const ok = await confirm({
        title: '匯入資料？',
        message: `檔案內有 ${parsed.history?.length ?? 0} 筆紀錄、${parsed.customPlans?.length ?? 0} 個自訂計畫。匯入後會取代目前的資料。`,
        confirmText: '匯入',
      })
      if (!ok) return
      replaceAll(parsed)
      setName(parsed.settings?.nickname ?? s.nickname)
      toast('匯入成功 ✅')
    } catch {
      toast('檔案格式不正確')
    }
  }

  const clear = async () => {
    if (await confirm({ title: '清除所有資料？', message: '所有訓練紀錄、自訂計畫與設定都會被刪除，無法復原。建議先匯出備份。', confirmText: '全部清除', danger: true })) {
      clearAll()
      setName('Bruce')
      toast('已清除所有資料')
    }
  }

  return (
    <div className="page">
      <PageHeader title="設定" />

      <h2 className="section-title">個人</h2>
      <div className="set-group">
        <Row icon="user" title="暱稱">
          <input className="set-input" value={name} maxLength={12} placeholder="你的名字" onChange={(e) => setName(e.target.value)} onBlur={() => updateSettings({ nickname: name.trim() })} />
        </Row>
        <Row icon="target" title="每週目標" desc="每週想訓練幾次">
          <Stepper value={s.weeklyGoal} min={1} max={14} onChange={(v) => updateSettings({ weeklyGoal: v })} suffix="次" />
        </Row>
      </div>

      <h2 className="section-title">訓練</h2>
      <div className="set-group">
        <Row icon="rest" title="預設休息時間" desc="新增動作時的休息秒數">
          <Stepper value={s.defaultRest} min={0} max={180} step={5} onChange={(v) => updateSettings({ defaultRest: v })} suffix="秒" />
        </Row>
        <Row icon="clock" title="開始前倒數">
          <Stepper value={s.prepSeconds} min={0} max={30} step={1} onChange={(v) => updateSettings({ prepSeconds: v })} suffix="秒" />
        </Row>
      </div>

      <h2 className="section-title">提示</h2>
      <div className="set-group">
        <Row icon="voice" title="語音提示" desc="中文語音播報動作與休息">
          <Toggle
            checked={s.voice}
            label="語音提示"
            onChange={(v) => {
              updateSettings({ voice: v })
              if (v) {
                unlockMedia()
                setTimeout(() => speak('語音提示已開啟'), 50)
              }
            }}
          />
        </Row>
        <Row icon="sound" title="提示音效" desc="倒數嗶聲與完成音效">
          <Toggle
            checked={s.sound}
            label="提示音效"
            onChange={(v) => {
              updateSettings({ sound: v })
              if (v) {
                unlockMedia()
                setTimeout(() => beep(880, 150), 30)
              }
            }}
          />
        </Row>
        <Row icon="phone" title="震動回饋" desc="iPhone Safari 目前不支援，Android 可用">
          <Toggle checked={s.vibrate} label="震動回饋" onChange={(v) => updateSettings({ vibrate: v })} />
        </Row>
      </div>

      <h2 className="section-title">資料</h2>
      <div className="set-group">
        <button className="set-row btn-row" onClick={exportData}>
          <span className="set-icon">
            <Icon name="download" size={18} />
          </span>
          <div className="set-text">
            <span>匯出資料（JSON）</span>
            <small className="muted">
              {data.history.length} 筆紀錄 · {data.customPlans.length} 個自訂計畫
            </small>
          </div>
          <Icon name="chevron" size={18} className="muted" />
        </button>
        <button className="set-row btn-row" onClick={() => fileRef.current?.click()}>
          <span className="set-icon">
            <Icon name="upload" size={18} />
          </span>
          <div className="set-text">
            <span>匯入資料</span>
            <small className="muted">從備份檔還原</small>
          </div>
          <Icon name="chevron" size={18} className="muted" />
        </button>
        <button className="set-row btn-row danger-text" onClick={clear}>
          <span className="set-icon danger">
            <Icon name="trash" size={18} />
          </span>
          <div className="set-text">
            <span>清除所有資料</span>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importData(f)
            e.target.value = ''
          }}
        />
      </div>

      {!isStandalone() && (
        <motion.div className="card install-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>📲 安裝到 iPhone 主畫面</h3>
          <ol>
            <li>用 Safari 開啟這個網址</li>
            <li>
              點下方的「分享」按鈕 <Icon name="share" size={15} />
            </li>
            <li>選「加入主畫面」，再按「新增」</li>
          </ol>
          <p className="muted small">安裝後可全螢幕使用、離線也能開啟。</p>
        </motion.div>
      )}

      <div className="about muted small">
        <p>徒手健身 v1.0 · 資料只儲存在這台裝置</p>
        <p>螢幕常亮：{wakeLockSupported ? '支援 ✅' : '此瀏覽器不支援'}</p>
      </div>
      {confirmEl}
    </div>
  )
}
