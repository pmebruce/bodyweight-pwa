import * as T from './assets/three.module.js';
/** Soften facial shading without moving vertices or opening UV seams. */
export function softenFace(model){
  model.updateMatrixWorld(true);let changed=0;
  model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const g=mesh.geometry,pos=g.attributes.position,normals=g.attributes.normal;if(!normals)return;
    const groups=new Map();
    for(let i=0;i<pos.count;i++){
      const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
      if(p.y<1.62||p.y>1.755||p.z<.065||Math.abs(p.x)>.075)continue;
      // Position duplicates at a UV seam must retain exactly the same geometry.
      const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
    }
    for(const ids of groups.values()){
      if(ids.length<2)continue;const average=new T.Vector3();for(const i of ids)average.add(new T.Vector3().fromBufferAttribute(normals,i));if(average.lengthSq()<1e-8)continue;average.normalize();
      for(const i of ids){const normal=new T.Vector3().fromBufferAttribute(normals,i);if(normal.dot(average)<.7)continue;normal.lerp(average,.35).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);changed++;}
    }
    normals.needsUpdate=true;
  });return {changed,maxChange:0};
}
