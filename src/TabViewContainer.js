import {createElement, PropTypes} from 'rax';
import View from 'rax-view';
import _ from 'simple-lodash';
import assign from 'object-assign';
import TabBar from './views/TabBar';
import {resolveFn, pick, filterStyle, isFunction} from './Util';
import {TabController, TabPanel} from 'rax-tab-panel';
import BaseViewContainer from './BaseViewContainer';
import StackHeader, {computeHeight} from './views/StackHeader';
import {HEIGHT_TAB_BAR_DEFAULT} from './Constant';


const inheritOptionKeys = ['headerLeft', 'headerRight', 'header', 'headerTitle', 'headerStyle'];

const styles = {
  view: {
    width: 750,
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#fff'
  },
  tabBarTop: {
    top: 0,
    borderBottomWidth: 1
  },
  tabBarBottom: {
    bottom: 0,
    borderTopWidth: 1
  }
};

class TabViewContainer extends BaseViewContainer {
  state = {
    curIndex: 0
  }

  parentNavigationTitle;

  static contextTypes = {
    parentNavigation: PropTypes.Component
  };

  static defaultProps = {
    tabBarComponent: TabBar,
    tabBarPosition: 'bottom',
    configureTransition: {
      currentTransitionProps: {},
      nextTransitionProps: {}
    },
    animationEnabled: false,
    swipeEnabled: false,
    lazy: true,
    tabBarOptions: null,
    navigationOptions: null,
    cardStyle: {
      backgroundColor: '#E9E9EF'
    }
  }

  beforeTabControllerSwitch = (e) => {
    let {navigation, routerConfig, beforeTabControllerSwitch, navigateMode, onTransitionStart} = this.props;

    this.setState({curIndex: e.index});

    if (typeof onTransitionStart === 'function') {
      onTransitionStart({
        navigation,
        index: e.index
      });
    }

    isFunction(beforeTabControllerSwitch) && beforeTabControllerSwitch(e);
    if (e.params.type === 'default' || e.params.type === 'historyChange' || e.prevIndex === e.index) return;
    let routeName = Object.keys(routerConfig)[e.index];
    if (e.prevIndex >= 0) {
      navigateMode === 'push' ? navigation.navigate(routeName) : navigation.replace(routeName);
    }
  }

  afterTabControllerSwitch = (e) => {
    let {navigation, afterTabControllerSwitch, onTransitionEnd} = this.props;
    isFunction(onTransitionEnd) && onTransitionEnd({
      navigation,
      index: e.index
    });
    isFunction(afterTabControllerSwitch) && afterTabControllerSwitch(e);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.curIndex !== this.props.curIndex || nextState.curIndex !== this.state.curIndex;
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.curIndex !== this.props.curIndex) {
      // is init
      let isFirstInit = this.props.curIndex === undefined;
      setTimeout(() => {
        this.refs.tabBar && this.refs.tabBar.switchTo(nextProps.curIndex, {
          ...isFirstInit ? {duration: 0} : {},
          type: 'historyChange'
        });
        this.refs.tabController.switchTo(nextProps.curIndex, {
          ...isFirstInit ? {duration: 0} : {},
          params: {type: 'historyChange', options: nextProps.options, isFirstInit},
        });
      }, 0);
    }
  }


  render() {
    let parentNavigation = this.context.parentNavigation;
    let showStackHeader = false;
    let headerMode = parentNavigation && parentNavigation.config.options && parentNavigation.config.options.headerMode || 'screen';
    if (parentNavigation && parentNavigation.navigatorType === 'stack') {
      if (headerMode) {
        if (headerMode === 'screen' || headerMode === 'float') {
          showStackHeader = true;
        } else if (headerMode === 'none') {
          showStackHeader = false;
        }
      }
    }
    let {screens, navigation, routerConfig, animationEnabled, swipeEnabled, tabBarOptions, tabBarPosition, tabBarComponent, cardStyle = {}} = this.props;
    let {curIndex} = this.state;

    let parentNavigationOptions = {};
    if (parentNavigation && parentNavigation.config.options) {
      parentNavigationOptions = pick(resolveFn(parentNavigation.config.options.navigationOptions, {navigation}), [...inheritOptionKeys, ...['title']]) || {};
    }
    if (!this.parentNavigationTitle && parentNavigation) {
      // cache title
      this.parentNavigationTitle = parentNavigationOptions.title || parentNavigation.state.routeName;
    }
    let tabBarHeight = tabBarOptions && tabBarOptions.style && tabBarOptions.style.height >= 0 ? tabBarOptions.style.height : HEIGHT_TAB_BAR_DEFAULT;

    let options = {
      tabBarComponent
    };
    let tabBarNavigationOptions = [];
    let stackNavigationOptions = [];
    Object.keys(routerConfig).map((routeName, i) => {
      let view = _.find(screens, (o) => {
        return o.name === routeName;
      });

      if (view && view.screen) {
        let resolvedNavigationOptions = this.resolveNavigationOptions(view);
        stackNavigationOptions[i] = pick(assign(parentNavigationOptions, resolvedNavigationOptions), inheritOptionKeys);
        tabBarNavigationOptions[i] = resolvedNavigationOptions;
      }
    });


    let tabBarProps = {
      ...this.props,
      style: {},
      ...tabBarOptions,
      ref: 'tabBar',
      tabBarNavigationOptions
    };
    let curScreen = screens && screens[curIndex] || {};
    let navigationOptions = stackNavigationOptions && stackNavigationOptions[curIndex] || {};

    navigationOptions = {...navigationOptions, ...tabBarNavigationOptions[curIndex]};

    if (tabBarNavigationOptions[curIndex] && tabBarNavigationOptions[curIndex].header === undefined) {
      navigationOptions.header = undefined;
    }

    if (navigationOptions && navigationOptions.header === null) {
      showStackHeader = false;
    }

    let {headerTransparent} = navigationOptions;

    let {headerHeight, statusbarHeight} = computeHeight(navigationOptions);
    return (<View style={[styles.view, filterStyle(this.props.style)]}>
      {options.tabBarComponent && tabBarPosition === 'top' ?
        <options.tabBarComponent {...tabBarProps} style={[styles.tabBarTop, {...tabBarProps.style}]} /> : null}
      <TabController
        ref="tabController"
        style={{
          position: 'absolute',
          width: 750,
          top: (tabBarPosition === 'top' ? tabBarHeight : 0) + (showStackHeader && !headerTransparent ? headerHeight + statusbarHeight : 0),
          bottom: tabBarPosition === 'bottom' ? tabBarHeight : 0
        }}
        isPanEnabled={swipeEnabled}
        isSlideEnabled={animationEnabled}
        beforeSwitch={this.beforeTabControllerSwitch}
        afterSwitch={this.afterTabControllerSwitch}
      >
        {Object.keys(routerConfig).map((routeName, index) => {
          let view = _.find(screens, (o) => {
            return o.name === routeName;
          });
          return (<TabPanel style={cardStyle} key={index}>
            {view && view.screen ?
              <view.screen navigation={this.props.navigation} params={screen.params} /> : null}
          </TabPanel>);
        })}
      </TabController>
      {showStackHeader ?
        <StackHeader
          // title={curScreen.routeName}
          // headerBackTitle={prevView && prevView.routeName}
          {...navigationOptions}
          title={navigationOptions.headerTitle || this.parentNavigationTitle}
          headerMode={'screen'}
          params={curScreen.params}
          navigation={navigation}
        /> : null}
      {options.tabBarComponent && tabBarPosition === 'bottom' ?
        <options.tabBarComponent {...tabBarProps} style={[styles.tabBarBottom, {...tabBarProps.style}]} /> : null}
    </View>);
  }
}

export default TabViewContainer;
