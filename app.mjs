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
  const vpcsDir = path.join(dataDir, 'vpcs');

  // Ensure “data/vpcs” exists
  try {
    await fs.access(vpcsDir);
  } catch {
    await fs.mkdir(vpcsDir, { recursive: true });
    return;
  }

  const vpcDirs = await (await fs.readdir(vpcsDir, { withFileTypes: true })).filter(dirent => dirent.isDirectory());


  for (const dir of vpcDirs) {
    const vpcId = dir.name;
    console.log(`Processing VPC: ${vpcId}`);
    const routersDir = path.join(vpcsDir,vpcId, 'routers');
    console.log(`Routers directory: ${routersDir}`);

    // Ensure “data/vpcs/{vpcId}/routers” exists
    try {
      await fs.access(routersDir);
    } catch {
      await fs.mkdir(routersDir, { recursive: true });
      continue;
    }

    const routerFiles = await fs.readdir(routersDir, { withFileTypes: true });
    for (const file of routerFiles) {
      if (file.isDirectory()) {
        const routerId = file.name;
        try {
          await routerRestart(routerId, vpcId);
        } catch (err) {
          console.error(`Failed to restart router ${routerId} in VPC ${vpcId}:`, err);
        }
      }
    }
  }
}

restartAllRouters()
  .then(() => console.log('All routers restarted successfully'))
  .catch(err => console.error('Error restarting routers:', err));

app.use(express.json());
app.use('/vpc/:vpcId/router', routersRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
