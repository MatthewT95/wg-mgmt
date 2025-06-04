const { exec, execSync } = require('child_process');
const fs  = require('fs');
const TOML  = require('@iarna/toml');
const { generateLANInterfaceConfig } = require('./wg_config.js');
const path = require('path');
const { disallowMeshTraffic} = require('./iptables.js');
const { createNetworkNamespace ,deleteNetworkNamespace,createWireGuardInterface,interfaceUp } = require('./networks.js');

function routerStart(router_id) {
  const configFiles = fs.readdirSync(`data/routers/${router_id}`);
  const routerConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/router.toml`,{ encoding: 'utf8' }));
  let lanIds = []
  let lanConfigs = [];
  let remoteConfigs = [];
  // Filter for .lan.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.lan.toml')) {
      const lanConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/${file}`,{ encoding: 'utf8' }));
      lanIds.push(file.replace('.lan.toml', ''));
      lanConfigs[file.replace('.lan.toml','')]=lanConfig;
    }
  }

  // Filter for .remote.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.remote.toml')) {
      const remoteConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/${file}`,{ encoding: 'utf8' }));
      if (remoteConfig.lanId) {
        remoteConfigs.push(remoteConfig);
      }
    }
  }
 
  // Create namespaces for each LAN
  createNetworkNamespace(`ns_${router_id}`);
  interfaceUp('lo', `ns_${router_id}`);

  // generate new wireguard configuration files
  for (const lanId of lanIds) {
    try {
      const lanConfig = lanConfigs[lanId];
      const wgConfig = generateLANInterfaceConfig(router_id, lanId)
      const configFilePath = `/etc/wireguard/${lanConfig.interface}.conf`;
      fs.writeFileSync(configFilePath, wgConfig);
      console.log(`WireGuard configuration file created: ${configFilePath}`);
    } catch (error) {
      console.error(`Error generating WireGuard configuration for LAN ${lanId}: ${error.message}`);
    }
  }

  // start wireguard interfaces
  for (const lanId of lanIds) {
    const interfaceName = lanConfigs[lanId].interface;
    createWireGuardInterface(interfaceName, `ns_${router_id}`,lanConfigs[lanId].gateway,lanConfigs[lanId].network);
  }

}

function routerStop(router_id) {
  const configFiles = fs.readdirSync(`data/routers/${router_id}`);
  const routerConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/router.toml`,{ encoding: 'utf8' }));
  let lanIds = []
  let lanConfigs = [];
  let remoteConfigs = [];
  // Filter for .lan.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.lan.toml')) {
      const lanConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/${file}`,{ encoding: 'utf8' }));
      lanIds.push(file.replace('.lan.toml', ''));
      lanConfigs[file.replace('.lan.toml','')]=lanConfig;
    }
  }

  // Filter for .remote.toml files in the router's directory
  for (const file of configFiles) {
    if (file.endsWith('.remote.toml')) {
      const remoteConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/${file}`,{ encoding: 'utf8' }));
      if (remoteConfig.lanId) {
        remoteConfigs.push(remoteConfig);
      }
    }
  }

  // Disallow traffic between LANs of this router if mesh is enabled
  if (routerConfig.allowMesh === true || routerConfig.allowMesh == null)
  {
    // Allow mesh traffic if configured
    const networks = lanIds.map(lanId => lanConfigs[lanId].network);
    disallowMeshTraffic(networks);
    console.log(`Disallowed mesh traffic for networks: ${networks.join(', ')}`);
  }
  else {
    // Allow self traffic for each LAN
    for (const lanId of lanIds) {
      const network = lanConfigs[lanId].network;
      disallowSelfTraffic(network);
      console.log(`disallowed self traffic for network: ${network}`);
    }
  }

  // Unblock all traffic to destination networks
  for (const lanId of lanIds) {
    const destinationNetwork = lanConfigs[lanId].network;
    try {
      execSync(`iptables -D INPUT -d ${destinationNetwork} -j ACCEPT`);
      console.log(`Unblocked traffic to destination network: ${destinationNetwork}`);
    } catch (error) {
      console.error(`Error unblocking traffic to destination network ${destinationNetwork}: ${error.message}`);
    }
  }

  // Stop WireGuard interfaces
  for (const lanId of lanIds) {
    const interfaceName = lanConfigs[lanId].interface;
    try {
      execSync(`wg-quick down ${interfaceName}`);
      console.log(`WireGuard interface ${interfaceName} stopped successfully.`);
    } catch (error) {
      console.error(`Error stopping WireGuard interface ${interfaceName}: ${error.message}`);
    }
  }

  // Remove WireGuard configuration files
  for (const lanId of lanIds) {
    const configFilePath = `/etc/wireguard/${lanConfigs[lanId].interface}.conf`;
    try {
      fs.unlinkSync(configFilePath);
      console.log(`WireGuard configuration file removed: ${configFilePath}`);
    } catch (error) {
      console.error(`Error removing WireGuard configuration file ${configFilePath}: ${error.message}`);
    }
  }

  // Delete namespaces for router
  deleteNetworkNamespace(`ns_${router_id}`);
  
}

module.exports = {
  routerStart,
  routerStop
};