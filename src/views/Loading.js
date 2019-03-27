'use strict';
import {createElement, PureComponent} from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import Image from 'rax-image';

class DefaultLoading extends PureComponent {
  static defaultProps = {
    loadingText: 'loading...',
    loadingIconSource: '',
    loadingIconStyle: {},
    loadingTextStyle: {},
    loadingWrapStyle: {}
  }

  render() {
    let {loadingText, loadingIconSource, loadingIconStyle, loadingTextStyle, loadingWrapStyle} = this.props;

    return (<View style={[styles.inner, loadingWrapStyle]}>
      {loadingIconSource && <Image quality={'original'} style={[styles.pic, loadingIconStyle]} source={{uri: loadingIconSource}} />}
      <Text style={[styles.txt, loadingTextStyle]}>{loadingText}</Text>
    </View>);
  }
}

class Loading extends PureComponent {
  state = {
    isShow: false
  }

  static defaultProps = {
    loadingComponent: DefaultLoading
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.isShow !== nextState.isShow;
  }

  show() {
    this.setState({
      isShow: true
    });
  }

  hide() {
    this.setState({
      isShow: false
    });
  }

  render() {
    let {isShow} = this.state;

    return isShow && this.props.loadingComponent ? <View style={styles.container}>
      <this.props.loadingComponent {...this.props} />
    </View> : null;
  }
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    // backgroundColor: 'rgba(0,0,0,.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inner: {
    width: 250,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.75)',
    borderRadius: 30
  },
  txt: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center'
  },
  pic: {
    width: 100,
    height: 100,
    quality: 'original'
  }
};

export default Loading;
