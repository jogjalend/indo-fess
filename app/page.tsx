"use client"
import { useState } from "react"

const APPS = [
  { id: 1, label: "Telegram 1", color: "#2AABEE", url: "https://web.telegram.org/k/" },
  { id: 2, label: "Telegram 2", color: "#2AABEE", url: "https://web.telegram.org/a/" },
  { id: 3, label: "X", color: "#000000", url: "https://x.com" },
  { id: 4, label: "Telegram 3", color: "#2AABEE", url: "https://web.telegram.org/" },
]

export default function Page() {
  const [active, setActive] = useState(0)
  return (
    <div style={{height:"100vh", display:"flex", flexDirection:"column", background:"#0e1621"}}>
      <div style={{display:"flex", gap:8, padding:"10px", background:"#17212b"}}>
        {APPS.map((app, i) => (
          <button key={app.id} onClick={()=>setActive(i)}
            style={{
              padding:"10px 20px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700,
              background: active===i ? app.color : "#25303e",
              color: active===i ? "white" : "#7d8b99"
            }}>
            {app.label}
          </button>
        ))}
      </div>
      <div style={{flex:1, position:"relative"}}>
        {APPS.map((app, i) => (
          <iframe key={app.id} src={app.url} 
            style={{display: active===i ? "block":"none", width:"100%", height:"100%", border:"none", background:"white"}} />
        ))}
      </div>
    </div>
  )
}
