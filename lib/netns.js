const { execSync } = require('child_process');

function createNamespace(namespace) {
  try {
    const existing = execSync(`ip netns list`).toString();
    if (existing.includes(namespace)) {
      console.log(`Namespace ${namespace} already exists.`);
    } else {
      execSync(`ip netns add ${namespace}`);
      console.log(`Namespace ${namespace} created.`);
    }
  } catch (error) {
    console.error(`Error creating namespace ${namespace}: ${error.message}`);
  }
}

function deleteNamespace(namespace) {
  try {
    const existing = execSync(`ip netns list`).toString();
    if (!existing.includes(namespace)) {
      console.log(`Namespace ${namespace} does not exist.`);
    } else {
      execSync(`ip netns delete ${namespace}`);
      console.log(`Namespace ${namespace} deleted.`);
    }
  } catch (error) {
    console.error(`Error deleting namespace ${namespace}: ${error.message}`);
  }
}

function setInterfaceNamespace(interfaceName, namespace) {
  try {
    // Check if it's already in the namespace
    try {
      execSync(`ip netns exec ${namespace} ip link show ${interfaceName}`, { stdio: 'ignore' });
      console.log(`Interface ${interfaceName} is already in namespace ${namespace}`);
      return;
    } catch {
      // Not in the namespace, proceed to move
    }

    // Move interface into namespace
    execSync(`ip link set ${interfaceName} netns ${namespace}`);
    console.log(`Interface ${interfaceName} moved to namespace ${namespace}`);
  } catch (error) {
    console.error(`Error setting interface namespace: ${error.message}`);
  }
}

// Moves interface from a namespace back to root (default namespace)
function unsetInterfaceNamespace(interfaceName, namespace) {
  try {
    // Check if it exists in the namespace
    execSync(`ip netns exec ${namespace} ip link show ${interfaceName}`, { stdio: 'ignore' });

    // Move it back to the root namespace
    execSync(`ip netns exec ${namespace} ip link set ${interfaceName} netns 1`);
    console.log(`Interface ${interfaceName} moved back to default namespace`);
  } catch (error) {
    console.error(`Error unsetting interface namespace: ${error.message}`);
  }
}


module.exports = {
  setInterfaceNamespace,
  createNamespace,
  deleteNamespace,
  unsetInterfaceNamespace
};