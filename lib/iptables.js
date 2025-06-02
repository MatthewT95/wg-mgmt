const {exec, execSync } = require('child_process');

// Blocks traffic to a destination network by adding a DROP rule
function blockDestinationNetwork(destinationNetwork) {
   // Check if rule already exists
   try {
    execSync(`iptables -C INPUT -d ${destinationNetwork} -j DROP 2> /dev/null`);
    console.log(`Rule to drop traffic to ${destinationNetwork} already exists.`);
    return;
  } catch (error) {
    // If the rule does not exist, add it
    execSync(`iptables -A INPUT -d ${destinationNetwork} -j DROP`, (err) => {
      if (err) {
        console.error(`Error adding iptables rule: ${err.message}`);
      } else {
        console.log(`Rule added to drop traffic to ${destinationNetwork}`);
      }
    });
  }
}

// Unblocks traffic to a destination network by removing the DROP rule
function unblockDestinationNetwork(destinationNetwork) {
  // Check if rule exists

  try {
    execSync(`iptables -C INPUT -d ${destinationNetwork} -j DROP 2> /dev/null`);
    console.log(`Rule to drop traffic to ${destinationNetwork} exists, removing it.`);
  }
  catch (error) {
    console.log(`No rule found to drop traffic to ${destinationNetwork}.`);
    return;
  }
}

// Allows traffic from a source network to a destination network
function allowSourceNetwork(sourceNetwork, destinationNetwork) {
  // Check if rule already exists

  try {
    execSync(`iptables -C INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT 2> /dev/null`);
    console.log(`Rule to allow traffic from ${sourceNetwork} to ${destinationNetwork} already exists.`);
    return;
  } catch (error) {
    // If the rule does not exist, add it
    try {
    execSync(`iptables -I INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`);
    console.log(`Rule added to allow traffic from ${sourceNetwork} to ${destinationNetwork}`);
    }
    catch (err) {
      console.error(`Error adding iptables rule: ${err.message}`);
    }
  }
}

// Disallows traffic from a source network to a destination network
function disallowSourceNetwork(sourceNetwork, destinationNetwork) {
  // Check if rule exists

  try {
    execSync(`iptables -C INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT 2> /dev/null`);
    console.log(`Rule to allow traffic from ${sourceNetwork} to ${destinationNetwork} exists, removing it.`);
  } catch (error) {
    console.log(`No rule found to allow traffic from ${sourceNetwork} to ${destinationNetwork}.`);
    return;
  }

  // If the rule exists, delete it
  try {
    execSync(`iptables -D INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`);
    console.log(`Rule removed to disallow traffic from ${sourceNetwork} to ${destinationNetwork}`);
  } catch (err) {
    console.error(`Error removing iptables rule: ${err.message}`);
  }
}

// Allows bidirectional traffic between two networks
function allowBidirectionalTraffic(sourceNetwork, destinationNetwork) {
  allowSourceNetwork(sourceNetwork, destinationNetwork);
  allowSourceNetwork(destinationNetwork, sourceNetwork);
}

// Disallows bidirectional traffic between two networks
function disallowBidirectionalTraffic(sourceNetwork, destinationNetwork) {
  disallowSourceNetwork(sourceNetwork, destinationNetwork);
  disallowSourceNetwork(destinationNetwork, sourceNetwork);
}

// Allows traffic from a network to itself
function allowSelfTraffic(network) {  
  allowSourceNetwork(network, network)
}

// Allows traffic from a list of sources to a destination
function allowSources(sources, destination) {
  for (const source of sources) {
    allowSourceNetwork(source, destination);
  }
}

// Disallows traffic from a list of sources to a destination
function disallowSources(sources, destination) {
  for (const source of sources) {
    disallowSourceNetwork(source, destination);
  }
}

// Allows bidirectional traffic between a list of sources and a destination
function allowSourcesBidirectional(sources, destination) {
  for (const source of sources) {
    allowBidirectionalTraffic(source, destination);
  }
}

// Disallows bidirectional traffic between a list of sources and a destination
function disallowSourcesBidirectional(sources, destination) {
  for (const source of sources) {
    disallowBidirectionalTraffic(source, destination);
  }
}

// Allows mesh traffic by allowing bidirectional traffic between all networks
function allowMeshTraffic(networks) {
  for (let network_index = 0; network_index < networks.length; network_index++) {
    const network = networks[network_index];
    // Allow traffic from the network to itself
    allowSelfTraffic(network);
    // Allow bidirectional traffic between the network and all other networks
    for (let other_network_index = network_index+1; other_network_index < networks.length; other_network_index++) {
      const otherNetwork = networks[other_network_index];
      allowBidirectionalTraffic(network, otherNetwork);
    }
  }
}

// Disallows mesh traffic by blocking all traffic between the networks
function disallowMeshTraffic(networks) {
  for (const network of networks) {
    // Disallow traffic from the network to itself
    disallowSourceNetwork(network, network);
    // Disallow bidirectional traffic between the network and all other networks
    for (const otherNetwork of networks) {
      if (network !== otherNetwork) {
        disallowBidirectionalTraffic(network, otherNetwork);
      }
    }
  }
}

module.exports = {
  blockDestinationNetwork,
  unblockDestinationNetwork,
  allowSourceNetwork,
  disallowSourceNetwork,
  allowBidirectionalTraffic,
  disallowBidirectionalTraffic,
  allowSelfTraffic,
  allowSources,
  disallowSources,
  allowSourcesBidirectional,
  disallowSourcesBidirectional,
  allowMeshTraffic,
  disallowMeshTraffic
};