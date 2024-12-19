import * as THREE from "../libs/three/three.module.js";
import { OrbitControls } from "../libs/three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "../libs/three/addons/loaders/GLTFLoader.js";
import { CharacterControls } from "./CharacterControls.js";
import { MapGenerator } from "./MapGenerator.js";

import { VOXLoader, VOXMesh } from "../libs/three/addons/loaders/VOXLoader.js";

let FOV = 80;
let VIEW_DISTANCE = 1000;

const scene = new THREE.Scene();
//scene.background = new THREE.Color(0x82c8e5);
scene.fog = new THREE.Fog(0xcccccc, 50, 900);

const camera = new THREE.PerspectiveCamera(
  FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  VIEW_DISTANCE
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// light
scene.add(new THREE.HemisphereLight(0xfbfdd3, 0x444444, 1.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(500, 15, 500);
dirLight.rotateX(60);
scene.add(dirLight);

// sky
const textureCiel = new THREE.TextureLoader().load("textures/sky.jpg");
textureCiel.wrapS = THREE.RepeatWrapping;
textureCiel.wrapT = THREE.RepeatWrapping;
textureCiel.repeat.set(1, 1);
const sphereCiel = new THREE.Mesh(
  new THREE.SphereGeometry(VIEW_DISTANCE - 50, 3, 3),
  new THREE.MeshBasicMaterial({
    map: textureCiel,
    side: THREE.BackSide,
  })
);
scene.add(sphereCiel);

// Textures biomes
const textureGrass = new THREE.TextureLoader().load("textures/grass.jpg");
textureGrass.wrapS = THREE.RepeatWrapping;
textureGrass.wrapT = THREE.RepeatWrapping;
textureGrass.repeat.set(0.8, 0.8);

const textureWater = new THREE.TextureLoader().load("textures/water.jpg");
textureWater.wrapS = THREE.RepeatWrapping;
textureWater.wrapT = THREE.RepeatWrapping;
textureWater.repeat.set(0.8, 0.8);

const textureDirt = new THREE.TextureLoader().load("textures/dirt.jpg");
textureDirt.wrapS = THREE.RepeatWrapping;
textureDirt.wrapT = THREE.RepeatWrapping;
textureDirt.repeat.set(0.8, 0.8);

const textureCobble = new THREE.TextureLoader().load("textures/cobble.png");
textureCobble.wrapS = THREE.RepeatWrapping;
textureCobble.wrapT = THREE.RepeatWrapping;
textureCobble.repeat.set(0.5, 0.5);

// helpers
//scene.add(new THREE.GridHelper(1000, 1000));
scene.add(new THREE.AxesHelper(50));

// Load Map
drawMap(scene, generateMapJson());

// Player
let characterControls;
let playerModel;
new GLTFLoader().load("Soldier.glb", (gltf) => {
  playerModel = gltf.scene;
  scene.add(playerModel);

  const gltfAnimations = gltf.animations;
  const mixer = new THREE.AnimationMixer(playerModel);
  const animationMap = new Map();

  gltfAnimations.forEach((a) => {
    animationMap.set(a.name, mixer.clipAction(a));
  });
  characterControls = new CharacterControls(
    playerModel,
    mixer,
    animationMap,
    orbitControls,
    camera,
    scene,
    "Idle"
  );

  // Commencer au milieu de la map
  playerModel.position.x = 500;
  playerModel.position.z = 500;
});

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 3;
orbitControls.maxDistance = 15;
orbitControls.enablePan = true;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

const keysPressed = {};
document.addEventListener(
  "keydown",
  (e) => {
    if (e.shiftKey && characterControls) {
      characterControls.switchRunToogle();
    } else if (e.key == "b") {
      // Build button
      spawnBatiment(playerModel.position);
    } else {
      keysPressed[e.key.toLocaleLowerCase()] = true;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (e) => {
    keysPressed[e.key.toLocaleLowerCase()] = false;
  },
  false
);

// UPDATE METHODE
const clock = new THREE.Clock();
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, keysPressed);
  }

  sphereCiel.position.x = camera.position.x;
  sphereCiel.position.y = camera.position.y;
  sphereCiel.position.z = camera.position.z;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// Création du rendu de la Map
function drawMap(scene, json) {
  console.log("drawMap()", json);
  json.tiles.forEach((tile) => {
    const shape = new THREE.Shape();
    shape.moveTo(tile.sommets[0][0], tile.sommets[0][1]);

    tile.sommets.forEach((sommet) => {
      shape.lineTo(sommet[0], sommet[1]);
    });

    const extrudeSettings = {
      //steps: 2,
      depth: 50,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);

    let material;
    if (tile.biome.id == 20) {
      material = new THREE.MeshStandardMaterial({
        map: textureGrass,
        //wireframe: true,
        side: THREE.FrontSide,
      });
    } else if (tile.biome.id == 10) {
      material = new THREE.MeshStandardMaterial({
        map: textureDirt,
        //wireframe: true,
        side: THREE.FrontSide,
      });
    } else if (tile.biome.id == 0) {
      material = new THREE.MeshStandardMaterial({
        map: textureWater,
        //wireframe: true,
        side: THREE.FrontSide,
      });
    } else if (tile.biome.id == 21) {
      material = new THREE.MeshStandardMaterial({
        map: textureCobble,
        side: THREE.FrontSide,
        //transparent: true,
        //opacity: 0.4
        //wireframe: true
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: tile.color,
        side: THREE.FrontSide,
        //wireframe: true,
      });
    }
    //material.wireframe = true;

    const mesh = new THREE.Mesh(geometry, material);
    //mesh.position.y = tile.biome.altitude * 100 -100;

    // Test élévation montagnes
    if (tile.biome.id == 10) {
      mesh.position.y = tile.biome.altitude * 25;
    } else if (tile.biome.id >= 11 && tile.biome.id <= 12) {
      mesh.position.y = tile.biome.altitude * 30;
    } else if (tile.biome.id == 0) {
      mesh.position.y = 0;
    } else {
      mesh.position.y = tile.biome.altitude * 5;
    }

    scene.add(mesh);
  });

  // Trace les routes
  json.tiles.forEach((t) => {
    t.routes.forEach((route) => {
      const hauteurRoutes = 0.02;
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(
          route.p1[0],
          t.biome.altitude * 5 + hauteurRoutes,
          route.p1[1]
        ),
        new THREE.Vector3(
          route.p2[0],
          t.biome.altitude * 5 + hauteurRoutes,
          route.p2[1]
        ),
        new THREE.Vector3(
          route.p3[0],
          t.biome.altitude * 5 + hauteurRoutes,
          route.p3[1]
        ),
        new THREE.Vector3(
          route.p4[0],
          t.biome.altitude * 5 + hauteurRoutes,
          route.p4[1]
        )
      );

      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: 0xffff00,
      });

      const curveObject = new THREE.Line(geometry, material);
      scene.add(curveObject);
    });
  });

  // WIP Place les batiments
  json.tiles.forEach((t) => {
    t.building.forEach((b) => {
      //console.log(b)
      // TODO Magic number : t.biome.altitude est normalisé. 5 est le multiplicateur d'altitude du biome de plaine
      spawnBatiment(
        new THREE.Vector3(b.center[0], t.biome.altitude * 5, b.center[1])
      );
    });
  });
}

// TODO Remplacer bouchon. Mettre dans un autre fichier
function generateMapJson() {
  return JSON.parse(new MapGenerator().generate());
}

// DEBUG
function spawnBatiment(position) {
  const loader = new VOXLoader();

  let meshVOX;
  //loader.load("vox/0.vox", function (chunks) {
  loader.load("vox/town_center_0.vox", function (chunks) {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      meshVOX = new VOXMesh(chunk);

      const scale = 0.15;
      const rotation = Math.random() * Math.PI * 2;
      meshVOX.scale.setScalar(scale);

      meshVOX.position.x = position.x;
      meshVOX.position.y = position.y + (chunk.size.z / 2) * scale;
      meshVOX.position.z = position.z;

      meshVOX.rotateY(rotation);
      scene.add(meshVOX);
      
      // hitbox
/*       const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(chunk.size.x, 1, chunk.size.y + 2),
        new THREE.MeshStandardMaterial({
          color: "#ffffff",
        })
      );
      hitbox.scale.setScalar(scale);
      hitbox.position.x = position.x;
      hitbox.position.y = position.y + scale / 2;
      hitbox.position.z = position.z;
      hitbox.rotateY(rotation);
      scene.add(hitbox); */ 
      //console.log(hitbox)
      
/*       let coins = [
        new THREE.Vector2( chunk.size.x * scale/2, chunk.size.y * scale/2),
        new THREE.Vector2( -chunk.size.x * scale/2, chunk.size.y * scale/2),
        new THREE.Vector2( chunk.size.x * scale/2, -chunk.size.y * scale/2),
        new THREE.Vector2( -chunk.size.x * scale/2, -chunk.size.y * scale/2),
      ]
      coins.forEach((c) => {
        c.rotateAround(new THREE.Vector2(0,0), -rotation).add(new THREE.Vector2( position.x, position.z ))
        //c.applyAxisAngle(new THREE.Vector3(0,1,0), rotation)
        //c.add(new THREE.Vector2( position.x, position.z ))
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshStandardMaterial({
          color: "#ffff00",
        }));
        mesh.position.x = c.x
        mesh.position.y = position.y + scale
        mesh.position.z = c.y
        scene.add(mesh)
      }) */
      //console.log(coins)

      
    }
  });
}
