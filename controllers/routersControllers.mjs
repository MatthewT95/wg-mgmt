import path from 'path';
import { promises as fs } from 'fs';
import TOML from '@iarna/toml';
import { fileURLToPath } from 'url';
import { VPCIdExists } from '../utils/vaildate.mjs';

// Recreate __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getRoutersController(req, res) {
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // ensure the routers directory exists
  try {
    await fs.access(routerDir);
  } catch (err) {
    fs.mkdir(routerDir, { recursive: true });
    return res.status(200).json({ message: 'No routers found', status: 'success' });
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
    return res.status(200).json({ message: 'No routers found', status: 'success' });
  }

  // Return the list of routers
  return res.status(200).json({
    message: `Found ${routers.length} routers`,
    routers,
    status: 'success'
  });
}

export async function getRouterController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  const routerContent = await fs.readFile(path.join(routerDir, `${routerId}.router.toml`), 'utf8');
  const routerConfig = TOML.parse(routerContent);
  return res.status(200).json({
    message: `Details of router ${routerId}`,
    router: { id: routerId, ...routerConfig },
    status: 'success'
  });

}

export async function createRouterController(req, res) {
  const {  name, domain,vpcId} = req.body;
  const routerId = req.params.routerId || ("router-"+Math.random().toString(36).substring(2, 10))
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // Validate the VPC ID
  if (vpcId && !(await VPCIdExists(vpcId))) {
    return res.status(404).json({ message: `VPC ${vpcId} does not exist`, status: 'error' });
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
    return res.status(201).json({
      message: `Router ${routerId} created successfully`,
      router: { id: routerId, ...routerConfig },
      status: 'success'
    });
  }
  catch (err) {
    console.error(`Error writing router configuration for ${routerId}: ${err.message}`);
    return res.status(500).json({ message: `Error creating router ${routerId}`, status: 'error' });
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

  return res.status(200).json({
    message: `Router ${routerId} updated successfully`,
    router: { id: routerId, ...routerConfig },
    status: 'success'
  });

}

export async function deleteRouterController(req, res) {
  const routerId = req.params.routerId;
  const dataDir = path.join(__dirname, '..', 'data');
  const routerDir = path.join(dataDir, 'routers');

  // Delete the router file
  try {
    await fs.unlink(path.join(routerDir, `${routerId}.router.toml`));
    return res.status(200).json({ message: `Router ${routerId} deleted successfully`, status: 'success' });
  } catch (err) {
    console.error(`Error deleting router ${routerId}:`, err);
    return res.status(500).json({ message: `Error deleting router ${routerId}`, status: 'error' });
  }
}