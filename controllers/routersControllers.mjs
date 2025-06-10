import path from 'path';
import { promises as fs } from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';
import { VPCIdExists, routerIdExists} from '../utils/vaildate.mjs';
import ApiResponse from '../utils/apiResponse.mjs';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function listRoutersController(req, res) {
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // ensure the routers directory exists
  try {
    await fs.access(routerDir);
  } catch (err) {
    fs.mkdir(routerDir, { recursive: true });
    return new ApiResponse.OK('No routers found', { routers: [] }).expressRespond(res);
  }

  const routerFiles = await fs.readdir(routerDir);
  let routers = [];

  // Get all router configurations
  for (const file of routerFiles) {
    if (file.endsWith('.router.toml')) {
      const routerPath = path.join(routerDir, file);
      const routerConfig = TOML.parse(await fs.readFile(routerPath, 'utf8'));
      routers.push({
        id: file.replace('.router.toml', ''),
        ...routerConfig
      });
    }
  }

  // If no routers are found, return a message
  if (routers.length === 0) {
    return ApiResponse.OK('No routers found', { routers }).expressRespond(res);
  }

  // Return the list of routers
  return ApiResponse.OK(`Found ${routers.length} routers`, { routers }).expressRespond(res);
}

export async function getRouterController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  const routerContent = await fs.readFile(path.join(routerDir, `${routerId}.router.toml`), 'utf8');
  const routerConfig = TOML.parse(routerContent);
  return ApiResponse.OK(`Details of router ${routerId}`, { router: { id: routerId, ...routerConfig } }).expressRespond(res);
}

export async function createRouterController(req, res) {
  const {  name, domain,vpcId} = req.body;
  const routerId = req.params.routerId || ("router-"+Math.random().toString(36).substring(2, 10))
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // Validate the VPC ID
  if (!vpcId || typeof vpcId !== 'string' || vpcId.trim() === '') {
    return ApiResponse.BAD_REQUEST('VPC ID is required and must be a non-empty string').expressRespond(res);
  }

  // Validate the vpcId exists
  if (!(await VPCIdExists(vpcId))) {
    return ApiResponse.NOT_FOUND(`VPC ${vpcId} does not exist`).expressRespond(res);
  }

  // Validate the routerId
  if (!routerId || typeof routerId !== 'string' || routerId.trim() === '') {
    return ApiResponse.BAD_REQUEST('Router ID is required and must be a non-empty string').expressRespond(res);
  }

  // Ensure the router dose not already exist
  if (await routerIdExists(routerId)) {
    return ApiResponse.CONFLICT(`Router ${routerId} already exists`).expressRespond(res);
  }

  // Create the router configuration object
  const routerConfig = {
    id: routerId,
    name: name || routerId,
    domain: domain || 'default.domain.com',
    vpcId: vpcId || 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Write the router configuration to a TOML file
  try {
    await fs.writeFile(path.join(routerDir, `${routerId}.router.toml`), TOML.stringify(routerConfig), 'utf8');
    return ApiResponse.CREATED(`Router ${routerId} created successfully`, { router: { id: routerId, ...routerConfig } }).expressRespond(res);
  } catch (err) {
    console.error(`Error writing router configuration for ${routerId}: ${err.message}`);
    return ApiResponse.INTERNAL_SERVER_ERROR(`Error creating router ${routerId}`).expressRespond(res);
  }

}

export async function updateRouterController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  const routerContent = await fs.readFile(path.join(routerDir, `${routerId}.router.toml`), 'utf8');
  const routerConfig = TOML.parse(routerContent);

  // Update the router configuration with new values
  if (req.body.name) routerConfig.name = req.body.name;
  if (req.body.domain) routerConfig.domain = req.body.domain;
  routerConfig.updatedAt = new Date().toISOString();

  // Write the updated router configuration back to the file
  await fs.writeFile(path.join(routerDir, `${routerId}.router.toml`), TOML.stringify(routerConfig), 'utf8');

  return ApiResponse.OK(`Router ${routerId} updated successfully`, { router: { id: routerId, ...routerConfig } }).expressRespond(res);
}

export async function deleteRouterController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // Delete the router file
  try {
    await fs.unlink(path.join(routerDir, `${routerId}.router.toml`));
    return ApiResponse.OK(`Router ${routerId} deleted successfully`).expressRespond(res);
  } catch (err) {
    console.error(`Error deleting router ${routerId}:`, err);
    return ApiResponse.INTERNAL_SERVER_ERROR(`Error deleting router ${routerId}`).expressRespond(res);
  }
}

export async function listRouterSubnetsController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const subnetDir = path.join(dataDir, 'subnets');

  try {
    // Read all subnet files in the directory
    const files = await fs.readdir(subnetDir);
    const subnets = [];

    for (const file of files) {
      if (file.endsWith('.subnet.toml')) {
        const subnetId = file.replace('.subnet.toml', '');
        const subnetContent = await fs.readFile(path.join(subnetDir, file), 'utf8');
        const subnetConfig = TOML.parse(subnetContent);
        if (subnetConfig.routerId === routerId) {
          subnets.push({ id: subnetId, ...subnetConfig });
        }
      }
    }

    return ApiResponse.OK(`Found ${subnets.length} subnets in router ${routerId}`, { subnets }).expressRespond(res);
  } catch (error) {
    console.error('Error reading subnets:', error);
    return ApiResponse.INTERNAL_SERVER_ERROR('Error fetching subnets').expressRespond(res);
  }
}