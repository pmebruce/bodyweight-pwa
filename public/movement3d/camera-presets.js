// Floor and seated exercises use side views across the entire movement cycle.
const SIDE_VIEWS=new Set(['pushup','diamond','plank','burpee','climber','bridge','situp','crunch','superman','sideplank','birddog','bicycle','dips','wallsit','dbfloorpress','dbrenegade','dbbridge']);
export function cameraPresets(exercise){
  if(SIDE_VIEWS.has(exercise)){
    // Side plank lies along X; other floor movements lie along Z.
    const side=exercise==='sideplank'?0:Math.PI/2;
    return {
      front:{yaw:side,pitch:.48,label:'側俯視'},
      side:{yaw:side,pitch:.18,label:'側面'},
      three:{yaw:side-.32,pitch:.40,label:'斜側俯視'},
    };
  }
  return {front:{yaw:0,pitch:.10,label:'正面'},side:{yaw:Math.PI/2,pitch:.10,label:'側面'},three:{yaw:.68,pitch:.10,label:'斜側面'}};
}
export function cameraDistance(size,yaw,pitch,aspect,usable){
  const width=Math.abs(Math.cos(yaw))*size.x+Math.abs(Math.sin(yaw))*size.z;
  const depth=Math.abs(Math.sin(yaw))*size.x+Math.abs(Math.cos(yaw))*size.z;
  const height=Math.cos(pitch)*size.y+Math.sin(pitch)*depth;
  const viewDepth=Math.sin(pitch)*size.y+Math.cos(pitch)*depth;
  const halfFov=Math.tan(35*Math.PI/360);
  return Math.max(height/(2*halfFov*usable),width/(2*halfFov*aspect*.86))+viewDepth/2;
}
