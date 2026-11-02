const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFirebaseDisableSPM(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;

      // Firebase v27 + SPM requiere dynamic linkage obligatoriamente
      const propsPath = path.join(platformRoot, 'Podfile.properties.json');
      let props = {};
      if (fs.existsSync(propsPath)) {
        try { props = JSON.parse(fs.readFileSync(propsPath, 'utf8')); } catch {}
      }
      props['ios.useFrameworks'] = 'dynamic';
      fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

      return config;
    },
  ]);
};
