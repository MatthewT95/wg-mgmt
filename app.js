const express = require('express')
const app = express()
const port = 3000
const routersRouter = require('./routes/routers.js')
const { routerRestart } = require('./utils/router_manager.js');
const path = require('path');
const fs = require('fs').promises;

async function restartAllRouters() {
    const dataDir = path.join('data');
  const routersDir = path.join(dataDir, 'routers');
  // Check if data directory exists
  try 
  {
    await fs.access(dataDir);
  }
  catch (err)
  {
    // If the directory does not exist, create it
    await fs.mkdir(dataDir, { recursive: true });
    // create the routers directory
    await fs.mkdir(routersDir, { recursive: true });
    return;
  }

  // Check if routers directory exists
  try {
    await fs.access(routersDir);
  } catch (err) {
    // If the directory does not exist, create it
    await fs.mkdir(routersDir, { recursive: true });
    return;
  }
  
  // Read the router directories
  const routerDirs = (await fs.readdir(routersDir, { withFileTypes: true })).filter(dirent => dirent.isDirectory());

  for (const dir of routerDirs) {
    const routerId = dir.name;
    const lockFilePath = path.join(routersDir, routerId, '.lock');
    // Check if the router has a .lock file
    let active = false;
    // If the .lock file exists, the router is active
    try {
      await fs.access(lockFilePath);
      active = true;
    } catch (err) {
      active = false;
    }
    // Restart the router
    if (active) {
      console.log(`Restarting router: ${routerId}`);
    } else {
      console.log(`Router ${routerId} is not active, skipping restart.`);
      continue;
    }
    await routerRestart(routerId);
  }
}

// restart routers
restartAllRouters()
  .then(() => {
    console.log('All routers restarted successfully');
  })
  .catch((err) => {
    console.error('Error restarting routers:', err);
  });

app.use(express.json())

app.use ('/routers', routersRouter)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})