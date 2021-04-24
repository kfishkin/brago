import React from 'react';
import { AutoComplete, Popover, Table } from 'antd'
import arenaConfig from './config/arena.json';
import BonusList from './BonusList';
import Formatter from './Formatter';
import Numberer from './Numberer';
import artifactSetConfig from './config/artifact_sets.json';
import artifactTypeConfig from './config/artifact_types.json';
import attributesConfig from './config/attributes.json';
import greatHallConfig from './config/great_hall.json';
import markersConfig from './config/markers.json';
import masteriesConfig from './config/masteries.json';
import ArtifactRune from './ArtifactRune';
import MarkerRune from './MarkerRune';
import TotalStatsCalculator,
{
  ARENA_COLUMN, BASE_COLUMN, GREAT_HALL_COLUMN, TOTALS_COLUMN,
  MASTERIES_COLUMN, AMPLIFY_BONUS, ARTIFACTS_COLUMN
} from './TotalStatsCalculator';
import { Row, Col } from 'antd';

// props:
// champions - array of champions
// artifactsById - hash of artifacts indexed by id
// reporter - f(champion), call when chosen
// curChamp - current champion, if any
// arenaKey - key into arena data.
// greatHallLevels - values from great hall
class ChampionDetailPage extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.numberer = new Numberer();
    // load and store a map from attribute:level
    // to what it's bonuses are.
    this.greatHallBonusMap = {}
    greatHallConfig.columns.forEach((configCol) => {
      var key = configCol.key;
      configCol.bonuses.forEach((bonusEntry) => {
        var level = bonusEntry.level;
        var bonus = {
          'kind': key,
          'isAbsolute': bonusEntry.isAbsolute,
          'value': bonusEntry.value
        };
        this.greatHallBonusMap[key + ":" + level] = bonus;
      });
    });
    // map from attribute json to my key
    this.attributesByJsonKey = {};
    attributesConfig.attributes.forEach((attrSpec) => {
      this.attributesByJsonKey[attrSpec.jsonKey.toLowerCase()] = attrSpec;
    });
    // map from artifact key to structure
    this.artifactTypesByKey = {};
    artifactTypeConfig.artifact_types.forEach((typeSpec) => {
      this.artifactTypesByKey[typeSpec.key.toLowerCase()] = typeSpec;
    });
    this.arenaData = {};
    arenaConfig.levels.some((arenaLevel) => {
      if (arenaLevel.jsonKey === this.props.arenaKey) {
        this.arenaData = arenaLevel;
        return true;
      }
      return false;
    });
  }

  onSelect(value, option) {
    this.props.reporter(this.props.champions[option.index]);
  }

  markerFromKey(markerKey) {
    if (!markerKey || markerKey === "None") return null;
    var answer = null;
    markersConfig.markers.some((markerSpec) => {
      if (markerSpec.key === markerKey) {
        answer = markerSpec;
        return true;
      }
      return false;
    });
    return answer;
  }

  renderAutoCompleter(champions) {
    var options = [];
    var prompt = this.props.curChamp ? "choose a different champion"
      : "choose a champion"
    if (champions) {
      champions.forEach((champion, index) => {
        // show the marker, if there is one:
        var markerSpec = this.markerFromKey(champion.marker);
        // and add the id to disambiguate if no markers:
        var extra = markerSpec ? markerSpec.label : champion.id;
        options.push({ 'value': champion.name + ' (' + extra + ')', 'key': champion.id, 'index': index });
      });
      return (
        <div>
          <span>{prompt}: </span>
          <AutoComplete
            style={{
              width: 200,
            }}
            options={options}
            placeholder="type champion name"
            onSelect={(value, option) => this.onSelect(value, option)}
            filterOption={(inputValue, option) =>
              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
          />
        </div>
      )
    } else {
      return null;
    }
  }

  /**
   * Computes all the info about which artifact bonuses this champ
   * @param {array} artifacts the array of worn artifact ids.
   * @param {hash} masteryNamesById set of masteries champ has.
   * 
   * returns two hash tables as an array.
   * 0 - the artifact bonuses,
   * keyed by attribute ('hp', 'atk', etc.).
   * Each entry in the hash table is an array of tuples.
   * First entry is the Bonus to apply.
   * Second entry is a string describing the bonus
   * 
   * 1 - the 'amplification' bonuses from a mastery bonus on an artifact set.
   * format is that same as entry 0.
   */
  computeArtifactBonusInfo(artifacts, masteryNamesById) {
    // make a hash table whose key is the armor kind (toxic, cruel, etc.)
    // and whose value is how many of that type have been seen.
    // anything missing has a count of 0.
    var setTypeCounts = {};
    //
    // and an array of the artifact objects.
    var artifactObjects = [];
    var amplificationBonuses = {};
    var bonusesByAttr = {};
    if (!artifacts || artifacts.length === 0) {
      return [bonusesByAttr, amplificationBonuses];
    }
    artifacts.forEach((artifactId) => {
      var obj = this.props.artifactsById[artifactId];
      if (obj) {
        artifactObjects.push(obj);
        if (obj.setKind && !(obj.setKind === "None")) {
          var val = (obj.setKind in setTypeCounts) ? setTypeCounts[obj.setKind] : 0;
          setTypeCounts[obj.setKind] = val + 1;
        }
      }
    });
    //console.log('set type counts = ' + JSON.stringify(setTypeCounts));
    // see if I have any mastery bonuses that amplify a set....
    // hash table, maps from set name to an amplification.
    // each amplification is [amplifying mastery id, bonus]
    var amplifyBonusesBySetName = this.computeAmplificationBonuses(masteryNamesById);
    // go through the armor sets, see if I get their bonuses....
    artifactSetConfig.sets.some((setConfig) => {
      var key1 = setConfig.jsonKey;
      var key2 = setConfig.key;
      if (!(key1 in setTypeCounts) && !(key2 in setTypeCounts)) {
        return false; // keep looking
      }
      var count = (key1 in setTypeCounts) ? setTypeCounts[key1] : setTypeCounts[key2];
      //console.log('key1 = ' + key1 + ', key2 = ' + key2 + ', count = ' + count);
      var times = Math.floor(setConfig.set_size / count);
      for (var i = 0; i < times; i++) {
        //console.log('checking set bonuses for set ' + setConfig.label + ', times = ' + times);
        setConfig.bonuses.forEach((bonus) => {
          var attr = bonus.kind;

          if (key1 in amplifyBonusesBySetName) {
            //console.log('bonus applies to ' + key1 + ':' + JSON.stringify(amplifyBonusesBySetName[key1]));
            var amplification = amplifyBonusesBySetName[key1][1].value * bonus.value;
            //console.log('ampl = ' + amplification + ', isAbs = ' + bonus.isAbsolute);
            var masteryName = masteryNamesById[amplifyBonusesBySetName[key1][0]];
            if (!(attr in amplificationBonuses)) {
              amplificationBonuses[attr] = new BonusList();
            }
            amplificationBonuses[attr].Add(AMPLIFY_BONUS, bonus.isAbsolute, amplification, masteryName + " bonus to " + setConfig.label + " set");
          }
          if (!(attr in bonusesByAttr)) {
            bonusesByAttr[attr] = new BonusList();
          }
          bonusesByAttr[attr].AddBonus(bonus, setConfig.label + " set bonus");
        });
      }
      return false;
    });
    // and then the bonuses from the pieces themselves.
    artifactObjects.forEach((artifact) => {
      if (('primaryBonus' in artifact) && ('kind' in artifact.primaryBonus)) {
        var attr = this.attributesByJsonKey[artifact.primaryBonus.kind.toLowerCase()].key;
        if (!(attr in bonusesByAttr)) {
          bonusesByAttr[attr] = new BonusList();
        }
        //console.log(' primary bonus to ' + attr + ' of ' + JSON.stringify(artifact.primaryBonus));
        bonusesByAttr[attr].AddBonus(artifact.primaryBonus, artifact.kind + ' main stat');
      }
      if (('secondaryBonuses' in artifact) && (artifact.secondaryBonuses.length > 0)) {
        artifact.secondaryBonuses.forEach((secondary) => {
          attr = this.attributesByJsonKey[secondary.kind.toLowerCase()].key;
          if (!(attr in bonusesByAttr)) {
            bonusesByAttr[attr] = new BonusList();
          }
          //console.log(' secondary bonus to ' + attr + ' of ' + JSON.stringify(secondary));
          bonusesByAttr[attr].AddBonus(secondary, this.artifactTypesByKey[artifact.kind.toLowerCase()].label + ' substat');
        });
      }
    });
    return [bonusesByAttr, amplificationBonuses];
  }


  computeAmplificationBonuses(masteryNamesById) {
    var amplifyBonuses = {}
    masteriesConfig.masteries.some((masterySpec) => {
      if (!masteryNamesById)
        return false; // just in case
      if (!(masterySpec.key in masteryNamesById))
        return false;
      // I have this mastery. Does it have an amplification bonus?
      if (!masterySpec.setBonusFor || !masterySpec.bonuses)
        return false;
      // find the amplification bonus.
      var theBonus = null;
      masterySpec.bonuses.some((bonus) => {
        if (bonus && bonus.kind === AMPLIFY_BONUS) {
          theBonus = bonus;
          return true;
        }
        return false;
      });
      if (!theBonus)
        return false;
      // yay, finally:
      masterySpec.setBonusFor.forEach((setName) => {
        var tuple = [masterySpec.key, theBonus];
        amplifyBonuses[setName] = tuple;
      });
      return false;
    });
    return amplifyBonuses;
  }

  masteryNamesById(masteryIds) {
    var all = {};
    masteriesConfig.masteries.forEach((masterySpec) => {
      all[masterySpec.key] = masterySpec.label;

    });
    var masteriesSet = {};
    if (masteryIds) {
      masteryIds.forEach((masteryId) => {
        masteriesSet[masteryId] = all[masteryId];
      })
    }
    return masteriesSet;
  }

  hasDetail(bonusList) {
    if (!bonusList || !bonusList.Bonuses()) return false;
    var list = bonusList.Bonuses();
    if (list.length >= 2) return true;
    return (list[0].why !== null);
  }
  renderTotalStats() {
    var arenaLabel = this.arenaData ? (" (" + this.arenaData.label + ")") : "";

    const columns = [
      {
        title: 'Basic Stats',
        dataIndex: 'base_stats',
        key: 'base_stats'
      },
      {
        title: 'Artifacts',
        dataIndex: 'artifacts',
        key: 'artifacts'
      },
      {
        title: 'Great Hall',
        dataIndex: 'great_hall',
        key: 'great_hall'
      },
      {
        title: 'Classic Arena' + arenaLabel,
        dataIndex: 'arena',
        key: 'arena'
      },
      {
        title: 'Masteries',
        dataIndex: 'masteries',
        key: 'masteries',
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
      }
    ];
    var curChamp = this.props.curChamp;
    const dataByRows = [
    ];
    var calculator = new TotalStatsCalculator();
    var stats = calculator.MakeAndBake(curChamp, this.props.arenaKey, this.props.greatHallLevels, this.props.artifactsById);
    //console.log('stats = ' + JSON.stringify(stats[GREAT_HALL_COLUMN]));

    attributesConfig.attributes.forEach((attrSpec) => {
      var attr = attrSpec.jsonKey;
      var attrKey = attr.toLowerCase();
      var rowData = { key: attr };
      // base stats.
      var base = (stats && stats[BASE_COLUMN] && stats[BASE_COLUMN][attrKey]) ?
        stats[BASE_COLUMN][attrKey].Bonuses()[0].value : 0;
      rowData['base_stats'] =
        attrSpec.label + "  " + base;

      //the interior rows.
      var cols = [ARTIFACTS_COLUMN, MASTERIES_COLUMN, ARENA_COLUMN, GREAT_HALL_COLUMN];
      var rowDataKeys = ['artifacts', 'masteries', 'arena', 'great_hall'];
      for (var i = 0; i < cols.length; i++) {
        var columnKey = cols[i];
        var rowDataKey = rowDataKeys[i];
        var cellBonuses = stats[columnKey][attrKey];
        var toShow = null;
        if (!cellBonuses || !cellBonuses.Bonuses()) {
          //console.log('no artifact bonuses for ' + attr);
          toShow = '';
        } else if (!this.hasDetail(cellBonuses)) {
          //console.log('artifactBonuses[', attr, '] =', JSON.stringify(artifactBonuses.Bonuses()));
          var val = this.numberer.EvaluateBonus(0, cellBonuses.Bonuses()[0]);
          toShow = <span attr={attr}>+{val}</span>;
        } else {
          //console.log('artifactBonuses[', attr, '] =', JSON.stringify(artifactBonuses.Bonuses()));
          var cellTotal = 0;
          var parts = [];
          // eslint-disable-next-line 
          cellBonuses.Bonuses().forEach((bonus, index) => {
            let val = this.numberer.EvaluateBonus(0, bonus);
            cellTotal += val;
            parts.push(<li key={index}>{val} from {bonus.why}</li>);
          });
          var ul = <ul className="bonus_popover">{parts}</ul>
          toShow = <Popover content={ul} focus="hover"><span className="has_popover" attr={attr}>+{cellTotal}</span></Popover >
        }
        rowData[rowDataKey] = toShow;
      }
      var total = (stats && stats[TOTALS_COLUMN] && stats[TOTALS_COLUMN][attrKey]) ?
        stats[TOTALS_COLUMN][attrKey].Bonuses()[0].value : 0;
      rowData['total'] = Math.round(total);

      dataByRows.push(rowData);

    });
    return (<div>
      <hr />
      <Table pagination={false} dataSource={dataByRows} columns={columns} />
    </div>);
  }

  renderArtifact(typeSpec, artifact, cellWidth) {
    if (!artifact) {
      return;
    }
    var parts = [];
    parts.push(<ArtifactRune artifact={artifact} />);
    if (artifact.secondaryBonuses && artifact.secondaryBonuses.length > 0) {
      parts.push(this.formatter.Substats(artifact.secondaryBonuses));
    }
    return <Col span={cellWidth} key={artifact.id}>{parts}</Col>

  }

  renderArtifacts(artifactIds) {
    if (!artifactIds || artifactIds.length === 0) {
      return <span>Isn't wearing any artifacts.</span>
    }
    // map from the _kind_ to the artifact objects.
    var ownedByKind = {};
    var unfoundArtifactIds = [];
    artifactIds.forEach((id) => {
      if (id in this.props.artifactsById) {
        var artifactObj = this.props.artifactsById[id];
        ownedByKind[artifactObj.kind.toLowerCase()] = artifactObj;
      } else {
        unfoundArtifactIds.push(id);
      }
    });
    var parts = [];
    const ARTIFACTS_PER_ROW = 3;
    var cellWidth = 24 / ARTIFACTS_PER_ROW; // 24 from Ant.
    var rowCells = [];
    var rowNum = 0;
    artifactTypeConfig.artifact_types.forEach((typeSpec, index) => {
      var key = typeSpec.key.toLowerCase();
      rowCells.push(this.renderArtifact(typeSpec, ownedByKind[key], cellWidth));
      if (rowCells.length >= ARTIFACTS_PER_ROW) {
        // finish it off.
        parts.push(<Row key={rowNum} gutter="2">{rowCells} </Row>);
        // and start a new one.
        rowCells = [];
        rowNum++;
      }
    });
    if (rowCells.length > 0) {
      // finish it off.
      parts.push(<Row key={rowNum} gutter="2">{rowCells} </Row>);
    }
    if (unfoundArtifactIds.length > 0) {
      parts.push(<span>Unfound artifacts: {JSON.stringify(unfoundArtifactIds)}</span>)
    }

    return <div>{parts}</div>;
  }

  renderMasteries(masteries) {
    if (!masteries || masteries.length === 0) {
      return <span>(no masteries)</span>;
    }
    // display by branch, within that by tier, within that random.
    var masterySpecs = [];
    masteriesConfig.masteries.some((masterySpec) => {
      if (!masterySpec || !masterySpec.key) return false;
      if (masteries.indexOf(masterySpec.key) === -1) return false;
      masterySpecs.push(masterySpec);
      return false;
    });
    masterySpecs.sort((m1, m2) => {
      var delta = m1.branch.localeCompare(m2.branch);
      if (delta !== 0) return delta;
      delta = m1.tier - m2.tier;
      if (delta !== 0) return delta;
      return m1.label.localeCompare(m2.label);
    });

    var elements = [];
    var inBranch = [];
    var prevBranchName = "";
    var formatter = this.formatter;
    masterySpecs.forEach((spec, index) => {
      if (spec.branch !== prevBranchName) {
        if (prevBranchName !== "") {
          elements.push(<li key={index}>
            <b>{prevBranchName}:</b>
            {inBranch}
          </li>);
        }
        inBranch = [];
      }
      prevBranchName = spec.branch;
      inBranch.push(formatter.Image(spec.img, spec.label, { "className": "mastery_icon" }));
    });
    if (inBranch.length > 0) {
      elements.push(<li key={masterySpecs.length}>
        <b>{prevBranchName}:</b>
        {inBranch}
      </li>);
    }
    return (<div><p><b>Known Masteries:</b></p><ul className="mastery_list">{elements}</ul></div >);
  }

  onError(evt, tryNum, imgUrl) {
    //console.log("tryNum = " + tryNum);
    // don't infinite loop.
    // 0 --> 1 replace https with http
    // after 1, stop
    if (tryNum >= 1) {
      return tryNum;
    }
    var newUrl = imgUrl.replace("https", "http");
    if (newUrl !== imgUrl) {
      evt.target.src = newUrl;
    }
    return tryNum + 1;
  }

  renderChamp(champ) {
    var formatter = this.formatter;
    var numberer = this.numberer;
    if (!champ) {
      return null;
    }
    var parts = [];
    var imgName = champ.name.replace(/ /g, "_");
    var imgUrl = "https://raw.githubusercontent.com/PatPat1567/RaidShadowLegendsData/master/images/avatar/" + imgName + ".png";
    var tryNum = 0;

    parts.push(<img key="c0" className="champion_avatar" alt="avatar" title={champ.name} onError={(e) => tryNum = this.onError(e, tryNum, imgUrl)} src={imgUrl} />);
    parts.push(<span key="c1">{champ.rarity}</span>);
    parts.push(<span key="c2"> {champ.element}</span>);
    parts.push(<span key="c3"> {numberer.RankFromStars(champ.grade)} *</span>);
    parts.push(formatter.Faction(champ.fraction));
    parts.push(<span key="c5">  <b>{champ.name}</b></span>);
    parts.push(<span key="c6">, level {champ.level}</span>);
    if (champ.inStorage) {
      parts.push(<span key="c7"> (Vault)</span>);
    }

    if (champ.marker && champ.marker !== "None") {
      var spec = this.markerFromKey(champ.marker);
      if (spec) {
        parts.push(<span key="c8">. Marker:</span>);
        parts.push(<MarkerRune key="c9" marker={champ.marker} />);
      }
    }

    parts.push(<hr key="c10" />);
    parts.push(this.renderArtifacts(champ.artifacts));
    parts.push(<hr key="c12" />);
    parts.push(this.renderMasteries(champ.masteries));
    parts.push(<hr key="c14" />);
    parts.push(this.renderTotalStats());
    return <div>{parts}</div>;
  }
  render() {
    return (
      <div>
        {this.renderAutoCompleter(this.props.champions)}
        {this.renderChamp(this.props.curChamp)}
      </div>
    );
  }
}

export default ChampionDetailPage;