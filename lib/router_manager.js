const { exec, execSync } = require('child_process');
const fs  = require('fs');
const TOML  = require('@iarna/toml');
const { generateLANInterfaceConfig } = require('./wg_config.js');
const path = require('path');
const { disallowMeshTraffic} = require('./iptables.js');
const { createNetworkNamespace ,deleteNetworkNamespace,createWireGuardInterface,interfaceUp,interfaceDown} = require('./networks.js');

function routerStart(router_id) {
  // Create lock file to prevent multiple instances
  const lockFilePath = `data/routers/${router_id}/.lock`;
  if (fs.existsSync(lockFilePath)) {
    console.error(`Router ${router_id} is already running.`);
    return;
  }
  fs.writeFileSync(lockFilePath, 'locked');

  console.log(`Starting router ${router_id}...`);
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
  // Check if the router is running
  const lockFilePath = `data/routers/${router_id}/.lock`;
  if (!fs.existsSync(lockFilePath)) {
    console.error(`Router ${router_id} is not running.`);
    return;
  }
  
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


  // Stop WireGuard interfaces
  for (const lanId of lanIds) {
    const interfaceName = lanConfigs[lanId].interface;
    interfaceDown(interfaceName, `ns_${router_id}`);
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
  
  // Remove lock file
  fs.unlinkSync(lockFilePath);
  console.log(`Stopping router ${router_id}...`);
}

function routerStatus(router_id) {
  const lockFilePath = `data/routers/${router_id}/.lock`;
  const configFiles = fs.readdirSync(`data/routers/${router_id}`);
  const routerConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}/router.toml`,{ encoding: 'utf8' }));
  // hide privacy key
  routerConfig.privacyKey = '(hidden)';
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
      // hide privacy key
      remoteConfig.privateKey = '(hidden)';
      if (remoteConfig.lanId) {
        remoteConfigs.push(remoteConfig);
      }
    }
  }

  // Check if the router is running
  if (routerIsRunning(router_id)) {
    console.log(`Router ${router_id} is currently running.`);
  } else {
    console.log(`Router ${router_id} is not running.`);
  }

  // Print router configuration
  console.log(`Router Configuration for ${router_id}:`);
  console.log(routerConfig);
  // Print LAN configurations
  console.log(`LAN Configurations for ${router_id}:`);
  for (const lanId of lanIds) {
    console.log(`LAN ID: ${lanId}`);
    console.log(lanConfigs[lanId]);
  }
  // Print remote configurations
  console.log(`Remote Configurations for ${router_id}:`);
  for (const remoteConfig of remoteConfigs) {
    console.log(remoteConfig);
  }
}

function routerIsRunning(router_id) {
  const lockFilePath = `data/routers/${router_id}/.lock`;
  return fs.existsSync(lockFilePath);
}

function routerRestart(router_id) {
  if (routerIsRunning(router_id)) {
    console.log(`Restarting router ${router_id}...`);
    routerStop(router_id);
  } else {
    console.log(`Router ${router_id} is not running. Starting it now...`);
  }
  routerStart(router_id);
}

module.exports = {
  routerStart,
  routerStop,
  routerStatus,
  routerIsRunning,
  routerRestart
};