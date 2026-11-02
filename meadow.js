import * as T from './vendor/three.module.js';

// Spring is a tiny wildflower garden; summer is a green dandelion meadow.
export function createMeadowGarden(world, random) {
  const group=new T.Group();world.add(group);
  const dummy=new T.Object3D();
  const springMaterials=[],summerMaterials=[];
  function mat(color,list,extra={}){const m=new T.MeshStandardMaterial({color,roughness:.85,transparent:true,...extra});list.push(m);return m;}
  const springStem=mat(0x42742e,springMaterials);
  const petalMaterial=mat(0xffffff,springMaterials);
  const centerMaterial=mat(0xe1b850,springMaterials);
  const flowerCount=100;
  const stems=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),springStem,flowerCount);
  const petals=new T.InstancedMesh(new T.SphereGeometry(1,6,4),petalMaterial,flowerCount*6);
  const centers=new T.InstancedMesh(new T.SphereGeometry(.015,6,4),centerMaterial,flowerCount);
  const colors=[0xf0a9c1,0xd983b1,0xa786c9,0x80a8d4,0xe8be4f,0xd77a82,0xf4eedb];
  function position(){let x,z;do{const a=random()*Math.PI*2,r=1.25+Math.sqrt(random())*3.45;x=Math.cos(a)*r;z=Math.sin(a)*r;}while(Math.hypot(x-.8,z-2.3)<.85);return [x,z];}
  for(let i=0;i<flowerCount;i++){
    const [x,z]=position(),height=.20+random()*.10;
    dummy.position.set(x,height/2,z);dummy.rotation.set(0,0,0);dummy.scale.set(.006,height,.006);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<6;k++){
      const a=k/6*Math.PI*2;dummy.position.set(x+Math.cos(a)*.029,height,z+Math.sin(a)*.029);dummy.rotation.set(0,-a+Math.PI/2,0);dummy.scale.set(.023,.007,.036);dummy.updateMatrix();petals.setMatrixAt(i*6+k,dummy.matrix);petals.setColorAt(i*6+k,new T.Color(colors[i%colors.length]));
    }
    dummy.position.set(x,height+.006,z);dummy.scale.setScalar(1);dummy.updateMatrix();centers.setMatrixAt(i,dummy.matrix);
  }
  group.add(stems,petals,centers);
  const summerStem=mat(0x49753b,summerMaterials);
  const puffStemCount=48;
  const puffStems=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),summerStem,puffStemCount);
  const strands=[],tips=[];
  for(let i=0;i<puffStemCount;i++){
    const [x,z]=position(),height=.27+random()*.13;
    dummy.position.set(x,height/2,z);dummy.rotation.set(0,0,0);dummy.scale.set(.005,height,.005);dummy.updateMatrix();puffStems.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<34;k++){
      const a=k*2.39996,h=1-2*(k+.5)/34,r=.057;
      const end=[x+Math.cos(a)*Math.sqrt(1-h*h)*r,height+h*r,z+Math.sin(a)*Math.sqrt(1-h*h)*r];
      strands.push(x,height,z,...end);tips.push(...end);
    }
  }
  const strandsMaterial=new T.LineBasicMaterial({color:0xf1eee0,transparent:true,opacity:.5,depthWrite:false});
  const tipsMaterial=new T.PointsMaterial({color:0xfffaeb,size:.017,transparent:true,opacity:.65,depthWrite:false});
  const strandGeometry=new T.BufferGeometry();strandGeometry.setAttribute('position',new T.Float32BufferAttribute(strands,3));
  const tipsGeometry=new T.BufferGeometry();tipsGeometry.setAttribute('position',new T.Float32BufferAttribute(tips,3));
  const puffLines=new T.LineSegments(strandGeometry,strandsMaterial),puffTips=new T.Points(tipsGeometry,tipsMaterial);
  group.add(puffStems,puffLines,puffTips);
  return {update(time,weights){
    for(const m of springMaterials){m.opacity=weights[0];m.depthWrite=weights[0]>.95;}
    for(const object of [stems,petals,centers])object.visible=weights[0]>.01;
    for(const m of summerMaterials){m.opacity=weights[1];m.depthWrite=weights[1]>.95;}
    for(const object of [puffStems,puffLines,puffTips])object.visible=weights[1]>.01;
    strandsMaterial.opacity=weights[1]*.46;tipsMaterial.opacity=weights[1]*.65;
  }};
}
