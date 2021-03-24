import React from 'react';
import { Menu } from 'antd';
import greatHallConfig from './config/great_hall.json';

// props:
// arenaLevel - object with current arena level
// greatHallData - array of great hall data, empty if none.
// lockedSlots - which types of armor are locked
// eligibleRanks - which ranks are eligible
class NavMenu extends React.Component {
  arenaText(arenaLevel) {
    if (!arenaLevel) {
      return <div>Arena</div>
    }
    return <div status="gtg">Arena: {arenaLevel.label}</div>
  }
  championsText(champions) {
    if (!champions || champions.length === 0) {
      return <div>View Champions</div>
    }
    return <div status="gtg">View {champions.length} Champions</div>
  }
  artifactsText(artifacts) {
    var numSeen = 0;
    if (artifacts && artifacts.length > 0) {
      artifacts.forEach((artifact) => {
        if (artifact.isSeen) {
          numSeen++;
        }
      });
    }
    if (numSeen === 0) {
      return <div>View Artifacts</div>;
    }
    return <div status="gtg">View {numSeen} artifacts</div >
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
        <Menu.Item onClick={() => this.props.handleShowPage('load json')}>Load JSON</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('champions')}>
          {this.championsText(this.props.champions)}
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('artifacts')}>
          {this.artifactsText(this.props.artifacts)}
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('bump artifacts')}>
          Check for artifacts to bump
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('sell artifacts')}>
          Check for artifacts to sell
        </Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('about')}>About</Menu.Item>
        <Menu.Item onClick={() => this.props.handleShowPage('help')}>Help</Menu.Item>
      </Menu >
    );
  }
}

export default NavMenu;