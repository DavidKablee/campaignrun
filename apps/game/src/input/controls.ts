import { Btn } from '@cr/sim';

export class InputController {
  private bits = 0;
  private tapPulse = 0;
  private perkPulse = 0;
  private el: HTMLElement | null = null;
  private startX = 0;
  private startY = 0;
  private tracking = false;

  attach(el: HTMLElement) {
    this.el = el;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.el) {
      this.el.removeEventListener('pointerdown', this.onPointerDown);
      this.el.removeEventListener('pointermove', this.onPointerMove);
      this.el.removeEventListener('pointerup', this.onPointerUp);
      this.el.removeEventListener('pointercancel', this.onPointerUp);
    }
  }

  setGas(on: boolean) {
    if (on) this.bits |= Btn.Gas;
    else this.bits &= ~Btn.Gas;
  }

  setBrake(on: boolean) {
    if (on) this.bits |= Btn.Brake;
    else this.bits &= ~Btn.Brake;
  }

  setHorn(on: boolean) {
    if (on) this.bits |= Btn.Horn;
    else this.bits &= ~Btn.Horn;
  }

  pulseTap() {
    this.tapPulse = 2;
  }

  pulsePerk() {
    this.perkPulse = 2;
  }

  /** Consume one frame of input (edge bits included). */
  sample(): number {
    let out = this.bits;
    if (this.tapPulse > 0) {
      out |= Btn.Tap;
      this.tapPulse--;
    }
    if (this.perkPulse > 0) {
      out |= Btn.Perk;
      this.perkPulse--;
    }
    // Clear edge lane/hop after sample? No — sim is edge-triggered via prevInput.
    // Clear swipe-one-shots after a short hold so rising edge fires once.
    return out;
  }

  /** Clear Left/Right/Up after they have been held one tick (swipe one-shots). */
  postSampleClear() {
    this.bits &= ~(Btn.Left | Btn.Right | Btn.Up);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.bits |= Btn.Left;
    if (e.key === 'ArrowRight' || e.key === 'd') this.bits |= Btn.Right;
    if (e.key === ' ' || e.key === 'w') this.bits |= Btn.Up;
    if (e.key === 'ArrowUp') this.bits |= Btn.Gas;
    if (e.key === 'ArrowDown' || e.key === 's') this.bits |= Btn.Brake;
    if (e.key === 'h') this.bits |= Btn.Horn;
    if (e.key === 'j') this.pulseTap();
    if (e.key === 'k') this.pulsePerk();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.bits &= ~Btn.Left;
    if (e.key === 'ArrowRight' || e.key === 'd') this.bits &= ~Btn.Right;
    if (e.key === ' ' || e.key === 'w') this.bits &= ~Btn.Up;
    if (e.key === 'ArrowUp') this.bits &= ~Btn.Gas;
    if (e.key === 'ArrowDown' || e.key === 's') this.bits &= ~Btn.Brake;
    if (e.key === 'h') this.bits &= ~Btn.Horn;
  };

  private onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest?.('button, a, input, [data-control]')) return;
    this.tracking = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.el?.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.tracking) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const thresh = 40;
    if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.bits |= Btn.Right;
        else this.bits |= Btn.Left;
      } else if (dy < 0) {
        this.bits |= Btn.Up;
      }
      this.tracking = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      if (navigator.vibrate) navigator.vibrate(8);
    }
  };

  private onPointerUp = () => {
    this.tracking = false;
  };
}
