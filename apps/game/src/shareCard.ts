import { copy } from '@cr/content';

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

/** Build a 9:16 WhatsApp-friendly PNG (poster chrome). */
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const w = 1080;
  const h = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const accentColor = input.partyColor ?? '#f5c518';

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1b2a4a');
  grad.addColorStop(0.55, '#0b1220');
  grad.addColorStop(1, '#0b1220');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Party color band at top (thick stripe in the contender's party colour)
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, w, 18);

  // danfo stripe band
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 === 0 ? accentColor : '#0b1220';
    ctx.fillRect(0, 120 + i * 10, w, 10);
  }
  ctx.fillStyle = 'rgba(11,18,32,0.88)';
  ctx.fillRect(0, 120, w, 240);

  // Party name pill (top-right corner)
  if (input.partyName) {
    ctx.fillStyle = accentColor;
    roundRect(ctx, w - 260, 28, 212, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = 'bold 32px "Archivo Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(input.partyName.toUpperCase(), w - 154, 70);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 96px "Archivo Black", sans-serif';
  ctx.fillText('CAMPAIGNER', 64, 240);

  ctx.fillStyle = 'rgba(247,241,227,0.7)';
  ctx.font = '600 36px "DM Sans", sans-serif';
  ctx.fillText(`${input.stateName.toUpperCase()} · ${input.rideName}`, 64, 480);

  ctx.fillStyle = '#f5c518';
  ctx.font = 'bold 48px "Archivo Black", sans-serif';
  ctx.fillText(input.starLabel.toUpperCase(), 64, 620);

  ctx.fillStyle = '#f7f1e3';
  ctx.font = 'bold 220px "Archivo Black", sans-serif';
  ctx.fillText(String(input.crowd), 64, 880);

  ctx.fillStyle = 'rgba(247,241,227,0.75)';
  ctx.font = '600 40px "DM Sans", sans-serif';
  ctx.fillText('Turnout', 64, 960);
  ctx.fillText(input.contenderName, 64, 1040);

  ctx.fillStyle = 'rgba(247,241,227,0.08)';
  roundRect(ctx, 48, 1180, w - 96, 420, 28);
  ctx.fill();

  ctx.fillStyle = '#f7f1e3';
  ctx.font = '500 32px "DM Sans", sans-serif';
  wrapText(ctx, copy.disclosure, 80, 1260, w - 160, 44);

  ctx.fillStyle = '#f5c518';
  ctx.font = 'bold 36px "Archivo Black", sans-serif';
  ctx.fillText('Game scores. Not a poll.', 80, 1680);

  stampNotAPoll(ctx, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('share blob failed'))), 'image/png');
  });
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
  if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ files: [file], title: 'Campaigner', text: 'Game scores. Not a poll.' });
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

/**
 * A card with a tier called "Landslide" and a party colour is one crop away from
 * a fake poll. The footer disclosure can be cut off; a tiled diagonal stamp
 * across the whole picture cannot be removed without wrecking the card.
 */
export function stampNotAPoll(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = 'rgba(247,241,227,0.07)';
  ctx.font = '800 54px "Archivo Black", sans-serif';
  ctx.textAlign = 'center';
  const label = 'FICTIONAL GAME · NOT A POLL · ';
  const rowW = ctx.measureText(label).width;
  for (let y = -h; y <= h; y += 150) {
    for (let x = -w - (y % 300 === 0 ? 0 : rowW / 2); x <= w; x += rowW) {
      ctx.fillText(label, x, y);
    }
  }
  ctx.restore();
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
