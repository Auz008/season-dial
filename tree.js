import * as T from './vendor/three.module.js';

// A small living tree grows out of the dial's central brass collar.
// Summer foliage, autumn apples and a snow-tipped Christmas crown share one place.
export function createSeasonalTree(world, random) {
  const root = new T.Group();
  root.name = 'The four-season gift tree';
  root.position.y = .09;
  world.add(root);
  const summer = new T.Group(), winter = new T.Group();
  root.add(summer, winter);
  const summerMaterials = [], winterMaterials = [];
  const material = (color, list, extra = {}) => {
    const m = new T.MeshStandardMaterial({ color, roughness: .86, transparent: true, ...extra });
    list.push(m);
    return m;
  };
  const bark = material(0x65432c, summerMaterials, { alphaHash: true, transparent: false });
  const pineBark = material(0x493c2b, winterMaterials, { alphaHash: true, transparent: false });
  const leafMaterial = material(0xffffff, summerMaterials, { roughness: .75, alphaHash: true, transparent: false });
  const leafWind={value:0};
  leafMaterial.onBeforeCompile=shader=>{
    shader.uniforms.leafWind=leafWind;
    shader.vertexShader='uniform float leafWind;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', `
        vec3 leaf = instanceMatrix[3].xyz;
        float gust = sin(leafWind * 1.55 + leaf.x * 2.4 + leaf.z * 1.3);
        float flutter = sin(leafWind * 3.2 + dot(leaf, vec3(13., 17., 11.)));
        mvPosition.xyz += vec3(.033 * gust, .009 * flutter, .019 * gust);
        mvPosition = modelViewMatrix * mvPosition;
      `));
  };
  function branch(parent, a, b, radius, mat) {
    const delta = new T.Vector3().subVectors(b, a);
    const mesh = new T.Mesh(new T.CylinderGeometry(radius * .60, radius, delta.length(), 7), mat);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true;
    parent.add(mesh);
  }
  branch(summer, new T.Vector3(0, 0, 0), new T.Vector3(.035, 1.85, 0), .13, bark);
  const clusters = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.39996;
    const radius = i < 8 ? .65 : .35;
    const height = 1.58 + (i % 4) * .24;
    const end = new T.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    branch(summer, new T.Vector3(0, .65 + i * .065, 0), end, .055 - i * .002, bark);
    clusters.push(end);
  }
  clusters.push(new T.Vector3(0, 2.25, 0));
  const leafCount = 1800;
  const leaves = new T.InstancedMesh(new T.SphereGeometry(1, 5, 4), leafMaterial, leafCount);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const dummy = new T.Object3D();
  const leafSeeds = [];
  for (let i = 0; i < leafCount; i++) {
    const center = clusters[i % clusters.length];
    const azimuth = random() * Math.PI * 2, h = random() * 2 - 1;
    const radius = Math.cbrt(random()) * .49;
    dummy.position.set(center.x + Math.cos(azimuth) * Math.sqrt(1 - h * h) * radius, center.y + h * radius * .70, center.z + Math.sin(azimuth) * Math.sqrt(1 - h * h) * radius);
    dummy.rotation.set(random() * 3, random() * 6, random() * 3);
    const size = .065 + random() * .045;
    dummy.scale.set(size * .58, size * 1.15, size * .22);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leafSeeds.push(random());
  }
  summer.add(leaves);

  const blossomMaterial=material(0xffd8e4,summerMaterials,{roughness:.7});
  const blossomCenterMaterial=material(0xe8c976,summerMaterials);
  const blossoms=new T.InstancedMesh(new T.SphereGeometry(1,7,5),blossomMaterial,650);
  const blossomCenters=new T.InstancedMesh(new T.SphereGeometry(.016,7,5),blossomCenterMaterial,130);
  for(let i=0;i<130;i++){
    const cluster=clusters[i%clusters.length];
    const az=random()*Math.PI*2,h=random()*1.7-.5;
    const r=.42;
    const center=new T.Vector3(cluster.x+Math.cos(az)*r,cluster.y+h*.25,cluster.z+Math.sin(az)*r);
    for(let petal=0;petal<5;petal++){
      const a=petal/5*Math.PI*2;
      dummy.position.copy(center).add(new T.Vector3(Math.cos(a)*.038,.005,Math.sin(a)*.038));
      dummy.rotation.set((random()-.5)*.3,-a+Math.PI/2,0);dummy.scale.set(.027,.013,.052);dummy.updateMatrix();blossoms.setMatrixAt(i*5+petal,dummy.matrix);
    }
    dummy.position.copy(center);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();blossomCenters.setMatrixAt(i,dummy.matrix);
  }
  summer.add(blossoms,blossomCenters);

  const appleMaterial = new T.MeshStandardMaterial({ color: 0xbb3431, roughness: .36, emissive: 0x5a1008, emissiveIntensity: .05, transparent: true });
  const appleStem = new T.MeshStandardMaterial({ color: 0x63442b, transparent: true });
  const apples = new T.Group();
  summer.add(apples);
  for (let i = 0; i < 15; i++) {
    const a = i * 2.39996;
    const fruit = new T.Group();
    fruit.position.set(Math.cos(a) * (.63 + (i % 3) * .07), 1.48 + (i % 5) * .17, Math.sin(a) * .70);
    fruit.position.y += .1475;
    const ball = new T.Mesh(new T.SphereGeometry(.095, 14, 10), appleMaterial);
    ball.position.y = -.1475;
    ball.scale.y = 1.05;
    ball.castShadow = true;
    fruit.add(ball);
    const stem = new T.Mesh(new T.CylinderGeometry(.009, .012, .075, 5), appleStem);
    stem.position.y = -.0375;
    stem.rotation.z = .18;
    fruit.add(stem);
    apples.add(fruit);
    fruit.userData.growthDelay = (4 - i % 5) * .11;
  }

  branch(winter, new T.Vector3(0, 0, 0), new T.Vector3(0, 2.53, 0), .11, pineBark);
  const pineMaterial = material(0x194a35, winterMaterials, { roughness: .95, alphaHash: true, transparent: false });
  const snowMaterial = material(0xe2edf2, winterMaterials, { roughness: 1, alphaHash: true, transparent: false });
  const branchCount = 70;
  const needles = new T.InstancedMesh(new T.ConeGeometry(1,1,3),pineMaterial,branchCount*7*8*4);
  const twigs = new T.InstancedMesh(new T.CylinderGeometry(.48,1,1,5),pineBark,branchCount*7);
  const frost = new T.InstancedMesh(new T.IcosahedronGeometry(1,1),snowMaterial,branchCount*7);
  const up = new T.Vector3(0,1,0), delta = new T.Vector3();
  const green = [new T.Color(0xb5c7a7),new T.Color(0xe3dfb4),new T.Color(0x7e9e90)];
  let needleIndex=0, twigIndex=0, frostIndex=0;

  function segment(mesh,index,start,end,width){
    delta.subVectors(end,start);
    dummy.position.copy(start).lerp(end,.5);
    dummy.scale.set(width,delta.length(),width);
    dummy.quaternion.setFromUnitVectors(up,delta.normalize());
    dummy.updateMatrix();
    mesh.setMatrixAt(index,dummy.matrix);
  }
  function shoot(start,end,width){
    segment(twigs,twigIndex++,start,end,width);
    const forward=end.clone().sub(start).normalize();
    const lateral=new T.Vector3(-forward.z,0,forward.x).normalize();
    const vertical=new T.Vector3().crossVectors(forward,lateral).normalize();
    const base=new T.Vector3(), tip=new T.Vector3();
    for(let row=0;row<8;row++){
      const along=(row+.45)/8;
      for(let n=0;n<4;n++){
        const phase=n*Math.PI/2+row*.79;
        const length=(.045+random()*.044)*(1-along*.42);
        base.copy(start).lerp(end,along+(n-1.5)*.011);
        tip.copy(base).addScaledVector(lateral,Math.cos(phase)*length)
          .addScaledVector(vertical,Math.sin(phase)*length*.72)
          .addScaledVector(forward,length*.51);
        segment(needles,needleIndex,base,tip,.005+random()*.0025);
        needles.setColorAt(needleIndex++,green[Math.floor(random()*green.length)]);
      }
    }
    if(random()<.34){
      dummy.position.copy(start).lerp(end,.35+random()*.40);
      dummy.position.y+=.035;
      dummy.rotation.set(0,Math.atan2(forward.x,forward.z),0);
      dummy.scale.set(.025+random()*.032,.012+random()*.015,.035+random()*.055);
      dummy.updateMatrix();
      frost.setMatrixAt(frostIndex++,dummy.matrix);
    }
  }
  for(let tier=0;tier<7;tier++){
    const height=.52+tier*.29;
    const radius=.96*(1-tier/8.2);
    const count=13-tier;
    for(let j=0;j<count;j++){
      const angle=j/count*Math.PI*2+tier*.46;
      const axis=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
      const across=new T.Vector3(-axis.z,0,axis.x);
      const length=radius*(.91+random()*.18)+.09;
      const start=new T.Vector3(0,height+(random()-.5)*.10,0);
      const end=start.clone().addScaledVector(axis,length);
      end.y-=.035+random()*.048;
      shoot(start,end,.019*(1-tier*.09));
      for(let k=0;k<3;k++){
        for(const side of [-1,1]){
          const base=start.clone().lerp(end,.33+k*.23+side*.033);
          const tip=base.clone().addScaledVector(axis,length*(.23-k*.033))
            .addScaledVector(across,side*length*(.24-k*.043));
          tip.y+=.025+random()*.095;
          shoot(base,tip,.008*(1-tier*.075));
        }
      }
    }
  }
  needles.count=needleIndex;
  twigs.count=twigIndex;
  frost.count=frostIndex;
  needles.castShadow=true;
  twigs.castShadow=true;
  winter.add(twigs,needles,frost);
  const baubles = [material(0xba3e32, winterMaterials, { metalness: .45, roughness: .3 }), material(0xdac18b, winterMaterials, { metalness: .6, roughness: .3 })];
  for (let i = 0; i < 21; i++) {
    const a = i * 2.39996;
    const y = .61 + (i % 7) * .25;
    const r = .93 * (1 - (y - .5) / 2.2);
    const ball = new T.Mesh(new T.SphereGeometry(.050, 10, 8), baubles[i % 2]);
    ball.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    winter.add(ball);
  }
  const lightMaterial = material(0xffe2a0, winterMaterials, { emissive: 0xffd48a, emissiveIntensity: 1.8, roughness: .3 });
  for (let i = 0; i < 43; i++) {
    const y = .51 + i / 43 * 1.85, a = i * .59;
    const r = .94 * (1 - (y - .5) / 2.25);
    const bulb = new T.Mesh(new T.SphereGeometry(.021, 6, 5), lightMaterial);
    bulb.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    winter.add(bulb);
  }
  const starShape = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? .075 : .16;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const star = new T.Mesh(new T.ExtrudeGeometry(starShape, { depth: .025, bevelEnabled: false }), lightMaterial);
  star.position.set(0, 2.56, 0);
  winter.add(star);
  // Small ornaments nest in the outer winter boughs.
  const candyWhite=material(0xf6f0e5,winterMaterials,{roughness:.35});
  const candyRed=material(0xb92e3d,winterMaterials,{roughness:.35});
  const candyCurve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,.20,0),new T.Vector3(0,.33,0),new T.Vector3(.025,.39,0),new T.Vector3(.085,.405,0),new T.Vector3(.135,.37,0),new T.Vector3(.14,.32,0)]);
  const ornamentNests=[];
  function nestOrnament(tier, branchIndex) {
    const angle = branchIndex / (13 - tier) * Math.PI * 2 + tier * .46;
    const radius = .96 * (1 - tier / 8.2) * .96 + .12;
    const nest = new T.Group();
    nest.position.set(Math.cos(angle)*radius,.52 + tier*.29 - .028,Math.sin(angle)*radius);
    nest.rotation.y = Math.PI / 2 - angle;
    winter.add(nest);
    const revealStart=.44+tier*.034+(branchIndex%3)*.026;
    ornamentNests.push({nest,revealStart});
    return nest;
  }
  const caneBranches = [[1,1],[2,3],[4,8],[5,1]];
  for (const [tier, branchIndex] of caneBranches) {
    const nest = nestOrnament(tier,branchIndex);
    const cane = new T.Group();
    cane.scale.setScalar(.60);
    cane.position.set(-.065,-.085,.055);
    cane.rotation.z=-.48;
    nest.add(cane);
    cane.add(new T.Mesh(new T.TubeGeometry(candyCurve,36,.016,7,false),candyWhite));
    for(let j=0;j<6;j++){
      const points=[];for(let k=0;k<5;k++)points.push(candyCurve.getPoint((j+.16+k*.095)/6));
      cane.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),5,.0168,7,false),candyRed));
    }
  }
  const ribbonMaterial=material(0xe6d2a0,winterMaterials,{metalness:.35,roughness:.4});
  const giftBranches = [[1,3],[2,9],[3,9],[4,0]];
  const giftColors=[0xad4652,0x4e8b7d,0xc19a5a,0x716082];
  for(let i=0;i<4;i++){
    const wrap=material(giftColors[i],winterMaterials,{roughness:.55});
    const present=new T.Group();
    const width=.24+i%2*.055,height=.21+(i%3)*.035,depth=.23;
    const box=new T.Mesh(new T.BoxGeometry(width,height,depth),wrap);box.position.y=height/2;box.castShadow=true;present.add(box);
    const lid=new T.Mesh(new T.BoxGeometry(width+.025,.035,depth+.025),wrap);lid.position.y=height+.012;present.add(lid);
    for(const [w,h,d] of [[.033,height+.05,depth+.03],[width+.03,height+.05,.033]]){const band=new T.Mesh(new T.BoxGeometry(w,h,d),ribbonMaterial);band.position.y=height/2+.006;present.add(band);}
    for(const side of [-1,1]){const bow=new T.Mesh(new T.TorusGeometry(.043,.010,6,16),ribbonMaterial);bow.position.set(side*.039,height+.052,0);bow.rotation.x=Math.PI/2;bow.rotation.y=side*.38;bow.scale.set(1.05,.70,1);present.add(bow);}

    const [tier, branchIndex] = giftBranches[i];
    const nest = nestOrnament(tier,branchIndex);
    present.scale.setScalar(.58);
    present.position.set(0,-height*.28,.045);
    present.rotation.set(.13,.22,-.13);
    nest.add(present);
  }

  const candyMint=material(0x579f89,winterMaterials,{roughness:.45});
  const sweetBody=new T.SphereGeometry(.059,12,8);
  const sweetEnd=new T.ConeGeometry(.036,.055,5);
  for(const [tier,branchIndex,paint] of [[1,5,candyRed],[3,2,candyMint],[4,5,candyRed]]){
    const nest=nestOrnament(tier,branchIndex);
    const sweet=new T.Group();
    sweet.position.set(0,.022,.058);
    sweet.rotation.z=.30;
    nest.add(sweet);
    sweet.add(new T.Mesh(sweetBody,paint));
    for(const side of [-1,1]){
      const end=new T.Mesh(sweetEnd,ribbonMaterial);
      end.position.x=side*.070;
      end.rotation.z=side*Math.PI/2;
      sweet.add(end);
    }
  }

  const charcoal=material(0x323843,winterMaterials);
  const snowball=new T.SphereGeometry(1,12,8);
  const miniCap=new T.CylinderGeometry(.037,.043,.026,12);
  for(const [tier,branchIndex] of [[1,8],[3,4]]){
    const nest=nestOrnament(tier,branchIndex);
    function ball(paint,x,y,z,radius){
      const mesh=new T.Mesh(snowball,paint);
      mesh.position.set(x,y,z);
      mesh.scale.setScalar(radius);
      nest.add(mesh);
    }
    ball(candyWhite,0,-.022,.057,.059);
    ball(candyWhite,0,.066,.066,.041);
    const cap=new T.Mesh(miniCap,charcoal);
    cap.position.set(0,.107,.066);
    cap.rotation.z=.15;
    nest.add(cap);
    for(const side of [-1,1])ball(charcoal,side*.014,.073,.103,.006);
    ball(candyRed,0,.060,.107,.009);
  }
  const leafColor = new T.Color(), baseColor = new T.Color();
  const springColor = new T.Color(0x81b749), summerColor = new T.Color(0x357537), autumnColor = new T.Color(0xba7932);
  let lastSeasonMix = -1, lastPrevious = -1;
  function opacity(list, alpha) {
    for (const m of list) { m.opacity = alpha; m.depthWrite = m.alphaHash || alpha > .96; }
  }
  return {
    update(time, cycle) {
      leafWind.value=time;
      const previous = ((Math.floor(cycle) - 1) % 4 + 4) % 4;
      const next = (previous + 1) % 4;
      const f = T.MathUtils.smoothstep(cycle % 1, .06, .94);
      const weights = [0, 0, 0, 0];
      weights[previous] = 1 - f;
      weights[next] = f;
      const winterWeight = weights[3];
      const thawing = previous === 3 && next === 0;
      const freezing = previous === 2 && next === 3;
      const thaw = weights[0];
      const needles = thawing ? 1 - T.MathUtils.smoothstep(thaw,.28,.79)
        : freezing ? T.MathUtils.smoothstep(f,.23,.84) : winterWeight;
      const newLeaves = thawing ? T.MathUtils.smoothstep(thaw,.22,.82)
        : freezing ? 1 - T.MathUtils.smoothstep(f,.08,.65) : 1 - winterWeight;
      const trunk = thawing ? T.MathUtils.smoothstep(thaw,.30,.67)
        : freezing ? 1 - T.MathUtils.smoothstep(f,.34,.73) : 1 - winterWeight;
      const flowers = thawing ? T.MathUtils.smoothstep(thaw,.60,.99)
        : previous === 0 && next === 1 ? 1 - T.MathUtils.smoothstep(f,.12,.65) : weights[0];
      const ornaments = thawing ? 1 - T.MathUtils.smoothstep(thaw,.04,.40)
        : freezing ? T.MathUtils.smoothstep(f,.36,.87) : winterWeight;

      for(const {nest,revealStart} of ornamentNests){
        const reveal=freezing ? T.MathUtils.smoothstep(f,revealStart,revealStart+.26) : ornaments;
        nest.visible=reveal>.003;
        nest.scale.setScalar(reveal);
      }

      opacity(summerMaterials, newLeaves);
      opacity(winterMaterials, ornaments);
      opacity([pineMaterial], needles);
      opacity([snowMaterial], thawing ? 1 - T.MathUtils.smoothstep(thaw,.12,.56)
        : freezing ? T.MathUtils.smoothstep(f,.44,.91) : winterWeight);
      opacity([bark], trunk);
      opacity([pineBark], 1 - trunk);
      opacity([blossomMaterial, blossomCenterMaterial], flowers);
      blossoms.visible = blossomCenters.visible = flowers > .003;
      summer.visible = Math.max(newLeaves, trunk, flowers) > .003;
      winter.visible = Math.max(needles, 1 - trunk, snowMaterial.opacity, ornaments) > .003;

      const autumnGrowth = weights[2];
      apples.visible = autumnGrowth > .001;
      opacity([appleMaterial, appleStem], freezing ? 1 - T.MathUtils.smoothstep(f,.04,.52) : 1);
      for (const fruit of apples.children) {
        const start = .10 + fruit.userData.growthDelay;
        const size = freezing ? 1 : T.MathUtils.smoothstep(autumnGrowth,start,start+.40);
        fruit.visible = size > .001;
        fruit.scale.setScalar(size);
      }
      root.rotation.z = Math.sin(time * Math.PI / 10) * .009;
      summer.scale.setScalar(1 + weights[1] * .045);
      lightMaterial.emissiveIntensity = 1.25 + Math.sin(time * Math.PI / 10) * .20;
      const state = weights[0] + weights[1] * 10 + weights[2] * 100;
      if (previous !== lastPrevious || Math.abs(state - lastSeasonMix) > .02) {
        const total = Math.max(.001, 1 - winterWeight);
        baseColor.setRGB(
          (springColor.r * weights[0] + summerColor.r * weights[1] + autumnColor.r * weights[2]) / total,
          (springColor.g * weights[0] + summerColor.g * weights[1] + autumnColor.g * weights[2]) / total,
          (springColor.b * weights[0] + summerColor.b * weights[1] + autumnColor.b * weights[2]) / total);
        for (let i = 0; i < leafCount; i++) {
          if (previous === 1 && next === 2) {
            // Sun-exposed clusters turn first, with small variations within each cluster.
            const cluster = clusters[i % clusters.length];
            const delay = .25 * (1 - (cluster.y - 1.58) / .72) + leafSeeds[i] * .12;
            leafColor.copy(summerColor).lerp(autumnColor,T.MathUtils.smoothstep(f,delay,delay+.60));
          } else {
            leafColor.copy(baseColor);
          }
          leafColor.multiplyScalar(.65 + leafSeeds[i] * .55);
          leaves.setColorAt(i, leafColor);
        }
        leaves.instanceColor.needsUpdate = true;
        lastSeasonMix = state;
        lastPrevious = previous;
      }
      return weights;
    },
  };
}
