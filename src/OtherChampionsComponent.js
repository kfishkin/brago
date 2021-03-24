import React from 'react';
import { Radio } from 'antd';
import PossibilityCount from './PossibilityCount';
import {
  OTHER_GEAR_UNWORN, OTHER_GEAR_VAULT, OTHER_GEAR_ALL
} from './TopLevel';

/**
 * lets user specify what champs armor can be taken from.
 * 
 * props:
 * champions - array of champions
 * reporter - f(new setting)
 * filteredArtifactsByKind
 * otherChampionGearMode
 */
class OtherChampionsComponent extends React.Component {

  onChange(e) {
    if (this.props.reporter) {
      this.props.reporter(e.target.value);
    }
  }

  renderUI() {
    // give them an idea of how many champs are in the vault.
    var numInVault = 0;
    if (this.props.champions) {
      this.props.champions.forEach((champion) => {
        if (champion && champion.inStorage) numInVault++;
      });
      const radioStyle = {
        display: 'block',
        height: '30px',
        lineHeight: '30px',
      };
      return (<div>
        <p>Which gear can I consider?</p>
        <Radio.Group value={this.props.otherChampionGearMode} onChange={(e) => this.onChange(e)}>
          <Radio style={radioStyle} value={OTHER_GEAR_UNWORN}>Only unworn gear (fastest)</Radio>
          <Radio style={radioStyle} value={OTHER_GEAR_VAULT}>Unworn gear, or gear worn by one of the {numInVault} champions in the vault</Radio>
          <Radio style={radioStyle} value={OTHER_GEAR_ALL}>I can look at all the gear (slowest)</Radio>
        </Radio.Group>
      </div>)
    }
  }

  render() {
    var intro = null;
    if (this.props.otherChampionGearMode && this.props.otherChampionGearMode === OTHER_GEAR_ALL)
      intro = <p className="warning">Consider disallowing at least some worn gear</p>;
    return (<div>
      <PossibilityCount filteredArtifactsByKind={this.props.filteredArtifactsByKind} />
      <hr />
      {intro}
      {this.renderUI()}
    </div>);
  }
}

export default OtherChampionsComponent;