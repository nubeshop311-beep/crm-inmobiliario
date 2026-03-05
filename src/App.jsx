import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from "recharts";

/* ─── FONTS & STYLES ─────────────────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);
const styleEl = document.createElement("style");
styleEl.textContent = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#030712;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:#0a0f1e;}
  ::-webkit-scrollbar-thumb{background:#1f2937;border-radius:4px;}
  .hov:hover{border-color:#2d3748!important;transform:translateY(-1px);box-shadow:0 4px 20px #00000060;}
  .nav-btn:hover{background:#0e1624!important;color:#e2e8f0!important;}
  .abtn:hover{filter:brightness(1.2);}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fi{animation:fadeIn .22s ease forwards;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .pulse{animation:pulse 2.2s ease-in-out infinite;}
  select option{background:#111827;color:#f1f5f9;}
`;
document.head.appendChild(styleEl);

/* ─── CONSTANTS ──────────────────────────────────────────────────────────────── */
const TIPO_PROPIEDAD = ["Depa/Casa — Venta","Depa/Casa — Renta","Local Comercial","Fraccionamiento/Lote","Campestre/Lote Rural"];
const TIPO_COLORS = {"Depa/Casa — Venta":"#22d3ee","Depa/Casa — Renta":"#10b981","Local Comercial":"#f59e0b","Fraccionamiento/Lote":"#a78bfa","Campestre/Lote Rural":"#fb923c"};
const TIPO_ICONS  = {"Depa/Casa — Venta":"🏙️","Depa/Casa — Renta":"🔑","Local Comercial":"🏪","Fraccionamiento/Lote":"🗺️","Campestre/Lote Rural":"🌿"};

const ESQUEMA_COMISION = {
  "Comisión venta":      (p) => p * 0.03,
  "Comisión renta":      (p) => p,          // 1 mes
  "Honorarios fijos":    (p) => p,           // fixed fee stored as presupuesto
  "Administración mens": (p) => p * 0.10,   // 10% renta mensual
};
const ESQUEMA_LABELS = {
  "Comisión venta":      "3% del precio de venta",
  "Comisión renta":      "1 mes de renta",
  "Honorarios fijos":    "Monto fijo acordado",
  "Administración mens": "10% mensual sobre renta",
};

const ASESORES = ["Ana Pérez","Carlos Ríos","Fernanda Mora","Luis Ibarra","Daniela Cruz","Roberto Salinas"];
const ASESOR_COLORS = ["#22d3ee","#10b981","#a78bfa","#f59e0b","#fb923c","#f87171"];

const STAGES = ["Lead Nuevo","Contactado","Visita Agendada","Visitó","Negociación","Cierre","Perdido"];
const STAGE_CFG = {
  "Lead Nuevo":      {dot:"#94a3b8",bg:"#1e293b"},
  "Contactado":      {dot:"#60a5fa",bg:"#1e3a5f"},
  "Visita Agendada": {dot:"#a78bfa",bg:"#2e1f5e"},
  "Visitó":          {dot:"#fbbf24",bg:"#3b2a00"},
  "Negociación":     {dot:"#34d399",bg:"#064e3b"},
  "Cierre":          {dot:"#22d3ee",bg:"#0c3547"},
  "Perdido":         {dot:"#f87171",bg:"#3b0f0f"},
};

const FUENTE_COLORS = {"Inmuebles24":"#3b82f6","Meta Ads":"#a855f7","Referido":"#10b981","Espectacular":"#f59e0b","Lamudi":"#fb923c","Whatsapp directo":"#34d399"};

/* ─── INITIAL DATA ───────────────────────────────────────────────────────────── */
const INITIAL_LEADS = [
  {id:1,  nombre:"Roberto Jiménez",   tel:"33 1234 5678", fuente:"Inmuebles24",      tipo:"Depa/Casa — Venta",        propiedad:"Depa 2 rec — Providencia",            presupuesto:3500000, esquema:"Comisión venta",      asesor:"Ana Pérez",      stage:"Lead Nuevo",    dias:3,  notas:"",                                        accion:"Llamar para agendar visita"},
  {id:2,  nombre:"Ana Lucía Torres",  tel:"33 9876 5432", fuente:"Referido",         tipo:"Depa/Casa — Venta",        propiedad:"Torre Kyo — Chapalita",               presupuesto:4200000, esquema:"Comisión venta",      asesor:"Carlos Ríos",    stage:"Visita Agendada",dias:1, notas:"Viene con esposo mañana 11am",            accion:"Confirmar visita"},
  {id:3,  nombre:"Familia Orozco",    tel:"33 5555 7890", fuente:"Espectacular",     tipo:"Fraccionamiento/Lote",     propiedad:"Fracc. Bugambilias — Zapopan",        presupuesto:6000000, esquema:"Comisión venta",      asesor:"Fernanda Mora",  stage:"Contactado",    dias:7,  notas:"",                                        accion:"Llamada urgente"},
  {id:4,  nombre:"Carlos Mendoza",    tel:"33 2233 4455", fuente:"Meta Ads",         tipo:"Local Comercial",          propiedad:"Local Plaza Galerías — 80m²",         presupuesto:28000,   esquema:"Comisión renta",      asesor:"Ana Pérez",      stage:"Negociación",   dias:2,  notas:"Necesita local para consultorio",         accion:"Enviar propuesta formal"},
  {id:5,  nombre:"Sofía Ramírez",     tel:"33 6677 8899", fuente:"Referido",         tipo:"Depa/Casa — Renta",        propiedad:"Casa Jardines — Zapopan",             presupuesto:18000,   esquema:"Comisión renta",      asesor:"Luis Ibarra",    stage:"Negociación",   dias:0,  notas:"Quiere entrar el 1ro del mes",            accion:"Revisión contrato"},
  {id:6,  nombre:"Jorge Villanueva",  tel:"33 1122 3344", fuente:"Inmuebles24",      tipo:"Depa/Casa — Venta",        propiedad:"Depa 3 rec — Providencia",            presupuesto:4800000, esquema:"Comisión venta",      asesor:"Daniela Cruz",   stage:"Lead Nuevo",    dias:2,  notas:"",                                        accion:"Agendar visita"},
  {id:7,  nombre:"Mariana López",     tel:"33 9900 1122", fuente:"Meta Ads",         tipo:"Campestre/Lote Rural",     propiedad:"Lote Campestre — Tlajomulco 800m²",   presupuesto:1200000, esquema:"Comisión venta",      asesor:"Roberto Salinas",stage:"Visitó",        dias:4,  notas:"Le gustó, quiere traer al papá",          accion:"Agendar segunda visita"},
  {id:8,  nombre:"Héctor Guzmán",     tel:"33 4455 6677", fuente:"Referido",         tipo:"Depa/Casa — Venta",        propiedad:"Casa Zapopan Norte — 320m²",          presupuesto:7200000, esquema:"Comisión venta",      asesor:"Ana Pérez",      stage:"Cierre",        dias:1,  notas:"Firma esta semana. Notario listo.",        accion:"Firma promesa compra-venta"},
  {id:9,  nombre:"Patricia Soto",     tel:"33 3344 5566", fuente:"Espectacular",     tipo:"Depa/Casa — Venta",        propiedad:"Depa 2 rec — Americana",              presupuesto:3100000, esquema:"Comisión venta",      asesor:"Carlos Ríos",    stage:"Perdido",       dias:12, notas:"Compró con otra inmobiliaria",            accion:""},
  {id:10, nombre:"David Reyes",       tel:"33 7788 9900", fuente:"Meta Ads",         tipo:"Fraccionamiento/Lote",     propiedad:"Lote Fracc. Los Laureles — 300m²",    presupuesto:850000,  esquema:"Comisión venta",      asesor:"Fernanda Mora",  stage:"Lead Nuevo",    dias:1,  notas:"",                                        accion:"Enviar fichas técnicas"},
  {id:11, nombre:"Claudia Herrera",   tel:"33 6655 4433", fuente:"Referido",         tipo:"Depa/Casa — Renta",        propiedad:"Studio — Américas Urban",             presupuesto:12000,   esquema:"Administración mens", asesor:"Luis Ibarra",    stage:"Visitó",        dias:5,  notas:"Inversión para renta. Quiere admin.",     accion:"Agendar segunda visita"},
  {id:12, nombre:"Ing. Barajas",      tel:"33 8877 6655", fuente:"Whatsapp directo", tipo:"Local Comercial",          propiedad:"Local Av. Patria — 120m²",            presupuesto:45000,   esquema:"Honorarios fijos",    asesor:"Daniela Cruz",   stage:"Contactado",    dias:3,  notas:"Quiere comprar el local, no rentar",      accion:"Enviar avalúo"},
  {id:13, nombre:"Fam. Castellanos",  tel:"33 5544 3322", fuente:"Lamudi",           tipo:"Campestre/Lote Rural",     propiedad:"Rancho El Rincón — 2 has Tlajomulco", presupuesto:3800000, esquema:"Comisión venta",      asesor:"Roberto Salinas",stage:"Visita Agendada",dias:0, notas:"Buscan terreno para casa de campo",       accion:"Visita sábado 10am"},
  {id:14, nombre:"Laura Mendez",      tel:"33 2211 4433", fuente:"Meta Ads",         tipo:"Depa/Casa — Renta",        propiedad:"Depa amueblado — Chapalita",          presupuesto:16000,   esquema:"Comisión renta",      asesor:"Ana Pérez",      stage:"Negociación",   dias:1,  notas:"Extranjera, necesita depa amueblado",     accion:"Enviar contrato"},
];

const INITIAL_RENTAS = [
  {id:1, inquilino:"Pedro Alvarado",   propiedad:"Casa Jardines — Guadalupe",   renta:14000, asesor:"Luis Ibarra",    pagos:[{mes:"Ene",pagado:true},{mes:"Feb",pagado:true},{mes:"Mar",pagado:false}], contrato:"Mar 2024 – Feb 2025", tel:"33 1111 2222"},
  {id:2, inquilino:"Empresa Logística S.A.", propiedad:"Bodega Industrial — Tlaquepaque", renta:38000, asesor:"Daniela Cruz",   pagos:[{mes:"Ene",pagado:true},{mes:"Feb",pagado:true},{mes:"Mar",pagado:true}],  contrato:"Jul 2024 – Jun 2025", tel:"33 3333 4444"},
  {id:3, inquilino:"Dr. Ramírez",      propiedad:"Consultorio Plaza Centro",    renta:12000, asesor:"Ana Pérez",      pagos:[{mes:"Ene",pagado:true},{mes:"Feb",pagado:false},{mes:"Mar",pagado:false}], contrato:"Ene 2025 – Dic 2025", tel:"33 5555 6666"},
  {id:4, inquilino:"Familia Torres",   propiedad:"Casa Zapopan 3rec",           renta:22000, asesor:"Carlos Ríos",    pagos:[{mes:"Ene",pagado:true},{mes:"Feb",pagado:true},{mes:"Mar",pagado:true}],  contrato:"Sep 2024 – Ago 2025", tel:"33 7777 8888"},
  {id:5, inquilino:"Tienda Moda XO",   propiedad:"Local Galerías — 60m²",      renta:28000, asesor:"Fernanda Mora",  pagos:[{mes:"Ene",pagado:true},{mes:"Feb",pagado:true},{mes:"Mar",pagado:false}], contrato:"Feb 2025 – Ene 2026", tel:"33 9999 0000"},
];

const PROPIEDADES = [
  {id:1, nombre:"Torre Kyo",                zona:"Chapalita",       tipo:"Depa/Casa — Venta",      precio:3800000, disponibles:5,  img:"🏙️", amenidades:["Gimnasio","Roof garden","Seguridad 24h"]},
  {id:2, nombre:"Residencial Los Robles",   zona:"Zapopan Norte",   tipo:"Depa/Casa — Venta",      precio:5500000, disponibles:3,  img:"🏡", amenidades:["Coto privado","Casa club","Jardín"]},
  {id:3, nombre:"Américas Urban",           zona:"La Americana",    tipo:"Depa/Casa — Renta",      precio:13000,  disponibles:8,  img:"🔑", amenidades:["Rooftop","Amueblado","Seguridad"]},
  {id:4, nombre:"Plaza Av. Patria",         zona:"Zapopan",         tipo:"Local Comercial",        precio:32000,  disponibles:4,  img:"🏪", amenidades:["Estacionamiento","Acceso 24h","Bodega"]},
  {id:5, nombre:"Fracc. Los Laureles",      zona:"Tlajomulco",      tipo:"Fraccionamiento/Lote",   precio:780000, disponibles:15, img:"🗺️", amenidades:["Escrituras","Servicios","Pavimentado"]},
  {id:6, nombre:"Rancho El Encanto",        zona:"Tlajomulco Sur",  tipo:"Campestre/Lote Rural",   precio:950000, disponibles:6,  img:"🌿", amenidades:["Agua pozo","Acceso terracería","Sin restricciones"]},
  {id:7, nombre:"Torre Providencia",        zona:"Providencia",     tipo:"Depa/Casa — Venta",      precio:4200000, disponibles:7, img:"🏢", amenidades:["Piscina","Coworking","Pet friendly"]},
  {id:8, nombre:"Locales Galerías",         zona:"Zapopan",         tipo:"Local Comercial",        precio:45000,  disponibles:2,  img:"🏬", amenidades:["Flujo peatonal alto","A/C central","Seguridad"]},
];

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const fmt   = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const fmtK  = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;
const calcComision = (lead) => {
  const fn = ESQUEMA_COMISION[lead.esquema];
  return fn ? fn(lead.presupuesto) : lead.presupuesto * 0.03;
};
const daysAgo = d => Math.floor((Date.now() - new Date(d)) / 86400000);
// store leads with a "diasSinContacto" field instead of live date for demo simplicity
const sinContactoDias = l => l.dias;

/* ─── BADGE ──────────────────────────────────────────────────────────────────── */
function Badge({children, color="#64748b", small=false}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,fontSize:small?9:10,fontWeight:700,padding:small?"1px 5px":"2px 8px",borderRadius:99,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</span>;
}

/* ─── STAT CARD ──────────────────────────────────────────────────────────────── */
function StatCard({label,value,sub,accent="#22d3ee",danger=false,onClick}){
  return (
    <div className="hov" onClick={onClick} style={{background:danger?"#130808":"#0d1117",border:`1px solid ${danger?"#ef444428":"#1a2030"}`,borderRadius:12,padding:"16px 20px",position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"all 0.2s"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:danger?"#ef4444":accent,borderRadius:"12px 0 0 12px"}}/>
      <div style={{fontSize:11,color:"#4b5563",fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <div style={{fontSize:26,fontWeight:800,color:danger?"#f87171":accent,fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:4}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#374151",marginTop:2}}>{sub}</div>}
    </div>
  );
}

/* ─── LEAD CARD ──────────────────────────────────────────────────────────────── */
function LeadCard({lead, onOpen}){
  const dias = sinContactoDias(lead);
  const hot  = dias>=3 && !["Cierre","Perdido"].includes(lead.stage);
  const com  = calcComision(lead);
  return (
    <div className="hov" onClick={()=>onOpen(lead)} style={{background:"#0d1117",border:`1px solid ${hot?"#ef444422":"#1a2030"}`,borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all 0.18s",position:"relative",overflow:"hidden"}}>
      {hot&&<div style={{position:"absolute",top:0,right:0,background:"#ef4444",fontSize:9,fontWeight:800,color:"white",padding:"2px 8px",borderRadius:"0 10px 0 8px"}}>⚠ {dias}D</div>}
      <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0",marginBottom:2,paddingRight:hot?40:0}}>{lead.nombre}</div>
      <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{lead.propiedad}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <Badge color={TIPO_COLORS[lead.tipo]||"#64748b"} small>{TIPO_ICONS[lead.tipo]} {lead.tipo.split("—")[0].trim()}</Badge>
        <span style={{fontSize:12,fontWeight:700,color:"#10b981",fontFamily:"'DM Mono',monospace"}}>{fmtK(com)}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Badge color={FUENTE_COLORS[lead.fuente]||"#64748b"} small>{lead.fuente}</Badge>
        <span style={{fontSize:10,color:"#4b5563"}}>{lead.asesor.split(" ")[0]}</span>
      </div>
      {lead.accion&&<div style={{fontSize:10,color:"#fbbf24",borderTop:"1px solid #1f2937",paddingTop:5,marginTop:6}}>→ {lead.accion}</div>}
    </div>
  );
}

/* ─── LEAD MODAL ─────────────────────────────────────────────────────────────── */
function LeadModal({lead, onClose, onSave, onMove}){
  const [notas,  setNotas]  = useState(lead.notas);
  const [accion, setAccion] = useState(lead.accion);
  const cfg  = STAGE_CFG[lead.stage];
  const com  = calcComision(lead);
  const dias = sinContactoDias(lead);
  const stages = STAGES.filter(s=>s!==lead.stage);
  return (
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div className="fi" style={{background:"#0a0f1e",border:"1px solid #1f2937",borderRadius:16,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",padding:28}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9",fontFamily:"'Syne',sans-serif",marginBottom:4}}>{lead.nombre}</div>
            <div style={{fontSize:12,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>{lead.tel}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={cfg.dot}>{lead.stage}</Badge>
            <button onClick={onClose} style={{background:"#1f2937",border:"none",color:"#6b7280",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        </div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[
            ["VALOR",fmt(lead.presupuesto),"#f1f5f9"],
            ["TU COMISIÓN",fmt(com),"#22d3ee"],
            ["SIN CONTACTO",`${dias} días`,dias>=3?"#ef4444":"#f1f5f9"],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#111827",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:9,color:"#4b5563",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>{l}</div>
              <div style={{fontSize:14,fontWeight:800,color:c,fontFamily:"'DM Mono',monospace"}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Info */}
        <div style={{background:"#111827",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            <Badge color={TIPO_COLORS[lead.tipo]||"#64748b"}>{TIPO_ICONS[lead.tipo]} {lead.tipo}</Badge>
            <Badge color={FUENTE_COLORS[lead.fuente]||"#64748b"}>{lead.fuente}</Badge>
            <Badge color="#6b7280">👤 {lead.asesor}</Badge>
          </div>
          <div style={{fontSize:13,color:"#f1f5f9",marginBottom:4}}>{lead.propiedad}</div>
          <div style={{fontSize:11,color:"#4b5563"}}>{ESQUEMA_LABELS[lead.esquema]}</div>
        </div>
        {/* Accion */}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>SIGUIENTE ACCIÓN</label>
          <input value={accion} onChange={e=>setAccion(e.target.value)} style={{width:"100%",background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontSize:13,outline:"none"}} placeholder="¿Qué sigue?"/>
        </div>
        {/* Notas */}
        <div style={{marginBottom:16}}>
          <label style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>NOTAS</label>
          <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3} style={{width:"100%",background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontSize:13,outline:"none",resize:"vertical"}} placeholder="Notas del lead..."/>
        </div>
        {/* Mover */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>MOVER A ETAPA</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {stages.map(s=>(
              <button key={s} className="abtn" onClick={()=>{onMove(lead.id,s);onClose();}} style={{background:STAGE_CFG[s].bg,border:`1px solid ${STAGE_CFG[s].dot}44`,color:STAGE_CFG[s].dot,borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"filter 0.15s"}}>{s}</button>
            ))}
          </div>
        </div>
        {/* Actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <a href={`tel:${lead.tel.replace(/\s/g,"")}`} style={{background:"#0c2a1e",border:"1px solid #10b98138",color:"#34d399",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 Llamar</a>
          <a href={`https://wa.me/52${lead.tel.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#0c2a1e",border:"1px solid #10b98138",color:"#34d399",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>💬 WhatsApp</a>
          <button className="abtn" onClick={()=>{onSave(lead.id,{notas,accion,dias:0});onClose();}} style={{background:"#0e7490",border:"none",color:"white",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",transition:"filter 0.15s"}}>✓ Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD LEAD MODAL ─────────────────────────────────────────────────────────── */
function AddLeadModal({onClose, onAdd}){
  const [f,setF]=useState({nombre:"",tel:"",fuente:"Inmuebles24",tipo:"Depa/Casa — Venta",propiedad:"",presupuesto:"",esquema:"Comisión venta",asesor:ASESORES[0]});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div className="fi" style={{background:"#0a0f1e",border:"1px solid #1f2937",borderRadius:16,width:"100%",maxWidth:460,maxHeight:"90vh",overflowY:"auto",padding:28}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:20,fontFamily:"'Syne',sans-serif"}}>Nuevo Lead</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <input placeholder="Nombre completo" value={f.nombre} onChange={e=>s("nombre",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}/>
          <input placeholder="Teléfono" value={f.tel} onChange={e=>s("tel",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}/>
        </div>
        <input placeholder="Propiedad de interés" value={f.propiedad} onChange={e=>s("propiedad",e.target.value)} style={{width:"100%",background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none",marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <input placeholder="Valor ($)" type="number" value={f.presupuesto} onChange={e=>s("presupuesto",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}/>
          <select value={f.fuente} onChange={e=>s("fuente",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}>
            {Object.keys(FUENTE_COLORS).map(x=><option key={x}>{x}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <select value={f.tipo} onChange={e=>s("tipo",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}>
            {TIPO_PROPIEDAD.map(x=><option key={x}>{x}</option>)}
          </select>
          <select value={f.esquema} onChange={e=>s("esquema",e.target.value)} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none"}}>
            {Object.keys(ESQUEMA_COMISION).map(x=><option key={x}>{x}</option>)}
          </select>
        </div>
        <select value={f.asesor} onChange={e=>s("asesor",e.target.value)} style={{width:"100%",background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,outline:"none",marginBottom:18}}>
          {ASESORES.map(x=><option key={x}>{x}</option>)}
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose} style={{background:"#111827",border:"1px solid #1f2937",color:"#9ca3af",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(!f.nombre||!f.tel)return;onAdd({...f,presupuesto:Number(f.presupuesto)||0});onClose();}} style={{background:"#0e7490",border:"none",color:"white",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── RENTAS MODULE ──────────────────────────────────────────────────────────── */
function RentasView({rentas, setRentas, isMobile, isTablet, isDesktop}){
  const togglePago=(rid,mes)=>{
    setRentas(rs=>rs.map(r=>r.id===rid?{...r,pagos:r.pagos.map(p=>p.mes===mes?{...p,pagado:!p.pagado}:p)}:r));
  };
  const pendientes = rentas.filter(r=>r.pagos.some(p=>!p.pagado));
  const totalMens  = rentas.reduce((s,r)=>s+r.renta,0);
  const totalAdmin = rentas.reduce((s,r)=>s+r.renta*0.10,0);

  return (
    <div className="fi">
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,1fr)":isTablet?"repeat(2,1fr)":"repeat(2,1fr)",gap:12,marginBottom:24}}>
        <StatCard label="Propiedades en renta" value={rentas.length} accent="#10b981"/>
        <StatCard label="Renta total mensual" value={fmtK(totalMens)} sub="suma de todas" accent="#22d3ee"/>
        <StatCard label="Tus honorarios admin" value={fmtK(totalAdmin)} sub="10% mensual" accent="#f59e0b"/>
        <StatCard label="Pagos pendientes" value={pendientes.length} sub="este mes" accent="#ef4444" danger={pendientes.length>0}/>
      </div>

      {/* Cards */}
      <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,1fr)":isTablet?"repeat(2,1fr)":"1fr",gap:16}}>
        {rentas.map(r=>{
          const pagados   = r.pagos.filter(p=>p.pagado).length;
          const pendPagos = r.pagos.filter(p=>!p.pagado);
          return (
            <div key={r.id} className="hov" style={{background:"#0d1117",border:`1px solid ${pendPagos.length?"#f59e0b22":"#1a2030"}`,borderRadius:14,padding:20,transition:"all 0.2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#f1f5f9",fontFamily:"'DM Sans',sans-serif"}}>{r.inquilino}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{r.propiedad}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:800,color:"#10b981",fontFamily:"'DM Mono',monospace"}}>{fmt(r.renta)}</div>
                  <div style={{fontSize:10,color:"#374151"}}>/ mes</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                <Badge color="#6b7280" small>👤 {r.asesor.split(" ")[0]}</Badge>
                <Badge color="#4b5563" small>📅 {r.contrato}</Badge>
                <Badge color="#f59e0b" small>Admin: {fmt(r.renta*0.10)}/mes</Badge>
              </div>
              {/* Pagos tracker */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>PAGOS 2025</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {r.pagos.map(p=>(
                    <button key={p.mes} className="abtn" onClick={()=>togglePago(r.id,p.mes)} style={{background:p.pagado?"#064e3b":"#1a0808",border:`1px solid ${p.pagado?"#10b98140":"#ef444430"}`,color:p.pagado?"#34d399":"#f87171",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
                      {p.pagado?"✓":""} {p.mes}
                    </button>
                  ))}
                </div>
              </div>
              {pendPagos.length>0&&(
                <div style={{background:"#1a0f00",border:"1px solid #f59e0b22",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>⚠ {pendPagos.map(p=>p.mes).join(", ")} pendiente</span>
                  <a href={`https://wa.me/52${r.tel.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#fbbf24",fontWeight:700,textDecoration:"none"}}>Cobrar →</a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── EQUIPO VIEW ────────────────────────────────────────────────────────────── */
function EquipoView({leads, isMobile, isTablet, isDesktop}){
  return (
    <div className="fi">
      <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,1fr)":isTablet?"repeat(2,1fr)":"1fr",gap:16}}>
        {ASESORES.map((asesor,i)=>{
          const misLeads   = leads.filter(l=>l.asesor===asesor);
          const activos    = misLeads.filter(l=>!["Perdido"].includes(l.stage));
          const enNeg      = misLeads.filter(l=>["Negociación","Cierre"].includes(l.stage));
          const sinSeg     = misLeads.filter(l=>sinContactoDias(l)>=3&&!["Cierre","Perdido"].includes(l.stage));
          const comPot     = activos.reduce((s,l)=>s+calcComision(l),0);
          const color      = ASESOR_COLORS[i];
          return (
            <div key={asesor} style={{background:"#0d1117",border:`1px solid #1a2030`,borderRadius:14,padding:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color,borderRadius:"14px 0 0 14px"}}/>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:color+"22",border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color,fontFamily:"'DM Mono',monospace"}}>
                  {asesor.split(" ").map(w=>w[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#f1f5f9",fontFamily:"'DM Sans',sans-serif"}}>{asesor}</div>
                  <div style={{fontSize:11,color:"#4b5563"}}>{activos.length} leads activos</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"#111827",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>En negociación</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#10b981",fontFamily:"'DM Mono',monospace"}}>{enNeg.length}</div>
                </div>
                <div style={{background:"#111827",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Sin seguimiento</div>
                  <div style={{fontSize:18,fontWeight:800,color:sinSeg.length>0?"#ef4444":"#374151",fontFamily:"'DM Mono',monospace"}}>{sinSeg.length}</div>
                </div>
              </div>
              <div style={{background:"#111827",borderRadius:8,padding:"8px 10px",marginBottom:12}}>
                <div style={{fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Comisiones potenciales</div>
                <div style={{fontSize:16,fontWeight:800,color,fontFamily:"'DM Mono',monospace"}}>{fmtK(comPot)}</div>
              </div>
              {/* Tipo breakdown */}
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {TIPO_PROPIEDAD.map(t=>{
                  const n=activos.filter(l=>l.tipo===t).length;
                  return n>0?<Badge key={t} color={TIPO_COLORS[t]} small>{TIPO_ICONS[t]} {n}</Badge>:null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────────── */
export default function CRMInmobiliario(){
  const [leads,        setLeads]        = useState(INITIAL_LEADS);
  const [rentas,       setRentas]       = useState(INITIAL_RENTAS);
  const [tab,          setTab]          = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [width,        setWidth]        = useState(window.innerWidth);
  const [filterTipo,   setFilterTipo]   = useState("Todos");
  const [filterAsesor, setFilterAsesor] = useState("Todos");

  useEffect(()=>{
    const h=()=>setWidth(window.innerWidth);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);

  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1100;
  const isDesktop = width >= 1100;

  const moveStage=(id,stage)=>setLeads(ls=>ls.map(l=>l.id===id?{...l,stage}:l));
  const saveLead=(id,u)=>setLeads(ls=>ls.map(l=>l.id===id?{...l,...u}:l));
  const addLead=(f)=>setLeads(ls=>[...ls,{...f,id:Date.now(),dias:0,accion:"Primer contacto",stage:"Lead Nuevo",notas:""}]);

  /* Derived */
  const activeLeads    = useMemo(()=>leads.filter(l=>l.stage!=="Perdido"),[leads]);
  const sinSeg         = useMemo(()=>leads.filter(l=>sinContactoDias(l)>=3&&!["Cierre","Perdido"].includes(l.stage)),[leads]);
  const hoySeg         = useMemo(()=>leads.filter(l=>sinContactoDias(l)>=2&&!["Cierre","Perdido"].includes(l.stage)).sort((a,b)=>sinContactoDias(b)-sinContactoDias(a)),[leads]);
  const comisionPot    = useMemo(()=>activeLeads.reduce((s,l)=>s+calcComision(l),0),[activeLeads]);
  const comisionNeg    = useMemo(()=>leads.filter(l=>["Negociación","Cierre"].includes(l.stage)).reduce((s,l)=>s+calcComision(l),0),[leads]);
  const comisionRiesgo = useMemo(()=>sinSeg.reduce((s,l)=>s+calcComision(l),0),[sinSeg]);
  const rentaAdmin     = useMemo(()=>rentas.reduce((s,r)=>s+r.renta*0.10,0),[rentas]);
  const tasaConv       = useMemo(()=>{const t=leads.length;const c=leads.filter(l=>l.stage==="Cierre").length;return t?Math.round(c/t*100):0;},[leads]);

  const filteredLeads  = useMemo(()=>leads.filter(l=>(filterTipo==="Todos"||l.tipo===filterTipo)&&(filterAsesor==="Todos"||l.asesor===filterAsesor)),[leads,filterTipo,filterAsesor]);

  const fuenteData = useMemo(()=>{const m={};leads.forEach(l=>{m[l.fuente]=(m[l.fuente]||0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[leads]);
  const tipoData   = useMemo(()=>TIPO_PROPIEDAD.map(t=>({name:t.split("—")[0].trim().replace("Fraccionamiento/Lote","Fracc.").replace("Campestre/Lote Rural","Campestre"),value:leads.filter(l=>l.tipo===t).length,color:TIPO_COLORS[t]})),[leads]);
  const stageData  = useMemo(()=>STAGES.slice(0,6).map(s=>({name:s.replace("Visita Agendada","V.Ag.").replace("Negociación","Neg.").replace("Lead Nuevo","Nuevo"),value:leads.filter(l=>l.stage===s).length,color:STAGE_CFG[s].dot})),[leads]);
  const monthData  = [{mes:"Sep",leads:4,cierres:1},{mes:"Oct",leads:7,cierres:2},{mes:"Nov",leads:5,cierres:1},{mes:"Dic",leads:9,cierres:3},{mes:"Ene",leads:6,cierres:2},{mes:"Feb",leads:11,cierres:3},{mes:"Mar",leads:activeLeads.length,cierres:leads.filter(l=>l.stage==="Cierre").length}];

  const navItems = [
    {id:"dashboard",    icon:"📊", label:"Dashboard"},
    {id:"pipeline",     icon:"🗂️",  label:"Pipeline"},
    {id:"seguimientos", icon:"🔔", label:"Hoy",         badge:hoySeg.length||null},
    {id:"rentas",       icon:"🔑", label:"Rentas",       badge:rentas.filter(r=>r.pagos.some(p=>!p.pagado)).length||null},
    {id:"propiedades",  icon:"🏢", label:"Propiedades"},
    {id:"equipo",       icon:"👥", label:"Equipo"},
  ];

  const Sidebar = ()=>(
    <div style={{width:isDesktop?228:70,flexShrink:0,background:"#060b16",borderRight:"1px solid #0e1624",display:"flex",flexDirection:"column",padding:isDesktop?"24px 14px":"24px 8px",position:"sticky",top:0,height:"100vh"}}>
      <div style={{marginBottom:28,padding:isDesktop?"0 4px":"0",textAlign:isDesktop?"left":"center"}}>
        <div style={{fontSize:isDesktop?17:13,fontWeight:900,color:"#22d3ee",fontFamily:"'Syne',sans-serif"}}>
          {isDesktop?"CRM Inmobiliario":"CRM"}
        </div>
        {isDesktop&&<div style={{fontSize:10,color:"#1f2937",marginTop:3,letterSpacing:"0.08em",textTransform:"uppercase"}}>Guadalajara · GDL</div>}
      </div>
      <nav style={{flex:1}}>
        {navItems.map(item=>(
          <button key={item.id} className="nav-btn" onClick={()=>setTab(item.id)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:isDesktop?10:0,justifyContent:isDesktop?"flex-start":"center",padding:isDesktop?"10px 12px":"10px 0",marginBottom:3,background:tab===item.id?"#0e1624":"transparent",border:`1px solid ${tab===item.id?"#1a2030":"transparent"}`,borderRadius:9,color:tab===item.id?"#e2e8f0":"#6b7280",fontSize:13,fontWeight:tab===item.id?700:500,cursor:"pointer",transition:"all 0.15s",position:"relative",fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:16}}>{item.icon}</span>
            {isDesktop&&<span>{item.label}</span>}
            {item.badge&&<span style={{marginLeft:isDesktop?"auto":0,background:"#ef4444",color:"white",fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,position:isDesktop?"static":"absolute",top:4,right:4}}>{item.badge}</span>}
          </button>
        ))}
      </nav>
      {isDesktop&&(
        <div style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:10,padding:14}}>
          <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Pipeline total</div>
          <div style={{fontSize:16,fontWeight:800,color:"#22d3ee",fontFamily:"'DM Mono',monospace",marginBottom:4}}>{fmtK(comisionPot)}</div>
          <div style={{fontSize:10,color:"#374151",marginBottom:2}}>+ Admin rentas: {fmtK(rentaAdmin)}/mes</div>
          {sinSeg.length>0&&<div className="pulse" style={{fontSize:11,color:"#ef4444",fontWeight:700,marginTop:6}}>⚠ {sinSeg.length} sin seguimiento</div>}
        </div>
      )}
    </div>
  );

  const BottomNav = ()=>(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#060b16",borderTop:"1px solid #0e1624",display:"flex",zIndex:60,overflowX:"auto"}}>
      {navItems.map(item=>(
        <button key={item.id} onClick={()=>setTab(item.id)} style={{flex:1,minWidth:54,padding:"8px 2px",background:"none",border:"none",color:tab===item.id?"#22d3ee":"#4b5563",borderTop:`2px solid ${tab===item.id?"#22d3ee":"transparent"}`,fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",transition:"all 0.15s",position:"relative",fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{fontSize:17,marginBottom:2}}>{item.icon}</div>
          {item.label.split(" ")[0]}
          {item.badge&&<span style={{position:"absolute",top:4,right:"calc(50% - 16px)",background:"#ef4444",color:"white",fontSize:8,fontWeight:800,padding:"1px 4px",borderRadius:99}}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );

  const pad = isMobile?"16px 14px 90px":isTablet?"24px":"28px 36px";

  const selStyle = {background:"#111827",border:"1px solid #1f2937",borderRadius:8,padding:"7px 12px",color:"#f1f5f9",fontSize:12,outline:"none",cursor:"pointer"};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#030712",fontFamily:"'DM Sans',sans-serif",color:"#f1f5f9"}}>
      {!isMobile&&<Sidebar/>}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* TOP HEADER */}
        <div style={{background:"#060b16",borderBottom:"1px solid #0e1624",padding:isMobile?"14px 16px":"14px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",position:"sticky",top:0,zIndex:50}}>
          <div>
            <div style={{fontSize:isMobile?19:23,fontWeight:900,color:"#f1f5f9",fontFamily:"'Syne',sans-serif",letterSpacing:"-0.02em"}}>
              {navItems.find(n=>n.id===tab)?.label}
            </div>
            <div style={{fontSize:11,color:"#374151",marginTop:1}}>
              {new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {!isMobile&&(
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em"}}>Pipeline + Rentas</div>
                <div style={{fontSize:17,fontWeight:800,color:"#22d3ee",fontFamily:"'DM Mono',monospace"}}>{fmt(comisionPot)} <span style={{fontSize:12,color:"#10b981"}}>+{fmtK(rentaAdmin)}/mes</span></div>
              </div>
            )}
            <button onClick={()=>setShowAdd(true)} style={{background:"#0e7490",border:"none",color:"white",borderRadius:9,padding:isMobile?"8px 14px":"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Nuevo lead</button>
          </div>
        </div>

        {/* ALERT BANNER */}
        {sinSeg.length>0&&(
          <div style={{background:"#130808",borderBottom:"1px solid #ef444418",padding:isMobile?"8px 16px":"8px 28px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span className="pulse" style={{fontSize:14}}>🚨</span>
            <span style={{fontSize:12,fontWeight:800,color:"#ef4444"}}>{sinSeg.length} leads sin seguimiento +3 días</span>
            <span style={{fontSize:12,color:"#6b2020"}}>— {fmt(comisionRiesgo)} en comisiones en riesgo</span>
            <button onClick={()=>setTab("seguimientos")} style={{marginLeft:"auto",background:"transparent",border:"1px solid #ef444440",color:"#f87171",borderRadius:6,padding:"3px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Atender →</button>
          </div>
        )}

        {/* CONTENT */}
        <div style={{flex:1,overflowY:"auto",padding:pad}}>

          {/* ══ DASHBOARD ══ */}
          {tab==="dashboard"&&(
            <div className="fi">
              <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,1fr)":isTablet?"repeat(2,1fr)":"repeat(2,1fr)",gap:12,marginBottom:24}}>
                <StatCard label="Leads activos" value={activeLeads.length} sub={`${leads.filter(l=>l.stage==="Lead Nuevo").length} nuevos`} accent="#22d3ee"/>
                <StatCard label="En negociación" value={leads.filter(l=>["Negociación","Cierre"].includes(l.stage)).length} sub={fmtK(comisionNeg)+" pot."} accent="#10b981"/>
                <StatCard label="Rentas admin" value={rentas.length} sub={`${fmtK(rentaAdmin)}/mes`} accent="#f59e0b"/>
                <StatCard label="Sin seguimiento" value={sinSeg.length} sub={sinSeg.length>0?`${fmtK(comisionRiesgo)} en riesgo`:"¡Al corriente! ✓"} accent="#ef4444" danger={sinSeg.length>0} onClick={sinSeg.length>0?()=>setTab("seguimientos"):undefined}/>
              </div>

              {/* Hero */}
              <div style={{background:"linear-gradient(135deg,#0b2535 0%,#081422 100%)",border:"1px solid #0d3d57",borderRadius:16,padding:isMobile?"20px 22px":isDesktop?"32px 40px":"24px 28px",marginBottom:24,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,background:"#22d3ee06",borderRadius:"50%",border:"1px solid #22d3ee0d"}}/>
                <div style={{fontSize:12,color:"#0e7490",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>💰 Tu dinero en juego hoy</div>
                <div style={{fontSize:isMobile?34:isDesktop?50:40,fontWeight:900,color:"#22d3ee",fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:8}}>{fmt(comisionPot)}</div>
                <div style={{fontSize:13,color:"#134e68",lineHeight:1.8}}>
                  comisiones potenciales en pipeline
                  <span style={{color:"#0891b2",fontWeight:700}}> · {fmt(comisionNeg)} en negociación activa</span>
                  <br/>
                  <span style={{color:"#059669",fontWeight:700}}>+ {fmt(rentaAdmin)}/mes</span>
                  <span style={{color:"#065f46"}}> en honorarios de administración de rentas</span>
                </div>
              </div>

              {/* Charts */}
              <div style={{display:"grid",gridTemplateColumns:isDesktop?"1fr 1fr 1fr":isTablet?"1fr 1fr":"1fr",gap:16,marginBottom:20}}>
                <div style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:14,padding:"20px"}}>
                  <div style={{fontSize:11,color:"#4b5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Pipeline por etapa</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={stageData} barSize={24}>
                      <XAxis dataKey="name" tick={{fontSize:9,fill:"#6b7280"}} axisLine={false} tickLine={false}/>
                      <YAxis hide/>
                      <Tooltip contentStyle={{background:"#1f2937",border:"none",borderRadius:8,color:"#f1f5f9",fontSize:12}}/>
                      <Bar dataKey="value" radius={[4,4,0,0]}>{stageData.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:14,padding:"20px"}}>
                  <div style={{fontSize:11,color:"#4b5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Por tipo de propiedad</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={tipoData} barSize={22} layout="vertical">
                      <XAxis type="number" hide/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:"#6b7280"}} width={70} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:"#1f2937",border:"none",borderRadius:8,color:"#f1f5f9",fontSize:12}}/>
                      <Bar dataKey="value" radius={[0,4,4,0]}>{tipoData.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:14,padding:"20px"}}>
                  <div style={{fontSize:11,color:"#4b5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Fuente de leads</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={fuenteData} cx="50%" cy="50%" outerRadius={55} dataKey="value" paddingAngle={3}>
                        {fuenteData.map((e,i)=><Cell key={i} fill={FUENTE_COLORS[e.name]||"#64748b"}/>)}
                      </Pie>
                      <Legend iconSize={7} formatter={v=><span style={{fontSize:10,color:"#9ca3af"}}>{v}</span>}/>
                      <Tooltip contentStyle={{background:"#1f2937",border:"none",borderRadius:8,color:"#f1f5f9",fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:14,padding:"20px"}}>
                <div style={{fontSize:11,color:"#4b5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Tendencia — últimos 6 meses</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2030"/>
                    <XAxis dataKey="mes" tick={{fontSize:10,fill:"#6b7280"}} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip contentStyle={{background:"#1f2937",border:"none",borderRadius:8,color:"#f1f5f9",fontSize:12}}/>
                    <Line type="monotone" dataKey="leads" stroke="#22d3ee" strokeWidth={2.5} dot={{fill:"#22d3ee",r:3,strokeWidth:0}} name="Leads"/>
                    <Line type="monotone" dataKey="cierres" stroke="#10b981" strokeWidth={2.5} dot={{fill:"#10b981",r:3,strokeWidth:0}} name="Cierres"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ PIPELINE ══ */}
          {tab==="pipeline"&&(
            <div className="fi">
              {/* Filters */}
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                <select value={filterTipo} onChange={e=>setFilterTipo(e.target.value)} style={selStyle}>
                  <option>Todos</option>
                  {TIPO_PROPIEDAD.map(t=><option key={t}>{t}</option>)}
                </select>
                <select value={filterAsesor} onChange={e=>setFilterAsesor(e.target.value)} style={selStyle}>
                  <option>Todos</option>
                  {ASESORES.map(a=><option key={a}>{a}</option>)}
                </select>
                <span style={{fontSize:12,color:"#4b5563",marginLeft:"auto"}}>{filteredLeads.filter(l=>l.stage!=="Perdido").length} leads</span>
              </div>
              {/* Stage pills */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {STAGES.map(s=>(
                  <div key={s} style={{display:"flex",alignItems:"center",gap:5,background:"#0d1117",border:"1px solid #1a2030",borderRadius:7,padding:"4px 10px"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:STAGE_CFG[s].dot}}/>
                    <span style={{fontSize:10,color:"#6b7280"}}>{s.replace("Visita Agendada","V.Ag.").replace("Lead Nuevo","Nuevo")}</span>
                    <span style={{fontSize:10,fontWeight:800,color:STAGE_CFG[s].dot,fontFamily:"'DM Mono',monospace"}}>{filteredLeads.filter(l=>l.stage===s).length}</span>
                  </div>
                ))}
              </div>
              {/* Kanban */}
              <div style={{overflowX:"auto",paddingBottom:16}}>
                <div style={{display:"flex",gap:14,minWidth:STAGES.length*244+"px"}}>
                  {STAGES.map(stage=>{
                    const cfg=STAGE_CFG[stage];
                    const sl=filteredLeads.filter(l=>l.stage===stage);
                    return (
                      <div key={stage} style={{width:230,flexShrink:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:cfg.dot}}/>
                          <span style={{fontSize:10,fontWeight:700,color:cfg.dot,textTransform:"uppercase",letterSpacing:"0.07em"}}>{stage}</span>
                          <span style={{marginLeft:"auto",background:"#111827",color:"#6b7280",fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:99}}>{sl.length}</span>
                        </div>
                        <div style={{minHeight:50}}>
                          {sl.map(l=><LeadCard key={l.id} lead={l} onOpen={setSelectedLead}/>)}
                          {sl.length===0&&<div style={{border:"1px dashed #1f2937",borderRadius:10,height:60,display:"flex",alignItems:"center",justifyContent:"center",color:"#374151",fontSize:11}}>vacío</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ SEGUIMIENTOS ══ */}
          {tab==="seguimientos"&&(
            <div className="fi">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:24}}>
                <div style={{fontSize:13,color:"#6b7280"}}>{hoySeg.length} leads esperando seguimiento</div>
                {sinSeg.length>0&&(
                  <div style={{background:"#130808",border:"1px solid #ef444422",borderRadius:10,padding:"10px 16px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>⚠ {sinSeg.length} leads con +3 días</div>
                    <div style={{fontSize:12,color:"#6b2020",marginTop:2}}>{fmt(comisionRiesgo)} en riesgo</div>
                  </div>
                )}
              </div>
              {hoySeg.length===0?(
                <div style={{textAlign:"center",padding:"80px 20px",color:"#374151"}}>
                  <div style={{fontSize:56,marginBottom:16}}>✅</div>
                  <div style={{fontSize:20,fontWeight:800,color:"#6b7280",fontFamily:"'Syne',sans-serif"}}>¡Al corriente!</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,1fr)":isTablet?"repeat(2,1fr)":"1fr",gap:16}}>
                  {hoySeg.map(lead=>{
                    const dias=sinContactoDias(lead);
                    const urgente=dias>=3;
                    return (
                      <div key={lead.id} style={{background:urgente?"#110808":"#0d1117",border:`1px solid ${urgente?"#ef444422":"#1a2030"}`,borderRadius:12,padding:20}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:15,color:"#f1f5f9"}}>{lead.nombre}</div>
                            <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{lead.propiedad}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:13,fontWeight:800,color:urgente?"#ef4444":"#fbbf24",fontFamily:"'DM Mono',monospace"}}>{dias===0?"hoy":`${dias}d`}</div>
                            <div style={{fontSize:10,color:"#4b5563"}}>sin contacto</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                          <Badge color={STAGE_CFG[lead.stage].dot}>{lead.stage}</Badge>
                          <Badge color={TIPO_COLORS[lead.tipo]||"#64748b"} small>{TIPO_ICONS[lead.tipo]}</Badge>
                          <Badge color="#6b7280" small>{lead.asesor.split(" ")[0]}</Badge>
                        </div>
                        <div style={{fontSize:14,fontWeight:800,color:"#10b981",fontFamily:"'DM Mono',monospace",marginBottom:2}}>{fmt(calcComision(lead))}</div>
                        <div style={{fontSize:11,color:"#374151",marginBottom:10}}>{ESQUEMA_LABELS[lead.esquema]}</div>
                        {lead.accion&&<div style={{fontSize:11,color:"#fbbf24",marginBottom:14}}>→ {lead.accion}</div>}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                          <button className="abtn" onClick={()=>saveLead(lead.id,{dias:0})} style={{background:"#064e3b",border:"1px solid #10b98130",color:"#34d399",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"filter 0.15s"}}>✓ Contactado</button>
                          <a href={`tel:${lead.tel.replace(/\s/g,"")}`} style={{background:"#1e3a5f",border:"1px solid #3b82f630",color:"#60a5fa",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 Llamar</a>
                          <a href={`https://wa.me/52${lead.tel.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#064e3b",border:"1px solid #10b98130",color:"#34d399",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>💬 WA</a>
                        </div>
                        <button className="abtn" onClick={()=>setSelectedLead(lead)} style={{width:"100%",marginTop:8,background:"#111827",border:"1px solid #1f2937",color:"#9ca3af",borderRadius:7,padding:"7px",fontSize:11,fontWeight:600,cursor:"pointer",transition:"filter 0.15s"}}>Ver detalle →</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ RENTAS ══ */}
          {tab==="rentas"&&(
            <RentasView rentas={rentas} setRentas={setRentas} isMobile={isMobile} isTablet={isTablet} isDesktop={isDesktop}/>
          )}

          {/* ══ PROPIEDADES ══ */}
          {tab==="propiedades"&&(
            <div className="fi">
              {/* Filter by tipo */}
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["Todos",...TIPO_PROPIEDAD].map(t=>(
                  <button key={t} onClick={()=>setFilterTipo(t)} style={{background:filterTipo===t?(TIPO_COLORS[t]||"#0e7490")+"22":"#0d1117",border:`1px solid ${filterTipo===t?(TIPO_COLORS[t]||"#22d3ee")+"44":"#1a2030"}`,color:filterTipo===t?(TIPO_COLORS[t]||"#22d3ee"):"#6b7280",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
                    {t==="Todos"?"Todos":TIPO_ICONS[t]+" "+t.split("—")[0].trim()}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,1fr)":isTablet?"repeat(2,1fr)":"1fr",gap:18}}>
                {PROPIEDADES.filter(p=>filterTipo==="Todos"||p.tipo===filterTipo).map(p=>(
                  <div key={p.id} className="hov" style={{background:"#0d1117",border:"1px solid #1a2030",borderRadius:16,padding:22,transition:"all 0.22s",position:"relative",overflow:"hidden"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div style={{fontSize:38}}>{p.img}</div>
                      <div style={{background:p.disponibles<=3?"#130808":"#0a1e14",border:`1px solid ${p.disponibles<=3?"#ef444430":"#10b98130"}`,borderRadius:10,padding:"6px 14px",textAlign:"center"}}>
                        <div style={{fontSize:22,fontWeight:900,color:p.disponibles<=3?"#ef4444":"#34d399",fontFamily:"'DM Mono',monospace"}}>{p.disponibles}</div>
                        <div style={{fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.06em"}}>disponibles</div>
                      </div>
                    </div>
                    <Badge color={TIPO_COLORS[p.tipo]||"#64748b"} small>{TIPO_ICONS[p.tipo]} {p.tipo}</Badge>
                    <div style={{fontWeight:800,fontSize:17,color:"#f1f5f9",fontFamily:"'Syne',sans-serif",marginTop:10,marginBottom:2}}>{p.nombre}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>{p.zona}</div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>
                        {p.tipo.includes("Renta")?"Renta mensual desde":"Precio desde"}
                      </div>
                      <div style={{fontSize:22,fontWeight:900,color:"#22d3ee",fontFamily:"'DM Mono',monospace"}}>{fmt(p.precio)}</div>
                      <div style={{fontSize:11,color:"#1f2937",marginTop:3}}>
                        {p.tipo.includes("Renta")?`tu comisión: ${fmt(p.precio)} (1 mes)`:p.tipo.includes("Administración")?`admin mensual: ${fmt(p.precio*0.10)}`:`tu comisión: ${fmt(p.precio*0.03)}`}
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {p.amenidades.map(a=><span key={a} style={{background:"#111827",color:"#6b7280",fontSize:10,padding:"3px 8px",borderRadius:6}}>{a}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ EQUIPO ══ */}
          {tab==="equipo"&&(
            <EquipoView leads={leads} isMobile={isMobile} isTablet={isTablet} isDesktop={isDesktop}/>
          )}

        </div>
      </div>

      {isMobile&&<BottomNav/>}

      {selectedLead&&(
        <LeadModal lead={selectedLead} onClose={()=>setSelectedLead(null)} onSave={(id,u)=>{saveLead(id,u);setSelectedLead(null);}} onMove={moveStage}/>
      )}
      {showAdd&&(
        <AddLeadModal onClose={()=>setShowAdd(false)} onAdd={addLead}/>
      )}
    </div>
  );
}
