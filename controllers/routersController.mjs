import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import TOML from '@iarna/toml';
import { routerStart, routerStop, routerStatus, routerRestart,routerCreate } from '../utils/router_manager.mjs';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getRoutersController(req, res) {

  // Initialize response object
  let response = {
    routers: [],
    message: ''
  }

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
    return res.status(200).json({ routers: [], message: 'No routers found' });
  }

  // Check if routers directory exists
  try {
    await fs.access(routersDir);
  } catch (err) {
    // If the directory does not exist, create it
    await fs.mkdir(routersDir, { recursive: true });
    return res.status(200).json({ routers: [], message: 'No routers found' });
  }
  
  // Read the router directories
  const routerDirs = (await fs.readdir(routersDir, { withFileTypes: true })).filter(dirent => dirent.isDirectory());

  for (const dir of routerDirs) {
    const routerId = dir.name;
    const routerPath = path.join(routersDir, routerId);
    let routerConfig="";
    let lanConfigs = [];
    let remoteConfigs = [];

    // Check if the router has a .lock file
    const lockFilePath = path.join(routerPath, '.lock');
    let active = false;

    // If the .lock file exists, the router is active
    try {
      await fs.access(lockFilePath);
      active = true;
    } catch (err) {
      active = false;
    }

    // Check if the router configuration file exists
    try {
      // get the router configuration file
      routerConfig = TOML.parse(await fs.readFile(path.join(routerPath, 'router.toml'), { encoding: 'utf8' }));
    }
    catch (err) {
      // If the router configuration file does not exist, skip this router
      console.error(`Error reading router configuration for ${routerId}: ${err.message}`);
      response.message = `Error reading router configuration for ${routerId}`;
    }

    // Get lan configurations
    try {
      lanConfigs = (await fs.readdir(routerPath)).filter(file => file.endsWith('.lan.toml'))
      .map(file => {return TOML.parse(fsSync.readFileSync(path.join(routerPath, file), { encoding: 'utf8' }))});
      lanConfigs = lanConfigs.map(config => ({ name: (config.name || 'Unnamed LAN'), interface: (config.interface || 'N/A'),
        gateway: (config.gateway || 'N/A'), network: (config.network || 'N/A'), serverPort: (config.port || 'N/A')}));
    }
    catch (err) { 
      console.error(`Error reading LAN configurations for ${routerId}: ${err.message}`);
      response.message = `Error reading LAN configurations for ${routerId}`;
      lanConfigs = [];
    }

    // Get remote configurations
    try {
      remoteConfigs = (await fs.readdir(routerPath)).filter(file => file.endsWith('.remote.toml'))
      .map(file => {return TOML.parse(fsSync.readFileSync(path.join(routerPath, file), { encoding: 'utf8' }))});
      remoteConfigs = remoteConfigs.map(config => ({ name: (config.name || 'Unnamed Remote'), address: (config.address || 'N/A'),
        publicKey: (config.publicKey || 'N/A'),privateKey: "(hidden)" }));
    } catch (err) {
      console.error(`Error reading remote configurations for ${routerId}: ${err.message}`);
      response.message = `Error reading remote configurations for ${routerId}`;
      remoteConfigs = [];
    }

    // Add router information to the response
    response.routers.push({
      id: routerId,
      active: active,
      vpcID: routerConfig.vpcID || 'N/A',
      name: routerConfig.name || 'Unnamed Router',
      publicKey: routerConfig.publicKey || 'N/A',
      domain: routerConfig.domain || 'N/A',
      lanConfigs: lanConfigs,
      remoteConfigs: remoteConfigs,
      
    });

  // If no routers found, set message accordingly
  if (response.routers.length === 0) {
    response.message = 'No routers found';
  }
  // If routers found, set message accordingly
  else {
    response.message = 'Routers retrieved successfully';
  }
  }
  return res.status(200).json(response);

}

export async function getRouterController(req, res) {
  const routerId = req.params.id;
  const routerPath = path.join(__dirname, '../data/routers', routerId);
  const response = {
    id: routerId,
  };
  let remoteConfigs = [];

  // Check if the data directory exists
  const dataDir = path.join(__dirname, '../data');
  try {
    await fs.access(dataDir);
  } catch (err) {
    // If the directory does not exist, create it
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(path.join(dataDir, 'routers'), { recursive: true });
    response.message = `Router with ID ${routerId} does not exist`;
    return res.status(404).json(response);
  }
  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    response.error = `Router with ID ${routerId} does not exist`;
    return res.status(404).json(response);
  }

  // Read the router configuration file
  const routerConfigPath = path.join(routerPath, 'router.toml');
  let routerConfig;
  try {
    routerConfig = TOML.parse(await fs.readFile(routerConfigPath, { encoding: 'utf8' }));
  } catch (err) {
    return res.status(500).json({ error: `Error reading router configuration: ${err.message}` });
  }

  // Hide the private key in the router configuration
  if (routerConfig.privateKey) {
    routerConfig.privateKey = '(hidden)';
  }

  // Read the LAN configurations
  let lanConfigs = [];
  try {
    const lanFiles = (await fs.readdir(routerPath)).filter(file => file.endsWith('.lan.toml'));
    lanConfigs = await Promise.all(lanFiles.map(async (file) => {
      const config = TOML.parse(await fs.readFile(path.join(routerPath, file), { encoding: 'utf8' }));
      return {
        name: config.name || 'Unnamed LAN',
        interface: config.interface || 'N/A',
        gateway: config.gateway || 'N/A',
        network: config.network || 'N/A',
        serverPort: config.port || 'N/A'
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: `Error reading LAN configurations: ${err.message}` });
  }

  // Read the remote configurations
  try {
    const remoteFiles = (await fs.readdir(routerPath)).filter(file => file.endsWith('.remote.toml'));
    remoteConfigs = await Promise.all(remoteFiles.map(async (file) => {
      const config = TOML.parse(await fs.readFile(path.join(routerPath, file), { encoding: 'utf8' }));
      return {
        name: config.name || 'Unnamed Remote',
        address: config.address || 'N/A',
        publicKey: config.publicKey || 'N/A',
        privateKey: '(hidden)' // Hide the private key
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: `Error reading remote configurations: ${err.message}` });
  }

  return res.status(200).json({ id: routerId, routerConfig,lanConfigs:lanConfigs,remoteConfigs:remoteConfigs, message: 'Router retrieved successfully' });
}


export async function routerUpController(req, res) {
  const routerId = req.params.id;
  const routerPath = path.join(__dirname, '../data/routers', routerId);
  const lockFilePath = path.join(routerPath, '.lock');

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ error: `Router with ID ${routerId} does not exist` });
  }

  // Check if the router is already running
  try {
    await fs.access(lockFilePath);
    return res.status(400).json({ error: `Router with ID ${routerId} is already running` });
  } catch (err) {
    // If the lock file does not exist, continue
  }

  // Create the lock file to indicate that the router is running
  try {
    routerStart(routerId);
    return res.status(200).json({ message: `Router with ID ${routerId} is now running` });
  } catch (err) {
    return res.status(500).json({ error: `Error starting router: ${err.message}` });
  }
}

export async function routerDownController(req, res) {
  const routerId = req.params.id;
  const routerPath = path.join(__dirname, '../data/routers', routerId);
  const lockFilePath = path.join(routerPath, '.lock');

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ error: `Router with ID ${routerId} does not exist` });
  }

  // Check if the router is running
  try {
    await fs.access(lockFilePath);
    routerStop(routerId);
    return res.status(200).json({ message: `Router with ID ${routerId} is now stopped` });
  } catch (err) {
    return res.status(400).json({ error: `Router with ID ${routerId} is not running` });
  }
}

export async function routerRestartController(req, res) {
  const routerId = req.params.id;
  const routerPath = path.join(__dirname, '../data/routers', routerId);

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ error: `Router with ID ${routerId} does not exist` });
  }

  // Check if the router is running
  try {
    await routerRestart(routerId);
    return res.status(200).json({ message: `Router with ID ${routerId} has been restarted` });
  } catch (err) {
    return res.status(400).json({ error: `Router with ID ${routerId} is not running` });
  }
}

export async function createRouterController(req, res) {
  const routerId = req.params.id || (Math.floor(100 + Math.random() * 900)).toString(); // Generate a random ID if not provided
  const routerPath = path.join(__dirname, '../data/routers', routerId);

  // Check if the router directory already exists
  try {
    await fs.access(routerPath);
    return res.status(400).json({ error: `Router with ID ${routerId} already exists` });
  } catch (err) {
    // If the directory does not exist, continue
  }

  // Create the router directory
  try {
    const { name } = req.body;
    routerCreate(routerId, name);
    return res.status(201).json({ message: `Router with ID ${routerId} created successfully` });
  } catch (err) {
    return res.status(500).json({ error: `Error creating router: ${err.message}` });
  }
}