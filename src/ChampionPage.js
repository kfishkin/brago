import React from 'react';
import Comparer from './Comparer';
import Formatter from './Formatter';
import Numberer from './Numberer';
import { Col, Row, Switch, Table, Tooltip } from 'antd';
import ChampionRune from './ChampionRune';
import MarkerRune from './MarkerRune';
import artifactTypeConfig from './config/artifact_types.json';

class ChampionPage extends React.Component {
  constructor(props) {
    super(props);
    // all the checkers for what to display.
    // a checker is a function that takes a champion JSON blob,
    // and returns a string indicating why to display it - null if not.
    var checkers = [];
    var id = 0;
    checkers.push({ id: id++, label: "In the vault", fn: this.CheckInVault });
    checkers.push({ id: id++, label: "NOT in the vault", fn: this.CheckNotInVault });
    checkers.push({ id: id++, label: "has a marker", fn: this.CheckHasMarker });
    checkers.push({ id: id++, label: "has a dupe", fn: this.CheckHasDupe });
    checkers.push({
      id: id++, label: "under-ascended",
      ttip: "fewer ascensions than rank, rank >= 5", fn: this.CheckUnderAscended
    });
    checkers.push({
      id: id++, label: "missing armor",
      ttip: "empty armor slot, rank >= 4", fn: this.CheckMissingArmor
    });
    checkers.push({
      id: id++, label: "inferior gear",
      ttip: "gear 2 or more stars below the champion", fn: this.CheckInferiorGear
    });
    checkers.push({
      id: id++, label: "missing accessory",
      ttip: "fillable accessory slot", fn: this.CheckMissingAccessory
    });


    var checkedByCheckerId = {};
    checkers.forEach((checker) => {
      var v = (checker.fn === this.CheckNotInVault);
      checkedByCheckerId[checker.id] = v;
    });
    this.state = {
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId
    }
  }
  // these guys can't refer to 'this', so extra state is passed
  // in 2nd param.
  CheckInVault(champion) {
    return (champion && champion.inStorage) ? "in the vault" : null;
  }
  CheckNotInVault(champion) {
    return (champion && !champion.inStorage) ? "NOT in the vault" : null;
  }
  CheckHasMarker(champion) {
    return (champion && champion.marker && champion.marker.toLowerCase() !== "none") ? ("marker: " + champion.marker) : null;
  }
  CheckHasDupe(champion, extra) {
    if (!champion || !champion.name) return null;
    var key = champion.name.toLowerCase();
    var championCounts = extra.championCounts;
    var count = (key in championCounts) ? championCounts[key] : 0;
    return (count > 1) ? ("one of " + count) : null;
  }
  CheckUnderAscended(champion) {
    if (!champion || !champion.grade) return null;
    var numberer = new Numberer();
    var rank = numberer.RankFromStars(champion.grade);
    var ascensions = champion.awakenLevel;
    return (rank >= 5) && (rank > ascensions) ?
      ("Rank " + rank + ", but only " + ascensions + " ascensions") : null;
  }
  CheckMissingArmor(champion, extra) {
    if (!champion || !champion.grade) return null;
    var numberer = new Numberer();
    var rank = numberer.RankFromStars(champion.grade);
    if (rank <= 4) return null;
    var numWorn = 0;
    var artifacts = extra.artifacts;
    if (artifacts) {
      artifacts.forEach((artifact) => {
        if (artifact && artifact.setKind && artifact.setKind !== "None") {
          numWorn++;
        }
      });
    }
    if (numWorn < 6) {
      var why = "only wearing " + numWorn + " pieces of armor";
      //console.log(champion.name + why);
      return why;
    }
    return null;
  }
  CheckMissingAccessory(champion, extra) {
    if (!champion || !champion.grade || !champion.awakenLevel) return null;
    var numberer = new Numberer();
    var rank = numberer.RankFromStars(champion.grade);
    var artifacts = extra.artifacts;
    var artifactTypeMap = extra.artifactTypeMap;
    if (!artifactTypeMap) return null;
    // foreach artifact type - if their rank qualifies,
    // and their ascensions qualify, then check and see if it's worn:
    // this is O(n**2), but *n* is so small it doesn't matter.
    var why = null;
    for (let key in artifactTypeMap) {
      var artifactType = artifactTypeMap[key];
      if (!artifactType.isAccessory) continue;
      if (artifactType.rankNeeded > rank) {
        //console.log(champion.name + ', only rank ' + rank + ': no ' + artifactType.label);
        continue;
      }
      if (artifactType.ascensionsNeeded > champion.awakenLevel) continue;
      // they could be wearing it - are they?
      var wearing = false;
      var lcKey = key.toLowerCase();
      for (let i in artifacts) {
        var artifact = artifacts[i];
        if (artifact.kind && artifact.kind.toLowerCase() === lcKey) {
          wearing = true;
          break;
        }
      };
      if (!wearing) {
        why = "not wearing a " + artifactType.label;
        break;
      }
    };
    return why;
  }

  CheckInferiorGear(champion, extra) {
    if (!champion || !champion.grade) return null;
    var numberer = new Numberer();
    var rank = numberer.RankFromStars(champion.grade);
    var artifacts = extra.artifacts;
    if (!artifacts) return null;
    var why = null;
    artifacts.some((artifact) => {
      var artRank = numberer.Rank(artifact.rank);
      if (rank - artRank >= 2) {
        var artifactTypeMap = extra.artifactTypeMap;
        var label = artifactTypeMap[artifact.kind.toLowerCase()].label;
        why = "rank " + rank + ", but wearing a rank " + artRank + " " + label;
        return true;
      }
      return false;
    });
    return why;
  }

  renderWornArtifacts(artifacts) {
    var formatter = new Formatter();
    if (!artifacts || artifacts.length === 0) {
      return null;
    }
    var pieces = [];
    artifacts.forEach((artifact, index) => {
      //console.log('artifact = ' + JSON.stringify(artifact));
      pieces.push(<li key={artifact.id}>{formatter.ArtifactShort(artifact)}</li>);
    });
    return (<ul>{pieces}</ul>);
  }
  onFilterChange(newState, checker) {
    //console.log("newState = " + newState + ", checker id = " + checker.id);
    var cur = this.state.checkedByCheckerId;
    cur[checker.id] = newState;
    this.setState({ checkedByCheckerId: cur });
  }

  checkerHtmlLabel(checker) {
    var text = checker.label ? checker.label : checker.id;
    return checker.ttip ?
      (<Tooltip title={checker.ttip}>{text}</Tooltip>)
      : text;
  }

  renderSelectorPart() {
    var rows = [];
    var curCols = [];
    const BOXES_PER_ROW = 3; // needs to divide into 24
    var span = 24 / BOXES_PER_ROW;
    this.state.checkers.forEach((checker, index) => {
      if ((index % BOXES_PER_ROW) === 0) {
        // end current row, start a new one.
        if (curCols.length > 0) {
          rows.push(<Row>{curCols}</Row>);
        }
        curCols = [];
      }
      var cur = this.state.checkedByCheckerId[checker.id];
      curCols.push(<Col className="gutter-row" span={span}>
        <div><Switch size="small" checked={cur} onChange={(checked, e) => { this.onFilterChange(checked, checker) }}></Switch>&nbsp;
          {this.checkerHtmlLabel(checker)}</div>
      </Col>)
    });
    if (curCols.length > 0) {
      rows.push(<Row>{curCols}</Row>);
    }

    const divStyle = { "textAlign": "left" };
    return (<div style={divStyle}>
      <p><b>Show champions that pass <i>all</i> these checks:</b></p>
      <hr />
      { rows}
      <hr />
    </div >);
  }

  render() {
    var formatter = new Formatter();
    var numberer = new Numberer();
    var comparer = new Comparer();
    if (!this.props.champions || this.props.champions.length === 0) {
      return (<div><span>No champions to show</span></div>);
    }

    const columns = [
      {
        title: 'Who',
        dataIndex: 'champion',
        key: 'champion',
        render: (champion) => <ChampionRune champion={champion} />,
        sorter: (a, b) => comparer.Champions(a.champion, b.champion),
      },
      {
        title: 'Marker',
        dataIndex: 'marker',
        key: 'marker',
        render: (markerKey) => <MarkerRune marker={markerKey} />,
        sorter: (a, b) => comparer.Marker(a.marker, b.marker)
      },
      {
        title: 'Faction',
        dataIndex: 'faction',
        key: 'faction',
        render: (factionKey) => formatter.Faction(factionKey),
        sorter: (a, b) => {
          var aFaction = a.faction ? a.faction : "";
          var bFaction = b.faction ? b.faction : "";
          return aFaction.localeCompare(bFaction);
        }
      },
      {
        title: 'Rank',
        dataIndex: 'grade',
        key: 'grade',
        sorter: (a, b) => a.grade - b.grade,
      },
      {
        title: 'Ascensions',
        dataIndex: 'awakenLevel',
        key: 'awakenLevel',
        sorter: (a, b) => a.champion.awakenLevel - b.champion.awakenLevel,
      },
      {
        title: 'Affinity',
        dataIndex: 'element',
        key: 'element',
        sorter: (a, b) => a.element.localeCompare(b.element)
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        sorter: (a, b) => a.level - b.level,
      },
      {
        title: 'In Vault?',
        dataIndex: 'inStorage',
        key: 'inStorage',
        sorter: (a, b) => a.inStorage - b.inStorage,
        render: (inStorage) => (inStorage ? "YES" : "NO")
      },
      /*
      {
        title: 'Artifacts',
        dataIndex: 'artifacts',
        key: 'artifacts',
        render: (artifacts) => this.renderWornArtifacts(artifacts),
      },
      */
      {
        title: 'Why',
        dataIndex: 'why',
        key: 'why'
      }
    ];
    const dataByRows = [
    ];

    // the checkers all work on 1 champion at a time.
    // that doesn't work to find dupes. Kludge it by computing
    // that in advance and remembering it, and then pass
    // to every checker.
    var championCounts = {};
    this.props.champions.some((champion) => {
      if (!champion.name) return false;
      var key = champion.name.toLowerCase();
      var v = (key in championCounts) ? championCounts[key] : 0;
      championCounts[key] = v + 1;
      return false;
    });
    // same deal with the artifact types:
    // keep a map from artifact type to data
    var artifactTypeMap = {};
    artifactTypeConfig.artifact_types.forEach((typeSpec) => {
      artifactTypeMap[typeSpec.key.toLowerCase()] = typeSpec;
    });

    this.props.champions.forEach((champion) => {
      var artifacts = [];
      if ('artifacts' in champion) {
        champion.artifacts.forEach((artifactId) => {
          if (artifactId in this.props.artifactsById) {
            artifacts.push(this.props.artifactsById[artifactId]);
          } else {
            artifacts.push("[" + artifactId + "]");
          }
        });
      }
      var passesAll = true;
      var extra = {};
      extra.artifacts = artifacts;
      extra.championCounts = championCounts;
      extra.artifactTypeMap = artifactTypeMap;
      var lastWhy = null;
      this.state.checkers.some((checker) => {
        if (this.state.checkedByCheckerId[checker.id]) {
          var why = checker.fn(champion, extra);
          if (!why) {
            passesAll = false;
            return true; // end the loop
          } else {
            lastWhy = why;
          }
        }
        return false; // keep going
      });
      if (passesAll) {
        var rowData = {
          key: champion.id,
          id: champion.id,
          // sometimes we get champions with no name, odd.
          // I think is for new champions.
          champion: champion,
          faction: champion.fraction,
          grade: numberer.RankFromStars(champion.grade),
          element: champion.element,
          level: champion.level,
          inStorage: champion.inStorage,
          artifacts: artifacts,
          marker: champion.marker,
          awakenLevel: champion.awakenLevel,
          why: lastWhy
        };
        dataByRows.push(rowData);
      }
    });

    const paginationConfig = false;
    return (
      <div>
        <h3>There are {dataByRows.length} Champions.</h3>
        {this.renderSelectorPart()}
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div >
    );
  }
}

export default ChampionPage;