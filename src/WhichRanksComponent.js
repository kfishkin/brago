import React from 'react';
import { Checkbox } from 'antd';
import Formatter from './Formatter';
import PossibilityCount from './PossibilityCount';


/**
 * Which armor ranks do you want to consider?
 * 
 * props:
 * filteredArtifactsByKind
 * artifacts
 * eligibleRanks - hash, keys are ranks that are good.
 * reporter - f(rank), call to flip eligibility on that rank.
 */
class WhichRanksComponent extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
  }

  onChange(e, name) {
    if (this.props.reporter) {
      this.props.reporter(name, e.target.checked);
    }
  }

  renderRankUI() {
    var countsByName = {};
    if (!this.props.artifacts) return;
    this.props.artifacts.forEach((artifact) => {
      var rank = artifact.rank;
      if (!(rank in countsByName)) {
        countsByName[rank] = 0;
      }
      countsByName[rank]++;
    });
    const namesInOrder = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
    var parts = [];
    namesInOrder.forEach((name, index) => {
      var count = (name in countsByName) ? countsByName[name] : 0;
      var isChecked = (this.props.eligibleRanks && (name.toLowerCase() in this.props.eligibleRanks));
      parts.push(<li key={index}><Checkbox checked={isChecked} onChange={(e) => this.onChange(e, name)}>Rank {name} ({count})</Checkbox></li>);
    });
    return <ul>{parts}</ul>;
  }


  render() {
    var intro = <p>Which artifact ranks do you want to include?</p>
    return (<div>
      <PossibilityCount filteredArtifactsByKind={this.props.filteredArtifactsByKind} />
      <hr />
      {intro}
      {this.renderRankUI()}
    </div>);
  }
}

export default WhichRanksComponent;