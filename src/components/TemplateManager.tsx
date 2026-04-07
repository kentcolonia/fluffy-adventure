import React from 'react';
import { Download, Loader2, Upload, Settings, Image as ImageIcon, Save, Printer, RefreshCw, Undo, Redo, Grid, Magnet, X, MousePointer2, LayoutTemplate, Layers, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { API_URL } from '../types';
import type { IDField, IDSide, IDTemplate, ShapeElement } from '../types';
import { hexToColorFilter, hexToColorFilterWhite } from '../utils';

// ── DEFAULT FIELDS ──
const defaultFrontFields: IDField[] = [
  { id: 'nickname', label: 'First Name / Nickname', value: 'JESUS', x: 35, y: 86, fontSize: 22, color: '#ffffff', bold: true, italic: false, align: 'left', visible: false },
  { id: 'idnum',    label: 'ID Number',              value: 'ABISC-231003', x: 32, y: 92, fontSize: 10, color: '#ffffff', bold: false, italic: false, align: 'left', visible: true },
  { id: 'fullname', label: 'Full Name',               value: 'JESUS B. ILLUSTRISIMO', x: 13, y: 75, fontSize: 10, color: '#ffffff', bold: true, italic: false, align: 'left', visible: true },
  { id: 'position', label: 'Position / Designation',  value: 'ASSISTANT PORT ENGINEER', x: 13, y: 79, fontSize: 9, color: '#ffffff', bold: false, italic: false, align: 'left', visible: true },
];

const defaultBackFields: IDField[] = [
  { id: 'emergency_person', label: 'Emergency Contact Person', value: 'Contact Person Name', x: 43, y: 15, fontSize: 10, color: '#ffffff', bold: false, italic: false, align: 'center', visible: true },
  { id: 'emergency_num',    label: 'Emergency Number',         value: '09123456789',         x: 35, y: 20, fontSize: 10, color: '#ffffff', bold: false,  italic: false, align: 'center', visible: true },
];

// ── SHARED STYLES & COMPONENTS ──
const inpStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', 
  padding: '8px 12px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
};

const SegmentedControl = ({ options, value, onChange }: { options: {label:string, value:string}[], value: string, onChange: (v:string)=>void }) => (
  <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: '100%' }}>
    {options.map(opt => {
      const active = value === opt.value;
      return (
        <button key={opt.value} onClick={(e) => { e.preventDefault(); onChange(opt.value); }}
          style={{
            flex: 1, padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            background: active ? '#fff' : 'transparent', color: active ? '#0f172a' : '#64748b',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ── ACCORDION SECTION ──
const AccSection = React.memo(({ id, icon, title, open, onToggle, children }: {
  id: string; icon: React.ReactNode; title: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode;
}) => (
  <div style={{borderBottom:'1px solid #e2e8f0'}}>
    <button onClick={()=>onToggle(id)}
      style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:open?'#f8fafc':'#fff',border:'none',cursor:'pointer',textAlign:'left',transition:'background 0.2s'}}>
      <span style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'14px',fontWeight:600,color:open?'#667eea':'#475569'}}>
        <span style={{color:open?'#667eea':'#94a3b8'}}>{icon}</span>{title}
      </span>
      <span style={{color:'#94a3b8',fontSize:'11px',transform:open?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▼</span>
    </button>
    {open && <div style={{padding:'16px 20px',background:'#fff',display:'flex',flexDirection:'column',gap:'12px'}}>{children}</div>}
  </div>
));

// ── LAYER EDITOR (Properties Panel) ──
interface LayerEditorProps { layer: 'photo' | 'sig'; side: IDSide; onUpdate: (updates: Partial<IDSide>) => void; }
const LayerEditor = React.memo(({ layer, side: sd, onUpdate }: LayerEditorProps) => {
  const isPhoto = layer === 'photo';
  const accentColor = isPhoto ? '#3b82f6' : '#8b5cf6';

  const sliderRow = (lbl: string, val: number, min: number, max: number, key: string, accent: string) => (
    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
      <label style={{fontSize:'11px',color:'#64748b',minWidth:'64px',fontWeight:500}}>{lbl}</label>
      <input type="range" min={min} max={max} step={1} value={val} onChange={e=>onUpdate({[key]:Number(e.target.value)})} style={{flex:1,accentColor:accent}}/>
      <span style={{fontSize:'12px',fontWeight:600,color:'#0f172a',minWidth:'34px',textAlign:'right'}}>{val}{max===100&&min===0?'%':''}</span>
    </div>
  );
  const colorRow = (lbl: string, val: string, key: string) => (
    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
      <label style={{fontSize:'11px',color:'#64748b',minWidth:'64px',fontWeight:500}}>{lbl}</label>
      <input type="color" value={val} onChange={e=>onUpdate({[key]:e.target.value})} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0,background:'#fff'}}/>
      <input type="text" value={val} onChange={e=>onUpdate({[key]:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'6px 10px',fontSize:'12px',fontFamily:'monospace',outline:'none',color:'#0f172a'}}/>
    </div>
  );
  const panel = (title: string, children: React.ReactNode) => (
    <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'12px',boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}}>
      <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'2px'}}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
      {panel('Position & Size',
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          {(isPhoto?[{l:'X %',k:'photoX',v:sd.photoX},{l:'Y %',k:'photoY',v:sd.photoY},{l:'Width %',k:'photoW',v:sd.photoW},{l:'Height %',k:'photoH',v:sd.photoH}]:[{l:'X %',k:'sigX',v:sd.sigX},{l:'Y %',k:'sigY',v:sd.sigY},{l:'Width %',k:'sigW',v:sd.sigW},{l:'Height %',k:'sigH',v:sd.sigH}]).map(({l,k,v})=>(
            <div key={k}>
              <label style={{fontSize:'11px',color:'#64748b',display:'block',marginBottom:'4px',fontWeight:500}}>{l}</label>
              <input type="number" value={v} min={0} max={100} onChange={e=>onUpdate({[k]:Number(e.target.value)})} style={{...inpStyle,padding:'6px 8px'}}/>
            </div>
          ))}
        </div>
      )}
      {!isPhoto && panel('Recolor Signature',
        <>
          <p style={{margin:'0 0 4px',fontSize:'11px',color:'#64748b',lineHeight:'1.5'}}>Select source ink type, then pick target color.</p>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={()=>onUpdate({sigInkDark:true})} style={{flex:1,padding:'8px',borderRadius:'8px',border:(sd.sigInkDark!==false)?'1px solid #8b5cf6':'1px solid #e2e8f0',background:(sd.sigInkDark!==false)?'#8b5cf615':'#fff',color:(sd.sigInkDark!==false)?'#7c3aed':'#64748b',cursor:'pointer',fontSize:'12px',fontWeight:600}}>🖊 Dark Ink</button>
            <button onClick={()=>onUpdate({sigInkDark:false})} style={{flex:1,padding:'8px',borderRadius:'8px',border:(sd.sigInkDark===false)?'1px solid #8b5cf6':'1px solid #e2e8f0',background:(sd.sigInkDark===false)?'#8b5cf615':'#fff',color:(sd.sigInkDark===false)?'#7c3aed':'#64748b',cursor:'pointer',fontSize:'12px',fontWeight:600}}>✒ White Ink</button>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',background:sd.sigColorize?'#8b5cf615':'#fff',border:`1px solid ${sd.sigColorize?'#8b5cf6':'#e2e8f0'}`,borderRadius:'8px',cursor:'pointer',marginTop:'4px'}}>
            <input type="checkbox" checked={!!sd.sigColorize} onChange={e=>onUpdate({sigColorize:e.target.checked})} style={{accentColor:'#7c3aed',width:'16px',height:'16px'}}/>
            <span style={{fontSize:'13px',fontWeight:600,color:sd.sigColorize?'#7c3aed':'#475569'}}>{sd.sigColorize?'Recolor ON':'Recolor OFF'}</span>
          </label>
          {sd.sigColorize && colorRow('Target Color', sd.sigColorizeColor||'#ffffff', 'sigColorizeColor')}
          {sd.sigColorize && (
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'4px'}}>
              {[{c:'#ffffff',l:'White'},{c:'#0f172a',l:'Navy'},{c:'#000000',l:'Black'},{c:'#f59e0b',l:'Gold'}].map(({c,l})=>(
                <button key={c} onClick={()=>onUpdate({sigColorizeColor:c})} style={{padding:'4px 10px',borderRadius:'6px',border:`1px solid ${(sd.sigColorizeColor||'#ffffff')===c?accentColor:'#e2e8f0'}`,background:c,color:c==='#ffffff'||c==='#f59e0b'?'#0f172a':'#fff',fontSize:'11px',fontWeight:600,cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {isPhoto && panel('Color Overlay',
        <>
          <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',background:sd.photoColorize?'#3b82f615':'#fff',border:`1px solid ${sd.photoColorize?'#3b82f6':'#e2e8f0'}`,borderRadius:'8px',cursor:'pointer'}}>
            <input type="checkbox" checked={!!sd.photoColorize} onChange={e=>onUpdate({photoColorize:e.target.checked})} style={{accentColor:'#3b82f6',width:'16px',height:'16px'}}/>
            <span style={{fontSize:'13px',fontWeight:600,color:sd.photoColorize?'#2563eb':'#475569'}}>{sd.photoColorize?'Colorize ON':'Colorize OFF'}</span>
          </label>
          {sd.photoColorize && colorRow('Color', sd.photoColorizeColor||'#000080', 'photoColorizeColor')}
        </>
      )}
      {panel('Brightness & Contrast',
        <>
          {sliderRow('Brightness',(isPhoto?sd.photoBrightness:sd.sigBrightness)??100,0,200,isPhoto?'photoBrightness':'sigBrightness','#f59e0b')}
          {sliderRow('Contrast',(isPhoto?sd.photoContrast:sd.sigContrast)??100,0,200,isPhoto?'photoContrast':'sigContrast','#06b6d4')}
          <button onClick={()=>onUpdate(isPhoto?{photoBrightness:100,photoContrast:100}:{sigBrightness:100,sigContrast:100})}
            style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontSize:'11px',fontWeight:600,alignSelf:'flex-start',marginTop:'4px',transition:'background 0.2s'}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
            Reset Settings
          </button>
        </>
      )}
      {panel(isPhoto?'Photo Stroke':'Signature Border',
        <>
          {sliderRow('Width',(isPhoto?sd.photoStrokeWidth:sd.sigStrokeWidth)||0,0,16,isPhoto?'photoStrokeWidth':'sigStrokeWidth',accentColor)}
          {colorRow('Color',(isPhoto?sd.photoStrokeColor:sd.sigStrokeColor)||'#ffffff',isPhoto?'photoStrokeColor':'sigStrokeColor')}
        </>
      )}
      {panel(isPhoto?'Photo Shadow':'Signature Shadow',
        <>
          {sliderRow('Blur',(isPhoto?sd.photoShadowBlur:sd.sigShadowBlur)||0,0,30,isPhoto?'photoShadowBlur':'sigShadowBlur','#64748b')}
          {colorRow('Color',(isPhoto?sd.photoShadowColor:sd.sigShadowColor)||'#000000',isPhoto?'photoShadowColor':'sigShadowColor')}
        </>
      )}
      <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 16px',background:(isPhoto?sd.showPhoto:sd.showSig)?'#10b98115':'#ef444415',border:`1px solid ${(isPhoto?sd.showPhoto:sd.showSig)?'#10b981':'#ef4444'}`,borderRadius:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={isPhoto?sd.showPhoto:sd.showSig} onChange={e=>onUpdate(isPhoto?{showPhoto:e.target.checked}:{showSig:e.target.checked})} style={{accentColor:(isPhoto?sd.showPhoto:sd.showSig)?'#10b981':'#ef4444',width:'18px',height:'18px'}}/>
        <span style={{fontSize:'13px',fontWeight:600,color:(isPhoto?sd.showPhoto:sd.showSig)?'#059669':'#dc2626'}}>{(isPhoto?sd.showPhoto:sd.showSig)?'Layer is visible on card':'Layer is hidden from card'}</span>
      </label>
    </div>
  );
});

// ── FIELD EDITOR (Properties Panel) ──
interface FieldEditorProps { field: IDField; onUpdate: (id: string, updates: Partial<IDField>) => void; }
const FieldEditor = React.memo(({ field, onUpdate }: FieldEditorProps) => {
  const [localVal, setLocalVal] = React.useState(field.value);
  const lastId = React.useRef(field.id);
  if (field.id !== lastId.current) { lastId.current = field.id; setLocalVal(field.value); }
  const lastVal = React.useRef(field.value);
  if (field.value !== lastVal.current && field.value !== localVal) { lastVal.current = field.value; setLocalVal(field.value); }

  const panel = (title: string, children: React.ReactNode) => (
    <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'12px',boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}}>
      <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'2px'}}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
      <div>
        <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'6px'}}>Text Content</label>
        <textarea value={localVal} rows={3} onChange={e=>{setLocalVal(e.target.value); onUpdate(field.id,{value:e.target.value});}} style={{...inpStyle,resize:'vertical',fontFamily:'inherit',lineHeight:'1.5'}}/>
      </div>
      
      {panel('Typography', <>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
            <label style={{fontSize:'11px',fontWeight:600,color:'#475569'}}>Font Size</label>
            <span style={{fontSize:'12px',fontWeight:700,color:'#667eea'}}>{field.fontSize}px</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <button onClick={()=>onUpdate(field.id,{fontSize:Math.max(6,field.fontSize-1)})} style={{width:'32px',height:'32px',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#fff',cursor:'pointer',fontSize:'16px',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
            <input type="range" min={6} max={60} value={field.fontSize} onChange={e=>onUpdate(field.id,{fontSize:Number(e.target.value)})} style={{flex:1,accentColor:'#667eea'}}/>
            <button onClick={()=>onUpdate(field.id,{fontSize:Math.min(60,field.fontSize+1)})} style={{width:'32px',height:'32px',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#fff',cursor:'pointer',fontSize:'16px',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
          </div>
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'#475569',marginBottom:'6px'}}>Color</label>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input type="color" value={field.color} onChange={e=>onUpdate(field.id,{color:e.target.value})} style={{width:'40px',height:'40px',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',padding:'2px',flexShrink:0,background:'#fff'}}/>
            <input type="text" value={field.color} onChange={e=>onUpdate(field.id,{color:e.target.value})} style={{...inpStyle,fontFamily:'monospace',height:'40px'}}/>
          </div>
          <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
            {['#ffffff','#0f172a','#667eea','#ec4899','#10b981','#f59e0b','#ef4444','#8b5cf6'].map(t=>(
              <button key={t} onClick={()=>onUpdate(field.id,{color:t})} style={{width:'24px',height:'24px',borderRadius:'50%',background:t,border:field.color===t?'2px solid #667eea':'1px solid #e2e8f0',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}/>
            ))}
          </div>
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'#475569',marginBottom:'6px'}}>Font Family</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {([
                {label:'Sans-Serif', value:"'Inter','Segoe UI',sans-serif"},
                {label:'Serif',      value:"Georgia,'Times New Roman',serif"},
                {label:'Monospace',  value:"'Courier New',monospace"},
                {label:'Narrow',     value:"'Arial Narrow',Impact,sans-serif"},
                {label:'BankGothic', value:"'Bebas Neue','Rajdhani',Impact,sans-serif"},
                {label:'Orbitron',   value:"'Orbitron','Rajdhani',sans-serif"},
              ] as const).map(f=>{
              const active=(field.fontFamily||"'Orbitron','Rajdhani',sans-serif").includes(f.value.split(',')[0]);
              return <button key={f.value} onClick={()=>onUpdate(field.id,{fontFamily:f.value})} style={{padding:'8px 4px',borderRadius:'8px',border:active?'1px solid #667eea':'1px solid #e2e8f0',background:active?'#667eea10':'#fff',color:active?'#667eea':'#64748b',cursor:'pointer',fontSize:'11px',fontWeight:active?600:400,fontFamily:f.value,textAlign:'center'}}>{f.label}</button>;
            })}
          </div>
        </div>
      </>)}

      <div>
        <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'8px'}}>Style & Alignment</label>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>onUpdate(field.id,{bold:!field.bold})} style={{flex:1,padding:'8px',borderRadius:'8px',border:field.bold?'1px solid #667eea':'1px solid #e2e8f0',background:field.bold?'#667eea10':'#fff',color:field.bold?'#667eea':'#64748b',cursor:'pointer',fontWeight:800,fontSize:'14px'}}>B</button>
          <button onClick={()=>onUpdate(field.id,{italic:!field.italic})} style={{flex:1,padding:'8px',borderRadius:'8px',border:field.italic?'1px solid #667eea':'1px solid #e2e8f0',background:field.italic?'#667eea10':'#fff',color:field.italic?'#667eea':'#64748b',cursor:'pointer',fontStyle:'italic',fontSize:'14px',fontWeight:600}}>I</button>
          <button onClick={()=>onUpdate(field.id,{underline:!field.underline})} style={{flex:1,padding:'8px',borderRadius:'8px',border:field.underline?'1px solid #667eea':'1px solid #e2e8f0',background:field.underline?'#667eea10':'#fff',color:field.underline?'#667eea':'#64748b',cursor:'pointer',textDecoration:'underline',fontSize:'14px',fontWeight:600}}>U</button>
          {(['left','center','right'] as const).map(a=>(
            <button key={a} onClick={()=>onUpdate(field.id,{align:a})} style={{flex:1,padding:'8px',borderRadius:'8px',border:field.align===a?'1px solid #667eea':'1px solid #e2e8f0',background:field.align===a?'#667eea10':'#fff',color:field.align===a?'#667eea':'#64748b',cursor:'pointer',fontSize:'13px',fontWeight:600}}>
              {a==='left'?'←':a==='center'?'↔':'→'}
            </button>
          ))}
        </div>
      </div>

      {panel('Position & Size',
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          {([{label:'X %',key:'x',val:field.x,min:0,max:100,step:0.5},{label:'Y %',key:'y',val:field.y,min:0,max:100,step:0.5},{label:'Width %',key:'w',val:field.w??90,min:5,max:100,step:1}] as const).map(({label,key,val,min,max,step})=>(
            <div key={key}>
              <label style={{fontSize:'11px',color:'#64748b',display:'block',marginBottom:'4px',fontWeight:500}}>{label}</label>
              <input type="number" value={Math.round(Number(val)*10)/10} min={min} max={max} step={step} onChange={e=>onUpdate(field.id,{[key]:Number(e.target.value)})} style={{...inpStyle,padding:'6px 8px'}}/>
            </div>
          ))}
        </div>
      )}

      {panel('Effects', <>
        <div style={{marginBottom:'10px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:'#475569',marginBottom:'6px'}}>Text Stroke</div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <input type="range" min={0} max={8} step={0.5} value={field.strokeWidth||0} onChange={e=>onUpdate(field.id,{strokeWidth:Number(e.target.value)})} style={{flex:1,accentColor:'#667eea'}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:'#0f172a',minWidth:'28px',textAlign:'right'}}>{field.strokeWidth||0}px</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <input type="color" value={field.strokeColor||'#000000'} onChange={e=>onUpdate(field.id,{strokeColor:e.target.value})} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0,background:'#fff'}}/>
            <input type="text" value={field.strokeColor||'#000000'} onChange={e=>onUpdate(field.id,{strokeColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'6px 10px',fontSize:'12px',fontFamily:'monospace',color:'#0f172a',outline:'none'}}/>
          </div>
        </div>
        <div>
          <div style={{fontSize:'11px',fontWeight:600,color:'#475569',marginBottom:'6px'}}>Text Shadow</div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <input type="range" min={0} max={20} step={1} value={field.shadowBlur||0} onChange={e=>onUpdate(field.id,{shadowBlur:Number(e.target.value)})} style={{flex:1,accentColor:'#64748b'}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:'#0f172a',minWidth:'28px',textAlign:'right'}}>{field.shadowBlur||0}px</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <input type="color" value={field.shadowColor||'#000000'} onChange={e=>onUpdate(field.id,{shadowColor:e.target.value})} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0,background:'#fff'}}/>
            <input type="text" value={field.shadowColor||'#000000'} onChange={e=>onUpdate(field.id,{shadowColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'6px 10px',fontSize:'12px',fontFamily:'monospace',color:'#0f172a',outline:'none'}}/>
          </div>
        </div>
      </>)}

      <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 16px',background:field.visible?'#10b98115':'#ef444415',border:`1px solid ${field.visible?'#10b981':'#ef4444'}`,borderRadius:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={field.visible} onChange={e=>onUpdate(field.id,{visible:e.target.checked})} style={{accentColor:field.visible?'#10b981':'#ef4444',width:'18px',height:'18px'}}/>
        <span style={{fontSize:'13px',fontWeight:600,color:field.visible?'#059669':'#dc2626'}}>{field.visible?'Field is visible on card':'Field is hidden'}</span>
      </label>
    </div>
  );
});


// ── MAIN ID BUILDER COMPONENT ──
interface TemplateManagerProps {
  editingTemplate?: IDTemplate | null;
  onBack?: () => void;
}
export default function TemplateManager({ editingTemplate, onBack }: TemplateManagerProps) {
  const CARD_W = 214, CARD_H = 340; // CR80 portrait: 54mm x 85.6mm

  // ── core state ──
  const [activeSide, setActiveSide] = React.useState<'front'|'back'>('front');
  const getMobileZoom = () => {
    if (typeof window === 'undefined') return 1.0;
    if (window.innerWidth < 768) {
      // Fit card with some padding on mobile
      return Math.min((window.innerWidth - 48) / 214, 1.2);
    }
    return 1.0;
  };
  const [zoom, setZoom] = React.useState(getMobileZoom);
  const [showGrid, setShowGrid]     = React.useState(false);
  const [snap, setSnap]             = React.useState(true);

  // ── left panel tab ──
  const [leftTab, setLeftTab] = React.useState<'layers'|'elements'|'background'>('layers');

  // ── shape state ──
  const [selectedShapeId, setSelectedShapeId] = React.useState<string|null>(null);
  const [draggingShapeId, setDraggingShapeId] = React.useState<string|null>(null);
  const [shapeDragOffset, setShapeDragOffset] = React.useState({x:0,y:0});
  const [resizingShape, setResizingShape] = React.useState<{id:string,handle:string}|null>(null);
  const [shapeResizeStart, setShapeResizeStart] = React.useState({mouseX:0,mouseY:0,w:0,h:0,x:0,y:0});

  const addShape = (type: ShapeElement['type']) => {
    const newShape: ShapeElement = {
      id: `shape_${Date.now()}`,
      type,
      x: 50, y: 50,
      w: type==='line'?60:40,
      h: type==='line'?4:30,
      fill: type==='line'?'transparent':'#667eea',
      fillOpacity: 80,
      stroke: '#667eea',
      strokeWidth: type==='line'?3:0,
      borderRadius: type==='rect'?4:0,
    };
    setSide((p:IDSide)=>({...p, shapes:[...(p.shapes||[]),newShape]}));
    setSelectedShapeId(newShape.id);
    setSelectedFieldId(null); setSelectedLayer(null); setSelectedQR(false);
  };

  const addTextBox = () => {
    const newField: IDField = {
      id: `text_${Date.now()}`,
      label: 'Text Box',
      value: 'Text',
      x: 50, y: 50,
      fontSize: 14, color: '#ffffff',
      bold: false, italic: false, align: 'center', visible: true, w: 80,
    };
    setSide((p:IDSide)=>({...p, fields:[...p.fields, newField]}));
    setSelectedFieldId(newField.id);
    setSelectedShapeId(null); setSelectedLayer(null); setSelectedQR(false);
  };

  const updateShape = (id:string, updates:Partial<ShapeElement>) =>
    setSide((p:IDSide)=>({...p, shapes:(p.shapes||[]).map((s:ShapeElement)=>s.id===id?{...s,...updates}:s)}));

  const deleteShape = (id:string) => {
    setSide((p:IDSide)=>({...p, shapes:(p.shapes||[]).filter((s:ShapeElement)=>s.id!==id)}));
    setSelectedShapeId(null);
  };

  const deleteField = (id:string) => {
    setSide((p:IDSide)=>({...p, fields:p.fields.filter((f:IDField)=>f.id!==id)}));
    setSelectedFieldId(null);
  };

  // ── accordion open state ──
  const [openSection, setOpenSection] = React.useState<string>('employee');
  const toggleSection = (s: string) => setOpenSection(p => p === s ? '' : s);

  // ── field interaction ──
  const [selectedFieldId, setSelectedFieldId] = React.useState<string|null>(null);
  const [selectedLayer,   setSelectedLayer]   = React.useState<'photo'|'sig'|null>(null);
  const [draggingId,      setDraggingId]      = React.useState<string|null>(null);
  const [dragOffset,      setDragOffset]      = React.useState({x:0,y:0});
  const [draggingLayer,   setDraggingLayer]   = React.useState<'photo'|'sig'|null>(null);
  const [layerDragOffset, setLayerDragOffset] = React.useState({x:0,y:0});
  const [resizingLayer,   setResizingLayer]   = React.useState<{layer:'photo'|'sig', handle:string}|null>(null);
  const [resizeStart,     setResizeStart]     = React.useState({mouseX:0,mouseY:0,w:0,h:0,x:0,y:0});
  const pendingDrag = React.useRef<{type:'field'|'layer'|'shape', id:string, startX:number, startY:number, offset:{x:number,y:number}}|null>(null);
  const isDragging  = React.useRef(false);
  const cardFrontRef = React.useRef<HTMLDivElement>(null);
  const cardBackRef  = React.useRef<HTMLDivElement>(null);

  // ── employee ──

  // ── card data ──
  const [front, setFront] = React.useState<IDSide>(
    editingTemplate?.front ?? {
      background:null, fields: defaultFrontFields,
      photoX:50, photoY:48, photoW:70, photoH:44, showPhoto:true,
      sigX:35,   sigY:86,  sigW:40,  sigH:8,   showSig:true,
    }
  );
  const [back, setBack] = React.useState<IDSide>(
    editingTemplate?.back ?? {
      background:null, fields: defaultBackFields,
      photoX:50, photoY:48, photoW:70, photoH:50, showPhoto:false,
      sigX:35,   sigY:85,  sigW:40,  sigH:8,   showSig:false,
      showQR:true, qrX:50, qrY:42, qrSize:70,
      qrUrl:'https://employee.avegabros.com/verify/',
      qrFg:'#000000', qrBg:'#ffffff',
    }
  );

  // ── history ──
  const [history,    setHistory]    = React.useState<{front:IDSide;back:IDSide}[]>([]);
  const [historyIdx, setHistoryIdx] = React.useState(-1);
  const pushHistory = React.useCallback((f:IDSide,b:IDSide) => {
    setHistory(p => [...p.slice(0,historyIdx+1),{front:f,back:b}].slice(-40));
    setHistoryIdx(p => Math.min(p+1,39));
  },[historyIdx]);
  const undo = () => { if(historyIdx<=0) return; const i=historyIdx-1; setFront(history[i].front); setBack(history[i].back); setHistoryIdx(i); };
  const redo = () => { if(historyIdx>=history.length-1) return; const i=historyIdx+1; setFront(history[i].front); setBack(history[i].back); setHistoryIdx(i); };

  React.useEffect(() => {
    const h = (e:KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();}
      if ((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo();}
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  });

  // ── templates ──
  const [templates,       setTemplates]       = React.useState<IDTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [templateName,    setTemplateName]    = React.useState('');
  const [templateCompany, setTemplateCompany] = React.useState('');
  React.useEffect(()=>{ fetch(`${API_URL}/templates`).then(r=>r.ok?r.json():[]).then(setTemplates).catch(()=>{}); },[]);

  // ── notifications ──
  const [msg,       setMsg]       = React.useState<{type:'success'|'error';text:string}|null>(null);
  const [savingTemplate,  setSavingTemplate]  = React.useState(false);
  const [showFlip,  setShowFlip]  = React.useState(false);

  // ── Mobile responsive ──
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = React.useState<'layers'|'canvas'|'props'>('canvas');
  React.useEffect(() => {
    const h = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setZoom(Math.min((window.innerWidth - 48) / 214, 1.2));
      else setZoom(1.0);
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);


  const [flipFace,  setFlipFace]  = React.useState<'front'|'back'>('front');
  const [flipAnim,  setFlipAnim]  = React.useState(false);
  const [frontUrl,  setFrontUrl]  = React.useState<string|null>(null);
  const [backUrl,   setBackUrl]   = React.useState<string|null>(null);

  React.useEffect(()=>{
    if(!showFlip) return;
    (async()=>{
      const [f,b] = await Promise.all([renderSide('front'),renderSide('back')]);
      setFrontUrl(f); setBackUrl(b); setFlipFace('front'); setFlipAnim(false);
    })();
  },[showFlip]);

  const doFlip = ()=>{
    setFlipAnim(true);
    setTimeout(()=>{ setFlipFace(p=>p==='front'?'back':'front'); setFlipAnim(false); },300);
  };

  const handlePrint = async()=>{
    const [fUrl, bUrl] = await Promise.all([renderSide('front'), renderSide('back')]);
    const win = window.open('','_blank');
    if(!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Print ID Card</title>
    <style>
      @page { size: 54mm 85.6mm; margin: 0; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:#fff; }
      .card { width:54mm; height:85.6mm; position:relative; overflow:hidden; break-after:page; }
      .card img { width:100%; height:100%; object-fit:fill; display:block; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    </style></head><body>
    <div class="card"><img src="${fUrl}"/></div>
    <div class="card"><img src="${bUrl}"/></div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 500);
  };
  const showMsg = (type:'success'|'error', text:string) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3000); };

  // ── helpers ──
  const side    = activeSide==='front' ? front : back;
  const setSide = activeSide==='front' ? setFront : setBack;
  const activeRef = activeSide==='front' ? cardFrontRef : cardBackRef;
  const selectedField = side.fields.find((f:IDField)=>f.id===selectedFieldId)||null;
  const selectedShape = (side.shapes||[]).find((s:ShapeElement)=>s.id===selectedShapeId)||null;

  const updateField = (id:string, updates:Partial<IDField>) =>
    setSide((p:IDSide)=>({...p, fields:p.fields.map((f:IDField)=>f.id===id?{...f,...updates}:f)}));
  const updateSideProps = (updates:Partial<IDSide>) =>
    setSide((p:IDSide)=>({...p,...updates}));



  const handleBgUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const r=new FileReader(); r.onload=()=>updateSideProps({background:r.result as string}); r.readAsDataURL(file); e.target.value='';
  };

  const employeePhoto: string | null = null; // Templates use placeholder
  const employeeSig: string | null = null; // Templates use placeholder
  const DUMMY_PHOTO = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#cbd5e1"/><circle cx="50" cy="38" r="18" fill="#94a3b8"/><ellipse cx="50" cy="80" rx="28" ry="20" fill="#94a3b8"/><text x="50" y="58" text-anchor="middle" fill="#64748b" font-size="10" font-family="sans-serif">PHOTO</text></svg>`);
  const DUMMY_SIG = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect width="200" height="60" fill="transparent"/><path d="M10 40 Q30 10 50 35 Q70 55 90 25 Q110 5 130 30 Q150 50 170 20 Q185 5 195 25" stroke="#94a3b8" stroke-width="3" fill="none" stroke-linecap="round"/><text x="100" y="55" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="sans-serif">SIGNATURE</text></svg>`);
  const DUMMY_QR = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ffffff"/><rect x="5" y="5" width="35" height="35" fill="none" stroke="#000" stroke-width="4"/><rect x="13" y="13" width="19" height="19" fill="#000"/><rect x="60" y="5" width="35" height="35" fill="none" stroke="#000" stroke-width="4"/><rect x="68" y="13" width="19" height="19" fill="#000"/><rect x="5" y="60" width="35" height="35" fill="none" stroke="#000" stroke-width="4"/><rect x="13" y="68" width="19" height="19" fill="#000"/><rect x="60" y="60" width="8" height="8" fill="#000"/><rect x="72" y="60" width="8" height="8" fill="#000"/><rect x="84" y="60" width="8" height="8" fill="#000"/><rect x="60" y="72" width="8" height="8" fill="#000"/><rect x="84" y="72" width="8" height="8" fill="#000"/><rect x="60" y="84" width="8" height="8" fill="#000"/><rect x="72" y="84" width="8" height="8" fill="#000"/><rect x="84" y="84" width="8" height="8" fill="#000"/><text x="50" y="54" text-anchor="middle" fill="#94a3b8" font-size="7" font-family="sans-serif">QR CODE</text></svg>`);

  // QR layer selection state
  const [selectedQR, setSelectedQR] = React.useState(false);
  const handleFieldMouseDown = (e:React.MouseEvent, fieldId:string) => {
    if (isMobile) setMobileTab('props');
    e.stopPropagation(); e.preventDefault();
    setSelectedFieldId(fieldId); setSelectedLayer(null);
    const rect = activeRef.current!.getBoundingClientRect();
    const f = side.fields.find((f:IDField)=>f.id===fieldId)!;
    const offset = { x: e.clientX-rect.left-(f.x/100*CARD_W*zoom), y: e.clientY-rect.top-(f.y/100*CARD_H*zoom) };
    isDragging.current = false;
    pendingDrag.current = { type:'field', id:fieldId, startX:e.clientX, startY:e.clientY, offset };
  };

  const handleLayerMouseDown = (e:React.MouseEvent, layer:'photo'|'sig') => {
    if (isMobile) setMobileTab('props');
    e.stopPropagation(); e.preventDefault();
    setSelectedLayer(layer); setSelectedFieldId(null);
    const rect = activeRef.current!.getBoundingClientRect();
    const xKey = layer==='photo'?'photoX':'sigX', yKey = layer==='photo'?'photoY':'sigY';
    const cx = (side as any)[xKey], cy = (side as any)[yKey];
    const offset = { x: e.clientX-rect.left-(cx/100*CARD_W*zoom), y: e.clientY-rect.top-(cy/100*CARD_H*zoom) };
    isDragging.current = false;
    pendingDrag.current = { type:'layer', id:layer, startX:e.clientX, startY:e.clientY, offset };
  };

  const handleResizeMouseDown = (e:React.MouseEvent, layer:'photo'|'sig', handle:string) => {
    e.stopPropagation(); e.preventDefault();
    pendingDrag.current = null;
    const wKey=layer==='photo'?'photoW':'sigW', hKey=layer==='photo'?'photoH':'sigH';
    const xKey=layer==='photo'?'photoX':'sigX', yKey=layer==='photo'?'photoY':'sigY';
    setResizingLayer({layer, handle});
    setResizeStart({
      mouseX:e.clientX, mouseY:e.clientY,
      w:(side as any)[wKey], h:(side as any)[hKey],
      x:(side as any)[xKey], y:(side as any)[yKey],
    });
  };

  const handleShapeMouseDown = (e:React.MouseEvent, shapeId:string) => {
    if (isMobile) setMobileTab('props');
    e.stopPropagation(); e.preventDefault();
    setSelectedShapeId(shapeId); setSelectedFieldId(null); setSelectedLayer(null); setSelectedQR(false);
    const rect = activeRef.current!.getBoundingClientRect();
    const sh = (side.shapes||[]).find((s:ShapeElement)=>s.id===shapeId)!;
    const offset = { x: e.clientX-rect.left-(sh.x/100*CARD_W*zoom), y: e.clientY-rect.top-(sh.y/100*CARD_H*zoom) };
    isDragging.current = false;
    pendingDrag.current = { type:'shape', id:shapeId, startX:e.clientX, startY:e.clientY, offset };
  };

  const handleShapeResizeMouseDown = (e:React.MouseEvent, shapeId:string, handle:string) => {
    e.stopPropagation(); e.preventDefault();
    pendingDrag.current = null;
    const sh = (side.shapes||[]).find((s:ShapeElement)=>s.id===shapeId)!;
    setResizingShape({id:shapeId, handle});
    setShapeResizeStart({mouseX:e.clientX,mouseY:e.clientY,w:sh.w,h:sh.h,x:sh.x,y:sh.y});
  };

  const handleMouseMove = React.useCallback((e:MouseEvent) => {
    const THRESHOLD = 4;
    if(pendingDrag.current && !isDragging.current) {
      const dx = Math.abs(e.clientX - pendingDrag.current.startX);
      const dy = Math.abs(e.clientY - pendingDrag.current.startY);
      if(dx > THRESHOLD || dy > THRESHOLD) {
        isDragging.current = true;
        if(pendingDrag.current.type === 'field') {
          setDraggingId(pendingDrag.current.id); setDragOffset(pendingDrag.current.offset);
        } else if(pendingDrag.current.type === 'shape') {
          setDraggingShapeId(pendingDrag.current.id); setShapeDragOffset(pendingDrag.current.offset);
        } else {
          setDraggingLayer(pendingDrag.current.id as 'photo'|'sig'); setLayerDragOffset(pendingDrag.current.offset);
        }
      }
      return;
    }

    if(draggingId && activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      let x = (e.clientX-rect.left-dragOffset.x)/zoom/CARD_W*100;
      let y = (e.clientY-rect.top -dragOffset.y)/zoom/CARD_H*100;
      if(snap){ x=Math.round(x/5)*5; y=Math.round(y/5)*5; }
      x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
      setSide((p:IDSide)=>({...p, fields:p.fields.map((f:IDField)=>f.id===draggingId?{...f,x,y}:f)}));
      return;
    }
    if(draggingShapeId && activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      let x = (e.clientX-rect.left-shapeDragOffset.x)/zoom/CARD_W*100;
      let y = (e.clientY-rect.top -shapeDragOffset.y)/zoom/CARD_H*100;
      if(snap){ x=Math.round(x/5)*5; y=Math.round(y/5)*5; }
      x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
      setSide((p:IDSide)=>({...p, shapes:(p.shapes||[]).map((s:ShapeElement)=>s.id===draggingShapeId?{...s,x,y}:s)}));
      return;
    }
    if(draggingLayer && activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      let x = (e.clientX-rect.left-layerDragOffset.x)/zoom/CARD_W*100;
      let y = (e.clientY-rect.top -layerDragOffset.y)/zoom/CARD_H*100;
      if(snap){ x=Math.round(x/5)*5; y=Math.round(y/5)*5; }
      x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
      const xKey=draggingLayer==='photo'?'photoX':'sigX', yKey=draggingLayer==='photo'?'photoY':'sigY';
      setSide((p:IDSide)=>({...p, [xKey]:x, [yKey]:y}));
      return;
    }
    if(resizingShape && activeRef.current) {
      const {id, handle} = resizingShape;
      const dxPx = e.clientX-shapeResizeStart.mouseX, dyPx = e.clientY-shapeResizeStart.mouseY;
      const dx = dxPx/zoom/CARD_W*100, dy = dyPx/zoom/CARD_H*100;
      let w=shapeResizeStart.w, h=shapeResizeStart.h;
      if(handle.includes('e')) w = Math.max(5, shapeResizeStart.w + dx*2);
      if(handle.includes('w')) w = Math.max(5, shapeResizeStart.w - dx*2);
      if(handle.includes('s')) h = Math.max(5, shapeResizeStart.h + dy*2);
      if(handle.includes('n')) h = Math.max(5, shapeResizeStart.h - dy*2);
      if(snap){ w=Math.round(w/5)*5; h=Math.round(h/5)*5; }
      setSide((p:IDSide)=>({...p, shapes:(p.shapes||[]).map((s:ShapeElement)=>s.id===id?{...s,w,h}:s)}));
      return;
    }
    if(resizingLayer && activeRef.current) {
      const {layer, handle} = resizingLayer;
      const dxPx = e.clientX-resizeStart.mouseX, dyPx = e.clientY-resizeStart.mouseY;
      const dx = dxPx/zoom/CARD_W*100, dy = dyPx/zoom/CARD_H*100;
      const wKey=layer==='photo'?'photoW':'sigW', hKey=layer==='photo'?'photoH':'sigH';
      const xKey=layer==='photo'?'photoX':'sigX', yKey=layer==='photo'?'photoY':'sigY';
      let w=resizeStart.w, h=resizeStart.h, x=resizeStart.x, y=resizeStart.y;
      if(handle.includes('e')) w = Math.max(5, resizeStart.w + dx*2);
      if(handle.includes('w')) w = Math.max(5, resizeStart.w - dx*2);
      if(handle.includes('s')) h = Math.max(5, resizeStart.h + dy*2);
      if(handle.includes('n')) h = Math.max(5, resizeStart.h - dy*2);
      if(snap){ w=Math.round(w/5)*5; h=Math.round(h/5)*5; }
      setSide((p:IDSide)=>({...p, [wKey]:w, [hKey]:h, [xKey]:x, [yKey]:y}));
    }
  },[draggingId,draggingShapeId,draggingLayer,resizingLayer,resizingShape,dragOffset,shapeDragOffset,layerDragOffset,resizeStart,shapeResizeStart,zoom,activeSide,snap]);

  const handleMouseUp = React.useCallback(()=>{
    const wasDragging = isDragging.current;
    pendingDrag.current = null;
    isDragging.current  = false;
    if(draggingId||draggingShapeId||draggingLayer||resizingLayer||resizingShape||wasDragging){
      setDraggingId(null); setDraggingShapeId(null); setDraggingLayer(null); setResizingLayer(null); setResizingShape(null);
      if(wasDragging) pushHistory(front,back);
    }
  },[draggingId,draggingShapeId,draggingLayer,resizingLayer,resizingShape,front,back,pushHistory]);

  React.useEffect(()=>{
    window.addEventListener('mousemove',handleMouseMove);
    window.addEventListener('mouseup',handleMouseUp);
    return ()=>{ window.removeEventListener('mousemove',handleMouseMove); window.removeEventListener('mouseup',handleMouseUp); };
  },[handleMouseMove,handleMouseUp]);

  React.useEffect(()=>{
    const onKey = (e:KeyboardEvent) => {
      const arrows = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
      if(!arrows.includes(e.key)) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA') return;
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const dx = e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;
      const dy = e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
      if(selectedFieldId) {
        setSide((p:IDSide)=>({...p, fields:p.fields.map((f:IDField)=>f.id===selectedFieldId
          ?{...f, x:Math.max(0,Math.min(100,f.x+dx)), y:Math.max(0,Math.min(100,f.y+dy))}
          :f)}));
      } else if(selectedLayer) {
        const xKey=selectedLayer==='photo'?'photoX':'sigX', yKey=selectedLayer==='photo'?'photoY':'sigY';
        setSide((p:IDSide)=>({...p, [xKey]:Math.max(0,Math.min(100,(p as any)[xKey]+dx)), [yKey]:Math.max(0,Math.min(100,(p as any)[yKey]+dy))}));
      }
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[selectedFieldId,selectedLayer,activeSide]);

  const renderSide = React.useCallback(async(which:'front'|'back'):Promise<string>=>{
    const sd = which==='front' ? front : back;
    const SCALE = 4;
    const W = CARD_W * SCALE;
    const H = CARD_H * SCALE;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    const li = (src:string) => new Promise<HTMLImageElement>((res,rej)=>{
      const img = new Image(); img.crossOrigin='anonymous';
      img.onload=()=>res(img); img.onerror=rej; img.src=src;
    });

    if (sd.background) {
      try {
        const img = await li(sd.background);
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(CARD_W/iw, CARD_H/ih);
        const sw = iw*scale, sh = ih*scale;
        const sx = (CARD_W - sw)/2, sy = (CARD_H - sh)/2;
        ctx.drawImage(img, sx, sy, sw, sh);
      } catch { ctx.fillStyle='#cc0000'; ctx.fillRect(0,0,CARD_W,CARD_H); }
    } else if (sd.bgGradient) {
      const g = sd.bgGradient;
      let grd: CanvasGradient;
      if (g.type==='radial') {
        grd = ctx.createRadialGradient(CARD_W/2,CARD_H/2,0,CARD_W/2,CARD_H/2,Math.max(CARD_W,CARD_H)/2);
      } else {
        const rad = ((g.angle??135)*Math.PI)/180;
        const cx2=CARD_W/2, cy2=CARD_H/2;
        const len=Math.sqrt(CARD_W*CARD_W+CARD_H*CARD_H)/2;
        grd = ctx.createLinearGradient(cx2-Math.cos(rad)*len,cy2-Math.sin(rad)*len,cx2+Math.cos(rad)*len,cy2+Math.sin(rad)*len);
      }
      grd.addColorStop(0,g.color1); grd.addColorStop(1,g.color2);
      ctx.fillStyle=grd; ctx.fillRect(0,0,CARD_W,CARD_H);
    } else if (sd.bgColor) {
      ctx.fillStyle=sd.bgColor; ctx.fillRect(0,0,CARD_W,CARD_H);
    } else {
      const grd = ctx.createLinearGradient(0,0,CARD_W*0.7,CARD_H);
      if(which==='front'){ grd.addColorStop(0,'#b91c1c'); grd.addColorStop(0.6,'#ef4444'); grd.addColorStop(1,'#f97316'); }
      else { grd.addColorStop(0,'#f1f5f9'); grd.addColorStop(1,'#e2e8f0'); }
      ctx.fillStyle=grd; ctx.fillRect(0,0,CARD_W,CARD_H);
    }

    // Draw shapes
    for (const sh of (sd.shapes||[])) {
      const sx2 = sh.x/100*CARD_W - sh.w/100*CARD_W/2;
      const sy2 = sh.y/100*CARD_H - sh.h/100*CARD_H/2;
      const sw2 = sh.w/100*CARD_W;
      const sh2 = sh.h/100*CARD_H;
      ctx.save();
      ctx.globalAlpha = sh.fillOpacity/100;
      if (sh.type==='circle') {
        ctx.beginPath();
        ctx.ellipse(sx2+sw2/2, sy2+sh2/2, sw2/2, sh2/2, 0, 0, Math.PI*2);
        if (sh.fill!=='transparent') { ctx.fillStyle=sh.fill; ctx.fill(); }
        if (sh.strokeWidth>0) { ctx.globalAlpha=1; ctx.strokeStyle=sh.stroke; ctx.lineWidth=sh.strokeWidth; ctx.stroke(); }
      } else if (sh.type==='line') {
        ctx.beginPath();
        ctx.moveTo(sx2, sy2+sh2/2); ctx.lineTo(sx2+sw2, sy2+sh2/2);
        ctx.globalAlpha=1; ctx.strokeStyle=sh.stroke; ctx.lineWidth=Math.max(1,sh.strokeWidth||3); ctx.stroke();
      } else {
        const r = sh.borderRadius||0;
        ctx.beginPath();
        ctx.moveTo(sx2+r,sy2); ctx.lineTo(sx2+sw2-r,sy2); ctx.quadraticCurveTo(sx2+sw2,sy2,sx2+sw2,sy2+r);
        ctx.lineTo(sx2+sw2,sy2+sh2-r); ctx.quadraticCurveTo(sx2+sw2,sy2+sh2,sx2+sw2-r,sy2+sh2);
        ctx.lineTo(sx2+r,sy2+sh2); ctx.quadraticCurveTo(sx2,sy2+sh2,sx2,sy2+sh2-r);
        ctx.lineTo(sx2,sy2+r); ctx.quadraticCurveTo(sx2,sy2,sx2+r,sy2); ctx.closePath();
        if (sh.fill!=='transparent') { ctx.fillStyle=sh.fill; ctx.fill(); }
        if (sh.strokeWidth>0) { ctx.globalAlpha=1; ctx.strokeStyle=sh.stroke; ctx.lineWidth=sh.strokeWidth; ctx.stroke(); }
      }
      ctx.restore();
    }

    const photo = which==='front' ? employeePhoto : null;

    const drawImg = (img:HTMLImageElement, x:number, y:number, w:number, h:number,
      opts:{strokeW?:number,strokeC?:string,shadowBlur?:number,shadowC?:string,overlayC?:string,overlayOp?:number}) => {
      ctx.save();
      if(opts.shadowBlur&&opts.shadowBlur>0){ ctx.shadowColor=opts.shadowC||'rgba(0,0,0,0.6)'; ctx.shadowBlur=opts.shadowBlur; }
      if(opts.strokeW&&opts.strokeW>0){ ctx.strokeStyle=opts.strokeC||'#000000'; ctx.lineWidth=opts.strokeW; ctx.strokeRect(x,y,w,h); }
      ctx.drawImage(img,x,y,w,h);
      ctx.shadowBlur=0;
      if(opts.overlayC&&opts.overlayOp&&opts.overlayOp>0){ ctx.globalAlpha=opts.overlayOp/100; ctx.fillStyle=opts.overlayC; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1; }
      ctx.restore();
    };

    const drawSigRecolor = async(imgSrc:string, x:number, y:number, w:number, h:number, color:string, inkDark:boolean,
      opts:{strokeW?:number,strokeC?:string,shadowBlur?:number,shadowC?:string}) => {
      const img = await li(imgSrc);
      const imgAR=img.naturalWidth/img.naturalHeight, boxAR=w/h;
      let dw=w,dh=h,dx=x,dy=y;
      if(imgAR>boxAR){dh=w/imgAR;dy=y+(h-dh)/2;}else{dw=h*imgAR;dx=x+(w-dw)/2;}
      const oc=document.createElement('canvas'); oc.width=Math.round(dw*SCALE); oc.height=Math.round(dh*SCALE);
      const oc2=oc.getContext('2d')!;
      oc2.drawImage(img,0,0,oc.width,oc.height);
      const pd=oc2.getImageData(0,0,oc.width,oc.height); const d=pd.data;
      const tr=parseInt(color.slice(1,3),16),tg=parseInt(color.slice(3,5),16),tb=parseInt(color.slice(5,7),16);
      for(let i=0;i<d.length;i+=4){
        const lum=d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;
        const oa=d[i+3]/255;
        const str=inkDark?(1-lum/255)*oa:(lum/255)*oa;
        d[i]=tr;d[i+1]=tg;d[i+2]=tb;d[i+3]=Math.round(str*255);
      }
      oc2.putImageData(pd,0,0);
      ctx.save();
      if(opts.shadowBlur&&opts.shadowBlur>0){ctx.shadowColor=opts.shadowC||'rgba(0,0,0,0.5)';ctx.shadowBlur=opts.shadowBlur;}
      if(opts.strokeW&&opts.strokeW>0){ctx.strokeStyle=opts.strokeC||'#000';ctx.lineWidth=opts.strokeW;ctx.strokeRect(dx,dy,dw,dh);}
      ctx.drawImage(oc,dx,dy,dw,dh);
      ctx.shadowBlur=0; ctx.restore();
    };

    if(sd.showPhoto&&photo){
      try{
        const img=await li(photo);
        const pw=sd.photoW/100*CARD_W,ph=sd.photoH/100*CARD_H;
        const px=sd.photoX/100*CARD_W-pw/2,py=sd.photoY/100*CARD_H-ph/2;
        // Use objectFit:contain logic (match HTML preview)
        const imgAR=img.naturalWidth/img.naturalHeight, boxAR=pw/ph;
        let dw=pw,dh=ph,dx=px,dy=py;
        if(imgAR>boxAR){dh=pw/imgAR;dy=py+(ph-dh)/2;}else{dw=ph*imgAR;dx=px+(pw-dw)/2;}
        // Apply brightness/contrast filter
        if((sd.photoBrightness&&sd.photoBrightness!==100)||(sd.photoContrast&&sd.photoContrast!==100)){
          const oc=document.createElement('canvas');oc.width=Math.round(dw*4);oc.height=Math.round(dh*4);
          const oc2=oc.getContext('2d')!;
          oc2.filter=`brightness(${(sd.photoBrightness??100)/100}) contrast(${(sd.photoContrast??100)/100})`;
          oc2.drawImage(img,0,0,oc.width,oc.height);
          drawImg(oc as unknown as HTMLImageElement,dx,dy,dw,dh,{strokeW:sd.photoStrokeWidth,strokeC:sd.photoStrokeColor,shadowBlur:sd.photoShadowBlur,shadowC:sd.photoShadowColor,overlayC:sd.photoOverlayColor,overlayOp:sd.photoOverlayOpacity});
        } else {
          drawImg(img,dx,dy,dw,dh,{strokeW:sd.photoStrokeWidth,strokeC:sd.photoStrokeColor,shadowBlur:sd.photoShadowBlur,shadowC:sd.photoShadowColor,overlayC:sd.photoOverlayColor,overlayOp:sd.photoOverlayOpacity});
        }
      }catch{}
    }

    if(sd.showSig&&employeeSig){
      try{
        const sw=sd.sigW/100*CARD_W,sh=sd.sigH/100*CARD_H;
        const sx=sd.sigX/100*CARD_W-sw/2,sy=sd.sigY/100*CARD_H-sh/2;
        if(sd.sigColorize&&sd.sigColorizeColor){
          await drawSigRecolor(employeeSig,sx,sy,sw,sh,sd.sigColorizeColor,sd.sigInkDark!==false,{strokeW:sd.sigStrokeWidth,strokeC:sd.sigStrokeColor,shadowBlur:sd.sigShadowBlur,shadowC:sd.sigShadowColor});
        } else {
          const img=await li(employeeSig);
          // Use objectFit:contain for sig too
          const sImgAR=img.naturalWidth/img.naturalHeight, sBoxAR=sw/sh;
          let sdw=sw,sdh=sh,sdx=sx,sdy=sy;
          if(sImgAR>sBoxAR){sdh=sw/sImgAR;sdy=sy+(sh-sdh)/2;}else{sdw=sh*sImgAR;sdx=sx+(sw-sdw)/2;}
          drawImg(img,sdx,sdy,sdw,sdh,{strokeW:sd.sigStrokeWidth,strokeC:sd.sigStrokeColor,shadowBlur:sd.sigShadowBlur,shadowC:sd.sigShadowColor});
        }
      }catch{}
    }

    sd.fields.filter((f:IDField)=>f.visible).forEach((f:IDField)=>{
      const ff=f.fontFamily||"'Inter','Segoe UI',sans-serif";
      ctx.font=`${f.italic?'italic ':''}${f.bold?'bold ':''}${f.fontSize}px ${ff}`;
      ctx.textAlign=f.align;
      ctx.textBaseline='middle';
      const x=f.align==='right'?(100-f.x)/100*CARD_W:f.x/100*CARD_W;
      const cy=f.y/100*CARD_H; // center Y (matches HTML translateY(-50%))
      const maxW=((f.w??90)/100)*CARD_W;
      const words=f.value.split(' '); let line='',lines:string[]=[];
      for(const ww of words){ const t=line+(line?' ':'')+ww; if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=ww;}else line=t; }
      lines.push(line);
      // Total block height centered at cy
      const lineH=f.fontSize*1.3;
      const totalH=lines.length*lineH;
      const startY=cy - totalH/2 + lineH/2;
      if(f.shadowBlur&&f.shadowBlur>0){ctx.shadowColor=f.shadowColor||'rgba(0,0,0,0.6)';ctx.shadowBlur=f.shadowBlur;}else{ctx.shadowBlur=0;}
      lines.forEach((l,i)=>{
        const ly=startY+i*lineH;
        if(f.overlayBg&&f.overlayOpacity&&f.overlayOpacity>0){
          const mw=ctx.measureText(l).width;
          const ox=f.align==='center'?x-mw/2:f.align==='right'?x-mw:x;
          ctx.globalAlpha=f.overlayOpacity/100; ctx.fillStyle=f.overlayBg;
          ctx.fillRect(ox-4,ly-f.fontSize/2,mw+8,f.fontSize*1.2); ctx.globalAlpha=1;
        }
        if(f.strokeWidth&&f.strokeWidth>0){ctx.strokeStyle=f.strokeColor||'#000';ctx.lineWidth=f.strokeWidth;ctx.lineJoin='round';ctx.strokeText(l,x,ly);}
        ctx.fillStyle=f.color; ctx.fillText(l,x,ly);
        if(f.underline){
          const mw=ctx.measureText(l).width;
          const ux=f.align==='center'?x-mw/2:f.align==='right'?x-mw:x;
          ctx.save();ctx.strokeStyle=f.color;ctx.lineWidth=Math.max(0.5,f.fontSize*0.06);
          ctx.beginPath();ctx.moveTo(ux,ly+f.fontSize*0.6);ctx.lineTo(ux+mw,ly+f.fontSize*0.6);ctx.stroke();ctx.restore();
        }
      });
      ctx.shadowBlur=0;
    });

    return cv.toDataURL('image/jpeg', 0.95);
  },[front,back,employeePhoto,employeeSig]);

  const captureCard = async (which: 'front'|'back'): Promise<string> => {
    const ref = which === 'front' ? cardFrontRef : cardBackRef;
    const h2c = (window as any).html2canvas;
    if (!ref.current || !h2c) return renderSide(which);
    try {
      const canvas = await h2c(ref.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
      // Crop to exact card size
      const out = document.createElement('canvas');
      out.width  = CARD_W * 4;
      out.height = CARD_H * 4;
      out.getContext('2d')!.drawImage(canvas, 0, 0);
      return out.toDataURL('image/jpeg', 0.95);
    } catch(err) {
      console.warn('html2canvas failed', err);
      return renderSide(which);
    }
  };

  const downloadSide = async(w:'front'|'back')=>{
    // Make sure correct side is active and visible
    if (activeSide !== w) {
      setActiveSide(w);
      await new Promise(r => setTimeout(r, 200));
    }
    const url = await captureCard(w);
    const a = document.createElement('a');
    a.download = `id-${w}-${Date.now()}.jpg`;
    a.href = url;
    a.click();
  };

  const saveAsTemplate = async()=>{
    if(!templateName.trim()) return;
    setSavingTemplate(true);
    const t:IDTemplate={id:Date.now().toString(),name:templateName.trim(),company:templateCompany.trim(),createdAt:new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}),front,back};
    const existing = await fetch(`${API_URL}/templates`).then(r=>r.ok?r.json():[]).catch(()=>[]);
    const updated = editingTemplate ? existing.map((x:IDTemplate)=>x.id===editingTemplate.id?t:{...x,id:x.id}) : [...existing,t];
    await fetch(`${API_URL}/templates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    showMsg('success', editingTemplate?`Template updated!`:`Template "${t.name}" saved!`);
    if(!editingTemplate){ setTemplateName(''); setTemplateCompany(''); }
    setSavingTemplate(false);
  };

  const loadTemplate = (t:IDTemplate)=>{ setFront({...t.front}); setBack({...t.back}); setTemplateName(t.name); setTemplateCompany(t.company||''); pushHistory(t.front,t.back); showMsg('success',`Loaded "${t.name}" — edit and save to update`); setShowTemplateModal(false); };
  const deleteTemplateFromModal = async(id:string)=>{
    const updated = templates.filter(t=>t.id!==id);
    await fetch(`${API_URL}/templates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    setTemplates(updated);
  };
  const editTemplateInEditor = (t:IDTemplate)=>{ loadTemplate(t); };

  const renderCard = (which:'front'|'back') => {
    const sd     = which==='front'?front:back;
    const isActive = activeSide===which;
    const ref    = which==='front'?cardFrontRef:cardBackRef;
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        <div style={{fontSize:'13px',fontWeight:700,color:isActive?'#0f172a':'#94a3b8',letterSpacing:'1px',textTransform:'uppercase',display:'flex',alignItems:'center',gap:'8px'}}>
          {which==='front'?'▣ Front Face':'▢ Back Face'}
          {isActive && <span style={{fontSize:'10px',fontWeight:500,color:'#3b82f6',background:'#eff6ff',padding:'2px 8px',borderRadius:'12px',letterSpacing:'0',textTransform:'none'}}>Active</span>}
        </div>
        <div ref={ref}
          onClick={(e)=>{e.stopPropagation(); setActiveSide(which);}}
          style={{width:CARD_W*zoom,height:CARD_H*zoom,position:'relative',borderRadius:8*zoom,overflow:'hidden',
            boxShadow:isActive?`0 0 0 4px rgba(102,126,234,0.4), 0 20px 40px rgba(0,0,0,0.15)`:`0 10px 30px rgba(0,0,0,0.06)`,
            userSelect:'none',flexShrink:0,transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',cursor:isActive?'default':'pointer',
            transform:isActive?'scale(1)':'scale(0.98)', opacity:isActive?1:0.8}}>

          {sd.background
            ? <img src={sd.background} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
            : sd.bgGradient
              ? <div style={{position:'absolute',inset:0,background:sd.bgGradient.type==='radial'
                  ?`radial-gradient(circle, ${sd.bgGradient.color1}, ${sd.bgGradient.color2})`
                  :`linear-gradient(${sd.bgGradient.angle??135}deg, ${sd.bgGradient.color1}, ${sd.bgGradient.color2})`,pointerEvents:'none'}}/>
              : sd.bgColor
                ? <div style={{position:'absolute',inset:0,background:sd.bgColor,pointerEvents:'none'}}/>
                : <div style={{position:'absolute',inset:0,background:which==='front'?'linear-gradient(160deg,#b91c1c,#ef4444,#f97316)':'linear-gradient(160deg,#f1f5f9,#e2e8f0)',pointerEvents:'none'}}/>}

          {showGrid&&isActive&&<div style={{position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(0,0,0,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.1) 1px,transparent 1px)`,backgroundSize:`${CARD_W*zoom/10}px ${CARD_H*zoom/10}px`,pointerEvents:'none',zIndex:5}}/>}

          {draggingId&&isActive&&<>
            <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'rgba(102,126,234,0.8)',zIndex:6,pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:'50%',left:0,right:0,height:'1px',background:'rgba(102,126,234,0.8)',zIndex:6,pointerEvents:'none'}}/>
          </>}

          {sd.showPhoto&&(
            <div onMouseDown={e=>{e.stopPropagation(); if(isActive){handleLayerMouseDown(e,'photo');}else{setActiveSide(which);setSelectedLayer('photo');setSelectedFieldId(null);}}}
              style={{position:'absolute',left:`${sd.photoX}%`,top:`${sd.photoY}%`,width:`${sd.photoW}%`,height:`${sd.photoH}%`,transform:'translate(-50%,-50%)',
                cursor:isActive?(draggingLayer==='photo'?'grabbing':'grab'):'pointer', zIndex:8,
                boxShadow:sd.photoShadowBlur&&sd.photoShadowBlur>0?`0 0 ${sd.photoShadowBlur}px ${sd.photoShadowColor||'rgba(0,0,0,0.6)'}`:'none',
                outline:(isActive&&selectedLayer==='photo')?'2px dashed rgba(59,130,246,0.9)':(sd.photoStrokeWidth&&sd.photoStrokeWidth>0?`${sd.photoStrokeWidth}px solid ${sd.photoStrokeColor||'#000000'}`:'none'),
                outlineOffset:(isActive&&selectedLayer==='photo')?'3px':'-1px'}}>
              <img src={DUMMY_PHOTO} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',pointerEvents:'none',
                filter:[
                  sd.photoBrightness!==undefined&&sd.photoBrightness!==100?`brightness(${sd.photoBrightness}%)`:'',
                  sd.photoContrast!==undefined&&sd.photoContrast!==100?`contrast(${sd.photoContrast}%)`:'',
                ].filter(Boolean).join(' ')||'none'}}/>
              {sd.photoOverlayOpacity&&sd.photoOverlayOpacity>0&&<div style={{position:'absolute',inset:0,background:sd.photoOverlayColor||'#000000',opacity:sd.photoOverlayOpacity/100,mixBlendMode:'normal',pointerEvents:'none'}}/>}
              {sd.photoColorize&&sd.photoColorizeColor&&<div style={{position:'absolute',inset:0,background:sd.photoColorizeColor,mixBlendMode:'color',pointerEvents:'none'}}/>}
              {isActive&&selectedLayer==='photo'&&(['n','s','e','w','ne','nw','se','sw'] as const).map(h=>{
                const top  = h.includes('n')?'-4px':h.includes('s')?'calc(100% - 4px)':'calc(50% - 4px)';
                const left = h.includes('w')?'-4px':h.includes('e')?'calc(100% - 4px)':'calc(50% - 4px)';
                const cur  = h==='n'||h==='s'?'ns-resize':h==='e'||h==='w'?'ew-resize':h==='ne'||h==='sw'?'nesw-resize':'nwse-resize';
                return <div key={h} onMouseDown={e=>handleResizeMouseDown(e,'photo',h)}
                  style={{position:'absolute',top,left,width:'8px',height:'8px',borderRadius:'50%',background:'#fff',border:'2px solid #3b82f6',zIndex:20,cursor:cur}}/>;
              })}
            </div>
          )}
          {sd.showSig&&(
            <div onMouseDown={e=>{e.stopPropagation(); if(isActive){handleLayerMouseDown(e,'sig');}else{setActiveSide(which);setSelectedLayer('sig');setSelectedFieldId(null);}}}
              style={{position:'absolute',left:`${sd.sigX}%`,top:`${sd.sigY}%`,width:`${sd.sigW}%`,height:`${sd.sigH}%`,transform:'translate(-50%,-50%)',
                cursor:isActive?(draggingLayer==='sig'?'grabbing':'grab'):'pointer', zIndex:8,
                boxShadow:sd.sigShadowBlur&&sd.sigShadowBlur>0?`0 0 ${sd.sigShadowBlur}px ${sd.sigShadowColor||'rgba(0,0,0,0.6)'}`:'none',
                outline:(isActive&&selectedLayer==='sig')?'2px dashed rgba(139,92,246,0.9)':(sd.sigStrokeWidth&&sd.sigStrokeWidth>0?`${sd.sigStrokeWidth}px solid ${sd.sigStrokeColor||'#000000'}`:'none'),
                outlineOffset:(isActive&&selectedLayer==='sig')?'3px':'-1px'}}>
              <img src={DUMMY_SIG} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',pointerEvents:'none',
                filter:sd.sigColorize&&sd.sigColorizeColor
                  ? (sd.sigInkDark===false ? hexToColorFilterWhite(sd.sigColorizeColor) : hexToColorFilter(sd.sigColorizeColor))
                  : [
                      sd.sigBrightness!==undefined&&sd.sigBrightness!==100?`brightness(${sd.sigBrightness}%)`:'',
                      sd.sigContrast!==undefined&&sd.sigContrast!==100?`contrast(${sd.sigContrast}%)`:'',
                    ].filter(Boolean).join(' ')||'none'}}/>
              {isActive&&selectedLayer==='sig'&&(['n','s','e','w','ne','nw','se','sw'] as const).map(h=>{
                const top  = h.includes('n')?'-4px':h.includes('s')?'calc(100% - 4px)':'calc(50% - 4px)';
                const left = h.includes('w')?'-4px':h.includes('e')?'calc(100% - 4px)':'calc(50% - 4px)';
                const cur  = h==='n'||h==='s'?'ns-resize':h==='e'||h==='w'?'ew-resize':h==='ne'||h==='sw'?'nesw-resize':'nwse-resize';
                return <div key={h} onMouseDown={e=>handleResizeMouseDown(e,'sig',h)}
                  style={{position:'absolute',top,left,width:'8px',height:'8px',borderRadius:'50%',background:'#fff',border:'2px solid #8b5cf6',zIndex:20,cursor:cur}}/>;
              })}
            </div>
          )}

          {/* QR Code layer — shown on back side */}
          {which==='back' && sd.showQR && (
            <div
              onMouseDown={e=>{ e.stopPropagation(); if(isActive){setSelectedQR(true);setSelectedFieldId(null);setSelectedLayer(null);}else setActiveSide(which); }}
              style={{
                position:'absolute',
                left:`${(sd.qrX??50)}%`, top:`${(sd.qrY??42)}%`,
                width:`${(sd.qrSize??70)}%`,
                aspectRatio:'1/1',
                transform:'translate(-50%,-50%)',
                cursor:isActive?'grab':'pointer',
                zIndex:11,
                outline:(isActive&&selectedQR)?'2px dashed rgba(234,179,8,0.9)':'2px solid transparent',
                outlineOffset:'3px', borderRadius:'4px',
              }}>
              <img src={DUMMY_QR} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',pointerEvents:'none'}}/>
            </div>
          )}

          {/* Shape layers */}
          {(sd.shapes||[]).map((sh:ShapeElement) => {
            const isSel = isActive && selectedShapeId===sh.id;
            const isDragSh = draggingShapeId===sh.id;
            const borderRadius = sh.type==='circle'?'50%':`${sh.borderRadius||0}px`;
            return (
              <div key={sh.id}
                onMouseDown={e=>{e.stopPropagation(); if(isActive){handleShapeMouseDown(e,sh.id);}else{setActiveSide(which);setSelectedShapeId(sh.id);setSelectedFieldId(null);setSelectedLayer(null);}}}
                style={{
                  position:'absolute',
                  left:`${sh.x}%`, top:`${sh.y}%`,
                  width:`${sh.w}%`, height:sh.type==='line'?`${sh.h}%`:`${sh.h}%`,
                  transform:'translate(-50%,-50%)',
                  background: sh.type==='line'?'transparent':`${sh.fill}${Math.round((sh.fillOpacity/100)*255).toString(16).padStart(2,'0')}`,
                  border: sh.strokeWidth>0?`${sh.strokeWidth}px solid ${sh.stroke}`:(sh.type==='line'?`${Math.max(2,sh.strokeWidth||3)}px solid ${sh.stroke}`:'none'),
                  borderRadius,
                  cursor: isActive?(isDragSh?'grabbing':'grab'):'pointer',
                  zIndex:6,
                  outline: isSel?'2px dashed rgba(102,126,234,0.9)':'none',
                  outlineOffset:'3px',
                  transition: isDragSh?'none':'all 0.1s',
                  boxSizing:'border-box',
                }}>
                {isSel && (['n','s','e','w','ne','nw','se','sw'] as const).map(h => {
                  const top  = h.includes('n')?'-4px':h.includes('s')?'calc(100% - 4px)':'calc(50% - 4px)';
                  const left = h.includes('w')?'-4px':h.includes('e')?'calc(100% - 4px)':'calc(50% - 4px)';
                  const cur  = h==='n'||h==='s'?'ns-resize':h==='e'||h==='w'?'ew-resize':h==='ne'||h==='sw'?'nesw-resize':'nwse-resize';
                  return <div key={h} onMouseDown={e=>handleShapeResizeMouseDown(e,sh.id,h)}
                    style={{position:'absolute',top,left,width:'8px',height:'8px',borderRadius:'50%',background:'#fff',border:'2px solid #667eea',zIndex:20,cursor:cur}}/>;
                })}
              </div>
            );
          })}

          {sd.fields.filter((f:IDField)=>f.visible).map((field:IDField)=>{
            const isSel  = isActive&&selectedFieldId===field.id;
            const isDrag = draggingId===field.id;
            return (
              <div key={field.id}
                onMouseDown={e=>{e.stopPropagation(); if(isActive){handleFieldMouseDown(e,field.id);}else{setActiveSide(which);setSelectedFieldId(field.id);setSelectedLayer(null);}}}
                style={{
                  position:'absolute',
                  left:field.align!=='right'?`${field.x}%`:'auto',
                  right:field.align==='right'?`${100-field.x}%`:'auto',
                  top:`${field.y}%`,
                  transform:field.align==='center'?'translate(-50%,-50%)':'translateY(-50%)',
                  fontSize:field.fontSize*zoom,
                  color:field.color,
                  fontWeight:field.bold?700:400,
                  fontStyle:field.italic?'italic':'normal',
                  textDecoration:field.underline?'underline':'none',
                  textAlign:field.align,
                  width:field.w?`${field.w}%`:'auto',
                  maxWidth:field.w?`${field.w}%`:'90%',
                  lineHeight:1.3,
                  fontFamily:field.fontFamily||"'Inter','Segoe UI',sans-serif",
                  cursor:isActive?(isDrag?'grabbing':'grab'):'pointer',
                  zIndex:10,
                  outline:isSel?'2px dashed rgba(102,126,234,0.9)':'2px solid transparent',
                  outlineOffset:'3px',
                  borderRadius:'3px',
                  padding:'1px 4px',
                  background:isSel?'rgba(102,126,234,0.15)':isDrag?'rgba(102,126,234,0.08)':(field.overlayBg&&field.overlayOpacity?`${field.overlayBg}${Math.round((field.overlayOpacity/100)*255).toString(16).padStart(2,'0')}`:'transparent'),
                  wordBreak:'break-word',
                  transition:isDrag?'none':'all 0.1s',
                  textShadow:field.shadowBlur&&field.shadowBlur>0?`0 0 ${field.shadowBlur}px ${field.shadowColor||'rgba(0,0,0,0.6)'}`:undefined,
                  WebkitTextStroke:field.strokeWidth&&field.strokeWidth>0?`${field.strokeWidth}px ${field.strokeColor||'#000000'}`:undefined,
                }}>
                {field.value}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navBtnStyle = { background: '#fff', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' };

  return (
    <>
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',background:'#f8fafc', height: '100%'}}>
      
      {/* ════════════════════════════════════ TOP GLOBAL TOOLBAR ══ */}
      <header style={{minHeight:'56px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',padding:isMobile?'0 12px':'0 24px',flexShrink:0,zIndex:20,flexWrap:isMobile?'wrap':'nowrap',gap:'8px'}}>
        {/* Brand & History */}
        <div style={{display:'flex',alignItems:'center',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            {onBack && (
              <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 12px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'#fff',color:'#475569',cursor:'pointer',fontSize:'13px',fontWeight:600,boxShadow:'0 1px 2px rgba(0,0,0,0.04)',transition:'all 0.15s',flexShrink:0}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
                <ArrowLeft size={14}/> {!isMobile && 'Back'}
              </button>
            )}
            <div style={{background:'linear-gradient(135deg,#ec4899,#be185d)',padding:'8px',borderRadius:'10px',boxShadow:'0 4px 10px rgba(236,72,153,0.3)'}}><LayoutTemplate size={18} color="#fff"/></div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'15px',fontWeight:800,color:'#0f172a',lineHeight:1.1}}>Template Editor</div>
                {editingTemplate&&<span style={{background:'#f59e0b22',color:'#d97706',fontSize:'9px',fontWeight:800,padding:'2px 8px',borderRadius:'20px',border:'1px solid #f59e0b44',letterSpacing:'0.5px'}}>✏ EDITING</span>}
              </div>
              <div style={{fontSize:'11px',color:'#94a3b8',fontWeight:500}}>{editingTemplate?`Editing: ${editingTemplate.name}`:'Design & Export'}</div>
            </div>
          </div>
          {!isMobile && <div style={{width:'1px',height:'28px',background:'#e2e8f0'}}></div>}
          <div style={{display:isMobile?'none':'flex',gap:'6px'}}>
            <button onClick={undo} disabled={historyIdx<=0} style={{padding:'8px',borderRadius:'8px',border:'1px solid #e2e8f0',background:historyIdx>0?'#f8fafc':'#fff',color:historyIdx>0?'#475569':'#cbd5e1',cursor:historyIdx>0?'pointer':'default',transition:'all 0.2s'}}><Undo size={14}/></button>
            <button onClick={redo} disabled={historyIdx>=history.length-1} style={{padding:'8px',borderRadius:'8px',border:'1px solid #e2e8f0',background:historyIdx<history.length-1?'#f8fafc':'#fff',color:historyIdx<history.length-1?'#475569':'#cbd5e1',cursor:historyIdx<history.length-1?'pointer':'default',transition:'all 0.2s'}}><Redo size={14}/></button>
          </div>
        </div>

        {/* Center Canvas Tools */}
        {msg ? (
          <div style={{padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:600,background:msg.type==='success'?'#ecfdf5':'#fef2f2',color:msg.type==='success'?'#059669':'#dc2626',border:`1px solid ${msg.type==='success'?'#a7f3d0':'#fecaca'}`,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',animation:'fadein 0.3s'}}>
            <span>{msg.type==='success'?'✓':'✕'}</span> {msg.text}
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'4px'}}>
            <button onClick={()=>setZoom(z=>Math.max(0.5,+(z-0.1).toFixed(1)))} style={{background:'transparent',border:'none',color:'#64748b',width:'32px',height:'32px',cursor:'pointer',fontSize:'18px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <span style={{fontSize:'12px',color:'#0f172a',fontWeight:700,width:'48px',textAlign:'center'}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(2.5,+(z+0.1).toFixed(1)))} style={{background:'transparent',border:'none',color:'#64748b',width:'32px',height:'32px',cursor:'pointer',fontSize:'18px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            <div style={{width:'1px',height:'20px',background:'#e2e8f0',margin:'0 8px'}}></div>
            {!isMobile && <button onClick={()=>setShowGrid(g=>!g)} style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:showGrid?'#e0e7ff':'transparent',color:showGrid?'#4f46e5':'#64748b',cursor:'pointer',fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'6px'}}><Grid size={14}/> Grid</button>}
            {!isMobile && <button onClick={()=>setSnap(s=>!s)} style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:snap?'#f3e8ff':'transparent',color:snap?'#7c3aed':'#64748b',cursor:'pointer',fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'6px'}}><Magnet size={14}/> Snap</button>}
          </div>
        )}

        {/* Right Actions */}
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button onClick={()=>{setShowFlip(p=>!p); if(isMobile) setMobileTab('canvas');}} style={navBtnStyle} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
            <RefreshCw size={14} color="#8b5cf6"/> {!isMobile && (showFlip?'Editor':'Preview')}
          </button>
          {!isMobile && <button onClick={handlePrint} style={navBtnStyle} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
            <Printer size={14}/> Print
          </button>}
          <div style={{width:'1px',height:'24px',background:'#e2e8f0',margin:'0 4px'}}></div>
          <button onClick={()=>downloadSide(activeSide)} style={{...navBtnStyle, background:'#f8fafc'}}>
            <Download size={14} color="#667eea"/> Export {activeSide}
          </button>
          <button onClick={saveAsTemplate} disabled={savingTemplate||!templateName.trim()} style={{padding:'8px 16px',borderRadius:'8px',border:'none',background:templateName.trim()?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0',color:templateName.trim()?'#fff':'#94a3b8',cursor:templateName.trim()?'pointer':'not-allowed',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',gap:'8px',boxShadow:templateName.trim()?'0 4px 14px rgba(16,185,129,0.3)':'none'}}>
            {savingTemplate?<Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>:<Save size={16}/>} Save Template
          </button>
        </div>
      </header>

      {/* ── Mobile Tab Bar ── */}
      {isMobile && (
        <div style={{display:'flex',background:'#fff',borderBottom:'1px solid #e2e8f0',flexShrink:0}}>
          {([
            {id:'layers', label:'Layers', icon:'☰'},
            {id:'canvas', label:'Canvas', icon:'🖼'},
            {id:'props',  label:'Properties', icon:'⚙'},
          ] as const).map(tab => (
            <button key={tab.id} onClick={()=>setMobileTab(tab.id)}
              style={{flex:1,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',fontSize:'12px',fontWeight:mobileTab===tab.id?700:400,color:mobileTab===tab.id?'#667eea':'#94a3b8',borderBottom:mobileTab===tab.id?'2px solid #667eea':'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
              <span style={{fontSize:'16px'}}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        
        {/* ════════════════════════════════════ LEFT PANEL (Canva-style) ══ */}
        <div style={{width:isMobile?'100%':'300px',flexShrink:0,background:'#fff',borderRight:isMobile?'none':'1px solid #e2e8f0',display:isMobile?(mobileTab==='layers'?'flex':'none'):'flex',flexDirection:'column',overflow:'hidden',boxShadow:isMobile?'none':'4px 0 24px rgba(0,0,0,0.02)',zIndex:10}}>
          {/* Side switcher */}
          <div style={{padding:'12px 16px 10px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
            <SegmentedControl options={[{label:'Front Card',value:'front'},{label:'Back Card',value:'back'}]} value={activeSide} onChange={(v:any)=>{setActiveSide(v);setSelectedFieldId(null);setSelectedLayer(null);setSelectedShapeId(null);}}/>
          </div>
          {/* Canva-style tab bar */}
          <div style={{display:'flex',borderBottom:'1px solid #e2e8f0',background:'#fff',flexShrink:0}}>
            {([
              {id:'layers',     label:'Layers',     icon:'☰'},
              {id:'elements',   label:'Elements',   icon:'✦'},
              {id:'background', label:'Background', icon:'🎨'},
            ] as const).map(tab=>(
              <button key={tab.id} onClick={()=>setLeftTab(tab.id)}
                style={{flex:1,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',fontSize:'11px',fontWeight:leftTab===tab.id?700:400,color:leftTab===tab.id?'#667eea':'#94a3b8',borderBottom:leftTab===tab.id?'2px solid #667eea':'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',transition:'all 0.15s'}}>
                <span style={{fontSize:'15px'}}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>

            {/* ── LAYERS TAB ── */}
            {leftTab==='layers' && <>
              <AccSection id="employee" icon={<Save size={16}/>} title="Template Info" open={openSection==="employee"} onToggle={toggleSection}>
                <p style={{margin:'0 0 8px',fontSize:'11px',color:'#64748b'}}>Name your template before saving.</p>
                <input type="text" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Template name (e.g. LMVC Corp)" style={{...inpStyle,marginBottom:'8px'}}/>
                <input type="text" value={templateCompany} onChange={e=>setTemplateCompany(e.target.value)} placeholder="Company (optional)" style={{...inpStyle,marginBottom:'12px'}}/>
                <button onClick={saveAsTemplate} disabled={savingTemplate||!templateName.trim()}
                  style={{width:'100%',background:templateName.trim()?'linear-gradient(135deg,#10b981,#059669)':'#f1f5f9',color:templateName.trim()?'#fff':'#94a3b8',border:'none',borderRadius:'8px',padding:'10px',cursor:templateName.trim()?'pointer':'not-allowed',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                  {savingTemplate?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<Save size={14}/>} Save Template
                </button>
              </AccSection>

              <AccSection id="fields" icon={<Layers size={16}/>} title="Layers & Fields" open={openSection==="fields"} onToggle={toggleSection}>
                {activeSide==='front' && (
                  <button onClick={()=>{setSelectedLayer('photo'); setSelectedQR(false); setSelectedShapeId(null);}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'8px',border:selectedLayer==='photo'?'1px solid #3b82f6':'1px solid #e2e8f0',background:selectedLayer==='photo'?'#eff6ff':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.1s',marginBottom:'8px'}}>
                    <div style={{background:'#e0e7ff',color:'#4f46e5',padding:'6px',borderRadius:'6px'}}><ImageIcon size={14}/></div>
                    <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:700,color:selectedLayer==='photo'?'#2563eb':'#0f172a'}}>Employee Photo</div><div style={{fontSize:'11px',color:'#64748b',marginTop:'2px'}}>{side.showPhoto?'Visible':'Hidden'}</div></div>
                  </button>
                )}
                <button onClick={()=>{setSelectedLayer('sig'); setSelectedQR(false); setSelectedShapeId(null);}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'8px',border:selectedLayer==='sig'?'1px solid #8b5cf6':'1px solid #e2e8f0',background:selectedLayer==='sig'?'#f3e8ff':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.1s',marginBottom:'8px'}}>
                  <div style={{background:'#ede9fe',color:'#7c3aed',padding:'6px',borderRadius:'6px'}}><Settings size={14}/></div>
                  <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:700,color:selectedLayer==='sig'?'#7c3aed':'#0f172a'}}>Signature</div><div style={{fontSize:'11px',color:'#64748b',marginTop:'2px'}}>{side.showSig?'Visible':'Hidden'}</div></div>
                </button>
                <button onClick={()=>{setSelectedQR(true);setSelectedFieldId(null);setSelectedLayer(null);setSelectedShapeId(null);}}
                  style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'8px',border:selectedQR?'1px solid #eab308':'1px solid #e2e8f0',background:selectedQR?'#fefce8':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.1s',marginBottom:'16px'}}>
                  <div style={{background:'#fef9c3',color:'#a16207',padding:'6px',borderRadius:'6px',fontSize:'13px',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',width:'26px',height:'26px'}}>▦</div>
                  <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:700,color:selectedQR?'#a16207':'#0f172a'}}>QR Code</div><div style={{fontSize:'11px',color:'#64748b',marginTop:'2px'}}>{(activeSide==='back'&&side.showQR)?'Visible (Back)':'Back side only'}</div></div>
                </button>

                {/* Shapes list */}
                {(side.shapes||[]).length>0 && <>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px',padding:'0 4px'}}>Shapes</div>
                  {(side.shapes||[]).map((sh:ShapeElement)=>(
                    <div key={sh.id} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                      <button onClick={()=>{setSelectedShapeId(sh.id);setSelectedFieldId(null);setSelectedLayer(null);setSelectedQR(false);}}
                        style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'8px',border:selectedShapeId===sh.id?'1px solid #667eea':'1px solid #e2e8f0',background:selectedShapeId===sh.id?'#eff6ff':'#fff',cursor:'pointer',textAlign:'left'}}>
                        <div style={{width:'20px',height:'20px',background:sh.fill,borderRadius:sh.type==='circle'?'50%':sh.type==='line'?'2px':`${sh.borderRadius||2}px`,border:`${sh.strokeWidth||0}px solid ${sh.stroke}`,flexShrink:0}}/>
                        <span style={{fontSize:'12px',fontWeight:600,color:selectedShapeId===sh.id?'#667eea':'#0f172a',textTransform:'capitalize'}}>{sh.type}</span>
                      </button>
                      <button onClick={()=>deleteShape(sh.id)} style={{padding:'6px',border:'1px solid #fecaca',borderRadius:'6px',background:'#fef2f2',color:'#dc2626',cursor:'pointer',display:'flex',alignItems:'center',flexShrink:0}}><Trash2 size={12}/></button>
                    </div>
                  ))}
                </>}

                {/* Text fields list */}
                <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px',padding:'0 4px',marginTop:'8px'}}>Text Fields</div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {side.fields.map((field:IDField)=>(
                    <div key={field.id} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <button onClick={()=>{setSelectedFieldId(field.id);setSelectedLayer(null);setSelectedShapeId(null);setSelectedQR(false);if(isMobile)setMobileTab('props');}}
                        style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'8px',border:selectedFieldId===field.id?'1px solid #667eea':'1px solid #e2e8f0',background:selectedFieldId===field.id?'#eff6ff':'#fff',cursor:'pointer',textAlign:'left'}}>
                        <div style={{display:'flex',flexDirection:'column',minWidth:0}}>
                          <div style={{fontSize:'12px',fontWeight:700,color:selectedFieldId===field.id?'#667eea':'#0f172a',display:'flex',alignItems:'center',gap:'6px'}}>
                            <span style={{width:'8px',height:'8px',borderRadius:'50%',background:field.visible?'#10b981':'#ef4444',flexShrink:0}}/>
                            {field.label}
                          </div>
                          <div style={{fontSize:'11px',color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'1px'}}>{field.value}</div>
                        </div>
                      </button>
                      {field.label==='Text Box' && <button onClick={()=>deleteField(field.id)} style={{padding:'6px',border:'1px solid #fecaca',borderRadius:'6px',background:'#fef2f2',color:'#dc2626',cursor:'pointer',display:'flex',alignItems:'center',flexShrink:0}}><Trash2 size={12}/></button>}
                    </div>
                  ))}
                </div>
              </AccSection>

              <AccSection id="templates" icon={<LayoutTemplate size={16}/>} title={`Existing Templates (${templates.length})`} open={openSection==="templates"} onToggle={toggleSection}>
                <p style={{margin:'0 0 10px',fontSize:'11px',color:'#64748b'}}>Load an existing template to edit.</p>
                <button onClick={()=>setShowTemplateModal(true)} disabled={templates.length===0}
                  style={{width:'100%',background:templates.length>0?'linear-gradient(135deg,#667eea,#764ba2)':'#f1f5f9',color:templates.length>0?'#fff':'#94a3b8',border:'none',borderRadius:'10px',padding:'11px',cursor:templates.length>0?'pointer':'not-allowed',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:templates.length>0?'0 4px 12px rgba(102,126,234,0.3)':'none'}}>
                  <LayoutTemplate size={15}/> {templates.length===0?'No Templates Yet':`Browse Templates (${templates.length})`}
                </button>
              </AccSection>
            </>}

            {/* ── ELEMENTS TAB ── */}
            {leftTab==='elements' && (
              <div style={{padding:'16px'}}>
                <p style={{margin:'0 0 16px',fontSize:'12px',color:'#64748b',lineHeight:'1.5'}}>Click to add an element to the card. Then drag to reposition and resize.</p>

                {/* Add Text */}
                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Text</div>
                  <button onClick={addTextBox}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'14px',borderRadius:'10px',border:'1.5px dashed #c7d2fe',background:'#eff6ff',cursor:'pointer',transition:'all 0.15s'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#e0e7ff';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#eff6ff';}}>
                    <div style={{background:'#667eea',color:'#fff',padding:'8px',borderRadius:'8px',fontSize:'14px',fontWeight:800,lineHeight:1}}>T</div>
                    <div><div style={{fontSize:'13px',fontWeight:700,color:'#4f46e5'}}>Add Text Box</div><div style={{fontSize:'11px',color:'#6366f1',marginTop:'2px'}}>Free-form draggable text</div></div>
                  </button>
                </div>

                {/* Shapes */}
                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Shapes</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                    {([
                      {type:'rect'   as const, label:'Rectangle', preview:<div style={{width:'28px',height:'20px',background:'#667eea',borderRadius:'3px'}}/>},
                      {type:'circle' as const, label:'Circle',    preview:<div style={{width:'22px',height:'22px',background:'#ec4899',borderRadius:'50%'}}/>},
                      {type:'line'   as const, label:'Line',      preview:<div style={{width:'28px',height:'3px',background:'#8b5cf6',borderRadius:'2px',marginTop:'9px'}}/>},
                    ]).map(({type,label,preview})=>(
                      <button key={type} onClick={()=>addShape(type)}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',padding:'14px 8px',borderRadius:'10px',border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',transition:'all 0.15s'}}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#f8fafc';(e.currentTarget as HTMLElement).style.borderColor='#667eea';}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';(e.currentTarget as HTMLElement).style.borderColor='#e2e8f0';}}>
                        <div style={{height:'22px',display:'flex',alignItems:'center'}}>{preview}</div>
                        <span style={{fontSize:'11px',color:'#475569',fontWeight:600}}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick color shapes */}
                <div>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Quick Color Blocks</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                    {['#667eea','#ec4899','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ffffff','#0f172a'].map(color=>(
                      <button key={color} onClick={()=>{
                        const sh:ShapeElement={id:`shape_${Date.now()}`,type:'rect',x:50,y:50,w:40,h:20,fill:color,fillOpacity:90,stroke:'transparent',strokeWidth:0,borderRadius:0};
                        setSide((p:IDSide)=>({...p,shapes:[...(p.shapes||[]),sh]}));
                        setSelectedShapeId(sh.id);setSelectedFieldId(null);setSelectedLayer(null);setSelectedQR(false);
                      }}
                        style={{width:'32px',height:'32px',borderRadius:'6px',background:color,border:'2px solid #e2e8f0',cursor:'pointer',transition:'transform 0.1s'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.15)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}
                        title={color}/>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── BACKGROUND TAB ── */}
            {leftTab==='background' && (
              <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'16px'}}>

                {/* Solid Color */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Solid Color</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'4px'}}>
                    {['#1e3a5f','#b91c1c','#0f172a','#1e40af','#065f46','#6b21a8','#9a3412','#374151','#ffffff'].map(c=>(
                      <button key={c} onClick={()=>updateSideProps({bgColor:c,bgGradient:null,background:null})}
                        style={{width:'28px',height:'28px',borderRadius:'6px',background:c,border:side.bgColor===c&&!side.bgGradient&&!side.background?'2px solid #667eea':'2px solid #e2e8f0',cursor:'pointer'}}/>
                    ))}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="color" value={side.bgColor||'#1e3a5f'} onChange={e=>updateSideProps({bgColor:e.target.value,bgGradient:null,background:null})}
                      style={{width:'40px',height:'36px',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',padding:'2px',flexShrink:0}}/>
                    <input type="text" value={side.bgColor||''} onChange={e=>updateSideProps({bgColor:e.target.value,bgGradient:null,background:null})} placeholder="#1e3a5f"
                      style={{...inpStyle,fontFamily:'monospace',fontSize:'12px'}}/>
                  </div>
                </div>

                {/* Gradient */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Gradient</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'4px'}}>
                    {[
                      {c1:'#667eea',c2:'#764ba2',a:135},
                      {c1:'#ec4899',c2:'#be185d',a:135},
                      {c1:'#1e3a5f',c2:'#0ea5e9',a:160},
                      {c1:'#065f46',c2:'#10b981',a:135},
                      {c1:'#b91c1c',c2:'#f97316',a:160},
                      {c1:'#6b21a8',c2:'#ec4899',a:135},
                    ].map(({c1,c2,a},i)=>(
                      <button key={i} onClick={()=>updateSideProps({bgGradient:{type:'linear',color1:c1,color2:c2,angle:a},background:null,bgColor:undefined})}
                        style={{width:'36px',height:'36px',borderRadius:'8px',background:`linear-gradient(${a}deg,${c1},${c2})`,border:'2px solid #e2e8f0',cursor:'pointer',transition:'transform 0.1s'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.1)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}/>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'11px',color:'#64748b',display:'block',marginBottom:'4px'}}>Color 1</label>
                      <input type="color" value={side.bgGradient?.color1||'#667eea'} onChange={e=>updateSideProps({bgGradient:{type:'linear',color1:e.target.value,color2:side.bgGradient?.color2||'#764ba2',angle:side.bgGradient?.angle??135},background:null})}
                        style={{width:'100%',height:'36px',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',padding:'2px'}}/>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'11px',color:'#64748b',display:'block',marginBottom:'4px'}}>Color 2</label>
                      <input type="color" value={side.bgGradient?.color2||'#764ba2'} onChange={e=>updateSideProps({bgGradient:{type:'linear',color1:side.bgGradient?.color1||'#667eea',color2:e.target.value,angle:side.bgGradient?.angle??135},background:null})}
                        style={{width:'100%',height:'36px',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',padding:'2px'}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <label style={{fontSize:'11px',color:'#64748b',minWidth:'48px'}}>Angle</label>
                    <input type="range" min={0} max={360} value={side.bgGradient?.angle??135} onChange={e=>updateSideProps({bgGradient:{type:'linear',color1:side.bgGradient?.color1||'#667eea',color2:side.bgGradient?.color2||'#764ba2',angle:Number(e.target.value)},background:null})} style={{flex:1,accentColor:'#667eea'}}/>
                    <span style={{fontSize:'12px',fontWeight:600,minWidth:'36px',textAlign:'right'}}>{side.bgGradient?.angle??135}°</span>
                  </div>
                </div>

                {/* Image Upload */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Image</div>
                  <label style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',border:'1.5px dashed #cbd5e1',borderRadius:'10px',padding:'20px',cursor:'pointer',background:'#fff',transition:'all 0.2s'}}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#667eea'; (e.currentTarget as HTMLElement).style.background='#eff6ff'; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#cbd5e1'; (e.currentTarget as HTMLElement).style.background='#fff'; }}>
                    <div style={{background:'#fff',padding:'10px',borderRadius:'50%',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}><Upload size={18} color="#667eea"/></div>
                    <div style={{textAlign:'center'}}>
                      <span style={{fontSize:'13px',color:'#0f172a',fontWeight:600,display:'block'}}>Upload Image</span>
                      <span style={{fontSize:'11px',color:'#64748b'}}>JPEG or PNG</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleBgUpload} style={{display:'none'}}/>
                  </label>
                  {side.background&&(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:'8px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <img src={side.background} style={{height:'32px',width:'24px',objectFit:'cover',borderRadius:'4px',border:'1px solid rgba(0,0,0,0.1)'}}/>
                        <span style={{fontSize:'12px',color:'#059669',fontWeight:600}}>Image Active</span>
                      </div>
                      <button onClick={()=>updateSideProps({background:null})} style={{fontSize:'11px',color:'#dc2626',background:'#fff',border:'1px solid #fecaca',borderRadius:'6px',padding:'4px 8px',cursor:'pointer',fontWeight:600}}>Remove</button>
                    </div>
                  )}
                  {/* Clear all background */}
                  {(side.bgColor||side.bgGradient||side.background) && (
                    <button onClick={()=>updateSideProps({bgColor:undefined,bgGradient:null,background:null})}
                      style={{padding:'8px',borderRadius:'8px',border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                      <X size={12}/> Clear Background
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
        {/* ════════════════════════════════════ CANVAS WORKSPACE ══ */}
        <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden',background:'#f1f5f9'}}
             onMouseDown={(e)=>{if(e.target===e.currentTarget){setSelectedFieldId(null);setSelectedLayer(null);}}}>
          
          {/* subtle dot grid background pattern */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(#cbd5e1 1px, transparent 1px)',backgroundSize:'24px 24px',opacity:0.6}}/>
          
          {showFlip ? (
            <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'32px',padding:'40px',position:'relative',zIndex:1}}>
              <div style={{perspective:'1200px'}}>
                <div style={{
                  width:CARD_W*1.5, height:CARD_H*1.5, position:'relative', transformStyle:'preserve-3d', transition:'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform:flipAnim?(flipFace==='front'?'rotateY(90deg)':'rotateY(-90deg)'):'rotateY(0deg)',
                }}>
                  {(frontUrl||backUrl)
                    ? <img src={flipFace==='front'?(frontUrl||''):(backUrl||'')} style={{width:'100%',height:'100%',borderRadius:'12px',boxShadow:'0 24px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',display:'block',objectFit:'fill'}}/>
                    : <div style={{width:'100%',height:'100%',background:'#fff',borderRadius:'12px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#94a3b8',boxShadow:'0 12px 32px rgba(0,0,0,0.05)'}}><Loader2 size={32} style={{animation:'spin 1s linear infinite', marginBottom:'12px', color:'#e2e8f0'}}/>Rendering…</div>
                  }
                </div>
              </div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',background:'#fff',padding:'16px 24px',borderRadius:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:'13px',color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',marginRight:'8px'}}>{flipFace==='front'?'▣ Front Face':'▢ Back Face'}</div>
                <button onClick={doFlip} style={{padding:'12px 28px',background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 14px rgba(124,58,237,0.3)'}}><RefreshCw size={16}/> Flip Card</button>
              </div>
            </div>
          ) : (
            <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:isMobile?'16px 12px':'32px 40px',position:'relative',zIndex:1,gap:'16px'}}
                 onMouseDown={(e)=>{if(e.target===e.currentTarget){setSelectedFieldId(null);setSelectedLayer(null);}}}>
              {/* Front/Back tab switcher - always shown in Template Editor */}
              <div style={{display:'flex',background:'#e2e8f0',borderRadius:'12px',padding:'4px',gap:'4px',flexShrink:0,alignSelf:'center'}}>
                {(['front','back'] as const).map(side => (
                  <button key={side} onClick={()=>{setActiveSide(side);setSelectedFieldId(null);setSelectedLayer(null);}}
                    style={{padding:'9px 28px',borderRadius:'9px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,
                      background:activeSide===side?'#fff':'transparent',
                      color:activeSide===side?'#0f172a':'#94a3b8',
                      boxShadow:activeSide===side?'0 2px 6px rgba(0,0,0,0.1)':'none',
                      transition:'all 0.15s',whiteSpace:'nowrap'}}>
                    {side==='front'?'▣ Front Card':'▢ Back Card'}
                  </button>
                ))}
              </div>
              {renderCard(activeSide)}
              <p style={{fontSize:'11px',color:'#94a3b8',margin:'0',textAlign:'center'}}>Click elements to select • Drag to reposition</p>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════ RIGHT PANEL (Properties) ══ */}
        <div style={{width:isMobile?'100%':'320px',flexShrink:0,background:'#fff',borderLeft:isMobile?'none':'1px solid #e2e8f0',display:isMobile?(mobileTab==='props'?'flex':'none'):'flex',flexDirection:'column',boxShadow:isMobile?'none':'-4px 0 24px rgba(0,0,0,0.02)',zIndex:10}}>
          {/* Properties Header */}
          <div style={{height:'56px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',background:'#f8fafc'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Settings size={16} color="#64748b"/>
              <span style={{fontWeight:700,fontSize:'13px',color:'#0f172a'}}>
                {selectedLayer ? (selectedLayer==='photo'?'Photo Settings':'Signature Settings') : selectedQR ? 'QR Code Settings' : selectedShape ? 'Shape Properties' : selectedField ? 'Text Properties' : 'Design Properties'}
              </span>
            </div>
            {(selectedLayer || selectedField || selectedQR || selectedShape) && (
              <button onClick={()=>{setSelectedLayer(null); setSelectedFieldId(null); setSelectedQR(false); setSelectedShapeId(null);}} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'4px',color:'#64748b',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}}><X size={14}/></button>
            )}
          </div>
          
          {/* Properties Content */}
          <div style={{flex:1,overflowY:'auto'}}>
            {selectedLayer ? (
              <LayerEditor layer={selectedLayer} side={side} onUpdate={updateSideProps}/>
            ) : selectedQR ? (
              <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
                <div style={{background:'#fefce8',border:'1px solid #fde68a',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#92400e',textTransform:'uppercase',letterSpacing:'1px'}}>QR Code Settings</div>
                  <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',background:back.showQR?'#10b98115':'#ef444415',border:`1px solid ${back.showQR?'#10b981':'#ef4444'}`,borderRadius:'8px',cursor:'pointer'}}>
                    <input type="checkbox" checked={!!back.showQR} onChange={e=>setBack((p:IDSide)=>({...p,showQR:e.target.checked}))} style={{accentColor:back.showQR?'#10b981':'#ef4444',width:'18px',height:'18px'}}/>
                    <span style={{fontSize:'13px',fontWeight:600,color:back.showQR?'#059669':'#dc2626'}}>{back.showQR?'QR Visible on Back':'QR Hidden'}</span>
                  </label>
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Position & Size</div>
                  {([['X %','qrX',back.qrX??50],['Y %','qrY',back.qrY??42],['Size %','qrSize',back.qrSize??70]] as [string,string,number][]).map(([l,k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <label style={{fontSize:'11px',color:'#64748b',minWidth:'52px',fontWeight:500}}>{l}</label>
                      <input type="range" min={5} max={100} value={v} onChange={e=>setBack((p:IDSide)=>({...p,[k]:Number(e.target.value)}))} style={{flex:1,accentColor:'#eab308'}}/>
                      <span style={{fontSize:'12px',fontWeight:600,color:'#0f172a',minWidth:'34px',textAlign:'right'}}>{v}%</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Verification URL</div>
                  <input type="text" value={back.qrUrl||''} onChange={e=>setBack((p:IDSide)=>({...p,qrUrl:e.target.value}))} placeholder="https://..." style={{...inpStyle,fontSize:'12px',fontFamily:'monospace'}}/>
                  <p style={{margin:0,fontSize:'11px',color:'#94a3b8'}}>Employee ID will be appended automatically.</p>
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Colors</div>
                  {([['Foreground','qrFg',back.qrFg||'#000000'],['Background','qrBg',back.qrBg||'#ffffff']] as [string,string,string][]).map(([l,k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <label style={{fontSize:'11px',color:'#64748b',minWidth:'64px',fontWeight:500}}>{l}</label>
                      <input type="color" value={v} onChange={e=>setBack((p:IDSide)=>({...p,[k]:e.target.value}))} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',background:'#fff'}}/>
                      <input type="text" value={v} onChange={e=>setBack((p:IDSide)=>({...p,[k]:e.target.value}))} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'6px 10px',fontSize:'12px',fontFamily:'monospace',outline:'none',color:'#0f172a'}}/>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedShape ? (
              <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
                {/* Fill */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Fill</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="color" value={selectedShape.fill==='transparent'?'#ffffff':selectedShape.fill} onChange={e=>updateShape(selectedShape.id,{fill:e.target.value})} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0}}/>
                    <input type="text" value={selectedShape.fill} onChange={e=>updateShape(selectedShape.id,{fill:e.target.value})} style={{flex:1,...inpStyle,fontFamily:'monospace',fontSize:'12px'}}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <label style={{fontSize:'11px',color:'#64748b',minWidth:'52px'}}>Opacity</label>
                    <input type="range" min={0} max={100} value={selectedShape.fillOpacity} onChange={e=>updateShape(selectedShape.id,{fillOpacity:Number(e.target.value)})} style={{flex:1,accentColor:'#667eea'}}/>
                    <span style={{fontSize:'12px',fontWeight:600,minWidth:'34px',textAlign:'right'}}>{selectedShape.fillOpacity}%</span>
                  </div>
                  <button onClick={()=>updateShape(selectedShape.id,{fill:'transparent',fillOpacity:0})} style={{padding:'6px 10px',borderRadius:'6px',border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontSize:'11px',fontWeight:600,alignSelf:'flex-start'}}>No Fill</button>
                </div>
                {/* Stroke */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Border / Stroke</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="color" value={selectedShape.stroke==='transparent'?'#000000':selectedShape.stroke} onChange={e=>updateShape(selectedShape.id,{stroke:e.target.value})} style={{width:'36px',height:'30px',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0}}/>
                    <input type="text" value={selectedShape.stroke} onChange={e=>updateShape(selectedShape.id,{stroke:e.target.value})} style={{flex:1,...inpStyle,fontFamily:'monospace',fontSize:'12px'}}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <label style={{fontSize:'11px',color:'#64748b',minWidth:'52px'}}>Width</label>
                    <input type="range" min={0} max={16} value={selectedShape.strokeWidth} onChange={e=>updateShape(selectedShape.id,{strokeWidth:Number(e.target.value)})} style={{flex:1,accentColor:'#667eea'}}/>
                    <span style={{fontSize:'12px',fontWeight:600,minWidth:'34px',textAlign:'right'}}>{selectedShape.strokeWidth}px</span>
                  </div>
                </div>
                {/* Border Radius (rect only) */}
                {selectedShape.type==='rect' && (
                  <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Corner Radius</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <input type="range" min={0} max={50} value={selectedShape.borderRadius||0} onChange={e=>updateShape(selectedShape.id,{borderRadius:Number(e.target.value)})} style={{flex:1,accentColor:'#667eea'}}/>
                      <span style={{fontSize:'12px',fontWeight:600,minWidth:'34px',textAlign:'right'}}>{selectedShape.borderRadius||0}px</span>
                    </div>
                  </div>
                )}
                {/* Position & Size */}
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'1px'}}>Position & Size</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    {([['X %','x',selectedShape.x],['Y %','y',selectedShape.y],['W %','w',selectedShape.w],['H %','h',selectedShape.h]] as [string,string,number][]).map(([lbl,key,val])=>(
                      <div key={key}>
                        <label style={{fontSize:'11px',color:'#64748b',display:'block',marginBottom:'4px',fontWeight:500}}>{lbl}</label>
                        <input type="number" value={Math.round(val*10)/10} min={0} max={100} step={0.5} onChange={e=>updateShape(selectedShape.id,{[key]:Number(e.target.value)})} style={{...inpStyle,padding:'6px 8px'}}/>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Delete */}
                <button onClick={()=>deleteShape(selectedShape.id)}
                  style={{padding:'10px',borderRadius:'8px',border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                  <Trash2 size={14}/> Delete Shape
                </button>
              </div>
            ) : selectedField ? (
              <FieldEditor field={selectedField} onUpdate={updateField}/>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'32px',textAlign:'center',color:'#94a3b8'}}>
                <div style={{background:'#f1f5f9',padding:'16px',borderRadius:'50%',marginBottom:'20px'}}><MousePointer2 size={32} color="#cbd5e1"/></div>
                <h3 style={{margin:'0 0 8px',fontSize:'15px',color:'#475569',fontWeight:700}}>No element selected</h3>
                <p style={{margin:0,fontSize:'13px',lineHeight:1.5}}>Click on any text field, photo, or signature layer on the canvas to edit its properties.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
      {/* ════════════ TEMPLATE PICKER MODAL ════════════ */}
      {showTemplateModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',padding:'16px'}}
          onClick={()=>setShowTemplateModal(false)}>
          <div style={{background:'#fff',borderRadius:'24px',width:'100%',maxWidth:'860px',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.3)',overflow:'hidden',animation:'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'linear-gradient(135deg,#667eea15,#764ba215)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:'10px',padding:'8px',display:'flex',boxShadow:'0 4px 10px rgba(102,126,234,0.35)'}}>
                  <LayoutTemplate size={16} color="white"/>
                </div>
                <div>
                  <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:'#0f172a'}}>Choose a Template</h3>
                  <p style={{margin:0,fontSize:'12px',color:'#94a3b8'}}>{templates.length} saved template{templates.length!==1?'s':''} — click to load</p>
                </div>
              </div>
              <button onClick={()=>setShowTemplateModal(false)}
                style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b'}}>
                <X size={16}/>
              </button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px'}}>
                {templates.map((t:IDTemplate)=>(
                  <div key={t.id}
                    style={{background:'#fff',border:'2px solid #e2e8f0',borderRadius:'16px',overflow:'hidden',transition:'all 0.2s',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#667eea';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(102,126,234,0.2)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#e2e8f0';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)';}}>
                    {/* Mini card previews */}
                    <div style={{background:'linear-gradient(135deg,#667eea08,#764ba208)',padding:'12px',display:'flex',gap:'8px',justifyContent:'center',borderBottom:'1px solid #f1f5f9'}}>
                      {([{sd:t.front,lbl:'F'},{sd:t.back,lbl:'B'}] as const).map(({sd,lbl})=>(
                        <div key={lbl} style={{width:'64px',height:'102px',borderRadius:'6px',overflow:'hidden',position:'relative',flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',background:sd.background?'#000':(lbl==='F'?'linear-gradient(160deg,#b91c1c,#ef4444,#f97316)':'linear-gradient(160deg,#f1f5f9,#e2e8f0)')}}>
                          {sd.background&&<img src={sd.background} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} crossOrigin="anonymous"/>}
                          <div style={{position:'absolute',inset:0,padding:'4px',display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:'1px'}}>
                            {(sd.fields as IDField[]).filter((f:IDField)=>f.visible).slice(0,3).map((f:IDField)=>(
                              <div key={f.id} style={{fontSize:`${Math.max(4,f.fontSize*64/214*0.85)}px`,color:f.color,fontWeight:f.bold?700:400,textAlign:f.align,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',lineHeight:1.2,textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>{f.value}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Info */}
                    <div style={{padding:'10px 12px 8px'}}>
                      <p style={{margin:'0 0 2px',fontSize:'13px',fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</p>
                      {t.company&&<p style={{margin:'0 0 2px',fontSize:'11px',color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.company}</p>}
                      {t.createdAt&&<p style={{margin:'0 0 10px',fontSize:'10px',color:'#94a3b8'}}>{t.createdAt}</p>}
                      {/* Action buttons */}
                      <div style={{display:'flex',gap:'6px'}}>
                        <button onClick={()=>loadTemplate(t)}
                          style={{flex:1,background:'linear-gradient(135deg,#667eea,#764ba2)',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 6px',cursor:'pointer',fontSize:'11px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',boxShadow:'0 2px 8px rgba(102,126,234,0.3)'}}>
                          <LayoutTemplate size={11}/> Load
                        </button>
                        <button onClick={()=>editTemplateInEditor(t)}
                          style={{background:'#f8fafc',color:'#64748b',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'7px 8px',cursor:'pointer',fontSize:'11px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}
                          title="Edit template">
                          <Pencil size={11}/>
                        </button>
                        <button onClick={()=>deleteTemplateFromModal(t.id)}
                          style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:'8px',padding:'7px 8px',cursor:'pointer',display:'flex',alignItems:'center'}}
                          title="Delete template">
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}