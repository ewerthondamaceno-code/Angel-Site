/* Angel Studio 2 — renderizador compartilhado por site público e prévia. Sem dependências. */
(function(){
'use strict';
const root=document.getElementById('siteRoot');
const editorMode=new URLSearchParams(location.search).get('editor')==='1';
let model=window.ANGEL_SITE, currentId=document.body.dataset.page||'inicio', selected='', dragging='', editorCanvasMode='flow', editorGrid=true;
const allowedStyles=new Set('background backgroundColor color fontSize fontWeight fontFamily lineHeight letterSpacing textAlign textDecoration padding paddingTop paddingRight paddingBottom paddingLeft margin marginTop marginRight marginBottom marginLeft width minWidth minHeight height maxHeight maxWidth border borderRadius borderColor borderWidth borderStyle boxShadow opacity gap justifyContent alignItems alignSelf flexWrap flexDirection flex gridCols objectFit objectPosition backgroundImage backgroundSize backgroundPosition display position top right bottom left zIndex transform overflow'.split(' '));
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function css(v){return String(v??'').replace(/[<>;{}]/g,'');}
function style(st){if(!st)return '';const pairs=Object.entries(st).filter(([k,v])=>allowedStyles.has(k)&&v!==''&&v!==null).map(([k,v])=>{
const key=k==='gridCols'?'grid-template-columns':k.replace(/[A-Z]/g,a=>'-'+a.toLowerCase());
const val=k==='gridCols'?`repeat(${Math.min(8,Math.max(1,parseInt(v)||3))}, minmax(0,1fr))`:css(v);return key+':'+val;
}).join(';');const extra=typeof st.extraCss==='string'?st.extraCss.replace(/[<>{}]/g,''):'';return pairs+(extra?';'+extra:'');}
function pagePath(id){const p=model.pages.find(q=>q.id===id);return (p?.slug==='index'?'index':p?.slug||'index')+'.html';}
function link(v){if(!v)return '#';if(v.startsWith('page:'))return pagePath(v.slice(5));if(/^https?:\/\//i.test(v)||/^mailto:/i.test(v)||/^#[A-Za-z0-9_-]+$/.test(v))return v;return '#';}
function pic(src){if(!src)return '';return (/^https?:\/\//i.test(src)||/^data:image\/(png|jpeg|webp|gif);base64,/i.test(src))?src:'';}
function aAttrs(url){const href=link(url);return `href="${esc(href)}" ${/^https?:\/\//i.test(href)?'target="_blank" rel="noopener noreferrer"':''}`;}
function nl(v){return esc(v).replace(/\n/g,'<br>');}
function children(b){return Array.isArray(b.children)?b.children.map(render).join(''):'';}
function freeAreaHeight(blocks,device='desktop'){
 if(!Array.isArray(blocks))return 0;
 let end=0;
 for(const b of blocks){
  const st=device==='desktop'?b.style:{...(b.style||{}),...(b.responsive?.[device]||{})};
  if(st?.position!=='absolute')continue;
  end=Math.max(end,(parseFloat(st.top)||0)+Math.max(parseFloat(st.height)||110,40)+26);
 }
 return Math.min(20000,Math.ceil(end));
}
function responsiveCss(){
 const rules={tablet:[],mobile:[]};
 const visit=b=>{
  if(!b||typeof b!=='object')return;
  for(const device of ['tablet','mobile']){
   const declarations=style(b.responsive?.[device]);
   if(declarations && /^[\w-]+$/.test(b.id)){
    const parts=declarations.split(';').filter(x=>x.includes(':')).map(x=>x+' !important');
    if(parts.length)rules[device].push(`.ag-block[data-block-id="${b.id}"]{${parts.join(';')}}`);
   }
  }
  if(Array.isArray(b.children)){
   for(const device of ['tablet','mobile']){
    const height=freeAreaHeight(b.children,device);
    if(height&&/^[\w-]+$/.test(b.id))rules[device].push(`.ag-block[data-block-id="${b.id}"]{min-height:${height}px !important}`);
   }
   b.children.forEach(visit);
  }
 };
 [...(model.header||[]),...(model.footer||[]),...model.pages.flatMap(p=>p.blocks||[])].forEach(visit);
 const active=model.pages.find(p=>p.id===currentId);
 if(active)for(const device of ['tablet','mobile']){
  const rootHeight=freeAreaHeight(active.blocks,device);
  if(rootHeight)rules[device].push(`.ag-main[data-zone="page"]{min-height:${rootHeight}px !important}`);
 }
 return `@media(max-width:800px){${rules.tablet.join('')}}\n@media(max-width:440px){${rules.mobile.join('')}}`;
}
function render(b){
if(!b||typeof b!=='object')return '';
const p=b.props||{}, t=b.type||'text', id=esc(b.id);let st=style(b.style);const minFree=freeAreaHeight(b.children);if(minFree)st+=(st?';':'')+'min-height:'+Math.max(minFree,parseFloat(b.style?.minHeight)||0)+'px';
let className='ag-block ag-'+t+(b.style?.position==='absolute'?' ag-free-position':'');
let inner='';
switch(t){
 case 'section': case 'column': case 'row': case 'columns': case 'grid': case 'card':inner=children(b);break;
 case 'heading': {const h=/^h[1-6]$/.test(p.level)?p.level:'h2';inner=`<${h}>${nl(p.text||'Seu título')}</${h}>`;break;}
 case 'text':inner=`<p>${nl(p.text||'Escreva seu texto')}</p>`;break;
 case 'badge':inner=`<span class="ag-badge-inner">${nl(p.text||'DESTAQUE')}</span>`;break;
 case 'logo':inner=`<a ${aAttrs(p.url||'page:inicio')} class="ag-logo-inner">${nl(p.text||model.settings.name)}</a>`;break;
 case 'button':inner=`<a ${aAttrs(p.url)} class="ag-btn ag-btn-${esc(p.variant||'primary')}">${nl(p.text||'Clique aqui')}</a>`;break;
 case 'image':inner=pic(p.src)?`<img src="${esc(pic(p.src))}" alt="${esc(p.alt||'Imagem')}" loading="lazy">`:'<div class="ag-image-placeholder">▧ &nbsp; Adicione uma imagem no editor</div>';break;
 case 'divider':inner='<hr>';break;
 case 'spacer':inner='';break;
 case 'video': {let src='';const u=(p.url||'').trim();let m=u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);if(m)src='https://www.youtube-nocookie.com/embed/'+m[1];if(!src){m=u.match(/vimeo\.com\/(\d+)/);if(m)src='https://player.vimeo.com/video/'+m[1];}inner=src?`<iframe src="${esc(src)}" title="${esc(p.title||'Vídeo')}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`:'<div class="ag-image-placeholder">▶ &nbsp; Cole a URL de um vídeo YouTube ou Vimeo</div>';break;}
 case 'menu': {const items=p.auto!==false?model.pages.filter(q=>q.inNav).map(q=>({text:q.title,url:'page:'+q.id})):Array.isArray(p.items)?p.items:[];inner='<nav class="ag-menu-inner">'+items.map(q=>`<a ${aAttrs(q.url)}>${esc(q.text)}</a>`).join('')+'</nav>';break;}
 case 'gameCard': {const url=aAttrs(p.url); const img=pic(p.image);inner=`<a ${url} class="ag-game-link"><div class="ag-game-art" style="--card-color:${esc(css(p.color||'#44312e'))}">${img?`<img src="${esc(img)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}<span class="ag-game-badge">${esc(p.badge||'PC')}</span><strong>${esc(p.text||'Nome do jogo')}</strong></div><div class="ag-game-meta"><strong>${esc(p.text||'Jogo')}</strong><span>${esc(p.subtitle||'Tutorial para PC')} <b>↗</b></span></div></a>`;break;}
 case 'catalog':{const items=model.pages.filter(q=>q.kind==='tutorial');const count=Math.min(6,Math.max(1,parseInt(p.columns)||4));inner=`<div class="ag-catalog" data-catalog="${id}">${p.showSearch!==false?`<div class="ag-search-wrap">⌕ <input class="ag-catalog-search" placeholder="${esc(p.placeholder||'Pesquisar tutoriais...')}" type="search" aria-label="Buscar tutoriais"></div>`:''}<div class="ag-catalog-items" style="--catalog-cols:${count}">${items.map(q=>`<a class="ag-catalog-tile" ${aAttrs('page:'+q.id)} data-title="${esc(q.title.toLowerCase())}"><div class="ag-tile-art" style="--card-color:${esc(css(q.color||'#303d43'))}">${pic(q.image)?`<img src="${esc(pic(q.image))}" loading="lazy" alt="" onerror="this.style.display='none'">`:''}<span>PC</span><strong>${esc(q.title)}</strong></div><div class="ag-tile-meta"><b>${esc(q.title)}</b><small>${esc(q.platform||'PC')} • Passo a passo</small></div></a>`).join('')}</div><div class="ag-no-results" hidden>Nenhum tutorial encontrado.</div></div>`;break;}
 case 'html':inner=`<iframe class="ag-embed-frame" loading="lazy" title="Conteúdo HTML" sandbox="" srcdoc="${esc(p.html||'<p>HTML personalizado</p>')}"></iframe>`;break;
 default:inner=`<div>Componente desconhecido: ${esc(t)}</div>`;
}
return `<div class="${className}" data-block-id="${id}" style="${esc(st)}" ${editorMode?'draggable="true"':''}>${inner}</div>`;
}
function renderAll(){
 const page=model.pages.find(p=>p.id===currentId)||model.pages[0];if(!page)return;
 currentId=page.id;document.title=(page.title||'Página')+' — '+model.settings.name;
 const settings=model.settings||{};
 document.documentElement.style.setProperty('--accent',settings.accent||'#ff6b27');
 document.documentElement.style.setProperty('--site-bg',settings.background||'#101113');
 document.documentElement.style.setProperty('--site-color',settings.textColor||'#f4f4f4');
 document.documentElement.style.setProperty('--site-max',settings.maxWidth||'1220px');
 document.documentElement.style.setProperty('--site-font',settings.font||'Arial, sans-serif');
 document.getElementById('customStyle').textContent=settings.customCss||'';
 let mobileCss=document.getElementById('responsiveStyle');if(!mobileCss){mobileCss=document.createElement('style');mobileCss.id='responsiveStyle';document.head.appendChild(mobileCss);}mobileCss.textContent=responsiveCss();
 const freeRoot=freeAreaHeight(page.blocks);
 root.innerHTML=`${page.showHeader!==false?`<header class="ag-site-header"><div class="ag-content" data-zone="header">${model.header.map(render).join('')}</div></header>`:''}<main class="ag-page" style="${esc(style(page.style))}"><div class="ag-main" data-zone="page" style="${freeRoot?'min-height:'+freeRoot+'px':''}">${page.blocks.map(render).join('')}</div></main>${page.showFooter!==false?`<footer class="ag-site-footer"><div class="ag-content" data-zone="footer">${model.footer.map(render).join('')}</div></footer>`:''}`;
 if(editorMode){root.classList.add('ag-edit-mode');setSelection(selected);root.querySelectorAll('.ag-block').forEach(el=>el.draggable=editorCanvasMode==='flow');scheduleOverlay();}
 root.querySelectorAll('.ag-catalog-search').forEach(input=>input.addEventListener('input',()=>{const wrap=input.closest('.ag-catalog');let found=0;wrap.querySelectorAll('.ag-catalog-tile').forEach(tile=>{const ok=tile.dataset.title.includes(input.value.toLowerCase());tile.hidden=!ok;if(ok)found++;});wrap.querySelector('.ag-no-results').hidden=found>0;}));
}
function setSelection(id){selected=id;root.querySelectorAll('.ag-block.selected').forEach(el=>el.classList.remove('selected'));if(id){const el=Array.from(root.querySelectorAll('[data-block-id]')).find(q=>q.dataset.blockId===id);el?.classList.add('selected');}scheduleOverlay();}
function send(type,more={}){if(window.parent!==window)window.parent.postMessage({angelStudio:true,type,...more},'*');}

/* Camada de seleção e edição por mouse. A camada não entra no site publicado. */
let visualOverlay=null, selectionBox=null, guideX=null,guideY=null, overlayRAF=0,gesture=null;
function getSelectedBlock(){return [...root.querySelectorAll('[data-block-id]')].find(el=>el.dataset.blockId===selected)||null;}
function scheduleOverlay(){if(!editorMode||!visualOverlay)return;if(overlayRAF)return;overlayRAF=requestAnimationFrame(()=>{overlayRAF=0;drawOverlay();});}
function rectToFree(el){
 const r=el.getBoundingClientRect(), parent=el.parentElement, pr=parent.getBoundingClientRect();
 const bordL=parseFloat(getComputedStyle(parent).borderLeftWidth)||0,bordT=parseFloat(getComputedStyle(parent).borderTopWidth)||0;
 return {position:'absolute',left:Math.round(r.left-pr.left-bordL+parent.scrollLeft)+'px',top:Math.round(r.top-pr.top-bordT+parent.scrollTop)+'px',width:Math.round(r.width)+'px',height:Math.round(r.height)+'px'};
}
function effectiveFree(el){return getComputedStyle(el).position==='absolute';}
function drawOverlay(){
 if(!visualOverlay)return;
 const el=getSelectedBlock();if(!el){visualOverlay.hidden=true;return;}
 const r=el.getBoundingClientRect();if(r.width<1||r.height<1){visualOverlay.hidden=true;return;}
 visualOverlay.hidden=false;
 const left=Math.max(-10000,r.left),top=Math.max(-10000,r.top);
 selectionBox.style.left=left+'px';selectionBox.style.top=top+'px';selectionBox.style.width=r.width+'px';selectionBox.style.height=r.height+'px';
 const floating=effectiveFree(el);visualOverlay.querySelector('[data-cmd="free"]').textContent=floating?'↪ Fluxo':'◇ Livre';
 const toolbar=visualOverlay.querySelector('.ag-float-toolbar');toolbar.style.top=r.top<70?'calc(100% + 9px)':'';toolbar.style.bottom=r.top<70?'auto':'';
 const badge=visualOverlay.querySelector('.visual-size');badge.textContent=Math.round(r.width)+' × '+Math.round(r.height);
 visualOverlay.querySelector('.visual-tag').textContent=el.className.split(' ').find(x=>x.startsWith('ag-')&&x!=='ag-block'&&x!=='ag-edit-mode'&&x!=='ag-free-position')?.slice(3)||'Elemento';
}
function installVisualEditor(){
 visualOverlay=document.createElement('div');visualOverlay.id='agVisualOverlay';visualOverlay.hidden=true;
 visualOverlay.innerHTML=`<div class="ag-selection-box"><div class="ag-float-toolbar"><span class="visual-tag">Elemento</span><button type="button" data-cmd="move" title="Arraste para mover livremente" aria-label="Mover">✥ Mover</button><button type="button" data-cmd="free" title="Alternar posição livre / fluxo">◇ Livre</button><button type="button" data-cmd="duplicate" title="Duplicar elemento">⧉</button><button type="button" data-cmd="delete" title="Excluir elemento">✕</button></div><div class="visual-size">0 × 0</div>${['nw','n','ne','e','se','s','sw','w'].map(q=>`<span class="ag-handle handle-${q}" data-handle="${q}" title="Redimensionar ${q}"></span>`).join('')}</div><div class="ag-guide ag-guide-x"></div><div class="ag-guide ag-guide-y"></div>`;
 document.body.append(visualOverlay);selectionBox=visualOverlay.querySelector('.ag-selection-box');guideX=visualOverlay.querySelector('.ag-guide-x');guideY=visualOverlay.querySelector('.ag-guide-y');
 visualOverlay.addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-cmd],[data-handle]');if(!b)return;e.preventDefault();e.stopPropagation();
  const cmd=b.dataset.cmd;if(cmd==='delete'||cmd==='duplicate'||cmd==='free'){
   if(cmd==='free'&& !effectiveFree(getSelectedBlock()))send('geometry',{id:selected,style:rectToFree(getSelectedBlock())});
   else send('toolbar-action',{action:cmd,id:selected});return;
  }
  if(cmd==='move')startGesture(e,'move');else if(b.dataset.handle)startGesture(e,'resize',b.dataset.handle);
 });
 root.addEventListener('pointerdown',e=>{
  if(editorCanvasMode!=='free'||e.button!==0||e.target.closest('[contenteditable="true"]'))return;
  const el=e.target.closest('[data-block-id]');if(!el)return;
  if(selected!==el.dataset.blockId)return;
  e.preventDefault();startGesture(e,'move');
 },true);
 window.addEventListener('resize',scheduleOverlay);window.addEventListener('scroll',scheduleOverlay,true);
 document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,[contenteditable="true"]'))return;
  if(e.key==='Escape'){setSelection('');send('select',{id:''});}
  if(!selected||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)||!effectiveFree(getSelectedBlock()))return;
  e.preventDefault();const step=e.shiftKey?10:1,dx=(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),dy=(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0);
  send('nudge',{id:selected,dx,dy});
 });
}
function grid(v){return editorGrid?Math.round(v/8)*8:Math.round(v);}
function startGesture(e,kind,handle='se'){
 if(e.button!==0||gesture)return;
 const el=getSelectedBlock();if(!el)return;
 const r=el.getBoundingClientRect();let style=rectToFree(el);
 const free=effectiveFree(el), baseline=free?{left:parseFloat(getComputedStyle(el).left)||0,top:parseFloat(getComputedStyle(el).top)||0,width:r.width,height:r.height}: {left:parseFloat(style.left),top:parseFloat(style.top),width:r.width,height:r.height};
 // N/S/W handles need absolute coordinates; SE in flow stays in the document layout.
 const mustFree=kind==='move'||(kind==='resize'&&(['n','w','nw','ne','sw'].includes(handle)));
 const oldStyle=el.getAttribute('style'),wasFree=el.classList.contains('ag-free-position');
 if(!free&&mustFree){Object.assign(el.style,style);el.classList.add('ag-free-position');}
 const mode=free||mustFree?'free':'flow';
 gesture={id:selected,el,kind,handle,mode,base:baseline,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,source:e.target,moved:false,originalStyle:oldStyle,wasFree};
 if(e.target.setPointerCapture)try{e.target.setPointerCapture(e.pointerId);}catch{}
 window.addEventListener('pointermove',gestureMove,true);window.addEventListener('pointerup',gestureEnd,true);window.addEventListener('pointercancel',gestureEnd,true);
 document.body.classList.add('ag-gesture-active');
}
function gestureMove(e){
 const g=gesture;if(!g||g.pointerId!==e.pointerId)return;
 const dx=e.clientX-g.startX,dy=e.clientY-g.startY;if(Math.abs(dx)+Math.abs(dy)>2)g.moved=true;
 const b=g.base;let left=b.left,top=b.top,width=b.width,height=b.height;
 if(g.kind==='move'){left=grid(Math.max(0,b.left+dx));top=grid(Math.max(0,b.top+dy));}
 else{
  if(g.handle.includes('e'))width=b.width+dx;
  if(g.handle.includes('s'))height=b.height+dy;
  if(g.handle.includes('w')){left=b.left+dx;width=b.width-dx;}
  if(g.handle.includes('n')){top=b.top+dy;height=b.height-dy;}
  width=Math.max(40,grid(width));height=Math.max(24,grid(height));
  if(g.mode==='free'){left=Math.max(0,grid(left));top=Math.max(0,grid(top));}
 }
 if(g.mode==='free'){g.el.style.position='absolute';g.el.style.left=left+'px';g.el.style.top=top+'px';}
 if(g.kind==='resize'||g.mode==='free'){g.el.style.width=width+'px';g.el.style.height=height+'px';}
 guideX.style.display='block';guideY.style.display='block';guideX.style.top=(g.el.getBoundingClientRect().top)+'px';guideY.style.left=(g.el.getBoundingClientRect().left)+'px';
 drawOverlay();
}
function gestureEnd(e){
 const g=gesture;if(!g||g.pointerId!==e.pointerId)return;
 window.removeEventListener('pointermove',gestureMove,true);window.removeEventListener('pointerup',gestureEnd,true);window.removeEventListener('pointercancel',gestureEnd,true);document.body.classList.remove('ag-gesture-active');
 guideX.style.display='none';guideY.style.display='none';
 if(!g.moved){if(g.originalStyle===null)g.el.removeAttribute('style');else g.el.setAttribute('style',g.originalStyle);if(!g.wasFree)g.el.classList.remove('ag-free-position');gesture=null;scheduleOverlay();return;}
 const st={};if(g.mode==='free'){
  st.position='absolute';st.left=g.el.style.left;st.top=g.el.style.top;st.width=g.el.style.width;st.height=g.el.style.height;
 }else if(g.kind==='resize'){
  st.width=g.el.style.width;st.height=g.el.style.height;
 }
 gesture=null;
 if(Object.keys(st).length)send('geometry',{id:g.id,style:st});
 scheduleOverlay();
}

if(editorMode){
 installVisualEditor();
 root.addEventListener('click',e=>{
  const node=e.target.closest('.ag-block');if(!node)return;
  e.preventDefault();e.stopPropagation();setSelection(node.dataset.blockId);send('select',{id:node.dataset.blockId});
 },true);
 root.addEventListener('dblclick',e=>{
  const node=e.target.closest('.ag-heading,.ag-text,.ag-badge,.ag-logo,.ag-button');if(!node)return;
  e.preventDefault();const el=node.querySelector('h1,h2,h3,h4,h5,h6,p,.ag-badge-inner,.ag-logo-inner,.ag-btn');if(!el)return;
  el.setAttribute('contenteditable','true');el.focus();
  const commit=()=>{el.removeAttribute('contenteditable');send('inline-edit',{id:node.dataset.blockId,text:el.innerText.trim()});};
  el.addEventListener('blur',commit,{once:true});
 },true);
 root.addEventListener('dragstart',e=>{
  if(editorCanvasMode==='free'){e.preventDefault();return;}
  const node=e.target.closest('[data-block-id]');if(!node)return;dragging=node.dataset.blockId;
  e.dataTransfer.setData('text/plain','block:'+dragging);e.dataTransfer.effectAllowed='move';
 });
 root.addEventListener('dragover',e=>{e.preventDefault();let node=e.target.closest('[data-block-id]');root.querySelectorAll('.ag-drop-target').forEach(el=>el.classList.remove('ag-drop-target'));node?.classList.add('ag-drop-target');e.dataTransfer.dropEffect='move';});
 root.addEventListener('drop',e=>{
  e.preventDefault();root.querySelectorAll('.ag-drop-target').forEach(el=>el.classList.remove('ag-drop-target'));
  const txt=e.dataTransfer.getData('text/plain');const target=e.target.closest('[data-block-id]');const zone=e.target.closest('[data-zone]')?.dataset.zone||'page';
  const rect=target?.getBoundingClientRect();const y=rect?((e.clientY-rect.top)/Math.max(rect.height,1)):1;
  const inside=target&&['section','column','row','columns','grid','card'].includes(target.className.split(' ').find(x=>x.startsWith('ag-')&&x!=='ag-block')?.slice(3))&&y>.22&&y<.78;
  send('drop',{payload:txt,target:target?.dataset.blockId||null,zone,position:inside?'inside':y<.5?'before':'after'});
 });
 root.addEventListener('dragend',()=>{dragging='';root.querySelectorAll('.ag-drop-target').forEach(el=>el.classList.remove('ag-drop-target'));});
 window.addEventListener('message',e=>{if(e.source!==window.parent||!e.data?.angelStudio)return;if(e.data.type==='preview'){model=e.data.data;currentId=e.data.page||'inicio';selected=e.data.selected||'';editorCanvasMode=e.data.canvasMode||'flow';editorGrid=e.data.snap!==false;renderAll();}
  else if(e.data.type==='ask-free-geometry'){const el=getSelectedBlock();if(el&&el.dataset.blockId===e.data.id)send('geometry',{id:e.data.id,style:rectToFree(el)});}});
 send('ready');
}
renderAll();
})();
