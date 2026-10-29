import * as T from './assets/three.module.js';
// Gentle radial changes around the authored skeleton; joint positions stay fixed.
export function createBodyFullness(model){
  model.updateMatrixWorld(true);
  const records=[];
  model.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return;
    const geometry=mesh.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal;
    const original=position.array.slice(),originalNormals=normal.array.slice(),full=original.slice(),fullNormals=originalNormals.slice();
    const weights=geometry.attributes.skinWeight,indices=geometry.attributes.skinIndex;
    const inverse=mesh.matrixWorld.clone().invert(),normalToWorld=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),normalToLocal=new T.Matrix3().getNormalMatrix(inverse);
    const axes=mesh.skeleton.bones.map(b=>{
      let gain=/^(pelvis|spine_)/.test(b.name)?.075:/^thigh_/.test(b.name)?.065:/^(upperarm_|lowerarm_|calf_)/.test(b.name)?.045:0;
      const child=b.children.find(x=>x.isBone),a=b.getWorldPosition(new T.Vector3());
      const axis=child?child.getWorldPosition(new T.Vector3()).sub(a).normalize():new T.Vector3(0,1,0);
      return {a,axis,gain};
    });
    for(let i=0;i<position.count;i++){
      const p=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld),n=new T.Vector3().fromBufferAttribute(normal,i).applyMatrix3(normalToWorld).normalize();
      const displacement=new T.Vector3(),normalChange=new T.Vector3();
      for(let k=0;k<4;k++){
        const w=weights.array[i*4+k],bone=axes[indices.array[i*4+k]];if(!w||!bone.gain)continue;
        const radial=p.clone().sub(bone.a);radial.addScaledVector(bone.axis,-radial.dot(bone.axis));
        displacement.addScaledVector(radial,w*bone.gain);
        const radialNormal=n.clone().addScaledVector(bone.axis,-n.dot(bone.axis));normalChange.addScaledVector(radialNormal,-w*bone.gain/(1+bone.gain));
      }
      p.add(displacement).applyMatrix4(inverse).toArray(full,i*3);
      n.add(normalChange).applyMatrix3(normalToLocal).normalize().toArray(fullNormals,i*3);
    }
    records.push({mesh,original,originalNormals,full,fullNormals});
  });
  return {setFull(on){for(const r of records){const g=r.mesh.geometry;g.attributes.position.array.set(on?r.full:r.original);g.attributes.normal.array.set(on?r.fullNormals:r.originalNormals);g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();}},records};
}
