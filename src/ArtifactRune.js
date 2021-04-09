import React from 'react';
import Formatter from './Formatter';
import artifactSetsConfig from './config/artifact_sets.json';
import artifactTypeConfig from './config/artifact_types.json';
import Numberer from './Numberer';

/**
 * 'Rune' showing an artifact
 * props:
 *   artifact: the artifact to render
 */
class ArtifactRune extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.numberer = new Numberer();
    // keep a map from artifact type to data
    this.artifactTypeMap = {};
    artifactTypeConfig.artifact_types.forEach((typeSpec) => {
      this.artifactTypeMap[typeSpec.key.toLowerCase()] = typeSpec;
    });
    // and from set type to set spec
    this.setSpecMap = {};
    artifactSetsConfig.sets.forEach((setSpec) => {
      if (setSpec.jsonKey) this.setSpecMap[setSpec.jsonKey] = setSpec;
      if (setSpec.key) this.setSpecMap[setSpec.key] = setSpec;
    });

  }
  render() {
    var artifact = this.props.artifact;
    var typeSpec = this.artifactTypeMap[artifact.kind.toLowerCase()];
    // the type and the rarity can go together in the image:
    var msg = artifact.rarity + " " + typeSpec.label;
    var starsText = this.numberer.Rank(artifact.rank) + "*";
    msg = starsText + " " + msg;
    // then a container div wrapping the image and stuff atop it
    var containerDiv;
    // the base image
    var baseImg = this.formatter.Image(typeSpec.icon, msg, { "className": "artifact_icon", "rarity": artifact.rarity });
    // the 'meatball' denoting the artifact set.
    var meatball = null;
    if (artifact.setKind && artifact.setKind !== "None") {
      var spec = this.setSpecMap[artifact.setKind];
      if (spec != null) {
        if (spec.piece_icon_base) { // there is an icon for this piece, including the 'meatball' (the armor set)
          msg = msg + " of " + spec.label;
          baseImg = <img src={spec.piece_icon_base + typeSpec.label + ".png"}
            alt={msg} title={msg} className="artifact_icon" rarity={artifact.rarity} />
        } else {
          meatball = this.formatter.Image("pix/armor_sets/" + spec.icon, spec.label,
            { "className": "artifact_card meatball" });
        }
      }
    }
    var levelText = artifact.level ? ("+" + artifact.level) : "";
    var level = <div className="artifact_card level_overlay">{levelText}</div>
    var stars = <div className="artifact_card stars_overlay">{starsText}</div>
    containerDiv = <div className="container">
      {baseImg}
      {stars}
      {level}
      {meatball}
    </div>
    var toRight = artifact.primaryBonus ? (<div className="primary">{this.formatter.Bonus(artifact.primaryBonus)}</div>)
      : <div className="primary" />;
    return <div className="artifact_rune">
      {containerDiv}
      {toRight}
    </div>
    /*
  if (artifact.primaryBonus) {
    parts.push(<span key="5"> {this.formatter.Bonus(artifact.primaryBonus)}</span>)
  }
  return <span>{parts}</span>
  */
  }
}

export default ArtifactRune;