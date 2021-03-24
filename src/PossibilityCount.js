import React from 'react';
import Formatter from './Formatter';
import artifactTypeConfig from './config/artifact_types.json';

/**
 * Shows the number of possiblities, summarized.
 * 
 * props:
 * filteredArtifactsByKind
 */
class PossibilityCount extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    // keep a map from artifact type to data
    this.artifactTypeMap = {};
    artifactTypeConfig.artifact_types.forEach((typeSpec) => {
      this.artifactTypeMap[typeSpec.key.toLowerCase()] = typeSpec;
    });

  }
  render() {
    var artLine = null;
    if (this.props.filteredArtifactsByKind) {
      var parts = [<span key="eligible">Eligible for consideration:</span>];
      var totalCombinations = 1;
      Object.entries(this.props.filteredArtifactsByKind).forEach((tuple, index) => {
        var gearKey = tuple[0];
        var artifactArray = tuple[1];
        var numArts = artifactArray.length;
        var plural = this.artifactTypeMap[gearKey.toLowerCase()].plural;
        parts.push(<span key={index}>{index === 0 ? '' : ', '}{numArts} {plural}</span>)
        totalCombinations *= (numArts === 0) ? 0 : numArts;
      });
      var tuple = this.formatter.MoreReadableNumber(totalCombinations);
      parts.push(<span key={99}>, a total of <b>{tuple[0]} {tuple[1]}</b> possibilities</span>);
      artLine = <span>{parts}</span>
    } else {
      artLine = <span>Nothing to show yet</span>
    }
    return artLine;
  }
}

export default PossibilityCount;