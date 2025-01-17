window.addEventListener("gamepadconnected", (e) => {
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      e.gamepad.index,
      e.gamepad.id,
      e.gamepad.buttons.length,
      e.gamepad.axes.length,
    );
    console.log(e.gamepad)
  });

function gameLoop() {
    const manette = navigator.getGamepads().filter(gp => gp != null)[0]
    if(manette){
        const buttonPressed = manette.buttons.map((b, i) => {
            return {idButton: i, value: b.value}
        }).filter(b => b.value > 0)
        if(buttonPressed.length > 0){
            console.table(buttonPressed)
        }
        const offset = 0.1
        const axes = []
        manette.axes.forEach((x, i) => {
            if(x < offset && x > -offset){
                axes[i] = 0
            }else {
                axes[i] = x
            }
        })
        console.log(axes)
    }
    setTimeout(() => {
        gameLoop()
    }, 1000/60);
}
gameLoop()
