import { VPCIdExists,routerIdExists,subnetIdExists } from "./vaildate.mjs";
import ApiResponse from "./apiResponse.mjs";
export async function vpcExistsMiddleware(req, res, next) {
  const vpcId = req.params.vpcId;
  
  // Check if the VPC ID exists
  if (!await VPCIdExists(vpcId)) {
    return ApiResponse.NOT_FOUND(`VPC ${vpcId} does not exist`).expressRespond(res);
  }
  
  // If it exists, proceed to the next middleware/controller
  next();
}

export async function routerExistsMiddleware(req, res, next) {
  const routerId = req.params.routerId;

  // Check if the Router ID exists
  if (!await routerIdExists(routerId)) {
    return ApiResponse.NOT_FOUND(`Router ${routerId} does not exist`).expressRespond(res);
  }

  // If it exists, proceed to the next middleware/controller
  next();
}

export async function subnetExistsMiddleware(req, res, next) {
  const subnetId = req.params.subnetId;
  
  // Check if the Subnet ID exists
  if (!await subnetIdExists(subnetId)) {
    return ApiResponse.NOT_FOUND(`Subnet ${subnetId} does not exist`).expressRespond(res);
  }
  
  // If it exists, proceed to the next middleware/controller
  next();
}