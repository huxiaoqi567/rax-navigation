'use strict';
import {isWeex} from 'universal-env';
import assign from 'object-assign';

let Detection = {};

if (isWeex) {
  const deviceInfo = typeof WXEnvironment !== 'undefined' ? WXEnvironment : {}; // eslint-disable-line
  Detection = assign(Detection, {
    Android: deviceInfo.platform === 'android',
    iOS: deviceInfo.platform === 'iOS',
    appVersion: deviceInfo.appVersion,
    weexVersion: deviceInfo.weexVersion,
    osVersion: deviceInfo.osVersion
  });
} else {
  const ua = window.navigator.userAgent;
  Detection = assign(Detection, {
    Android: /Android/ig.test(ua),
    iOS: /iPhone|iPad|iPod/ig.test(ua),
  });
}


export default Detection;
