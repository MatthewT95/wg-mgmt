import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import TOML from '@iarna/toml';
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
  const vpcId = req.params.vpcId;
  console.log(`Fetching LANs for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerPath = path.join(routersDir, routerId);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found` , status: 'error' });
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
    response.status = 'success';
    return res.status(200).json(response);
  }

  response.lans = lanConfigs;
  response.message = `Found ${lanConfigs.length} LANs for router ${routerId}`;
  response.status = 'success';

  return res.status(200).json(response);
}

export async function getLANController(req, res) {
  const routerId = req.params.routerId;
  const lanId = req.params.lanId;
  const vpcId = req.params.vpcId;
  console.log(`Fetching LAN ${lanId} for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerPath = path.join(routersDir, routerId);
  const lanFilePath = path.join(routerPath, `${lanId}.lan.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the LAN configuration file exists
  try {
    await fs.access(lanFilePath);
  } catch (err) {
    return res.status(404).json({ message: `LAN ${lanId} not found in router ${routerId}`, status: 'error' });
  }

  const lanConfig = TOML.parse(fsSync.readFileSync(lanFilePath, 'utf8'));
  
  return res.status(200).json({
    id: lanId,
    ...lanConfig,
    message: `LAN ${lanId} retrieved successfully for router ${routerId}`,
    status: 'success'
  });
}

export async function createLANController(req, res) {
  const { routerId,vpcId } = req.params;
  let lanId = req.params.lanId || Math.floor(100 + Math.random() * 900);
  let { name,network,gateway, port} = req.body;
  // Generate a random 4-digit interface id
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const wgInterface = `wg-${randomId}`;
  console.log(`Creating LAN ${lanId} for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerPath = path.join(routersDir, routerId);
  const lanFilePath = path.join(routerPath, `${lanId}.lan.toml`);

  // Check if network and gateway are provided
  if (!network || !gateway) {
    return res.status(400).json({ message: 'Network and gateway are required' });
  }

  // Check if port is provided, if not set to random port from 50000 to 60000
  if (!port) {
    port = Math.floor(Math.random() * (60000 - 50000 + 1)) + 50000;
  }

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the LAN configuration file already exists
  try {
    await fs.access(lanFilePath);
    return res.status(400).json({ message: `LAN ${lanId} already exists in router ${routerId}`, status: 'error' });
  } catch (err) {
    // File does not exist, proceed to create it
  }

  // Create the LAN configuration object
  let lanConfig = "";
  lanConfig += `name = "${name || 'Unnamed LAN'}"\n`;
  lanConfig += `interface = "${wgInterface}"\n`;
  lanConfig += `network = "${network}"\n`;
  lanConfig += `gateway = "${gateway}"\n`;
  lanConfig += `port = ${port}\n`;

  // Write the LAN configuration to a file
  try {
    await fs.writeFile(lanFilePath, lanConfig, 'utf8');
  } catch (err) {
    console.error(`Error writing LAN configuration for ${lanId}: ${err.message}`);
    return res.status(500).json({ message: `Error creating LAN ${lanId} for router ${routerId}`,status: 'error' });
  }
  
  // Logic to create a new LAN configuration
  const response = {
    id: lanId,
    vpcId: vpcId,
    name: name || 'Unnamed LAN',
    interface: wgInterface,
    network: network,
    gateway: gateway,
    port: port,
    message: `LAN ${lanId} created successfully for router ${routerId}`,
    status: 'success'
  };
  res.status(201).send(response);
}

export async function updateLANController(req, res) {
  const { routerId, lanId ,vpcId} = req.params;
  const { name, network, gateway, port } = req.body;
  console.log(`Updating LAN ${lanId} for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerPath = path.join(routersDir, routerId);
  const lanFilePath = path.join(routerPath, `${lanId}.lan.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the LAN configuration file exists
  try {
    await fs.access(lanFilePath);
  } catch (err) {
    return res.status(404).json({ message: `LAN ${lanId} not found in router ${routerId}`, status: 'error' });
  }

  // Read the existing LAN configuration
  let lanConfig = TOML.parse(fsSync.readFileSync(lanFilePath, 'utf8'));

  // Update the LAN configuration with new values
  if (name) lanConfig.name = name;
  if (network) lanConfig.network = network;
  if (gateway) lanConfig.gateway = gateway;
  if (port) lanConfig.port = port;

  // Write the updated LAN configuration back to the file
  try {
    await fs.writeFile(lanFilePath, TOML.stringify(lanConfig), 'utf8');
    return res.status(200).json({
      id: lanId,
      ...lanConfig,
      message: `LAN ${lanId} updated successfully for router ${routerId}`,
      status: 'success'
    });
  } catch (err) {
    console.error(`Error updating LAN configuration for ${lanId}: ${err.message}`);
    return res.status(500).json({ message: `Error updating LAN ${lanId} for router ${routerId}`, status: 'error' });
  }
}

export async function deleteLANController(req, res) {
  const { routerId, lanId,vpcId} = req.params;
  console.log(`Deleting LAN ${lanId} for router: ${routerId}`);
  const dataDir = path.join(__dirname,'..','data');
  const vpcDir = path.join(dataDir, 'vpcs', vpcId);
  const routersDir = path.join(vpcDir, 'routers');
  const routerPath = path.join(routersDir, routerId);
  const lanFilePath = path.join(routerPath, `${lanId}.lan.toml`);

  // Check if the VPC directory exists
  try {
    await fs.access(vpcDir);
  } catch (err) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Check if the router directory exists
  try {
    await fs.access(routerPath);
  } catch (err) {
    return res.status(404).json({ message: `Router ${routerId} not found`, status: 'error' });
  }

  // Check if the LAN configuration file exists
  try {
    await fs.access(lanFilePath);
  } catch (err) {
    return res.status(404).json({ message: `LAN ${lanId} not found in router ${routerId}`, status: 'error' });
  }

  // Delete the LAN configuration file
  try {
    await fs.unlink(lanFilePath);
    return res.status(200).json({ message: `LAN ${lanId} deleted successfully from router ${routerId}`, status: 'success' });
  } catch (err) {
    console.error(`Error deleting LAN configuration for ${lanId}: ${err.message}`);
    return res.status(500).json({ message: `Error deleting LAN ${lanId} for router ${routerId}`, status: 'error' });
  }
}