'use strict';

import _ from 'simple-lodash';
import NavigationActions from './NavigationActions';
import {
  matchRestfulPath,
  urlFormat,
  getLast,
  urlMatch
} from './Util';
import md5 from 'md5';
import {QUERY_STRING, HASH_TOKEN_KEY} from './Constant';

let globalRouter = null;


/**
 * transform
 * @param routerConfig
 * @returns {Array}
 * @example
 *
 * {
     type:'stack',
     routes:[{
        type:'tab',
        routes:[
           {  name:'cate' },
           {  name:'cate2' },
       ]
     },{
       name:'profile'
     }]
 }
 */
function createRouterConfig(routerConfig = {}, navigation, level, parentRoute) {
  let routes = [];
  _.map(routerConfig, (config, name) => {
    let {screen, path, getScreen} = config;
    let route = {
      name,
      screen,
      getScreen,
      level,
      navigation
    };

    if (screen && screen.routerConfig && screen.navigatorType) {
      route.type = screen.navigatorType;
      route.navigation = navigation;
      route.initialRouteName = route.navigation.config.initialRouteName;
      route.initialRouteParams = route.navigation.config.initialRouteParams;
      route.initialRoutePath = route.navigation.config.initialRoutePath;
      route.routes = createRouterConfig(screen.routerConfig, screen.navigation, level + 1, route);
      route.params = route.initialRouteParams;
    }

    if (path) {
      route.path = path;
    }
    if (parentRoute) {
      route.parentRoute = parentRoute;
    }
    route.navigation.level = level;
    routes.push(route);
  });
  return routes;
}


function queryRoute(routeObj, query = {}) {
  let {name, path} = query;

  if (routeObj && routeObj.routes) {
    for (let i = 0; i < routeObj.routes.length; i++) {
      let route = routeObj.routes[i];
      if (name && route.name === name) {
        return {
          ...route,
          params: query.params,
          type: routeObj.type
        };
      } else if (path) {
        let params = matchRestfulPath(route.path, path);
        if (params) {
          return {
            ...route,
            params,
            type: routeObj.type
          };
        }
      }
    }
  }
}


function queryRoutes(routeObj, query) {
  let routes = fillRoutesWithInitialRoute(_queryRoutes(routeObj, query));

  let params = {};

  routes.forEach((route) => {
    route.params = route.params || {};
    params = {...params, ...route.params};
  });

  routes.forEach((route) => {
    if (route.path) {
      let {keys} = urlMatch(route.path);
      if (keys && keys.length > 0) {
        keys.forEach(key => {
          if (undefined === route.params[key.name] && params[key.name] !== undefined) {
            route.params[key.name] = params[key.name];
          }
        });
      }
    }
  });

  return routes;
}

function _queryRoutes(routeObj, query = {}) {
  let results = [];
  if (routeObj && routeObj.routes) {
    for (let i = 0; i < routeObj.routes.length; i++) {
      let route = routeObj.routes[i];
      // has sub-routes
      if (route && route.routes) {
        let res = _queryRoutes(route, query);
        if (res && res.length) {
          if (res[0].parentRoute) {
            results.push(res[0].parentRoute);
            results = results.concat(res);
          }
        } else {
          let route = queryRoute(routeObj, query);
          if (route && route.name) {
            results.push({
              ...route,
              type: routeObj.type,
              params: route.params
            });
          }
        }
      } else {
        let route = queryRoute(routeObj, query);
        if (route && route.name) {
          return [{
            ...route,
            type: routeObj.type,
            params: route.params || query.params
          }];
        }
      }
    }
  }
  return results;
}

function getInitialRoute(routes) {
  return _.find(routes, (r) => {
    return r.name == routes[0].navigation.config.initialRouteName;
  }) || routes[0];
}

function fillRoutesWithInitialRoute(routes) {
  if (!routes) return routes;
  let childRoute = getLast(routes);
  if (!childRoute) return routes;
  if (childRoute && childRoute.routes && childRoute.routes[0]) {
    let route = getInitialRoute(childRoute.routes);
    routes.push(route);
    return fillRoutesWithInitialRoute(routes);
  }
  return routes;
}

class Router {
  routes = {};
  // global history
  history = null;

  constructor(config = {}) {
  }

  _onHistoryChange = (location, action, direction) => {
    // console.warn('_onHistoryChange:', location, action, direction);
    if (action === 'POP' && direction) {
      let routes = queryRoutes(this.routes, {path: location.pathname + location.search});
      let navigationActions = this.createNavigationActions({
        type: direction === 'FORWARD' ? 'PUSH' : 'POP',

      }, routes);
      this.dispatch(navigationActions, {direction, ignoreHistory: true});
    }
  }

  addNavigation(options) {
    let {routerConfig, navigatorType, navigation, initialRouteName, initialRouteParams, initialRoutePath, history} = options;
    if (!this.history) {
      this.history = history;
      this.history.listen(this._onHistoryChange);
    }
    this.routes = {
      initialRouteName,
      initialRouteParams,
      initialRoutePath,
      type: navigatorType,
      navigation,
      routes: createRouterConfig(routerConfig, navigation, 0)
    };
  }

  createNavigationAction(options = {}) {
    let {name, params, type, action} = options;

    let fn;

    switch (type) {
      case 'PUSH':
        fn = NavigationActions.navigate;
        break;
      case 'POP':
        fn = NavigationActions.back;
        break;
    }

    return fn({
      routeName: name,
      params,
      ...action ? {action} : {}
    });
  }

  createNavigationActions(options = {}, routes) {
    if (!routes || !routes[0]) return;
    let parentAction;
    let childAction;

    if (routes.length === 1) {
      parentAction = this.createNavigationAction({
        ...options,
        name: routes[0].name,
        params: routes[0].params || options.params || {}
      });
    }


    for (let i = routes.length - 1; i >= 0; i--) {
      let route = routes[i];
      let parentRoute = routes[i - 1];
      if (route && parentRoute) {
        if (!childAction) {
          childAction = this.createNavigationAction({
            ...options,
            name: route.name,
            // params should be inherited from parent
            params: {...parentRoute.params, ...parentRoute.navigation.state.params}
          });
        }
        parentAction = this.createNavigationAction({
          ...options,
          name: parentRoute.name,
          params: {...parentRoute.params, ...parentRoute.navigation.state.params}
        });
        parentAction.action = childAction;
        childAction = parentAction;
      }
    }

    return parentAction;
  }


  replace = (name, params) => {
    let routes = queryRoutes(this.routes, {name, params});


    let navigationActions = this.createNavigationActions({
      name,
      params,
      type: 'PUSH'
    }, routes);

    this.dispatch(navigationActions, {
      replace: true
    });
  }


  navigate = (name, params) => {
    let routes = queryRoutes(this.routes, {name, params});

    let navigationActions = this.createNavigationActions({
      name,
      params,
      type: 'PUSH'
    }, routes);

    this.dispatch(navigationActions);
  }

  dispatch(actions, options = {}) {
    if (!actions) return;
    let navigateAction;
    let history = this.history;
    let location = history.location;

    switch (actions.type) {
      case NavigationActions.NAVIGATE:
        navigateAction = 'PUSH';
        break;
      case NavigationActions.BACK:
        navigateAction = 'POP';
        break;
    }

    if (actions && actions.type && actions.routeName) {
      if (navigateAction === 'PUSH') {
        actions.params = actions.params || {};

        if (!actions.params[QUERY_STRING]) {
          actions.params[QUERY_STRING] = {};
        }

        // TODO only add hash token for HashHistory
        // if(history.options.mode === 'hash'){
        actions.params[QUERY_STRING][HASH_TOKEN_KEY] = actions.params[QUERY_STRING][HASH_TOKEN_KEY] || md5(Date.now());
        // }
      }

      let route = queryRoute(options && options.subRoute || this.routes, {
        name: actions.routeName,
        params: actions.params
      });
      if (route && route.navigation) {
        let fullPath = urlFormat(route.path, actions.params);

        route.navigation.updateScreen({
          name: actions.routeName,
          params: actions.params,
          action: navigateAction,
          type: 'update',
          fullPath,
          options
        });

        if (route.routes) {
          let navAction = actions.action || this.createNavigationAction({
            type: navigateAction,
            name: route.initialRouteName,
            params: route.initialRouteParams,
          });

          this.dispatch(navAction, {
            ...options,
            subRoute: route
          });
        } else {
          //  history push
          if (route && route.path && navigateAction === 'PUSH' && options && !options.ignoreHistory) {
            let pathname = urlFormat(route.path, route.params);
            if (location.pathname + location.search !== pathname) {
              if (options.replace) {
                history.replace(pathname, {
                  params: route.params,
                  name: route.name,
                  path: route.path
                });
              } else {
                history.push(pathname, {
                  params: route.params,
                  name: route.name,
                  path: route.path
                });
              }
            }
          }
        }
      }
    }
  }

  navigateByPath(path) {
    let routes = queryRoutes(this.routes, {path});
    if (routes && routes[0]) {
      let navigationActions = this.createNavigationActions({
        name: routes[0].name,
        params: routes[0].params,
        type: 'PUSH'
      }, routes);
      this.dispatch(navigationActions);
    } else {
      console.error('can\'t find route by path:', path);
    }
  }

  goBack() {
    this.history.goBack();
  }

  go(options) {
    this.history.go(options);
  }
}


function createRouter(config) {
  if (!globalRouter) {
    globalRouter = new Router(config);
  }
  globalRouter.addNavigation(config);
  return globalRouter;
}

export {
  createRouter,
  queryRoutes
};
