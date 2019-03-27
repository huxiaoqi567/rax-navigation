import {createElement, Component, PropTypes} from 'rax';
import View from 'rax-view';
import _ from 'simple-lodash';
import {matchRouteByName} from './Util';
import {TYPE_NAVIGATOR_TAB} from './Constant';
import BaseNavigator, {createNavigator} from './BaseNavigator';
import TabViewContainer from './TabViewContainer';

const styles = {
  fullScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 750
  }
};


class TabNavigatorComponent extends BaseNavigator {
  static contextTypes = {
    parentNavigator: PropTypes.Component
  };

  navigatorType = TYPE_NAVIGATOR_TAB;

  state = {
    screen: null,
    screens: [],
    curIndex: undefined,
    options: {}
  }


  static defaultProps = {
    initialRouteName: null,
    initialRouteParams: {},
    tabBarOptions: null,
    navigationOptions: ({navigation}) => ({
      // Object to override the distance of touch start from the edge of the screen to recognize gestures
      gestureResponseDistance: {
        horizontal: 25,
        vertical: 135
      }
    }),
  }


  updateScreen = (options = {}) => {
    // this.handleWillEvent(options);
    let {name, action, params} = options;
    let {routerConfig, navigation} = this.props;
    let route = matchRouteByName(routerConfig, name);

    if (!route) return;

    this.getScreenComponent(route).then((screen) => {
      if (screen) {
        let routeNames = Object.keys(routerConfig);
        let index = _.findIndex(routeNames, (routeName) => {
          return routeName === route.name;
        });
        let screens = this.state.screens;

        if (screens.length === 0) {
          routeNames.forEach((routeName, i) => {
            screens[i] = {};
          });
        }

        screens[index] = {
          name: route.name,
          screen,
          params: options.params || params, action,
          navigation,
          routeName: route.name,
          routePath: route.path
        };

        this.setState({screens, curIndex: index, options});
      }
    });
  }

  beforeTabControllerSwitch = (e) => {
    let {beforeTabControllerSwitch, navigation} = this.props;

    if (e.params.options && !(e.params.isFirstInit && navigation.level > 0)) {
      this.handleWillEvent(e.params.options);
    }
    beforeTabControllerSwitch && beforeTabControllerSwitch(e);
  }

  afterTabControllerSwitch = (e) => {
    let {afterTabControllerSwitch, navigation} = this.props;
    if (e.params.options && !(e.params.isFirstInit && navigation.level > 0)) {
      this.handleDidEvent(e.params.options);
    }
    afterTabControllerSwitch && afterTabControllerSwitch(e);
  }


  render() {
    let {props} = this;
    return (<View style={[styles.fullScreen, {...props.style}]}>
      <TabViewContainer {...props} ref="viewContainer"
        beforeTabControllerSwitch={this.beforeTabControllerSwitch}
        afterTabControllerSwitch={this.afterTabControllerSwitch}
        history={this.history}
        screens={this.state.screens}
        options={this.state.options}
        curIndex={this.state.curIndex} />
    </View>);
  }
}


function TabNavigator(routerConfig, options = {}) {
  return createNavigator({
    routerConfig,
    options,
    navigatorType: TYPE_NAVIGATOR_TAB,
    NavigatorComponent: TabNavigatorComponent
  });
}


export default TabNavigator;
