import {createElement, Component, PropTypes} from 'rax';
import {noop} from './Util';
import {TabPanelView} from 'rax-tab-panel';
import PanView from './PanView';


const styles = {
  link: {}
};


class Link extends Component {
  static contextTypes = {
    isInATabPanel: PropTypes.bool,
    navigation: PropTypes.Component
  };

  onClick = (e) => {
    let {href, onClick = noop} = this.props;
    let {navigation} = this.context;
    onClick(e);
    if (navigation && href) {
      navigation.navigateByPath(href);
    }
  }

  render() {
    let props = {
      style: [styles.link, {...this.props.style}],
      onClick: this.onClick,
      children: this.props.children
    };
    return this.context.isInATabPanel ? <TabPanelView {...props} /> : <PanView {...props} />;
  }
}

export default Link;
