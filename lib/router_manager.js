const { exec, execSync } = require('child_process');
const fs  = require('fs');
const TOML  = require('@iarna/toml');
const { generateLANInterfaceConfig } = require('./wg_config.js');
const path = require('path');
const { blockDestinationNetwork  , allowSelfTraffic,allowMeshTraffic, disallowMeshTraffic} = require('./iptables.js');
const {createNamespace, deleteNamespace, setInterfaceNamespace, unsetInterfaceNamespace} = require('./netns.js');
async function routerStart(router_id) {
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
  try {
    for (const lanId of lanIds) {
      const namespace = `ns_${router_id}`;
      createNamespace(namespace);
      console.log(`Namespace created: ${namespace}`);
    }
  }
  catch (error) {
    console.error(`Error creating namespaces: ${error.message}`);
  }
  // generate new wireguard configuration files
  for (const lanId of lanIds) {
    try {
      const lanConfig = lanConfigs[lanId];
      const wgConfig = await generateLANInterfaceConfig(router_id, lanId);
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
    try {
    execSync(`wg-quick up ${interfaceName}`);
    console.log(`WireGuard interface ${interfaceName} started successfully.`);
    }
    catch (error) {
      console.error(`Error starting WireGuard interface ${interfaceName}: ${error.message}`);
    }

    // Set the interface to the corresponding namespace
    const namespace = `ns_${router_id}`;
    try {
      setInterfaceNamespace(interfaceName, namespace);
      console.log(`Interface ${interfaceName} set to namespace ${namespace}`);
    } catch (error) {
      console.error(`Error setting interface ${interfaceName} to namespace ${namespace}: ${error.message}`);
    }
  }

}

async function routerStop(router_id) {
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
}

module.exports = {
  routerStart,
  routerStop
};