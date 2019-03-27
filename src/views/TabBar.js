import {createElement, Component, PropTypes} from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import {noop} from '../Util';
import {HEIGHT_TAB_BAR_DEFAULT} from '../Constant';


class TabBar extends Component {
  static defaultProps = {
    afterSwitch: noop,
    beforeSwitch: noop,
    // Label and icon color of the active tab.
    activeTintColor: 'rgb(12, 66, 253)',
    // Background color of the active tab.
    activeBackgroundColor: 'rgba(0,0,0,0)',
    // Label and icon color of the inactive tab.
    inactiveTintColor: '#888',
    // Background color of the inactive tab
    inactiveBackgroundColor: 'rgba(0,0,0,0)',
    // Whether to show label for tab, default is true.
    showLabel: true,
    //   Style object for the tab bar.
    style: {},
    //   Style object for the tab label.
    labelStyle: {},
    // Style object for the tab.
    tabStyle: {},
    //   Whether label font should scale to respect Text Size accessibility settings, default is true.
    allowFontScaling: true
  }

  static contextTypes = {
    parentNavigation: PropTypes.Component
  };

  prevIndex = null;


  state = {
    // curIndex: 0
  }

  handleClick = ({name, index}) => {
    if (index === this.prevIndex) return;

    let {navigation, navigateMode} = this.props;
    if (name && navigation) {
      navigateMode === 'push' ? navigation.navigate(name) : navigation.replace(name);
    }
    this.switchTo(index, {type: 'click'});
  }

  switchTo = (index, options = {}) => {
    let {afterSwitch, beforeSwitch} = this.props;

    let params = {
      index,
      prevIndex: this.prevIndex,
      options
    };

    beforeSwitch(params);

    this.setState({
      curIndex: index
    });

    afterSwitch(params);

    this.prevIndex = index;
  }


  render() {
    let curIndex = this.state.curIndex;
    let {history, routerConfig, style, tabStyle, activeTintColor, activeBackgroundColor, inactiveTintColor, inactiveBackgroundColor, tabBarNavigationOptions = [], showLabel, labelStyle} = this.props;
    return (<View style={[styles.tab, style]}>
      {history ? Object.keys(routerConfig).map((name, i) => {
        let isActive = i === curIndex;
        let navigationOptions = tabBarNavigationOptions[i] || {};
        let {tabBarLabel, title = name, tabBarIcon} = navigationOptions;
        tabBarIcon = typeof tabBarIcon === 'function' ? tabBarIcon({tintColor: isActive ? activeTintColor : inactiveTintColor}) : tabBarIcon;
        return (<View key={i}
          onClick={() => this.handleClick({name, index: i, params: this.props.params})}
          style={[styles.tabItem, {backgroundColor: isActive ? activeBackgroundColor : inactiveBackgroundColor}, tabStyle]}>
          {tabBarIcon && tabBarIcon.type ?
            <tabBarIcon.type {...tabBarIcon.props} style={[styles.tabBarIcon, tabBarIcon.props.style]} /> : null}
          {showLabel ? <Text
            style={[styles.tabItemTxt, {color: isActive ? activeTintColor : inactiveTintColor}, labelStyle]}>{tabBarLabel || title}</Text> : null}
        </View>);
      })
        : null
      }

    </View>);
  }
}

const styles = {
  tab: {
    position: 'absolute',
    width: 750,
    height: HEIGHT_TAB_BAR_DEFAULT,
    flexDirection: 'row',
    backgroundColor: '#fefefe',
    borderColor: '#ccc'
  },
  tabItem: {
    height: HEIGHT_TAB_BAR_DEFAULT,
    backgroundColor: 'rgba(0,0,0,0)',
    textAlign: 'center',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabItemTxt: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 32
  },
  tabItemActive: {
    backgroundColor: '#ccc'
  },
  tabBarIcon: {
    width: 60,
    height: 60
  }
};


export default TabBar;
