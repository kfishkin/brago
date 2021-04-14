import React from 'react';
import Formatter from './Formatter';
import Numberer from './Numberer';

/**
 * Floats atop most of the time, shows the current champs,
 * and other generally useful info.
 * 
 * props:
 *   curChamp - current champion.
 *   fileName  - current file name
 */
class HeaderDetail extends React.Component {
  render() {
    // looks like you can only fit one line.
    var champ = this.props.curChamp;
    var formatter = new Formatter();
    var numberer = new Numberer();
    var parts = [];
    if (this.props.fileName) {
      parts.push(<span key="0">file <b>{this.props.fileName}</b>:&nbsp;</span>);
    }

    if (champ) {
      parts.push(<span key="0.5">Looking at ....</span>);
      parts.push(<span key="1">{champ.rarity}</span>);
      parts.push(<span key="2"> {champ.element}</span>);
      parts.push(<span key="3"> {numberer.RankFromStars(champ.grade)} *</span>);
      parts.push(formatter.Faction(champ.fraction));
      parts.push(<span key="4">  <b>{champ.name}</b></span>);
    }
    var champLine = <div className="header_detail">{parts}</div>;
    return champLine;
  }
}

export default HeaderDetail;