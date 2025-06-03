const { exit } = require('process');
const { vaildIPAddress, vaildIPNetwork} = require('./vaildate.js');
const TOML = require('@iarna/toml');
const fs = require('fs').promises;

async function generateWGConfigPartialInterface(address,port,privatekey,dns) {
  
  // Validate the IP address
  if (!await vaildIPAddress(address)) {
    throw new Error("Invalid IP address format.");
  }
  // Validate the port number
  if (port && (isNaN(port) || port < 1 || port > 65535)) {
    throw new Error("Port number must be between 1 and 65535.");
  }
  // Vaildate dns ip
  if (dns && !await vaildIPAddress(dns)) {
    throw new Error("Invalid DNS IP address format.");
  }

  let configPartial = "[Interface]\n";
  // Add the address to confgiration
  if (address) {
    configPartial += `Address = ${address}/32\n`;
  }
  else {
    throw new Error("Address is required for the interface configuration.");
  }

  // Add the port to configuration
  if (port) {
    configPartial += `ListenPort = ${port}\n`;
  }
  // Add the private key to configuration
  if (privatekey) {
    configPartial += `PrivateKey = ${privatekey}\n`;
  }
  else {
    throw new Error("Private key is required for the interface configuration.");
  }
  // Add the DNS to configuration
  if (dns) {
    configPartial += `DNS = ${dns}\n`;
  }
  // Return the configuration partial
  return configPartial.trim(); // Remove trailing whitespace
}

async function generateWGConfigPartialPeer(publickey,endpoint,allowedips) {
  // Validate the public key
  if (!publickey || typeof publickey !== 'string' || publickey.trim() === '') {
    throw new Error("Public key is required for the peer configuration.");
  }

  // Vaildate allowed IPs
  let allowedipsArray = allowedips ? allowedips.split(',').map(ip => ip.trim()) : [];
  for (const ip of allowedipsArray) {
    if (!await vaildIPNetwork(ip)) {
      throw new Error(`Invalid Allowed IP address format: ${ip}`);
    }
  }

  // At least one allowed IP is required
  if (allowedipsArray.length === 0) {
    throw new Error("At least one Allowed IP is required for the peer configuration.");
  }
  
  let configPartial = "[Peer]\n";
  // Add the public key to configuration
  configPartial += `PublicKey = ${publickey}\n`;
  
  // Add the endpoint to configuration
  if (endpoint) {
    configPartial += `Endpoint = ${endpoint}\n`;
  }
  
  // Add the allowed IPs to configuration
  if (allowedips) {
    configPartial += `AllowedIPs = ${allowedips}\n`;
  }

  // Add the persistent keepalive to configuration
  configPartial += `PersistentKeepalive = 25\n`;
  
  return configPartial.trim(); // Remove trailing whitespace
}

async function generateLANInterfaceConfig(router_id,lan_id) {
  let wgconfig = "";
  const router_config = TOML.parse(await fs.readFile(`data/routers/${router_id}.toml`, 'utf8'));
  let lanConfig = router_config["interfaces"]["lans"].find(lan => lan.lanId === lan_id);
  let peerConfigs = router_config["interfaces"]["enddevices"].filter(peer => peer.lan === lan_id);

  if (!lanConfig) {
    throw new Error(`LAN with ID ${lan_id} not found in router ${router_id} configuration.`);
  }
  wgconfig += await generateWGConfigPartialInterface(
    lanConfig.address,
    lanConfig.port,
    lanConfig.privateKey,
    null
  )+ '\n\n';
  // Add peers to the configuration
  for (const peer of peerConfigs) {
    wgconfig += await generateWGConfigPartialPeer(
      peer.publicKey,
      null,
      peer.address + '/32'
    ) + '\n\n';
  }

  return wgconfig;
}

async function generateEndDeviceInterfaceConfig(router_id,enddevice_id) {
  let wgconfig = "";
  const router_config = await TOML.parse(await fs.readFile(`data/routers/${router_id}.toml`, 'utf8'));
  const endDeviceConfig = router_config["interfaces"]["enddevices"].find(device => device.clientId === enddevice_id);
  const lanConfig = router_config["interfaces"]["lans"].find(lan => lan.lanId === endDeviceConfig.lan);
  let allowedIPs = router_config["interfaces"]["lans"].map((lan) => lan.network).join(',');
  if (!endDeviceConfig) {
    throw new Error(`End device with ID ${enddevice_id} not found in router ${router_id} configuration.`);
  }

  if (!lanConfig) {
    throw new Error(`LAN with ID ${endDeviceConfig.lan} not found in router ${router_id} configuration.`);
  }

  // Add the endevice interface configuration
  wgconfig += await generateWGConfigPartialInterface(
    endDeviceConfig.address,
    null,
    endDeviceConfig.privateKey,
    null
  ) + '\n\n';

  // Add the peer configuration for the end device
  wgconfig += await generateWGConfigPartialPeer(
    lanConfig.publicKey,
    `${router_config.serverDomain}:${lanConfig.port}`,
    allowedIPs,
  ) + '\n\n';


  return wgconfig;
}

module.exports = {
  generateWGConfigPartialInterface,
  generateWGConfigPartialPeer,
  generateLANInterfaceConfig,
  generateEndDeviceInterfaceConfig
};