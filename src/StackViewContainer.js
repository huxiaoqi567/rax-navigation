'use strict';

import {createElement} from 'rax';
import View from 'rax-view';
import Binding from 'weex-bindingx';
import assign from 'deep-assign';
import {EVENT_CELL_PAN_START, HEIGHT_STACK_HEADER_DEFAULT} from './Constant';
import {
  Event as Emitter,
  getEl,
  noop,
  forbidSwipeBack,
  Detection,
  isNavigator,
  statusBarHeight,
  // bottomBarHeight,
  multipleAnimate,
  isSupportNewBinding,
  getLast,
  matchRouteByPath,
  isFunction
} from './Util';

import BaseViewContainer from './BaseViewContainer';
import StackHeader from './views/StackHeader';
import StackHeaderContainer from './StackHeaderContainer';
import EdgePanView from './views/EdgePanView';
import _ from 'simple-lodash';
import {HORIZONTAL_PUSH as defaultTransitionConfig} from './TransitionConfig';


const FULL_WIDTH = 750;
const SCREEN_REF_PREFIX = 'screen_';
const SCREEN_REF_REGEXP = new RegExp(SCREEN_REF_PREFIX);


function negative(val) {
  return val < 0 ? `${Math.abs(val)}*(0-1)` : `${val}`;
}


/*
{out2: 1, out1: 1.3, in2: 0, in1: -150, ratio: -0.0020000000000000005}
in1 * x + y = out1
in2 * x + y = out2 => y = out2 - in2 * x
in1 * x + out2 - in2 * x = out1
x  = (out1 - out2) / (in1 - in2)
y = out2 - in2 * (out1 - out2) / (in1 - in2)
 */

function transformExpression(in1, in2, out1, out2) {
  let inMax = Math.max(in1, in2);
  let inMin = Math.min(in1, in2);
  let outMax = Math.max(out1, out2);
  let outMin = Math.min(out1, out2);
  let inverse = in1 > in2;
  let x = (out1 - out2) / (in1 - in2);
  let y = out2 - in2 * (out1 - out2) / (in1 - in2);
  let ix = `(x/${FULL_WIDTH})`;
  return `min(${outMax},max(${outMin},(${ix}>=${negative(inMin)}&&${ix}<=${negative(inMax)})?(${ix}*${negative(x)}+${negative(y)}):(${ix}<${negative(inMin)}?(${negative(inverse ? out2 : out1)}):(${negative(inverse ? out1 : out2)}))))`;
}


function transformRangeSpec(el, config) {
  let progress = config.progress;
  // pan distance witch is less than half size of screen
  progress = config.type === 'push' && progress > 0 ? 1 - progress : progress;
  let outputRange = config.outputRange;
  let start = config.type === 'push' ? outputRange[0] : outputRange[1];
  let end = config.type === 'push' ? outputRange[1] : outputRange[0];
  let _start = (end - start) * progress + start;
  return {
    element: el,
    property: config.property,
    start: _start,
    end
  };
}


class StackViewContainer extends BaseViewContainer {
  static defaultProps = {
    mode: 'card', // modal
    headerMode: 'screen', // screen or none
    onTransitionStart: noop,
    onTransitionEnd: noop,
    transitionConfig: noop,
    navigationOptions: null
  }

  state = {
    views: [],
    isSingle: false,
    type: 'push',
    navigationOptionsArray: []
  }

  screens = [];

  progress = 0;

  _transitionConfigs = {};

  constructor(props) {
    super(props);
    if (!isSupportNewBinding) {
      this.props.transitionConfig = defaultTransitionConfig;
    }
  }

  componentWillMount() {
    if (Detection.Android) {
      Emitter.on(EVENT_CELL_PAN_START, this.bindCellPan);
    }
  }

  bindCellPan = (e = {}) => {
    this.bindPan(e.element);
  }

  componentDidMount() {
    forbidSwipeBack(true);
  }

  resolveTransitionConfig = (options) => {
    let {transitionConfig, navigation, history} = this.props;
    let routeName = navigation.state.routeName;
    let prevRouteName = navigation.prevState && navigation.prevState.routeName || 'PREV_INIT';
    let cachedKeyname = prevRouteName + '_' + routeName;
    let {records, index} = history;
    let nav = {};
    if (options && options.isEdgePan && records[index] && records[index - 1]) {
      let curRoute = matchRouteByPath(navigation.routerConfig, records[index]);
      let prevRoute = matchRouteByPath(navigation.routerConfig, records[index - 1]) || {
        name: 'PREV_INIT'
      };
      // it's a little trick
      cachedKeyname = curRoute.name + '_' + prevRoute.name;
      nav.state = {
        ...prevRoute,
        routeName: prevRouteName
      };
      nav.prevState = {
        ...curRoute,
        routeName: curRoute.name
      };
    } else {
      nav.prevState = navigation.prevState;
      nav.state = navigation.state;
    }

    if (typeof transitionConfig === 'function') {
      if (this._transitionConfigs[cachedKeyname]) {
        return this._transitionConfigs[cachedKeyname];
      }
      return this._transitionConfigs[cachedKeyname] = assign({}, JSON.parse(JSON.stringify(defaultTransitionConfig)), transitionConfig({navigation: nav, ...nav})); // eslint-disable-line
    }
    return assign({}, defaultTransitionConfig, transitionConfig);
  }


  getStackHeaderBindingProps = () => {
    return this.refs.stackHeader && this.refs.stackHeader.getBindingProps() || [];
  }

  getScreenBindingProps = () => {
    let extraBindingProps = [];
    let transitionConfig = this.resolveTransitionConfig({isEdgePan: true});
    let {transitionSpec, prevTransitionSpec, maskTransitionSpec, mask} = transitionConfig;
    let screens = this.screens;
    if (screens.length <= 1) return extraBindingProps;
    // current screen
    if (transitionSpec && transitionSpec.props) {
      _.map(transitionSpec.props, (config) => {
        let expression = transformExpression(config.inputRange[1], config.inputRange[0], config.outputRange[0], config.outputRange[1]);
        extraBindingProps.push({
          element: this.refs.currentView,
          property: config.property,
          expression
        });
      });
    }
    // previous screen
    if (prevTransitionSpec) {
      _.map(prevTransitionSpec.props, (config) => {
        let expression = transformExpression(config.inputRange[0], config.inputRange[1], config.outputRange[0], config.outputRange[1]);
        extraBindingProps.push({
          element: this.refs.prevView,
          property: config.property,
          expression
        });
      });
    }

    // mask
    if (mask && maskTransitionSpec) {
      _.map(maskTransitionSpec.props, (config) => {
        let expression = transformExpression(config.inputRange[0], config.inputRange[1], config.outputRange[0], config.outputRange[1]);
        extraBindingProps.push({
          element: this.refs.mask,
          property: config.property,
          expression
        });
      });
    }

    return extraBindingProps;
  }


  getScreenElementsBindingProps = () => {
    let screens = this.screens;
    let index = screens.length - 1;
    let curScreen = screens[index];
    let prevScreen = screens[index - 1];
    let extraBindingProps = [];
    if (curScreen && curScreen.getScreenTransitionConfig) {
      let transitionConfig = curScreen.getScreenTransitionConfig();
      if (transitionConfig && transitionConfig.transitionElements) {
        _.map(transitionConfig.transitionElements, (config) => {
          if (config && config.gesturesEnabled) {
            let expression = transformExpression(config.inputRange[1], config.inputRange[0], config.outputRange[0], config.outputRange[1]);
            extraBindingProps.push({
              element: config.element,
              property: config.property,
              expression
            });
          }
        });
      }
    }

    if (prevScreen && prevScreen.getScreenTransitionConfig) {
      let transitionConfig = prevScreen.getScreenTransitionConfig();
      if (transitionConfig && transitionConfig.transitionElements) {
        _.map(transitionConfig.transitionElements, (config) => {
          let {inputRange, outputRange, gesturesEnabled, element, property} = config;
          if (gesturesEnabled && outputRange.length === 3 && inputRange.length === 3) {
            let expression = transformExpression(inputRange[1], config.inputRange[2], config.outputRange[1], config.outputRange[2]);
            extraBindingProps.push({
              element,
              property,
              expression
            });
          }
        });
      }
    }

    return extraBindingProps;
  }


  bindPan(anchor) {
    anchor = getEl(anchor);

    if (!isSupportNewBinding || !anchor) return;

    let views = this.state.views;

    if (views.length > 1) {
      this.startTime = Date.now();

      let screensProps = this.getScreenBindingProps();

      let elementsProps = this.getScreenElementsBindingProps();

      let headerProps = this.getStackHeaderBindingProps();

      let bindingProps = [
        ...screensProps,
        ...headerProps,
        ...elementsProps
      ].map(o => {
        o.element = getEl(o.element);
        return o;
      });

      let result = Binding.bind({
        anchor,
        eventType: 'pan',
        // debug:true,
        options: {
          touchAction: 'pan-x'
        },
        props: bindingProps
      }, (e) => {
        if (e && e.state === 'end') {
          let duration = Date.now() - this.startTime;
          let dist = e.deltaX;
          if (this._bindingToken) {
            Binding.unbind({
              token: this._bindingToken,
              eventType: 'pan',
              anchor
            });
          }

          this.progress = dist / FULL_WIDTH;

          if (dist > 0) {
            if (dist > FULL_WIDTH / 2 || Math.abs(dist) / duration > 0.5 && duration < 200) {
              this.props.navigation.goBack();
            } else {
              this.slideIn();
            }
          }
        }
      });

      this._bindingToken = result && result.token;
    }
  }


  onEdgeHorizontalPan = (e) => {
    if (e.state === 'start') {
      this.bindPan(this.refs.currentPanView);
    }
  }


  resolveNavigationOptionsArray() {
    let navigationOptionsArray = [];
    if (this.state.views) {
      this.state.views.map((view) => {
        let navigationOptions = this.resolveNavigationOptions(view);
        navigationOptionsArray.push(navigationOptions);
      });
    }
    return navigationOptionsArray;
  }


  render() {
    let {headerMode = 'screen', cardStyle = {}, history} = this.props;
    let transitionConfig = this.resolveTransitionConfig();
    let {transitionSpec, prevTransitionSpec, maskTransitionSpec, mask} = transitionConfig;
    let {isSingle, type} = this.state;
    let l = this.state.views.length;

    let {navigationOptionsArray} = this.state;

    return (<View ref="stackContainer" style={[styles.container, {...this.props.style}]}>
      {this.state.views.map((view, i) => {
        let isCurrent = i === l - 1;
        let isPrevView = i === l - 2;
        // only render two screens
        if (!isCurrent && !isPrevView) return null;

        let prevView = this.state.views[i - 1];
        let prevRouteName;
        if (prevView && prevView.name) {
          prevRouteName = prevView.name;
        }
        let navigationOptions = navigationOptionsArray[i];
        let {headerStyle = {}, header, headerTransparent, gesturesEnabled} = navigationOptions;
        let isNav = isNavigator(view.screen);
        let top = isNav ? 0 : (headerStyle.height || HEIGHT_STACK_HEADER_DEFAULT) + statusBarHeight;
        if (header !== undefined) {
          if (header && header.props && header.props.style && header.props.style.height !== undefined) {
            top = header.props.style.height + (header.props.style.top || statusBarHeight);
          } else {
            top = 0; // header === null
          }
        } else if (headerMode === 'none') {
          top = 0;
        }
        let viewStyle = styles.screenContainer;
        if (isSingle) {
          viewStyle = styles.screenContainer;
        } else {
          if (type === 'push') {
            viewStyle = isCurrent ? [styles.screenContainer, transitionSpec && transitionSpec.initialStyle] : styles.screenContainer;
          } else if (type === 'pop') {
            viewStyle = isCurrent ? styles.screenContainer : [styles.screenContainer, prevTransitionSpec && prevTransitionSpec.initialStyle];
          }
        }

        let index = _.findIndex(history.records, (o) => o === view.fullPath);

        let showHeaderBackTitle = index > 0;

        return (<View key={view.screen.guid} style={[viewStyle, {top: 0}]}
          ref={isCurrent ? 'currentView' : isPrevView ? 'prevView' : null}>
          <EdgePanView
            ref={isCurrent ? 'currentPanView' : isPrevView ? 'prevPanView' : null}
            onEdgeHorizontalPan={this.onEdgeHorizontalPan}
            gesturesEnabled={gesturesEnabled}
            style={[styles.card, {top: headerTransparent ? 0 : top}, cardStyle]}>
            <view.screen ref={SCREEN_REF_PREFIX + i} {...view} />
          </EdgePanView>
          {isPrevView && mask ? <View ref="mask" style={maskTransitionSpec && maskTransitionSpec.initialStyle} /> : null}
          {headerMode === 'screen' && !isNav ?
            <StackHeader key={`stack_header_${i}`}
              index={i}
              title={view.routeName}
              showHeaderBackTitle={showHeaderBackTitle}
              headerBackTitle={prevRouteName}
              {...navigationOptions}
              headerMode={headerMode}
              headerStyle={headerStyle}
              headerTransparent={headerTransparent}
              params={view.params}
              navigation={view.navigation} /> : null}
        </View>);
      })}
      {headerMode === 'float' && navigationOptionsArray && navigationOptionsArray.length ?
        <StackHeaderContainer type={type} isSingle={isSingle} ref="stackHeader" views={this.state.views}
          headerMode={headerMode} navigationOptionsArray={navigationOptionsArray} /> : null}
    </View>);
  }


  slideIn = (options = {}) => {
    const {callback} = options;

    this.transitionElements({type: 'push'});

    this.transitionScreens({type: 'push'}, callback);

    this.refs.stackHeader && this.refs.stackHeader.slideIn(options);
  }


  slideOut = (options) => {
    const {callback} = options;

    this.transitionElements({type: 'pop'});

    this.transitionScreens({type: 'pop'}, callback);

    this.refs.stackHeader && this.refs.stackHeader.slideOut(options);
  }

  transitionElements = (options = {type: 'push'}) => {
    let screens = this.screens;
    let progress = this.progress;
    // pan distance witch is less than half size of screen
    progress = options.type === 'push' && this.progress > 0 ? 1 - progress : progress;
    let index = this.screens.length - 1;
    let curScreen = screens[index];
    let prevScreen = screens[index - 1];
    let transitionConfig = this.resolveTransitionConfig();
    let transitionProps = [];


    if (curScreen && curScreen.getScreenTransitionConfig) {
      let screenTransitionConfig = curScreen.getScreenTransitionConfig();
      if (screenTransitionConfig && screenTransitionConfig.transitionElements) {
        _.map(screenTransitionConfig.transitionElements, (config) => {
          // TODO InputRange
          // let inputRange = config.inputRange;

          let {gesturesEnabled, outputRange, delay} = config;
          let start = options.type === 'push' ? outputRange[0] : outputRange[1];
          let end = options.type === 'push' ? outputRange[1] : outputRange[0];
          let _start = !gesturesEnabled && options.type === 'push' && progress > 0.5 ? end : (end - start) * progress + start;
          let duration = config.duration >= 0 ? config.duration : screenTransitionConfig.duration >= 0 ? screenTransitionConfig.duration : transitionConfig.transitionSpec.duration;
          if (screens.length === 1) {
            duration = 0;
            delay = 0;
          }
          transitionProps.push({
            easing: config.easing,
            delay,
            element: config.element,
            property: config.property,
            duration,
            start: _start,
            end
          });
        });
      }
    }

    if (prevScreen && prevScreen.getScreenTransitionConfig) {
      let screenTransitionConfig = prevScreen.getScreenTransitionConfig();
      if (screenTransitionConfig && screenTransitionConfig.transitionElements) {
        _.map(screenTransitionConfig.transitionElements, (config) => {
          let gesturesEnabled = config.gesturesEnabled;
          let outputRange = config.outputRange;
          let inputRange = config.inputRange;
          // TODO check for inputRange [0,1,0]
          if (outputRange.length === 3 && inputRange.length === 3) {
            let start = options.type === 'push' ? outputRange[1] : outputRange[2];
            let end = options.type === 'push' ? outputRange[2] : outputRange[1];
            let _start = !gesturesEnabled && options.type === 'push' && progress > 0.5 ? end : (end - start) * progress + start;
            transitionProps.push({
              easing: config.easing,
              delay: config.delay,
              element: config.element,
              property: config.property,
              duration: config.duration >= 0 ? config.duration : screenTransitionConfig.duration >= 0 ? screenTransitionConfig.duration : transitionConfig.transitionSpec.duration,
              start: _start,
              end
            });
          }
        });
      }
    }

    if (transitionProps && transitionProps.length > 0) {
      multipleAnimate({
        props: transitionProps
      });
    }
  }

  transitionScreens = (options, callback) => {
    let transitionConfig = this.resolveTransitionConfig();
    let {transitionSpec, prevTransitionSpec} = transitionConfig;
    let {maskTransitionSpec} = transitionConfig;
    let screens = this.screens;
    let progress = this.progress;
    if (screens.length <= 1) {
      return callback && callback();
    }
    let transitionProps = [];
    // current screen
    if (transitionSpec) {
      _.map(transitionSpec.props, (config) => {
        let result = transformRangeSpec(this.refs.currentView, {
          progress,
          type: options.type,
          ...config
        });
        transitionProps.push({
          ...result,
          // a little trick here for edge pan
          duration: progress > 0 ? 250 : transitionSpec.duration
        });
      });
    }

    // previous screen
    if (prevTransitionSpec) {
      _.map(prevTransitionSpec.props, (config) => {
        let result = transformRangeSpec(this.refs.prevView, {
          progress,
          type: options.type,
          ...config
        });
        transitionProps.push({
          ...result,
          duration: prevTransitionSpec.duration
        });
      });
    }

    if (transitionConfig.mask && maskTransitionSpec) {
      _.map(maskTransitionSpec.props, (config) => {
        let result = transformRangeSpec(this.refs.mask, {
          progress,
          type: options.type,
          ...config
        });
        transitionProps.push({
          ...result,
          duration: prevTransitionSpec.duration
        });
      });
    }

    if (transitionProps && transitionProps.length > 0) {
      multipleAnimate({
        easing: transitionSpec.easing,
        props: transitionProps
      }, (e) => {
        this.progress = 0;
        callback && callback(e);
      });
    }
  }


  prepend = (view) => {
    let views = this.state.views;
    let type = 'prepend';
    view && views.unshift(view);
    if (view) {
      this.setState({
        views,
        type,
        navigationOptionsArray: this.resolveNavigationOptionsArray(),
        isSingle: views.length === 1 ? true : false
      }, () => {
        this.syncScreens();
      });
    }
  }

  canPop = () => {
    let {views} = this.state;
    return views.length > 1;
  }

  canPush = (view) => {
    if (!view || !view.name) return;
    let {views} = this.state;
    let prev = getLast(views);
    if (prev && prev.routeName === view.name) return false;
    return true;
  }

  push = (view, callback) => {
    let {onTransitionStart, onTransitionEnd, navigation} = this.props;
    let {views} = this.state;
    let type = 'push';
    view && views.push(view);
    this.setState({
      views,
      type,
      navigationOptionsArray: this.resolveNavigationOptionsArray(),
      isSingle: views.length === 1 ? true : false
    });

    let index = this.state.views.length - 1;
    let screens = this.syncScreens();

    isFunction(onTransitionStart) && onTransitionStart({
      navigation,
      index,
      screens,
      screen: screens[index],
      views: this.state.views,
      view: this.state.views[index]
    });


    setTimeout(() => {
      this.slideIn({
        callback: () => {
          this.setState({
            isSingle: views.length === 1 ? true : false,
            type,
            navigationOptionsArray: this.resolveNavigationOptionsArray()
          });

          isFunction(onTransitionEnd) && onTransitionEnd({
            navigation,
            index,
            screens,
            screen: screens[index],
            views: this.state.views,
            view: this.state.views[index]
          });
          callback && callback();
        }
      });
    }, 50);
  }

  syncScreens = () => {
    let screens = this.screens = [];
    _.map(this.refs, (screen, refName) => {
      if (SCREEN_REF_REGEXP.test(refName)) {
        this.screens.push(screen);
      }
    });
    return screens;
  }


  pop = (callback) => {
    let {onTransitionStart, onTransitionEnd, navigation} = this.props;
    let {views} = this.state;
    let type = 'pop';
    // last view can't be closed
    if (views.length === 1) {
      this.setState({
        views,
        isSingle: true,
        type,
        navigationOptionsArray: this.resolveNavigationOptionsArray()
      });
      return;
    }


    let index = this.state.views.length - 2;

    onTransitionStart({
      navigation,
      index,
      screens: this.screens,
      screen: this.screens[index],
      views: this.state.views,
      view: this.state.views[index]
    });


    setTimeout(() => {
      this.slideOut({
        callback: () => {
          let views = this.state.views;
          let prevView = views.pop();
          this.setState({
            views,
            isSingle: views.length === 1,
            type,
            navigationOptionsArray: this.resolveNavigationOptionsArray()
          });

          let screens = this.syncScreens();

          onTransitionEnd({
            navigation,
            index,
            screens,
            screen: screens[index],
            views: this.state.views,
            view: this.state.views[index]
          });

          callback && callback({
            prevView,
            view: this.state.views[index]
          });
        }
      });
    }, 50);
  }
}


const styles = {
  fullScreen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  card: {
    position: 'absolute',
    backgroundColor: '#E9E9EF',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  view: {
    width: FULL_WIDTH,
    position: 'absolute',
    top: 0,
    bottom: 0,
    transform: 'translateX(0rem)'
  },
  container: {
    position: 'absolute',
    width: FULL_WIDTH,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  screenContainer: {
    position: 'absolute',
    width: FULL_WIDTH,
    bottom: 0,
    // backgroundColor: '#E9E9EF',
    // boxShadow: '0rem 0rem 20rem 0rem #ccc'
  },
  stackHeader: {
    position: 'absolute',
    transform: 'translateX(0rem)',
  }
};

export default StackViewContainer;
