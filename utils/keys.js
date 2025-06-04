const { exec } = require('child_process');
const { promises: fs} = require('fs');

async function generateWireGuardKeyPair() {
  const privateKeyPath = 'tmp/privatekey';
  const publicKeyPath = 'tmp/publickey';

  // Ensure the tmp directory exists
  try {
    await fs.mkdir('tmp', { recursive: true });
  }
  catch (error) {

  }
  // Generate the WireGuard key pair using wg command
  exec(`wg genkey | tee ${privateKeyPath} | wg pubkey > ${publicKeyPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating WireGuard key pair: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return;
    }
  })

  // read the generated keys
  const privateKey = await fs.readFile(privateKeyPath, 'utf8')
  const publicKey = await fs.readFile(publicKeyPath, 'utf8');

  // delete the keys from tmp directory
  fs.unlink(privateKeyPath);
  fs.unlink(publicKeyPath);

  // return the keys
  return { privateKey: privateKey.trim(), publicKey: publicKey.trim() };
}

module.exports = {
  generateWireGuardKeyPair
};