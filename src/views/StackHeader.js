'use strict';

import {createElement, PureComponent} from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import HeaderRight from './HeaderRight';
import HeaderLeft from './HeaderLeft';
import {statusBarHeight} from '../Util';
import {HEIGHT_STACK_HEADER_DEFAULT} from '../Constant';


function computeHeight(props) {
  let {headerStyle = {}, header} = props;
  let headerHeight = HEIGHT_STACK_HEADER_DEFAULT;
  let statusbarHeight = statusBarHeight;
  if (header === null) {
    headerHeight = 0;
  } else if (header === undefined) {
    headerHeight = headerStyle.height >= 0 ? headerStyle.height : HEIGHT_STACK_HEADER_DEFAULT;
  } else if (header !== undefined && header.props && header.props.style) {
    headerHeight = header.props.style.height >= 0 ? header.props.style.height : HEIGHT_STACK_HEADER_DEFAULT;
    statusbarHeight = 0;
  }
  return {headerHeight, statusbarHeight};
}

class StackHeader extends PureComponent {
  static defaultProps = {
    title: '',
    index: 0,
    headerTitle: null,
    params: {},
    headerBackTitle: 'Back',
    headerLeft: null,
    headerRight: null,
    header: undefined,
    // Style object for the header
    headerStyle: {},
    // Style object for the title component
    headerTitleStyle: {},
    // Style object for the back title
    headerBackTitleStyle: {
      color: 'rgb(12, 66, 253)'
    },
    // Tint color for the header
    headerTintColor: '#333',
    // float | screen | none
    headerMode: 'screen'
  }


  resolveTitle() {
    let {title, params, headerTintColor, headerTitleStyle} = this.props;

    if (typeof title === 'function') {
      title = title({params});
    }

    if (typeof title === 'string') {
      title = <Text style={[styles.navTitle, {color: headerTintColor}, headerTitleStyle]}>{title}</Text>;
    }

    return <View style={styles.title}>{title}</View>;
  }

  // shouldComponentUpdate() {
  //   return false;
  // }

  render() {
    let {headerStyle = {}, headerMode, header, headerTransparent} = this.props;
    if (header === null) return <View />;
    if (header !== undefined) return header;
    let {headerHeight, statusbarHeight} = computeHeight(this.props);
    return (
      <View
        style={[styles.nav, headerStyle, {height: headerHeight + statusbarHeight}, headerTransparent ? styles.navTransparent : {}]}>
        <View style={[{
          marginTop: statusbarHeight,
          width: 750
        }, {height: headerHeight}]}>
          {headerMode !== 'float' ? <HeaderLeft {...this.props} /> : null}
          {this.resolveTitle()}
          {headerMode !== 'float' ? <HeaderRight {...this.props} /> : null}
        </View>
      </View>);
  }
}


const styles = {
  nav: {
    height: HEIGHT_STACK_HEADER_DEFAULT + statusBarHeight,
    width: 750,
    position: 'absolute',
    top: 0,
    backgroundColor: '#fefefe',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    transform: 'translateX(0rem)'
  },
  navTransparent: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderColor: 'rgba(0,0,0,0)'
  },
  navTitle: {
    textAlign: 'center',
    width: 450,
    fontSize: 32
  },
  title: {
    position: 'absolute',
    width: 450,
    overflow: 'hidden',
    top: 0,
    bottom: 0,
    left: 150,
    fontWeight: 'bolder',
    justifyContent: 'center'
  },
  headerRight: {
    position: 'absolute',
    top: 0,
    width: 150,
    bottom: 0,
    right: 0
  }
};

export default StackHeader;

export {computeHeight};
