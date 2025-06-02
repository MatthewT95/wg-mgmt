const { vaildIPAddress } = require('./vaildate.js');

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
  return configPartial;
}

module.exports = {
  generateWGConfigPartialInterface
};