import * as T from './assets/three.module.js';
import {mergeVertices} from './assets/BufferGeometryUtils.js';
// Character customisation: skin tone, hair style, body type. Read from the app settings (same origin)
// or overridden with ?avatar=skin,hair,body (used for screenshots).
export const SKINS={light:0xe8bc9c,medium:0xbd8d73,tan:0x9a6a4c,deep:0x6a4530};
export function readAvatar(params){
  let s={};try{s=JSON.parse(localStorage.getItem('bwfit:data:v1')||'{}').settings||{};}catch{}
  const o=(params.get('avatar')||'').split(',');
  const skin=o[0]||s.skin,hair=o.length>1?o[1]:s.hair,body=o[2]||s.body;
  return {skin:SKINS[skin]?skin:'medium',hair:['','A','B','C'].includes(hair)?hair:'C',body:'male'/* female dormant for now */};
}
const weightOf=(geo,bones,re,i)=>{let w=0;for(let k=0;k<4;k++){const b=bones[geo.attributes.skinIndex.array[i*4+k]];if(b&&re.test(b.name))w+=geo.attributes.skinWeight.array[i*4+k];}return w;};
// female silhouette: wider hips, narrower waist / shoulders, slimmer arms, soft chest. Bind-pose vertex edit.
export function applyBody(model,body){
  if(body!=='female')return;model.updateMatrixWorld(true);
  model.traverse(m=>{if(!m.isSkinnedMesh)return;const g=m.geometry,pos=g.attributes.position,bones=m.skeleton.bones,inv=m.matrixWorld.clone().invert(),p=new T.Vector3();
    const box=new T.Box3().setFromBufferAttribute(pos).applyMatrix4(m.matrixWorld),H=box.max.y-box.min.y,y0=box.min.y;
    for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);const h=(p.y-y0)/H,ax=Math.abs(p.x);
      const arm=weightOf(g,bones,/^(upperarm|lowerarm|hand|clavicle)/,i);
      if(arm>.3){continue;}
      let sx=1;
      const hip=Math.exp(-(((h-.50)/.07)**2)),waist=Math.exp(-(((h-.62)/.05)**2)),sh=Math.exp(-(((h-.80)/.05)**2));
      sx+= .10*hip-.09*waist-.07*sh;
      p.x*=sx;
      const chest=Math.exp(-(((h-.735)/.035)**2))*Math.exp(-(((ax-.09)/.05)**2));if(p.z>0)p.z+=.022*chest;
      p.applyMatrix4(inv);pos.setXYZ(i,p.x,p.y,p.z);}
    pos.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();});
}
// slimmer arms for female: shrink arm vertices toward the arm bone axis
export function slimArms(model,body){
  if(body!=='female')return;model.updateMatrixWorld(true);
  model.traverse(m=>{if(!m.isSkinnedMesh)return;const g=m.geometry,pos=g.attributes.position,bones=m.skeleton.bones,inv=m.matrixWorld.clone().invert(),p=new T.Vector3();
    const axes=bones.map(b=>{const c=b.children.find(x=>x.isBone),a=b.getWorldPosition(new T.Vector3());return {a,v:c?c.getWorldPosition(new T.Vector3()).sub(a).normalize():null,arm:/^(upperarm|lowerarm)/.test(b.name)};});
    for(let i=0;i<pos.count;i++){const d=new T.Vector3();p.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);let any=false;
      for(let k=0;k<4;k++){const w=g.attributes.skinWeight.array[i*4+k],ax=axes[g.attributes.skinIndex.array[i*4+k]];if(!w||!ax.arm||!ax.v)continue;const r=p.clone().sub(ax.a);r.addScaledVector(ax.v,-r.dot(ax.v));d.addScaledVector(r,-.16*w);any=true;}
      if(any){p.add(d).applyMatrix4(inv);pos.setXYZ(i,p.x,p.y,p.z);}}
    pos.needsUpdate=true;g.computeVertexNormals();});
}
// hair: a shell grown from the scalp itself (head-skinned triangles above a hairline, pushed out along
// the normals), parented rigidly to the head bone. Hugs the skull from every angle; call in bind pose.
const smooth=(e0,e1,x)=>{const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
export function addHair(model,style,skin='medium'){
  if(!style)return null;model.updateMatrixWorld(true);
  let src=null,best=0;model.traverse(m=>{if(m.isSkinnedMesh&&m.geometry.attributes.position.count>best){best=m.geometry.attributes.position.count;src=m;}});
  if(!src)return null;const g=src.geometry,pos=g.attributes.position,nor=g.attributes.normal,bones=src.skeleton.bones,head=bones.find(b=>b.name==='head');if(!head)return null;
  const nm=new T.Matrix3().getNormalMatrix(src.matrixWorld),P=[],N=[],W=[],box=new T.Box3();
  for(let i=0;i<pos.count;i++){const w=weightOf(g,bones,/^head$/,i);W.push(w);const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(src.matrixWorld);P.push(p);N.push(new T.Vector3().fromBufferAttribute(nor,i).applyMatrix3(nm).normalize());if(w>.9)box.expandByPoint(p);}
  const c=box.getCenter(new T.Vector3()),sz=box.getSize(new T.Vector3()),top=box.max.y;
  // head-relative coords: u across (x), v up from crown (0 top, 1 chin), f front(+1)/back(-1)
  const hx=sz.x/2,hz=sz.z/2,H=sz.y,partX=c.x+hx*.42; // side part on the model's left
  const info=p=>{const v=(top-p.y)/H,f=(p.z-c.z)/hz,u=(p.x-c.x)/hx;
    // hairline depth (fraction of head height from the crown): forehead .23, temples .32, above ears .40, nape .62
    const ang=Math.atan2(Math.abs(u),f),fr=Math.cos(ang); // 1 front, 0 side, -1 back
    const line=fr>0?.23+(.36-.23)*(1-fr)**1.5:.36+(.60-.36)*Math.min(1,-fr*1.2);
    const ear=Math.exp(-(((f+.05)/.32)**2))*Math.exp(-(((Math.abs(u)-1)/.35)**2)); // carve around the ear
    return {v,f,u,line:line-.12*ear+(style==='C'?.006*Math.cos(u*Math.PI):0),fr};};
  const style_={C:{t:.0025,crown:.0015},A:{t:.010,crown:.008,quiff:.026},B:{t:.008,crown:.005}}[style]||{t:.011,crown:.012};
  const D=new Float32Array(pos.count).fill(-1),out=[];
  for(let i=0;i<pos.count;i++){if(W[i]<.6)continue;const p=P[i],q=info(p);D[i]=q.line-q.v;
    const edge=smooth(0,.07,D[i]); // thin at the hairline
    let t=style_.t*(.15+.85*edge)+style_.crown*smooth(.25,0,q.v)*edge;
    if(style_.sweep){const dx=(p.x-partX)/hx;t+=style_.sweep*smooth(.0,-.25,dx)*smooth(.42,.05,q.v)*edge*(q.f>-0.3?1:.5);
      if(dx>-.06&&dx<.06&&q.f>-.2&&q.v<.3)t*=.55;}
    if(style_.quiff)t+=style_.quiff*smooth(.1,.9,q.f)*smooth(.3,.08,q.v)*edge;
    out[i]={p:p.clone().addScaledVector(N[i],t+.0012),s:p.clone().addScaledVector(N[i],.0012)};}
  // clip every scalp triangle exactly at the hairline iso-line (D=0) so the edge is smooth, not saw-toothed
  const idx=g.index?g.index.array:[...Array(pos.count).keys()],verts=[],tris=[];
  const push=v=>{verts.push(v.x,v.y,v.z);return verts.length/3-1;};
  const cut=(i,j)=>{const t=D[i]/(D[i]-D[j]);return out[i].s.clone().lerp(out[j].s,t);};
  for(let k=0;k<idx.length;k+=3){const tri=[idx[k],idx[k+1],idx[k+2]];if(tri.some(i=>W[i]<.6))continue;const ins=tri.map(i=>D[i]>0);const n=ins.filter(Boolean).length;if(!n)continue;
    if(n===3){tris.push(...tri.map(i=>push(out[i].p)));continue;}
    const poly=[];for(let e=0;e<3;e++){const i=tri[e],j=tri[(e+1)%3];if(D[i]>0)poly.push(out[i].p);if((D[i]>0)!==(D[j]>0))poly.push(cut(i,j));}
    const ids=poly.map(push);for(let e=1;e+1<ids.length;e++)tris.push(ids[0],ids[e],ids[e+1]);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(tris);
  // A very short crop follows the skull; blend only the hairline into the selected skin.
  if(style==='C'){
    const hairColour=new T.Color(0x403b36),skinColour=new T.Color(SKINS[skin]||SKINS.medium),colours=[];
    for(let i=0;i<verts.length;i+=3){const p=new T.Vector3(verts[i],verts[i+1],verts[i+2]),q=info(p),coverage=smooth(0,.045,q.line-q.v);skinColour.clone().lerp(hairColour,coverage).toArray(colours,i);}
    geo.setAttribute('color',new T.Float32BufferAttribute(colours,3));
  }const geoM=mergeVertices(geo,2e-4);geoM.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({color:style==='C'?0xffffff:0x2a201b,vertexColors:style==='C',roughness:style==='C'?.96:.78,metalness:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
  const mesh=new T.Mesh(geoM,mat);mesh.castShadow=true;model.add(mesh);mesh.applyMatrix4(model.matrixWorld.clone().invert());head.attach(mesh);return mesh;
}
// recolour skin vertices (the plain colour and the non-highlighted parts of every muscle profile)
export function applySkin(meshes,skin){
  const hex=SKINS[skin];if(skin==='medium'||!hex)return;const from=new T.Color(0xbd8d73),to=new T.Color(hex),eq=(a,i)=>Math.abs(a[i]-from.r)<1e-4&&Math.abs(a[i+1]-from.g)<1e-4&&Math.abs(a[i+2]-from.b)<1e-4;
  for(const o of meshes){const arrs=[o.userData.plainColors,...Object.values(o.userData.muscleProfiles)];for(const a of arrs)for(let i=0;i<a.length;i+=3)if(eq(a,i)){a[i]=to.r;a[i+1]=to.g;a[i+2]=to.b;}}
}
