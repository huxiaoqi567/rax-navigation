'use strict';

import {createElement, Component} from 'rax';
import View from 'rax-view';
import {isWeex} from 'universal-env';

const EDGE_PAN_THRESHOLD = 100;

class EdgePanView extends Component {
  static defaultProps = {
    onEdgeHorizontalPan: () => {
    }
  }

  onHorizontalPan = (e) => {
    if (e && e.state === 'start') {
      this.handleEdgePanStart(e);
    }
  }

  onTouchStart = (e) => {
    this.handleEdgePanStart(e);
  }

  handleEdgePanStart = (e) => {
    e.state = 'start';
    let {onEdgeHorizontalPan} = this.props;
    if (e.changedTouches[0].pageX < EDGE_PAN_THRESHOLD) {
      onEdgeHorizontalPan && onEdgeHorizontalPan(e);
    }
  }


  render() {
    let props = {
      ...this.props
    };

    let {gesturesEnabled = true} = props;

    if (gesturesEnabled) {
      if (isWeex) {
        props.onHorizontalPan = this.onHorizontalPan;
      } else {
        props.onTouchStart = this.onTouchStart;
      }
    }

    return <View {...props} />;
  }
}

export default EdgePanView;
