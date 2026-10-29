import * as T from './assets/three.module.js';
import {MOTIONS,createMotion} from './motion-library.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
// Controlled lowering (~45% of the rep), a short pause at the bottom, a quicker drive up and a settle at the top.
export function depthAt(t){const smooth=x=>x*x*x*(x*(x*6-15)+10);if(t<.08)return 0;if(t<.56)return smooth((t-.08)/.48);if(t<.64)return 1;if(t<.93)return 1-smooth((t-.64)/.29);return 0;}
export function createNaturalRig(model){
  model.updateMatrixWorld(true);
  const aliases={pelvis:'Hips',spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck',head:'Head'};
  for(const [suffix,side] of [['l','Left'],['r','Right']])for(const [src,dst] of Object.entries({clavicle:'Shoulder',upperarm:'Arm',lowerarm:'ForeArm',hand:'Hand',middle_01:'HandMiddle1',thumb_01:'HandThumb1',thumb_02:'HandThumb2',thumb_03:'HandThumb3',thigh:'UpLeg',calf:'Leg',foot:'Foot',ball:'ToeBase'}))aliases[src+'_'+suffix]=side+dst;
  const bones={};model.traverse(o=>{if(o.isBone&&aliases[o.name])bones[aliases[o.name]]=o;});
  const headTip=new T.Bone();headTip.position.set(0,.12,0);bones.Head.add(headTip);bones.HeadTop_End=headTip;model.updateMatrixWorld(true);
  const rest=new Map();model.traverse(o=>{if(o.isBone)rest.set(o,{p:o.position.clone(),q:o.quaternion.clone(),wq:o.getWorldQuaternion(new T.Quaternion()),wp:o.getWorldPosition(V())});});
  const world=b=>b.getWorldPosition(V()),axis=(a,b)=>rest.get(bones[b]).wp.clone().sub(rest.get(bones[a]).wp).normalize();
  function rotateWorld(b,q){const parentQ=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parentQ.invert().multiply(q));b.updateMatrixWorld(true);}
  function aim(a,b,dir){const bone=bones[a],delta=new T.Quaternion().setFromUnitVectors(axis(a,b),dir.clone().normalize());rotateWorld(bone,delta.multiply(rest.get(bone).wq));}
  function aimInFrame(a,b,dir,frame){
    const from=axis(a,b).applyQuaternion(frame),swing=new T.Quaternion().setFromUnitVectors(from,dir.clone().normalize());
    rotateWorld(bones[a],swing.multiply(frame.clone()).multiply(rest.get(bones[a]).wq));
  }
  const feet=['Right','Left'].map((side,i)=>{const upper=bones[side+'UpLeg'],lower=bones[side+'Leg'],foot=bones[side+'Foot'];return {side,s:i===0?-1:1,upper,lower,foot,L1:world(upper).distanceTo(world(lower)),L2:world(lower).distanceTo(world(foot)),target:V(i===0?-.18:.18,world(foot).y,-.048),footQ:rest.get(foot).wq.clone()};});
  const hands=['Right','Left'].map((side,i)=>({side,s:i===0?-1:1,upper:bones[side+'Arm'],lower:bones[side+'ForeArm'],end:bones[side+'Hand'],L1:world(bones[side+'Arm']).distanceTo(world(bones[side+'ForeArm'])),L2:world(bones[side+'ForeArm']).distanceTo(world(bones[side+'Hand'])),target:V()}));
  const handNormals={};
  for(const h of hands){
    const suffix=h.side==='Left'?'_l':'_r',index=[...rest.keys()].find(b=>b.name==='index_01'+suffix),pinky=[...rest.keys()].find(b=>b.name==='pinky_01'+suffix);
    const width=rest.get(index).wp.clone().sub(rest.get(pinky).wp),normal=width.cross(axis(h.side+'Hand',h.side+'HandMiddle1')).normalize();
    if(normal.dot(V(-h.s,0,0))<0)normal.negate();handNormals[h.side]=normal;
  }
  let faultAmt=0,faultRe=null,exercise='squat',flipped=false,highlighted=false,stanceWidth=.50;const motionCache=new Map(),handGuideCache=new Map();
  function solve(chain,C,pole,a,b,c){const A=world(chain.upper),d=C.clone().sub(A),D=T.MathUtils.clamp(d.length(),Math.abs(chain.L1-chain.L2)+.0001,chain.L1+chain.L2-.0001),u=d.clone().normalize();const along=(chain.L1**2-chain.L2**2+D**2)/(2*D);const h=Math.sqrt(Math.max(0,chain.L1**2-along**2));const n=pole.clone().addScaledVector(u,-pole.dot(u)).normalize();const B=A.clone().addScaledVector(u,along).addScaledVector(n,h);aim(a,b,B.clone().sub(A));aim(b,c,A.clone().addScaledVector(u,D).sub(world(chain.lower)));}
  function rootAt(p,up){const hips=bones.Hips;hips.position.copy(hips.parent.worldToLocal(p.clone()));rotateWorld(hips,new T.Quaternion().setFromUnitVectors(V(0,1,0),up.clone().normalize()).multiply(rest.get(hips).wq));model.updateMatrixWorld(true);}
  function torso(up,headUp=up){aim('Spine','Spine1',up);aim('Spine1','Spine2',up);aim('Spine2','Neck',up);aim('Neck','Head',headUp);aim('Head','HeadTop_End',headUp);}
  function crossedChestArms(up){
    const forward=V(1,0,0).cross(up).normalize(),chest=world(bones.Spine2);
    for(const h of hands){
      const target=chest.clone().addScaledVector(up,.170+(h.s>0?.015:0)).addScaledVector(forward,h.s>0?.210:.145).add(V(-h.s*.110,0,0));
      solve(h,target,V(h.s,0,0).addScaledVector(up,-.65).addScaledVector(forward,.12),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      // Constrain both finger direction AND palm normal in the chest frame.
      // A single-vector aim leaves wrist roll undetermined as the torso curls.
      const finger=V(-h.s*.55,0,0).addScaledVector(up,.83).normalize();
      const palm=forward.clone().negate();palm.addScaledVector(finger,-palm.dot(finger)).normalize();
      orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);
    }
  }
  function orientSegment(a,b,dir,palm){
    const finger=dir.clone().normalize(),normal=palm.clone().addScaledVector(finger,-palm.dot(finger)).normalize();
    const restAxis=axis(a,b),restNormal=handNormals[a.startsWith('Left')?'Left':'Right'].clone();restNormal.addScaledVector(restAxis,-restNormal.dot(restAxis)).normalize();
    const basis=(f,n)=>new T.Matrix4().makeBasis(f,n,f.clone().cross(n).normalize());
    const delta=new T.Quaternion().setFromRotationMatrix(basis(finger,normal).multiply(basis(restAxis,restNormal).invert()));
    rotateWorld(bones[a],delta.multiply(rest.get(bones[a]).wq));
  }
  function stepTouchClap(t,up){
    const clap=.5+.5*Math.cos(4*Math.PI*t),forward=V(0,0,1),right=up.clone().cross(forward).normalize(),chest=world(bones.Spine2);
    for(const h of hands){
      h.target.copy(chest).addScaledVector(right,h.s*lerp(.40,.052,clap)).addScaledVector(up,lerp(.045,.17,clap)).addScaledVector(forward,lerp(.16,.32,clap));
      solve(h,h.target,right.clone().multiplyScalar(h.s*.15).addScaledVector(up,-1),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const forearm=world(h.end).sub(world(h.lower)).normalize(),palm=right.clone().multiplyScalar(-h.s);
      // Forearm roll follows the palm; wrist flexion eases into upright palms.
      orientSegment(h.side+'ForeArm',h.side+'Hand',forearm,palm);
      const finger=forearm.clone().addScaledVector(right,-forearm.dot(right)*clap).normalize();
      orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);
      // Tuck the open-model thumbs along the palm, outside the contact gap.
      orientSegment(h.side+'HandThumb1',h.side+'HandThumb2',finger.clone().addScaledVector(forward,-.45),palm);
      orientSegment(h.side+'HandThumb2',h.side+'HandThumb3',finger.clone().addScaledVector(forward,-.15),palm);
    }
  }
  function closeFist(h,palm,amount=1){
    const suffix=h.side==='Left'?'_l':'_r';
    for(const [b,r] of rest)if(/^(index|middle|ring|pinky)_/.test(b.name)&&b.name.endsWith(suffix))b.quaternion.copy(r.q);
    model.updateMatrixWorld(true);
    for(const name of ['index','middle','ring','pinky']){
      const joints=[1,2,3].map(i=>[...rest.keys()].find(b=>b.name===name+'_0'+i+suffix));
      const direction=world(joints[1]).sub(world(joints[0])).normalize(),hinge=direction.cross(palm).normalize();
      for(let i=0;i<3;i++){const b=joints[i];rotateWorld(b,new T.Quaternion().setFromAxisAngle(hinge,[1.05,1.45,.85][i]*amount).multiply(b.getWorldQuaternion(new T.Quaternion())));}
    }
    const index=[...rest.keys()].find(b=>b.name==='index_02'+suffix),thumb=bones[h.side+'HandThumb1'];
    const target=world(index).addScaledVector(palm,.012);
    orientSegment(h.side+'HandThumb1',h.side+'HandThumb2',target.sub(world(thumb)),palm);
    const tip=[...rest.keys()].find(b=>b.name==='index_03'+suffix);
    orientSegment(h.side+'HandThumb2',h.side+'HandThumb3',world(tip).addScaledVector(palm,.018).sub(world(bones[h.side+'HandThumb2'])),palm);
  }
  function straightPunch(t,up,headUp){
    const phase=(t*2)%1,smooth=x=>x*x*(3-2*x),extension=phase<.10?0:phase<.38?smooth((phase-.10)/.28):phase<.45?1:phase<.78?1-smooth((phase-.45)/.33):0;
    const active=t<.5?'Left':'Right',sign=active==='Left'?1:-1;
    const chest=bones.Spine2,twist=new T.Quaternion().setFromAxisAngle(up,-sign*extension*.25);
    rotateWorld(chest,twist.multiply(chest.getWorldQuaternion(new T.Quaternion())));
    aim('Neck','Head',headUp);aim('Head','HeadTop_End',headUp);
    const head=world(bones.Head);
    for(const h of hands){
      const e=h.side===active?extension:0,guard=head.clone().add(V(h.s*.14,-.10,.16)),end=guard.clone();end.x=head.x+h.s*.115;
      const shoulder=world(h.upper),reach=h.L1+h.L2-.008,dx=end.x-shoulder.x,dy=end.y-shoulder.y;
      end.z=shoulder.z+Math.sqrt(Math.max(.01,reach*reach-dx*dx-dy*dy));
      h.target.copy(guard).lerp(end,e);
      solve(h,h.target,V(h.s*.20,-1,-.10),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const forearm=world(h.end).sub(world(h.lower)).normalize(),palm=V(-h.s,0,0).lerp(up.clone().negate(),e).normalize();
      orientSegment(h.side+'ForeArm',h.side+'Hand',forearm,palm);
      orientSegment(h.side+'Hand',h.side+'HandMiddle1',forearm,palm);
      closeFist(h,palm);
    }
  }
  function uppercut(t,up,headUp){
    const phase=(t*2)%1,smooth=x=>x*x*(3-2*x),active=t<.5?'Left':'Right',sign=active==='Left'?1:-1;
    const load=phase<.22?smooth(phase/.22):phase<.50?1:phase<.78?1-smooth((phase-.50)/.28):0;
    const strike=phase<.22?0:phase<.50?smooth((phase-.22)/.28):phase<.78?1-smooth((phase-.50)/.28):0;
    const chest=bones.Spine2;rotateWorld(chest,new T.Quaternion().setFromAxisAngle(up,-sign*strike*.25).multiply(chest.getWorldQuaternion(new T.Quaternion())));
    aim('Neck','Head',headUp);aim('Head','HeadTop_End',headUp);const head=world(bones.Head);
    for(const h of hands){
      const on=h.side===active,L=on?load:0,S=on?strike:0;
      h.target.copy(head).add(V(h.s*lerp(.14,.11,S),-.10-.33*L+.36*S,.16+.06*L+.17*S));
      solve(h,h.target,V(h.s*.16,-1,-.15),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const fore=world(h.end).sub(world(h.lower)).normalize(),palm=V(-h.s,0,0).lerp(V(0,0,-1),S).normalize();
      orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,palm);closeFist(h,palm);
    }
  }
  function resetDigits(h){for(const [b,r] of rest)if(/^(thumb|index|middle|ring|pinky)_/.test(b.name)&&b.name.endsWith(h.side==='Left'?'_l':'_r'))b.quaternion.copy(r.q);model.updateMatrixWorld(true);}
  // A held chest gesture needs its own targets; neutral wrist alignment alone
  // turns the old projected clasp into two forward-facing open palms.
  function chestHandsTogether(up){
    const forward=V(0,0,1),right=up.clone().cross(forward).normalize(),chest=world(bones.Spine2);
    for(const h of hands){
      h.target.copy(chest).addScaledVector(up,.17).addScaledVector(forward,.27).addScaledVector(right,h.s*.058);
      solve(h,h.target,right.clone().multiplyScalar(h.s*.15).addScaledVector(up,-1),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const fore=world(h.end).sub(world(h.lower)).normalize(),palm=right.clone().multiplyScalar(-h.s),finger=fore.clone().addScaledVector(right,-fore.dot(right)).normalize();
      orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);
      relaxDigits(h,palm,.10);
    }
  }
  function relaxDigits(h,palm,amount=.18){
    resetDigits(h);const suffix=h.side==='Left'?'_l':'_r';
    for(const name of ['index','middle','ring','pinky']){
      const joints=[1,2,3].map(i=>[...rest.keys()].find(b=>b.name===name+'_0'+i+suffix));
      const hinge=world(joints[1]).sub(world(joints[0])).normalize().cross(palm).normalize();
      for(let i=0;i<3;i++)rotateWorld(joints[i],new T.Quaternion().setFromAxisAngle(hinge,[.7,1,.6][i]*amount).multiply(joints[i].getWorldQuaternion(new T.Quaternion())));
    }
    const finger=world(bones[h.side+'HandMiddle1']).sub(world(h.end)).normalize();
    orientSegment(h.side+'HandThumb1',h.side+'HandThumb2',finger.clone().addScaledVector(palm,.25),palm);
    orientSegment(h.side+'HandThumb2',h.side+'HandThumb3',finger,palm);
  }
  function handsBesideHead(){
    const frame=bones.Head.getWorldQuaternion(new T.Quaternion()).multiply(rest.get(bones.Head).wq.clone().invert());
    const right=V(1,0,0).applyQuaternion(frame),up=V(0,1,0).applyQuaternion(frame),forward=V(0,0,1).applyQuaternion(frame);
    for(const h of hands){
      h.target.copy(world(bones.Head)).addScaledVector(right,h.s*.14).addScaledVector(up,.005).addScaledVector(forward,.015);
      solve(h,h.target,right.clone().multiplyScalar(h.s*.45).addScaledVector(forward,.9).addScaledVector(up,-.15),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const fore=world(h.end).sub(world(h.lower)).normalize(),finger=fore.clone().addScaledVector(right,-fore.dot(right)).normalize(),palm=right.clone().multiplyScalar(-h.s);
      orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);resetDigits(h);
    }
  }
  function kickClap(t){
    const clap=Math.sin(2*Math.PI*t)**2,center=world(hands[0].end).add(world(hands[1].end)).multiplyScalar(.5);center.y+=.13*clap;
    center.x=lerp(center.x,world(feet[t<.5?1:0].foot).x,clap);
    for(const h of hands){
      h.target.copy(center).add(V(h.s*lerp(.28,.052,clap),0,0));solve(h,h.target,V(h.s*.25,-1,0),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
      const fore=world(h.end).sub(world(h.lower)).normalize(),palm=V(-h.s,0,0),finger=fore.clone();finger.x*=1-clap;finger.normalize();
      orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);resetDigits(h);
      orientSegment(h.side+'HandThumb1',h.side+'HandThumb2',finger.clone().add(V(0,0,-.45)),palm);orientSegment(h.side+'HandThumb2',h.side+'HandThumb3',finger.clone().add(V(0,0,-.15)),palm);
    }
  }
  // Both hands on one dumbbell: goblet at the chest, triceps extension overhead, bridge on the hip bones.
  function sharedGrip(){
    if(exercise==='dbgoblet'){
      const chest=world(bones.Spine2),up=world(bones.Neck).sub(chest).normalize(),forward=V(1,0,0).cross(up).normalize();
      for(const h of hands){
        h.target.copy(chest).addScaledVector(up,.155).addScaledVector(forward,.25).add(V(h.s*.085,0,0));
        solve(h,h.target,V(h.s*.65,-1,.12),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
        const fore=world(h.end).sub(world(h.lower)).normalize(),palm=V(-h.s*.45,.8,.2).normalize();
        orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,palm);closeFist(h,palm,.55);
      }
      return;
    }
    const mid=exercise==='dbbridge'?world(bones.Hips).add(V(0,.15,0)):world(hands[0].end).add(world(hands[1].end)).multiplyScalar(.5);
    for(const h of hands){
      h.target.copy(mid).add(V(h.s*.045,0,0));solve(h,h.target,V(-h.s*.35,-1,exercise==='dbtricep'?.35:-.35),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
    }
    const finger=hands.reduce((v,h)=>v.add(world(h.end).sub(world(h.lower)).normalize()),V());finger.x=0;finger.normalize();
    const palm=finger.clone().cross(V(1,0,0)).normalize();
    for(const h of hands){const fore=world(h.end).sub(world(h.lower)).normalize();orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);closeFist(h,palm);}
  }
  function getSharedGrip(){
    if(!['dbgoblet','dbtricep','dbbridge'].includes(exercise))return null;
    if(exercise==='dbgoblet'){
      const contacts=hands.map(h=>{const wrist=world(h.end),finger=world(bones[h.side+'HandMiddle1']).sub(wrist).normalize();return wrist.addScaledVector(finger,.08);});
      return {center:contacts[0].clone().add(contacts[1]).multiplyScalar(.5).add(V(0,-.074,0)),contacts,axis:V(0,1,0),cup:true};
    }
    const centers=hands.map(h=>{const wrist=world(h.end),finger=world(bones[h.side+'HandMiddle1']).sub(wrist).normalize(),palm=finger.clone().cross(V(1,0,0)).normalize();return wrist.addScaledVector(finger,.09).addScaledVector(palm,.015);});
    return {center:centers[0].clone().add(centers[1]).multiplyScalar(.5),contacts:centers,axis:V(1,0,0)};
  }

  // One guide per complete cycle avoids a roll flip near an aim-axis singularity.
  function handGuides(){
    if(handGuideCache.has(exercise))return handGuideCache.get(exercise);
    const motion=motionCache.get(exercise),guides={};
    for(const h of hands){
      const dirs=[];let front=true;
      for(let i=0;i<64;i++){const f=motion.at(i/64),l=f['arm'+(h.side==='Left'?'N':'F')],xy=[l.end[0]-l.mid[0],l.end[1]-l.mid[1]];front=f.front;let z=l.ze-l.zm;if(front&&Math.abs(z)<1e-6&&l.fs<.99)z=Math.sqrt(Math.max(0,16**2-xy[0]**2-xy[1]**2));dirs.push(direction(f,xy,z).normalize());}
      const preferred=front?V(0,0,1):V(-h.s,0,0);let best,score=Infinity;
      for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1]){if(!x&&!y&&!z)continue;const n=V(x,y,z).normalize(),cost=Math.max(...dirs.map(d=>Math.abs(d.dot(n))))+.03*(1-n.dot(preferred));if(cost<score){score=cost;best=n;}}
      guides[h.side]=best;
    }
    handGuideCache.set(exercise,guides);return guides;
  }
  function finishHands(f,t){
    if(['punch','uppercut','steptouch','crunch','situp'].includes(exercise))return;
    if(['bicycle','sidecrunch'].includes(exercise)){handsBesideHead();return;}
    if(exercise==='kickclap'){kickClap(t);return;}
    if(exercise==='sidelunge'){chestHandsTogether(direction(f,f.axis));return;}
    if(['dbgoblet','dbtricep','dbbridge'].includes(exercise)){sharedGrip();return;}
    if(exercise==='dbrenegade'){
      for(const h of hands){
        const target=world(h.end),support=1-T.MathUtils.smoothstep(target.y,.15,.35);target.y+=.19*support;
        solve(h,target,V(h.s*.35,0,-1),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');
        const fore=world(h.end).sub(world(h.lower)).normalize(),palm=V(-h.s,0,0),finger=fore.clone();
        orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',finger,palm);closeFist(h,palm);
      }
      return;
    }
    for(const h of hands){
      const l=f['arm'+(h.side==='Left'?'N':'F')],fore=world(h.end).sub(world(h.lower)).normalize();resetDigits(h);
      const contact=l.hand==='flat'?T.MathUtils.smoothstep(.36-world(h.end).y,0,.20):0;
      if(contact>0||exercise==='dips'){
        const palm=handGuides()[h.side];orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,palm);
        const neutral=h.end.getWorldQuaternion(new T.Quaternion());orientSegment(h.side+'Hand',h.side+'HandMiddle1',V(0,0,1),V(0,-1,0));
        const flat=h.end.getWorldQuaternion(new T.Quaternion());rotateWorld(h.end,neutral.slerp(flat,exercise==='dips'?1:contact));
      }else if(exercise==='pullup'){
        orientSegment(h.side+'ForeArm',h.side+'Hand',fore,V(0,0,1));orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,V(0,0,1));closeFist(h,V(0,0,1),.75);
      }else{
        const hipHand=exercise==='sideleg';
        const palm=hipHand?V(-h.s,0,0):l.hand==='fist'?V(-h.s,0,.15).normalize():handGuides()[h.side];
        orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,palm);
        if(l.hand==='fist')closeFist(h,palm);else if(l.hand==='relax')relaxDigits(h,palm);
      }
    }
  }
  function standingArms(raise){for(const f of feet){aim(f.side+'Arm',f.side+'ForeArm',V(f.s*.12,-Math.cos(raise),Math.sin(raise)));aim(f.side+'ForeArm',f.side+'Hand',V(-f.s*.08,-Math.cos(raise+.32),Math.sin(raise+.32)));}}
  const floorSamples=[],sampleDirections=[];for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1])if(x||y||z)sampleDirections.push([x,y,z]);
  model.traverse(m=>{if(!m.isSkinnedMesh)return;const buckets=new Map(),pos=m.geometry.attributes.position,weights=m.geometry.attributes.skinWeight,indices=m.geometry.attributes.skinIndex;for(let i=0;i<pos.count;i++){let joint=indices.array[i*4],highest=weights.array[i*4];for(let k=1;k<4;k++)if(weights.array[i*4+k]>highest){highest=weights.array[i*4+k];joint=indices.array[i*4+k];}const p=V().fromBufferAttribute(pos,i);let bucket=buckets.get(joint);if(!bucket){bucket=Array(26).fill(null);buckets.set(joint,bucket);}for(let k=0;k<26;k++){const d=sampleDirections[k],score=p.x*d[0]+p.y*d[1]+p.z*d[2];if(!bucket[k]||score>bucket[k].score)bucket[k]={i,score};}}floorSamples.push({mesh:m,indices:[...new Set([...buckets.values()].flat().filter(Boolean).map(x=>x.i))]});});
  function raiseAboveFloor(root,up){let min=Infinity;for(const {mesh,indices} of floorSamples)for(const i of indices)min=Math.min(min,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);if(min<.001){root.y+=.001-min;rootAt(root,up);}return root;}
  const pointScale=.017,rad=Math.PI/180;
  function direction(f,xy,z=0){return f.front?V(xy[0],-xy[1],z):V(0,-xy[1],xy[0]);}
  function retarget(t){
    if(!motionCache.has(exercise))motionCache.set(exercise,createMotion(exercise));
    const f=motionCache.get(exercise).at(t),up=direction(f,f.axis),headUp=direction(f,[Math.sin(f.headA*rad),Math.cos(f.headA*rad)]);
    const root=f.front?V((f.p[0]-100)*pointScale,(128-f.p[1])*pointScale,0):V(0,(128-f.p[1])*pointScale,(f.p[0]-100)*pointScale);
    if(exercise==='pullup')root.y=1.08+(root.y-.9486)*.60;
    rootAt(root,up);torso(up,headUp);
    const pelvisFrame=bones.Hips.getWorldQuaternion(new T.Quaternion()).multiply(rest.get(bones.Hips).wq.clone().invert());
    for(const [name,side] of [['N','Left'],['F','Right']])for(const [kind,a,b,c,source1,source2] of [['arm','Arm','ForeArm','Hand',20,16],['leg','UpLeg','Leg','Foot',26.5,26]]){
      const l=f[kind+name],u=[l.mid[0]-l.root[0],l.mid[1]-l.root[1]],v=[l.end[0]-l.mid[0],l.end[1]-l.mid[1]];
      let zm=l.zm,ze=l.ze-l.zm;
      if(f.front){if(Math.abs(zm)<1e-6&&l.fu<.99)zm=Math.sqrt(Math.max(0,source1**2-u[0]**2-u[1]**2));if(Math.abs(ze)<1e-6&&l.fs<.99)ze=Math.sqrt(Math.max(0,source2**2-v[0]**2-v[1]**2));}
      if(exercise==='bicycle'&&kind==='leg'){
        // Keep the leg's roll relative to the lying pelvis. A world-space
        // shortest-arc aim can turn the thigh inside out when knees lift.
        aimInFrame(side+a,side+b,direction(f,u,zm),pelvisFrame);aimInFrame(side+b,side+c,direction(f,v,ze),pelvisFrame);
      }else{aim(side+a,side+b,direction(f,u,zm));aim(side+b,side+c,direction(f,v,ze));}
      if(kind==='leg'){
        const chain=feet.find(x=>x.side===side);chain.target.copy(world(chain.foot));
        const angle=f.front?l.toe*.85:T.MathUtils.clamp((90-l.ea)*rad,-1.2,1.3);
        rotateWorld(chain.foot,new T.Quaternion().setFromAxisAngle(V(1,0,0),angle).multiply(chain.footQ));
      }else{
        const finger=direction(f,[Math.sin(l.ea*rad)*l.fc,Math.cos(l.ea*rad)],f.front?.15:0);aim(side+'Hand',side+'HandMiddle1',finger);
      }
    }
    if(exercise==='crunch'||exercise==='situp')crossedChestArms(up);
    if(exercise==='steptouch')stepTouchClap(t,up);
    if(exercise==='punch')straightPunch(t,up,headUp);
    if(exercise==='uppercut')uppercut(t,up,headUp);
    // Keep the full skin above the floor, then restore planted support targets.
    raiseAboveFloor(root,up);
    for(const foot of feet){const l=f['leg'+(foot.side==='Left'?'N':'F')],height=(128-l.end[1])*pointScale;const planted=height<.13||(height<.25&&l.ea<65&&l.ea>0);if(!planted)continue;
      const toe=f.front?l.toe:T.MathUtils.clamp((90-l.ea)/75,0,1),ankleY=.074+.145*toe;
      const target=f.front?V((l.end[0]-100)*pointScale+foot.s*.035*f.pFwd[0],ankleY,l.ze*pointScale):V(foot.s*.12,ankleY,(l.end[0]-100)*pointScale);
      const pole=direction(f,[l.mid[0]-l.root[0],l.mid[1]-l.root[1]],l.zm).normalize();solve(foot,target,pole,foot.side+'UpLeg',foot.side+'Leg',foot.side+'Foot');foot.target.copy(target);
    }
    if(exercise==='dips'){
      root.y-=.045;rootAt(root,up);
      for(const foot of feet){solve(foot,foot.target,V(0,0,1),foot.side+'UpLeg',foot.side+'Leg',foot.side+'Foot');rotateWorld(foot.foot,foot.footQ);}
    }
    for(const h of hands){const l=f['arm'+(h.side==='Left'?'N':'F')],height=(128-l.end[1])*pointScale;if(height>.065||MOTIONS[exercise].prop)continue;h.target.copy(f.front?V((l.end[0]-100)*pointScale,.078,l.ze*pointScale):V(h.s*.24,.078,(l.end[0]-100)*pointScale));solve(h,h.target,V(h.s*.45,0,-1),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');orientSegment(h.side+'Hand',h.side+'HandMiddle1',V(0,0,1),V(0,-1,0));}
    if(exercise==='pullup'||exercise==='dips'){
      for(const h of hands){const l=f['arm'+(h.side==='Left'?'N':'F')];h.target.copy(f.front?V((l.end[0]-100)*pointScale,(128-l.end[1])*pointScale,0):V(h.s*.21,(128-l.end[1])*pointScale+.025,(l.end[0]-100)*pointScale));if(exercise==='pullup'){h.target.y-=.065;h.target.z=-.025;}else{h.target.z=-.49;}solve(h,h.target,exercise==='pullup'?V(h.s,0,-.3):V(h.s*.2,0,-1),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');}
    }
    finishHands(f,t);model.updateMatrixWorld(true);raiseAboveFloor(root,up);model.updateMatrixWorld(true);
  }
  function pose(t){const q=depthAt(t);
    for(const [b,r] of rest){b.position.copy(r.p);b.quaternion.copy(r.q);}model.updateMatrixWorld(true);
    if(!['squat','pushup','lunge','jack','armcircle','kickclap'].includes(exercise)){retarget(t);applyFault();secondaryHead(t);model.updateMatrixWorld(true);return;}
    if(exercise==='armcircle'){
      // A moderate cone around the outstretched arm, with independent shoulder motion.
      // The neck, chest and pelvis do not inherit the old projected shrug/bob.
      const phase=2*Math.PI*t,c=Math.cos(phase),sn=Math.sin(phase),up=V(0,1,0);
      const f0=feet[0],hp=rest.get(f0.upper).wp,rootRest=rest.get(bones.Hips).wp,dx=.18-Math.abs(hp.x),dz=-.048-(hp.z-rootRest.z);
      const y=.074+Math.sqrt((f0.L1+f0.L2-.022)**2-dx*dx-dz*dz)-(hp.y-rootRest.y);// knees unlocked, not braced straight
      rootAt(V(0,y,0),up);torso(up);
      for(const f of feet){
        f.target.set(f.s*.18,.074,-.048);solve(f,f.target,V(f.s*.12,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,f.footQ);
        // Only a small scapular contribution; never rotate the spine or neck.
        const shoulder=bones[f.side+'Shoulder'];rotateWorld(shoulder,new T.Quaternion().setFromAxisAngle(V(0,0,1),f.s*.025*c).multiply(rest.get(shoulder).wq));
        aim(f.side+'Arm',f.side+'ForeArm',V(f.s*Math.sqrt(1-.42**2),.42*c,.42*sn));
        const fore=V(f.s*Math.sqrt(1-.50**2),.50*c-.045,.50*sn);
        aim(f.side+'ForeArm',f.side+'Hand',fore);aim(f.side+'Hand',f.side+'HandMiddle1',fore);
      }
      model.updateMatrixWorld(true);raiseAboveFloor(V(0,y,0),up);
    }else if(exercise==='kickclap'){
      // One kick per half loop. Weight shifts over the bent standing leg first, the kicking leg
      // swings almost straight from the hip to waist height, the trunk curls slightly forward, and the
      // arms sweep down from overhead so the hands clap under the thigh exactly at the kick peak.
      const ss=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
      const h=(t%.5)/.5,kickSide=(t<.5)!==flipped?-1:1;
      const prof=x=>x<.40?ss((x-.06)/.34):x<.52?1:ss(1-(x-.52)/.38);// up, brief peak hold, controlled lowering
      const k=prof(h),ka=h<.44?ss(h/.44):h<.52?1:ss(1-(h-.52)/.48);// arms use the whole half loop so the sweep stays smooth// arms trail slightly so the clap lands on the peak
      const shift=Math.sin(Math.PI*h),f0=feet[0],hp=rest.get(f0.upper).wp,rootRest=rest.get(bones.Hips).wp;
      const stance=.115,dx=stance-Math.abs(hp.x),dz=-.048-(hp.z-rootRest.z);
      const y0=.074+Math.sqrt((f0.L1+f0.L2-.008)**2-dx*dx-dz*dz)-(hp.y-rootRest.y);
      const lean=.26*ka,up=V(-kickSide*.035*shift,Math.cos(lean),Math.sin(lean)).normalize();// small crunch toward the knee so the hands can reach under it
      const root=V(-kickSide*.040*shift,y0-.022*shift-.018*k,-.01*k);rootAt(root,up);torso(up,V(0,1,.12*ka).normalize());
      for(const f of feet){
        const G=V(f.s*stance,.074,-.048);
        if(f.s!==kickSide){f.target.copy(G);solve(f,f.target,V(f.s*.15,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,f.footQ);continue;}// standing foot flat and straight
        const H=world(f.upper),Lm=f.L1+f.L2,th=1.30*k,reach=Lm*(.985-.07*Math.sin(Math.PI*k));
        const K=H.clone().add(V(f.s*.02*k,-Math.cos(th)*reach,Math.sin(th)*reach));
        const lift=ss(k*4);f.target.copy(G).lerp(K,lift);f.target.y=Math.max(f.target.y,.074);
        solve(f,f.target,V(0,.15,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');
        // Ankle follows the shin (rest foot-to-shin angle kept), relaxing into ~12° of plantarflexion at the top;
        // blended from the flat floor pose as the foot peels off so it never twists or bends back through the shin.
        model.updateMatrixWorld(true);
        const restShin=rest.get(f.foot).wp.clone().sub(rest.get(f.lower).wp).normalize(),shin=world(f.foot).sub(world(f.lower)).normalize();
        const follow=new T.Quaternion().setFromUnitVectors(restShin,shin),lateral=V(1,0,0);
        const relaxed=new T.Quaternion().setFromAxisAngle(lateral,-.30*k).multiply(follow).multiply(f.footQ);
        rotateWorld(f.foot,f.footQ.clone().slerp(relaxed,ss(k*2.5)));
      }
      model.updateMatrixWorld(true);
      const kf=feet.find(f=>f.s===kickSide),H=world(kf.upper),Kn=world(kf.lower),Ft=world(kf.foot);
      const legDir=Ft.clone().sub(H).normalize(),under=V(0,-1,0).addScaledVector(legDir,legDir.y).normalize();
      const clap=H.clone().lerp(Kn,.72).addScaledVector(under,.10);
      for(const hd of hands){
        // nearly straight arm swinging on an arc about the shoulder: overhead -> down in front -> under the thigh
        const S=world(bones[hd.side+'Arm']),C=clap.clone().add(V(hd.s*.052,0,0)),dC=C.clone().sub(S);
        const phC=Math.atan2(Math.max(dC.z,0),dC.y),ph0=-.12,ph=lerp(ph0,phC,ka),R=lerp(hd.L1+hd.L2-.03,Math.min(dC.length(),hd.L1+hd.L2-.01),ka);
        const tgt=S.clone().add(V(lerp(hd.s*.07,dC.x,ka),R*Math.cos(ph),R*Math.sin(ph)));
        solve(hd,tgt,V(hd.s,-.3*Math.sin(ph),.3*Math.cos(ph)),hd.side+'Arm',hd.side+'ForeArm',hd.side+'Hand');
        // palms face each other; fingers turn parallel as the hands meet (same hand finish as before)
        const fore=world(hd.end).sub(world(hd.lower)).normalize(),palm=V(-hd.s,0,0),finger=fore.clone();finger.x*=1-ka;finger.normalize();
        orientSegment(hd.side+'ForeArm',hd.side+'Hand',fore,palm);orientSegment(hd.side+'Hand',hd.side+'HandMiddle1',finger,palm);resetDigits(hd);
        orientSegment(hd.side+'HandThumb1',hd.side+'HandThumb2',finger.clone().add(V(0,0,-.45)),palm);orientSegment(hd.side+'HandThumb2',hd.side+'HandThumb3',finger.clone().add(V(0,0,-.15)),palm);
      }
      model.updateMatrixWorld(true);raiseAboveFloor(root,up);
    }else if(exercise==='pushup'){
      const up=V(0,lerp(.18,-.03,q),1).normalize();rootAt(V(0,lerp(.38,.24,q),0),up);const A=world(feet[0].upper),length=Math.min(...feet.map(f=>f.L1+f.L2))-.001,dy=A.y-.232,dx=A.x+.10;const rootZ=-1.21+Math.sqrt(length*length-dy*dy-dx*dx)-A.z;const sag=.10*faultAmt;if(sag){up.applyAxisAngle(V(1,0,0),-Math.atan2(sag,.52)).normalize();}rootAt(V(0,lerp(.38,.24,q)-sag,rootZ+sag*.3),up);torso(up,up);
      for(const f of feet){f.target.set(f.s*.10,.232,-1.21);solve(f,f.target,V(0,-1,0),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(1,0,0),.92).multiply(f.footQ));}
      for(const h of hands){h.target.set(h.s*.275,.078,.245);solve(h,h.target,V(h.s,0,-.35),h.side+'Arm',h.side+'ForeArm',h.side+'Hand');orientSegment(h.side+'Hand',h.side+'HandMiddle1',V(0,0,1),V(0,-1,0));}
    }else if(exercise==='lunge'){
      const tilt=.10+.09*q;rootAt(V(0,lerp(.81,.53,q),-.10+.13*q*faultAmt),V(0,1,0));torso(V(0,Math.cos(tilt),Math.sin(tilt)),V(0,1,.02));
      for(const f of feet){const front=(f.s===-1)!==flipped;f.target.set(f.s*.12,front?.074:.174,front?.38:-.55);solve(f,f.target,V(0,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(1,0,0),front?0:.60).multiply(f.footQ));}standingArms(.45);
    }else if(exercise==='jack'){
      const open=.5-.5*Math.cos(2*Math.PI*t),armOpen=.5-.5*Math.cos(2*Math.PI*(t-.035)),ph=(t%.5)/.5,hop=.095*Math.sin(Math.PI*ph),land=.026*Math.pow(Math.cos(Math.PI*ph),10),footX=lerp(.11,.33,open),dx=footX-.09;
      // knees absorb each landing; arms trail the legs slightly
      rootAt(V(0,.074+hop-land+Math.sqrt((Math.min(...feet.map(f=>f.L1+f.L2))-.01)**2-dx*dx)+.005,-.015),V(0,1,0));torso(V(0,1,0));
      for(const f of feet){f.target.set(f.s*footX,.074+hop,-.048);solve(f,f.target,V(0,0,1),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,f.footQ);const a=lerp(.13,2.96,armOpen);aim(f.side+'Arm',f.side+'ForeArm',V(f.s*Math.sin(a),-Math.cos(a),.03));aim(f.side+'ForeArm',f.side+'Hand',V(f.s*Math.sin(a+.08),-Math.cos(a+.08),.03));}
    }else{
      const hipLead=Math.sin(q*Math.PI)*.025,tilt=q*.43+hipLead;const f0=feet[0],hp=rest.get(f0.upper).wp,rootRest=rest.get(bones.Hips).wp,dx=stanceWidth/2-Math.abs(hp.x),dz=-.048-(-.055+hp.z-rootRest.z),startY=.074+Math.sqrt((f0.L1+f0.L2-.008)**2-dx*dx-dz*dz)-(hp.y-rootRest.y);rootAt(V(0,lerp(startY,.59,q),lerp(-.055,-.35,q)-hipLead),V(0,1,0));torso(V(0,Math.cos(tilt),Math.sin(tilt)),V(0,1,.08*q));
      for(const f of feet){f.target.set(f.s*stanceWidth/2,.074,-.048);solve(f,f.target,V(f.s*(.20-.42*faultAmt),0,1).normalize(),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,new T.Quaternion().setFromAxisAngle(V(0,1,0),f.s*.18).multiply(f.footQ));}const armQ=depthAt((t+.985)%1);standingArms(lerp(.18,1.38,armQ));
    }
    if(exercise!=='pushup'&&exercise!=='kickclap')for(const h of hands){
      const fore=world(h.end).sub(world(h.lower)).normalize(),palm=exercise==='armcircle'?V(0,-1,0):exercise==='jack'?V(0,0,1):V(-h.s,0,0);
      orientSegment(h.side+'ForeArm',h.side+'Hand',fore,palm);orientSegment(h.side+'Hand',h.side+'HandMiddle1',fore,palm);
      if(exercise==='lunge')relaxDigits(h,palm);
    }
    applyFault();secondaryHead(t);
    model.updateMatrixWorld(true);
  }
  // Common-mistake overlays for retargeted demos (squat/lunge/push-up faults live in their branches).
  function applyFault(){
    if(!faultAmt)return;model.updateMatrixWorld(true);
    const flex=(name,ang)=>{const b=bones[name];rotateWorld(b,new T.Quaternion().setFromAxisAngle(V(1,0,0),ang).multiply(b.getWorldQuaternion(new T.Quaternion())));};
    if(exercise==='dbrow'||exercise==='dbrdl'){flex('Spine1',.28*faultAmt);flex('Spine2',.30*faultAmt);flex('Neck',-.35*faultAmt);}// rounded back, head craned up
    else if(exercise==='dbpress'){flex('Spine',-.16*faultAmt);flex('Spine1',-.20*faultAmt);flex('Neck',.25*faultAmt);}// lumbar arch, chest thrown back
    else if(exercise==='dbgoblet'){// knees cave in at depth: re-solve legs with an inward pole, feet unchanged
      for(const f of feet){const P=world(f.foot),Q=f.foot.getWorldQuaternion(new T.Quaternion()),bend=1-world(f.upper).distanceTo(P)/(f.L1+f.L2);solve(f,P,V(f.s*(.2-.42*Math.min(1,bend*6)*faultAmt),0,1).normalize(),f.side+'UpLeg',f.side+'Leg',f.side+'Foot');rotateWorld(f.foot,Q);}
    }
    model.updateMatrixWorld(true);
  }
  // Secondary motion: the head lags the trunk's vertical velocity a little and breathes slowly on long loops.
  function secondaryHead(t){
    if(exercise==='armcircle')return;// arm circles keep a deliberately still head and trunk
    if(!motionCache.has(exercise))motionCache.set(exercise,createMotion(exercise));
    const m=motionCache.get(exercise),dur=MOTIONS[exercise].duration,dt=.02,a=m.at(t).p[1],b=m.at(t-dt).p[1];
    const vel=(a-b)/(dt*dur);// svg units per second (+ = moving down)
    let pitch=T.MathUtils.clamp(-vel*.0016,-.07,.07);
    const breaths=Math.round(dur/3.2);if(breaths>0)pitch+=.018*Math.sin(2*Math.PI*breaths*t);
    if(Math.abs(pitch)<1e-4)return;
    model.updateMatrixWorld(true);
    const side=V(1,0,0),q=new T.Quaternion().setFromAxisAngle(side,pitch);
    rotateWorld(bones.Head,q.multiply(bones.Head.getWorldQuaternion(new T.Quaternion())));
  }
  // yellow tint over the faulty body part (vertices mostly skinned to bones matching faultRe)
  const faultMasks=new Map();
  function tintFault(o){
    const key=o.uuid+String(faultRe);let mask=faultMasks.get(key);
    if(!mask){const re=new RegExp(faultRe),si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;mask=[];for(let v=0;v<si.count;v++){let w=0;for(let k=0;k<4;k++)if(re.test(o.skeleton.bones[si.array[v*4+k]]?.name||''))w+=sw.array[v*4+k];if(w>.5)mask.push(v);}faultMasks.set(key,mask);}
    const c=o.geometry.attributes.color.array;for(const v of mask){c[v*3]=1;c[v*3+1]=.82;c[v*3+2]=.18;}
  }
  const meshes=[];
  model.traverse(o=>{if(!o.isSkinnedMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;meshes.push(o);
    o.material=new T.MeshStandardMaterial({color:0xffffff,roughness:.83,metalness:0,vertexColors:true});
    const count=o.geometry.attributes.position.count,skinI=o.geometry.attributes.skinIndex,skinW=o.geometry.attributes.skinWeight;
    const plain=new Float32Array(count*3),profiles=Object.fromEntries(Object.keys(MOTIONS).map(k=>[k,new Float32Array(count*3)]));
    const skin=new T.Color(0xbd8d73),primary=new T.Color(0xff4938),secondary=new T.Color(0xf6ad45);
    const axes=o.skeleton.bones.map(bone=>{const a=bone.getWorldPosition(V()),child=bone.children.find(c=>c.isBone),b=child?child.getWorldPosition(V()):a.clone().add(V(0,-.1,0)),v=b.sub(a);return {name:bone.name,a,v,lenSq:Math.max(v.lengthSq(),1e-8)};});
    const segment=(p,re)=>{let weight=0,z=0,x=0;for(let k=0;k<4;k++){const bw=skinW.array[p.i*4+k],bone=axes[skinI.array[p.i*4+k]];if(!bw||!re.test(bone?.name||''))continue;weight+=bw;const {a,v,lenSq}=bone,t=T.MathUtils.clamp(((p.point.x-a.x)*v.x+(p.point.y-a.y)*v.y+(p.point.z-a.z)*v.z)/lenSq,0,1);z+=(a.z+v.z*t)*bw;x+=(a.x+v.x*t)*bw;}return {weight,z:z/Math.max(weight,1e-8),x:x/Math.max(weight,1e-8)};};
    for(let i=0;i<count;i++){
      const p=o.getVertexPosition(i,V()).applyMatrix4(o.matrixWorld),sample={i,point:p},thigh=segment(sample,/^thigh_/),calf=segment(sample,/^calf_/),arm=segment(sample,/^upperarm_/);
      const quads=thigh.weight>.48&&p.y>.53&&p.y<.96&&p.z>thigh.z+.012;
      const hamstrings=thigh.weight>.48&&p.y>.56&&p.y<.92&&p.z<thigh.z-.012;
      const glutes=p.y>.83&&p.y<1.05&&Math.abs(p.x)<.22&&p.z<-.045;
      const abductors=p.y>.90&&p.y<1.07&&Math.abs(p.x)>.12&&Math.abs(p.x)<.26&&p.z>-.14&&p.z<.07&&(thigh.weight+segment(sample,/^(pelvis|spine_01)$/).weight)>.65;
      const calves=calf.weight>.5&&p.y>.14&&p.y<.48&&p.z<calf.z+.015;
      const adductors=thigh.weight>.48&&p.y>.59&&p.y<.9&&Math.abs(p.x)<Math.abs(thigh.x)-.025;
      // Trunk masks must belong to the trunk, not an overlapping hand/arm.
      const trunk=segment(sample,/^(pelvis|spine_0[123])$/).weight>.65;
      const chest=trunk&&p.y>1.26&&p.y<1.46&&Math.abs(p.x)<.19&&p.z>.035;
      const delts=['Left','Right'].some(side=>p.distanceTo(rest.get(bones[side+'Arm']).wp)<.115);
      const frontDelts=delts&&p.z>.015;
      const triceps=arm.weight>.5&&!delts&&p.z<arm.z-.008;
      const abs=trunk&&p.y>1.04&&p.y<1.26&&Math.abs(p.x)<.135&&p.z>.035;
      const obliques=trunk&&p.y>1.02&&p.y<1.29&&Math.abs(p.x)>.105&&Math.abs(p.x)<.22&&p.z>-.03;
      const lats=trunk&&p.y>1.10&&p.y<1.43&&Math.abs(p.x)>.075&&p.z<-.035;
      const lowerBack=trunk&&p.y>.96&&p.y<1.19&&Math.abs(p.x)<.145&&p.z<-.04;
      const traps=trunk&&p.y>1.40&&p.y<1.55&&Math.abs(p.x)<.175&&p.z<.01;
      const rearDelt=delts&&p.z<.005,biceps=arm.weight>.5&&!delts&&p.z>arm.z+.008;
      const forearm=segment(sample,/^lowerarm_/).weight>.55;
      const hipFlexors=trunk&&p.y>.86&&p.y<1.02&&Math.abs(p.x)<.19&&p.z>.02;
      const regions={quads,hamstrings,glutes,abductors,calves,adductors,chest,delts,frontDelt:frontDelts,triceps,abs,obliques,lats,lowerBack,traps,rearDelt,biceps,forearm,hipFlexors};
      skin.toArray(plain,i*3);for(const [name,meta] of Object.entries(MOTIONS)){const main=meta.targets.p.some(key=>regions[key]),assist=meta.targets.s.some(key=>regions[key]);(main?primary:assist?secondary:skin).toArray(profiles[name],i*3);}
    }
    o.userData.muscleProfiles=profiles;o.userData.plainColors=plain;o.geometry.setAttribute('color',new T.BufferAttribute(plain.slice(),3));
  });
  return {pose,feet,hands,meshes,bones,rest,getSharedGrip,setStance(width){stanceWidth=T.MathUtils.clamp(width,.42,.58);},setExercise(name){if(!MOTIONS[name])throw Error('Unknown exercise: '+name);exercise=name;flipped=false;this.setHighlight(highlighted);},flipSide(){flipped=!flipped;return flipped;},setFault(amount,re){faultAmt=amount;if(re!==undefined&&String(re)!==String(faultRe)){faultRe=re;this.setHighlight(highlighted);}},setHighlight(on){highlighted=on;meshes.forEach(o=>{o.geometry.attributes.color.array.set(on?o.userData.muscleProfiles[exercise]:o.userData.plainColors);if(faultRe)tintFault(o);o.geometry.attributes.color.needsUpdate=true;});},setWireframe(on){meshes.forEach(o=>o.material.wireframe=on);}};
}
