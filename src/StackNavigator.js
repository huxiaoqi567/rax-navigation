import {createElement, Component} from 'rax';
import {matchRouteByName, noop} from './Util';
import {queryRoutes} from './Router';
import StackViewContainer from './StackViewContainer';
import BaseNavigator, {createNavigator} from './BaseNavigator';
import {TYPE_NAVIGATOR_STACK} from './Constant';
import Loading from './views/Loading';


class StackNavigatorComponent extends BaseNavigator {
  navigatorType = TYPE_NAVIGATOR_STACK;

  static defaultProps = {
    initialRouteName: null,
    initialRouteParams: {},
    navigationOptions: ({navigation}) => ({
      // Whether you can use gestures to dismiss this screen. Defaults to true on iOS, false on Android.
      gesturesEnabled: true,
      // Object to override the distance of touch start from the edge of the screen to recognize gestures
      gestureResponseDistance: {
        horizontal: 25,
        vertical: 135
      }
    }),
    headerMode: 'screen',
    onTransitionStart: noop,
    onTransitionEnd: noop,
    transitionConfig: {
      transitionProps: {},
      prevTransitionProps: {},
      isModal: true
    }
  }

  getScreenComponent = (route) => {
    return new Promise(resolve => {
      // show loading
      this.refs.loading.show();

      return super.getScreenComponent(route).then(screen => {
        // hide loading
        this.refs.loading.hide();
        resolve(screen);
      });
    });
  }

  updateScreen = (info = {}) => {
    this.handleWillEvent(info);
    let {name, action, params, options = {}, fullPath} = info;
    let {routerConfig, navigation, history} = this.props;
    let {location} = history;
    let viewContainer = this.refs.viewContainer;
    if (action === 'POP') {
      if (options && options.direction === 'BACKWARD') {
        if (viewContainer.canPop()) {
          viewContainer.pop(() => {
            this.handleDidEvent(info);
          });
        } else {
          let routes = queryRoutes(navigation.router.routes, {path: location.pathname + location.search});
          let route = routes[0];

          if (route && viewContainer.canPush({name: route.name})) {
            this.getScreenComponent(route).then((screen) => {
              if (screen) {
                // prepend a view before pop
                viewContainer.prepend({
                  screen,
                  params: params,
                  navigation,
                  routeName: route.name,
                  routePath: route.path,
                  fullPath
                });
                viewContainer.pop(() => {
                  this.handleDidEvent(info);
                });
              }
            });
          }
        }
      }
    } else if (action === 'PUSH') {
      let route = matchRouteByName(routerConfig, name);
      if (route && route.name && viewContainer.canPush({name: route.name})) {
        route && this.getScreenComponent(route).then((screen) => {
          let view = {
            screen,
            params: params,
            navigation,
            routeName: route.name,
            routePath: route.path,
            fullPath
          };
          screen && viewContainer.push(view, () => {
            this.handleDidEvent(info);
          });
        });
      }
    }
  }

  render() {
    return [<StackViewContainer {...this.props} ref="viewContainer" history={this.history} key={0} />,
      <Loading ref="loading" {...this.props} key={1} />];
  }
}

function StackNavigator(routerConfig, options = {}) {
  return createNavigator({
    routerConfig,
    options,
    navigatorType: TYPE_NAVIGATOR_STACK,
    NavigatorComponent: StackNavigatorComponent
  });
}

export default StackNavigator;
