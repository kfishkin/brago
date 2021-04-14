import React from 'react';

/**
 * Shows the 'rune' for a champion (image + title)
 * In the future, can be 'decorated' with affinity, stars, level, etc.
 * 
 * props:
 * champion
 */
class ChampionRune extends React.Component {
  render() {
    var champion = this.props.champion;
    if (!champion || !champion.name) return null;
    var imgName = champion.name.replace(/ /g, "_");
    var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    return <img className="champion_avatar_small" alt={champion.name} title={champion.name} src={imgUrl} />;
  }
}

export default ChampionRune;