import * as THREE from "../libs/three/three.module.js";
import { OrbitControls } from "../libs/three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "../libs/three/addons/loaders/GLTFLoader.js";
import { CharacterControls } from "./CharacterControls.js";

let FOV = 80;
let VIEW_DISTANCE = 1000;
let CHARACTER_SIZE = 8;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82c8e5);

const camera = new THREE.PerspectiveCamera(
  FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  VIEW_DISTANCE
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//
/* const capsule = new THREE.Mesh(
  new THREE.CapsuleGeometry(4, 8, 2, 10),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
capsule.position.y = 4
scene.add(capsule); */

// light
const hemiLight = new THREE.HemisphereLight(0xcccccc, 0x444444, 3);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(1.5, 3, 2.5);
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

// helpers
//scene.add(new THREE.GridHelper(1000, 1000));
scene.add(new THREE.AxesHelper(50));

// Load Map
drawMap(scene, generateMapJson());

// Player
let characterControls;
new GLTFLoader().load("Soldier.glb", (gltf) => {
  const model = gltf.scene;
  /*   model.traverse(object => {
    if(object.isMesh){
      object.castShadow = true;
    }
  }) */
  scene.add(model);

  const gltfAnimations = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationMap = new Map();

  //console.log("Animations Personnage", gltfAnimations)

  gltfAnimations
    .forEach((a) => {
      animationMap.set(a.name, mixer.clipAction(a));
    });
  characterControls = new CharacterControls(
    model,
    mixer,
    animationMap,
    orbitControls,
    camera,
    "Idle"
  );
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
const clock = new THREE.Clock()
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if(characterControls){
    characterControls.update(mixerUpdateDelta, keysPressed)
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

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(Math.PI / 2);

    let material
    if(tile.biome.id == 20){
      material = new THREE.MeshStandardMaterial({
        map: textureGrass,
        //wireframe: true,
        side: THREE.BackSide,
      });
    }else if(tile.biome.id == 10){
      material = new THREE.MeshStandardMaterial({
        map: textureDirt,
        //wireframe: true,
        side: THREE.BackSide,
      });
    }else if(tile.biome.id == 0){
      material = new THREE.MeshStandardMaterial({
        map: textureWater,
        //wireframe: true,
        side: THREE.BackSide,
      });
    }
    else {
      material = new THREE.MeshStandardMaterial({
        color: tile.color,
        side: THREE.BackSide,
      });
    }
    //material.wireframe = true;
    
    const mesh = new THREE.Mesh(geometry, material);
    //mesh.position.y = tile.biome.altitude * 100 -100;

    scene.add(mesh);
  });

  // Trace les routes
  json.routes.forEach(route => {
    const hauteurRoutes = 0.01
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3( route.p1[0], hauteurRoutes, route.p1[1] ),
      new THREE.Vector3( route.p2[0], hauteurRoutes, route.p2[1] ),
      new THREE.Vector3( route.p3[0], hauteurRoutes, route.p3[1] ),
      new THREE.Vector3( route.p4[0], hauteurRoutes, route.p4[1] )
    );
    
    const points = curve.getPoints( 50 );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    const material = new THREE.LineBasicMaterial( {
      color: 0xffff00
  } );
    
    const curveObject = new THREE.Line( geometry, material );
    scene.add(curveObject)
  })

}

// TODO Remplacer bouchon. Mettre dans un autre fichier
function generateMapJson() {
  const json =
  return JSON.parse(json);
}