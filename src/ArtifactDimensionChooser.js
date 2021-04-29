import React from 'react';
import Formatter from './Formatter';
import { Select } from 'antd';

const { Option } = Select;

/**
 * a single widget letting you choose a particular dimension of
 * an artifact to sort on.
 * 
 * props: 
 *   initialValue - the initial value
 *   reporter - called on a new value
 *   labels - optional, if specified gives the labels.
 */
class ArtifactDimensionChooser extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.defaultLabels = [
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
    var labels = this.props.labels;
    if (!labels) {
      labels = this.defaultLabels;
    }
    labels.forEach((label, index) => {
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