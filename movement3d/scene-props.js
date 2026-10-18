import * as T from './assets/three.module.js';
export function createProps(exercise){const group=new T.Group(),material=new T.MeshStandardMaterial({color:0x8caaa0,roughness:.9});const box=(x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);};
 if(exercise==='dips'){box(0,.53,-.8,.78,.08,.70);for(const x of [-.31,.31])for(const z of [-1.08,-.52])box(x,.25,z,.05,.5,.05);}
 if(exercise==='wallsit')box(0,.84,-.62,.95,1.68,.045);
 if(exercise==='pullup'){box(0,2.075,0,1.36,.045,.045);for(const x of [-.66,.66]){box(x,1.025,0,.045,2.05,.045);box(x,.025,0,.10,.05,.70);}}
 group.updateMatrixWorld(true);return group;}
