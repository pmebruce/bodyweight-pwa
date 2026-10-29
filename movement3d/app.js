import * as T from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {createNaturalRig} from './natural-rig.js';
import {createBodyFullness} from './body-fullness.js';
import {softenFace} from './soften-face.js';
import {MOTIONS} from './motion-library.js';
import {createProps} from './scene-props.js';
import {attachDumbbells,setDumbbellKg} from './dumbbells.js';
import {readAvatar,applyBody,slimArms,addHair,applySkin} from './appearance.js';
import {cameraPresets,cameraDistance} from './camera-presets.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),exercise=params.get('exercise'),meta=MOTIONS[exercise];
let dumbbells=[],kg=+params.get('kg')||8,rig,renderer,playing=params.get('playing')==='true',speed=1,time=params.has('t')?(+params.get('t')%1+1)%1:.05,raf=0,disposed=false,highlighted=true,needsRender=true,lastPose=NaN;
const post=type=>parent.postMessage({type},location.origin);
function fail(error){console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error').textContent='示範暫時無法載入，請重新整理再試一次。';post('movement3d-error');}
if(!meta){fail('Unknown exercise');throw Error('Unknown exercise');}
try{renderer=new T.WebGLRenderer({antialias:true});}catch(e){fail(e);throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xe9eee5);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('viewport').appendChild(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,40);let angle=meta.front?'front':exercise==='pushup'?'side':'three';const bounds=new T.Box3(new T.Vector3(-.6,0,-.8),new T.Vector3(.6,1.9,.8));
scene.add(new T.HemisphereLight(0xfff5ea,0x7c8790,1.7));const key=new T.DirectionalLight(0xfff2df,2.2);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-2.5,right:2.5,top:3,bottom:-3});key.shadow.normalBias=.006;scene.add(key);const rim=new T.DirectionalLight(0xe3edff,1.1);rim.position.set(3,3,-3);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xe9eee5,roughness:.85}));floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(12,48,0xc9d3c5,0xd8e0d4);grid.position.y=-.004;grid.material.transparent=true;grid.material.opacity=.55;grid.material.depthWrite=false;scene.add(grid);const prop=createProps(exercise);scene.add(prop);
const presets=cameraPresets(exercise);
function view(){
  needsRender=true;const {yaw,pitch}=presets[angle],target=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),usable=T.MathUtils.clamp((h-90)/h,.54,.86);
  camera.aspect=w/h;camera.updateProjectionMatrix();const distance=cameraDistance(size,yaw,pitch,camera.aspect,usable);
  camera.position.copy(target).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance));camera.lookAt(target);
  document.querySelectorAll('[data-angle]').forEach(b=>{b.textContent=presets[b.dataset.angle].label;b.setAttribute('aria-pressed',String(b.dataset.angle===angle));});
}
const resize=new ResizeObserver(()=>{renderer.setSize(innerWidth,innerHeight,false);view();});resize.observe(document.body);
document.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>{angle=b.dataset.angle;view();});$('muscle').onclick=()=>{highlighted=!highlighted;$('muscle').setAttribute('aria-pressed',String(highlighted));rig?.setHighlight(highlighted);needsRender=true;};
addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='movement3d-control')return;playing=!!e.data.playing;if([.5,.75,1,2].includes(e.data.speed))speed=e.data.speed;if(typeof e.data.kg==='number'&&e.data.kg>0&&e.data.kg!==kg){kg=e.data.kg;if(dumbbells.length){setDumbbellKg(dumbbells,kg);needsRender=true;}}});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context lost');});
async function load(){const parts=Array.from({length:10},(_,i)=>`assets/human-${String(i).padStart(2,'0')}.bin`);const chunks=await Promise.all(parts.map(async path=>{const r=await fetch(path);if(!r.ok)throw Error('Model fetch failed');return new Uint8Array(await r.arrayBuffer());}));const bytes=new Uint8Array(chunks.reduce((a,b)=>a+b.length,0));let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),gltf=await new GLTFLoader().parseAsync(raw,'');if(disposed)return;const body=new T.Group();body.scale.setScalar(1.8/1.680323797);body.add(gltf.scene);scene.add(body);softenFace(body);const avatar=readAvatar(params);createBodyFullness(body).setFull(true);applyBody(body,avatar.body);slimArms(body,avatar.body);addHair(body,avatar.hair);rig=createNaturalRig(body);applySkin(rig.meshes,avatar.skin);dumbbells=attachDumbbells(rig,body,meta.db,exercise,kg);rig.setExercise(exercise);rig.setHighlight(highlighted);
 bounds.makeEmpty();for(let i=0;i<20;i++){rig.pose(i/20);for(const b of Object.values(rig.bones))bounds.expandByPoint(b.getWorldPosition(new T.Vector3()));}bounds.expandByScalar(.12);bounds.min.y=Math.min(0,bounds.min.y);if(prop.children.length)bounds.union(new T.Box3().setFromObject(prop));if(faultOn)applyFaultState();rig.pose(time);lastPose=time;updateHud();view();$("loading").hidden=true;post('movement3d-ready');}
load().catch(fail);
let last=performance.now();const duration=['squat','pushup','lunge'].includes(exercise)?5.6:exercise==='jack'?2.4:exercise==='armcircle'?3:exercise==='punch'?2.4:exercise==='uppercut'?3.2:meta.duration;
// Breathing + tempo HUD (strength reps only): 吸氣 while lowering, 停 on the pause, 吐氣 on the effort.
const phases=meta.phases,hud=$('hud');let hudKey='';
if(phases&&params.get('hud')!=='0'){
  const L=s=>s<.25?0:Math.max(1,Math.round(s)),sec=k=>phases.filter(p=>p.k===k).reduce((a,p)=>a+(p.b-p.a)*duration,0);
  $('tempo').textContent=`節奏 ${L(sec('ecc'))}-${L(sec('hold'))}-${L(sec('con'))}（下-停-上 秒）`;
  const bar=$('phasebar');let t0=0;for(const p of phases){if(p.a>t0+1e-3){const r=document.createElement('s');r.className='rest';r.style.width=(p.a-t0)*100+'%';bar.insertBefore(r,$('phasedot'));}const s=document.createElement('s');s.className=p.k;s.style.width=(p.b-p.a)*100+'%';bar.insertBefore(s,$('phasedot'));t0=p.b;}
  if(t0<1){const r=document.createElement('s');r.className='rest';r.style.width=(1-t0)*100+'%';bar.insertBefore(r,$('phasedot'));}
  hud.hidden=false;
}
function updateHud(){if(!phases||hud.hidden)return;const p=phases.find(p=>time>=p.a&&time<p.b),k=p?p.k:'rest';$('phasedot').style.left=`calc(${(time*100).toFixed(2)}% - 1px)`;if(k!==hudKey){hudKey=k;const b=$('breath');b.className=k;b.textContent=k==='con'?'吐氣 ↑ 用力':k==='ecc'?'吸氣 ↓ 控制':k==='hold'?'停一下':'準備';}}
// 常見錯誤 mode: one loop of the wrong form (faulty part tinted yellow) then one loop of the correct form, repeating.
const fault=meta.fault;let faultOn=params.get('fault')==='1',faultLoop=0,prevTime=time;
if(fault){$('fault').hidden=false;$('fault').onclick=()=>{faultOn=!faultOn;faultLoop=0;applyFaultState();};}
function applyFaultState(){
  $('fault').setAttribute('aria-pressed',String(faultOn));const cue=$('faultcue'),bad=faultOn&&faultLoop%2===0;
  if(!faultOn){cue.hidden=true;rig?.setFault(0,null);needsRender=true;lastPose=NaN;return;}
  cue.hidden=false;cue.className=bad?'bad':'good';cue.textContent=bad?`✗ 錯誤：${fault.bad}`:`✓ 正確：${fault.good}`;
  rig?.setFault(bad?1:0,bad?fault.bones:null);lastPose=NaN;needsRender=true;
}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){if(playing&&rig){time=(time+dt*speed/duration)%1;if(faultOn&&time<prevTime){faultLoop++;applyFaultState();}prevTime=time;}if(rig&&lastPose!==time){rig.pose(time);lastPose=time;needsRender=true;updateHud();}if(needsRender){(headcam&&rig&&aimHead()),renderer.render(scene,camera);needsRender=false;}}raf=requestAnimationFrame(frame);}view();raf=requestAnimationFrame(frame);
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();scene.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});renderer.dispose();},{once:true});

addEventListener('storage',e=>{if(e.key==='bwfit:data:v1'&&!params.has('avatar')){const a=readAvatar(params);if(JSON.stringify(a)!==sessionStorage.getItem('m3d-avatar'))location.reload();}});
try{sessionStorage.setItem('m3d-avatar',JSON.stringify(readAvatar(params)));}catch{}

// debug: ?headcam=yawDeg,pitchDeg close-up of the head (used for hair checks)
const headcam=params.get('headcam');function aimHead(){const [y,p]=headcam.split(',').map(Number),h=rig.bones.Head.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.08,0)),Y=y*Math.PI/180,P=(p||0)*Math.PI/180;camera.position.copy(h).add(new T.Vector3(Math.sin(Y)*Math.cos(P),Math.sin(P),Math.cos(Y)*Math.cos(P)).multiplyScalar(.75));camera.lookAt(h);}
