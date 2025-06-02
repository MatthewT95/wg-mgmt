const {exec } = require('child_process');

// Blocks traffic to a destination network by adding a DROP rule
async function blockDestinationNetwork(destinationNetwork) {
   // Check if rule already exists
   exec(`iptables -C INPUT -d ${destinationNetwork} -j DROP`, (error) => {
    if (error) {
      // If the rule does not exist, add it
      exec(`iptables -A INPUT -d ${destinationNetwork} -j DROP`, (err) => {
        if (err) {
          console.error(`Error adding iptables rule: ${err.message}`);
        } else {
          console.log(`Rule added to drop traffic to ${destinationNetwork}`);
        }
      });
    }
    else {
      console.log(`Rule to drop traffic to ${destinationNetwork} already exists.`);
    }
  })
}

// Unblocks traffic to a destination network by removing the DROP rule
async function unblockDestinationNetwork(destinationNetwork) {
  // Check if rule exists
  exec(`iptables -C INPUT -d ${destinationNetwork} -j DROP`, (error) => {
    if (!error) {
      // If the rule exists, delete it
      exec(`iptables -D INPUT -d ${destinationNetwork} -j DROP`, (err) => {
        if (err) {
          console.error(`Error removing iptables rule: ${err.message}`);
        } else {
          console.log(`Rule removed to allow traffic to ${destinationNetwork}`);
        }
      });
    } else {
      console.log(`No rule found to drop traffic to ${destinationNetwork}.`);
    }
  });
}

// Allows traffic from a source network to a destination network
async function allowSourceNetwork(sourceNetwork, destinationNetwork) {
  // Check if rule already exists
  exec(`iptables -C INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`, (error) => {
    if (error) {
      // If the rule does not exist, add it
      exec(`iptables -I INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`, (err) => {
        if (err) {
          console.error(`Error adding iptables rule: ${err.message}`);
        } else {
          console.log(`Rule added to allow traffic from ${sourceNetwork} to ${destinationNetwork}`);
        }
      });
    } else {
      console.log(`Rule to allow traffic from ${sourceNetwork} to ${destinationNetwork} already exists.`);
    }
  });
}

// Disallows traffic from a source network to a destination network
async function disallowSourceNetwork(sourceNetwork, destinationNetwork) {
  // Check if rule exists
  exec(`iptables -C INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`, (error) => {
    if (!error) {
      // If the rule exists, delete it
      exec(`iptables -D INPUT -s ${sourceNetwork} -d ${destinationNetwork} -j ACCEPT`, (err) => {
        if (err) {
          console.error(`Error removing iptables rule: ${err.message}`);
        } else {
          console.log(`Rule removed to disallow traffic from ${sourceNetwork} to ${destinationNetwork}`);
        }
      });
    } else {
      console.log(`No rule found to allow traffic from ${sourceNetwork} to ${destinationNetwork}.`);
    }
  });
}

// Allows bidirectional traffic between two networks
async function allowBidirectionalTraffic(sourceNetwork, destinationNetwork) {
  await allowSourceNetwork(sourceNetwork, destinationNetwork);
  await allowSourceNetwork(destinationNetwork, sourceNetwork);
}

// Disallows bidirectional traffic between two networks
async function disallowBidirectionalTraffic(sourceNetwork, destinationNetwork) {
  await disallowSourceNetwork(sourceNetwork, destinationNetwork);
  await disallowSourceNetwork(destinationNetwork, sourceNetwork);
}

// Allows traffic from a network to itself
async function allowSelfTraffic(network) {  
  await allowSourceNetwork(network, network)
}

// Allows traffic from a list of sources to a destination
async function allowSources(sources, destination) {
  for (const source of sources) {
    await allowSourceNetwork(source, destination);
  }
}

// Disallows traffic from a list of sources to a destination
async function disallowSources(sources, destination) {
  for (const source of sources) {
    await disallowSourceNetwork(source, destination);
  }
}

// Allows bidirectional traffic between a list of sources and a destination
async function allowSourcesBidirectional(sources, destination) {
  for (const source of sources) {
    await allowBidirectionalTraffic(source, destination);
  }
}

// Disallows bidirectional traffic between a list of sources and a destination
async function disallowSourcesBidirectional(sources, destination) {
  for (const source of sources) {
    await disallowBidirectionalTraffic(source, destination);
  }
}

// Allows mesh traffic by allowing bidirectional traffic between all networks
async function allowMeshTraffic(networks) {
  for (const network of networks) {
    // Allow traffic from the network to itself
    await allowSelfTraffic(network);
    // Allow bidirectional traffic between the network and all other networks
    for (const otherNetwork of networks) {
      if (network !== otherNetwork) {
        await allowBidirectionalTraffic(network, otherNetwork);
      }
    }
  }
}

// Disallows mesh traffic by blocking all traffic between the networks
async function disallowMeshTraffic(networks) {
  for (const network of networks) {
    // Disallow traffic from the network to itself
    await disallowSourceNetwork(network, network);
    // Disallow bidirectional traffic between the network and all other networks
    for (const otherNetwork of networks) {
      if (network !== otherNetwork) {
        await disallowBidirectionalTraffic(network, otherNetwork);
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