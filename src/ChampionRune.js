import React from 'react';
import Formatter from './Formatter';
import MarkerRune from './MarkerRune';
import factionConfig from './config/factions.json';
import greatHallConfig from './config/great_hall.json';
import Numberer from './Numberer';

/**
 * Shows the 'rune' for a champion (image + title)
 * In the future, can be 'decorated' with affinity, stars, level, etc.
 * 
 * props:
 * champion
 */
class ChampionRune extends React.Component {
  constructor(props) {
    super(props);
    // cache the mapping from affinity to info.
    // this is stored in the 'rows' attribute of the great hall config
    this.affinityToSpec = {};
    greatHallConfig.rows.forEach((rowSpec) => {
      this.affinityToSpec[rowSpec.key] = rowSpec;
      this.affinityToSpec[rowSpec.key.toLowerCase()] = rowSpec;
    });
    // and from faction key to faction spec
    this.factionSpecMap = {};
    factionConfig.factions.forEach((factionSpec) => {
      this.factionSpecMap[factionSpec.key] = factionSpec;
    });
  }
  twoDigits(level) {
    if (!level) return level;
    if (level < 10) return " " + level;
    return level;

  }

  maybeMarker(marker, label) {
    if (!marker || marker.toLowerCase() === "none") return null;
    return <MarkerRune marker={marker} moreClassName="floats_above" />


  }

  onError(evt, tryNum, imgUrl) {
    //console.log("tryNum = " + tryNum);
    // don't infinite loop.
    // 0 --> 1 replace https with http
    // 1 --> 2, try 'unknown' image.
    // after 1, stop
    switch (tryNum) {
      case 0:
        var newUrl = imgUrl.replace("https", "http");
        if (newUrl !== imgUrl) {
          evt.target.src = newUrl;
        }
        break;
      case 1:
        evt.target.src = process.env.PUBLIC_URL + "pix/champions/Unknown.png";
        break;
      default:
        break;
    }
    return tryNum + 1;
  }

  render() {
    const UNICODE_STAR = "\u2605";
    var champion = this.props.champion;
    var formatter = new Formatter();
    var numberer = new Numberer();
    if (!champion || !champion.name) return null;
    // the affinity
    var affinitySpec = this.affinityToSpec[(champion.element || "").toLowerCase()]
    var label = champion.name + ": " + champion.rarity;
    var stars = numberer.RankFromStars(champion.grade || "");
    var starTxt = stars + UNICODE_STAR;
    label += " " + starTxt;

    label += " level " + champion.level;
    label += " " + affinitySpec.label;
    var faction = this.factionSpecMap[champion.fraction];
    if (faction) {
      label += " " + faction.label;
    }
    label += " champion";
    var imgName = champion.name.replace(/ /g, "_");
    var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    var tryNum = 0;

    return (<div className="container">
      <img className="champion_avatar_small" rarity={champion.rarity} alt={label} title={label} src={imgUrl}
        onError={(e) => tryNum = this.onError(e, tryNum, imgUrl)} />
      <div className="floats_above champion_stars_overlay">{starTxt}</div>
      {faction ? formatter.Image(faction.icon, label, { 'className': 'floats_above champion_faction_overlay' }) : null}
      {this.maybeMarker(champion.marker, label)}
      {formatter.Image(affinitySpec.icon, label,
        { 'className': 'floats_above champion_affinity_overlay' })}
      <div className="floats_above champion_level_overlay"><span>{this.twoDigits(champion.level)}</span></div>

    </div>);

  }
}

export default ChampionRune;