import * as T from './vendor/three.module.js';

// Spring is a tiny wildflower garden; summer is a green dandelion meadow.
export function createMeadowGarden(world, random, windTime, snowman, seasonCycle, seasonsGLSL) {
  const group=new T.Group();world.add(group);
  const dummy=new T.Object3D();
  function plantMaterial(color){
    return new T.MeshStandardMaterial({color,roughness:.85});
  }
  function followSeason(material,seasonIndex,wind=null){
    const fade=material.transparent;
    material.customProgramCacheKey=()=>`meadow-${seasonIndex}-${Boolean(wind)}-${fade}`;
    material.onBeforeCompile=shader=>{
      shader.uniforms.uCycle=seasonCycle;
      if(wind)shader.uniforms.flowerTime=wind;
      shader.vertexShader=`
        uniform float uCycle;
        attribute vec2 plantRoot;
        ${wind ? 'uniform float flowerTime;' : ''}
        ${fade ? 'varying float vPlantGrowth;' : ''}
        ${seasonsGLSL}
      `+shader.vertexShader;
      // Grow or shrink each plant around its root, in sync with the ground beneath it.
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
        T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', `
          vec3 season = seasonMix(plantRoot);
          vec2 seasonMatch = 1.-step(vec2(.5),abs(season.xy-vec2(${seasonIndex.toFixed(1)})));
          float growth = smoothstep(.40,.99,mix(seasonMatch.x,seasonMatch.y,season.z));
          ${fade ? 'vPlantGrowth = growth;' : ''}
          ${wind ? `
            float gust = sin(flowerTime * .92 + dot(plantRoot, vec2(.8, .65)));
            float height = max(mvPosition.y, 0.0);
            mvPosition.xz += vec2(gust, .65 * sin(flowerTime * .70 + plantRoot.y))
              * height * height * .29;
          ` : ''}
          vec3 anchor = vec3(plantRoot.x,0.,plantRoot.y);
          mvPosition.xyz = mix(anchor,mvPosition.xyz,growth);
          mvPosition = modelViewMatrix * mvPosition;
        `));
      if(fade){
        shader.fragmentShader='varying float vPlantGrowth;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
          #include <color_fragment>
          diffuseColor.a *= vPlantGrowth * vPlantGrowth;
        `);
      }
    };
  }
  const springStem=plantMaterial(0x42742e);
  const petalMaterial=plantMaterial(0xffffff);
  const centerMaterial=plantMaterial(0xe1b850);
  for(const material of [springStem,petalMaterial,centerMaterial])followSeason(material,0,windTime);
  const flowerCount=142;
  const stems=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),springStem,flowerCount);
  const petals=new T.InstancedMesh(new T.SphereGeometry(1,6,4),petalMaterial,flowerCount*6);
  const centers=new T.InstancedMesh(new T.SphereGeometry(.015,6,4),centerMaterial,flowerCount);
  const roots=new Float32Array(flowerCount*2);
  const petalRoots=new Float32Array(flowerCount*12);
  const colors=[0xff75a5,0xf0528f,0xac69ef,0x5899ee,0xffc934,0xff6858,0xffe8c0];
  function position(){let x,z;do{const a=random()*Math.PI*2,r=1.25+Math.sqrt(random())*3.45;x=Math.cos(a)*r;z=Math.sin(a)*r;}while(Math.hypot(x-.8,z-2.3)<.85);return [x,z];}
  for(let i=0;i<flowerCount;i++){
    const [x,z]=position(),height=.24+random()*.105;
    roots.set([x,z],i*2);
    dummy.position.set(x,height/2,z);dummy.rotation.set(0,0,0);dummy.scale.set(.006,height,.006);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<6;k++){
      petalRoots.set([x,z],(i*6+k)*2);
      const a=k/6*Math.PI*2;dummy.position.set(x+Math.cos(a)*.035,height,z+Math.sin(a)*.035);dummy.rotation.set(0,-a+Math.PI/2,0);dummy.scale.set(.028,.008,.043);dummy.updateMatrix();petals.setMatrixAt(i*6+k,dummy.matrix);petals.setColorAt(i*6+k,new T.Color(colors[i%colors.length]));
    }
    dummy.position.set(x,height+.006,z);dummy.scale.setScalar(1);dummy.updateMatrix();centers.setMatrixAt(i,dummy.matrix);
  }
  const flowerRoots=new T.InstancedBufferAttribute(roots,2);
  stems.geometry.setAttribute('plantRoot',flowerRoots);
  centers.geometry.setAttribute('plantRoot',flowerRoots);
  petals.geometry.setAttribute('plantRoot',new T.InstancedBufferAttribute(petalRoots,2));
  group.add(stems,petals,centers);
  const summerStem=plantMaterial(0x49753b);
  const puffStemCount=48;
  const puffStems=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),summerStem,puffStemCount);
  const puffRoots=new Float32Array(puffStemCount*2);
  const strands=[],tips=[],strandRoots=[],tipRoots=[];
  for(let i=0;i<puffStemCount;i++){
    const [x,z]=position(),height=.27+random()*.13;
    puffRoots.set([x,z],i*2);
    dummy.position.set(x,height/2,z);dummy.rotation.set(0,0,0);dummy.scale.set(.005,height,.005);dummy.updateMatrix();puffStems.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<34;k++){
      const a=k*2.39996,h=1-2*(k+.5)/34,r=.057;
      const end=[x+Math.cos(a)*Math.sqrt(1-h*h)*r,height+h*r,z+Math.sin(a)*Math.sqrt(1-h*h)*r];
      strands.push(x,height,z,...end);tips.push(...end);
      strandRoots.push(x,z,x,z);tipRoots.push(x,z);
    }
  }
  const strandsMaterial=new T.LineBasicMaterial({color:0xf1eee0,transparent:true,opacity:.46,depthWrite:false});
  const tipsMaterial=new T.PointsMaterial({color:0xfffaeb,size:.017,transparent:true,opacity:.65,depthWrite:false});
  const strandGeometry=new T.BufferGeometry();strandGeometry.setAttribute('position',new T.Float32BufferAttribute(strands,3));
  const tipsGeometry=new T.BufferGeometry();tipsGeometry.setAttribute('position',new T.Float32BufferAttribute(tips,3));
  puffStems.geometry.setAttribute('plantRoot',new T.InstancedBufferAttribute(puffRoots,2));
  strandGeometry.setAttribute('plantRoot',new T.Float32BufferAttribute(strandRoots,2));
  tipsGeometry.setAttribute('plantRoot',new T.Float32BufferAttribute(tipRoots,2));
  for(const material of [summerStem,strandsMaterial,tipsMaterial])followSeason(material,1);
  const puffLines=new T.LineSegments(strandGeometry,strandsMaterial),puffTips=new T.Points(tipsGeometry,tipsMaterial);
  group.add(puffStems,puffLines,puffTips);
  // A few loose stands of wheat, leaving the bench and cats clear.
  const wheatStem=new T.CylinderGeometry(.003,.0045,1,5);
  const wheatGrain=new T.SphereGeometry(1,8,6);
  const wheatPatches=[
    [-3.25,.65],[-1.85,2.47],[-.68,3.57],[2.62,2.35],
    [3.45,.73],[2.48,-2.53],[.50,-3.55],[-1.72,-2.70],
  ].map(([x,z],index)=>{
    const patch=new T.Group();
    patch.position.set(x,0,z);
    patch.visible=false;
    group.add(patch);
    const stemPaint=new T.MeshStandardMaterial({color:0xac7332,transparent:true,roughness:.9});
    const grainPaint=new T.MeshStandardMaterial({
      color:0xe4b86a,emissive:0x80501f,emissiveIntensity:.15,transparent:true,roughness:.88,
    });
    const stems=new T.InstancedMesh(wheatStem,stemPaint,9);
    const grains=new T.InstancedMesh(wheatGrain,grainPaint,72);
    patch.add(stems,grains);
    for(let i=0;i<9;i++){
      const angle=i*2.39996+index;
      const radius=.086*Math.sqrt(i);
      const x=Math.cos(angle)*radius, z=Math.sin(angle)*radius;
      const height=.34+.14*((i*.618+index*.37)%1);
      dummy.position.set(x,height/2,z);
      dummy.rotation.set(0,angle,0);
      dummy.scale.set(1,height,1);
      dummy.updateMatrix();
      stems.setMatrixAt(i,dummy.matrix);
      for(let row=0;row<4;row++){
        for(const side of [-1,1]){
          const taper=1-row*.12;
          const offset=side*.011*taper;
          dummy.position.set(x+Math.cos(angle)*offset,height-.025+row*.020,z-Math.sin(angle)*offset);
          dummy.rotation.set(0,angle,-side*.45);
          dummy.scale.set(.012*taper,.023*taper,.009);
          dummy.updateMatrix();
          grains.setMatrixAt(i*8+row*2+(side+1)/2,dummy.matrix);
        }
      }
    }
    const angle=T.MathUtils.euclideanModulo(Math.atan2(z,x)/(Math.PI*2),1);
    return {patch,angle,stemPaint,grainPaint};
  });
  const box=new T.BoxGeometry(1,1,1);
  const bowGeometry=new T.SphereGeometry(1,8,6);
  const snowmanGifts=Array.from({length:6},(_,index)=>{
    const angle=index*Math.PI/3+.17;
    const radius=.28+(index%2)*.025;
    return [Math.cos(angle)*radius,Math.sin(angle)*radius,.14+(index%3)*.028];
  });
  const giftColors=[0xb53d4d,0xe3ad45,0x397d58];
  const winterGifts=[
    [snowman.position.x,snowman.position.z,snowmanGifts],
    [2.57,2.18,[[0,0,.25],[.23,.08,.17],[.13,-.21,.16]]],
  ].map(([x,z,gifts])=>{
    const cluster=new T.Group();
    cluster.position.set(x,.058,z);
    cluster.visible=false;
    group.add(cluster);

    const papers=giftColors.map(color=>new T.MeshStandardMaterial({
      color,roughness:.82,transparent:true,
    }));
    const ribbon=new T.MeshStandardMaterial({color:0xdcb77b,roughness:.82,transparent:true});
    for(const paint of [...papers,ribbon]){
      paint.transparent=false;
      paint.alphaHash=true;
      paint.depthWrite=true;
    }
    const part=(parent,geometry,paint,x,y,z,width,height,depth)=>{
      const mesh=new T.Mesh(geometry,paint);
      mesh.position.set(x,y,z);
      mesh.scale.set(width,height,depth);
      parent.add(mesh);
      return mesh;
    };
    gifts.forEach(([dx,dz,size],index)=>{
      const gift=new T.Group();
      gift.position.set(dx,0,dz);
      gift.rotation.y=.35+index*.83;
      cluster.add(gift);
      const height=size*(index%2===0?.78:.94);
      const paper=papers[index%papers.length];
      part(gift,box,paper,0,height/2,0,size,height,size);
      const tie=index%papers.length===1?papers[0]:ribbon;
      part(gift,box,tie,0,height/2,0,size+.009,height+.009,size*.20);
      part(gift,box,tie,0,height/2,0,size*.20,height+.009,size+.009);
      for(const side of [-1,1]){
        const loop=part(gift,bowGeometry,tie,side*.027,height+.020,0,.033,.012,.012);
        loop.rotation.z=side*.40;
      }
    });
    const angle=T.MathUtils.euclideanModulo(Math.atan2(z,x)/(Math.PI*2),1);
    return {cluster,paints:[...papers,ribbon],angle};
  });
  const appleProfile=[
    [0,-.091],[.050,-.101],[.087,-.074],[.108,-.024],[.110,.033],
    [.088,.080],[.050,.094],[.018,.075],[0,.072],
  ].map(([radius,height])=>new T.Vector2(radius,height));
  const appleGeometry=new T.LatheGeometry(appleProfile,20);
  const appleLeaf=new T.SphereGeometry(1,8,5);
  const applePile=new T.Group();
  applePile.name='Autumn apple harvest';
  applePile.position.set(2.87,0,-2.21);
  group.add(applePile);
  const harvest=[
    [-.22,.108,0],[-.01,.108,.04],[.20,.108,.01],
    [-.12,.108,-.20],[.10,.108,-.19],[-.04,.108,.24],
    [-.12,.289,-.05],[.10,.287,-.035],[.01,.45,-.05],
  ].map(([x,y,z],index)=>{
    const apple=new T.Group();
    apple.position.set(x,y,z);
    apple.rotation.set(.06*(index%3-1),index*1.7,.13*(index%2?1:-1));
    applePile.add(apple);
    const skin=new T.MeshStandardMaterial({
      color:[0xc83a32,0xe49c35,0xa93135][index%3],roughness:.51,transparent:true,
    });
    const stalk=new T.MeshStandardMaterial({color:0x67432c,roughness:.9,transparent:true});
    const foliage=new T.MeshStandardMaterial({color:0x66863c,roughness:.85,transparent:true});
    apple.add(new T.Mesh(appleGeometry,skin));
    const stem=new T.Mesh(new T.CylinderGeometry(.006,.008,.054,5),stalk);
    stem.position.set(.007,.098,0);
    stem.rotation.z=-.24;
    apple.add(stem);
    const leaf=new T.Mesh(appleLeaf,foliage);
    leaf.position.set(.038,.114,0);
    leaf.scale.set(.038,.006,.015);
    leaf.rotation.z=.18;
    apple.add(leaf);
    const root=new T.Vector2(applePile.position.x+x,applePile.position.z+z);
    const angle=T.MathUtils.euclideanModulo(Math.atan2(root.y,root.x)/(Math.PI*2),1);
    return {apple,angle,paints:[skin,stalk,foliage]};
  });
  return {update(time,cycle){
    for(const {apple,angle,paints} of harvest){
      const autumn=T.MathUtils.euclideanModulo(cycle-angle,4);
      const opacity=T.MathUtils.smoothstep(autumn,2,2.045)*
        (1-T.MathUtils.smoothstep(autumn,3,3.035));
      apple.visible=opacity>.001;
      apple.scale.setScalar(.92+.08*opacity);
      for(const paint of paints){
        paint.opacity=opacity;
        paint.depthWrite=opacity>.95;
      }
    }
    for(const {cluster,paints,angle} of winterGifts){
      const winter=T.MathUtils.euclideanModulo(cycle-angle,4);
      const opacity=T.MathUtils.smoothstep(winter,3,3.10)*
        (1-T.MathUtils.smoothstep(winter,3.90,4));
      cluster.visible=opacity>.001;
      if(!cluster.visible)continue;
      for(const paint of paints){
        paint.opacity=opacity;
      }
    }
    for(const {patch,angle,stemPaint,grainPaint} of wheatPatches){
      const autumn=T.MathUtils.euclideanModulo(cycle-angle,4);
      const opacity=T.MathUtils.smoothstep(autumn,2,2.16)*
        (1-T.MathUtils.smoothstep(autumn,2.84,3));
      patch.visible=opacity>.001;
      if(!patch.visible)continue;
      stemPaint.opacity=grainPaint.opacity=opacity;
      stemPaint.depthWrite=grainPaint.depthWrite=opacity>.95;
      patch.rotation.z=.06+.065*Math.sin(time*1.45+angle*8);
    }
  }};
}
