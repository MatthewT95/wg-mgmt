import path from 'path';
import { promises as fs } from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createVPCController(req, res) {

  console.log('Creating VPC...');
  // get the VPC ID from the request body
  const vpcId = req.body.vpcId || ("vpc-"+Math.random().toString(36).substring(2, 10));
  const vpcName = req.body.name || vpcId;
  
  // Define the data directory and VPC directory
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpc');

  // Validate the VPC ID
  if (!vpcId) {
    return res.status(400).json({ message: 'VPC ID is required', status: 'error' });
  }

  // Validate the VPC name and set a default if not invalid
  if (typeof vpcName !== 'string' || vpcName.trim() === '') {
    vpcName = `${vpcId}`;
  }

  // Buiild the VPC configuration
  const vpcConfig ={
    id: vpcId,
    name: vpcName,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // write the VPC configuration to a file
  await fs.writeFile(path.join(vpcDir, `${vpcId}.vpc.toml`), TOML.stringify(vpcConfig), 'utf8');
  console.log(`VPC ${vpcId} created successfully with name: ${vpcName}`);
  return res.status(201).json({
    message: `VPC ${vpcId} created successfully`,
    vpc: vpcConfig,
    status: 'success'
  });
}

export async function getVPCsController(req, res) {
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpc');

  try {
    // Read all VPC files in the directory
    const files = await fs.readdir(vpcDir);
    const vpcs = [];

    for (const file of files) {
      if (file.endsWith('.vpc.toml')) {
        const vpcId = file.replace('.vpc.toml', '');
        const vpcContent = await fs.readFile(path.join(vpcDir, file), 'utf8');
        const vpcConfig = TOML.parse(vpcContent);
        vpcs.push({ id: vpcId, ...vpcConfig });
      }
    }

    return res.status(200).json({
      message: `Found ${vpcs.length} VPCs`,
      vpcs,
      status: 'success'
    });
  } catch (error) {
    console.error('Error reading VPCs:', error);
    return res.status(500).json({ message: 'Error fetching VPCs', status: 'error' });
  }
}

export async function getVPCController(req, res) {
  const { vpcId } = req.params;
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpc');

  const vpcContent = await fs.readFile(path.join(vpcDir, `${vpcId}.vpc.toml`), 'utf8');
  const vpcConfig = TOML.parse(vpcContent);
  return res.status(200).json({
    message: `Details of VPC ${vpcId}`,
    vpc: { id: vpcId, ...vpcConfig },
    status: 'success'
  });
}

export async function updateVPCController(req, res) {
  const vpcId = req.params.vpcId;
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpc');

  // Ensure the VPC file exists
  try {
    await fs.access(path.join(vpcDir, `${vpcId}.vpc.toml`));
  } catch (error) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }
  try {
    // Read the existing VPC configuration
    const vpcContent = await fs.readFile(path.join(vpcDir, `${vpcId}.vpc.toml`), 'utf8');
    const vpcConfig = TOML.parse(vpcContent);

    // Update the VPC configuration with new values
    if (req.body.name) vpcConfig.name = req.body.name;
    if (req.body.metadata) vpcConfig.metadata = { ...vpcConfig.metadata, ...req.body.metadata };
    vpcConfig.updatedAt = new Date().toISOString();

    // Write the updated VPC configuration back to the file
    await fs.writeFile(path.join(vpcDir, `${vpcId}.vpc.toml`), TOML.stringify(vpcConfig), 'utf8');
    
    return res.status(200).json({
      message: `VPC ${vpcId} updated successfully`,
      vpc: { id: vpcId, ...vpcConfig },
      status: 'success'
    });
  } catch (error) {
    console.error(`Error updating VPC ${vpcId}:`, error);
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }
}

export async function deleteVPCController(req, res) {
  const { vpcId } = req.params;
  const dataDir = path.join(__dirname, '..', 'data');
  const vpcDir = path.join(dataDir, 'vpc');

  // Check if the VPC exists
  try {
    await fs.access(path.join(vpcDir, `${vpcId}.vpc.toml`));
  } catch (error) {
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }

  // Attempt to delete the VPC file
  try {
    await fs.unlink(path.join(vpcDir, `${vpcId}.vpc.toml`));
    return res.status(200).json({
      message: `VPC ${vpcId} deleted successfully`,
      status: 'success'
    });
  } catch (error) {
    console.error(`Error deleting VPC ${vpcId}:`, error);
    return res.status(404).json({ message: `VPC ${vpcId} not found`, status: 'error' });
  }
}