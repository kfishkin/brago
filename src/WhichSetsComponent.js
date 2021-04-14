import React from 'react';
import { Radio } from 'antd';
import Formatter from './Formatter';
import artifactSetsConfig from './config/artifact_sets.json';
import PossibilityCount from './PossibilityCount';


/**
 * Which armor sets do you want, and how many from them?
 * 
 * props:
 * filteredArtifactsByKind
 * setSpec - map from set key to spec.
 * reporter - f(key, value) on change
 */
class WhichSetsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
  }

  onSetChange(key, value) {
    if (this.props.reporter) {
      this.props.reporter(key, value);
    }
  }

  renderSetUI() {
    var parts = [];

    artifactSetsConfig.sets.some((setConfig) => {
      if (!('jsonKey' in setConfig)) {
        //console.log('no json key for set ' + setConfig.label);
        return false;
      }
      var key = setConfig.jsonKey;
      var label = setConfig.label;
      var icon = 'pix/armor_sets/' + setConfig.icon;
      var setSize = setConfig.set_size;
      var curSetting = (this.props.setSpec && (key in this.props.setSpec))
        ? this.props.setSpec[key] : 'Some';
      parts.push(<div key={key}>
        <Radio.Group value={curSetting} onChange={(e) => this.onSetChange(key, e.target.value)}>
          <Radio value="None">None</Radio>
          <Radio value="Some">Some</Radio>
          <Radio value="Set">Set ({setSize})</Radio>
        </Radio.Group>
        <img src={icon} alt={label} />
        <span>{label}</span>
      </div>)
      return false;
    });
    return <div>{parts}</div>;
  }


  render() {
    var intro = <div><p>Which artifact sets do you want to include, and in what quantity?</p>
      <ul>
        <li key="None"><b>None</b> - don't use any artifacts from this set.</li>
        <li key="Some"><b>Some</b> - use as few or as many as needed</li>
        <li key="Set"><b>Set</b> - have at least a set of these</li>
      </ul>
      <p>(You won't see changes to 'Set' correctly reflected in the 'Eligible for consideration' display, it takes effect later)</p>
    </div>
    return (<div>
      <PossibilityCount filteredArtifactsByKind={this.props.filteredArtifactsByKind} />
      <hr />
      {intro}
      {this.renderSetUI()}
    </div>);
  }
}

export default WhichSetsComponent;