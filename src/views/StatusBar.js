'use strict';

import {createElement, Component} from 'rax';
import {isWeex} from 'universal-env';
import {noop} from '../Util';

// TODO backgroundColor Props

class StatusBar extends Component {
  componentDidMount() {
    let {barStyle = 'dark-content'} = this.props;
    let style = barStyle == 'light-content' ? 'lightContent' : 'default';
    if (isWeex) {
      let navigationBar = require('@weex-module/navigationBar');
      if (navigationBar && typeof navigationBar.setStatusBarStyle === 'function') {
        navigationBar.setStatusBarStyle({
          style
        }, noop, noop);
      }
    }
  }

  render() {
    return null;
  }
}

export default StatusBar;
