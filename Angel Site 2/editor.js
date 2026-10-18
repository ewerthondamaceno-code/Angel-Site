/* Angel Studio 4 — edição visual sem programação, com exportação pública offline */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=x=>JSON.parse(JSON.stringify(x)),slug=s=>(String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'pagina');
const valid=m=>m&&Array.isArray(m.pages)&&m.pages.length&&Array.isArray(m.header)&&Array.isArray(m.footer)&&m.settings&&m.pages.every(p=>p.id&&p.slug&&Array.isArray(p.blocks));
const STORE='angel-studio-v4-draft';let model=copy(window.ANGEL_SITE),pageId='inicio',zone='page',selected='',view='pages',device='desktop',redo=[],history=[],uid=Date.now()%100000,pendingImage='';
try{const saved=localStorage.getItem(STORE)||localStorage.getItem('angel-studio-v2-draft');if(saved){const m=JSON.parse(saved);if(valid(m))model=m;}}catch(e){console.warn('Sem rascunho carregado',e)}
if(!model.pages.some(p=>p.id===pageId))pageId=model.pages[0].id;
const nodeTypeNames={heading:'Título',text:'Texto',badge:'Etiqueta',logo:'Logotipo',button:'Botão',image:'Imagem',video:'Vídeo',divider:'Linha',spacer:'Espaço',card:'Caixa',columns:'Duas colunas',column:'Coluna',row:'Linha',section:'Seção',grid:'Grade',catalog:'Catálogo de jogos',gameCard:'Jogo',menu:'Menu',html:'Bloco HTML'};
const containers=new Set(['section','card','column','columns','row','grid']);
const frame=$('#preview');const newId=()=>`v4-${++uid}`;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('visible'),2800)}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(model));$('#saveStatus').textContent='Salvo automaticamente';}catch(e){$('#saveStatus').textContent='Salve um backup (memória cheia)';}}
function snap(){history.push(copy(model));if(history.length>50)history.shift();redo=[];}
function change(full=true){persist();sync();if(full)render();}
function back(){if(!history.length)return;redo.push(copy(model));model=history.pop();selected='';change();}
function forward(){if(!redo.length)return;history.push(copy(model));model=redo.pop();selected='';change();}
function current(){return model.pages.find(p=>p.id===pageId)||model.pages[0]}
function root(z=zone){return z==='header'?model.header:z==='footer'?model.footer:current().blocks}
function locate(id){for(const z of ['header','page','footer']){const visit=(items,parent)=>{for(let i=0;i<items.length;i++){const block=items[i];if(block.id===id)return{block,items,index:i,parent,zone:z};if(Array.isArray(block.children)){const x=visit(block.children,block);if(x)return x;}}return null};const f=visit(root(z),null);if(f)return f;}return null}
function ancestors(id){const route=[];for(const z of ['header','page','footer']){function visit(items,parents){for(const b of items){if(b.id===id){route.push(...parents,b);return true;}if(Array.isArray(b.children)&&visit(b.children,[...parents,b]))return true;}return false;}if(visit(root(z),[]))return route;}return route}
function block(type,text=''){let props={},style={},children;switch(type){
case 'section':style={background:'#202127',padding:'45px 0'};children=[];break;
case 'columns':style={gap:'24px'};children=[];break;
case 'column':style={gap:'14px'};children=[];break;
case 'row':style={gap:'15px',alignItems:'center'};children=[];break;
case 'grid':style={gap:'19px',gridCols:'3'};children=[];break;
case 'card':style={background:'#272931',padding:'22px',borderRadius:'12px',gap:'12px'};children=[];break;
case 'heading':props={text:text||'Escreva seu título aqui',level:'h2'};style={fontSize:'32px',fontWeight:'850',color:'#fafafa'};break;
case 'text':props={text:text||'Clique para escrever seu texto. Você pode alterar tudo por aqui.'};style={fontSize:'16px',color:'#bfc0c7',lineHeight:'1.6'};break;
case 'badge':props={text:text||'NOVIDADE'};style={color:'#ff925a',fontSize:'12px',fontWeight:'800'};break;
case 'button':props={text:text||'SAIBA MAIS →',url:'page:tutoriais',variant:'primary'};break;
case 'image':props={src:'',alt:'Imagem do tutorial'};style={width:'100%',borderRadius:'12px'};break;
case 'video':props={url:'',title:'Vídeo de tutorial'};break;
case 'divider':break;
case 'spacer':style={height:'28px'};break;
case 'gameCard':props={text:text||'Seu jogo',subtitle:'Tutorial completo',url:'page:tutoriais',image:'',badge:'PC',color:'#4e3330'};break;
case 'catalog':props={showSearch:true,columns:4,placeholder:'Pesquisar tutoriais...'};break;
case 'logo':props={text:model.settings.name,url:'page:inicio'};break;
case 'menu':props={auto:true};break;
case 'html':props={html:'<p>Bloco HTML</p>'};break;
}
return{id:newId(),type,props,style,...(children?{children}:{})};}
function sectionTemplate(which){const b=t=>block(t),sec=b('section');sec.children=[];sec.style={background:'#202127',padding:'58px 0'};
if(which==='hero') {sec.style.background='linear-gradient(120deg, #281d19, #17191e)';sec.children=[{...b('columns'),children:[{...b('column'),children:[b('badge'),{...b('heading','Seu próximo grande título'),style:{fontSize:'clamp(38px, 5vw, 66px)',fontWeight:'900',lineHeight:'1.03',color:'#ffffff'}},b('text','Apresente aqui sua página com uma frase simples e fácil de entender.'),b('button','EXPLORAR TUTORIAIS →')]},{...b('column'),children:[b('image')]}]}];}
else if(which==='intro') {sec.children=[{...b('heading','Sobre esta página'),style:{fontSize:'34px',fontWeight:'800'}},b('text','Adicione uma descrição. Você pode mudar o texto clicando nele.')];}
else if(which==='image-text') {sec.children=[{...b('columns'),children:[{...b('column'),children:[b('image')]},{...b('column'),children:[b('badge'),b('heading','Título da seção'),b('text','Explique o que a imagem mostra ou descreva um passo do tutorial.'),b('button','VER MAIS →')]}]}];}
else if(which==='games') {sec.children=[b('heading','Escolha o jogo'),b('text','Encontre o guia de instalação que você precisa.'),b('catalog')];}
else if(which==='steps') {sec.children=[b('badge'),b('heading','Como instalar — passo a passo'),{...b('grid'),style:{gridCols:'3',gap:'18px'},children:['1. Preparação','2. Instalação','3. Primeiro acesso'].map((title,i)=>({...b('card'),children:[{...b('heading',title),style:{fontSize:'20px',fontWeight:'800'}},b('text',['Confira os requisitos e prepare o computador.','Siga as orientações de instalação da plataforma oficial.','Abra o jogo e ajuste as configurações iniciais.'][i])]}))}];}
else if(which==='faq') {sec.children=[b('heading','Perguntas frequentes'),{...b('card'),children:[{...b('heading','O jogo não inicia. O que fazer?'),style:{fontSize:'21px',fontWeight:'800'}},b('text','Confira os requisitos mínimos e faça a verificação dos arquivos pela plataforma.')]}];}
else if(which==='video') {sec.children=[b('heading','Assista ao vídeo completo'),b('text','Inclua o vídeo do seu canal aqui.'),b('video')];}
else if(which==='cards') {sec.children=[b('heading','Destaques'),{...b('grid'),style:{gridCols:'3',gap:'18px'},children:[1,2,3].map(i=>({...b('card'),children:[b('image'),{...b('heading','Destaque '+i),style:{fontSize:'21px',fontWeight:'800'}},b('text','Descrição do destaque.'),b('button','SAIBA MAIS')]}))}];}
else if(which==='cta') {sec.style={background:'#35231e',padding:'48px 0',textAlign:'center'};sec.children=[b('heading','Pronto para começar?'),b('text','Veja nossos guias e aprenda passo a passo.'),b('button','VER TUTORIAIS →')];}
else if(which==='blank') {sec.children=[b('heading','Nova seção'),b('text','Conteúdo da nova seção.')];}
else if(which==='one')return b('heading');else if(which==='paragraph')return b('text');else if(which==='picture')return b('image');else if(which==='link')return b('button');else if(which==='movie')return b('video');else if(which==='space')return b('spacer');
return sec;}
function add(which){const newNode=sectionTemplate(which),f=selected?locate(selected):null;const z=zone;let dest=root(z),idx=dest.length;
if(f&&f.zone===z){const chain=ancestors(f.block.id);const outer=chain[0];if(outer){idx=Math.max(0,dest.findIndex(x=>x.id===outer.id)+1);}}
snap();dest.splice(idx,0,newNode);selected=newNode.id;view='pages';change();toast('Novo item adicionado. Clique nele para editar.');}
function addInside(type){const f=selected?locate(selected):null;if(!f||!containers.has(f.block.type))return;snap();let newNode=block(type);(f.block.children||=[]).push(newNode);selected=newNode.id;change();toast('Elemento adicionado dentro da seção');}
function deleteBlock(){const f=locate(selected);if(!f)return;if(!confirm('Excluir este elemento e tudo que estiver dentro dele?'))return;snap();f.items.splice(f.index,1);selected='';change();toast('Elemento excluído');}
function duplicateBlock(){const f=locate(selected);if(!f)return;snap();const clone=copy(f.block);const reid=n=>{n.id=newId();(n.children||[]).forEach(reid)};reid(clone);f.items.splice(f.index+1,0,clone);selected=clone.id;change();toast('Elemento duplicado');}
function moveBlock(d){const f=locate(selected);if(!f)return;const n=f.index+d;if(n<0||n>=f.items.length)return;snap();[f.items[n],f.items[f.index]]=[f.items[f.index],f.items[n]];change();}
function moveViaCanvas(payload,targetId,position,targetZone){let b,f=null;
if(payload.startsWith('new:')){const typ=payload.slice(4);if(!nodeTypeNames[typ])return;b=block(typ)}else if(payload.startsWith('block:')){f=locate(payload.slice(6));if(!f)return;b=f.block}else return;
const dest=targetId?locate(targetId):null;if(dest&&(dest.block.id===b.id||ancestors(dest.block.id).some(x=>x.id===b.id)))return;
snap();if(f)f.items.splice(f.index,1);
const actual=targetId?locate(targetId):null;if(actual&&position==='inside'&&containers.has(actual.block.type))(actual.block.children||=[]).push(b);
else if(actual)actual.items.splice(actual.index+(position==='before'?0:1),0,b);
else root(targetZone||zone).push(b);
selected=b.id;zone=targetZone||dest?.zone||zone;change();toast('Item reorganizado');}
function setPage(id){if(id==='header'||id==='footer'){zone=id;selected='';}else if(model.pages.some(p=>p.id===id)){pageId=id;zone='page';selected='';}view='pages';change();}
function openNewPage(){$('#newPageForm').reset();$('#newPageModal').showModal();$('#newPageTitle').focus()}
function createPage(name,template){if(!name?.trim())return;const basename=slug(name);let next=basename,i=2;while(model.pages.some(p=>p.slug===next))next=basename+'-'+i++;
const id='pg-'+newId(),p={id,slug:next,title:name.trim(),description:'',kind:template==='tutorial'?'tutorial':'page',inNav:true,showHeader:true,showFooter:true,style:{},blocks:[]};
if(template==='tutorial'){p.platform='PC';p.category='Tutorial';p.blocks=[sectionTemplate('hero'),sectionTemplate('steps'),sectionTemplate('faq')];}
else if(template==='landing')p.blocks=[sectionTemplate('hero'),sectionTemplate('games'),sectionTemplate('cta')];
snap();model.pages.push(p);pageId=id;zone='page';selected='';view='pages';change();toast('Página criada! Agora personalize o conteúdo.');}
function duplicatePage(){const p=current(),s=slug(p.slug+'-copia');let next=s,i=2;while(model.pages.some(q=>q.slug===next))next=s+'-'+i++;
snap();const cloned=copy(p);cloned.id='pg-'+newId();cloned.slug=next;cloned.title=p.title+' (cópia)';cloned.inNav=false;const reid=n=>{n.id=newId();(n.children||[]).forEach(reid)};cloned.blocks.forEach(reid);model.pages.push(cloned);pageId=cloned.id;selected='';change();toast('Página duplicada');}
function deletePage(){if(current().id==='inicio'){toast('A página Início não pode ser apagada.');return;}if(!confirm(`Excluir a página “${current().title}”?`))return;snap();model.pages=model.pages.filter(p=>p.id!==pageId);pageId=model.pages[0].id;selected='';change();toast('Página removida');}
function setSelected(id){selected=id||'';const f=selected?locate(selected):null;if(f)zone=f.zone;renderRight();renderLeft();if(window.innerWidth<=1080&&selected)$('.panel-right').classList.add('open');sync();}
function setView(next){view=next;$$('.rail-button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('.panel-left').classList.toggle('open',window.innerWidth<=760);renderLeft();}
function render(){renderLeft();renderRight();$('#undo').disabled=!history.length;$('#redo').disabled=!redo.length;$('#pagePicker').innerHTML=model.pages.map(p=>`<option value="${esc(p.id)}" ${pageId===p.id?'selected':''}>${esc(p.title)}</option>`).join('');}
function renderLeft(){const out=$('#leftContent');const titles={pages:'Suas páginas',add:'Adicionar conteúdo',design:'Visual do site',organize:'Organizar página'};$('#panelTitle').textContent=titles[view];
if(view==='pages'){
 out.innerHTML='<div class="group-title">PÁGINAS DO SEU SITE</div>'+model.pages.map(p=>`<button class="page-link ${zone==='page'&&pageId===p.id?'active':''}" data-page="${esc(p.id)}"><span class="page-symbol">▤</span><span class="page-name">${esc(p.title)}</span>${p.inNav?'<small>MENU</small>':''}</button>`).join('')+'<button class="big-add" data-action="new-page">＋ Criar página</button><div class="group-title">APARECE EM TODO O SITE</div><button class="page-link '+(zone==='header'?'active':'')+'" data-page="header">▰ <span class="page-name">Cabeçalho / menu</span></button><button class="page-link '+(zone==='footer'?'active':'')+'" data-page="footer">▱ <span class="page-name">Rodapé</span></button><div class="tipbox">Selecione uma página e clique nos textos, imagens ou botões da prévia para alterá-los.</div>';
 }else if(view==='add'){
 const groups=[['SEÇÕES PRONTAS',[['hero','Capa com destaque','Título, texto e imagem','▣'],['intro','Texto de apresentação','Título e parágrafo','≡'],['image-text','Imagem + texto','Duas colunas prontas','▧'],['games','Catálogo de tutoriais','Lista automática de jogos','▦'],['steps','Passo a passo','Três etapas organizadas','①'],['faq','Perguntas frequentes','Ajuda e solução de problemas','?'],['cards','Cards em grade','Três conteúdos em colunas','▤'],['video','Seção com vídeo','Incorpore seu vídeo','▶'],['cta','Chamada para ação','Texto e botão em destaque','➜'],['blank','Seção simples','Comece com título e texto','＋']]],['ELEMENTOS INDIVIDUAIS',[['one','Título','Título editável','T'],['paragraph','Parágrafo','Texto livre','≡'],['picture','Imagem','Envie uma imagem','▧'],['link','Botão','Link clicável','↗'],['movie','Vídeo','YouTube ou Vimeo','▶'],['space','Espaçamento','Crie um respiro entre itens','↕']]]];
 out.innerHTML='<div class="hint">Clique no modelo para inseri-lo nesta página. Ele aparece depois da seção selecionada.</div>'+groups.map(([name,items])=>'<div class="group-title">'+name+'</div>'+items.map(([id,label,descr,icon])=>`<button class="template-card" data-template="${id}"><span class="template-icon">${icon}</span><span><strong>${label}</strong><small>${descr}</small></span></button>`).join('')).join('');
 }else if(view==='design'){
 const s=model.settings;
 out.innerHTML='<div class="hint">Personalize todas as páginas com um clique. Nenhum código é necessário.</div><div class="group-title">ESTILO PRONTO</div><div class="swatch-grid">'+[['#ff7136','#101113','#f5f5f5'],['#14b8df','#0b1720','#f5fcff'],['#a57afb','#171225','#f3edff'],['#57ca99','#101d19','#f3fff9']].map(([a,b,c])=>`<button class="swatch ${s.accent===a?'active':''}" data-palette="${a}|${b}|${c}" style="background:linear-gradient(120deg,${b} 45%,${a} 45% 72%,${c} 72%)" title="Aplicar tema"></button>`).join('')+'</div>'+inputField('Nome do site','settings:name',s.name)+'<div class="group-title">SUAS CORES</div>'+inputField('Cor de destaque','settings:accent',s.accent,'color')+inputField('Cor de fundo','settings:background',s.background,'color')+inputField('Cor dos textos','settings:textColor',s.textColor,'color')+'<div class="group-title">FONTE</div>'+selectField('Tipografia','settings:font',s.font,[['Inter, Arial, sans-serif','Moderna'],['Arial, sans-serif','Clássica'],['Georgia, serif','Editorial'],['Trebuchet MS, sans-serif','Arredondada']])+'<div class="group-title">LARGURA DO CONTEÚDO</div>'+selectField('Área principal','settings:maxWidth',s.maxWidth,[['1000px','Compacta'],['1220px','Padrão'],['1440px','Ampla']])+'<div class="tipbox">Altere a aparência geral aqui. Para mudar somente uma imagem, caixa ou título, clique no elemento na prévia.</div>';
 }else{
 const arr=root(),makeRow=(b,depth)=>`<div class="item-row ${selected===b.id?'active':''}" style="padding-left:${7+depth*11}px"><button class="mini-page-btn label" data-select="${esc(b.id)}">${depth?'↳ ':''}${esc(b.props?.text?.slice(0,25)||nodeTypeNames[b.type]||b.type)}</button><button data-move="${esc(b.id)}:-1" title="Subir">↑</button><button data-move="${esc(b.id)}:1" title="Descer">↓</button></div>`+(b.children||[]).map(x=>makeRow(x,depth+1)).join('');
 out.innerHTML='<div class="hint">Use as setas para mudar a ordem. Clique no nome para selecionar um item. Você também pode arrastar itens diretamente na prévia.</div><div class="group-title">'+(zone==='page'?esc(current().title):zone==='header'?'CABEÇALHO':'RODAPÉ')+'</div>'+arr.map(b=>makeRow(b,0)).join('')+'<button class="big-add" data-viewjump="add">＋ Adicionar algo</button>';
 }
}
function inputField(label,path,value,type='text',extra=''){const tag=type==='textarea'?`<textarea data-set="${esc(path)}" rows="4">${esc(value)}</textarea>`:`<input type="${type}" data-set="${esc(path)}" value="${esc(value??'')}" ${extra}>`;return `<label class="field"><span>${label}</span>${tag}</label>`;}
function selectField(label,path,value,options){return `<label class="field"><span>${label}</span><select data-set="${esc(path)}">${options.map(([id,name])=>`<option value="${esc(id)}" ${String(id)===String(value)?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;}
function linkField(label,path,val){return inputField(label,path,val,'text','placeholder="https://... ou page:inicio"');}
function colorValue(s,def='#262830'){return /^#[0-9a-fA-F]{6}$/.test(String(s||''))?s:def;}
function renderRight(){const right=$('#rightContent');const title=$('#rightTitle'),sub=$('#rightSubtitle');const f=selected?locate(selected):null;
 if(!f){title.textContent=zone==='page'?'Sua página':zone==='header'?'Menu e cabeçalho':'Rodapé do site';sub.textContent='Personalize esta área e adicione conteúdos.';
 let content='<div class="tipbox">👆 Clique em qualquer elemento da página para alterar texto, imagem, tamanho ou cores.</div>';
 if(zone==='page'){const p=current();content+=inputField('Nome da página','page:title',p.title)+inputField('Descrição nos buscadores','page:description',p.description||'','textarea')+inputField('Endereço da página (sem espaços)','page:slug',p.slug)+`<label class="field"><span><input type="checkbox" data-set="page:inNav" ${p.inNav?'checked':''}> Mostrar no menu do site</span></label>`;
 if(p.kind==='tutorial')content+=inputField('Plataforma do jogo','page:platform',p.platform||'PC')+inputField('Capa do tutorial (URL)','page:image',p.image||'')+'<button class="button-wide" data-action="upload-page-image">▧ Enviar capa do computador</button>';
 content+='<div class="separator"></div><button class="button-wide" data-action="duplicate-page">⧉ Duplicar página</button>'+(p.id!=='inicio'?'<button class="button-wide danger" data-action="delete-page">✕ Excluir página</button>':'')+'<button class="button-wide" data-viewjump="add">＋ Adicionar seção</button>';
 }else content+='<button class="button-wide" data-viewjump="add">＋ Adicionar elemento</button>';
 right.innerHTML=content;return;}
 const b=f.block,t=b.type,p=b.props||{},s=b.style||{};title.textContent=nodeTypeNames[t]||'Elemento';sub.textContent='Faça suas alterações abaixo e veja na hora.';
 let html='';
 if(['heading','text','badge','logo','button','gameCard'].includes(t))html+=inputField('Texto','props:text',p.text||'',t==='text'?'textarea':'text');
 if(t==='heading')html+=selectField('Tamanho do título','style:fontSize',s.fontSize||'32px',[['20px','Pequeno'],['28px','Médio'],['32px','Grande'],['42px','Muito grande'],['58px','Gigante']]);
 if(t==='text')html+=selectField('Tamanho do texto','style:fontSize',s.fontSize||'16px',[['12px','Pequeno'],['14px','Médio'],['16px','Normal'],['20px','Grande'],['24px','Muito grande']]);
 if(['button','logo','gameCard'].includes(t))html+=linkField('Link do item','props:url',p.url||'');
 if(t==='button')html+=selectField('Aparência do botão','props:variant',p.variant||'primary',[['primary','Destaque'],['secondary','Discreto']]);
 if(t==='image'||t==='gameCard')html+=`<button class="button-wide" data-action="upload-block-image">▧ Trocar imagem do computador</button>`+inputField('Ou cole o link da imagem','props:'+(t==='image'?'src':'image'),t==='image'?p.src||'':p.image||'');
 if(t==='image')html+=inputField('Descrição da imagem','props:alt',p.alt||'');
 if(t==='video')html+=linkField('Link do YouTube ou Vimeo','props:url',p.url||'');
 if(t==='gameCard')html+=inputField('Descrição do jogo','props:subtitle',p.subtitle||'');
 if(t==='catalog')html+='<div class="tipbox">O catálogo é preenchido automaticamente com as páginas marcadas como tutoriais.</div>'+inputField('Texto da pesquisa','props:placeholder',p.placeholder||'')+selectField('Jogos por linha','props:columns',p.columns||4,[[2,'2'],[3,'3'],[4,'4'],[5,'5']]);
 if(t==='menu')html+='<div class="tipbox">O menu mostra automaticamente as páginas marcadas para aparecer na navegação. Gerencie isso em cada página.</div>';
 if(t==='html')html+='<div class="tipbox">Este bloco foi importado de um editor antigo. Você pode movê-lo ou excluí-lo, mas o conteúdo HTML não é editável no modo fácil.</div>';
 if(containers.has(t)){
 html+='<div class="group-title">APARÊNCIA DA SEÇÃO</div>'+inputField('Cor do fundo','style:background',colorValue(s.background),'color');
 html+=selectField('Espaçamento','style:padding',s.padding||'45px 0',[['18px 0','Compacto'],['34px 0','Médio'],['45px 0','Confortável'],['68px 0','Espaçoso']]);
 if(t==='grid')html+=selectField('Colunas','style:gridCols',s.gridCols||'3',[[1,'1 coluna'],[2,'2 colunas'],[3,'3 colunas'],[4,'4 colunas']]);
 html+='<div class="group-title">COLOCAR DENTRO</div><div class="choice-grid"><button data-inside="heading">＋ Título</button><button data-inside="text">＋ Texto</button><button data-inside="image">＋ Imagem</button><button data-inside="button">＋ Botão</button><button data-inside="video">＋ Vídeo</button><button data-inside="card">＋ Card</button></div>';
 }
 if(['heading','text','badge','logo'].includes(t))html+='<div class="group-title">ESTILO DO TEXTO</div>'+inputField('Cor do texto','style:color',colorValue(s.color,'#ffffff'),'color')+selectField('Alinhamento','style:textAlign',s.textAlign||'left',[['left','Esquerda'],['center','Centro'],['right','Direita']]);
 if(t==='image')html+=selectField('Formato','style:objectFit',s.objectFit||'cover',[['cover','Preencher'],['contain','Mostrar tudo']]);
 if(s.position==='absolute')html+='<button class="button-wide" data-action="normal-flow">↺ Restaurar posição normal</button>';
 html+='<div class="separator"></div><div class="group-title">ORGANIZAR ESTE ITEM</div><div class="button-grid"><button data-action="move-up" title="Mover para cima">↑ Subir</button><button data-action="move-down" title="Mover para baixo">↓ Descer</button><button data-action="duplicate-block" title="Criar cópia">⧉ Copiar</button></div><button class="button-wide danger" data-action="delete-block">✕ Excluir este item</button>';
 right.innerHTML=html;
}
function changeField(el){const path=el.dataset.set;if(!path)return;const [where,key]=path.split(':');const value=el.type==='checkbox'?el.checked:el.value;let target;
 if(where==='props'||where==='style'){const f=selected?locate(selected):null;if(!f)return;target=(f.block[where]||={});}
 else if(where==='page')target=current();else if(where==='settings')target=model.settings;else return;
 if(where==='page'&&key==='slug'){if(current().id==='inicio')return toast('O endereço da página inicial deve permanecer index');const n=slug(value);if(model.pages.some(p=>p!==current()&&p.slug===n))return toast('Esse endereço já está em uso');target.slug=n;}
 else target[key]=value;
 change(false);if(where!=='props'&&['name','title','inNav'].includes(key)){renderLeft();$('#pagePicker').innerHTML=model.pages.map(p=>`<option value="${esc(p.id)}" ${pageId===p.id?'selected':''}>${esc(p.title)}</option>`).join('');}
}
function sync(){if(frame.contentWindow)frame.contentWindow.postMessage({angelStudio:true,type:'preview',data:model,page:pageId,selected,canvasMode:'flow',snap:true},'*');}
function handleAction(a){switch(a){case'normal-flow':{const f=locate(selected);if(!f)return;snap();for(const key of ['position','left','right','top','bottom','width','height','transform'])delete f.block.style[key];if(f.block.responsive)f.block.responsive={};change();toast('Posição normal restaurada');break;}case'new-page':openNewPage();break;case'duplicate-page':duplicatePage();break;case'delete-page':deletePage();break;case'move-up':moveBlock(-1);break;case'move-down':moveBlock(1);break;case'duplicate-block':duplicateBlock();break;case'delete-block':deleteBlock();break;case'upload-block-image':pendingImage='block';$('#imageUpload').click();break;case'upload-page-image':pendingImage='page';$('#imageUpload').click();break;case'backup':backup();break;case'import':$('#projectImport').click();break;case'export':exportSite();break;}}
function downloadBlob(name,blob){const uri=URL.createObjectURL(blob),a=document.createElement('a');a.href=uri;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),15000);}
function backup(){downloadBlob('angel-studio-projeto.json',new Blob([JSON.stringify(model,null,2)],{type:'application/json'}));toast('Backup do projeto baixado');}
const encoder=new TextEncoder(),table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?(0xedb88320^(n>>>1)):(n>>>1);return n>>>0;});
function crc(data){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(files){const local=[],central=[];let offset=0;for(const [filename,value]of Object.entries(files)){const name=encoder.encode(filename),data=encoder.encode(value),c=crc(data),head=new Uint8Array(30+name.length),h=new DataView(head.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);head.set(name,30);local.push(head,data);
const dir=new Uint8Array(46+name.length),d=new DataView(dir.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x0800,true);d.setUint32(16,c,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);dir.set(name,46);central.push(dir);offset+=head.length+data.length;}
const mid=central.reduce((acc,item)=>acc+item.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,mid,true);v.setUint32(16,offset,true);return new Blob([...local,...central,end],{type:'application/zip'});}
function fromBase64(s){return new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)));}
function htmlPage(p){return `<!doctype html>\n<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(p.description||'Guias e tutoriais de instalação de jogos para PC')}"><title>${esc(p.title)} — ${esc(model.settings.name)}</title><link rel="stylesheet" href="site.css"><style id="customStyle"></style></head><body data-page="${esc(p.id)}"><div id="siteRoot"></div><script src="site-data.js"></script><script src="site.js"></script></body></html>`;}
function exportSite(){try{const slugs=model.pages.map(p=>p.slug);if(slugs.some(s=>!/^[a-z0-9-]+$/.test(s))||new Set(slugs).size!==slugs.length)throw Error('Existem endereços de páginas inválidos ou repetidos.');
const files={'site-data.js':'window.ANGEL_SITE = '+JSON.stringify(model,null,2)+';\n','site.css':fromBase64(window.ANGEL_ASSETS.css),'site.js':fromBase64(window.ANGEL_ASSETS.js)};
for(const p of model.pages)files[p.slug+'.html']=htmlPage(p);
files['PUBLICAR.txt']='ANGEL GUIDES — SITE PÚBLICO\n\n1. Extraia este ZIP.\n2. Abra index.html para conferir as alterações.\n3. Envie TODOS os arquivos para sua hospedagem (Hostinger, Netlify ou GitHub Pages).\n4. Este arquivo não contém o editor, login ou painel administrativo.\n5. Guarde um backup JSON do seu projeto no Angel Studio 4 para editar depois.\n\nImagens carregadas por links externos exigem internet.\n';
downloadBlob('angel-guides-site-publico.zip',zip(files));toast(`Site gerado com ${model.pages.length} páginas, separado do editor.`);
}catch(e){toast('Erro ao exportar: '+e.message);console.error(e)}}
async function readImage(file){if(!file.type.startsWith('image/'))throw Error('Selecione uma imagem válida.');if(file.size>12*1024*1024)throw Error('A imagem precisa ter menos de 12 MB');return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const max=1600,ratio=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/webp',.82));};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Não foi possível ler a imagem.'))};img.src=url;});}
$('.navrail').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b){setView(b.dataset.view);$('.panel-right').classList.remove('open');}});
$('#leftContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.page)setPage(b.dataset.page);else if(b.dataset.template)add(b.dataset.template);else if(b.dataset.viewjump)setView(b.dataset.viewjump);else if(b.dataset.select)setSelected(b.dataset.select);else if(b.dataset.action)handleAction(b.dataset.action);else if(b.dataset.move){const [id,dir]=b.dataset.move.split(':');selected=id;moveBlock(+dir);}});
$('#rightContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action)handleAction(b.dataset.action);else if(b.dataset.inside)addInside(b.dataset.inside);else if(b.dataset.viewjump)setView(b.dataset.viewjump);});
$('#rightContent').addEventListener('focusin',e=>{if(e.target.dataset.set)snap();});
$('#rightContent').addEventListener('input',e=>{if(e.target.dataset.set)changeField(e.target);});
$('#rightContent').addEventListener('change',e=>{if(e.target.dataset.set){changeField(e.target);renderRight();}});
$('#leftContent').addEventListener('focusin',e=>{if(e.target.dataset.set)snap();});
$('#leftContent').addEventListener('input',e=>{if(e.target.dataset.set)changeField(e.target);});
$('#leftContent').addEventListener('change',e=>{if(e.target.dataset.set){changeField(e.target);renderLeft();}});
$('#leftContent').addEventListener('click',e=>{const x=e.target.closest('[data-palette]');if(!x)return;const [a,b,c]=x.dataset.palette.split('|');snap();model.settings.accent=a;model.settings.background=b;model.settings.textColor=c;change();toast('Nova combinação de cores aplicada');});
$('#pagePicker').addEventListener('change',e=>setPage(e.target.value));
frame.addEventListener('load',sync);
window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!e.data?.angelStudio)return;const d=e.data;if(d.type==='ready')sync();else if(d.type==='select')setSelected(d.id);else if(d.type==='inline-edit'){const f=locate(d.id);if(f&&f.block.props?.text!==d.text){snap();f.block.props.text=d.text;selected=d.id;zone=f.zone;change();}}else if(d.type==='drop')moveViaCanvas(d.payload||'',d.target,d.position,d.zone);else if(d.type==='toolbar-action'){if(d.id)setSelected(d.id);if(d.action==='delete')deleteBlock();if(d.action==='duplicate')duplicateBlock();}});
$$('[data-screen]').forEach(b=>b.addEventListener('click',()=>{$$('[data-screen]').forEach(x=>x.classList.toggle('active',x===b));device=b.dataset.screen;$('#pageFrame').classList.toggle('mobile',device==='mobile');sync();}));
$('#undo').addEventListener('click',back);$('#redo').addEventListener('click',forward);
$('#publish').addEventListener('click',exportSite);$('#viewSite').addEventListener('click',()=>{persist();window.open('show.html?p='+encodeURIComponent(current().slug),'_blank','noopener');});
$('#addSectionTop').addEventListener('click',()=>setView('add'));$('#helpBtn').addEventListener('click',()=>$('#helpModal').showModal());$('#hidePanel').addEventListener('click',()=>$('.panel-left').classList.remove('open'));
$('#newPageForm').addEventListener('submit',e=>{const submitter=e.submitter;if(submitter?.value==='create'){const name=$('#newPageTitle').value.trim();if(!name){e.preventDefault();return;}createPage(name,$('#newPageTemplate').value);}});
$('#imageUpload').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const uri=await readImage(file);snap();if(pendingImage==='page')current().image=uri;else {const b=locate(selected)?.block;if(!b||!['image','gameCard'].includes(b.type))throw Error('Selecione uma imagem ou card.');b.props[b.type==='image'?'src':'image']=uri;}change();toast('Imagem atualizada no site');}catch(err){toast(err.message)}finally{e.target.value='';}});
$('#projectImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const m=JSON.parse(await file.text());if(!valid(m))throw Error('Projeto não reconhecido.');if(!confirm('Substituir seu projeto atual por este backup?'))return;snap();model=copy(m);pageId=model.pages[0].id;zone='page';selected='';view='pages';change();toast('Projeto importado!');}catch(err){toast('Erro: '+err.message)}finally{e.target.value='';}});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persist();toast('Alterações salvas neste navegador.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,textarea,select')){e.preventDefault();back();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'&&!e.target.closest('input,textarea,select')){e.preventDefault();forward();}if(e.key==='Escape')$('.panel-right').classList.remove('open');});
// Backups e restauração ficam sempre acessíveis na tela de ajuda, sem poluir o editor.
const projectButtons=document.createElement('div');projectButtons.className='project-tools';projectButtons.innerHTML='<div class="group-title">GUARDAR E RECUPERAR SEU PROJETO</div><button class="button-wide" data-project="backup">↓ Fazer backup do projeto (.JSON)</button><button class="button-wide" data-project="import">↑ Abrir backup antigo (.JSON)</button>';
projectButtons.addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)handleAction(b.dataset.project);});$('#helpModal .help-steps').append(projectButtons);
render();sync();
})();
