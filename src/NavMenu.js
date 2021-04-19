import React from 'react';
import { Menu } from 'antd';
import greatHallConfig from './config/great_hall.json';
import arenaConfig from './config/arena.json';

// props:
// arenaKey - key into current arena level
// greatHallData - array of great hall data, empty if none.
// lockedSlots - which types of armor are locked
// eligibleRanks - which ranks are eligible
// fileName - last loaded fileName
class NavMenu extends React.Component {
  arenaText(arenaKey) {
    if (!arenaKey) {
      return <div>Arena</div>
    }
    var label = null;
    arenaConfig.levels.some((arenaLevel) => {
      if (arenaLevel.jsonKey === arenaKey) {
        label = arenaLevel.label;
        return true;
      }
      return false;
    });
    return <div status="gtg">Arena: {label}</div>
  }
  championsText(champions) {
    if (!champions || champions.length === 0) {
      return <div>View Champions</div>
    }
    return <div status="gtg">View some Champions</div>
  }
  greatHallText(greatHallData) {
    if (!greatHallData || greatHallData.length === 0) {
      return <div>Great Hall</div>
    }
    var total = 0;
    greatHallData.forEach((entry) => {
      greatHallConfig.columns.forEach((bundle) => {
        var attr = bundle.key; // 'hp', 'atk', etc.
        if (attr in entry) {
          total += entry[attr];
          //console.log('attr ' + attr + ' has value ' + entry[attr]);
        }
      });
    });
    if (total === 0) {
      return <div>Great Hall</div>
    }
    return <div status="gtg">Great Hall: {total} levels</div>
  }
  render() {
    return (
      <Menu theme="light" mode="inline">
        <Menu.Item onClick={() => this.props.handleShowPage('load json')}><span>Load JSON</span></Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('champions')}>
          {this.championsText(this.props.champions)}
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('sell artifacts')}>
          View some artifacts
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('bump artifacts')}>
          Artifacts to bump
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('champion chooser')}>Champion Detail</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('arena')}>{this.arenaText(this.props.arenaKey)}</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('great hall')}>Great Hall</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('about')}>About</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('help')}>Help</Menu.Item>
      </Menu >
    );
  }
}

export default NavMenu;