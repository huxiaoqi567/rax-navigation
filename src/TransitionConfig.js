'use strict';

const DEFAULT_DURATION = 250;
const FULL_WIDTH = 750;
const PREV_VIEW_RATIO = 300 / FULL_WIDTH;

const HORIZONTAL_PUSH = {
  mask: true, // need mask as a modal mode,
  maskTransitionSpec: {
    initialStyle: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      opacity: 0
    },
    duration: DEFAULT_DURATION,
    props: [{
      property: 'opacity',
      inputRange: [1, 0],
      outputRange: [0, 0.25]
    }]
  },
  transitionSpec: {
    initialStyle: {
      transform: `translateX(${FULL_WIDTH}rem)`
    },
    duration: DEFAULT_DURATION,
    props: [
      {
        property: 'transform.translateX',
        inputRange: [0, 1],
        outputRange: [FULL_WIDTH, 0]
      }]
  },
  prevTransitionSpec: {
    initialStyle: {
      transform: `translateX(-${PREV_VIEW_RATIO * FULL_WIDTH}rem)`
    },
    duration: DEFAULT_DURATION,
    props: [
      {
        property: 'transform.translateX',
        inputRange: [1, 0],
        outputRange: [0, -PREV_VIEW_RATIO * FULL_WIDTH]
      }
    ]
  }
};


export {
  HORIZONTAL_PUSH
};