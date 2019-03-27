// TODO statusBar https://reactnavigation.org/docs/status-bar.html
/*
class Screen2 extends Component {
  render() {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#ecf0f1' }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ecf0f1"
        />
        <Text style={styles.paragraph}>
          Dark Screen
        </Text>
        <Button
          title="Next screen"
          onPress={() => this.props.navigation.navigate('Screen1')}
        />
      </SafeAreaView>
    );
  }
}
 */

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