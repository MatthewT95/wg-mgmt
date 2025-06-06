import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import TOML from '@iarna/toml';
import { routerStart, routerStop, routerStatus, routerRestart,routerCreate } from '../utils/router_manager.mjs';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getLANsController(req, res) {
  // Initialize response object
  let response = {
    lans: [],
    message: ''
  };

  const routerId = req.params.routerId;
  console.log(`Fetching LANs for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  console.log(`Data directory: ${dataDir}`);
  const routersDir = path.join(dataDir, 'routers');
  console.log(`Routers directory: ${routersDir}`);
  const routerPath = path.join(routersDir, routerId);

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found` });
  }

  const lanConfigFiles = (await fs.readdir(routerPath)).filter(file => file.endsWith('.lan.toml'));
  const lanConfigs = lanConfigFiles.map(file => {
    const lanId = file.replace('.lan.toml', '');
    const lanConfig = TOML.parse(fsSync.readFileSync(path.join(routerPath, file), 'utf8'));
    return {
      id: lanId,
      ...lanConfig
    };
  });

  if (lanConfigs.length === 0) {
    response.message = `No LANs found for router ${routerId}`;
    return res.status(200).json(response);
  }

  response.lans = lanConfigs;
  response.message = `Found ${lanConfigs.length} LANs for router ${routerId}`;

  return res.status(200).json(response);
}