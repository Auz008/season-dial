import * as T from './vendor/three.module.js';

const TAU=Math.PI*2;
const ease=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const mix=(a,b,w)=>a+(b-a)*w;
const angleMix=(a,b,w)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*w;
const sequence=[['wander',0,5],['approach',5,7],['nuzzle',7,11],['hug',11,16],['roll',16,22],['stretch',22,26],['paw-play',26,32],['hop',32,36],['curl',36,43],['wake',43,48]];

function base(){return {x:0,z:2.40,y:.08,yaw:0,pitch:0,roll:0,bodyY:.24,sx:1,sy:1,sz:1,headYaw:0,headPitch:0,headRoll:0,tailX:0,tailZ:0,tailY:0,eye:1,legs:[0,0,0,0],spread:[0,0,0,0],walk:0,stride:0};}
function blend(a,b,w){const p=base();for(const key of Object.keys(p)){if(Array.isArray(p[key]))p[key]=a[key].map((value,i)=>mix(value,b[key][i],w));else p[key]=key==='yaw'?angleMix(a[key],b[key],w):mix(a[key],b[key],w);}return p;}
function pose(action,u,index){
  const p=base(), side=index===0?-1:1, time=u;
  p.x=.72+side*.44;p.z=2.38+index*.06;p.yaw=-side*.52;
  p.headYaw=Math.sin(time*1.3+index)*.07;p.headPitch=Math.sin(time*2.1+index)*.035;
  p.tailZ=Math.sin(time*1.5+index)*.18;p.tailY=Math.sin(time*.8+index)*.15;
  if(action==='wander'){
    const angle=u*TAU/5;
    p.x=.72+side*(.60-.17*Math.sin(angle));
    p.z=2.40+.36*(1-Math.cos(angle));
    p.yaw=Math.atan2(-side*.17*Math.cos(angle),.36*Math.sin(angle));
    p.walk=1;
    p.stride=u*.34;
  } else if(action==='approach'){
    const progress=ease(u/2);
    const walk=pose('wander',5+u*(1-progress),index);
    walk.stride=1.70+u*.34;
    const greeting=pose('nuzzle',0,index);
    const result=blend(walk,greeting,progress);
    result.stride=walk.stride;
    return result;
  } else if(action==='nuzzle'){
    p.x=.72+side*(.39+Math.sin(u*1.4)*.016);p.z=2.38+Math.sin(u*1.4+index)*.025;
    p.headYaw=-side*(.24+Math.sin(u*1.7)*.10);p.headRoll=side*Math.sin(u*2)*.12;
    p.pitch=-.04;p.headPitch=-.08;p.sy=1+Math.sin(u*2.0)*.016;
  } else if(action==='hug'){
    // A brief, low lean and a single gentle paw touch.
    const reach=ease((u-index*.24)/1.4)*(1-ease((u-3.1)/1.65));
    p.x=.72+side*(.42-.022*reach);
    p.pitch=-.12*reach;p.bodyY=.24-.018*reach;
    p.headPitch=.10*reach;p.headRoll=side*.12*reach;
    p.legs[index===0?3:1]=-.39*reach;
    p.eye=1-.4*reach;
  } else if(action==='roll'){
    // Each cat settles onto its side, with a slight delay between them.
    const settle=ease((u-index*.32)/1.8)*(1-ease((u-3.4-index*.22)/2));
    p.x=.72+side*(.48+.08*settle);p.z=2.42+side*.07;
    p.yaw=.13+side*.12;p.bodyY=.24-.085*settle;
    p.roll=side*1.15*settle;p.pitch=.045*settle;
    p.legs=[.28,-.36,.28,-.36].map(angle=>angle*settle);
    p.headPitch=.10*settle;p.headRoll=-side*.12*settle;
    p.eye=1-.3*settle;p.tailX=.19*settle;
  } else if(action==='stretch'){
    const stretch=Math.sin(Math.PI*ease(u/4));
    p.x=.72+side*.47;p.z=2.4;p.yaw=.18+side*.35;
    p.pitch=.20*stretch;p.sy=1-.20*stretch;p.sz=1+.22*stretch;
    p.bodyY=.24-.035*stretch;p.legs=[.18,-.31,.18,-.31].map(angle=>angle*stretch);p.headPitch=-.25*stretch;
    p.tailX=-.45*stretch;
  } else if(action==='paw-play'){
    p.x=.72+side*.43;p.z=2.39;p.pitch=-.065;
    const bat=Math.max(0,Math.sin(u*1.45+index*2.1))**2;
    p.legs=[.25,-.25,.25,-.25];p.legs[index===0?1:3]=-.43*bat;
    p.spread[index===0?1:3]=side*.17*bat;
    p.headPitch=.10;p.headYaw=side*(.10+Math.sin(u*1.2)*.08);p.tailZ=Math.sin(u*1.9+index)*.25;
  } else if(action==='hop'){
    p.x=.72+side*.46;p.z=2.44;p.yaw=side*.35;
    const phase=u-index*1.25-.45, flight=(phase-.20)/.9;
    const squat=phase>0&&phase<.20?Math.sin(phase/.2*Math.PI)**2*.03:0;
    if(flight>0&&flight<1){
      const lift=Math.sin(flight*Math.PI)**2;
      p.y+=lift*.23;p.pitch=Math.sin(flight*TAU)*lift*.14;
      p.legs=[.32,-.38,.32,-.38].map(angle=>angle*lift);
    }
    const landing=phase-1.10;
    if(landing>0&&landing<.35)p.bodyY-=.025*Math.sin(landing/.35*Math.PI)**2;
    p.y-=squat;p.sy=1-squat*1.5;p.sz=1+squat;
    p.tailZ=side*.14;
  } else if(action==='curl'){
    const settle=ease(u/1.3);
    p.x=.72+side*.41;p.z=2.40;p.yaw=.12+side*.14;
    p.bodyY=.24-.09*settle;p.sy=1-.23*settle;p.sz=1-.17*settle;
    p.roll=-side*.17*settle;p.headPitch=.38*settle;p.headYaw=-side*.55*settle;
    p.legs=[.8,-.6,.8,-.6];p.eye=1-settle*.95;p.tailY=-side*.7*settle;
    p.sy+=Math.sin(u*TAU/3.8+index*.25)*.012;
  } else if(action==='wake'){
    const start=pose('wander',0,index);
    const progress=ease(u/5);
    const result=blend(pose('curl',7,index),start,progress);
    result.stride=-.24*(1-progress);
    return result;
  }
  return p;
}

export function sampleCatPose(time,index){
  const t=((time%48)+48)%48;
  const slot=sequence.find(([,start,end])=>t>=start&&t<end);
  const n=sequence.indexOf(slot),local=t-slot[1];
  let p=pose(slot[0],local,index);
  if(n>1&&local<1.15){
    const previous=sequence[n-1];
    p=blend(pose(previous[0],previous[2]-previous[1],index),p,ease(local/1.15));
  }
  const breath=Math.sin(time*TAU/3.8+index*.4)*.008;
  p.sy+=breath;
  const blinkDistance=Math.sin(Math.PI*(time+index*1.6-.12)/5.3);
  p.eye*=1-.92*Math.exp(-(blinkDistance**2)/.002);
  return p;
}

// Measure the actual articulated silhouette, including the tail's full sway.
const collisionParts=new WeakMap();
function partsFor(cat){
  if(!collisionParts.has(cat)){
    const parts=[];
    cat.body.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const geometry=mesh.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      const box=geometry.boundingBox.clone();
      if(geometry.type==='SphereGeometry'){
        box.max.setScalar(geometry.parameters.radius);
        box.min.setScalar(-geometry.parameters.radius);
      }
      parts.push({mesh,center:box.getCenter(new T.Vector3()),half:box.getSize(new T.Vector3()).multiplyScalar(.5)});
    });
    const feet=cat.legs.map(leg=>parts.filter(({mesh})=>mesh.parent===leg));
    collisionParts.set(cat,{parts,feet});
  }
  return collisionParts.get(cat);
}

const center=new T.Vector3();
function edge(parts,axis,sign){
  let bound=-Infinity;
  for(const {mesh,center:localCenter,half} of parts){
    const matrix=mesh.matrixWorld;
    center.copy(localCenter).applyMatrix4(matrix);
    const m=matrix.elements;
    const x=m[axis]*half.x,y=m[axis+4]*half.y,z=m[axis+8]*half.z;
    const radius=mesh.geometry.type==='SphereGeometry'
      ?Math.hypot(x,y,z):Math.abs(x)+Math.abs(y)+Math.abs(z);
    bound=Math.max(bound,sign*center.getComponent(axis)+radius);
  }
  return bound;
}

const stepLength=.24;
function gait(stride,index){
  // A diagonal pair stays planted while its partner swings forward.
  const offset=(index===0||index===3)?0:.5;
  const cycle=stride/stepLength+offset;
  const phase=cycle-Math.floor(cycle);
  if(phase<.64)return {reach:stepLength*(.32-phase),lift:0};
  const swing=(phase-.64)/.36;
  return {reach:stepLength*(ease(swing)*.64-.32),lift:.043*Math.sin(Math.PI*swing)**2};
}

const tailPoint=new T.Vector3(),tailTangent=new T.Vector3();
const ringRight=new T.Vector3(),ringUp=new T.Vector3();
function tailCurve(u,time,index,walk,out){
  const wave=Math.sin(time*3.1-u*4.5+index*1.7);
  const flick=Math.sin(time*5.2-u*7+index)*.037*u**3;
  const sway=(.15+.07*walk)*u**1.4*wave+flick;
  const lift=.48*u+.052*Math.sin(time*2-u*3+index)*u**2;
  return out.set(sway,lift,-.49*Math.sin(u*2.02));
}

function animateTail(cat,time,index,walk){
  const {tailGeometry,tailRings,tailSides}=cat;
  const positions=tailGeometry.attributes.position;
  for(let ring=0;ring<tailRings;ring++){
    const u=ring/(tailRings-1);
    tailCurve(u+.002,time,index,walk,tailTangent);
    tailCurve(u,time,index,walk,tailPoint);
    tailTangent.sub(tailPoint).normalize();
    ringRight.set(1,0,0).addScaledVector(tailTangent,-tailTangent.x).normalize();
    ringUp.crossVectors(tailTangent,ringRight);
    const radius=.045*(1-u)**.60+.002;
    for(let side=0;side<tailSides;side++){
      const angle=side*TAU/tailSides;
      const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
      positions.setXYZ(ring*tailSides+side,
        tailPoint.x+ringRight.x*x+ringUp.x*y,
        tailPoint.y+ringRight.y*x+ringUp.y*y,
        tailPoint.z+ringRight.z*x+ringUp.z*y);
    }
  }
  positions.needsUpdate=true;
  tailGeometry.computeVertexNormals();
  tailGeometry.computeBoundingBox();
  tailGeometry.computeBoundingSphere();
}

export function animateCatPair(cats,time,uniforms){
  const footprints=cats.map((cat,index)=>{
    const p=sampleCatPose(time,index);
    const bounce=Math.cos(p.stride/stepLength*TAU*2)*.012*p.walk;
    cat.group.position.set(p.x,0,p.z);cat.group.rotation.y=p.yaw;
    cat.body.position.y=p.bodyY+bounce;cat.body.rotation.set(p.pitch,0,p.roll);
    cat.body.scale.set(p.sx,p.sy,p.sz);
    cat.head.rotation.set(p.headPitch-bounce*2,p.headYaw,p.headRoll);
    cat.tail.rotation.set(p.tailX*.65,p.tailY*.6,p.tailZ);
    animateTail(cat,time,index,p.walk);
    const steps=cat.legs.map((leg,i)=>{
      const step=gait(p.stride,i);
      leg.position.y=-.01;
      leg.rotation.set(p.legs[i]-Math.asin(step.reach/.17)*p.walk,0,p.spread[i]);
      return step;
    });
    cat.eyes?.forEach(eye=>eye.scale.y=p.eye);
    cat.ears.forEach((ear,i)=>{
      ear.rotation.z=(i===0?.20:-.20)+Math.sin(time*1.3+index+i)*.06;
      ear.rotation.y=Math.sin(time*1.8+index+i*1.4)*.12;
    });
    const {parts,feet}=partsFor(cat);
    const tailPart=parts.find(({mesh})=>mesh.geometry===cat.tailGeometry);
    cat.tailGeometry.boundingBox.getCenter(tailPart.center);
    cat.tailGeometry.boundingBox.getSize(tailPart.half).multiplyScalar(.5);
    cat.group.updateMatrixWorld(true);
    for(let i=0;i<cat.legs.length;i++){
      const leg=cat.legs[i];
      const sole=-edge(feet[i],1,-1);
      const vertical=cat.body.matrixWorld.elements[5];
      if(vertical>.2)leg.position.y+=p.walk*(steps[i].lift-sole)/vertical;
    }
    cat.group.updateMatrixWorld(true);
    const lowest=-edge(parts,1,-1);
    const angle=(Math.atan2(p.z,p.x)/TAU+1)%1;
    const season=((uniforms.uCycle.value-angle)%4+4)%4;
    const snow=T.MathUtils.smoothstep(season,3,3.12)*(1-T.MathUtils.smoothstep(season,3.88,4));
    cat.group.position.y=-.018+.05*snow+Math.max(0,p.y-.08)-lowest;
    return parts;
  });

  // Keep a small air gap between the two silhouettes throughout every blend.
  const overlap=edge(footprints[0],0,1)+edge(footprints[1],0,-1)+.022;
  const softness=.045;
  const separation=overlap<=-softness?0:overlap>=softness?overlap:(overlap+softness)**2/(4*softness);
  cats[0].group.position.x-=separation/2;
  cats[1].group.position.x+=separation/2;
  cats.forEach((cat,index)=>{
    const {x,z}=cat.group.position;
    uniforms[index?'uCatB':'uCatA'].value.set(x,z);
  });
}
