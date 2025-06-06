// app.mjs
import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';

import routersRouter from './routes/routers.mjs';
import { routerRestart } from './utils/router_manager.mjs';

const app = express();
const port = 3000;

async function restartAllRouters() {
  const dataDir = path.join('data');
  const routersDir = path.join(dataDir, 'routers');

  // Ensure “data/routers” exists
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(routersDir, { recursive: true });
    return;
  }

  try {
    await fs.access(routersDir);
  } catch {
    await fs.mkdir(routersDir, { recursive: true });
    return;
  }

  const routerDirs = (
    await fs.readdir(routersDir, { withFileTypes: true })
  ).filter(dirent => dirent.isDirectory());

  for (const dir of routerDirs) {
    const routerId = dir.name;
    const lockFilePath = path.join(routersDir, routerId, '.lock');

    let active = false;
    try {
      await fs.access(lockFilePath);
      active = true;
    } catch {
      active = false;
    }

    if (!active) {
      console.log(`Router ${routerId} is not active, skipping restart.`);
      continue;
    }

    console.log(`Restarting router: ${routerId}`);
    await routerRestart(routerId);
  }
}

restartAllRouters()
  .then(() => console.log('All routers restarted successfully'))
  .catch(err => console.error('Error restarting routers:', err));

app.use(express.json());
app.use('/routers', routersRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
