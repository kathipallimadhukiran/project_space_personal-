const { getDefaultConfig } = require('expo/metro-config');

// Force the port to 9000
process.env.RCT_METRO_PORT = '9000';
process.env.PORT = '9000';

const config = getDefaultConfig(__dirname);

// Configure Metro settings
config.server = {
  ...config.server,
  port: 9000,
  useGlobalHotkeys: true,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Force all URLs to use the local IP and correct port
      const localIp = '192.168.125.111';
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      url.hostname = localIp;
      url.port = '9000';
      req.url = url.toString();
      return middleware(req, res, next);
    };
  },
};

// Ensure WebSocket uses the correct port
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Force the resolver to use our settings
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
};

module.exports = config;
