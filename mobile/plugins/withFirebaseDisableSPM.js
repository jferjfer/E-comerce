const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFirebaseDisableSPM(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosDir = config.modRequest.platformProjectRoot;

      // Modificar Podfile.properties.json para activar use_frameworks static
      const propsPath = path.join(iosDir, 'Podfile.properties.json');
      let props = {};
      if (fs.existsSync(propsPath)) {
        props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
      }
      props['ios.useFrameworks'] = 'static';
      fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

      // También modificar el Podfile para GoogleUtilities
      const podfilePath = path.join(iosDir, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');
        if (!podfile.includes("pod 'GoogleUtilities'")) {
          podfile = podfile.replace(
            /^end\s*$/m,
            "  pod 'GoogleUtilities', :modular_headers => true\nend"
          );
          fs.writeFileSync(podfilePath, podfile);
        }
      }

      return config;
    },
  ]);
};
