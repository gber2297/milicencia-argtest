/** Estado en memoria para health / jobs (MVP). En producción: Redis o cola. */

let renderBusy = false

export function setRenderBusy(busy: boolean) {
  renderBusy = busy
}

export function getRenderBusy() {
  return renderBusy
}
