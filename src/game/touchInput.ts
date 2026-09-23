/** Mutable shared touch-control state, polled by the Phaser scene every frame. */
export const touchInput = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressedAt: 0,
  firePressedAt: 0,
};

export function setTouchDirection(dir: 'left' | 'right', active: boolean) {
  touchInput[dir] = active;
}

export function pressTouchJump() {
  touchInput.jumpHeld = true;
  touchInput.jumpPressedAt = performance.now();
}

export function releaseTouchJump() {
  touchInput.jumpHeld = false;
}

export function pressTouchFire() {
  touchInput.firePressedAt = performance.now();
}
