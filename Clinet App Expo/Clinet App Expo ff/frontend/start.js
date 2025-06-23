const { execSync } = require('child_process');
const os = require('os');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Get command line arguments
const args = process.argv.slice(2);
const platform = args[0] ? args[0].replace('--', '') : null;

// Set environment variables
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.EXPO_PACKAGER_PROXY_URL = `http://${getLocalIP()}:8081`;

// Build the start command
let startCommand = 'npx expo start';

if (platform) {
  startCommand += ` --${platform}`;
}

// Add development client flag
startCommand += ' --dev-client';

// Add clear cache flag
startCommand += ' --clear';

console.log('Starting Expo with command:', startCommand);
console.log('Local IP:', getLocalIP());

try {
  execSync(startCommand, { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting Expo:', error);
  process.exit(1);
}
