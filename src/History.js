import {isWeex} from 'universal-env';
import {createBrowserHistory, createMemoryHistory, createHashHistory} from 'history';
import assign from 'object-assign';
import {setItem, getItem} from './Util';
import _ from 'simple-lodash';


let globalHistory = null;
let globalKey;

function getInitialPath(options = {}) {
  options = {...{mode: 'hash'}, ...options};
  return (options && options.mode === 'hash' ? location.hash.replace(/^#/, '') : location.pathname) || '/';
}

class History {
  records = [];

  index = 0;

  get location() {
    return this.history.location;
  }

  constructor(options = {}) {
    options = this.options = {...{mode: 'hash'}, ...options};
    let initialPath = getInitialPath(options);
    options = assign({initialEntries: [initialPath]}, options);
    let history = this.history = isWeex ? createMemoryHistory(options) : options && options.mode === 'hash' ? createHashHistory(options) : createBrowserHistory(options);
    let location = history.location;
    globalKey = location.key;

    let records = getItem('records');
    let currentPath = getItem('currentPath');
    let path = location.pathname + location.search;

    if (records && records.length > 0) {
      this.records = records;
      if (currentPath != path) {
        // check records from session
        this.currentPath = path;
        this.records = [this.currentPath];
        this.index = 0;
        setItem('records', this.records);
        setItem('currentPath', this.currentPath);
      } else {
        this.currentPath = currentPath;
        this.index = _.findIndex(records, (o) => {
          return o === currentPath;
        });
      }
    } else {
      this.addRecord(location);
      this.index = 0;
    }

    history.listen(this.onHistoryChange);
  }


  push = (path, options) => {
    return this.history.push(path, options);
  }

  replace = (path, options) => {
    return this.history.replace(path, options);
  }


  goForward = () => {
    return this.history.goForward();
  }


  goBack() {
    if (isWeex) {
      if (this.index === 0) {
        const weexNavigator = window.require('@weex-module/navigator');
        weexNavigator.pop();
      } else {
        this.history.goBack();
      }
    } else {
      if (this.index === 0) {
        return;
      } else {
        this.history.goBack();
      }
    }
  }

  go(n) {
    return this.history.go(n);
  }

  addRecord(location) {
    let path = location.pathname + location.search;
    this.records.push(path);
    this.currentPath = path;
    setItem('records', this.records);
    setItem('currentPath', this.currentPath);
  }

  resetRecord() {
    this.records.splice(this.index);
  }

  listen(handler) {
    this.handler = handler;
  }

  onHistoryChange = (location, action) => {
    let direction;
    switch (action) {
      case 'POP':
        let prevIndex = _.findIndex(this.records, (o) => o === this.currentPath);
        let curIndex = _.findIndex(this.records, (o) => o === location.pathname + location.search);

        if (prevIndex >= 0 && curIndex >= 0) {
          if (prevIndex > curIndex) {
            direction = 'BACKWARD';
            this.index--;
          } else {
            direction = 'FORWARD';
            this.index++;
          }
        }
        this.currentPath = location.pathname + location.search;
        setItem('currentPath', this.currentPath);
        break;
      case 'PUSH':
        this.index++;
        this.resetRecord();
        this.addRecord(location);
        break;
      case 'REPLACE':
        this.resetRecord();
        this.addRecord(location);
        break;
    }

    if (this.handler) {
      this.handler(location, action, direction);
    }
  }
}


function createHistory(options) {
  globalHistory = globalHistory || new History(options);
  return globalHistory;
}


function handleBack() {
  globalHistory.goBack();
}

export {createHistory, handleBack, getInitialPath};
