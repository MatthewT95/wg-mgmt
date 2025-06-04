const { promisify } = require('util');
const { exec: _exec } = require('child_process');
const exec = promisify(_exec);

async function generateWireGuardKeyPair() {
  // 1) Generate private key
  const { stdout: rawPriv, stderr: err1 } = await exec('wg genkey');
  if (err1) {
    throw new Error(`Error generating private key: ${err1}`);
  }
  const privateKey = rawPriv.toString().trim();
  if (!privateKey) {
    throw new Error('Failed to generate private key (empty output)');
  }

  // 2) Derive public key from private
  //    Note: echo must be quoted to avoid shell‐injection if your key ever has odd chars.
  const { stdout: rawPub, stderr: err2 } = await exec(`echo "${privateKey}" | wg pubkey`);
  if (err2) {
    throw new Error(`Error generating public key: ${err2}`);
  }
  const publicKey = rawPub.toString().trim();
  if (!publicKey) {
    throw new Error('Failed to generate public key (empty output)');
  }

  return { publicKey, privateKey };
}

module.exports = {
  generateWireGuardKeyPair
};