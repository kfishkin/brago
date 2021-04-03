import React from 'react';
import { AutoComplete, Popover, Table } from 'antd'
import Formatter from './Formatter';
import Numberer from './Numberer';
import artifactSetConfig from './config/artifact_sets.json';
import artifactTypeConfig from './config/artifact_types.json';
import attributesConfig from './config/attributes.json';
import greatHallConfig from './config/great_hall.json';
import masteriesConfig from './config/masteries.json';
import ArtifactOneLiner from './ArtifactOneLiner';
import { Row, Col } from 'antd';

// props:
// champions - array of champions
// artifactsById - hash of artifacts indexed by id
// reporter - f(champion), call when chosen
// curChamp - current champion, if any
// arenaLevel - dict with data on current arena level.
// greatHallData - values from great hall
class ChampionDetailPage extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new Formatter();
    this.numberer = new Numberer();
    // load and store a map from attribute:level
    // to what it's bonuses are.
    this.arenaBonusMap = {}
    greatHallConfig.columns.forEach((configCol) => {
      var key = configCol.key;
      configCol.bonuses.forEach((bonusEntry) => {
        var level = bonusEntry.level;
        var bonus = {
          'kind': key,
          'isAbsolute': bonusEntry.isAbsolute,
          'value': bonusEntry.value
        };
        this.arenaBonusMap[key + ":" + level] = bonus;
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

  }

  onSelect(value, option) {
    this.props.reporter(this.props.champions[option.index]);
  }
  renderAutoCompleter(champions) {
    var options = [];
    var prompt = this.props.curChamp ? "choose a different champion"
      : "choose a champion"
    if (champions) {
      champions.forEach((champion, index) => {
        // add the id to the name for when you have multiples
        // of the same champ
        options.push({ 'value': champion.name + ' (' + champion.id + ')', 'key': champion.id, 'index': index });
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
   * 
   * returns a hash table, keyed by attribute ('hp', 'atk', etc.).
   * Each entry in the hash table is an array of tuples.
   * First entry is the Bonus to apply.
   * Second entry, if requested, is a string describing the bonus
   */
  computeArtifactBonusInfo(artifacts) {
    // make a hash table whose key is the armor kind (toxic, cruel, etc.)
    // and whose value is how many of that type have been seen.
    // anything missing has a count of 0.
    var setTypeCounts = {};
    //
    // and an array of the artifact objects.
    var artifactObjects = [];
    var bonuses = {};
    if (!artifacts || artifacts.length === 0) {
      return bonuses;
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
    // go through the armor sets, see if I get their bonuses....
    artifactSetConfig.sets.some((setConfig) => {
      var key1 = setConfig.jsonKey;
      var key2 = setConfig.key;
      if (!(key1 in setTypeCounts) && !(key2 in setTypeCounts)) {
        return false; // keep looking
      }
      var count = (key1 in setTypeCounts) ? setTypeCounts[key1] : setTypeCounts[key2];
      var times = Math.floor(setConfig.set_size / count);
      for (var i = 0; i < times; i++) {
        setConfig.bonuses.forEach((bonus) => {
          var attr = bonus.kind;
          var entry = [bonus, setConfig.label + " set bonus"];
          if (!(attr in bonuses)) {
            bonuses[attr] = [];
          }
          // TODO: add support for 'lore of steel' here.
          bonuses[attr].push(entry);
        });
      }
      return true;
    });
    // and then the bonuses from the pieces themselves.
    artifactObjects.forEach((artifact) => {
      if (('primaryBonus' in artifact) && ('kind' in artifact.primaryBonus)) {
        var attr = this.attributesByJsonKey[artifact.primaryBonus.kind.toLowerCase()].key;
        var entry = [artifact.primaryBonus, artifact.kind + ' primary bonus'];
        if (!(attr in bonuses)) {
          bonuses[attr] = [];
        }
        //console.log(' primary bonus to ' + attr + ' of ' + JSON.stringify(artifact.primaryBonus));
        bonuses[attr].push(entry);
      }
      if (('secondaryBonuses' in artifact) && (artifact.secondaryBonuses.length > 0)) {
        artifact.secondaryBonuses.forEach((secondary) => {
          attr = this.attributesByJsonKey[secondary.kind.toLowerCase()].key;
          entry = [secondary, this.artifactTypesByKey[artifact.kind.toLowerCase()].label + ' secondary bonus'];
          if (!(attr in bonuses)) {
            bonuses[attr] = [];
          }
          //console.log(' secondary bonus to ' + attr + ' of ' + JSON.stringify(secondary));
          bonuses[attr].push(entry);
        });
      }
    });
    return bonuses;
  }


  /**
   * Computes all the info about which mastery bonuses this champ
   * @param {array} artifacts the array of mastery ids.
   * 
   * returns a hash table, keyed by attribute ('hp', 'atk', etc.).
   * Each entry in the hash table is an array of tuples.
   * First entry is the Bonus to apply.
   * Second entry is a string describing the bonus
   */
  computeMasteryBonusInfo(masteryIds) {
    // make a set of all the masteries. faster...
    var masteriesHave = {};
    masteryIds.forEach((masteryId) => {
      masteriesHave[masteryId] = true;
    })
    // go through the masteries, see which ones I have...
    var bonuses = {};
    masteriesConfig.masteries.some((masterySpec) => {
      if (!(masterySpec.key in masteriesHave)) {
        return false;
      }
      if (!masterySpec.bonuses || masterySpec.bonuses.length === 0) {
        return false;
      }
      masterySpec.bonuses.forEach((bonus) => {
        var attr = bonus.kind;
        var entry = [bonus, attr + ' mastery bonus from ' + masterySpec.label];
        if (!(attr in bonuses)) {
          bonuses[attr] = [];
        }
        bonuses[attr].push(entry);
      });
      return true;
    });
    return bonuses;
  }

  renderTotalStats() {

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
        title: 'Classic Arena',
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
    var affinity = curChamp['element'].toLowerCase();
    const dataByRows = [
    ];
    var arenaBonuses = {};
    if (this.props.arenaLevel && this.props.arenaLevel.bonuses
      && this.props.arenaLevel.bonuses.length > 0) {
      arenaBonuses = this.props.arenaLevel.bonuses;
    }
    var hallBonuses = {};
    if (this.props.greatHallData) {
      // find the row for this champs affinity.
      this.props.greatHallData.some((hallDict) => {
        //console.log('key = ' + hallDict.key + ", affinity = " + affinity);
        if (hallDict.key.toLowerCase() === affinity) {
          hallBonuses = hallDict;
          return true;
        }
        return false;

      });
    }

    var artBonusInfo = this.computeArtifactBonusInfo(curChamp.artifacts);
    var masteryBonusInfo = this.computeMasteryBonusInfo(curChamp.masteries);

    attributesConfig.attributes.forEach((attrSpec) => {

      var key = attrSpec.key;
      var rowData = { key: key };
      // base stats.
      var base = curChamp[attrSpec.jsonKey];
      var total = base;
      var artAmount = 0;
      rowData['base_stats'] =
        attrSpec.label + "  " + base;

      var bonusExplanations = [];
      if (key in artBonusInfo) {
        var bonusTuples = artBonusInfo[key];
        bonusTuples.forEach((tuple) => {
          var bonus = tuple[0];
          var amt = Math.round(this.numberer.EvaluateBonus(base, bonus));
          artAmount += amt;
          bonusExplanations.push(<li>{amt} from {tuple[1]}</li>)
        });
      }
      total += artAmount;
      var content = (bonusExplanations.length > 0) ? (<ul>{bonusExplanations}</ul>) : null;
      rowData['artifacts'] = (bonusExplanations.length > 0) ?
        <Popover content={content} focus="hover">{artAmount}</Popover>
        : artAmount;

      bonusExplanations = [];
      artAmount = 0;
      if (key in masteryBonusInfo) {
        bonusTuples = masteryBonusInfo[key];
        bonusTuples.forEach((tuple) => {
          var bonus = tuple[0];
          var amt = Math.round(this.numberer.EvaluateBonus(base, bonus));
          artAmount += amt;
          bonusExplanations.push(<li>{amt} from {tuple[1]}</li>)
        });
      }
      total += artAmount;
      content = (bonusExplanations.length > 0) ? (<ul>{bonusExplanations}</ul>) : null;
      rowData['masteries'] = (bonusExplanations.length > 0) ?
        <Popover content={content} focus="hover">{artAmount}</Popover>
        : '';

      // arena bonus
      arenaBonuses.some((bonus) => {
        if (bonus.kind === key) {
          var amt = Math.round(this.numberer.EvaluateBonus(base, bonus));
          rowData['arena'] = amt;
          total += amt;
          return true;
        }
        return false;
      });
      // great hall bonus.
      var hallLevel = hallBonuses[key];
      var bonus = this.arenaBonusMap[key + ":" + hallLevel];
      if (bonus) {
        var amt = Math.round(this.numberer.EvaluateBonus(base, bonus));
        rowData['great_hall'] = JSON.stringify(amt);
        total += amt;
      }

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
    parts.push(<ArtifactOneLiner artifact={artifact} />);
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
    var elements = [];
    masteries.forEach((masteryId) => {
      var content = masteryId;
      masteriesConfig.masteries.some((masterySpec) => {
        if (masteryId === masterySpec.key) {
          content = <span>{masterySpec.label}</span>
          return true;

        }
        return false;

      });
      elements.push(<li>{content}</li>)
    });
    return (<div><p><b>Masteries:</b></p><ul>{elements}</ul></div >);
  }

  renderChamp(champ) {
    var formatter = this.formatter;
    var numberer = this.numberer;
    if (!champ) {
      return null;
    }
    var parts = [];
    parts.push(<span>{champ.rarity}</span>);
    parts.push(<span> {champ.element}</span>);
    parts.push(<span> {numberer.RankFromStars(champ.grade)} *</span>);
    parts.push(formatter.Faction(champ.fraction));
    parts.push(<span>  <b>{champ.name}</b></span>);
    parts.push(<span>, level {champ.level}</span>);
    if (champ.inStorage) {
      parts.push(<span> (Vault)</span>);
    }

    parts.push(<hr />);
    parts.push(this.renderArtifacts(champ.artifacts));
    parts.push(<hr />);
    parts.push(this.renderMasteries(champ.masteries));
    parts.push(<hr />);
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