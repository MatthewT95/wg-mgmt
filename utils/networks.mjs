import {execSync} from 'child_process';

export function createNetworkNamespace(namespace) {
  try {
    const existing = execSync(`ip netns list`).toString();
    if (existing.includes(namespace)) {
      console.log(`Namespace ${namespace} already exists.`);
    } else {
      execSync(`ip netns add ${namespace} 1> /dev/null`);
      console.log(`Namespace ${namespace} created.`);
    }
  } catch (error) {
    console.error(`Error creating namespace ${namespace}: ${error.message}`);
  }
}

export function deleteNetworkNamespace(namespace) {
  try {
    const existing = execSync(`ip netns list`).toString();
    if (!existing.includes(namespace)) {
      console.log(`Namespace ${namespace} does not exist.`);
    } else {
      execSync(`ip netns delete ${namespace} 1> /dev/null`);
      console.log(`Namespace ${namespace} deleted.`);
    }
  } catch (error) {
    console.error(`Error deleting namespace ${namespace}: ${error.message}`);
  }
}

export function createWireGuardInterface(interfaceName, namespace,ipAddress,network) {
  try {
    // Check if the namespace exists
    const existingNamespaces = execSync(`ip netns list`).toString();
    if (!existingNamespaces.includes(namespace)) {
      console.error(`Namespace ${namespace} does not exist. Please create it first.`);
      return;
    }
    // Check if the interface already exists
    const existingInterfaces = execSync(`ip netns exec ${namespace} ip link show`).toString();
    if (existingInterfaces.includes(interfaceName)) {
      console.log(`WireGuard interface ${interfaceName} already exists in namespace ${namespace}.`);
      return;
    }

    if (!ipAddress) {
      console.error(`IP address is required for creating WireGuard interface ${interfaceName}.`);
      return;
    }
    execSync(`ip link add ${interfaceName} type wireguard`, { stdio: 'ignore' });
    execSync(`ip link set ${interfaceName} netns ${namespace}`, { stdio: 'ignore' });
    execSync(`bash -c "ip netns exec ${namespace} wg setconf ${interfaceName} <(wg-quick strip ${interfaceName})"`);
    execSync(`ip netns exec ${namespace} ip addr add ${ipAddress} dev ${interfaceName}`, { stdio: 'ignore' });
    execSync(`ip netns exec ${namespace} ip link set ${interfaceName} up`, { });
    execSync(`ip -n ${namespace} route add ${network} dev ${interfaceName}`, {  });
  } catch (error) {
    console.error(`Error creating WireGuard interface ${interfaceName} in namespace ${namespace}: ${error.message}`);
  }
}

export function interfaceUp(interfaceName, namespace) {
  try {
    execSync(`ip -n ${namespace} link set ${interfaceName} up`, { stdio: 'ignore' });
    console.log(`WireGuard interface ${interfaceName} is now up in namespace ${namespace}.`);
  } catch (error) {
    console.error(`Error bringing up WireGuard interface ${interfaceName} in namespace ${namespace}: ${error.message}`);
  }
}

export function interfaceDown(interfaceName, namespace) {
  try {
    execSync(`ip -n ${namespace} link del ${interfaceName}`, { stdio: 'ignore' });
    console.log(`WireGuard interface ${interfaceName} is now down in namespace ${namespace}.`);
  } catch (error) {
    console.error(`Error bringing down WireGuard interface ${interfaceName} in namespace ${namespace}: ${error.message}`);
  }
}