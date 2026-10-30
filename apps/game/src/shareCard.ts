export interface ShareCardInput {
  crowd: number;
  starLabel: string;
  rideName: string;
  contenderName: string;
  stateName: string;
  /** Party accent colour (hex). Defaults to danfo yellow. */
  partyColor?: string;
  /** Party short name / abbreviation for the card header. */
  partyName?: string;
}

/** Build a ~5:6 WhatsApp / feed friendly PNG: the whole card is visible in the result-screen preview. */
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const w = 1080;
  const h = 1300;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // The two UI faces may still be loading on a first run; draw with them, not the fallback.
  try {
    await Promise.all([document.fonts.load('96px "Archivo Black"'), document.fonts.load('600 36px "DM Sans"')]);
  } catch {
    /* fall back to the system faces */
  }

  const accent = input.partyColor ?? '#f5c518';
  const ink = '#0b1220';
  const cream = '#f7f1e3';

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1b2a4a');
  grad.addColorStop(0.6, ink);
  grad.addColorStop(1, ink);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Danfo checker band across the top.
  for (let i = 0; i < w / 60; i++) {
    ctx.fillStyle = i % 2 === 0 ? accent : ink;
    ctx.fillRect(i * 60, 0, 60, 24);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = accent;
  ctx.font = '96px "Archivo Black", sans-serif';
  ctx.fillText('CAMPAIGNER', 64, 156);

  // Contender pill (top right of the title row), only when the player consented to share it.
  if (input.partyName) {
    ctx.font = '30px "Archivo Black", sans-serif';
    const label = input.partyName.toUpperCase();
    const pw = Math.min(360, ctx.measureText(label).width + 56);
    ctx.fillStyle = accent;
    roundRect(ctx, w - 64 - pw, 196, pw, 56, 28);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.fillText(label, w - 64 - pw / 2, 235, pw - 32);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = 'rgba(247,241,227,0.78)';
  ctx.font = '600 38px "DM Sans", sans-serif';
  ctx.fillText(`${input.stateName.toUpperCase()} · ${input.rideName}`, 64, 232, input.partyName ? w - 520 : w - 128);

  // Road panel with the convoy bus.
  drawRoadPanel(ctx, 64, 290, w - 128, 380, accent);

  // Tier, then the number the whole card is for.
  ctx.fillStyle = accent;
  ctx.font = '48px "Archivo Black", sans-serif';
  ctx.fillText(input.starLabel.toUpperCase(), 64, 770);

  ctx.fillStyle = cream;
  ctx.font = '230px "Archivo Black", sans-serif';
  ctx.fillText(String(input.crowd), 56, 985, w - 112);

  ctx.fillStyle = 'rgba(247,241,227,0.78)';
  ctx.font = '600 42px "DM Sans", sans-serif';
  ctx.fillText(`Crowd · ${input.contenderName}`, 64, 1062, w - 128);

  // The ask.
  ctx.fillStyle = cream;
  roundRect(ctx, 64, 1130, w - 128, 112, 56);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = '36px "Archivo Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Beat my run on the same road', w / 2, 1200, w - 200);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('share blob failed'))), 'image/png');
  });
}

/** A dark road in perspective with a dashed centre line and the convoy bus. */
function drawRoadPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 32);
  ctx.clip();
  ctx.fillStyle = '#22335a';
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  ctx.fillStyle = '#0c1527';
  ctx.beginPath();
  ctx.moveTo(cx - 70, y);
  ctx.lineTo(cx + 70, y);
  ctx.lineTo(x + w - 40, y + h);
  ctx.lineTo(x + 40, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(247,241,227,0.5)';
  for (let i = 0; i < 4; i++) {
    const t = i / 5;
    const dw = 6 + t * 16;
    const dh = 14 + t * 46;
    ctx.fillRect(cx - dw / 2, y + 20 + t * (h - 60), dw, dh);
  }

  // Bus, front-on.
  const bw = 330;
  const bh = 190;
  const bx = cx - bw / 2;
  const by = y + h - bh - 70;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, by + bh + 30, bw * 0.55, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, bx, by, bw, bh, 36);
  ctx.fill();
  ctx.fillStyle = '#0b1220';
  roundRect(ctx, bx + 24, by + 24, bw - 48, 78, 18);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(bx + 24 + i * ((bw - 48) / 6), by + 122, (bw - 48) / 6 - 14, 14);
  }
  for (const wx of [bx + 70, bx + bw - 70]) {
    ctx.fillStyle = '#3b4560';
    ctx.beginPath();
    ctx.arc(wx, by + bh, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.arc(wx, by + bh, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
  if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ files: [file], title: 'Campaigner' });
      return 'shared';
    } catch {
      /* fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
