import React from 'react';
import Formatter from './Formatter';
import artifactSetsConfig from './config/artifact_sets.json';
import artifactTypeConfig from './config/artifact_types.json';
import factionConfig from './config/factions.json';
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
    // and from faction key to faction spec
    this.factionSpecMap = {};
    factionConfig.factions.forEach((factionSpec) => {
      this.factionSpecMap[factionSpec.key] = factionSpec;
    });

  }
  render() {
    var artifact = this.props.artifact;
    var typeSpec = this.artifactTypeMap[artifact.kind.toLowerCase()];
    // the type and the rarity can go together in the image:
    var msg = artifact.rarity + " " + typeSpec.label;
    const UNICODE_STAR = "\u2605";
    var starsText = this.numberer.Rank(artifact.rank) + UNICODE_STAR;
    const STAR_IMAGE_SRC = "https://github.com/PatPat1567/RaidShadowLegendsData/blob/master/images/Misc/regular_star.png?raw=true";
    var starsImg = [<span key="0">{this.numberer.Rank(artifact.rank)}</span>, <img key="1" className="artifact_star" src={STAR_IMAGE_SRC} alt={starsText} title={starsText} />];
    msg = starsText + " " + msg;
    // then a container div wrapping the image and stuff atop it
    var containerDiv;
    // the base image
    var baseImg = this.formatter.Image(typeSpec.icon, msg, { "className": "artifact_icon", "rarity": artifact.rarity });
    // the 'meatball' denoting the artifact set.
    var meatball = null;
    if (artifact.setKind && artifact.setKind !== "None") {
      var spec = this.setSpecMap[artifact.setKind];
      if (spec === null) {
        //console.log('no spec for kind ' + artifact.setKind);
      }
      if (spec != null) {
        msg = msg + " of " + spec.label;
        if (spec.piece_icon_base) { // there is an icon for this piece, including the 'meatball' (the armor set)
          baseImg = <img src={spec.piece_icon_base + typeSpec.label + ".png"}
            alt={msg} title={msg} className="artifact_icon" rarity={artifact.rarity} />
        } else {
          baseImg = this.formatter.Image(typeSpec.icon, msg, { "className": "artifact_icon", "rarity": artifact.rarity });
          meatball = this.formatter.Image("pix/armor_sets/" + spec.icon, spec.label,
            { "className": "floats_above meatball" });
        }
      }
    }
    // if it's an accessory, perhaps over-ride:
    if (artifact.setKind === "None" && artifact.requiredFraction) {
      // we need a prefix and a suffix.
      var factionSpec = this.factionSpecMap[artifact.requiredFraction];
      var prefix = factionSpec ? factionSpec.accessory_prefix : null;
      var suffix = typeSpec ? typeSpec.faction_icon_suffix : null;
      if (factionSpec.label) {
        msg = msg + " (" + factionSpec.label + ")";
      }
      if (prefix && suffix) {
        baseImg = <img src={prefix + suffix + ".png"}
          alt={msg} title={msg} className="artifact_icon" rarity={artifact.rarity} />
      }
    }
    var levelText = artifact.level ? ("+" + artifact.level) : "";
    var level = <div className="floats_above level_overlay">{levelText}</div>
    var stars = <div className="floats_above stars_overlay">{starsImg}</div>
    containerDiv = <div className="container">
      {baseImg}
      {stars}
      {level}
      {meatball}
    </div>
    var toRight = artifact.primaryBonus ? (<div className="primary">{this.formatter.Bonus(artifact.primaryBonus, 0)}</div>)
      : <div className="primary" />;
    return <div className="artifact_rune">
      {containerDiv}
      {toRight}
    </div>
  }
}

export default ArtifactRune;