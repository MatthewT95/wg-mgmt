import path from 'path';
import { promises as fs, stat } from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createSubnetController(req, res) {
  console.log('Creating Subnet...');

  // Get the subnet ID and name from the request body
  const subnetId = req.body.subnetId || ("subnet-" + Math.random().toString(36).substring(2, 10));
  let subnetName = req.body.name || subnetId;

  // Define the data directory and subnet directory
  const dataDir = path.join(__dirname, '..', 'data');
  const subnetDir = path.join(dataDir, 'subnets');

  // Validate the subnet ID
  if (!subnetId || typeof subnetId !== 'string' || subnetId.trim() === '') {
    return res.status(400).json({ message: 'Subnet ID is required', status: 'error' });
  }

  // Vailidate the subnet name
  if (typeof subnetName !== 'string' || subnetName.trim() === '') {
    subnetName = `${subnetId}`;
  }

  // Vaildate the router ID from the request body
  if (!req.body.routerId || typeof req.body.routerId !== 'string') {
    return res.status(400).json({ message: 'Valid Router ID is required', status: 'error' });
  }

  // Validate the VPC ID from the request body
  if (!req.body.vpcId || typeof req.body.vpcId !== 'string') {
    return res.status(400).json({ message: 'Valid VPC ID is required', status: 'error' });
  }

  // Validate the network from the request body
  if (!req.body.network || typeof req.body.network !== 'string') {
    return res.status(400).json({ message: 'Valid network is required', status: 'error' });
  }

  // Validate the gateway from the request body
  if (!req.body.gateway || typeof req.body.gateway !== 'string') {
    return res.status(400).json({ message: 'Valid gateway is required', status: 'error' });
  }

  let port = req.body.port;
  // Validate the port from the request body
  if (!req.body.port || typeof req.body.port !== 'number') {
    port = Math.floor(Math.random() * (65535 - 50000 + 1) + 50000); // Random port between 50000 and 65535
  }

  // Vaildate the VPC exists
  const vpcDir = path.join(dataDir, 'vpc');
  try {
    await fs.access(path.join(vpcDir, `${req.body.vpcId}.vpc.toml`));
  }
  catch (err) {
    return res.status(404).json({ message: `VPC ${req.body.vpcId} not found`, status: 'error' });
  }

  // Vaildate the router exists
  const routerDir = path.join(dataDir, 'routers');
  try {
    await fs.access(path.join(routerDir, `${req.body.routerId}.router.toml`));
  }
  catch (err) {
    return res.status(404).json({ message: `Router ${req.body.routerId} not found`, status: 'error' });
  }

  // Check if the subnet already exists
  try {
    await fs.access(path.join(subnetDir, `${subnetId}.subnet.toml`));
    return res.status(400).json({ message: `Subnet ${subnetId} already exists`, status: 'error' });
  } catch (err) {
    // Subnet does not exist, proceed to create it
  }

  // Build the subnet configuration
  const subnetConfig = {
    id: subnetId,
    name: subnetName,
    metadata: {},
    vpcId: req.body.vpcId,
    routerId: req.body.routerId,
    network:req.body.network,
    gateway: req.body.gateway,
    interface: "wg-" + Math.random().toString(36).substring(2, 8),
    port: port, // Random port between 50000 and 65535
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Write the subnet configuration to a file
  await fs.writeFile(path.join(subnetDir, `${subnetId}.subnet.toml`), TOML.stringify(subnetConfig), 'utf8');
  
  console.log(`Subnet ${subnetId} created successfully with name: ${subnetName}`);
  
  return res.status(201).json({
    message: `Subnet ${subnetId} created successfully`,
    subnet: subnetConfig,
    status: 'success'
  });
}

export async function deleteSubnetController(req, res) {
  const subnetId = req.params.subnetId;
  const dataDir = path.join(__dirname, '..', 'data');
  const subnetDir = path.join(dataDir, 'subnets');

  // Validate the subnet ID
  if (!subnetId || typeof subnetId !== 'string' || subnetId.trim() === '') {
    return res.status(400).json({ message: 'Subnet ID is required', status: 'error' });
  }

  // Check if the subnet exists
  try {
    await fs.access(path.join(subnetDir, `${subnetId}.subnet.toml`));
  } catch (err) {
    return res.status(404).json({ message: `Subnet ${subnetId} not found`, status: 'error' });
  }

  // Delete the subnet file
  await fs.unlink(path.join(subnetDir, `${subnetId}.subnet.toml`));

  console.log(`Subnet ${subnetId} deleted successfully`);
  
  return res.status(200).json({
    message: `Subnet ${subnetId} deleted successfully`,
    status: 'success'
  });
}

// List all subnets
export async function listSubnetsController(req, res) {
  const subnetDir = path.join(__dirname, '..', 'data', 'subnets');
  let response = { subnets: [] };

  try {
    const files = await fs.readdir(subnetDir);
    // Filter for subnet files
    for (const file of files) {
      if (file.endsWith('.subnet.toml')) {
        const content = await fs.readFile(path.join(subnetDir, file), 'utf8');
        response.subnets.push(TOML.parse(content));
      }
    }

    // If no subnets were found, return an empty array
    if (response.subnets.length === 0) {
      return res.status(200).json({ message: 'No subnets found', subnets: [] ,status: 'success'});
    }
    else {
      response.message = `Found ${response.subnets.length} subnets`;
      response.status = 'success';
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: `Error listing subnets: ${err.message}` , status: 'error' });
  }
}

// Get a specific subnet
export async function getSubnetController(req, res) {
  const subnetId = req.params.subnetId;
  const filePath = path.join(__dirname, '..', 'data', 'subnets', `${subnetId}.subnet.toml`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return res.json({ subnet: TOML.parse(content) ,message: `Subnet ${subnetId} found`, status: 'success' });
  } catch (err) {
    return res.status(404).json({ message: `Subnet ${subnetId} not found`, status: 'error' });
  }
}

// Update a subnet
export async function updateSubnetController(req, res) {
  const subnetId = req.params.subnetId;
  const filePath = path.join(__dirname, '..', 'data', 'subnets', `${subnetId}.subnet.toml`);

  // Validate the subnet ID
  if (!subnetId || typeof subnetId !== 'string' || subnetId.trim() === '') {
    return res.status(400).json({ message: 'Subnet ID is required', status: 'error' });
  }

  // Vaildate the request body
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Request body is required', status: 'error' });
  }

  // Check if the subnet exists
  try {
    await fs.access(filePath);
  } catch (err) {
    return res.status(404).json({ message: `Subnet ${subnetId} not found`, status: 'error' });
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const subnet = TOML.parse(content);

    //Update the subnet properties based on the request body
    if (req.body.name) {
      subnet.name = req.body.name;
    }

    // Update routerId, network, gateway, and port if provided
    if (req.body.routerId) {
      // Check if the router exists
      const routerDir = path.join(__dirname, '..', 'data', 'routers');
      try {
        await fs.access(path.join(routerDir, `${req.body.routerId}.router.toml`));
      } catch (err) {
        return res.status(404).json({ message: `Router ${req.body.routerId} not found`, status: 'error' });
      }
      // If the router exists, update the subnet's routerId
      subnet.routerId = req.body.routerId;
    }
    if (req.body.network) {
      subnet.network = req.body.network;
    }
    if (req.body.gateway) {
      subnet.gateway = req.body.gateway;
    }
    if (req.body.port) {
      subnet.port = req.body.port;
    }
    subnet.updatedAt = new Date().toISOString();

    // Write the updated subnet back to the file
    await fs.writeFile(filePath, TOML.stringify(subnet), 'utf8');
    return res.json({ message: `Subnet ${subnetId} updated`, subnet: subnet, status: 'success' });
  } catch (err) {
    return res.status(404).json({ message: `Subnet ${subnetId} not found`, status: 'error' });
  }
}