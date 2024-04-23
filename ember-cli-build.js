'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function (defaults) {
  let config = defaults.project.config(EmberAddon.env());

  let app = new EmberAddon(defaults, {
    sassOptions: {
      extension: 'sass',
    },
    pretender: {
      enabled: true,
    },
    'ember-bootstrap': {
      bootstrapVersion: 5,
      insertEmberWormholeElementToDom: false,
    },
    favicons: {
      faviconsConfig: {
        appName: 'Ember Custom Actions',
        appDescription:
          'Trigger custom API actions for Ember 2 applications and communicate with non-CRUD API servers',
        developerName: 'Exelord',
        developerURL: 'www.macsour.com',
        background: '#ffffff',
        path: config.rootURL, // Path for overriding default icons path. `string`
        url: 'https://exelord.github.io/ember-custom-actions/images/og-image.jpg', // Absolute URL for OpenGraph image. `string`
      },
    },
  });

  app.import('node_modules/bootstrap/dist/css/bootstrap.css');

  return app.toTree();
};
