const { exec, execSync } = require('child_process');
const fs  = require('fs');
const TOML  = require('@iarna/toml');
const { generateLANInterfaceConfig } = require('./wg_config.js');
const path = require('path');
const { blockDestinationNetwork  , allowSelfTraffic,allowMeshTraffic, disallowMeshTraffic} = require('./iptables.js');

async function routerStart(router_id) {
  console.log(`data/routers/${router_id}.toml`);
  const routerConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}.toml`,{ encoding: 'utf8' }));
  const lans = routerConfig.interfaces.lans
 
  // generate new wireguard configuration files
  for (const lan of lans) {
    try {
      const wgConfig = await generateLANInterfaceConfig(router_id, lan.lanId);
      const configFilePath = `/etc/wireguard/${lan.wgInterface}.conf`;
      fs.writeFileSync(configFilePath, wgConfig);
      console.log(`WireGuard configuration file created: ${configFilePath}`);
    } catch (error) {
      console.error(`Error generating WireGuard configuration for LAN ${lan.lanId}: ${error.message}`);
    }
  }

  // start wireguard interfaces
  for (const lan of lans) {
    const interfaceName = lan.wgInterface;
    try {
    execSync(`wg-quick up ${interfaceName}`);
    console.log(`WireGuard interface ${interfaceName} started successfully.`);
    }
    catch (error) {
      console.error(`Error starting WireGuard interface ${interfaceName}: ${error.message}`);
      exit(1); // Exit if any interface fails to start
    }
  }

  // Block all traffic by default
  for (const lan of lans) {
    const destinationNetwork = lan.address;
    blockDestinationNetwork(destinationNetwork);
    console.log(`Blocked all traffic to destination network: ${destinationNetwork}`);
  }

  // Allow traffic between LANs of this router if mesh is enabled
  if (routerConfig.allowMesh === true || routerConfig.allowMesh == null)
  {
    // Allow mesh traffic if configured
    const networks = lans.map(lan => lan.network);
    allowMeshTraffic(networks);
    console.log(`Allowed mesh traffic for networks: ${networks.join(', ')}`);
  }
  else {
    // Allow self traffic for each LAN
    for (const lan of lans) {
      const network = lan.network;
      allowSelfTraffic(network);
      console.log(`Allowed self traffic for network: ${network}`);
    }
  }

}

async function routerStop(router_id) {
  const routerConfig = TOML.parse(fs.readFileSync(`data/routers/${router_id}.toml`,{ encoding: 'utf8' }));
  const lans = routerConfig.interfaces.lans;

  // Disallow traffic between LANs of this router if mesh is enabled
  if (routerConfig.allowMesh === true || routerConfig.allowMesh == null)
  {
    // Allow mesh traffic if configured
    const networks = lans.map(lan => lan.network);
    disallowMeshTraffic(networks);
    console.log(`Disallowed mesh traffic for networks: ${networks.join(', ')}`);
  }
  else {
    // Allow self traffic for each LAN
    for (const lan of lans) {
      const network = lan.network;
      disallowSelfTraffic(network);
      console.log(`disallowed self traffic for network: ${network}`);
    }
  }

  // Unblock all traffic to destination networks
  for (const lan of lans) {
    const destinationNetwork = lan.address;
    try {
      execSync(`iptables -D INPUT -d ${destinationNetwork} -j ACCEPT`);
      console.log(`Unblocked traffic to destination network: ${destinationNetwork}`);
    } catch (error) {
      console.error(`Error unblocking traffic to destination network ${destinationNetwork}: ${error.message}`);
    }
  }

  // Stop WireGuard interfaces
  for (const lan of lans) {
    const interfaceName = lan.wgInterface;
    try {
      execSync(`wg-quick down ${interfaceName}`);
      console.log(`WireGuard interface ${interfaceName} stopped successfully.`);
    } catch (error) {
      console.error(`Error stopping WireGuard interface ${interfaceName}: ${error.message}`);
    }
  }

  // Remove WireGuard configuration files
  for (const lan of lans) {
    const configFilePath = `/etc/wireguard/${lan.wgInterface}.conf`;
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