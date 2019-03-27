'use strict';
import {createElement, PureComponent} from 'rax';
import View from 'rax-view';
import HeaderBackTitle from './HeaderBackTitle';
import {statusBarHeight} from '../Util';
import {HEIGHT_STACK_HEADER_DEFAULT} from '../Constant';

class HeaderLeft extends PureComponent {
  static defaultProps = {
    headerLeft: null
  };

  render() {
    let {headerLeft, style = {}, headerStyle = {}, headerMode = 'screen'} = this.props;
    return (<View
      style={[styles.headerLeftWrap, {top: headerMode === 'float' ? headerStyle.top || statusBarHeight : 0}, {height: (headerStyle.height || HEIGHT_STACK_HEADER_DEFAULT) - 2}, {opacity: undefined === style.opacity ? 1 : style.opacity}]}>
      {headerLeft && headerLeft.props ?
        <headerLeft.type {...headerLeft.props} style={headerLeft.props.style} /> :
        <HeaderBackTitle {...this.props} />}
    </View>);
  }
}

const styles = {
  headerLeftWrap: {
    position: 'absolute',
    justifyContent: 'center',
    width: 150
  }
};

export default HeaderLeft;
