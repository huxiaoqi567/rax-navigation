import {createElement, Component} from 'rax';
import {isWeex} from 'universal-env';
import {EVENT_WILL_FOCUS, EVENT_WILL_BLUR, EVENT_DID_BLUR, EVENT_DID_FOCUS} from './Constant';
import {matchRouteByPath, urlFormat, uuid} from './Util';
import {createRouter, queryRoutes} from './Router';
import {getInitialPath, handleBack, createHistory} from './History';
import _ from 'simple-lodash';
import Navigation from './Navigation';

function queryRoutesDeeply(route) {
  let routes = [
    route
  ];
  if (route.routes && route.routes[0]) {
    routes = routes.concat(queryRoutesDeeply(route.routes[0]));
  }
  return routes;
}

function updateScreenDeeply(route, params) {
  if (!route) return;

  let routes = queryRoutesDeeply(route);

  let router = route.navigation.router;

  let navigationActions = router.createNavigationActions({
    name: route.name,
    params: route.params || params,
    type: 'PUSH'
  }, routes);

  router.dispatch(navigationActions, {
    replace: true
  });
}


class BaseNavigator extends Component {
  constructor(props) {
    super(props);
    this.history = props.history;
    this.documentHidden = false;
    if (props.navigation) {
      props.navigation.navigatorComponent = this;
      this.history.router = props.navigation.router;
    }
  }

  getChildContext() {
    return {
      navigation: this.props.navigation
    };
  }

  handleViewAppear = () => {
    let {navigation} = this.props;
    let {currentRoute} = navigation;

    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options: {type: 'viewAppear'},
      eventName: EVENT_WILL_FOCUS
    });


    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options: {type: 'viewAppear'},
      eventName: EVENT_DID_FOCUS
    });
  }

  handleViewDisappear = () => {
    let {navigation} = this.props;
    let {currentRoute} = navigation;

    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options: {type: 'viewDisappear'},
      eventName: EVENT_WILL_BLUR
    });

    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options: {type: 'viewDisappear'},
      eventName: EVENT_DID_BLUR
    });
  }

  componentDidMount() {
    let {location} = this.history;
    let {navigation} = this.props;
    if (navigation && navigation.level === 0) {
      if (isWeex) {
        document.body.addEvent('clickbackitem', handleBack);
        document.body.addEvent('viewappear', this.handleViewAppear);
        document.body.addEvent('viewdisappear', this.handleViewDisappear);
      } else {
        document.addEventListener('visibilitychange', (e) => {
          if (document.hidden !== this.documentHidden) {
            document.hidden ? this.handleViewDisappear() : this.handleViewAppear();
            this.documentHidden = document.hidden;
          }
        });
      }
    }

    let routes = queryRoutes(navigation.router.routes, {path: location.pathname + location.search});
    // update sub routes
    if (routes.length > 0) {
      routes.forEach((route) => {
        if (route.navigation === navigation) {
          route.navigation.updateScreen({
            fullPath: urlFormat(route.path, route.params),
            name: route.name,
            params: route.params,
            action: 'PUSH',
            type: 'update',
          });
        }
      });
    } else if (navigation.level === 0) {
      let route = _.find(navigation.router.routes.routes, (route) => {
        return route && route.name === navigation.router.routes.initialRouteName;
      }) || navigation.router.routes.routes[0];
      updateScreenDeeply(route, navigation.router.routes.initialRouteParams);
    }
  }

  getScreenComponent(route) {
    if (!route) return Promise.resolve();
    return new Promise((resolve) => {
      if (route.screen) {
        resolve(route.screen);
      } else if (route.getScreen) {
        resolve(route.getScreen());
      }
    }).then((screen) => {
      screen.guid = '__screen__' + uuid();
      return screen;
    });
  }


  triggerEventDeeply({navigation, route, options, eventName, usePrevState}) {
    if (!route || !navigation || !eventName) return;

    let state = usePrevState ? navigation.prevState : navigation.state;

    if (!state) return;

    if (route.routes) {
      let _navigation = route.routes[0].navigation;
      let _route = _.find(route.routes, (r) => {
        return r.name === _navigation.state.routeName;
      });
      return this.triggerEventDeeply({navigation: _navigation, route: _route, options, eventName});
    }

    navigation._triggerEvent({
      eventName,
      routeName: state.routeName,
      params: state.params,
      ...options || {}
    });
  }

  handleDidEvent(options) {
    let {navigation} = this.props;
    let {currentRoute, prevRoute} = navigation;

    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options,
      eventName: EVENT_DID_FOCUS,
    });

    if (prevRoute) {
      this.triggerEventDeeply({
        navigation,
        route: prevRoute,
        options,
        eventName: EVENT_DID_BLUR,
        usePrevState: true
      });
    }
  }


  handleWillEvent(options) {
    let {navigation} = this.props;
    let {currentRoute, prevRoute} = navigation;

    this.triggerEventDeeply({
      navigation,
      route: currentRoute,
      options,
      eventName: EVENT_WILL_FOCUS
    });
    if (prevRoute) {
      this.triggerEventDeeply({
        navigation,
        route: prevRoute,
        options,
        eventName: EVENT_WILL_BLUR,
        usePrevState: true
      });
    }
  }
}


function createNavigator({navigatorType, routerConfig, options = {}, NavigatorComponent}) {
  let initialPath = getInitialPath(options);

  let initialRoute = matchRouteByPath(routerConfig, initialPath);

  let history = options.history || createHistory({
    initialEntries: [initialPath],
    mode: options.mode || 'hash'
  });


  let initialRouteName;
  let initialRouteParams;
  let initialRoutePath;

  if (initialRoute && initialRoute.name) {
    initialRouteName = initialRoute.name;
    initialRouteParams = initialRoute.params;
    initialRoutePath = initialRoute.path;
  } else {
    // if not matched
    initialRouteName = options.initialRouteName || Object.keys(routerConfig)[0];
    initialRouteParams = options.initialRouteParams || {};
    initialRoutePath = urlFormat(routerConfig[initialRouteName].path, initialRouteParams);
  }

  let navigation = new Navigation({
    routerConfig,
    navigatorType,
    history,
    options,
    initialRouteName,
    initialRouteParams,
    initialRoutePath
  });


  let router = createRouter({
    routerConfig,
    navigatorType,
    history,
    navigation,
    initialRouteName,
    initialRouteParams,
    initialRoutePath
  });

  navigation.router = router;


  class NavigatorContainer extends Component {
    static routerConfig = routerConfig;

    static navigatorType = navigatorType;

    static initialRouteName = initialRouteName;

    static initialRouteParams = initialRouteParams;

    static navigation = navigation;

    render() {
      let props = {
        routerConfig,
        ...options,
        navigation,
        history
      };

      return <NavigatorComponent {...this.props} {...props} />;
    }
  }

  return NavigatorContainer;
}

export default BaseNavigator;

export {createNavigator};
