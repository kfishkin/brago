import React from 'react';
import Formatter from './Formatter';
import Numberer from './Numberer';
import { Select } from 'antd';

const { Option } = Select;

// must start at 0, and go up by 1
export const DIMENSION_NONE = 0;
export const DIMENSION_RANK = 1;
export const DIMENSION_RARITY = 2;
export const DIMENSION_LEVEL = 3;
export const DIMENSION_SLOT = 4;
export const DIMENSION_SETKIND = 5;
export const DIMENSION_FACTION = 6;
export const DIMENSION_MAIN_STAT = 7;

/**
 * a single widget letting you choose a particular dimension of
 * an artifact to sort on.
 * 
 * props: 
 *   initialValue - the initial value
 *   reporter - called on a new value
 */
class ArtifactDimensionChooser extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.numberer = new Numberer();
    this.labels = [
      "None",
      "Rank",
      "Rarity",
      "Level",
      "Slot",
      "Set",
      "Faction",
      "Primary Stat"
    ]
  }

  onSelect(value) {
    if (this.props.reporter) {
      this.props.reporter(value);
    }
    return false;
  }
  render() {
    var options = [];
    this.labels.forEach((label, index) => {
      options.push(<Option key={index} value={index}>{label}</Option>);
    });
    // stop propagation to keep clicking from changing the sort order.
    return (
      <span>
        Sort on:&nbsp;
        <Select onClick={(e) => {
          e.stopPropagation();
        }} value={this.props.initialValue} style={{ width: 150 }} onSelect={(value) => this.onSelect(value)}>
          {options}
        </Select>
      </span>
    )
  }
}

export default ArtifactDimensionChooser;