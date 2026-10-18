import * as T from './assets/three.module.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
export function depthAt(t){const smooth=x=>x*x*(3-2*x);if(t<.12)return 0;if(t<.55)return smooth((t-.12)/.43);if(t<.65)return 1;if(t<.94)return 1-smooth((t-.65)/.29);return 0;}
export function createNaturalRig(model){
  model.updateMatrixWorld(true);
  const aliases={pelvis:'Hips',spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck',head:'Head'};
  for(const [suffix,side] of [['l','Left'],['r','Right']])for(const [src,dst] of Object.entries({clavicle:'Shoulder',upperarm:'Arm',lowerarm:'ForeArm',hand:'Hand',middle_01:'HandMiddle1',thigh:'UpLeg',calf:'Leg',foot:'Foot',ball:'ToeBase'}))aliases[src+'_'+suffix]=side+dst;
  const bones={};model.traverse(o=>{if(o.isBone&&aliases[o.name])bones[aliases[o.name]]=o;});
  const headTip=new T.Bone();headTip.position.set(0,.12,0);bones.Head.add(headTip);bones.HeadTop_End=headTip;model.updateMatrixWorld(true);
  const rest=new Map();model.traverse(o=>{if(o.isBone)rest.set(o,{p:o.position.clone(),q:o.quaternion.clone(),wq:o.getWorldQuaternion(new T.Quaternion()),wp:o.getWorldPosition(V())});});
  const world=b=>b.getWorldPosition(V()),axis=(a,b)=>rest.get(bones[b]).wp.clone().sub(rest.get(bones[a]).wp).normalize();
  function rotateWorld(b,q){const parentQ=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parentQ.invert().multiply(q));b.updateMatrixWorld(true);}
  function aim(a,b,dir){const bone=bones[a],delta=new T.Quaternion().setFromUnitVectors(axis(a,b),dir.clone().normalize());rotateWorld(bone,delta.multiply(rest.get(bone).wq));}
  const feet=['Right','Left'].map((side,i)=>{const upper=bones[side+'UpLeg'],lower=bones[side+'Leg'],foot=bones[side+'Foot'];return {side,s:i===0?-1:1,upper,lower,foot,L1:world(upper).distanceTo(world(lower)),L2:world(lower).distanceTo(world(foot)),target:V(i===0?-.18:.18,world(foot).y,-.048),footQ:rest.get(foot).wq.clone()};});
  const hands=['Right','Left'].map((side,i)=>({side,s:i===0?-1:1,upper:bones[side+'Arm'],lower:bones[side+'ForeArm'],end:bones[side+'Hand'],L1:world(bones[side+'Arm']).distanceTo(world(bones[side+'ForeArm'])),L2:world(bones[side+'ForeArm']).distanceTo(world(bones[side+'Hand'])),target:V()}));
  let exercise='squat',flipped=false,highlighted=false,stanceWidth=.50;
  function solve(chain,C,pole,a,b,c){const A=world(chain.upper),d=C.clone().sub(A),D=d.length(),u=d.clone().normalize();const along=(chain.L1**2-chain.L2**2+D**2)/(2*D);const h=Math.sqrt(Math.max(0,chain.L1**2-along**2));const n=pole.clone().addScaledVector(u,-pole.dot(u)).normalize();const B=A.clone().addScaledVector(u,along).addScaledVector(n,h);aim(a,b,B.clone().sub(A));aim(b,c,C.clone().sub(world(chain.lower)));}
  function rootAt(p,up){const hips=bones.Hips;hips.position.copy(hips.parent.worldToLocal(p));rotateWorld(hips,new T.Quaternion().setFromUnitVectors(V(0,1,0),up.clone().normalize()).multiply(rest.get(hips).wq));model.updateMatrixWorld(true);}
  function torso(up,headUp=up){aim('Spine','Spine1',up);aim('Spine1','Spine2',up);aim('Spine2','Neck',up);aim('Neck','Head',headUp);aim('Head','HeadTop_End',headUp);}
  function standingArms(raise){for(const f of feet){aim(f.side+'Arm',f.side+'ForeArm',V(f.s*.12,-Math.cos(raise),Math.sin(raise)));aim(f.side+'ForeArm',f.side+'Hand',V(-f.s*.08,-Math.cos(raise+.32),Math.sin(raise+.32)));}}
  function pose(t){const q=depthAt(t);
    for(const [b,r] of rest){b.position.copy(r.p);b.quaternion.copy(r.q);}model.updateMatrixWorld(true);
    if(exercise==='pushup'){
      const up=V(0,lerp(.18,-.03,q),1).normalize();rootAt(V(0,lerp(.38,.24,q),0),up);const A=world(feet[0].upper),length=Math.min(...feet.map(f=>f.L1+f.L2))-.001,dy=A.y-.232,dx=A.x+.10;const rootZ=-1.21+Math.sqrt(length*length-dy*dy-dx*dx)-A.z;rootAt(V(0,lerp(.38,.24,q),rootZ),up);torso(up,up);
      for(const f of feet){f.target.set(f.s*.10,.232,-1.21);solve(f,f.target,V(0,-1,0),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(1,0,0),.92).multiply(f.footQ));}
      for(const h of hands){h.target.set(h.s*.275,.078,.245);solve(h,h.target,V(h.s,0,-.35),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');aim(h.side+'Hand',h.side+'HandMiddle1',V(0,0,1));}
    }else if(exercise==='lunge'){
      const tilt=.10+.09*q;rootAt(V(0,lerp(.81,.53,q),-.10),V(0,1,0));torso(V(0,Math.cos(tilt),Math.sin(tilt)),V(0,1,.02));
      for(const f of feet){const front=(f.s===-1)!==flipped;f.target.set(f.s*.12,front?.074:.174,front?.38:-.55);solve(f,f.target,V(0,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(1,0,0),front?0:.60).multiply(f.footQ));}standingArms(.45);
    }else if(exercise==='jack'){
      const open=.5-.5*Math.cos(2*Math.PI*t),hop=.095*Math.sin(Math.PI*(t%.5)/.5),footX=lerp(.11,.33,open),dx=footX-.09;
      rootAt(V(0,.074+hop+Math.sqrt((Math.min(...feet.map(f=>f.L1+f.L2))-.01)**2-dx*dx)+.005,-.015),V(0,1,0));torso(V(0,1,0));
      for(const f of feet){f.target.set(f.s*footX,.074+hop,-.048);solve(f,f.target,V(0,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,f.footQ);const a=lerp(.13,2.96,open);aim(f.side+'Arm',f.side+'ForeArm',V(f.s*Math.sin(a),-Math.cos(a),.03));aim(f.side+'ForeArm',f.side+'Hand',V(f.s*Math.sin(a+.08),-Math.cos(a+.08),.03));}
    }else{
      const hipLead=Math.sin(q*Math.PI)*.025,tilt=q*.43+hipLead;const f0=feet[0],hp=rest.get(f0.upper).wp,rootRest=rest.get(bones.Hips).wp,dx=stanceWidth/2-Math.abs(hp.x),dz=-.048-(-.055+hp.z-rootRest.z),startY=.074+Math.sqrt((f0.L1+f0.L2-.008)**2-dx*dx-dz*dz)-(hp.y-rootRest.y);rootAt(V(0,lerp(startY,.59,q),lerp(-.055,-.35,q)-hipLead),V(0,1,0));torso(V(0,Math.cos(tilt),Math.sin(tilt)),V(0,1,.08*q));
      for(const f of feet){f.target.set(f.s*stanceWidth/2,.074,-.048);solve(f,f.target,V(f.s*.20,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(0,1,0),f.s*.18).multiply(f.footQ));}const armQ=depthAt((t+.985)%1);standingArms(lerp(.18,1.38,armQ));
    }model.updateMatrixWorld(true);
  }
  const meshes=[];
  model.traverse(o=>{if(!o.isSkinnedMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;meshes.push(o);
    o.material=new T.MeshStandardMaterial({color:0xffffff,roughness:.83,metalness:0,vertexColors:true});
    const count=o.geometry.attributes.position.count,skinI=o.geometry.attributes.skinIndex,skinW=o.geometry.attributes.skinWeight;
    const plain=new Float32Array(count*3),profiles=Object.fromEntries(['squat','lunge','pushup','jack'].map(k=>[k,new Float32Array(count*3)]));
    const skin=new T.Color(0xbd8d73),primary=new T.Color(0xff4938),secondary=new T.Color(0xf6ad45);
    const axes=o.skeleton.bones.map(bone=>{const a=bone.getWorldPosition(V()),child=bone.children.find(c=>c.isBone),b=child?child.getWorldPosition(V()):a.clone().add(V(0,-.1,0)),v=b.sub(a);return {name:bone.name,a,v,lenSq:Math.max(v.lengthSq(),1e-8)};});
    const segment=(p,re)=>{let weight=0,z=0,x=0;for(let k=0;k<4;k++){const bw=skinW.array[p.i*4+k],bone=axes[skinI.array[p.i*4+k]];if(!bw||!re.test(bone?.name||''))continue;weight+=bw;const {a,v,lenSq}=bone,t=T.MathUtils.clamp(((p.point.x-a.x)*v.x+(p.point.y-a.y)*v.y+(p.point.z-a.z)*v.z)/lenSq,0,1);z+=(a.z+v.z*t)*bw;x+=(a.x+v.x*t)*bw;}return {weight,z:z/Math.max(weight,1e-8),x:x/Math.max(weight,1e-8)};};
    for(let i=0;i<count;i++){
      const p=o.getVertexPosition(i,V()).applyMatrix4(o.matrixWorld),sample={i,point:p},thigh=segment(sample,/^thigh_/),calf=segment(sample,/^calf_/),arm=segment(sample,/^upperarm_/);
      const quads=thigh.weight>.48&&p.y>.53&&p.y<.96&&p.z>thigh.z+.012;
      const hamstrings=thigh.weight>.48&&p.y>.56&&p.y<.92&&p.z<thigh.z-.012;
      const glutes=p.y>.83&&p.y<1.05&&Math.abs(p.x)<.22&&p.z<-.045;
      const calves=calf.weight>.5&&p.y>.14&&p.y<.48&&p.z<calf.z+.015;
      const adductors=thigh.weight>.48&&p.y>.59&&p.y<.9&&Math.abs(p.x)<Math.abs(thigh.x)-.025;
      const chest=p.y>1.26&&p.y<1.46&&Math.abs(p.x)<.19&&p.z>.035;
      const delts=['Left','Right'].some(side=>p.distanceTo(rest.get(bones[side+'Arm']).wp)<.115);
      const frontDelts=delts&&p.z>.015;
      const triceps=arm.weight>.5&&!delts&&p.z<arm.z-.008;
      const abs=p.y>1.04&&p.y<1.26&&Math.abs(p.x)<.135&&p.z>.035;
      const tests={squat:[quads||glutes,hamstrings],lunge:[quads||glutes,hamstrings||calves],pushup:[chest||triceps||frontDelts,abs],jack:[delts||calves,quads||adductors]};
      skin.toArray(plain,i*3);for(const [name,[main,assist]] of Object.entries(tests))(main?primary:assist?secondary:skin).toArray(profiles[name],i*3);
    }
    o.userData.muscleProfiles=profiles;o.userData.plainColors=plain;o.geometry.setAttribute('color',new T.BufferAttribute(plain.slice(),3));
  });
  return {pose,feet,hands,meshes,setStance(width){stanceWidth=T.MathUtils.clamp(width,.42,.58);},setExercise(name){exercise=name;flipped=false;this.setHighlight(highlighted);},flipSide(){flipped=!flipped;return flipped;},setHighlight(on){highlighted=on;meshes.forEach(o=>{o.geometry.attributes.color.array.set(on?o.userData.muscleProfiles[exercise]:o.userData.plainColors);o.geometry.attributes.color.needsUpdate=true;});},setWireframe(on){meshes.forEach(o=>o.material.wireframe=on);}};
}
