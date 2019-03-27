import {isWeex, isWeb} from 'universal-env';

let iphonexhelper = {
  isIphoneXSeries: false,
  isIphoneX: false,
  statusBarHeight: 0,
  navBarHeight: 0,
  bottomBarHeight: 0
};
const env = typeof WXEnvironment === 'object' ? WXEnvironment : {};
const weexConfig = typeof window.__weex_config__ !== undefined ? window.__weex_config__ && window.__weex_config__.weex && window.__weex_config__.weex.config : {};


let isIOS = env && env.platform == 'iOS';
if (isIOS) {
  // X || X Max || X R
  if (env.deviceHeight == 2436 || env.deviceHeight == 2688 || env.deviceHeight == 1792 || env.deviceHeight==1624){ // eslint-disable-line
    iphonexhelper.isIphoneXSeries = true;
  }
  if (iphonexhelper.isIphoneXSeries && env.deviceHeight == 2436) {
    iphonexhelper.isIphoneX = true;
  }
} else if (isWeb) {
  let isIphoneXSeries = false;
  isIphoneXSeries = window && window.screen && window.screen.width && window.screen.height && (
    parseInt(window.screen.width, 10) == 375 && parseInt(window.screen.height, 10) == 812 ||
    parseInt(window.screen.width, 10) == 414 && parseInt(window.screen.height, 10) == 896
  );
  if (isIphoneXSeries) {
    iphonexhelper.isIphoneXSeries = true;
    iphonexhelper.bottomBarHeight = 68;
  }
  iphonexhelper.isIphoneX = isIphoneXSeries && parseInt(window.screen.width, 10) == 375 && parseInt(window.screen.height, 10) == 812;
}

if (!isWeex) {
  iphonexhelper.navBarHeight = 0;
  iphonexhelper.statusBarHeight = 0;
} else {
  if (!isIOS) {
    // android
    iphonexhelper.navBarHeight = 96;
    iphonexhelper.statusBarHeight = 0;
    if (weexConfig && weexConfig.env && weexConfig.env.statusbarHeight) {
      iphonexhelper.statusBarHeight = weexConfig.env.statusbarHeight * 750 / env.deviceWidth || 0;
    }
  } else {
    try {
      // ios
      iphonexhelper.navBarHeight = 44 * env.scale * 750 / env.deviceWidth;
      iphonexhelper.statusBarHeight = 20 * env.scale * 750 / env.deviceWidth;
      // iphoneX
      if (iphonexhelper.isIphoneXSeries) {
        iphonexhelper.statusBarHeight = 44 * env.scale * 750 / env.deviceWidth;
        iphonexhelper.bottomBarHeight = 34 * env.scale * 750 / env.deviceWidth;
      }
    } catch (e) {
      console.warn(e);
    }
  }
}

export default iphonexhelper;

