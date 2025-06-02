const { exec } = require('child_process');

async function generateWireGuardKeyPair(publicKeyPath, privateKeyPath) {
  exec(`wg genkey | tee ${privateKeyPath} | wg pubkey > ${publicKeyPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating WireGuard key pair: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return;
    }
    console.log(`WireGuard key pair generated successfully:\nPublic Key: ${stdout.trim()}`);
  })
}

module.exports = {
  generateWireGuardKeyPair
};