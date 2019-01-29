import {createElement, Component} from 'rax';
import renderer from 'rax-test-renderer';
import {StackNavigator} from '../';

describe('StackNavigator', () => {
  it('test typeof StackNavigator', () => {
    expect(typeof StackNavigator).toEqual('function');
  });
});
