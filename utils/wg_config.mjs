import { vaildIPAddress, vaildIPNetwork } from './vaildate.mjs';
import TOML from '@iarna/toml';
import fs from 'fs';

export function generateWGConfigPartialInterface(address,port,privatekey,dns) {
  
  // Validate the IP address
  if (!vaildIPAddress(address)) {
    throw new Error("Invalid IP address format.");
  }
  // Validate the port number
  if (port && (isNaN(port) || port < 1 || port > 65535)) {
    throw new Error("Port number must be between 1 and 65535.");
  }
  // Vaildate dns ip
  if (dns && !vaildIPAddress(dns)) {
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

export function generateWGConfigPartialPeer(publickey,endpoint,allowedips,persistentKeepalive) {
  // Validate the public key
  if (!publickey || typeof publickey !== 'string' || publickey.trim() === '') {
    throw new Error("Public key is required for the peer configuration.");
  }

  // Vaildate allowed IPs
  let allowedipsArray = allowedips ? allowedips.split(',').map(ip => ip.trim()) : [];
  for (const ip of allowedipsArray) {
    if (!vaildIPNetwork(ip)) {
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
  if (persistentKeepalive){
  configPartial += `PersistentKeepalive = 25\n`;
  }
  
  return configPartial.trim(); // Remove trailing whitespace
}

export function generateLANInterfaceConfig(router_id,lan_id,vpcId) {
  let wgconfig = "";
  const configFiles = fs.readdirSync(`data/vpcs/${vpcId}/routers/${router_id}`);
  const routerConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/router.toml`, 'utf8'));
  const lanConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/${lan_id}.lan.toml`, 'utf8'));
  let remoteConfigs = []
  // Filter for .remote.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.remote.toml')) {
      const remoteConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/${file}`, 'utf8'));
      if (remoteConfig.lanId === lan_id) {
        remoteConfigs.push(remoteConfig);
      }
    }
  }
  if (!lanConfig) {
    throw new Error(`LAN with ID ${lan_id} not found in router ${router_id} configuration.`);
  }
  wgconfig += generateWGConfigPartialInterface(
    lanConfig.gateway,
    lanConfig.port,
    routerConfig.privateKey,
    null
  )+ '\n\n';
  // Add peers to the configuration
  for (const remote of remoteConfigs) {
    wgconfig += generateWGConfigPartialPeer(
      remote.publicKey,
      null,
      remote.address + '/32',
      true
    ) + '\n\n';
  }

  return wgconfig;
}

export function generateEndDeviceInterfaceConfig(router_id,remote_id, vpcId) {
  let wgconfig = "";
  const routerConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/router.toml`, 'utf8'));
  const remoteConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/${remote_id}.remote.toml`, 'utf8'));
  const lanConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/${remoteConfig.lanId}.lan.toml`, 'utf8'));
  const lanConfigs = []
  const configFiles = fs.readdirSync(`data/routers/${router_id}`);

  // Filter for .lan.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.lan.toml')) {
      const lanConfig = TOML.parse(fs.readFileSync(`data/vpcs/${vpcId}/routers/${router_id}/${file}`, 'utf8'));
      lanConfigs.push(lanConfig);
    }
  }

  // Retrieve the networks from all LAN configurations and add them to allowedIPs
  let allowedIPs = lanConfigs.map((lan) => lan.network).join(',');
  if (!remoteConfig) {
    throw new Error(`Remote with ID ${remote_id} not found in router ${router_id} configuration.`);
  }

  if (!lanConfig) {
    throw new Error(`LAN with ID ${remoteConfig.lanId} not found in router ${router_id} configuration.`);
  }

  // Add the endevice interface configuration
  wgconfig += generateWGConfigPartialInterface(
    remoteConfig.address,
    null,
    remoteConfig.privateKey,
    null
  ) + '\n\n';

  // Add the peer configuration for the end device
  wgconfig += generateWGConfigPartialPeer(
    routerConfig.publicKey,
    `${routerConfig.domain}:${lanConfig.port}`,
    allowedIPs,
    true
  ) + '\n\n';


  return wgconfig;
}