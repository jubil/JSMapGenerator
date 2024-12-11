import * as THREE from "../libs/three/three.module.js";

export class CharacterControls {
  model;
  mixer;
  animationMap = new Map();
  orbitControl;
  camera;

  toogleRun = false;
  currentAction;

  //
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  //
  fadeDuration = 0.5;
  runVelocity = 35;
  walkVelocity = 2;

  constructor(model, mixer, animationMap, orbitControl, camera, currentAction) {
    this.model = model;
    this.mixer = mixer;
    this.animationMap = animationMap;
    this.currentAction = currentAction;
    this.animationMap.forEach((value, key) => {
      // TODO A Refacto
      if (key == currentAction) {
        value.play();
      }
    });
    this.orbitControl = orbitControl;
    this.camera = camera;
  }

  switchRunToogle = () => {
    this.toogleRun = !this.toogleRun;
  };

  directionOffset = (keysPressed) => {
    let directionOffset = 0;
    if (keysPressed["z"]) {
      if (keysPressed["q"]) {
        directionOffset = Math.PI / 4;
      } else if (keysPressed["d"]) {
        directionOffset = -Math.PI / 4;
      }
    } else if (keysPressed["s"]) {
      if (keysPressed["q"]) {
        directionOffset = Math.PI / 4 + Math.PI / 2;
      } else if (keysPressed["d"]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2;
      } else {
        directionOffset = Math.PI;
      }
    } else if (keysPressed["q"]) {
      directionOffset = Math.PI / 2;
    } else if (keysPressed["d"]) {
      directionOffset = -Math.PI / 2;
    }
    return directionOffset;
  };

  update = (delta, keysPressed) => {
    const directionPressed = ["z", "q", "s", "d"].some(
      (key) => keysPressed[key] == true
    );

    let play;
    if (directionPressed && this.toogleRun) {
      play = "Run";
    } else if (directionPressed && !this.toogleRun) {
      play = "Walk";
    } else {
      play = "Idle";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationMap.get(play);
      const current = this.animationMap.get(this.currentAction);

      current.fadeOut(this.fadeDuration);
      toPlay.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);



    let angleYCameraDirection = Math.atan2(
      this.camera.position.x - this.model.position.x,
      this.camera.position.z - this.model.position.z
    );

    // rotate model
    let direction = this.directionOffset(keysPressed)
    this.rotateQuarternion.setFromAxisAngle(
      this.rotateAngle,
      angleYCameraDirection + direction
    );
    this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);
    
    // calculate direction
    this.camera.getWorldDirection(this.walkDirection)
    this.walkDirection.y = 0
    this.walkDirection.normalize()
    this.walkDirection.applyAxisAngle(this.rotateAngle, direction)

    let velocity = 0;
    if(this.currentAction == 'Run'){
      velocity = this.runVelocity
    }else if(this.currentAction == 'Walk'){
      velocity = this.walkVelocity
    }  

    // move model
    const moveX = this.walkDirection.x * velocity * delta
    const moveZ = this.walkDirection.z * velocity * delta
    console.log(moveX, moveZ)
    
    this.model.position.x += moveX
    this.model.position.z += moveZ

    // move camera
    this.camera.position.x += moveX
    this.camera.position.z += moveZ

    // update camera target
    this.cameraTarget.x = this.model.position.x
    this.cameraTarget.y = this.model.position.y + 1.5
    this.cameraTarget.z = this.model.position.z

    this.orbitControl.target = this.cameraTarget
  };
}
