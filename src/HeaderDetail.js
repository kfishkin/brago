import React from 'react';
import Formatter from './Formatter';
import Numberer from './Numberer';

/**
 * Floats atop most of the time, shows the current champs,
 * and other generally useful info.
 * 
 * props:
 *   curChamp - current champion.
 */
class HeaderDetail extends React.Component {
  render() {
    // looks like you can only fit one line.
    var champ = this.props.curChamp;
    var formatter = new Formatter();
    var numberer = new Numberer();
    if (!champ) {
      return null;
    }
    var parts = [];
    parts.push(<span key="1">{champ.rarity}</span>);
    parts.push(<span key="2"> {champ.element}</span>);
    parts.push(<span key="3"> {numberer.RankFromStars(champ.grade)} *</span>);
    parts.push(formatter.Faction(champ.fraction));
    parts.push(<span key="4">  <b>{champ.name}</b></span>);
    var champLine = <div className="header_detail">Looking at ....{parts}</div>;
    return champLine;
  }
}

export default HeaderDetail;