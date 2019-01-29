/* @flow */

import { createElement, PropTypes, PureComponent } from 'rax';

import Animated from 'rax-animated';
import StyleSheet from 'universal-stylesheet';
import Platform from 'universal-platform';
import View from 'rax-view';

import HeaderTitle from './HeaderTitle';
import HeaderBackButton from './HeaderBackButton';
import HeaderStyleInterpolator from './HeaderStyleInterpolator';
import NavigationPropTypes from '../PropTypes';
import addNavigationHelpers from '../addNavigationHelpers';

export type HeaderMode = 'float' | 'screen' | 'none';

// type SubViewProps = NavigationSceneRendererProps & {
//   onNavigateBack?: () => void,
// };
//
// type Navigation = NavigationScreenProp<*, NavigationAction>;
//
// type SubViewRenderer = (subViewProps: SubViewProps) => ?Element<any>;

// export type HeaderProps = NavigationSceneRendererProps & {
//   mode: HeaderMode,
//   onNavigateBack?: () => void,
//   renderLeftComponent: SubViewRenderer,
//   renderRightComponent: SubViewRenderer,
//   renderTitleComponent: SubViewRenderer,
//   tintColor?: string,
//   router: NavigationRouter,
// };

type SubViewName = 'left' | 'title' | 'right';

type HeaderState = {
  widths: {
    [key: string]: number,
  },
};

const APPBAR_HEIGHT = Platform.OS === 'ios' ? 88 : 112;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 40 : 0;
const TITLE_OFFSET = Platform.OS === 'ios' ? 140 : 80;

class Header extends PureComponent {
  static HEIGHT = APPBAR_HEIGHT + STATUSBAR_HEIGHT;
  static Title = HeaderTitle;
  static BackButton = HeaderBackButton;

  // propTypes for people who don't use Flow
  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    onNavigateBack: PropTypes.func,
    renderLeftComponent: PropTypes.func,
    renderRightComponent: PropTypes.func,
    renderTitleComponent: PropTypes.func,
    router: PropTypes.object,
    style: PropTypes.any,
  };

  // props: HeaderProps;

  state = {
    widths: {},
  };

  _getHeaderTitle(navigation) {
    const header = this.props.router.getScreenConfig(navigation, 'header');
    let title;
    if (header && header.title) {
      title = header.title;
    } else {
      title = this.props.router.getScreenConfig(navigation, 'title');
    }
    return typeof title === 'string' ? title : undefined;
  }

  _getBackButtonTitle(navigation) {
    const header = this.props.router.getScreenConfig(navigation, 'header') || {};
    if (header.backTitle === null) {
      return undefined;
    }
    return header.backTitle || this._getHeaderTitle(navigation);
  }

  _getHeaderTintColor(navigation) {
    const header = this.props.router.getScreenConfig(navigation, 'header');
    if (header && header.tintColor) {
      return header.tintColor;
    }
    return undefined;
  }

  _getHeaderTitleStyle(navigation) {
    const header = this.props.router.getScreenConfig(navigation, 'header');
    if (header && header.titleStyle) {
      return header.titleStyle;
    }
    return undefined;
  }

  _renderTitleComponent = (props) => {
    const titleStyle = this._getHeaderTitleStyle(props.navigation);
    const color = this._getHeaderTintColor(props.navigation);
    const title = this._getHeaderTitle(props.navigation);

    // On iOS, width of left/right components depends on the calculated
    // size of the title.
    const onLayoutIOS = Platform.OS === 'ios'
      ? (e) => {
        this.setState({
          widths: {
            ...this.state.widths,
            [props.key]: e.nativeEvent.layout.width,
          },
        });
      }
      : undefined;

    return (
      <HeaderTitle
        onLayout={onLayoutIOS}
        style={[color ? { color } : null, titleStyle]}
      >
        {title}
      </HeaderTitle>
    );
  };

  _renderLeftComponent = (props) => {
    if (props.scene.index === 0 || !props.onNavigateBack) {
      return null;
    }
    const tintColor = this._getHeaderTintColor(props.navigation);
    const previousNavigation = addNavigationHelpers({
      ...props.navigation,
      state: props.scenes[props.scene.index - 1].route,
    });
    const backButtonTitle = this._getBackButtonTitle(previousNavigation);
    const width = this.state.widths[props.key]
      ? (props.layout.initWidth - this.state.widths[props.key]) / 2
      : undefined;
    return (
      <HeaderBackButton
        onPress={props.onNavigateBack}
        tintColor={tintColor}
        title={backButtonTitle}
        width={width}
      />
    );
  };

  _renderRightComponent = () => null;

  _renderLeft(props) {
    return this._renderSubView(
      props,
      'left',
      this.props.renderLeftComponent,
      this._renderLeftComponent,
      HeaderStyleInterpolator.forLeft,
    );
  }

  _renderTitle(props, options) {
    const style = {};

    if (Platform.OS === 'android') {
      if (!options.hasLeftComponent) {
        style.left = 0;
      }
      if (!options.hasRightComponent) {
        style.right = 0;
      }
    }

    return this._renderSubView(
      { ...props, style },
      'title',
      this.props.renderTitleComponent,
      this._renderTitleComponent,
      HeaderStyleInterpolator.forCenter,
    );
  }

  _renderRight(props) {
    return this._renderSubView(
      props,
      'right',
      this.props.renderRightComponent,
      this._renderRightComponent,
      HeaderStyleInterpolator.forRight,
    );
  }

  _renderSubView(
    props,
    name,
    renderer,
    defaultRenderer,
    styleInterpolator,
  ) {
    const {
      scene,
      navigationState,
    } = props;
    const {
      index,
      isStale,
      key,
    } = scene;

    const offset = navigationState.index - index;

    if (Math.abs(offset) > 2) {
      // Scene is far away from the active scene. Hides it to avoid unnecessary
      // rendering.
      return null;
    }

    const subViewProps = {
      ...props,
      onNavigateBack: this.props.onNavigateBack,
    };

    let subView = renderer(subViewProps);
    if (subView === undefined) {
      subView = defaultRenderer(subViewProps);
    }

    if (subView === null) {
      return null;
    }

    const pointerEvents = offset !== 0 || isStale ? 'none' : 'box-none';

    return (
      <Animated.View
        pointerEvents={pointerEvents}
        key={`${name}_${key}`}
        style={[
          styles.item,
          styles[name],
          props.style,
          styleInterpolator(props),
        ]}
      >
        {subView}
      </Animated.View>
    );
  }

  _renderHeader(props) {
    const left = this._renderLeft(props);
    const right = this._renderRight(props);
    const title = this._renderTitle(props, {
      hasLeftComponent: !!left,
      hasRightComponent: !!right,
    });

    return (
      <View
        style={[StyleSheet.absoluteFill, styles.header]}
        key={`scene_${props.scene.key}`}
      >
        {title}
        {left}
        {right}
      </View>
    );
  }

  render() {
    let appBar;

    if (this.props.mode === 'float') {
      const scenesProps = this.props.scenes
        .map((scene, index) => ({
          ...NavigationPropTypes.extractSceneRendererProps(this.props),
          scene,
          index,
          navigation: addNavigationHelpers({
            ...this.props.navigation,
            state: scene.route,
          }),
        }));

      appBar = scenesProps.map(this._renderHeader, this);
    } else {
      appBar = this._renderHeader({
        ...NavigationPropTypes.extractSceneRendererProps(this.props),
        position: new Animated.Value(this.props.scene.index),
        progress: new Animated.Value(0),
      });
    }

    // eslint-disable-next-line no-unused-vars
    const { scenes, scene, style, position, progress } = this.props;

    return (
      <Animated.View style={[styles.container, style]}>
        <View style={styles.appBar}>
          {appBar}
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: STATUSBAR_HEIGHT,
    backgroundColor: Platform.OS === 'ios' ? '#EFEFF2' : '#FFF',
    height: STATUSBAR_HEIGHT + APPBAR_HEIGHT,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: StyleSheet.hairlineWidth,
    shadowOffset: {
      height: StyleSheet.hairlineWidth,
    },
    elevation: 4,
  },
  appBar: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    right: 0,
    height: STATUSBAR_HEIGHT + APPBAR_HEIGHT,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    bottom: 0,
    left: TITLE_OFFSET,
    right: TITLE_OFFSET,
    top: 0,
    position: 'absolute',
    alignItems: Platform.OS === 'android'
      ? 'flex-start'
      : 'center',
  },
  left: {
    left: 0,
    bottom: 0,
    top: 0,
    position: 'absolute',
  },
  right: {
    right: 0,
    bottom: 0,
    top: 0,
    position: 'absolute',
  },
});

export default Header;
