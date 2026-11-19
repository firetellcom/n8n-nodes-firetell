import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const assets = [
  ['nodes/Firetell/firetell.svg', 'dist/nodes/Firetell/firetell.svg'],
  ['nodes/Firetell/Firetell.node.json', 'dist/nodes/Firetell/Firetell.node.json'],
  [
    'nodes/Firetell/FiretellTrigger.node.json',
    'dist/nodes/Firetell/FiretellTrigger.node.json',
  ],
];

for (const [src, dest] of assets) {
  const srcPath = resolve(process.cwd(), src);
  const destPath = resolve(process.cwd(), dest);
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
}
