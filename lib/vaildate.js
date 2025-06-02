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

module.exports = {
  vaildIPAddress
};