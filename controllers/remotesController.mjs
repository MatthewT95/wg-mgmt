import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';
import { generateWireGuardKeyPair } from '../utils/keys.mjs';

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
  const vpcId = req.params.vpcId; // Assuming vpcId is passed as a parameter
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  const remoteConfigFiles = (await fs.readdir(routerFilePath)).filter(file => file.endsWith('.remote.toml'));
  const remoteConfigs = remoteConfigFiles.map(file => {
    const remoteId = file.replace('.remote.toml', '');
    const remoteConfig = TOML.parse(fsSync.readFileSync(path.join(routerFilePath, file), 'utf8'));
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

export async function getRemoteController(req, res) {
  const routerId = req.params.routerId;
  const remoteId = req.params.remoteId;
  const vpcId = req.params.vpcId; // Assuming vpcId is passed as a parameter
  console.log(`Fetching remote ${remoteId} for router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  const remoteFilePath = path.join(routerFilePath, `${remoteId}.remote.toml`);
  
  // Check if the remote configuration file exists
  try {
    await fs.access(remoteFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Remote ${remoteId} not found for router ${routerId}`, status: 'error' });
  }

  const remoteConfig = TOML.parse(fsSync.readFileSync(remoteFilePath, 'utf8'));
  
  // Hide private key
  remoteConfig.privateKey = '(hidden)';

  return res.status(200).json({
    id: remoteId,
    ...remoteConfig,
    status: 'success'
  });
}

export async function createRemoteController(req, res) {
  const  routerId = req.params.routerId;
  const remoteId = req.params.remoteId || (Math.floor(1000 + Math.random() * 9000)).toString(); // Generate a random remoteId if not provided
  
  const { name, lanId,address } = req.body;

  console.log(`Creating remote ${remoteId} for router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // check if the remote already exists
  const remoteFilePath = path.join(routerFilePath, `${remoteId}.remote.toml`);
  try {
    await fs.access(remoteFilePath);
    return res.status(409).json({ message: `Remote ${remoteId} already exists for router ${routerId}`, status: 'error' });
  } catch (err) {
    // File does not exist, proceed to create it
  }

  // Check if lanId and address are provided
  if (!lanId || !address) {
    return res.status(400).json({ message: 'LAN ID and address are required', status: 'error' });
  }

  // Generate wireguard key pair
  const { privateKey, publicKey } = await generateWireGuardKeyPair();
  if (!privateKey || !publicKey) {
    return res.status(500).json({ message: 'Failed to generate WireGuard key pair', status: 'error' });
  }

  // Create the remote configuration object
  const remoteConfig = {
    name: name || `Remote ${remoteId}`,
    lanId: lanId,
    address: address,
    publicKey: publicKey,
    privateKey: privateKey,
  };

  // Write the remote configuration to a file
  try {
    await fs.writeFile(remoteFilePath, TOML.stringify(remoteConfig), 'utf8');
  } catch (err) {
    console.error(`Error writing remote configuration for ${remoteId}: ${err.message}`);
    return res.status(500).json({ message: `Error creating remote ${remoteId} for router ${routerId}`, status: 'error' });
  }

  return res.status(201).json({
    id: remoteId,
    ...remoteConfig,
    message: `Remote ${remoteId} created successfully for router ${routerId}`,
    status: 'success'
  });

}

export async function getRemoteClientConfigController(req, res) {
  // Get routerId and remoteId from request parameters
  const routerId = req.params.routerId;
  const remoteId = req.params.remoteId;
  console.log(`Fetching client config for remote ${remoteId} of router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);
  const remoteFilePath = path.join(routerFilePath, `${remoteId}.remote.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' }); 
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  const routerConfig = TOML.parse(fsSync.readFileSync(path.join(routerFilePath, 'router.toml'), 'utf8'));

  // Check if the remote configuration file exists
  try {
    await fs.access(remoteFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Remote ${remoteId} not found for router ${routerId}`, status: 'error' });
  }

  const remoteConfig = TOML.parse(fsSync.readFileSync(remoteFilePath, 'utf8'));


  // Check if lan configuration exists
  const lanFilePath = path.join(routerFilePath, `${remoteConfig.lanId}.lan.toml`);
  let network = '';
  try {
    await fs.access(lanFilePath);
    const lanConfig = TOML.parse(fsSync.readFileSync(lanFilePath, 'utf8'));
    network = lanConfig.network;
  } catch (err) {
    return res.status(404).json({ message: `LAN configuration not found for remote ${remoteId} of router ${routerId}`, status: 'error' });
  }

  
  const lanConfig = TOML.parse(fsSync.readFileSync(lanFilePath, 'utf8'));
  const remoteNetworks = (await fs.readdir(routerFilePath)).filter(file => file.endsWith('.lan.toml')).map(file => { return TOML.parse(fsSync.readFileSync(path.join(routerFilePath, file), 'utf8')).network; });


  let response = {
    clientPrivateKey: remoteConfig.privateKey,
    clientAddress: remoteConfig.address,
    network: lanConfig.network,
    serverPublicKey: routerConfig.publicKey,
    remoteNetworks: remoteNetworks,
    remotePot: lanConfig.port || 51820,
    message: '',
    status: ''
  };

  response.message = `Client config for remote ${remoteId} of router ${routerId} generated successfully`;
  response.status = 'success';
  return res.status(200).json(response);

}

export async function updateRemoteController(req, res) {
  const routerId = req.params.routerId;
  const remoteId = req.params.remoteId;
  console.log(`Updating remote ${remoteId} for router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);
  const remoteFilePath = path.join(routerFilePath, `${remoteId}.remote.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the remote configuration file exists
  try {
    await fs.access(remoteFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Remote ${remoteId} not found for router ${routerId}`, status: 'error' });
  }

  // Read the existing remote configuration
  let remoteConfig;
  try {
    remoteConfig = TOML.parse(fsSync.readFileSync(remoteFilePath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ message: `Error reading remote configuration for ${remoteId}: ${err.message}`, status: 'error' });
  }

  // Update the remote configuration with new values from request body
  const { name, lanId, address } = req.body;
  
  if (name) remoteConfig.name = name;
  if (address) remoteConfig.address = address;

  // Write the updated configuration back to the file
  try {
    await fs.writeFile(remoteFilePath, TOML.stringify(remoteConfig), 'utf8');
    return res.status(200).json({
      id: remoteId,
      ...remoteConfig,
      message: `Remote ${remoteId} updated successfully for router ${routerId}`,
      status: 'success'
    });
  } catch (err) {
    console.error(`Error updating remote configuration for ${remoteId}: ${err.message}`);
    return res.status(500).json({ message: `Error updating remote ${remoteId} for router ${routerId}`, status: 'error' });
  }
}

export async function deleteRemoteController(req, res) {
  const routerId = req.params.routerId;
  const remoteId = req.params.remoteId;
  console.log(`Deleting remote ${remoteId} for router: ${routerId}`);
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerFilePath = path.join(routersDir, routerId);
  const remoteFilePath = path.join(routerFilePath, `${remoteId}.remote.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the remote configuration file exists
  try {
    await fs.access(remoteFilePath);
  } catch (err) {
    return res.status(404).json({ message: `Remote ${remoteId} not found for router ${routerId}`, status: 'error' });
  }

  // Delete the remote configuration file
  try {
    await fs.unlink(remoteFilePath);
    return res.status(200).json({ message: `Remote ${remoteId} deleted successfully for router ${routerId}`, status: 'success' });
  } catch (err) {
    console.error(`Error deleting remote configuration for ${remoteId}: ${err.message}`);
    return res.status(500).json({ message: `Error deleting remote ${remoteId} for router ${routerId}`, status: 'error' });
  }
}