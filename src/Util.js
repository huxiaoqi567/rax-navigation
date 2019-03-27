'use strict';
import pathToRegexp from 'path-to-regexp';
import Url from './third-party/url-util';
import _ from 'simple-lodash';
import {isWeex} from 'universal-env';
import assign from 'object-assign';
import transition from 'universal-transition';
import animation from 'universal-animation';
import {findDOMNode} from 'rax';
import iphonexHelper from './IPhoneXHelper';
import QueryString from './third-party/query-string';
import {QUERY_STRING} from './Constant';

const statusBarHeight = iphonexHelper.statusBarHeight;
const bottomBarHeight = iphonexHelper.bottomBarHeight;


const DEFAULT_DURATION = 350;
const DEFAULT_EASING = 'ease-out';

let isSupportNewBinding = 1;


let __i = 1;


function uuid() {
  let id = __i++;
  return id;
}


function urlFormat(url, param = {}) {
  try {
    if (param === undefined || param === null || Object.keys(param).length === 0 || !url) {
      return url;
    }
    let query = '';
    if (param[QUERY_STRING] && Object.keys(param[QUERY_STRING]).length > 0) {
      query = '?' + QueryString.stringify(param[QUERY_STRING]);
    }
    return pathToRegexp.compile(url)(param) + query;
  } catch (err) {
    console.warn('urlFormat error', err);
  }
};


function urlMatch(url, options) {
  let keys = [];
  let reg = pathToRegexp(url, keys, options);
  return {reg, keys};
}

function matchRouteByName(routerConfig, name) {
  let route;
  if (name) {
    route = routerConfig[name];
    if (route) {
      route.name = name;
    }
  }
  return route;
}

/**
 * matchRestfulPath
 * @param restfulPath
 * @param realPath
 * @returns {*}
 * @example matchRestfulPath('/demo/:id','/demo/123?a=1&b=2')
 */
function matchRestfulPath(restfulPath, realPath) {
  if (!restfulPath || !realPath) return;
  let {keys, reg} = urlMatch(Url.parse(restfulPath).pathname);
  let {pathname, query} = Url.parse(realPath, true);
  let params = null;
  if (restfulPath && reg.test(pathname)) {
    params = {};
    let execResult = reg.exec(pathname);
    if (execResult) {
      execResult.slice(1).map((v, i) => {
        if (keys[i] && keys[i].name) {
          params[keys[i].name] = v;
        }
      });
    }
    params[QUERY_STRING] = query;
  }
  return params;
}


function matchRouteByPath(routerConfig, path) {
  let params = null;
  let route = null;
  let name = null;
  _.map(routerConfig, (config, routeName) => {
    let res = matchRestfulPath(config.path, path);

    if (res) {
      params = res;
      route = config;
      route.name = routeName;
      if (route && route.path) {
        route.pathname = urlFormat(config.path, params);
      }
      name = routeName;
    }
  });

  if (!name) return;

  return {params, route, name, pathname: route && route.pathname, path: route && route.path};
}


function noop() {
}

// forbid swipe back on IOS
function forbidSwipeBack(isForbid) {
  if (isWeex) {
    let swipeBack = {};
    try {
      swipeBack = require('@weex-module/swipeBack');
    } catch (e) {
      console.warn('require weex module SwipeBack error');
    }
    swipeBack.forbidSwipeBack && swipeBack.forbidSwipeBack(isForbid);
  }
}

let Detection = {};

if (isWeex) {
  const deviceInfo = typeof WXEnvironment !== 'undefined' ? WXEnvironment : {}; // eslint-disable-line
  Detection = assign(Detection, {
    Android: deviceInfo.platform === 'android',
    iOS: deviceInfo.platform === 'iOS',
  });
} else {
  const ua = window.navigator.userAgent;
  Detection = assign(Detection, {
    Android: /Android/ig.test(ua),
    iOS: /iPhone|iPad|iPod/ig.test(ua)
  });
}


function resolveFn(fnOrObj = {}, args = {}) {
  let result = fnOrObj;
  if (isFunction(fnOrObj)) {
    result = fnOrObj(args);
  }
  return result || {};
}

function isFunction(fn) {
  return typeof fn === 'function';
}

function animate(ref, property, options = {}, callback = noop) {
  try {
    if (ref) {
      let el = findDOMNode(ref);
      if (!el) return;
      let {timingFunction = DEFAULT_EASING, duration = DEFAULT_DURATION} = options;
      if (el) {
        transition(el, property, {
          timingFunction,
          duration
        }, callback);
      }
    }
  } catch (err) {
  }
}

function multipleAnimate(options = {}, callback) {
  options.props = _.map(options.props, (o) => {
    o.element = findDOMNode(o.element);
    return o;
  });
  return animation(options, callback);
}


function getLast(array) {
  if (array && array.length > 0) {
    return array[array.length - 1];
  }
  return;
}

function isNavigator(component) {
  return component && component.navigatorType && component.routerConfig;
}

function pick(obj = {}, keys = []) {
  if (!obj) return;
  if (typeof keys == 'string') {
    keys = [keys];
  }
  let result = {};
  keys.forEach((key) => {
    if (undefined !== obj[key]) {
      result[key] = obj[key];
    }
  });
  return result;
}

// TODO  storage = __weex_require__('@weex-module/storage');
function setItem(key, state) {
  if (isWeex) {

  } else {
    if (window.sessionStorage) {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    }
  }
}


function getItem(key) {
  if (isWeex) {

  } else {
    if (window.sessionStorage) {
      let val = window.sessionStorage.getItem(key);
      return JSON.parse(val);
    }
  }
}

function isEventEqual(evt1, evt2) {
  return evt1.eventName == evt2.eventName
    && evt1.routeName == evt2.routeName;
}


function filterStyle(style = {}) {
  if (!style) return {};
  const blackList = ['left', 'top', 'right', 'bottom', 'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'padding', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
  let result = {};
  Object.keys(style).forEach((name) => {
    if (blackList.indexOf(name) === -1) {
      result[name] = style[name];
    }
  });
  return result;
}


function getEl(el) {
  return isWeex ? findDOMNode(el).ref : findDOMNode(el);
}


let Event = {
  on: (eventName, handler) => {
    window.addEventListener(eventName, handler);
  },
  emit: (eventName, data) => {
    var event = new window.Event(eventName);
    if (data) {
      Object.keys(data).forEach((k) => {
        event[k] = data[k];
      });
    }
    window.dispatchEvent(event);
  }
};

export {
  isEventEqual,
  urlFormat,
  matchRestfulPath,
  matchRouteByName,
  matchRouteByPath,
  uuid,
  noop,
  forbidSwipeBack,
  Detection,
  resolveFn,
  animate,
  multipleAnimate,
  getLast,
  isNavigator,
  pick,
  statusBarHeight,
  bottomBarHeight,
  isSupportNewBinding,
  setItem,
  getItem,
  filterStyle,
  isFunction,
  Event,
  getEl,
  urlMatch
};
