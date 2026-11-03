import * as T from './vendor/three.module.js';

const TAU=Math.PI*2;
const ease=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const mix=(a,b,w)=>a+(b-a)*w;
const angleMix=(a,b,w)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*w;
const sequence=[['wander',0,5],['approach',5,7],['nuzzle',7,11],['hug',11,16],['roll',16,22],['stretch',22,26],['paw-play',26,32],['hop',32,36],['curl',36,43],['wake',43,48]];

function base(){return {x:0,z:2.40,y:.08,yaw:0,pitch:0,roll:0,bodyY:.24,sx:1,sy:1,sz:1,headYaw:0,headPitch:0,headRoll:0,tailX:0,tailZ:0,tailY:0,eye:1,legs:[0,0,0,0],spread:[0,0,0,0],walk:0};}
function blend(a,b,w){const p=base();for(const key of Object.keys(p)){if(Array.isArray(p[key]))p[key]=a[key].map((value,i)=>mix(value,b[key][i],w));else p[key]=key==='yaw'?angleMix(a[key],b[key],w):mix(a[key],b[key],w);}return p;}
function pose(action,u,index){
  const p=base(), side=index===0?-1:1, time=u;
  p.x=.72+side*.28;p.z=2.38+index*.02;p.yaw=-side*Math.PI/2;
  p.headYaw=Math.sin(time*1.3+index)*.07;p.headPitch=Math.sin(time*2.1+index)*.035;
  p.tailZ=Math.sin(time*1.5+index)*.18;p.tailY=Math.sin(time*.8+index)*.15;
  if(action==='wander'){
    const a=.4+u*.52+index*Math.PI;
    p.x=.72+Math.cos(a)*.62;p.z=2.40+Math.sin(a)*.39;p.yaw=Math.atan2(-Math.sin(a)*.62,Math.cos(a)*.39);p.walk=1;
  } else if(action==='approach'){
    return blend(pose('wander',5,index),pose('nuzzle',0,index),ease(u/2));
  } else if(action==='nuzzle'){
    p.x=.72+side*(.225+Math.sin(u*1.4)*.012);p.z=2.38+Math.sin(u*1.4+index)*.025;
    p.headYaw=side*(.15+Math.sin(u*2.0)*.18);p.headRoll=side*Math.sin(u*2)*.12;
    p.pitch=-.04;p.headPitch=-.08;p.sy=1+Math.sin(u*2.0)*.016;
  } else if(action==='hug'){
    const arrive=ease(u/.85), sway=Math.sin(u*1.7)*.035;
    p.x=.72+side*(.22+sway);p.z=2.38;
    p.pitch=-.88*arrive;p.roll=-side*.09;p.bodyY=.26;
    p.legs=[.34,-1.02,.34,-1.02];p.spread=[0,side*.34,0,-side*.34];
    p.headYaw=side*.15;p.headPitch=.33;p.headRoll=side*.11;
    p.sy=1.03+Math.sin(u*2.3)*.012;
  } else if(action==='roll'){
    const progress=ease(u/6), turn=(1-Math.cos(progress*TAU))*Math.PI;
    p.x=.72+side*(.24+.045*Math.sin(progress*TAU));p.z=2.42+side*.07;
    p.yaw=.10+side*.05;p.bodyY=.255;p.pitch=.02;
    p.roll=side*(Math.sin(progress*Math.PI)*Math.PI*.92+Math.sin(progress*TAU)*.18);
    p.legs=[.5,-.9,.5,-.9];p.spread=[-.25,.4,.25,-.4];
    p.headPitch=.15;p.headRoll=-side*.08;p.tailX=.30;p.sy=.96;p.sz=.94;
  } else if(action==='stretch'){
    const stretch=Math.sin(Math.PI*ease(u/4));
    p.x=.72+side*.35;p.z=2.4;p.yaw=.18+side*.35;
    p.pitch=.20*stretch;p.sy=1-.20*stretch;p.sz=1+.22*stretch;
    p.bodyY=.24-.035*stretch;p.legs=[.22,-.40,.22,-.40];p.headPitch=-.25*stretch;
    p.tailX=-.45*stretch;
  } else if(action==='paw-play'){
    p.x=.72+side*.30;p.z=2.39;p.pitch=-.12;
    const bat=Math.max(0,Math.sin(u*1.55+index*2.1));
    p.legs=[.25,-.25,.25,-.25];p.legs[index===0?1:3]=-1.15*bat;
    p.spread[index===0?1:3]=side*.40*bat;
    p.headPitch=.10;p.headYaw=side*(.10+Math.sin(u*1.2)*.08);p.tailZ=Math.sin(u*1.9+index)*.25;
  } else if(action==='hop'){
    p.x=.72+side*.36;p.z=2.44;p.yaw=side*.35;
    const phase=u-index*1.25-.45, flight=(phase-.20)/.9;
    const squat=phase>0&&phase<.20?Math.sin(phase/.2*Math.PI)*.045:0;
    if(flight>0&&flight<1){p.y+=Math.sin(flight*Math.PI)*.45;p.pitch=Math.sin(flight*TAU)*.16;p.legs=[.45,-.55,.45,-.55];}
    p.y-=squat;p.sy=1-squat*1.5;p.sz=1+squat;
    p.tailZ=side*.14;
  } else if(action==='curl'){
    const settle=ease(u/1.3);
    p.x=.72+side*.235;p.z=2.40;p.yaw=.12+side*.14;
    p.bodyY=.24-.09*settle;p.sy=1-.23*settle;p.sz=1-.17*settle;
    p.roll=-side*.17*settle;p.headPitch=.38*settle;p.headYaw=-side*.55*settle;
    p.legs=[.8,-.6,.8,-.6];p.eye=1-settle*.95;p.tailY=-side*.7*settle;
    p.sy+=Math.sin(u*TAU/3.8+index*.25)*.012;
  } else if(action==='wake'){
    return blend(pose('curl',7,index),pose('wander',0,index),ease(u/5));
  }
  return p;
}

export function sampleCatPose(time,index){
  const t=((time%48)+48)%48;
  const slot=sequence.find(([,start,end])=>t>=start&&t<end);
  const n=sequence.indexOf(slot),local=t-slot[1];
  let p=pose(slot[0],local,index);
  if(n>0&&local<.65){const prev=sequence[n-1];p=blend(pose(prev[0],prev[2]-prev[1],index),p,ease(local/.65));}
  const breath=Math.sin(time*TAU/3.8+index*.4)*.008;
  p.sy+=breath;
  if(p.eye>.5){const b=((time+index*1.6)%5.3);p.eye=1-.92*Math.exp(-Math.pow((b-.12)/.075,2));}
  return p;
}

export function animateCatPair(cats,time,uniforms){
  cats.forEach((cat,index)=>{
    const p=sampleCatPose(time,index);
    cat.group.position.set(p.x,p.y,p.z);cat.group.rotation.y=p.yaw;
    cat.body.position.y=p.bodyY;cat.body.rotation.set(p.pitch,0,p.roll);cat.body.scale.set(p.sx,p.sy,p.sz);
    cat.head.rotation.set(p.headPitch,p.headYaw,p.headRoll);
    cat.tail.rotation.set(p.tailX,p.tailY,p.tailZ);
    cat.legs.forEach((leg,i)=>{const front=i%2===1;const phase=time*TAU*1.65+(front?Math.PI:0)+(i>1?Math.PI:0);leg.rotation.set(p.legs[i]+Math.sin(phase)*.35*p.walk,0,p.spread[i]);});
    cat.eyes?.forEach(eye=>eye.scale.y=.018*p.eye);
    cat.ears?.forEach((ear,i)=>ear.rotation.z=(i===0?.15:-.15)+Math.sin(time*.8+index+i)*.035);
    if(cat.tailGeometry){const positions=cat.tailGeometry.attributes.position;for(let i=0;i<positions.count;i++){const x=cat.tailRest[i*3],y=cat.tailRest[i*3+1],z=cat.tailRest[i*3+2];const influence=Math.pow(Math.min(1,Math.abs(z)/.40),1.7);positions.setXYZ(i,x+Math.sin(time*1.9-z*9+index)*.035*influence,y,z);}positions.needsUpdate=true;}
    uniforms[index?'uCatB':'uCatA'].value.set(p.x,p.z);
  });
}
