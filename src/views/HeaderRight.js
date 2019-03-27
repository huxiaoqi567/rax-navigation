'use strict';
import {createElement, PureComponent} from 'rax';
import View from 'rax-view';
import {statusBarHeight} from '../Util';
import {HEIGHT_STACK_HEADER_DEFAULT} from '../Constant';

class HeaderRight extends PureComponent {
  static defaultProps = {
    headerRight: null
  };

  render() {
    let {headerRight, style = {}, headerMode, headerStyle} = this.props;

    return (
      <View ref="headerRight"
        style={[styles.headerRightWrap, {opacity: undefined === style.opacity ? 1 : style.opacity}, {top: headerMode === 'float' ? headerStyle.top || statusBarHeight : 0}, {height: (headerStyle.height || HEIGHT_STACK_HEADER_DEFAULT) - 2}]}>
        {headerRight}
      </View>);
  }
}

const styles = {
  headerRightWrap: {
    position: 'absolute',
    justifyContent: 'center',
    width: 150,
    right: 0
  }
};


export default HeaderRight;