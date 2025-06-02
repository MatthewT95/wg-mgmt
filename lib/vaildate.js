const e = require("express");

async function vaildIPAddress(ip) {
  // split the IP address into its components
  const parts = ip.split('.');
  // check if the IP address has exactly 4 parts
  if (parts.length !== 4) {
    return false;
  }
  // check if each part is a number between 0 and 255
  for (const part of parts) {
    // check if the part is a number
    if (!/^\d+$/.test(part)) {
      return false;
    }
    // parse the part as an integer
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      return false;
    }
  }
  // if all checks pass, return true
  return true;
}

async function vaildIPNetwork(network) {
  // split the network into its components
  const parts = network.split('/');
  // check if the network has exactly 2 parts
  if (parts.length !== 2) {
    return false;
  }
  // validate the IP address part
  const ip = parts[0];
  if (!await vaildIPAddress(ip)) {
    return false;
  }
  // validate the subnet mask part
  const mask = parseInt(parts[1], 10);
  if (isNaN(mask) || mask < 0 || mask > 32) {
    return false;
  }
  // if all checks pass, return true
  return true;
}
module.exports = {
  vaildIPAddress,
  vaildIPNetwork
};