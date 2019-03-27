'use strict';
import {createElement, PureComponent, findDOMNode} from 'rax';
import View from 'rax-view';
import StackHeader from './views/StackHeader';
import HeaderLeft from './views/HeaderLeft';
import HeaderRight from './views/HeaderRight';
import {animate, statusBarHeight} from './Util';
import {HEIGHT_STACK_HEADER_DEFAULT} from './Constant';

const FULL_WIDTH = 750;
class StackHeaderContainer extends PureComponent {
  static defaultProps = {
    navigationOptionsArray: [],
    headerMode: 'screen',
    isSingle: false,
    views: [],
    type: 'push'
  }


  getBindingProps = () => {
    let {headerMode = 'screen'} = this.props;

    let bindingProps = [];

    switch (headerMode) {
      case 'float':
        bindingProps = [{
          element: this.refs.current,
          property: 'transform.translateX',
          expression: {
            origin: 'max(0,x/2)'
          }
        }, {
          element: this.refs.current,
          property: 'opacity',
          expression: {
            origin: `max(0,1-x/${FULL_WIDTH})`
          }
        }, {
          element: this.refs.prev,
          property: 'transform.translateX',
          expression: {
            origin: `x/2-${FULL_WIDTH / 2}`
          }
        }, {
          element: this.refs.prev,
          property: 'opacity',
          expression: {
            origin: `x/${FULL_WIDTH}`
          }
        }];

        if (this.refs.currentBackTitle) {
          bindingProps.push({
            element: this.refs.currentBackTitle,
            property: 'opacity',
            expression: {
              origin: `max(0,1-x/${FULL_WIDTH}*3)`
            }
          });
        }

        if (this.refs.prevBackTitle) {
          bindingProps.push({
            element: this.refs.prevBackTitle,
            property: 'opacity',
            expression: {
              origin: `x/${FULL_WIDTH}`
            }
          });
        }

        if (this.refs.currentRight) {
          bindingProps.push({
            element: this.refs.currentRight,
            property: 'opacity',
            expression: {
              origin: `max(0,1-x/${FULL_WIDTH})`
            }
          });
        }

        if (this.refs.prevRight) {
          bindingProps.push({
            element: this.refs.prevRight,
            property: 'opacity',
            expression: {
              origin: `x/${FULL_WIDTH}`
            }
          });
        }

        break;
      case 'screen':
        // bindingProps = [{
        //   element: this.refs.current,
        //   property: 'transform.translateX',
        //   expression: {
        //     origin: 'max(0,x)'
        //   }
        // }, {
        //   element: this.refs.prev,
        //   property: 'transform.translateX',
        //   expression: {
        //     origin: `x*${PREV_VIEW_RATIO}-${PREV_VIEW_RATIO * FULL_WIDTH}`
        //   }
        // }];
        break;
      case 'none':
        break;
    }
    return bindingProps;
  }

  slideIn = (options) => {
    let {headerMode = 'screen'} = this.props;
    let {timingFunction, duration} = options;
    let animationConfig = {
      timingFunction,
      duration
    };


    switch (headerMode) {
      case 'float':

        animate(this.refs.prev, {transform: `translate(-${FULL_WIDTH / 2}rem,0)`, opacity: 0}, animationConfig);

        animate(this.refs.current, {transform: 'translate(0,0)', opacity: 1}, animationConfig);

        animate(this.refs.prevBackTitle, {opacity: 0}, animationConfig);

        animate(this.refs.currentBackTitle, {opacity: 1}, animationConfig);

        animate(this.refs.prevRight, {opacity: 0}, animationConfig);

        animate(this.refs.currentRight, {opacity: 1}, animationConfig);

        break;
      case 'screen':

        // animate(this.refs.prev, {transform: `translate(-${PREV_VIEW_RATIO * FULL_WIDTH}rem,0)`}, animationConfig);

        // animate(this.refs.current, {transform: 'translate(0,0)'}, animationConfig);

        break;
      case 'none':
        break;
    }
  }

  slideOut = (options) => {
    let {headerMode = 'screen'} = this.props;
    let {timingFunction, duration} = options;
    let animationConfig = {
      timingFunction,
      duration
    };
    switch (headerMode) {
      case 'float':

        animate(this.refs.prev, {transform: 'translate(0,0)', opacity: 1}, animationConfig);

        animate(this.refs.current, {transform: `translate(${FULL_WIDTH / 2}rem,0)`, opacity: 0}, animationConfig);

        animate(this.refs.prevBackTitle, {opacity: 1}, animationConfig);

        animate(this.refs.currentBackTitle, {opacity: 0}, animationConfig);

        animate(this.refs.prevRight, {opacity: 1}, animationConfig);

        animate(this.refs.currentRight, {opacity: 0}, animationConfig);

        break;
      case 'screen':

        // animate(this.refs.prev, {transform: 'translate(0,0)'}, animationConfig);
        //
        // animate(this.refs.current, {transform: `translate(${FULL_WIDTH}rem,0)`}, animationConfig);

        break;
      case 'none':
        break;
    }
  }

  render() {
    let {navigationOptionsArray = [], isSingle = false, views = [], headerMode, type} = this.props;
    if (headerMode === 'none') return null;
    let firstNavigationOptions = navigationOptionsArray[0] || {};
    let {headerStyle = {}} = firstNavigationOptions;
    let l = views.length;
    return (
      <View style={[styles.container, {height: (headerStyle.height || HEIGHT_STACK_HEADER_DEFAULT) + statusBarHeight}]}>
        {views.map((view, i) => {
          let isCurrent = i === l - 1;
          let isPrev = i === l - 2;
          let prevView = views[i - 1];
          let navigationOptions = navigationOptionsArray[i];
          let viewStyle = {};
          if (isSingle) {
            viewStyle = {};
          } else {
            if (type === 'push') {
              viewStyle = isCurrent ? styles.current : {};
            } else if (type === 'pop') {
              viewStyle = isCurrent ? {} : styles.prev;
            }
          }

          return (<StackHeader
            key={`stack_header_${i}`}
            index={i}
            ref={isCurrent ? 'current' : isPrev ? 'prev' : null}
            title={view.routeName}
            headerBackTitle={prevView && prevView.routeName}
            {...navigationOptions}
            headerMode={headerMode}
            params={view.params}
            style={viewStyle}
            navigation={view.navigation} />);
        })}
        {headerMode === 'float' ? views.map((view, i) => {
          let isCurrent = i === l - 1;
          let isPrev = i === l - 2;
          let prevView = views[i - 1];
          let navigationOptions = navigationOptionsArray[i];
          let {header, headerStyle = {}} = navigationOptions;
          let opacity = 1;
          if (isSingle) {
            opacity = 1;
          } else {
            if (type === 'push') {
              opacity = isCurrent ? 0 : 1;
            } else if (type === 'pop') {
              opacity = isCurrent ? 1 : 0;
            }
          }
          if (header !== undefined) {
            return header;
          }

          return i >= l - 2 ? [<HeaderLeft
            key={`header_back_title_${i}`}
            index={i}
            ref={isCurrent ? 'currentBackTitle' : isPrev ? 'prevBackTitle' : null}
            headerBackTitle={prevView && prevView.routeName}
            {...navigationOptions}
            style={{opacity}}
            headerStyle={headerStyle}
            headerMode={headerMode}
            navigation={view.navigation}
          />, <HeaderRight
            key={`header_right_${i}`}
            ref={isCurrent ? 'currentRight' : isPrev ? 'prevRight' : null}
            headerBackTitle={prevView && prevView.routeName}
            {...navigationOptions}
            style={{opacity}}
            headerStyle={headerStyle}
            headerMode={headerMode}
            navigation={view.navigation}
          />] : null;
        }) : null}
      </View>);
  }
}

const styles = {
  container: {
    position: 'absolute',
    width: 750,
    top: 0,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  current: {
    transform: 'translateX(750rem)'
  },
  prev: {}
};

export default StackHeaderContainer;