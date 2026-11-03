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
  const bark = material(0x65432c, summerMaterials);
  const pineBark = material(0x493c2b, winterMaterials);
  const leafMaterial = material(0xffffff, summerMaterials, { roughness: .75 });
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
    const ball = new T.Mesh(new T.SphereGeometry(.095, 14, 10), appleMaterial);
    ball.scale.y = 1.05;
    ball.castShadow = true;
    fruit.add(ball);
    const stem = new T.Mesh(new T.CylinderGeometry(.009, .012, .075, 5), appleStem);
    stem.position.y = .11;
    stem.rotation.z = .18;
    fruit.add(stem);
    apples.add(fruit);
  }

  branch(winter, new T.Vector3(0, 0, 0), new T.Vector3(0, 2.53, 0), .11, pineBark);
  const pineMaterial = material(0x194a35, winterMaterials, { roughness: .95 });
  const snowMaterial = material(0xe2edf2, winterMaterials, { roughness: 1 });
  const sprayGeometry = new T.SphereGeometry(1, 12, 8);
  const sprays = new T.InstancedMesh(sprayGeometry, pineMaterial, 500);
  const snow = new T.InstancedMesh(sprayGeometry, snowMaterial, 230);
  sprays.castShadow = true;
  let sprayIndex = 0, snowIndex = 0;
  for (let tier = 0; tier < 7; tier++) {
    const y = .52 + tier * .29;
    const radius = .96 * (1 - tier / 8.2);
    const branches = 13 - tier;
    for (let j = 0; j < branches; j++) {
      const angle = j / branches * Math.PI * 2 + tier * .46;
      for (let k = 0; k < 5; k++) {
        const r = radius * (.25 + k * .16);
        dummy.position.set(Math.cos(angle) * r, y + .07 - k * .028, Math.sin(angle) * r);
        dummy.rotation.set(0, -angle + Math.PI / 2, (random() - .5) * .15);
        dummy.scale.set(.105 + radius * .06, .075, .17 + radius * .14);
        dummy.updateMatrix();
        sprays.setMatrixAt(sprayIndex++, dummy.matrix);
        if ((j + k + tier) % 2 === 0 && snowIndex < 230) {
          dummy.position.y += .066;
          dummy.scale.y = .024;
          dummy.scale.x *= .60;
          dummy.updateMatrix();
          snow.setMatrixAt(snowIndex++, dummy.matrix);
        }
      }
    }
  }
  sprays.count = sprayIndex;
  snow.count = snowIndex;
  winter.add(sprays, snow);
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
  // Small striped candy canes and wrapped gifts belong only to winter.
  const candyWhite=material(0xf6f0e5,winterMaterials,{roughness:.35});
  const candyRed=material(0xb92e3d,winterMaterials,{roughness:.35});
  const candyCurve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,.20,0),new T.Vector3(0,.33,0),new T.Vector3(.025,.39,0),new T.Vector3(.085,.405,0),new T.Vector3(.135,.37,0),new T.Vector3(.14,.32,0)]);
  for(let i=0;i<6;i++){
    const cane=new T.Group();const y=.65+(i%4)*.34,a=i*2.39996;
    const r=.99*(1-(y-.5)/2.35);
    cane.position.set(Math.cos(a)*r,y,Math.sin(a)*r);cane.rotation.y=-a;cane.rotation.z=(i%2?-.12:.12);
    cane.add(new T.Mesh(new T.TubeGeometry(candyCurve,36,.016,7,false),candyWhite));
    for(let j=0;j<6;j++){
      const points=[];for(let k=0;k<5;k++)points.push(candyCurve.getPoint((j+.16+k*.095)/6));
      cane.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),5,.0168,7,false),candyRed));
    }
    winter.add(cane);
  }
  const ribbonMaterial=material(0xe6d2a0,winterMaterials,{metalness:.35,roughness:.4});
  const giftColors=[0xad4652,0x4e8b7d,0xc19a5a,0x716082];
  for(let i=0;i<4;i++){
    const wrap=material(giftColors[i],winterMaterials,{roughness:.55});
    const present=new T.Group();
    const positions=[[-.72,.83],[.76,.65],[-1.02,.03],[.26,1.04]];
    present.position.set(positions[i][0],.045,positions[i][1]);present.rotation.y=i*.43;
    const width=.24+i%2*.055,height=.21+(i%3)*.035,depth=.23;
    const box=new T.Mesh(new T.BoxGeometry(width,height,depth),wrap);box.position.y=height/2;box.castShadow=true;present.add(box);
    const lid=new T.Mesh(new T.BoxGeometry(width+.025,.035,depth+.025),wrap);lid.position.y=height+.012;present.add(lid);
    for(const [w,h,d] of [[.033,height+.05,depth+.03],[width+.03,height+.05,.033]]){const band=new T.Mesh(new T.BoxGeometry(w,h,d),ribbonMaterial);band.position.y=height/2+.006;present.add(band);}
    for(const side of [-1,1]){const bow=new T.Mesh(new T.TorusGeometry(.043,.010,6,16),ribbonMaterial);bow.position.set(side*.039,height+.052,0);bow.rotation.x=Math.PI/2;bow.rotation.y=side*.38;bow.scale.set(1.05,.70,1);present.add(bow);}
    winter.add(present);
  }
  const leafColor = new T.Color(), baseColor = new T.Color();
  const springColor = new T.Color(0x81b749), summerColor = new T.Color(0x357537), autumnColor = new T.Color(0xba7932);
  let lastSeasonMix = -1;
  function opacity(list, alpha) {
    for (const m of list) { m.opacity = alpha; m.depthWrite = alpha > .96; }
  }
  return {
    update(time, cycle) {
      const previous = ((Math.floor(cycle) - 1) % 4 + 4) % 4;
      const next = (previous + 1) % 4;
      const changesShape = previous === 3 || next === 3;
      const f = T.MathUtils.smoothstep(cycle % 1, changesShape ? .44 : .12, changesShape ? .56 : .88);
      const weights = [0, 0, 0, 0];
      weights[previous] = 1 - f;
      weights[next] = f;
      const winterWeight = weights[3];
      opacity(summerMaterials, 1 - winterWeight);
      opacity(winterMaterials, winterWeight);
      blossomMaterial.opacity=weights[0]*.95;blossomCenterMaterial.opacity=weights[0];blossoms.visible=blossomCenters.visible=weights[0]>.01;
      summer.visible = winterWeight < .995;
      winter.visible = winterWeight > .005;
      apples.visible = weights[2] > .015;
      appleMaterial.opacity = weights[2];
      appleStem.opacity = weights[2];
      const scale = .55 + weights[2] * .45;
      apples.scale.setScalar(scale);
      root.rotation.z = Math.sin(time * Math.PI / 10) * .012;
      summer.scale.setScalar(1 + weights[1] * .045);
      lightMaterial.emissiveIntensity = 1.25 + Math.sin(time * Math.PI / 10) * .20;
      const state = weights[0] + weights[1] * 10 + weights[2] * 100;
      if (Math.abs(state - lastSeasonMix) > .02) {
        const total = Math.max(.001, 1 - winterWeight);
        baseColor.setRGB(
          (springColor.r * weights[0] + summerColor.r * weights[1] + autumnColor.r * weights[2]) / total,
          (springColor.g * weights[0] + summerColor.g * weights[1] + autumnColor.g * weights[2]) / total,
          (springColor.b * weights[0] + summerColor.b * weights[1] + autumnColor.b * weights[2]) / total);
        for (let i = 0; i < leafCount; i++) {
          leafColor.copy(baseColor);
          leafColor.multiplyScalar(.65 + leafSeeds[i] * .55);
          leaves.setColorAt(i, leafColor);
        }
        leaves.instanceColor.needsUpdate = true;
        lastSeasonMix = state;
      }
      return weights;
    },
  };
}
