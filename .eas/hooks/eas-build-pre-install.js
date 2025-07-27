// .eas/hooks/eas-build-pre-install.js

module.exports = async function hook({ utils }) {
    utils.logger.info('🔧 Running custom pre-install hook: npm install --force');

    await utils.runCommand('npm', ['install', '--force']);
};
