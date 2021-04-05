import React from 'react';
import Formatter from './Formatter';
import artifactTypeConfig from './config/artifact_types.json';
import Numberer from './Numberer';

/**
 * 'top line summary' of an artifact.
 * props:
 *   artifact: the artifact to render
 */
class ArtifactOneLiner extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.numberer = new Numberer();
    // keep a map from artifact type to data
    this.artifactTypeMap = {};
    artifactTypeConfig.artifact_types.forEach((typeSpec) => {
      this.artifactTypeMap[typeSpec.key.toLowerCase()] = typeSpec;
    });

  }
  render() {
    var artifact = this.props.artifact;
    var typeSpec = this.artifactTypeMap[artifact.kind.toLowerCase()];
    var parts = [];
    // the type and the rarity can go together in the image:
    var msg = artifact.rarity + " " + typeSpec.label;
    var img = this.formatter.Image(typeSpec.icon, msg, { "className": "artifact_icon", "rarity": artifact.rarity });
    parts.push(<span key="1">
      {img}
    </span>);
    // rank
    parts.push(<span key="2">{this.numberer.Rank(artifact.rank)}*</span>);
    // if not an accessory, its set.
    if (!typeSpec.isAccessory && (artifact.setKind !== "None")) {
      parts.push(<span key="3"> <i>{this.formatter.SetName(artifact.setKind)}</i></span>);
    }
    if (artifact.level > 0) {
      parts.push(<span key="4"> Level {artifact.level}: </span>);
    }
    if (artifact.primaryBonus) {
      parts.push(<span key="5"> {this.formatter.Bonus(artifact.primaryBonus)}</span>)
    }
    return <span>{parts}</span>
  }
}

export default ArtifactOneLiner;