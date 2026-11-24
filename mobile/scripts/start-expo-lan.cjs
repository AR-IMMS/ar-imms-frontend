const os = require('os');
const { spawn } = require('child_process');

function isPrivateIPv4(address) {
  return (
    address.startsWith('10.') ||
    address.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function interfaceScore(name, address) {
  const lowered = name.toLowerCase();
  const excluded = ['loopback', 'cloudflare', 'warp', 'vethernet', 'vpn', 'virtual', 'wsl', 'hamachi', 'tunnel', 'tap'];

  if (excluded.some((token) => lowered.includes(token))) {
    return -100;
  }

  if (address.startsWith('192.168.')) return 100;
  if (address.startsWith('10.')) return 90;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) return 50;
  return 0;
}

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  let bestCandidate = null;
  let bestScore = -Infinity;

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      if (!entry || entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      const score = interfaceScore(name, entry.address);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = entry.address;
      }
    }
  }

  if (bestScore >= 0) {
    return bestCandidate;
  }

  return null;
}

const lanAddress = process.env.EXPO_HOST_IP || getLanAddress();

if (lanAddress) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanAddress;
  process.env.EXPO_PACKAGER_HOSTNAME = lanAddress;
  console.log(`Using LAN host: ${lanAddress}`);
} else {
  console.warn('Could not detect a LAN IP address. Expo may fall back to localhost.');
}

const command = process.platform === 'win32'
  ? 'cmd.exe'
  : (process.env.SHELL ?? 'sh');
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'pnpm exec expo start --go --lan --clear']
  : ['-lc', 'pnpm exec expo start --go --lan --clear'];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
