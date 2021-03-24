import React from 'react';
import Formatter from './Formatter';
import PossibilityCount from './PossibilityCount';
import artifactTypeConfig from './config/artifact_types.json';
import ArtifactOneLiner from './ArtifactOneLiner';

/**
 * Shows the number of possiblities, summarized.
 * 
 * props:
 * filteredArtifactsByKind
 * curChamp
 * artifactsById
 * lockedSlots - hash, keys are gear slots that are locked.
 * reporter - f(slotKey), call to flip locked status on that slot.
 */
class LockComponent extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
  }

  onClick(slot) {
    console.log('you clicked on slot ' + slot);
    if (this.props.reporter) {
      this.props.reporter(slot);
    }
  }

  renderLockUI() {
    var ownedByKind = {};
    if (this.props.curChamp && this.props.curChamp.artifacts) {
      this.props.curChamp.artifacts.forEach((id) => {
        if (id in this.props.artifactsById) {
          var artifactObj = this.props.artifactsById[id];
          ownedByKind[artifactObj.kind.toLowerCase()] = artifactObj;
        }
      });
    }

    var list = [];
    artifactTypeConfig.artifact_types.forEach((typeSpec, index) => {
      var key = typeSpec.key.toLowerCase();
      var artifact = ownedByKind[key];
      var isLocked = this.props.lockedSlots && (key in this.props.lockedSlots);
      var body = artifact ? <ArtifactOneLiner artifact={artifact} /> : <span>{typeSpec.label}:  -----</span>
      list.push(<div status={isLocked ? "locked" : "unlocked"} onClick={(e) => this.onClick(key)} key={key}>{body}</div>);
    });
    return <div className="lock_list">{list}</div>
  }


  render() {
    var intro = <p>Which pieces of gear do you wish to 'lock'?
    If gear is <span status="locked">locked</span>, then the optimizer won't look for other options
       for that slot. This can speed things <i>way</i> up, for example
       consider locking your jewelry while optimizing armor, and vice-versa.</p>;
    return (<div>
      <PossibilityCount filteredArtifactsByKind={this.props.filteredArtifactsByKind} />
      <hr />
      {intro}
      {this.renderLockUI()}
    </div>);
  }
}

export default LockComponent;