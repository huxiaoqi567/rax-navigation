import {uuid, isEventEqual} from './Util';
import _ from 'simple-lodash';
import {
  EVENT_WILL_FOCUS,
  EVENT_WILL_BLUR,
  EVENT_DID_BLUR,
  EVENT_DID_FOCUS
} from './Constant';

const EVENTS_WHITE_LIST = [EVENT_WILL_FOCUS, EVENT_WILL_BLUR, EVENT_DID_BLUR, EVENT_DID_FOCUS];


class Navigation {
  routerConfig = {}

  config = {};

  router = null;

  state = {};

  prevState = {};

  _screenEvents = [];

  id = null;

  constructor(config) {
    this.id = '__navigation__' + uuid();
    this.config = config;
    this.routerConfig = config.routerConfig;
    this.navigatorType = config.navigatorType;
    if (config && config.initialRouteName) {
      this.state.routeName = config.initialRouteName;
      this.state.params = config.initialRouteParams;
      this.state.path = this.routerConfig[this.state.routeName].path;
      this.records = [{
        name: config.initialRouteName,
        params: config.initialRouteParams,
        path: this.state.path
      }];
    }
    this.history = config.history;
  }


  getCurrentRoute(routes) {
    let currentRoute = null;
    routes && routes.forEach((route) => {
      if (route && route.navigation === this && route.name === this.state.routeName) {
        currentRoute = route;
      }
    });

    if (currentRoute) return currentRoute;

    routes && routes.forEach((route) => {
      if (route && route.routes) {
        currentRoute = this.getCurrentRoute(route.routes);
      }
    });

    return currentRoute;
  }

  updateScreen = (params) => {
    if (params.name && this.navigatorComponent) {
      this.prevState = {...this.state};
      this.state.routeName = params.name;
      this.state.params = params.params;
      this.prevRoute = this.currentRoute;
      this.currentRoute = this.getCurrentRoute(this.router.routes.routes);
      this.navigatorComponent.updateScreen({id: this.id, ...params});
    }
  }

  // TODO isEventEqual
  _triggerEvent = (options) => {
    if (!options.routeName) return;
    // console.warn('_triggerEvent:', options, this._screenEvents);
    setTimeout(() => {
      let evt = _.find(this._screenEvents, (e) => {
        return isEventEqual(e, options);
      });
      if (evt && typeof evt.handler === 'function') {
        evt.handler({
          state: this.state,
          lastState: this.prevState,
          type: evt.eventName
        });
      }
    }, 50);
  }

  addListener(eventName, handler) {
    if (EVENTS_WHITE_LIST.indexOf(eventName) >= 0) {
      let existIndex = _.findIndex(this._screenEvents, (evt) => {
        return isEventEqual(evt, {
          eventName,
          params: this.state.params,
          routeName: this.state.routeName
        });
      });
      if (existIndex >= 0) {
        this._screenEvents.splice(existIndex, 1);
      }
      this._screenEvents.push({
        routeName: this.state.routeName,
        eventName,
        handler,
        params: this.state.params
      });
    }
  }

  dispatch = (actions) => {
    this.router.dispatch(actions);
  }

  navigate = (name, params) => {
    this.router.navigate(name, params);
  }

  replace = (name, params) => {
    this.router.replace(name, params);
  }

  navigateByPath = (path) => {
    this.router.navigateByPath(path);
  }

  goBack = () => {
    this.router.goBack();
  }

  go=(n) => {
    this.router.go(n);
  }
}

export default Navigation;
