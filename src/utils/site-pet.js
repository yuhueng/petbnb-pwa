export function createSitePet(gfx) {
  if (!gfx) {
    gfx = '/images/dogs-spritesheet.png';
  }

  const ANI = {
    IDEL1: 0,
    IDEL2: 1,
    IDEL3: 2,
    RIGHT: 3,
    DOWN: 4,
    LEFT: 5,
    UP: 6,
    PET: 7,
    SLEEP: 8
  };

  var ele = document.createElement("div");

  ele.style.position = 'absolute';
  ele.style.width = '64px';
  ele.style.height = '64px';
  ele.style.zIndex = '100';
  ele.style.imageRendering = 'pixelated'; // Prevent blurry sprite
  //ele.style.backgroundColor = '#f0f';
  ele.style.backgroundImage = `url(${gfx})`;
  ele.style.backgroundRepeat = 'no-repeat';
  ele.style.backgroundPosition = '0px 0px';
  ele.style.backgroundSize = '512px 576px'; // 8 frames × 64px = 512px, 9 animations × 64px = 576px

  document.body.appendChild(ele);

  const MaxFrame = 8;
  var anim = 0;
  var frame = 0;
  var sleep = 0;
  var x = 0;
  var moving = false;
  var y = 0;

  ele.style.top = `${y}px`;
  ele.style.left = `${x}px`;
  ele.style.transition = 'top 1500ms linear, left 1500ms linear';

  // Function to initialize position to middle (will be called after moving to container)
  ele.initPosition = function() {
    if (this.parentElement && this.parentElement !== document.body) {
      x = Math.floor((this.parentElement.offsetWidth - 64) / 2);
      y = Math.floor((this.parentElement.offsetHeight - 64) / 2);
      this.style.top = `${y}px`;
      this.style.left = `${x}px`;
    }
  };

  var setAnim = (a) => {
    frame = 0;
    anim = a;
  };

  var update = () => {
    let bgX = -64 * frame;
    let bgY = -64 * anim;
    let pos = `${bgX}px ${bgY}px `;
    ele.style.backgroundPosition = pos;
    frame += 1;
    if (frame >= MaxFrame) {
      if (sleep > 0) {
        sleep -= 1;
        moving = false;
        setAnim(ANI.SLEEP);
      } else {
        // Random action selector: 0-8 = movement (90%), 9 = idle (10%)
        let action = Math.round(Math.random() * 100000) % 10;

        if (action >= 9) {
          // Idle animations (10% chance) - randomly choose IDEL1 or IDEL2 only (IDEL3 = 0%)
          let idleChoice = Math.round(Math.random() * 100000) % 2;
          let a = idleChoice; // 0 = IDEL1, 1 = IDEL2 (no IDEL3)
          moving = false;
          setAnim(a);
        } else {
          // Movement (90% chance)
          // Within movement: 0-8 = left/right (90%), 9 = up/down (10%)
          let d = Math.round(Math.random() * 100000) % 10;
          let sx = 0;
          let sy = 0;
          let a = null;

          if (d >= 9) {
            // up or down (10% of movements)
            if (Math.random() > 0.5) {
              a = ANI.UP;
              sy = -64;
            } else {
              a = ANI.DOWN;
              sy = 64;
            }
          } else {
            // left or right (90% of movements)
            if (d % 2 == 0) {
              a = ANI.RIGHT;
              sx = 64;
            } else {
              a = ANI.LEFT;
              sx = -64;
            }
          }

          // Check boundaries and adjust direction if needed
          if (x <= 0) {
            sx = 64;
            sy = 0;
            a = ANI.RIGHT;
          } else if (x >= (ele.parentElement.offsetWidth - 64)) {
            sx = -64;
            sy = 0;
            a = ANI.LEFT;
          } else if (y <= 0) {
            sy = 64;
            sx = 0;
            a = ANI.DOWN;
          } else if (y >= (ele.parentElement.offsetHeight - 64)) {
            sy = -64;
            sx = 0;
            a = ANI.UP;
          }

          x += sx;
          y += sy;
          moving = true;
          ele.style.top = `${y}px`;
          ele.style.left = `${x}px`;
          setAnim(a);
        }
      }
    }
    if ((!moving) && (sleep <= 0) && (anim != ANI.PET)) {
      ele.style.cursor = 'pointer';
    } else {
      ele.style.cursor = 'default';
    }
  };
  setInterval(update, 300); // Slower animation: 300ms per frame

  var click = () => {
    if ((!moving) && (sleep <= 0) && (anim != ANI.PET)) {
      setAnim(ANI.PET);
    }
  };
  ele.addEventListener('click', click);

  return ele;
}
