'use strict';
import {createElement, PureComponent} from 'rax';
import Button from 'rax-button';
import Text from 'rax-text';

class HeaderBackTitle extends PureComponent {
  static defaultProps = {
    headerBackTitle: 'Back',
    showHeaderBackTitle: true
  };

  handleGoBack = () => {
    let {navigation} = this.props;
    navigation && navigation.goBack();
  }

  render() {
    let {headerBackTitle, headerTintColor, headerBackTitleStyle, showHeaderBackTitle} = this.props;

    if (!showHeaderBackTitle) return null;

    if (typeof headerBackTitle !== 'string') {
      headerBackTitle = 'Back';
    }
    return (<Button style={styles.goBack}
      onPress={this.handleGoBack}>
      <Text style={[styles.headerBackTitle, {color: headerTintColor}, headerBackTitleStyle]}>{headerBackTitle}</Text>
    </Button>);
  }
}

const styles = {
  goBack: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 150,
    bottom: 0,
    overflow: 'hidden',
    opacity: 1,
    justifyContent: 'center'
  },
  headerBackTitle: {
    textAlign: 'center',
    fontSize: 32
  }
};


export default HeaderBackTitle;