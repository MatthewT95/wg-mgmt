import path from 'path';
import { promises as fs } from 'fs';
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

  // Ensure the subnets directory exists
  try {
    await fs.access(subnetDir);
  } catch (err) {
    // If the directory does not exist, create it
    await fs.mkdir(subnetDir, { recursive: true });
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