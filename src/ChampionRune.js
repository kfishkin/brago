import React from 'react';
import Formatter from './Formatter';
import MarkerRune from './MarkerRune';
import factionConfig from './config/factions.json';
import greatHallConfig from './config/great_hall.json';
import raritiesConfig from './config/rarities.json';
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
    this.rarityMap = {};
    raritiesConfig.rarities.forEach((spec) => {
      this.rarityMap[spec.key] = spec;
    });
  }
  twoDigits(level) {
    if (!level) return level;
    if (level < 10) return " " + level;
    return level;

  }

  maybeRarity(rarity, label) {
    if (!rarity || !this.rarityMap[rarity.toLowerCase()]) return null;
    var spec = this.rarityMap[rarity.toLowerCase()];
    if (!spec || !spec.surround) return null;
    return (
      <img className="floats_above surround" src={spec.surround} label={label} alt={label} />
    )

  }

  maybeMarker(marker, label) {
    if (!marker || marker.toLowerCase() === "none") return null;
    return <MarkerRune marker={marker} moreClassName="floats_above" />
  }

  maybeVault(inStorage, label) {
    if (!inStorage) return null;
    var formatter = new Formatter();
    return formatter.Image("pix/misc/vault.png", label, { 'className': 'floats_above vault_icon' });
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
        evt.target.src = "https://raw.githubusercontent.com/raidchamps/static-data/main/images/avatar/1default/image.png";
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
    var inStorage = ('inStorage' in champion) ? champion.inStorage : false;
    if (inStorage) {
      label += " (vault)"
    }
    //var imgName = champion.name.replace(/ /g, "_");
    //var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    //var imgName = champion.name.replace(/ /g, "-").toLowerCase();
    //var imgUrl = "https://raw.githubusercontent.com/raidchamps/static-data/main/images/avatar/" + imgName + "/image.png";
    //var tryNum = 0;
    var folderName = champion.name.replace(/ /g, "-").toLowerCase();

    //var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    var imgUrl = "https://raw.githubusercontent.com/raidchamps/static-data/main/images/avatar/" + folderName + "/image.png";
    var unknownUrl = "https://raw.githubusercontent.com/raidchamps/static-data/main/images/avatar/1default/image.png";

    //       <img className="floats_above champion_avatar_small" rarity={champion.rarity} alt={label} title={label} src={imgUrl}
    // onError={(e) => tryNum = this.onError(e, tryNum, imgUrl)} />
    return (<div className="container">
      {this.maybeRarity(champion.rarity, label)}
      <picture className="floats_above champion_avatar_small" rarity={champion.rarity} alt={label} title={label}>
        <source srcSet={imgUrl} />
        <img src={unknownUrl} className="floats_above champion_avatar_small"
          alt={"picture of " + champion.name} />
      </picture>
      <div className="floats_above champion_stars_overlay">{starTxt}</div>
      {faction ? formatter.Image(faction.icon, label, { 'className': 'floats_above champion_faction_overlay' }) : null}
      {this.maybeMarker(champion.marker, label)}
      {formatter.Image(affinitySpec.icon, label,
        { 'className': 'floats_above champion_affinity_overlay' })}
      {this.maybeVault(inStorage, label)}
      <div className="floats_above champion_level_overlay"><span>{this.twoDigits(champion.level)}</span></div>

    </div>);

  }
}

export default ChampionRune;