import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getRemotesController(req, res) {
  // Initialize response object
  let response = {
    remotes: [],
    message: ''
  };

  const routerId = req.params.routerId;
  console.log(`Fetching remotes for router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  console.log(`Data directory: ${dataDir}`);
  const routersDir = path.join(dataDir, 'routers');
  console.log(`Routers directory: ${routersDir}`);
  const routerPath = path.join(routersDir, routerId);

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  const remoteConfigFiles = (await fs.readdir(routerPath)).filter(file => file.endsWith('.remote.toml'));
  const remoteConfigs = remoteConfigFiles.map(file => {
    const remoteId = file.replace('.remote.toml', '');
    const remoteConfig = TOML.parse(fsSync.readFileSync(path.join(routerPath, file), 'utf8'));
    return {
      id: remoteId,
      ...remoteConfig
    };
  });

  if (remoteConfigs.length === 0) {
    response.message = `No remotes found for router ${routerId}`;
    response.status = 'success';
    return res.status(200).json(response);
  }

  response.remotes = remoteConfigs;
  response.message = `Found ${remoteConfigs.length} remotes for router ${routerId}`;
  response.status = 'success';

  return res.status(200).json(response);
}