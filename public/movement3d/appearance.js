import * as T from './assets/three.module.js';
// Character customisation: skin tone, hair style, body type. Read from the app settings (same origin)
// or overridden with ?avatar=skin,hair,body (used for screenshots).
export const SKINS={light:0xe8bc9c,medium:0xbd8d73,tan:0x9a6a4c,deep:0x6a4530};
export function readAvatar(params){
  let s={};try{s=JSON.parse(localStorage.getItem('bwfit:data:v1')||'{}').settings||{};}catch{}
  const o=(params.get('avatar')||'').split(',');
  const skin=o[0]||s.skin,hair=o.length>1?o[1]:s.hair,body=o[2]||s.body;
  return {skin:SKINS[skin]?skin:'medium',hair:['','A','B','C'].includes(hair)?hair:'C',body:body==='female'?'female':'male'};
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
// hair: a cap mesh fitted to the head vertices, parented to the head bone (call in bind pose)
export function addHair(model,style){
  if(!style)return null;model.updateMatrixWorld(true);let head=null;const box=new T.Box3(),p=new T.Vector3();
  model.traverse(m=>{if(!m.isSkinnedMesh)return;const g=m.geometry,pos=g.attributes.position,bones=m.skeleton.bones;head=head||bones.find(b=>b.name==='head');
    for(let i=0;i<pos.count;i++)if(weightOf(g,bones,/^head$/,i)>.8){p.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);box.expandByPoint(p);}});
  if(!head||box.isEmpty())return null;
  const c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3()),top=box.max.y;
  const mat=new T.MeshStandardMaterial({color:0x2a201b,roughness:.85}),group=new T.Group();
  const rx=s.x*.45,rz=s.z*.5,ry=s.y*.36,cy=top-ry*.97;
  const cap=(theta,ex)=>{const m=new T.Mesh(new T.SphereGeometry(1,28,14,0,Math.PI*2,0,theta),mat);m.scale.set(rx*ex,ry*ex,rz*ex);m.position.set(c.x,cy,c.z-s.z*.03);m.rotation.x=-.5;m.castShadow=true;group.add(m);return m;};
  const blob=(x,y,z,sx,sy,sz,rotZ=0,rotX=0)=>{const m=new T.Mesh(new T.SphereGeometry(1,18,10),mat);m.scale.set(sx,sy,sz);m.position.set(c.x+x,cy+y,c.z+z);m.rotation.set(rotX,0,rotZ);m.castShadow=true;group.add(m);};
  if(style==='B'){cap(1.7,1.0);}
  else if(style==='A'){cap(1.7,1.0);blob(0,ry*.78,rz*.45,rx*.6,ry*.34,rz*.45,0,-.6);}
  else {cap(1.75,1.02);blob(rx*.2,ry*.8,rz*.25,rx*.8,ry*.3,rz*.8,-.3);}// C side sweep (default)
  head.attach(group);return group;
}
// recolour skin vertices (the plain colour and the non-highlighted parts of every muscle profile)
export function applySkin(meshes,skin){
  const hex=SKINS[skin];if(skin==='medium'||!hex)return;const from=new T.Color(0xbd8d73),to=new T.Color(hex),eq=(a,i)=>Math.abs(a[i]-from.r)<1e-4&&Math.abs(a[i+1]-from.g)<1e-4&&Math.abs(a[i+2]-from.b)<1e-4;
  for(const o of meshes){const arrs=[o.userData.plainColors,...Object.values(o.userData.muscleProfiles)];for(const a of arrs)for(let i=0;i<a.length;i+=3)if(eq(a,i)){a[i]=to.r;a[i+1]=to.g;a[i+2]=to.b;}}
}
