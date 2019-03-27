'use strict';
import Detection from './Detection';


const EVENT_CELL_PAN_START = 'navigation:pan:start';

const EVENT_WILL_FOCUS = 'willFocus';
const EVENT_WILL_BLUR = 'willBlur';
const EVENT_DID_FOCUS = 'didFocus';
const EVENT_DID_BLUR = 'didBlur';


const TYPE_NAVIGATOR_TAB = 'tab';
const TYPE_NAVIGATOR_STACK = 'stack';


const HEIGHT_TAB_BAR_DEFAULT = 100;
const HEIGHT_STACK_HEADER_DEFAULT = Detection.iOS ? 88 : 100;

const ROUTE_STORE = 'ROUTE_STORE';
const ROUTE_TREE = 'ROUTE_TREE';
const PATH_NAME = 'PATH_NAME';
const ROUTE_NAME = 'ROUTE_NAME';


const QUERY_STRING = 'queryString';
const HASH_TOKEN_KEY = '_hash_token_';

export {
  EVENT_CELL_PAN_START,
  TYPE_NAVIGATOR_TAB,
  TYPE_NAVIGATOR_STACK,
  HEIGHT_TAB_BAR_DEFAULT,
  HEIGHT_STACK_HEADER_DEFAULT,
  EVENT_WILL_FOCUS,
  EVENT_WILL_BLUR,
  EVENT_DID_FOCUS,
  EVENT_DID_BLUR,
  ROUTE_STORE,
  ROUTE_TREE,
  PATH_NAME,
  ROUTE_NAME,
  QUERY_STRING,
  HASH_TOKEN_KEY
};
