const API_URL = "http://10.10.0.3:5000/api";
const BASE_URL = "http://10.10.0.3:5000";

import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Printer, FileSpreadsheet, Loader2, Pencil, Check, X, Users, UserCheck, UserX, Menu, ChevronRight, Building2, Shield, CreditCard, Download } from 'lucide-react';

interface Employee { fullname: string; position: string; empCode?: string; company?: string; department?: string; }
interface EmployeeRecord {
  id: number; name: string; position: string; empCode?: string;
  indication: string; signature: string | null; photo: string | null;
}

// ── ID BUILDER TYPES ──
interface IDField {
  id: string;
  label: string;
  value: string;
  x: number; // percentage
  y: number; // percentage
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  visible: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  overlayBg?: string;
  overlayOpacity?: number;
}

interface IDSide {
  background: string | null;
  fields: IDField[];
  photoX: number; photoY: number; photoW: number; photoH: number; showPhoto: boolean;
  photoStrokeWidth?: number; photoStrokeColor?: string;
  photoShadowBlur?: number; photoShadowColor?: string;
  photoOverlayColor?: string; photoOverlayOpacity?: number;
  sigX: number; sigY: number; sigW: number; sigH: number; showSig: boolean;
  sigStrokeWidth?: number; sigStrokeColor?: string;
  sigShadowBlur?: number; sigShadowColor?: string;
  sigColorize?: boolean; sigColorizeColor?: string; sigBrightness?: number; sigContrast?: number;
  photoColorize?: boolean; photoColorizeColor?: string; photoBrightness?: number; photoContrast?: number;
}
interface IDTemplate {
  id: string; name: string; company: string; createdAt: string;
  front: IDSide; back: IDSide;
}

const defaultFrontFields: IDField[] = [
  { id: 'nickname', label: 'First Name / Nickname', value: 'JESUS', x: 50, y: 62, fontSize: 28, color: '#ffffff', bold: true, italic: false, align: 'center', visible: true },
  { id: 'idnum',    label: 'ID Number',              value: 'ABISC-231003', x: 50, y: 69, fontSize: 11, color: '#ffffff', bold: false, italic: false, align: 'center', visible: true },
  { id: 'fullname', label: 'Full Name',               value: 'JESUS B. ILLUSTRISIMO', x: 50, y: 78, fontSize: 11, color: '#ffffff', bold: true, italic: false, align: 'center', visible: true },
  { id: 'position', label: 'Position / Designation',  value: 'ASSISTANT PORT ENGINEER', x: 50, y: 83, fontSize: 10, color: '#ffffff', bold: false, italic: false, align: 'center', visible: true },
];

const defaultBackFields: IDField[] = [
  { id: 'emergency_num', label: 'Emergency Number', value: '09123456789', x: 50, y: 14, fontSize: 16, color: '#333333', bold: true, italic: false, align: 'center', visible: true },
];

async function uploadImage(file: File, employeeName: string, fileType: 'photo' | 'signature'): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeName', employeeName);
    formData.append('fileType', fileType);
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
    if (!res.ok) return null;
    return (await res.json()).url;
  } catch { return null; }
}

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

function ImgCell({ src, height, fit }: { src: string | null; height: number; fit: 'contain' | 'cover' }) {
  if (!src) return <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', textAlign: 'center' }}>—</span>;
  return <img src={src} style={{ width: '100%', height: `${height}px`, objectFit: fit, display: 'block' }} />;
}

function EditImgCell({ file, existingSrc, onFile, fit }: { file: File | null; existingSrc: string | null; onFile: (f: File) => void; fit: 'contain' | 'cover'; }) {
  const preview = file ? URL.createObjectURL(file) : existingSrc;
  return (
    <div style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', borderRadius: '4px', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden' }}>
      {preview ? <img src={preview} style={{ width: '100%', height: '86px', objectFit: fit }} /> : <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Upload</span>}
      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
    </div>
  );
}


// ── ID BUILDER ──
function IDBuilder({ records }: { records: EmployeeRecord[] }) {
  const CARD_W = 300, CARD_H = 480;

  // ── core state ──
  const [activeSide, setActiveSide] = React.useState<'front'|'back'>('front');
  const [zoom, setZoom]             = React.useState(1.3);
  const [showGrid, setShowGrid]     = React.useState(false);
  const [snap, setSnap]             = React.useState(true);

  // ── accordion open state ──
  const [openSection, setOpenSection] = React.useState<string>('employee');
  const toggleSection = (s: string) => setOpenSection(p => p === s ? '' : s);

  // ── field interaction ──
  const [selectedFieldId, setSelectedFieldId] = React.useState<string|null>(null);
  const [selectedLayer,   setSelectedLayer]   = React.useState<'photo'|'sig'|null>(null);
  const [draggingId,      setDraggingId]      = React.useState<string|null>(null);
  const [dragOffset,      setDragOffset]      = React.useState({x:0,y:0});
  const cardFrontRef = React.useRef<HTMLDivElement>(null);
  const cardBackRef  = React.useRef<HTMLDivElement>(null);

  // ── employee ──
  const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeRecord|null>(null);
  const [empSearch,        setEmpSearch]         = React.useState('');
  const [showEmpDrop,      setShowEmpDrop]       = React.useState(false);

  // ── card data ──
  const [front, setFront] = React.useState<IDSide>({
    background:null, fields: defaultFrontFields,
    photoX:50, photoY:35, photoW:55, photoH:40, showPhoto:true,
    sigX:50,   sigY:74,  sigW:40,  sigH:8,   showSig:true,
  });
  const [back, setBack] = React.useState<IDSide>({
    background:null, fields: defaultBackFields,
    photoX:50, photoY:35, photoW:55, photoH:40, showPhoto:false,
    sigX:50,   sigY:67,  sigW:40,  sigH:8,   showSig:false,
  });

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
  const [templateName,    setTemplateName]    = React.useState('');
  const [templateCompany, setTemplateCompany] = React.useState('');
  const [templateSaving,  setTemplateSaving]  = React.useState(false);
  React.useEffect(()=>{ fetch(`${API_URL}/templates`).then(r=>r.ok?r.json():[]).then(setTemplates).catch(()=>{}); },[]);

  // ── notifications ──
  const [msg,       setMsg]       = React.useState<{type:'success'|'error';text:string}|null>(null);
  const [savingID,  setSavingID]  = React.useState(false);
  const showMsg = (type:'success'|'error', text:string) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3000); };

  // ── helpers ──
  const side    = activeSide==='front' ? front : back;
  const setSide = activeSide==='front' ? setFront : setBack;
  const activeRef = activeSide==='front' ? cardFrontRef : cardBackRef;
  const selectedField = side.fields.find(f=>f.id===selectedFieldId)||null;

  const updateField = (id:string, updates:Partial<IDField>) =>
    setSide(p=>({...p, fields:p.fields.map(f=>f.id===id?{...f,...updates}:f)}));
  const updateSideProps = (updates:Partial<IDSide>) =>
    setSide(p=>({...p,...updates}));

  const autoFill = (emp:EmployeeRecord) => {
    setSelectedEmployee(emp); setEmpSearch(emp.name); setShowEmpDrop(false);
    setFront(p=>({...p, fields:p.fields.map(f=>{
      if(f.id==='fullname') return {...f, value:emp.name};
      if(f.id==='nickname') return {...f, value:emp.name.split(' ')[0]||emp.name};
      if(f.id==='position') return {...f, value:emp.position};
      if(f.id==='idnum' && emp.empCode) return {...f, value:emp.empCode};
      return f;
    })}));
  };

  const handleBgUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    const r=new FileReader(); r.onload=()=>updateSideProps({background:r.result as string}); r.readAsDataURL(file); e.target.value='';
  };

  const employeePhoto = selectedEmployee?.photo ? resolveImg(selectedEmployee.photo) : null;
  const employeeSig   = selectedEmployee?.signature ? resolveImg(selectedEmployee.signature) : null;

  // ── drag ──
  const handleFieldMouseDown = (e:React.MouseEvent, fieldId:string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedFieldId(fieldId); setDraggingId(fieldId);
    const rect = activeRef.current!.getBoundingClientRect();
    const f = side.fields.find(f=>f.id===fieldId)!;
    setDragOffset({ x: e.clientX-rect.left-(f.x/100*CARD_W*zoom), y: e.clientY-rect.top-(f.y/100*CARD_H*zoom) });
  };
  const handleMouseMove = React.useCallback((e:MouseEvent) => {
    if(!draggingId||!activeRef.current) return;
    const rect = activeRef.current.getBoundingClientRect();
    let x = (e.clientX-rect.left-dragOffset.x)/zoom/CARD_W*100;
    let y = (e.clientY-rect.top -dragOffset.y)/zoom/CARD_H*100;
    if(snap){ x=Math.round(x/5)*5; y=Math.round(y/5)*5; }
    x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
    setSide(p=>({...p, fields:p.fields.map(f=>f.id===draggingId?{...f,x,y}:f)}));
  },[draggingId,dragOffset,zoom,activeSide,snap]);
  const handleMouseUp = React.useCallback(()=>{
    if(draggingId){ setDraggingId(null); pushHistory(front,back); }
  },[draggingId,front,back,pushHistory]);
  React.useEffect(()=>{
    window.addEventListener('mousemove',handleMouseMove);
    window.addEventListener('mouseup',handleMouseUp);
    return ()=>{ window.removeEventListener('mousemove',handleMouseMove); window.removeEventListener('mouseup',handleMouseUp); };
  },[handleMouseMove,handleMouseUp]);

  // ── canvas renderer ──
  const renderSide = React.useCallback(async(which:'front'|'back'):Promise<string>=>{
    const sd=which==='front'?front:back; const W=600,H=960;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const ctx=cv.getContext('2d')!;
    const li=(src:string)=>new Promise<HTMLImageElement>((res,rej)=>{ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=rej; img.src=src; });
    if(sd.background){ try{ctx.drawImage(await li(sd.background),0,0,W,H);}catch{ctx.fillStyle='#cc0000';ctx.fillRect(0,0,W,H);} }
    else{ ctx.fillStyle='#cc0000'; ctx.fillRect(0,0,W,H); }
    const photo=which==='front'?employeePhoto:null;
    const drawImgWithEffects = (img:HTMLImageElement, x:number, y:number, w:number, h:number, opts:{strokeW?:number,strokeC?:string,shadowBlur?:number,shadowC?:string,overlayC?:string,overlayOp?:number,colorize?:boolean,colorizeColor?:string,brightness?:number,contrast?:number}) => {
      ctx.save();
      if(opts.shadowBlur&&opts.shadowBlur>0){ ctx.shadowColor=opts.shadowC||'rgba(0,0,0,0.6)'; ctx.shadowBlur=opts.shadowBlur*2; }
      if(opts.strokeW&&opts.strokeW>0){ ctx.strokeStyle=opts.strokeC||'#000000'; ctx.lineWidth=opts.strokeW*2; ctx.strokeRect(x,y,w,h); }
      ctx.drawImage(img,x,y,w,h);
      ctx.shadowBlur=0;
      // color overlay
      if(opts.overlayC&&opts.overlayOp&&opts.overlayOp>0){ ctx.globalAlpha=opts.overlayOp/100; ctx.fillStyle=opts.overlayC; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1; }
      // colorize: tint a black image to any color using multiply blend
      if(opts.colorize&&opts.colorizeColor){
        ctx.globalCompositeOperation='multiply';
        ctx.fillStyle=opts.colorizeColor;
        ctx.fillRect(x,y,w,h);
        ctx.globalCompositeOperation='source-over';
        // invert dark pixels: draw white where image is dark, then multiply target color
        // For black-to-white: draw image inverted using destination-out approach
      }
      ctx.restore();
    };
    // Special handler for signature colorize (black strokes → any color)
    const drawSigColorized = async (imgSrc:string, x:number, y:number, w:number, h:number, color:string, opts:{strokeW?:number,strokeC?:string,shadowBlur?:number,shadowC?:string}) => {
      const offCanvas = document.createElement('canvas'); offCanvas.width=w; offCanvas.height=h;
      const offCtx = offCanvas.getContext('2d')!;
      const img = await li(imgSrc);
      offCtx.drawImage(img,0,0,w,h);
      // Get pixel data and replace dark pixels with target color
      const pxData = offCtx.getImageData(0,0,w,h);
      const d = pxData.data;
      const tr=parseInt(color.slice(1,3),16), tg=parseInt(color.slice(3,5),16), tb=parseInt(color.slice(5,7),16);
      for(let i=0;i<d.length;i+=4){
        const brightness=(d[i]+d[i+1]+d[i+2])/3;
        const alpha=d[i+3]/255;
        // Dark pixels get recolored; light/transparent pixels become transparent
        const strength=(1-brightness/255)*alpha;
        d[i]=tr; d[i+1]=tg; d[i+2]=tb; d[i+3]=Math.round(strength*255);
      }
      offCtx.putImageData(pxData,0,0);
      ctx.save();
      if(opts.shadowBlur&&opts.shadowBlur>0){ ctx.shadowColor=opts.shadowC||'rgba(0,0,0,0.5)'; ctx.shadowBlur=opts.shadowBlur*2; }
      if(opts.strokeW&&opts.strokeW>0){ ctx.strokeStyle=opts.strokeC||'#000000'; ctx.lineWidth=opts.strokeW*2; ctx.strokeRect(x,y,w,h); }
      ctx.drawImage(offCanvas,x,y,w,h);
      ctx.shadowBlur=0;
      ctx.restore();
    };
    if(sd.showPhoto&&photo){ try{ const img=await li(photo); const pw=sd.photoW/100*W,ph=sd.photoH/100*H; const px=sd.photoX/100*W-pw/2,py=sd.photoY/100*H-ph/2; drawImgWithEffects(img,px,py,pw,ph,{strokeW:sd.photoStrokeWidth,strokeC:sd.photoStrokeColor,shadowBlur:sd.photoShadowBlur,shadowC:sd.photoShadowColor,overlayC:sd.photoOverlayColor,overlayOp:sd.photoOverlayOpacity}); }catch{} }
    if(sd.showSig&&employeeSig){
      try{
        const sw=sd.sigW/100*W,sh=sd.sigH/100*H; const sx=sd.sigX/100*W-sw/2,sy=sd.sigY/100*H-sh/2;
        if(sd.sigColorize&&sd.sigColorizeColor){
          await drawSigColorized(employeeSig,sx,sy,sw,sh,sd.sigColorizeColor,{strokeW:sd.sigStrokeWidth,strokeC:sd.sigStrokeColor,shadowBlur:sd.sigShadowBlur,shadowC:sd.sigShadowColor});
        } else {
          const img=await li(employeeSig);
          drawImgWithEffects(img,sx,sy,sw,sh,{strokeW:sd.sigStrokeWidth,strokeC:sd.sigStrokeColor,shadowBlur:sd.sigShadowBlur,shadowC:sd.sigShadowColor});
        }
      }catch{}
    }
    sd.fields.filter(f=>f.visible).forEach(f=>{
      const fs=f.fontSize*2;
      ctx.font=`${f.italic?'italic ':''}${f.bold?'bold ':''}${fs}px 'Segoe UI',sans-serif`;
      ctx.textAlign=f.align;
      const x=f.align==='right'?(100-f.x)/100*W:f.x/100*W; const y=f.y/100*H;
      const words=f.value.split(' '); let line='',lines:string[]=[];
      for(const w of words){ const t=line+(line?' ':'')+w; if(ctx.measureText(t).width>W*0.85&&line){lines.push(line);line=w;}else line=t; }
      lines.push(line);
      // shadow
      if(f.shadowBlur && f.shadowBlur>0){ ctx.shadowColor=f.shadowColor||'rgba(0,0,0,0.6)'; ctx.shadowBlur=f.shadowBlur*2; } else { ctx.shadowBlur=0; }
      lines.forEach((l,i)=>{
        const ly=y+i*fs*1.3;
        // overlay background
        if(f.overlayBg && f.overlayOpacity && f.overlayOpacity>0){
          const mw=ctx.measureText(l).width;
          const ox=f.align==='center'?x-mw/2:f.align==='right'?x-mw:x;
          ctx.globalAlpha=f.overlayOpacity/100;
          ctx.fillStyle=f.overlayBg;
          ctx.fillRect(ox-4,ly-fs,mw+8,fs*1.2);
          ctx.globalAlpha=1;
        }
        // stroke
        if(f.strokeWidth && f.strokeWidth>0){
          ctx.strokeStyle=f.strokeColor||'#000000';
          ctx.lineWidth=f.strokeWidth*2;
          ctx.lineJoin='round';
          ctx.strokeText(l,x,ly);
        }
        ctx.fillStyle=f.color;
        ctx.fillText(l,x,ly);
      });
      ctx.shadowBlur=0;
    });
    return cv.toDataURL('image/png');
  },[front,back,employeePhoto,employeeSig]);

  const downloadSide = async(w:'front'|'back')=>{ const url=await renderSide(w); const a=document.createElement('a'); a.download=`id-${w}.png`; a.href=url; a.click(); };

  const saveIDToServer = async()=>{
    if(!selectedEmployee){ showMsg('error','Select an employee first.'); return; }
    setSavingID(true);
    try{
      const [fi,bi]=await Promise.all([renderSide('front'),renderSide('back')]);
      const res=await fetch(`${API_URL}/saved-ids`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:`${selectedEmployee.id}-${Date.now()}`,employeeName:selectedEmployee.name,position:selectedEmployee.position,company:'',frontImg:fi,backImg:bi,savedAt:new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})})});
      showMsg(res.ok?'success':'error', res.ok?`ID saved for ${selectedEmployee.name}!`:'Failed to save.');
    }catch{ showMsg('error','Server error.'); }
    setSavingID(false);
  };

  const saveTemplate = async()=>{
    if(!templateName.trim()) return; setTemplateSaving(true);
    const t:IDTemplate={id:Date.now().toString(),name:templateName.trim(),company:templateCompany.trim(),createdAt:new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}),front,back};
    const updated=[...templates,t];
    await fetch(`${API_URL}/templates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
    setTemplates(updated); setTemplateName(''); setTemplateCompany('');
    showMsg('success',`Template "${t.name}" saved!`); setTemplateSaving(false);
  };
  const loadTemplate = (t:IDTemplate)=>{ setFront(t.front); setBack(t.back); pushHistory(t.front,t.back); showMsg('success',`Loaded "${t.name}"`); };
  const deleteTemplate = async(id:string)=>{ const u=templates.filter(t=>t.id!==id); await fetch(`${API_URL}/templates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(u)}); setTemplates(u); };

  // ── shared styles ──
  const inp:React.CSSProperties = {width:'100%',background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:'6px',padding:'7px 10px',color:'#1e293b',fontSize:'12px',outline:'none',boxSizing:'border-box'};

  // ── accordion section component ──
  const AccSection = ({id,icon,title,children}:{id:string;icon:string;title:string;children:React.ReactNode}) => {
    const open = openSection===id;
    return (
      <div style={{borderBottom:'1px solid #f1f5f9'}}>
        <button onClick={()=>toggleSection(id)}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 16px',background:open?'#f8fafc':'#fff',border:'none',cursor:'pointer',textAlign:'left'}}>
          <span style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',fontWeight:700,color:open?'#1e40af':'#374151'}}>
            <span style={{fontSize:'14px'}}>{icon}</span>{title}
          </span>
          <span style={{color:'#94a3b8',fontSize:'11px',transform:open?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▼</span>
        </button>
        {open && <div style={{padding:'12px 16px 14px',background:'#f8fafc'}}>{children}</div>}
      </div>
    );
  };

  // ── card renderer ──
  const renderCard = (which:'front'|'back') => {
    const sd     = which==='front'?front:back;
    const isActive = activeSide===which;
    const ref    = which==='front'?cardFrontRef:cardBackRef;
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px'}}>
        {/* label */}
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <button onClick={e=>{e.stopPropagation();setActiveSide(which);setSelectedFieldId(null);}}
            style={{padding:'4px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:700,fontSize:'11px',letterSpacing:'0.5px',background:isActive?'#1e40af':'rgba(255,255,255,0.1)',color:isActive?'#fff':'rgba(255,255,255,0.5)',transition:'all 0.15s'}}>
            {which==='front'?'▣ FRONT':'▢ BACK'}
          </button>
          {isActive && <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>click field to select • drag to move</span>}
        </div>
        {/* card */}
        <div ref={ref}
          style={{width:CARD_W*zoom,height:CARD_H*zoom,position:'relative',borderRadius:8*zoom,overflow:'hidden',
            boxShadow:isActive?`0 0 0 3px #3b82f6, 0 20px 60px rgba(0,0,0,0.5)`:`0 8px 32px rgba(0,0,0,0.4)`,
            userSelect:'none',flexShrink:0,transition:'box-shadow 0.2s',cursor:'default'}}>

          {/* background */}
          {sd.background
            ? <img src={sd.background} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
            : <div style={{position:'absolute',inset:0,background:which==='front'?'linear-gradient(160deg,#b91c1c,#ef4444,#f97316)':'linear-gradient(160deg,#f1f5f9,#e2e8f0)',pointerEvents:'none'}}/>}

          {/* grid */}
          {showGrid&&isActive&&<div style={{position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)`,backgroundSize:`${CARD_W*zoom/10}px ${CARD_H*zoom/10}px`,pointerEvents:'none',zIndex:5}}/>}

          {/* center guides while dragging */}
          {draggingId&&isActive&&<>
            <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'rgba(59,130,246,0.6)',zIndex:6,pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:'50%',left:0,right:0,height:'1px',background:'rgba(59,130,246,0.6)',zIndex:6,pointerEvents:'none'}}/>
          </>}

          {/* photo */}
          {sd.showPhoto&&employeePhoto&&(
            <div
              onClick={e=>{e.stopPropagation(); setActiveSide(which); setSelectedLayer(isActive&&selectedLayer==='photo'?null:'photo'); setSelectedFieldId(null);}}
              style={{position:'absolute',left:`${sd.photoX}%`,top:`${sd.photoY}%`,width:`${sd.photoW}%`,height:`${sd.photoH}%`,transform:'translate(-50%,-50%)',
                cursor:'pointer', zIndex:8,
                boxShadow:sd.photoShadowBlur&&sd.photoShadowBlur>0?`0 0 ${sd.photoShadowBlur}px ${sd.photoShadowColor||'rgba(0,0,0,0.6)'}`:'none',
                outline:(isActive&&selectedLayer==='photo')?'3px dashed #60a5fa':(sd.photoStrokeWidth&&sd.photoStrokeWidth>0?`${sd.photoStrokeWidth}px solid ${sd.photoStrokeColor||'#000000'}`:'none'),
                outlineOffset:(isActive&&selectedLayer==='photo')?'3px':'-1px', overflow:'hidden'}}>
              <img src={employeePhoto} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',
                filter:[
                  sd.photoBrightness!==undefined&&sd.photoBrightness!==100?`brightness(${sd.photoBrightness}%)`:'',
                  sd.photoContrast!==undefined&&sd.photoContrast!==100?`contrast(${sd.photoContrast}%)`:'',
                ].filter(Boolean).join(' ')||'none'}}/>
              {sd.photoOverlayOpacity&&sd.photoOverlayOpacity>0&&<div style={{position:'absolute',inset:0,background:sd.photoOverlayColor||'#000000',opacity:sd.photoOverlayOpacity/100,mixBlendMode:'normal'}}/>}
              {sd.photoColorize&&sd.photoColorizeColor&&<div style={{position:'absolute',inset:0,background:sd.photoColorizeColor,mixBlendMode:'color'}}/>}
            </div>
          )}
          {sd.showSig&&employeeSig&&(
            <div
              onClick={e=>{e.stopPropagation(); setActiveSide(which); setSelectedLayer(isActive&&selectedLayer==='sig'?null:'sig'); setSelectedFieldId(null);}}
              style={{position:'absolute',left:`${sd.sigX}%`,top:`${sd.sigY}%`,width:`${sd.sigW}%`,height:`${sd.sigH}%`,transform:'translate(-50%,-50%)',
                cursor:'pointer', zIndex:8,
                boxShadow:sd.sigShadowBlur&&sd.sigShadowBlur>0?`0 0 ${sd.sigShadowBlur}px ${sd.sigShadowColor||'rgba(0,0,0,0.6)'}`:'none',
                outline:(isActive&&selectedLayer==='sig')?'3px dashed #a78bfa':(sd.sigStrokeWidth&&sd.sigStrokeWidth>0?`${sd.sigStrokeWidth}px solid ${sd.sigStrokeColor||'#000000'}`:'none'),
                outlineOffset:(isActive&&selectedLayer==='sig')?'3px':'-1px'}}>
              <img src={employeeSig} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',
                filter:[
                  sd.sigColorize&&sd.sigColorizeColor?`brightness(0) saturate(100%) invert(1)`:'',
                  !sd.sigColorize&&sd.sigBrightness!==undefined&&sd.sigBrightness!==100?`brightness(${sd.sigBrightness}%)`:'',
                  !sd.sigColorize&&sd.sigContrast!==undefined&&sd.sigContrast!==100?`contrast(${sd.sigContrast}%)`:'',
                ].filter(Boolean).join(' ')||'none'}}/>
              {sd.sigColorize&&sd.sigColorizeColor&&<div style={{position:'absolute',inset:0,background:sd.sigColorizeColor,mixBlendMode:'multiply'}}/>}
            </div>
          )}

          {/* text fields */}
          {sd.fields.filter(f=>f.visible).map(field=>{
            const isSel  = isActive&&selectedFieldId===field.id;
            const isDrag = draggingId===field.id;
            return (
              <div key={field.id}
                onMouseDown={isActive?e=>handleFieldMouseDown(e,field.id):undefined}
                onClick={e=>{ e.stopPropagation(); setActiveSide(which); setSelectedFieldId(field.id); setSelectedLayer(null); }}
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
                  textAlign:field.align,
                  maxWidth:'90%',
                  lineHeight:1.3,
                  fontFamily:"'Segoe UI',sans-serif",
                  cursor:isActive?(isDrag?'grabbing':'grab'):'pointer',
                  zIndex:10,
                  outline:isSel?'2px dashed rgba(96,165,250,0.9)':'2px solid transparent',
                  outlineOffset:'3px',
                  borderRadius:'3px',
                  padding:'1px 4px',
                  background:isSel?'rgba(59,130,246,0.15)':isDrag?'rgba(59,130,246,0.08)':(field.overlayBg&&field.overlayOpacity?`${field.overlayBg}${Math.round((field.overlayOpacity/100)*255).toString(16).padStart(2,'0')}`:'transparent'),
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

  // ── RIGHT PANEL: layer editor (photo / sig) ──
  const LayerEditor = () => {
    if(!selectedLayer) return null;
    const isPhoto = selectedLayer==='photo';
    const label = isPhoto ? '📷 Photo Layer' : '✍ Signature Layer';
    const accentColor = isPhoto ? '#1e40af' : '#7c3aed';
    const sd = side;

    const sliderRow = (lbl:string, val:number, min:number, max:number, key:string, accent:string) => (
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <label style={{fontSize:'10px',color:'#475569',minWidth:'64px',fontWeight:600}}>{lbl}</label>
        <input type="range" min={min} max={max} step={1} value={val}
          onChange={e=>updateSideProps({[key]:Number(e.target.value)})}
          style={{flex:1,accentColor:accent}}/>
        <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'30px',textAlign:'right'}}>{val}{max===100&&min===0?'%':''}</span>
      </div>
    );
    const colorRow = (lbl:string, val:string, key:string) => (
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <label style={{fontSize:'10px',color:'#475569',minWidth:'64px',fontWeight:600}}>{lbl}</label>
        <input type="color" value={val} onChange={e=>updateSideProps({[key]:e.target.value})}
          style={{width:'32px',height:'26px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
        <input type="text" value={val} onChange={e=>updateSideProps({[key]:e.target.value})}
          style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 7px',fontSize:'11px',fontFamily:'monospace',outline:'none',color:'#1e293b'}}/>
      </div>
    );
    const panel = (title:string, children:React.ReactNode) => (
      <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
        <div style={{fontSize:'9px',fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'2px'}}>{title}</div>
        {children}
      </div>
    );

    return (
      <div style={{width:'268px',flexShrink:0,background:'#fff',borderLeft:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-4px 0 16px rgba(0,0,0,0.08)'}}>
        {/* header */}
        <div style={{padding:'12px 16px',background:accentColor,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:800,color:'#fff',letterSpacing:'0.5px'}}>LAYER STYLES</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.75)',marginTop:'1px'}}>{label}</div>
          </div>
          <button onClick={()=>setSelectedLayer(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',cursor:'pointer',borderRadius:'6px',width:'28px',height:'28px',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:'12px'}}>

          {/* Position & Size */}
          {panel('Position & Size',
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
              {(isPhoto
                ?[{l:'X %',k:'photoX',v:sd.photoX},{l:'Y %',k:'photoY',v:sd.photoY},{l:'W %',k:'photoW',v:sd.photoW},{l:'H %',k:'photoH',v:sd.photoH}]
                :[{l:'X %',k:'sigX',v:sd.sigX},{l:'Y %',k:'sigY',v:sd.sigY},{l:'W %',k:'sigW',v:sd.sigW},{l:'H %',k:'sigH',v:sd.sigH}]
              ).map(({l,k,v})=>(
                <div key={k}>
                  <label style={{fontSize:'9px',color:'#64748b',display:'block',marginBottom:'2px',fontWeight:600}}>{l}</label>
                  <input type="number" value={v} min={0} max={100} onChange={e=>updateSideProps({[k]:Number(e.target.value)})}
                    style={{width:'100%',background:'#fff',border:'1px solid #e2e8f0',borderRadius:'5px',padding:'5px 7px',fontSize:'12px',outline:'none',color:'#1e293b',boxSizing:'border-box'}}/>
                </div>
              ))}
            </div>
          )}

          {/* ── SIGNATURE COLORIZE (the main feature) ── */}
          {!isPhoto && panel('🎨 Recolor Signature',
            <>
              <p style={{margin:'0 0 4px',fontSize:'10px',color:'#64748b',lineHeight:'1.5'}}>
                Use this to change your signature color — e.g. convert <strong>black</strong> ink to <strong>white</strong> for dark ID backgrounds. Works by replacing dark pixels with the chosen color.
              </p>
              <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',background:sd.sigColorize?'#fdf4ff':'#f8fafc',border:`1.5px solid ${sd.sigColorize?'#c084fc':'#e2e8f0'}`,borderRadius:'7px',cursor:'pointer'}}>
                <input type="checkbox" checked={!!sd.sigColorize} onChange={e=>updateSideProps({sigColorize:e.target.checked})} style={{accentColor:'#7c3aed',width:'15px',height:'15px'}}/>
                <span style={{fontSize:'12px',fontWeight:700,color:sd.sigColorize?'#7c3aed':'#64748b'}}>{sd.sigColorize?'Recolor ON':'Recolor OFF'}</span>
              </label>
              {sd.sigColorize && colorRow('Color',sd.sigColorizeColor||'#ffffff','sigColorizeColor')}
              {sd.sigColorize && (
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {[{c:'#ffffff',l:'White'},{c:'#f0e6d3',l:'Cream'},{c:'#ffd700',l:'Gold'},{c:'#c0c0c0',l:'Silver'},{c:'#1e40af',l:'Navy'},{c:'#000000',l:'Black'}].map(({c,l})=>(
                    <button key={c} onClick={()=>updateSideProps({sigColorizeColor:c})}
                      style={{padding:'3px 8px',borderRadius:'5px',border:`2px solid ${(sd.sigColorizeColor||'#ffffff')===c?accentColor:'#e2e8f0'}`,background:c,color:c==='#ffffff'||c==='#f0e6d3'||c==='#ffd700'||c==='#c0c0c0'?'#1e293b':'#fff',fontSize:'10px',fontWeight:700,cursor:'pointer'}}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PHOTO COLORIZE ── */}
          {isPhoto && panel('🎨 Color Overlay',
            <>
              <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',background:sd.photoColorize?'#eff6ff':'#f8fafc',border:`1.5px solid ${sd.photoColorize?'#3b82f6':'#e2e8f0'}`,borderRadius:'7px',cursor:'pointer'}}>
                <input type="checkbox" checked={!!sd.photoColorize} onChange={e=>updateSideProps({photoColorize:e.target.checked})} style={{accentColor:'#1e40af',width:'15px',height:'15px'}}/>
                <span style={{fontSize:'12px',fontWeight:700,color:sd.photoColorize?'#1e40af':'#64748b'}}>{sd.photoColorize?'Colorize ON':'Colorize OFF'}</span>
              </label>
              {sd.photoColorize && colorRow('Color',sd.photoColorizeColor||'#000080','photoColorizeColor')}
            </>
          )}

          {/* Brightness / Contrast */}
          {panel('Brightness & Contrast',
            <>
              {sliderRow('Brightness',(isPhoto?sd.photoBrightness:sd.sigBrightness)??100,0,200,isPhoto?'photoBrightness':'sigBrightness','#f59e0b')}
              {sliderRow('Contrast',(isPhoto?sd.photoContrast:sd.sigContrast)??100,0,200,isPhoto?'photoContrast':'sigContrast','#06b6d4')}
              <button onClick={()=>updateSideProps(isPhoto?{photoBrightness:100,photoContrast:100}:{sigBrightness:100,sigContrast:100})}
                style={{padding:'4px 10px',borderRadius:'5px',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',cursor:'pointer',fontSize:'10px',fontWeight:600,alignSelf:'flex-start'}}>
                Reset to 100%
              </button>
            </>
          )}

          {/* Stroke */}
          {panel(isPhoto?'Photo Stroke':'Signature Border',
            <>
              {sliderRow('Width',(isPhoto?sd.photoStrokeWidth:sd.sigStrokeWidth)||0,0,16,isPhoto?'photoStrokeWidth':'sigStrokeWidth','#1e40af')}
              {colorRow('Color',(isPhoto?sd.photoStrokeColor:sd.sigStrokeColor)||'#ffffff',isPhoto?'photoStrokeColor':'sigStrokeColor')}
            </>
          )}

          {/* Shadow */}
          {panel(isPhoto?'Photo Shadow':'Signature Shadow',
            <>
              {sliderRow('Blur',(isPhoto?sd.photoShadowBlur:sd.sigShadowBlur)||0,0,30,isPhoto?'photoShadowBlur':'sigShadowBlur','#7c3aed')}
              {colorRow('Color',(isPhoto?sd.photoShadowColor:sd.sigShadowColor)||'#000000',isPhoto?'photoShadowColor':'sigShadowColor')}
            </>
          )}

          {/* Photo-only: Overlay */}
          {isPhoto && panel('Color Overlay (Tint)',
            <>
              {sliderRow('Opacity',sd.photoOverlayOpacity||0,0,100,'photoOverlayOpacity','#b45309')}
              {colorRow('Color',sd.photoOverlayColor||'#000000','photoOverlayColor')}
            </>
          )}

          {/* visibility toggle */}
          <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:isPhoto?(sd.showPhoto?'#f0fdf4':'#fef2f2'):(sd.showSig?'#f0fdf4':'#fef2f2'),border:`1px solid ${isPhoto?(sd.showPhoto?'#86efac':'#fca5a5'):(sd.showSig?'#86efac':'#fca5a5')}`,borderRadius:'8px',cursor:'pointer'}}>
            <input type="checkbox" checked={isPhoto?sd.showPhoto:sd.showSig} onChange={e=>updateSideProps(isPhoto?{showPhoto:e.target.checked}:{showSig:e.target.checked})} style={{accentColor:'#15803d',width:'16px',height:'16px'}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:(isPhoto?sd.showPhoto:sd.showSig)?'#15803d':'#b91c1c'}}>{(isPhoto?sd.showPhoto:sd.showSig)?'Visible on card':'Hidden from card'}</span>
          </label>

        </div>
      </div>
    );
  };


  const FieldEditor = () => {
    if(!selectedField) return null;
    return (
      <div style={{width:'260px',flexShrink:0,background:'#fff',borderLeft:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-4px 0 16px rgba(0,0,0,0.08)'}}>
        {/* header */}
        <div style={{padding:'12px 16px',background:'#1e40af',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:800,color:'#fff',letterSpacing:'0.5px'}}>EDITING FIELD</div>
            <div style={{fontSize:'12px',color:'#bfdbfe',marginTop:'1px'}}>{selectedField.label}</div>
          </div>
          <button onClick={()=>setSelectedFieldId(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',cursor:'pointer',borderRadius:'6px',width:'28px',height:'28px',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'14px'}}>

          {/* text content */}
          <div>
            <label style={{display:'block',fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'5px'}}>Text Content</label>
            <textarea value={selectedField.value} rows={3}
              onChange={e=>updateField(selectedField.id,{value:e.target.value})}
              style={{...inp,resize:'vertical',fontFamily:'inherit',lineHeight:'1.5'}}/>
          </div>

          {/* font size */}
          <div>
            <label style={{display:'block',fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Font Size — {selectedField.fontSize}px</label>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <button onClick={()=>updateField(selectedField.id,{fontSize:Math.max(6,selectedField.fontSize-1)})}
                style={{width:'32px',height:'32px',border:'1.5px solid #e2e8f0',borderRadius:'6px',background:'#f8fafc',cursor:'pointer',fontSize:'16px',color:'#475569',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
              <input type="range" min={6} max={60} value={selectedField.fontSize}
                onChange={e=>updateField(selectedField.id,{fontSize:Number(e.target.value)})}
                style={{flex:1,accentColor:'#1e40af'}}/>
              <button onClick={()=>updateField(selectedField.id,{fontSize:Math.min(60,selectedField.fontSize+1)})}
                style={{width:'32px',height:'32px',border:'1.5px solid #e2e8f0',borderRadius:'6px',background:'#f8fafc',cursor:'pointer',fontSize:'16px',color:'#475569',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
            </div>
          </div>

          {/* color */}
          <div>
            <label style={{display:'block',fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Color</label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <input type="color" value={selectedField.color} onChange={e=>updateField(selectedField.id,{color:e.target.value})}
                style={{width:'44px',height:'38px',border:'1.5px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0}}/>
              <input type="text" value={selectedField.color} onChange={e=>updateField(selectedField.id,{color:e.target.value})}
                style={{...inp,fontFamily:'monospace',fontSize:'13px'}}/>
            </div>
            {/* quick color swatches */}
            <div style={{display:'flex',gap:'5px',marginTop:'8px',flexWrap:'wrap'}}>
              {['#ffffff','#000000','#1e293b','#cc0000','#1e40af','#15803d','#b45309','#6d28d9'].map(c=>(
                <button key={c} onClick={()=>updateField(selectedField.id,{color:c})}
                  style={{width:'24px',height:'24px',borderRadius:'50%',background:c,border:selectedField.color===c?'2px solid #3b82f6':'2px solid #e2e8f0',cursor:'pointer',transition:'transform 0.1s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.2)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}/>
              ))}
            </div>
          </div>

          {/* style buttons */}
          <div>
            <label style={{display:'block',fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Style & Alignment</label>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={()=>updateField(selectedField.id,{bold:!selectedField.bold})}
                style={{flex:1,padding:'8px',borderRadius:'6px',border:selectedField.bold?'2px solid #1e40af':'1.5px solid #e2e8f0',background:selectedField.bold?'#eff6ff':'#f8fafc',color:selectedField.bold?'#1e40af':'#64748b',cursor:'pointer',fontWeight:900,fontSize:'14px'}}>B</button>
              <button onClick={()=>updateField(selectedField.id,{italic:!selectedField.italic})}
                style={{flex:1,padding:'8px',borderRadius:'6px',border:selectedField.italic?'2px solid #1e40af':'1.5px solid #e2e8f0',background:selectedField.italic?'#eff6ff':'#f8fafc',color:selectedField.italic?'#1e40af':'#64748b',cursor:'pointer',fontStyle:'italic',fontSize:'14px'}}>I</button>
              {(['left','center','right'] as const).map(a=>(
                <button key={a} onClick={()=>updateField(selectedField.id,{align:a})}
                  style={{flex:1,padding:'8px',borderRadius:'6px',border:selectedField.align===a?'2px solid #1e40af':'1.5px solid #e2e8f0',background:selectedField.align===a?'#eff6ff':'#f8fafc',color:selectedField.align===a?'#1e40af':'#64748b',cursor:'pointer',fontSize:'13px'}}>
                  {a==='left'?'⬅':a==='center'?'⬌':'➡'}
                </button>
              ))}
            </div>
          </div>

          {/* position display */}
          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'6px'}}>Position on Card</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[{label:'X (left→right)',key:'x',val:selectedField.x},{label:'Y (top→bottom)',key:'y',val:selectedField.y}].map(({label,key,val})=>(
                <div key={key}>
                  <label style={{fontSize:'10px',color:'#94a3b8',display:'block',marginBottom:'3px'}}>{label}</label>
                  <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <input type="number" value={Math.round(val*10)/10} min={0} max={100} step={0.5}
                      onChange={e=>updateField(selectedField.id,{[key]:Number(e.target.value)})}
                      style={{...inp,padding:'5px 8px',fontSize:'12px',fontFamily:'monospace'}}/>
                    <span style={{fontSize:'11px',color:'#94a3b8',flexShrink:0}}>%</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{margin:'8px 0 0',fontSize:'10px',color:'#94a3b8',textAlign:'center'}}>💡 Drag the field on the card for easier positioning</p>
          </div>

          {/* ── Text Stroke ── */}
          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>Text Stroke</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Width</label>
              <input type="range" min={0} max={8} step={0.5} value={selectedField.strokeWidth||0}
                onChange={e=>updateField(selectedField.id,{strokeWidth:Number(e.target.value)})}
                style={{flex:1,accentColor:'#1e40af'}}/>
              <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'28px',textAlign:'right'}}>{selectedField.strokeWidth||0}px</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Color</label>
              <input type="color" value={selectedField.strokeColor||'#000000'} onChange={e=>updateField(selectedField.id,{strokeColor:e.target.value})}
                style={{width:'36px',height:'28px',border:'1.5px solid #e2e8f0',borderRadius:'5px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
              <input type="text" value={selectedField.strokeColor||'#000000'} onChange={e=>updateField(selectedField.id,{strokeColor:e.target.value})}
                style={{flex:1,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:'5px',padding:'5px 8px',fontSize:'11px',fontFamily:'monospace',color:'#1e293b',outline:'none'}}/>
            </div>
          </div>

          {/* ── Text Shadow ── */}
          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>Text Shadow</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Blur</label>
              <input type="range" min={0} max={20} step={1} value={selectedField.shadowBlur||0}
                onChange={e=>updateField(selectedField.id,{shadowBlur:Number(e.target.value)})}
                style={{flex:1,accentColor:'#7c3aed'}}/>
              <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'28px',textAlign:'right'}}>{selectedField.shadowBlur||0}px</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Color</label>
              <input type="color" value={selectedField.shadowColor||'#000000'} onChange={e=>updateField(selectedField.id,{shadowColor:e.target.value})}
                style={{width:'36px',height:'28px',border:'1.5px solid #e2e8f0',borderRadius:'5px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
              <input type="text" value={selectedField.shadowColor||'#000000'} onChange={e=>updateField(selectedField.id,{shadowColor:e.target.value})}
                style={{flex:1,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:'5px',padding:'5px 8px',fontSize:'11px',fontFamily:'monospace',color:'#1e293b',outline:'none'}}/>
            </div>
          </div>

          {/* ── Background Overlay ── */}
          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>Background Overlay</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Opacity</label>
              <input type="range" min={0} max={100} step={5} value={selectedField.overlayOpacity||0}
                onChange={e=>updateField(selectedField.id,{overlayOpacity:Number(e.target.value)})}
                style={{flex:1,accentColor:'#b45309'}}/>
              <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'32px',textAlign:'right'}}>{selectedField.overlayOpacity||0}%</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <label style={{fontSize:'11px',color:'#475569',minWidth:'56px'}}>Color</label>
              <input type="color" value={selectedField.overlayBg||'#000000'} onChange={e=>updateField(selectedField.id,{overlayBg:e.target.value})}
                style={{width:'36px',height:'28px',border:'1.5px solid #e2e8f0',borderRadius:'5px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
              <input type="text" value={selectedField.overlayBg||'#000000'} onChange={e=>updateField(selectedField.id,{overlayBg:e.target.value})}
                style={{flex:1,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:'5px',padding:'5px 8px',fontSize:'11px',fontFamily:'monospace',color:'#1e293b',outline:'none'}}/>
            </div>
            {(selectedField.overlayOpacity||0)>0 && (
              <div style={{marginTop:'8px',padding:'6px 8px',borderRadius:'5px',background:selectedField.overlayBg||'#000000',opacity:(selectedField.overlayOpacity||0)/100,display:'flex',justifyContent:'center'}}>
                <span style={{fontSize:'10px',color:'#fff',fontWeight:700,mixBlendMode:'difference'}}>Preview</span>
              </div>
            )}
          </div>

          {/* visibility */}
          <label style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:selectedField.visible?'#f0fdf4':'#fef2f2',border:`1px solid ${selectedField.visible?'#86efac':'#fca5a5'}`,borderRadius:'8px',cursor:'pointer'}}>
            <input type="checkbox" checked={selectedField.visible} onChange={e=>updateField(selectedField.id,{visible:e.target.checked})} style={{accentColor:'#15803d',width:'16px',height:'16px'}}/>
            <span style={{fontSize:'12px',fontWeight:600,color:selectedField.visible?'#15803d':'#b91c1c'}}>{selectedField.visible?'Visible on card':'Hidden from card'}</span>
          </label>

        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden',background:'#0f172a'}}>

      {/* ════════════════════════════════════ LEFT PANEL ══ */}
      <div style={{width:'272px',flexShrink:0,background:'#fff',borderRight:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* top bar */}
        <div style={{padding:'0 14px',height:'46px',background:'#1e293b',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:'12px',fontWeight:800,color:'#fff',letterSpacing:'1.5px'}}>ID BUILDER</span>
          <div style={{display:'flex',gap:'4px'}}>
            <button onClick={undo} title="Undo Ctrl+Z" disabled={historyIdx<=0}
              style={{padding:'4px 8px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.15)',background:historyIdx>0?'rgba(255,255,255,0.1)':'transparent',color:historyIdx>0?'#fff':'rgba(255,255,255,0.25)',cursor:historyIdx>0?'pointer':'default',fontSize:'14px'}}>↩</button>
            <button onClick={redo} title="Redo Ctrl+Y" disabled={historyIdx>=history.length-1}
              style={{padding:'4px 8px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.15)',background:historyIdx<history.length-1?'rgba(255,255,255,0.1)':'transparent',color:historyIdx<history.length-1?'#fff':'rgba(255,255,255,0.25)',cursor:historyIdx<history.length-1?'pointer':'default',fontSize:'14px'}}>↪</button>
          </div>
        </div>

        {/* accordion */}
        <div style={{flex:1,overflowY:'auto'}}>

          {/* ── Employee ── */}
          <AccSection id="employee" icon="👤" title="Employee">
            <div style={{position:'relative'}}>
              <input type="text" value={empSearch} placeholder="Search employee name..."
                onChange={e=>{setEmpSearch(e.target.value);setShowEmpDrop(true);}}
                onFocus={()=>setShowEmpDrop(true)} onBlur={()=>setTimeout(()=>setShowEmpDrop(false),200)}
                style={inp}/>
              {showEmpDrop&&(
                <ul style={{position:'absolute',zIndex:999,width:'100%',marginTop:'3px',background:'#fff',border:'1px solid #e2e8f0',borderRadius:'8px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',maxHeight:'160px',overflowY:'auto',padding:0,listStyle:'none'}}>
                  {records.filter(r=>r.name.toLowerCase().includes(empSearch.toLowerCase())).map(r=>(
                    <li key={r.id} onMouseDown={()=>autoFill(r)}
                      style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #f1f5f9'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#eff6ff'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#fff'}>
                      <div style={{fontWeight:600,color:'#1e293b',fontSize:'12px'}}>{r.name}</div>
                      <div style={{color:'#94a3b8',fontSize:'10px',display:'flex',alignItems:'center',gap:'5px'}}>
                        <span>{r.position}</span>
                        {r.empCode && <span style={{background:'#eff6ff',color:'#1e40af',borderRadius:'3px',padding:'1px 5px',fontFamily:'monospace',fontWeight:700,fontSize:'10px'}}>{r.empCode}</span>}
                        {!r.empCode && <span style={{color:'#fca5a5',fontSize:'9px'}}>⚠ no ID code</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedEmployee&&(
              <div style={{marginTop:'8px',padding:'8px 10px',background:'#eff6ff',borderRadius:'7px',border:'1px solid #bfdbfe',display:'flex',alignItems:'center',gap:'8px'}}>
                {employeePhoto&&<img src={employeePhoto} style={{width:'30px',height:'30px',borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>}
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#1e40af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedEmployee.name}</div>
                  <div style={{fontSize:'10px',color:'#3b82f6'}}>{selectedEmployee.position}</div>
                  {selectedEmployee.empCode && <div style={{fontSize:'10px',fontFamily:'monospace',fontWeight:700,color:'#1e40af',background:'#dbeafe',borderRadius:'3px',padding:'1px 5px',marginTop:'2px',display:'inline-block'}}>{selectedEmployee.empCode}</div>}
                </div>
              </div>
            )}
          </AccSection>

          {/* ── Background ── */}
          <AccSection id="background" icon="🖼" title={`Background — ${activeSide}`}>
            <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
              {(['front','back'] as const).map(s=>(
                <button key={s} onClick={()=>{setActiveSide(s);setSelectedFieldId(null);}}
                  style={{flex:1,padding:'7px',borderRadius:'6px',border:activeSide===s?'2px solid #1e40af':'1.5px solid #e2e8f0',background:activeSide===s?'#eff6ff':'#fff',color:activeSide===s?'#1e40af':'#64748b',fontWeight:700,fontSize:'11px',cursor:'pointer',textTransform:'uppercase'}}>
                  {s==='front'?'▣ Front':'▢ Back'}
                </button>
              ))}
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'8px',border:'1.5px dashed #cbd5e1',borderRadius:'7px',padding:'10px',cursor:'pointer',background:'#fff',transition:'border-color 0.15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#1e40af'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#cbd5e1'}>
              <Upload size={14} color="#94a3b8"/>
              <span style={{fontSize:'11px',color:'#64748b'}}>Upload {activeSide} background</span>
              <input type="file" accept="image/*" onChange={handleBgUpload} style={{display:'none'}}/>
            </label>
            {side.background&&(
              <div style={{marginTop:'8px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <img src={side.background} style={{height:'28px',borderRadius:'3px',border:'1px solid #e2e8f0'}}/>
                  <span style={{fontSize:'11px',color:'#15803d',fontWeight:600}}>✓ Image loaded</span>
                </div>
                <button onClick={()=>updateSideProps({background:null})} style={{fontSize:'10px',color:'#b91c1c',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'4px',padding:'2px 7px',cursor:'pointer'}}>Remove</button>
              </div>
            )}
          </AccSection>

          {/* ── Fields ── */}
          <AccSection id="fields" icon="✏" title={`Text Fields — ${activeSide}`}>
            <div style={{marginBottom:'8px',display:'flex',gap:'6px'}}>
              {(['front','back'] as const).map(s=>(
                <button key={s} onClick={()=>{setActiveSide(s);setSelectedFieldId(null);}}
                  style={{flex:1,padding:'6px',borderRadius:'6px',border:activeSide===s?'2px solid #1e40af':'1.5px solid #e2e8f0',background:activeSide===s?'#eff6ff':'#fff',color:activeSide===s?'#1e40af':'#64748b',fontWeight:700,fontSize:'11px',cursor:'pointer',textTransform:'uppercase'}}>
                  {s==='front'?'▣ Front':'▢ Back'}
                </button>
              ))}
            </div>
            <p style={{margin:'0 0 8px',fontSize:'10px',color:'#94a3b8'}}>Click a field below or directly on the card to edit it. The editor panel opens on the right.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              {side.fields.map(field=>(
                <button key={field.id}
                  onClick={()=>setSelectedFieldId(selectedFieldId===field.id?null:field.id)}
                  style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',border:selectedFieldId===field.id?'2px solid #3b82f6':'1.5px solid #e2e8f0',background:selectedFieldId===field.id?'#eff6ff':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.1s'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:field.color,border:'1px solid #e2e8f0',flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:selectedFieldId===field.id?'#1e40af':'#1e293b'}}>{field.label}</div>
                    <div style={{fontSize:'10px',color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{field.value}</div>
                  </div>
                  <span style={{fontSize:'10px',color:selectedFieldId===field.id?'#3b82f6':'#cbd5e1',flexShrink:0}}>{selectedFieldId===field.id?'●':'○'}</span>
                </button>
              ))}
            </div>
          </AccSection>

          {/* ── Photo & Sig ── */}
          <AccSection id="photosig" icon="📷" title={activeSide==='front'?'Photo & Signature — Front':'Photo & Signature — Back'}>
            {/* side toggle */}
            <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
              {(['front','back'] as const).map(s=>(
                <button key={s} onClick={()=>{setActiveSide(s);setSelectedFieldId(null);}}
                  style={{flex:1,padding:'6px',borderRadius:'6px',border:activeSide===s?'2px solid #1e40af':'1.5px solid #e2e8f0',background:activeSide===s?'#eff6ff':'#fff',color:activeSide===s?'#1e40af':'#64748b',fontWeight:700,fontSize:'11px',cursor:'pointer',textTransform:'uppercase'}}>
                  {s==='front'?'▣ Front':'▢ Back'}
                </button>
              ))}
            </div>

            {/* ── PHOTO (front only) ── */}
            {activeSide==='front'&&<>
              <div style={{fontSize:'10px',fontWeight:800,color:'#1e293b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
                <span>📷 Photo</span>
                <label style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'auto',cursor:'pointer',fontSize:'10px',color:'#64748b'}}>
                  <input type="checkbox" checked={side.showPhoto} onChange={e=>updateSideProps({showPhoto:e.target.checked})} style={{accentColor:'#1e40af'}}/> Show
                </label>
              </div>
              {/* position/size */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'10px'}}>
                {[{l:'X %',k:'photoX',v:side.photoX},{l:'Y %',k:'photoY',v:side.photoY},{l:'Width %',k:'photoW',v:side.photoW},{l:'Height %',k:'photoH',v:side.photoH}].map(({l,k,v})=>(
                  <div key={k}>
                    <label style={{fontSize:'9px',color:'#64748b',display:'block',marginBottom:'2px',fontWeight:600}}>{l}</label>
                    <input type="number" value={v} min={0} max={100} onChange={e=>updateSideProps({[k]:Number(e.target.value)})} style={{...inp,padding:'5px 8px',fontSize:'12px'}}/>
                  </div>
                ))}
              </div>
              {/* stroke */}
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'10px',marginBottom:'8px'}}>
                <div style={{fontSize:'9px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Photo Stroke</div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Width</label>
                  <input type="range" min={0} max={16} step={1} value={side.photoStrokeWidth||0} onChange={e=>updateSideProps({photoStrokeWidth:Number(e.target.value)})} style={{flex:1,accentColor:'#1e40af'}}/>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'24px',textAlign:'right'}}>{side.photoStrokeWidth||0}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Color</label>
                  <input type="color" value={side.photoStrokeColor||'#ffffff'} onChange={e=>updateSideProps({photoStrokeColor:e.target.value})} style={{width:'32px',height:'24px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
                  <input type="text" value={side.photoStrokeColor||'#ffffff'} onChange={e=>updateSideProps({photoStrokeColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 6px',fontSize:'11px',fontFamily:'monospace',outline:'none'}}/>
                </div>
              </div>
              {/* shadow */}
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'10px',marginBottom:'8px'}}>
                <div style={{fontSize:'9px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Photo Shadow</div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Blur</label>
                  <input type="range" min={0} max={30} step={1} value={side.photoShadowBlur||0} onChange={e=>updateSideProps({photoShadowBlur:Number(e.target.value)})} style={{flex:1,accentColor:'#7c3aed'}}/>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'24px',textAlign:'right'}}>{side.photoShadowBlur||0}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Color</label>
                  <input type="color" value={side.photoShadowColor||'#000000'} onChange={e=>updateSideProps({photoShadowColor:e.target.value})} style={{width:'32px',height:'24px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
                  <input type="text" value={side.photoShadowColor||'#000000'} onChange={e=>updateSideProps({photoShadowColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 6px',fontSize:'11px',fontFamily:'monospace',outline:'none'}}/>
                </div>
              </div>
              {/* color overlay */}
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'10px',marginBottom:'14px'}}>
                <div style={{fontSize:'9px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Photo Color Overlay</div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Opacity</label>
                  <input type="range" min={0} max={100} step={5} value={side.photoOverlayOpacity||0} onChange={e=>updateSideProps({photoOverlayOpacity:Number(e.target.value)})} style={{flex:1,accentColor:'#b45309'}}/>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'28px',textAlign:'right'}}>{side.photoOverlayOpacity||0}%</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Color</label>
                  <input type="color" value={side.photoOverlayColor||'#000000'} onChange={e=>updateSideProps({photoOverlayColor:e.target.value})} style={{width:'32px',height:'24px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
                  <input type="text" value={side.photoOverlayColor||'#000000'} onChange={e=>updateSideProps({photoOverlayColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 6px',fontSize:'11px',fontFamily:'monospace',outline:'none'}}/>
                </div>
              </div>
            </>}

            {/* ── SIGNATURE ── */}
            <div style={{fontSize:'10px',fontWeight:800,color:'#1e293b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
              <span>✍ Signature</span>
              <label style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'auto',cursor:'pointer',fontSize:'10px',color:'#64748b'}}>
                <input type="checkbox" checked={side.showSig} onChange={e=>updateSideProps({showSig:e.target.checked})} style={{accentColor:'#1e40af'}}/> Show
              </label>
            </div>
            {/* sig position/size */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'10px'}}>
              {[{l:'X %',k:'sigX',v:side.sigX},{l:'Y %',k:'sigY',v:side.sigY},{l:'Width %',k:'sigW',v:side.sigW},{l:'Height %',k:'sigH',v:side.sigH}].map(({l,k,v})=>(
                <div key={k}>
                  <label style={{fontSize:'9px',color:'#64748b',display:'block',marginBottom:'2px',fontWeight:600}}>{l}</label>
                  <input type="number" value={v} min={0} max={100} onChange={e=>updateSideProps({[k]:Number(e.target.value)})} style={{...inp,padding:'5px 8px',fontSize:'12px'}}/>
                </div>
              ))}
            </div>
            {/* sig stroke */}
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'10px',marginBottom:'8px'}}>
              <div style={{fontSize:'9px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Signature Stroke</div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Width</label>
                <input type="range" min={0} max={16} step={1} value={side.sigStrokeWidth||0} onChange={e=>updateSideProps({sigStrokeWidth:Number(e.target.value)})} style={{flex:1,accentColor:'#1e40af'}}/>
                <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'24px',textAlign:'right'}}>{side.sigStrokeWidth||0}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Color</label>
                <input type="color" value={side.sigStrokeColor||'#ffffff'} onChange={e=>updateSideProps({sigStrokeColor:e.target.value})} style={{width:'32px',height:'24px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
                <input type="text" value={side.sigStrokeColor||'#ffffff'} onChange={e=>updateSideProps({sigStrokeColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 6px',fontSize:'11px',fontFamily:'monospace',outline:'none'}}/>
              </div>
            </div>
            {/* sig shadow */}
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'10px'}}>
              <div style={{fontSize:'9px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Signature Shadow</div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Blur</label>
                <input type="range" min={0} max={30} step={1} value={side.sigShadowBlur||0} onChange={e=>updateSideProps({sigShadowBlur:Number(e.target.value)})} style={{flex:1,accentColor:'#7c3aed'}}/>
                <span style={{fontSize:'11px',fontWeight:700,color:'#1e293b',minWidth:'24px',textAlign:'right'}}>{side.sigShadowBlur||0}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <label style={{fontSize:'10px',color:'#475569',minWidth:'40px'}}>Color</label>
                <input type="color" value={side.sigShadowColor||'#000000'} onChange={e=>updateSideProps({sigShadowColor:e.target.value})} style={{width:'32px',height:'24px',border:'1px solid #e2e8f0',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
                <input type="text" value={side.sigShadowColor||'#000000'} onChange={e=>updateSideProps({sigShadowColor:e.target.value})} style={{flex:1,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'4px',padding:'4px 6px',fontSize:'11px',fontFamily:'monospace',outline:'none'}}/>
              </div>
            </div>
          </AccSection>

          {/* ── Templates ── */}
          <AccSection id="templates" icon="📋" title={`Templates (${templates.length})`}>
            <p style={{margin:'0 0 8px',fontSize:'10px',color:'#94a3b8'}}>Save your current design as a reusable template for different companies.</p>
            <input type="text" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Template name (e.g. ABC Corp)"
              style={{...inp,marginBottom:'6px'}}/>
            <input type="text" value={templateCompany} onChange={e=>setTemplateCompany(e.target.value)} placeholder="Company name (optional)"
              style={{...inp,marginBottom:'8px'}}/>
            <button onClick={saveTemplate} disabled={templateSaving||!templateName.trim()}
              style={{width:'100%',background:templateName.trim()?'#7c3aed':'#f1f5f9',color:templateName.trim()?'#fff':'#94a3b8',border:'none',borderRadius:'6px',padding:'9px',cursor:templateName.trim()?'pointer':'not-allowed',fontSize:'12px',fontWeight:700,marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
              {templateSaving?<Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/>:'💾'} Save Template
            </button>
            {templates.length>0&&<>
              <div style={{height:'1px',background:'#f1f5f9',marginBottom:'10px'}}></div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'220px',overflowY:'auto'}}>
                {templates.map(t=>(
                  <div key={t.id} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'7px',padding:'9px 11px'}}>
                    <div style={{fontWeight:700,fontSize:'12px',color:'#1e293b'}}>{t.name}</div>
                    {t.company&&<div style={{fontSize:'11px',color:'#64748b',marginTop:'1px'}}>{t.company}</div>}
                    <div style={{fontSize:'10px',color:'#94a3b8',marginBottom:'7px'}}>{t.createdAt}</div>
                    <div style={{display:'flex',gap:'5px'}}>
                      <button onClick={()=>loadTemplate(t)} style={{flex:1,background:'#eff6ff',color:'#1e40af',border:'1px solid #bfdbfe',borderRadius:'5px',padding:'5px',cursor:'pointer',fontSize:'11px',fontWeight:700}}>Load</button>
                      <button onClick={()=>deleteTemplate(t.id)} style={{background:'#fef2f2',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:'5px',padding:'5px 9px',cursor:'pointer',fontSize:'11px'}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </AccSection>

        </div>

        {/* ── export bar ── */}
        <div style={{padding:'12px',borderTop:'1px solid #e2e8f0',background:'#f8fafc',display:'flex',flexDirection:'column',gap:'7px',flexShrink:0}}>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={()=>downloadSide('front')} style={{flex:1,background:'#1e40af',color:'#fff',border:'none',borderRadius:'6px',padding:'9px 4px',cursor:'pointer',fontSize:'11px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
              <Download size={11}/> Front
            </button>
            <button onClick={()=>downloadSide('back')} style={{flex:1,background:'#334155',color:'#fff',border:'none',borderRadius:'6px',padding:'9px 4px',cursor:'pointer',fontSize:'11px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
              <Download size={11}/> Back
            </button>
          </div>
          <button onClick={saveIDToServer} disabled={savingID||!selectedEmployee}
            style={{width:'100%',background:selectedEmployee?'#15803d':'#e2e8f0',color:selectedEmployee?'#fff':'#94a3b8',border:'none',borderRadius:'6px',padding:'9px',cursor:selectedEmployee?'pointer':'not-allowed',fontSize:'12px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
            {savingID?<Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/>:'💾'} Save ID to Server
          </button>
          {msg&&<div style={{padding:'7px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,background:msg.type==='success'?'#f0fdf4':'#fef2f2',color:msg.type==='success'?'#15803d':'#b91c1c',border:`1px solid ${msg.type==='success'?'#86efac':'#fecaca'}`}}>
            {msg.type==='success'?'✓':'✕'} {msg.text}
          </div>}
        </div>
      </div>

      {/* ════════════════════════════════════ CANVAS ══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

        {/* canvas toolbar */}
        <div style={{height:'44px',background:'#1e293b',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:'8px',padding:'0 16px',flexShrink:0}}>
          <span style={{fontSize:'10px',color:'#64748b',fontWeight:600,letterSpacing:'0.5px'}}>ZOOM</span>
          <button onClick={()=>setZoom(z=>Math.max(0.5,+(z-0.1).toFixed(1)))} style={{background:'rgba(255,255,255,0.07)',border:'none',color:'#94a3b8',borderRadius:'4px',width:'24px',height:'24px',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
          <span style={{fontSize:'12px',color:'#fff',fontWeight:700,minWidth:'40px',textAlign:'center'}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(2.5,+(z+0.1).toFixed(1)))} style={{background:'rgba(255,255,255,0.07)',border:'none',color:'#94a3b8',borderRadius:'4px',width:'24px',height:'24px',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          <button onClick={()=>setZoom(1.3)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',borderRadius:'4px',padding:'3px 9px',cursor:'pointer',fontSize:'10px',marginLeft:'2px'}}>Reset</button>
          <div style={{width:'1px',height:'20px',background:'rgba(255,255,255,0.08)',margin:'0 4px'}}></div>
          <button onClick={()=>setShowGrid(g=>!g)}
            style={{padding:'4px 10px',borderRadius:'5px',border:showGrid?'1px solid #3b82f6':'1px solid rgba(255,255,255,0.1)',background:showGrid?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.05)',color:showGrid?'#60a5fa':'#64748b',cursor:'pointer',fontSize:'10px',fontWeight:600}}>
            ⊞ Grid
          </button>
          <button onClick={()=>setSnap(s=>!s)}
            style={{padding:'4px 10px',borderRadius:'5px',border:snap?'1px solid #a78bfa':'1px solid rgba(255,255,255,0.1)',background:snap?'rgba(167,139,250,0.2)':'rgba(255,255,255,0.05)',color:snap?'#c4b5fd':'#64748b',cursor:'pointer',fontSize:'10px',fontWeight:600}}>
            🧲 Snap {snap?'ON':'OFF'}
          </button>
          <div style={{flex:1}}/>
          <span style={{fontSize:'10px',color:'#475569',fontStyle:'italic'}}>
            {selectedLayer ? `🎨 Editing layer: ${selectedLayer} — layer styles on right` : selectedField?`✏ Editing: ${selectedField.label} — editor panel on right`:'Click any text or image on the card to edit it'}
          </span>
        </div>

        {/* card workspace */}
        <div style={{flex:1,overflow:'auto',display:'flex',gap:'48px',alignItems:'flex-start',justifyContent:'center',padding:'40px 32px',background:'#0f172a'}}
          onClick={()=>{setSelectedFieldId(null);setSelectedLayer(null);}}>
          {renderCard('front')}
          {renderCard('back')}
        </div>
      </div>

      {/* ════════════════════════════════════ RIGHT PANEL ══ */}
      {selectedLayer ? <LayerEditor/> : selectedField ? <FieldEditor/> : null}

    </div>
  );
}


export default function App() {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [employeeDatabase, setEmployeeDatabase] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'add' | 'database' | 'idbuilder' | 'idrecords'>('dashboard');
  const [savedIDs, setSavedIDs] = useState<any[]>([]);
  const [viewingID, setViewingID] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/saved-ids`).then(r => r.ok ? r.json() : []).then(setSavedIDs).catch(() => {});
  }, [activeSection]);

  const [selectedName, setSelectedName] = useState('');
  const [position, setPosition] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [indication, setIndication] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeRecord>>({});
  const [editSignatureFile, setEditSignatureFile] = useState<File | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editShowDropdown, setEditShowDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbRes, recRes] = await Promise.all([fetch(`${API_URL}/database`), fetch(`${API_URL}/records`)]);
        if (dbRes.ok) setEmployeeDatabase(await dbRes.json());
        if (recRes.ok) setRecords(await recRes.json());
      } catch { console.error("Connection failed."); }
      finally { setIsLoading(false); }
    };
    if (!(window as any).XLSX) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.async = true; document.body.appendChild(s);
    }
    loadData();
  }, []);

  const saveDatabase = async (data: Employee[]) => {
    try { await fetch(`${API_URL}/database`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch { }
  };
  const saveRecords = async (data: EmployeeRecord[]) => {
    try { await fetch(`${API_URL}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch { }
  };

  const handleDatabaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const XLSX = (window as any).XLSX;
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
        const formatted = jsonData.map((row: any) => {
          const ck = Object.keys(row).reduce((acc: any, k: string) => { acc[k.toLowerCase().replace(/\s+/g, '')] = row[k]; return acc; }, {});
          return {
            fullname:  String(ck["fullname"]   || "").trim(),
            position:  String(ck["position"]   || "").trim(),
            empCode:   String(ck["employeeid"] || ck["employee_id"] || ck["empcode"] || ck["id_code"] || "").trim(),
            company:   String(ck["company"]    || "").trim(),
            department:String(ck["department"] || "").trim(),
          };
        }).filter(e => e.fullname);
        setEmployeeDatabase(formatted); saveDatabase(formatted); e.target.value = '';
      } catch { alert("Error reading Excel"); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImagePick = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file); const r = new FileReader(); r.onload = () => setPreview(r.result as string); r.readAsDataURL(file);
  };

  const handleAddRecord = async () => {
    if (!selectedName || !indication) return;
    setIsSaving(true);
    const [sigUrl, photoUrl] = await Promise.all([
      signatureFile ? uploadImage(signatureFile, selectedName, 'signature') : Promise.resolve(null),
      photoFile ? uploadImage(photoFile, selectedName, 'photo') : Promise.resolve(null),
    ]);
    const updated = [...records, { id: Date.now(), name: selectedName, position, empCode, indication, signature: sigUrl, photo: photoUrl }];
    setRecords(updated); await saveRecords(updated);
    setSelectedName(''); setPosition(''); setEmpCode(''); setIndication('');
    setSignatureFile(null); setSignaturePreview(null); setPhotoFile(null); setPhotoPreview(null);
    setIsSaving(false); setActiveSection('dashboard');
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/records/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (record: EmployeeRecord) => { setEditingId(record.id); setEditData({ ...record }); setEditSignatureFile(null); setEditPhotoFile(null); };
  const handleCancelEdit = () => { setEditingId(null); setEditData({}); setEditSignatureFile(null); setEditPhotoFile(null); };
  const handleSaveEdit = async () => {
    setIsSaving(true);
    const [sigUrl, photoUrl] = await Promise.all([
      editSignatureFile ? uploadImage(editSignatureFile, editData.name || '', 'signature') : Promise.resolve(editData.signature ?? null),
      editPhotoFile ? uploadImage(editPhotoFile, editData.name || '', 'photo') : Promise.resolve(editData.photo ?? null),
    ]);
    const updated = records.map(r => r.id === editingId ? { ...r, ...editData, signature: sigUrl, photo: photoUrl } as EmployeeRecord : r);
    setRecords(updated); await saveRecords(updated);
    setEditingId(null); setEditData({}); setEditSignatureFile(null); setEditPhotoFile(null); setIsSaving(false);
  };

  const stayIn = records.filter(r => r.indication === 'Stay-In').length;
  const stayOut = records.filter(r => r.indication === 'Stay-Out').length;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <div style={{ background: '#1e40af', borderRadius: '8px', padding: '8px', display: 'flex' }}>
          <Shield size={22} color="white" />
        </div>
        <span style={{ color: '#1e293b', fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>PORTER ACCESS</span>
      </div>
      <div style={{ width: '200px', height: '3px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #1e40af, #3b82f6)', animation: 'loading 1.5s ease-in-out infinite', borderRadius: '2px' }}></div>
      </div>
      <p style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '2px', margin: 0 }}>CONNECTING TO SERVER...</p>
      <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', height: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1e293b', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? '240px' : '60px', background: '#1e293b', transition: 'width 0.2s ease', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', boxShadow: '4px 0 12px rgba(0,0,0,0.08)' }} className="print:hidden">
        <div style={{ borderBottom: '1px solid #334155' }}>
          <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1e40af', borderRadius: '8px', padding: '8px', display: 'flex', flexShrink: 0 }}>
              <Shield size={16} color="white" />
            </div>
            {sidebarOpen && (
              <div>
                <p style={{ margin: 0, color: '#f8fafc', fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'Georgia, serif' }}>PORTER ACCESS</p>
                <p style={{ margin: '2px 0 0', color: '#3b82f6', fontSize: '9px', letterSpacing: '2px' }}>CONTROL SYSTEM</p>
              </div>
            )}
          </div>
        </div>
        {sidebarOpen && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #334155', background: '#162032' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '10px' }}>{dateStr}</p>
          </div>
        )}
        <nav style={{ padding: '16px 8px', flex: 1 }}>
          {sidebarOpen && <p style={{ color: '#475569', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '0 8px', margin: '0 0 10px' }}>NAVIGATION</p>}
          {[
            { id: 'dashboard', label: 'Personnel Records', icon: <Users size={15} />, badge: records.length },
            { id: 'add', label: 'Add Personnel', icon: <Plus size={15} />, badge: null },
            { id: 'database', label: 'Load Database', icon: <FileSpreadsheet size={15} />, badge: employeeDatabase.length || null },
            { id: 'idbuilder', label: 'ID Builder', icon: <CreditCard size={15} />, badge: null },
            { id: 'idrecords', label: 'Saved IDs', icon: <Download size={15} />, badge: savedIDs.length || null },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id as any)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeSection === item.id ? '#1e40af' : 'transparent', color: activeSection === item.id ? '#fff' : '#94a3b8', marginBottom: '2px', transition: 'all 0.15s', textAlign: 'left' }}
              onMouseEnter={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = '#334155'; }}
              onMouseLeave={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: '12px', fontWeight: 500, flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                    <span style={{ background: activeSection === item.id ? 'rgba(255,255,255,0.2)' : '#334155', color: activeSection === item.id ? '#fff' : '#94a3b8', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px' }}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: '12px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase' }}>QUICK STATS</p>
            {[{ label: 'Stay-In', value: stayIn, color: '#22c55e' }, { label: 'Stay-Out', value: stayOut, color: '#ef4444' }].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#162032', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{s.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ margin: '8px', padding: '8px', background: '#162032', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={14} />
        </button>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }} className="print:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Porter Access</span>
            <ChevronRight size={14} color="#cbd5e1" />
            <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>
              {activeSection === 'dashboard' ? 'Personnel Records' : activeSection === 'add' ? 'Add Personnel' : activeSection === 'database' ? 'Load Database' : activeSection === 'idbuilder' ? 'ID Builder' : 'Saved IDs'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }}></div>
              <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>Server Online</span>
            </div>
            {activeSection === 'dashboard' && records.length > 0 && (
              <button onClick={() => window.print()} style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(30,64,175,0.3)' }}>
                <Printer size={13} /> Print Records
              </button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: activeSection === 'idbuilder' ? '0' : '28px', overflowY: activeSection === 'idbuilder' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }} className="print:hidden">
                {[
                  { label: 'Total Personnel', value: records.length, icon: <Users size={20} />, color: '#1e40af', light: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Stay-In', value: stayIn, icon: <UserCheck size={20} />, color: '#15803d', light: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Stay-Out', value: stayOut, icon: <UserX size={20} />, color: '#b91c1c', light: '#fef2f2', border: '#fecaca' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#ffffff', border: `1px solid ${s.border}`, borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', borderTop: `3px solid ${s.color}` }}>
                    <div>
                      <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</p>
                      <p style={{ margin: 0, color: s.color, fontSize: '36px', fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{s.value}</p>
                    </div>
                    <div style={{ background: s.light, color: s.color, borderRadius: '10px', padding: '12px', display: 'flex' }}>{s.icon}</div>
                  </div>
                ))}
              </div>

              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <Building2 size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>No personnel records</p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Navigate to Add Personnel to begin</p>
                </div>
              ) : (
                <div id="print-area" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }} className="print:hidden">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '3px', height: '18px', background: '#1e40af', borderRadius: '2px' }}></div>
                      <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>Personnel Access Log</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{records.length} RECORDS</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {[{ label: 'NO.', w: '55px', center: true }, { label: 'NAME', w: 'auto', center: false }, { label: 'DESIGNATION', w: 'auto', center: false }, { label: 'ID CODE', w: '120px', center: false }, { label: 'SIGNATURE', w: '140px', center: true }, { label: 'INDICATION', w: '130px', center: true }, { label: 'PHOTO', w: '130px', center: true }, { label: '', w: '120px', center: true }].map((h, i) => (
                            <th key={i} className={h.label === '' ? 'print:hidden' : ''} style={{ padding: '11px 16px', color: '#64748b', fontWeight: 600, fontSize: '10px', letterSpacing: '1px', textAlign: h.center ? 'center' : 'left', borderBottom: '2px solid #e2e8f0', width: h.w, whiteSpace: 'nowrap' }}>{h.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, index) => {
                          const isEditing = editingId === record.id;
                          return (
                            <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9', background: isEditing ? '#eff6ff' : index % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.1s' }}
                              onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#f0f7ff'; }}
                              onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</td>
                              <td style={{ padding: '12px 16px' }}>
                                {isEditing ? (
                                  <div style={{ position: 'relative' }}>
                                    <input type="text" value={editData.name || ''}
                                      onChange={(e) => { setEditData(p => ({ ...p, name: e.target.value })); setEditShowDropdown(true); }}
                                      onFocus={() => setEditShowDropdown(true)} onBlur={() => setTimeout(() => setEditShowDropdown(false), 200)}
                                      style={{ width: '100%', background: '#fff', border: '1.5px solid #3b82f6', borderRadius: '6px', padding: '7px 10px', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' }} />
                                    {editShowDropdown && (
                                      <ul style={{ position: 'absolute', zIndex: 50, width: '260px', marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '180px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                                        {employeeDatabase.filter(e => e.fullname.toLowerCase().includes((editData.name || '').toLowerCase())).map((emp, i) => (
                                          <li key={i} onMouseDown={() => { setEditData(p => ({ ...p, name: emp.fullname, position: emp.position, empCode: emp.empCode || p.empCode })); setEditShowDropdown(false); }}
                                            style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                                            <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>{emp.fullname}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '11px' }}>{emp.position}</div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ) : <span style={{ color: '#1e293b', fontWeight: 600 }}>{record.name}</span>}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {isEditing
                                  ? <input type="text" value={editData.position || ''} onChange={(e) => setEditData(p => ({ ...p, position: e.target.value }))} style={{ width: '100%', background: '#fff', border: '1.5px solid #3b82f6', borderRadius: '6px', padding: '7px 10px', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' }} />
                                  : <span style={{ color: '#475569' }}>{record.position}</span>}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {isEditing
                                  ? <input type="text" value={(editData as EmployeeRecord).empCode || ''} onChange={(e) => setEditData(p => ({ ...p, empCode: e.target.value }))} placeholder="ID Code" style={{ width: '100%', background: '#fff', border: '1.5px solid #3b82f6', borderRadius: '6px', padding: '7px 10px', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' }} />
                                  : <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '5px', background: record.empCode ? '#eff6ff' : '#f8fafc', color: record.empCode ? '#1e40af' : '#cbd5e1', fontFamily: 'monospace', fontSize: '11px', fontWeight: record.empCode ? 700 : 400, border: `1px solid ${record.empCode ? '#bfdbfe' : '#e2e8f0'}` }}>{record.empCode || '—'}</span>}
                              </td>
                              <td style={{ padding: '6px 10px', width: '140px' }}>
                                {isEditing ? <EditImgCell file={editSignatureFile} existingSrc={resolveImg(editData.signature)} onFile={setEditSignatureFile} fit="contain" /> : <ImgCell src={resolveImg(record.signature)} height={76} fit="contain" />}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                {isEditing
                                  ? <select value={editData.indication || ''} onChange={(e) => setEditData(p => ({ ...p, indication: e.target.value }))} style={{ background: '#fff', border: '1.5px solid #3b82f6', borderRadius: '6px', padding: '7px 10px', color: '#1e293b', fontSize: '13px', outline: 'none', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' }}>
                                      <option value="Stay-In">Stay-In</option><option value="Stay-Out">Stay-Out</option>
                                    </select>
                                  : <span style={{ display: 'inline-block', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '20px', background: record.indication === 'Stay-In' ? '#dcfce7' : '#fee2e2', color: record.indication === 'Stay-In' ? '#15803d' : '#b91c1c', border: `1px solid ${record.indication === 'Stay-In' ? '#86efac' : '#fca5a5'}` }}>{record.indication}</span>}
                              </td>
                              <td style={{ padding: '6px 8px', width: '130px' }}>
                                {isEditing ? <EditImgCell file={editPhotoFile} existingSrc={resolveImg(editData.photo)} onFile={setEditPhotoFile} fit="cover" /> : <ImgCell src={resolveImg(record.photo)} height={118} fit="cover" />}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }} className="print:hidden">
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button onClick={handleSaveEdit} disabled={isSaving} style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {isSaving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={11} />} Save
                                    </button>
                                    <button onClick={handleCancelEdit} style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <X size={11} /> Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="row-actions" style={{ display: 'flex', gap: '6px', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                                    <button onClick={() => handleEdit(record)} style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Pencil size={11} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(record.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD PERSONNEL */}
          {activeSection === 'add' && (
            <div style={{ maxWidth: '640px' }}>
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '3px', height: '18px', background: '#1e40af', borderRadius: '2px' }}></div>
                  <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>New Personnel Entry</span>
                </div>
                <div style={{ padding: '28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                      <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Employee Name</label>
                      <input type="text" value={selectedName}
                        onChange={(e) => { setSelectedName(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        placeholder="Search name..."
                        style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '7px', padding: '10px 14px', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                      {showDropdown && selectedName && (
                        <ul style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                          {employeeDatabase.filter(e => e.fullname.toLowerCase().includes(selectedName.toLowerCase())).map((emp, i) => (
                            <li key={i} onMouseDown={() => { setSelectedName(emp.fullname); setPosition(emp.position); if(emp.empCode) setEmpCode(emp.empCode); setShowDropdown(false); }}
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                              <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>{emp.fullname}</div>
                              <div style={{ color: '#94a3b8', fontSize: '11px' }}>{emp.position}{emp.empCode ? <span style={{ marginLeft: '8px', background: '#eff6ff', color: '#1e40af', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{emp.empCode}</span> : null}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Designation</label>
                      <input type="text" value={position} readOnly style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '7px', padding: '10px 14px', color: '#94a3b8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                        Employee ID / Code <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>— auto-fills from database, editable</span>
                      </label>
                      <input type="text" value={empCode} onChange={e => setEmpCode(e.target.value)} placeholder="e.g. ABISC-231003 (auto-fills from database)" style={{ width: '100%', background: empCode ? '#eff6ff' : '#fff', border: empCode ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', borderRadius: '7px', padding: '10px 14px', color: '#1e40af', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Indication</label>
                      <select value={indication} onChange={(e) => setIndication(e.target.value)} style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '7px', padding: '10px 14px', color: indication ? '#1e293b' : '#94a3b8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                        <option value="">— Select —</option>
                        <option value="Stay-In">Stay-In</option>
                        <option value="Stay-Out">Stay-Out</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {[
                      { label: 'Signature', preview: signaturePreview, setFile: setSignatureFile, setPreview: setSignaturePreview, fit: 'contain' as const },
                      { label: 'Photo', preview: photoPreview, setFile: setPhotoFile, setPreview: setPhotoPreview, fit: 'cover' as const },
                    ].map(({ label, preview, setFile, setPreview, fit }) => (
                      <div key={label}>
                        <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</label>
                        <div style={{ position: 'relative', height: '120px', border: '1.5px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden' }}>
                          {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: fit }} /> : <><Upload size={20} color="#cbd5e1" /><span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px' }}>Click to upload {label}</span></>}
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagePick(f, setFile, setPreview); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAddRecord} disabled={isSaving || !selectedName || !indication}
                    style={{ width: '100%', padding: '12px', background: selectedName && indication ? '#1e40af' : '#f1f5f9', color: selectedName && indication ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: selectedName && indication ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: selectedName && indication ? '0 2px 8px rgba(30,64,175,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {isSaving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Plus size={15} /> Submit Record</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATABASE */}
          {activeSection === 'database' && (
            <div style={{ maxWidth: '520px' }}>
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '3px', height: '18px', background: '#15803d', borderRadius: '2px' }}></div>
                  <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>Load Personnel Database</span>
                </div>
                <div style={{ padding: '28px' }}>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Upload an Excel file with columns:
                    <code style={{ color: '#1e40af', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', margin: '0 3px', fontSize: '12px' }}>fullname</code> and
                    <code style={{ color: '#1e40af', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', margin: '0 3px', fontSize: '12px' }}>position</code>
                  </p>
                  <label style={{ display: 'block', border: '2px dashed #e2e8f0', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                    <FileSpreadsheet size={40} color="#15803d" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                    <p style={{ color: '#1e293b', fontWeight: 600, margin: '0 0 4px', fontSize: '14px' }}>Click to Upload Excel File</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>.xlsx or .xls format supported</p>
                    <input type="file" accept=".xlsx, .xls" onChange={handleDatabaseUpload} style={{ display: 'none' }} />
                  </label>
                  {employeeDatabase.length > 0 && (
                    <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#15803d', borderRadius: '50%', padding: '4px', display: 'flex' }}><Check size={14} color="white" /></div>
                      <div>
                        <p style={{ color: '#15803d', fontWeight: 700, margin: 0, fontSize: '13px' }}>{employeeDatabase.length} employees loaded successfully</p>
                        <p style={{ color: '#16a34a', fontSize: '11px', margin: '2px 0 0' }}>Synced to server storage</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ID BUILDER */}
          {activeSection === 'idbuilder' && <IDBuilder records={records} />}

          {/* SAVED IDs */}
          {activeSection === 'idrecords' && (
            <div>
              {viewingID ? (
                <div>
                  <button onClick={() => setViewingID(null)} style={{ marginBottom: '16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Back to Saved IDs
                  </button>
                  <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{viewingID.employeeName}</h2>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>{viewingID.position}</p>
                    <p style={{ margin: '0 0 16px', fontSize: '11px', color: '#94a3b8' }}>Saved: {viewingID.savedAt}</p>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Front</p><img src={viewingID.frontImg} style={{ width: '216px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} /></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Back</p><img src={viewingID.backImg} style={{ width: '216px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => { const a = document.createElement('a'); a.download = `${viewingID.employeeName}-front.png`; a.href = viewingID.frontImg; a.click(); }} style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={13} /> Download Front</button>
                      <button onClick={() => { const a = document.createElement('a'); a.download = `${viewingID.employeeName}-back.png`; a.href = viewingID.backImg; a.click(); }} style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={13} /> Download Back</button>
                      <button onClick={() => { const w = window.open('', '_blank')!; w.document.write(`<html><body style="margin:0;display:flex;gap:16px;padding:16px;background:#f1f5f9"><img src="${viewingID.frontImg}" style="height:90vh"><img src="${viewingID.backImg}" style="height:90vh"></body></html>`); w.document.close(); setTimeout(() => w.print(), 500); }} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 18px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Printer size={13} /> Print Both</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '3px', height: '18px', background: '#15803d', borderRadius: '2px' }}></div>
                      <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>Saved ID Cards</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{savedIDs.length} IDs</span>
                  </div>
                  {savedIDs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <CreditCard size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 4px' }}>No saved IDs yet</p>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Use the ID Builder to design and save employee IDs</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '20px' }}>
                      {savedIDs.map(entry => (
                        <div key={entry.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fff', cursor: 'pointer' }} onClick={() => setViewingID(entry)}>
                            <img src={entry.frontImg} style={{ width: '70px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', flexShrink: 0 }} />
                            <img src={entry.backImg} style={{ width: '70px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0, paddingLeft: '4px' }}>
                              <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.employeeName}</p>
                              <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.position}</p>
                              {entry.company && <p style={{ margin: '0 0 3px', fontSize: '10px', color: '#94a3b8' }}>{entry.company}</p>}
                              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{entry.savedAt}</p>
                            </div>
                          </div>
                          <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
                            <button onClick={() => setViewingID(entry)} style={{ flex: 1, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '5px', padding: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>View & Print</button>
                            <button onClick={async () => { await fetch(`${API_URL}/saved-ids/${entry.id}`, { method: 'DELETE' }); setSavedIDs(prev => prev.filter(e => e.id !== entry.id)); }} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        tr:hover .row-actions { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          thead { display: table-header-group !important; }
          th, td { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; padding: 8px !important; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          img { display: block !important; max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
          span[style*="border-radius"] { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; padding: 2px 6px !important; }
        }
      `}</style>
    </div>
  );
}