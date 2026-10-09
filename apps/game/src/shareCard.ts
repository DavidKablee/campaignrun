import { copy } from '@cr/content';

export interface ShareCardInput {
  crowd: number;
  starLabel: string;
  rideName: string;
  contenderName: string;
  stateName: string;
}

/** Build a 9:16 WhatsApp-friendly PNG (poster chrome). */
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const w = 1080;
  const h = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1b2a4a');
  grad.addColorStop(0.55, '#0b1220');
  grad.addColorStop(1, '#0b1220');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // danfo stripe band
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f5c518' : '#0b1220';
    ctx.fillRect(0, 120 + i * 10, w, 10);
  }
  ctx.fillStyle = 'rgba(11,18,32,0.88)';
  ctx.fillRect(0, 120, w, 240);

  ctx.fillStyle = '#f5c518';
  ctx.font = 'bold 96px "Archivo Black", sans-serif';
  ctx.fillText('CAMPAIGN', 64, 240);
  ctx.fillStyle = '#f7f1e3';
  ctx.fillText('RUN', 64, 340);

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
  ctx.fillText('Crowd', 64, 960);
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('share blob failed'))), 'image/png');
  });
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
  if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ files: [file], title: 'Campaign Run', text: 'Game scores. Not a poll.' });
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
