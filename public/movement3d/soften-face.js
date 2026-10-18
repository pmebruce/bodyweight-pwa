import * as T from './assets/three.module.js';
/** Two small surface-smoothing passes, preserving the nose, silhouette and head proportions. */
export function softenFace(model){
  model.updateMatrixWorld(true);let changed=0,maxChange=0;
  model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const g=mesh.geometry,pos=g.attributes.position,n=pos.count,indices=g.index?.array;if(!indices)return;
    const weights=new Float32Array(n),original=pos.array.slice(),originalNormals=g.attributes.normal.array.slice();
    for(let i=0;i<n;i++){const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);if(p.y<1.62||p.y>1.755||p.z<.065||Math.abs(p.x)>.075)continue;const nose=Math.abs(p.x)<.020&&p.y>1.665&&p.y<1.715;if(nose)continue;weights[i]=.30*Math.min(1,(p.y-1.62)/.025,(1.755-p.y)/.025,(.075-Math.abs(p.x))/.02);}
    const sums=new Float32Array(n*3),counts=new Uint16Array(n);
    for(let pass=0;pass<2;pass++){sums.fill(0);counts.fill(0);for(let j=0;j<indices.length;j+=3){const tri=[indices[j],indices[j+1],indices[j+2]];for(let k=0;k<3;k++){const a=tri[k];if(!weights[a])continue;for(let h=1;h<=2;h++){const b=tri[(k+h)%3];for(let c=0;c<3;c++)sums[a*3+c]+=pos.array[b*3+c];counts[a]++;}}}for(let i=0;i<n;i++)if(counts[i])for(let c=0;c<3;c++){const target=pos.array[i*3+c]+weights[i]*(sums[i*3+c]/counts[i]-pos.array[i*3+c]);pos.array[i*3+c]=T.MathUtils.clamp(target,original[i*3+c]-.0014,original[i*3+c]+.0014);}}
    g.computeVertexNormals();for(let i=0;i<n;i++){const normal=new T.Vector3().fromArray(originalNormals,i*3);if(weights[i]){normal.lerp(new T.Vector3().fromBufferAttribute(g.attributes.normal,i),.45).normalize();const d=Math.hypot(pos.array[i*3]-original[i*3],pos.array[i*3+1]-original[i*3+1],pos.array[i*3+2]-original[i*3+2]);if(d>1e-8)changed++;maxChange=Math.max(maxChange,d);}g.attributes.normal.setXYZ(i,normal.x,normal.y,normal.z);}pos.needsUpdate=true;g.attributes.normal.needsUpdate=true;
  });return {changed,maxChange};
}
