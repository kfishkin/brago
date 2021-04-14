import React from 'react';
import Formatter from './Formatter';
import artifactTypeConfig from './config/artifact_types.json';

/**
 * Shows the 'rune' for a champion (image + title)
 * 
 * props:
 * champion
 */
class ChampionRune extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    var champion = this.props.champion;
    if (!champion || !champion.name) return null;
    var imgName = champion.name.replace(/ /g, "_");
    var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    return <img className="champion_avatar_small" alt={champion.name} title={champion.name} src={imgUrl} />;
  }
}

export default ChampionRune;