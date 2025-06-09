import { VPCIdExists,routerIdExists,subnetIdExists } from "./vaildate.mjs";

export async function vpcExistsMiddleware(req, res, next) {
  const vpcId = req.params.vpcId;
  
  // Check if the VPC ID exists
  if (!await VPCIdExists(vpcId)) {
    return res.status(404).json({ message: `VPC ${vpcId} does not exist`, status: 'error' });
  }
  
  // If it exists, proceed to the next middleware/controller
  next();
}

export async function routerExistsMiddleware(req, res, next) {
  const routerId = req.params.routerId;

  // Check if the Router ID exists
  if (!await routerIdExists(routerId)) {
    return res.status(404).json({ message: `Router ${routerId} does not exist`, status: 'error' });
  }

  // If it exists, proceed to the next middleware/controller
  next();
}

export async function subnetExistsMiddleware(req, res, next) {
  const subnetId = req.params.subnetId;
  
  // Check if the Subnet ID exists
  if (!await subnetIdExists(subnetId)) {
    return res.status(404).json({ message: `Subnet ${subnetId} does not exist`, status: 'error' });
  }
  
  // If it exists, proceed to the next middleware/controller
  next();
}