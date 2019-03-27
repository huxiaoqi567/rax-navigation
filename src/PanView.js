/** @jsx createElement */

'use strict';

import {createElement, Component, PropTypes} from 'rax';
import View from 'rax-view';
import {TabPanelView} from 'rax-tab-panel';
import {Detection, Event as Emitter} from './Util';
import {EVENT_CELL_PAN_START} from './Constant';


class PanView extends Component {
  isPanning = false;

  static contextTypes = {
    isInATabPanel: PropTypes.bool
  };

  render() {
    let props = {
      ...this.props,
      preventMoveEvent: true,
      onClick: this.onCellClick
    };
    if (Detection.Android) {
      props.onHorizontalPan = this.onHorizontalPan;
    }

    return this.context.isInATabPanel ? <TabPanelView {...props} /> : <View {...props} />;
  }

  onCellClick = (e) => {
    const {onClick, onPress} = this.props;
    if (this.isPanning) {
      return;
    }
    if (typeof onClick === 'function') {
      onClick(e);
    } else if (typeof onPress === 'function') {
      onPress(e);
    }
  }

  onHorizontalPan = (e) => {
    if (e.state === 'start') {
      this.isPanning = true;
      Emitter.emit(EVENT_CELL_PAN_START, {
        element: this
      });
    } else if (e.state === 'end') {
      setTimeout(() => {
        this.isPanning = false;
      }, 50);
    }
  }
}


export default PanView;
