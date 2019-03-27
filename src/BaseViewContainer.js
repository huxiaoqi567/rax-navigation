'use strict';

import {createElement, Component} from 'rax';
import assign from 'object-assign';

import {resolveFn} from './Util';

class BaseViewContainer extends Component {
  getChildContext() {
    return {
      parentNavigation: this.props.navigation
    };
  }

  _resolvedViews = {};

  resolveNavigationOptions = (view) => {
    let navigationOptions = {};
    if (view && view.screen && view.screen.guid) {
      navigationOptions = this._resolvedViews[view.screen.guid] || assign(resolveFn(
        this.props.navigationOptions, view), resolveFn(view.screen.navigationOptions, view));
      this._resolvedViews[view.screen.guid] = navigationOptions;
    }
    return navigationOptions;
  }
}

export default BaseViewContainer;
