/**
 * Created by rathawut on 5/27/16.
 */
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

function register(server, options) {
  const routeExtnames = options.routeExtnames || ['.js'];
  const context = options.context || {};
  const absRoutesDirPath = path.join(process.cwd(), options.routesDir || 'routes');
  const ignorePattern = options.ignorePattern;
  const indexFilename = 'index';
  const pathPrefix = options.pathPrefix;

  function fn(absCurrentDirPath) {
    const items = fs.readdirSync(absCurrentDirPath);
    items.forEach((itemName) => {
      const absItemPath = path.join(absCurrentDirPath, itemName);
      if (fs.lstatSync(absItemPath).isDirectory()) { // Recursive
        fn(absItemPath);
        return;
      }
      const itemExtname = path.extname(absItemPath);
      const itemExtnameIndex = routeExtnames.indexOf(itemExtname);
      if (itemExtnameIndex !== 0) { // Skip non-route-extnames files
        return;
      }
      let routePath = absItemPath.substring(
        absRoutesDirPath.length, absItemPath.length - routeExtnames[itemExtnameIndex].length
      );
      if (ignorePattern && ignorePattern.test(routePath)) {
        return;
      }
      if (routePath.endsWith(`/${indexFilename}`)) {
        routePath = routePath.substring(0, routePath.length - indexFilename.length - 1);
      }
      let routesConfig = require(absItemPath);
      if (!Array.isArray(routesConfig)) {
        routesConfig = [routesConfig];
      }
      for (let i = 0; i < routesConfig.length; i++) {
        if (!routesConfig[i].path) { // Override path
          routesConfig[i].path = routePath;

          if (routesConfig[i].path.split('__').length === 2) {
            const routePathParts = routesConfig[i].path.split('__');
            routesConfig[i].path = routePathParts[0];
            routesConfig[i].method = routePathParts[1];
          }
        }
        if (pathPrefix) { // Add path prefix
          routesConfig[i].path = `${pathPrefix}${routesConfig[i].path}`;
        }
        if (routesConfig[i].pathSuffix) { // Add path suffix
          routesConfig[i].path += routesConfig[i].pathSuffix;
        }
        routesConfig[i].path = routesConfig[i].path.replace(/\\/g, '/');
        delete routesConfig[i].pathSuffix;
      }
      server.route(routesConfig);
    });
  }

  server.bind(context);
  fn(absRoutesDirPath);
}

module.exports = {
  register,
  pkg,
};
