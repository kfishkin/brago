import React from 'react';
import { AutoComplete, Popover, Table } from 'antd'
import Formatter from './Formatter';
import Numberer from './Numberer';
import artifactSetConfig from './config/artifact_sets.json';
import artifactTypeConfig from './config/artifact_types.json';
import attributesConfig from './config/attributes.json';
import greatHallConfig from './config/great_hall.json';
import markersConfig from './config/markers.json';
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
    var bonuses = {};
    if (!artifacts || artifacts.length === 0) {
      return [bonuses, amplificationBonuses];
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
          var entry = [bonus, setConfig.label + " set bonus"];
          if (!(attr in bonuses)) {
            bonuses[attr] = [];
          }
          if (key1 in amplifyBonusesBySetName) {
            //console.log('bonus applies to ' + key1 + ':' + JSON.stringify(amplifyBonusesBySetName[key1]));
            var amplification = amplifyBonusesBySetName[key1][1].value * bonus.value;
            // console.log('ampl = ' + amplification + ', isAbs = ' + bonus.isAbsolute);
            var amplBonus =
            {
              "kind": "amplify",
              "isAbsolute": bonus.isAbsolute,
              "value": amplification
            }
            var masteryName = masteryNamesById[amplifyBonusesBySetName[key1][0]];
            var amplEntry = [amplBonus, masteryName + " bonus to " + setConfig.label + " set"];
            if (!(attr in amplificationBonuses)) {
              amplificationBonuses[attr] = [];
              amplificationBonuses[attr].push(amplEntry);
            }
          }
          bonuses[attr].push(entry);

        });
      }
      return false;
    });
    // and then the bonuses from the pieces themselves.
    artifactObjects.forEach((artifact) => {
      if (('primaryBonus' in artifact) && ('kind' in artifact.primaryBonus)) {
        var attr = this.attributesByJsonKey[artifact.primaryBonus.kind.toLowerCase()].key;
        var entry = [artifact.primaryBonus, artifact.kind + ' main stat'];
        if (!(attr in bonuses)) {
          bonuses[attr] = [];
        }
        //console.log(' primary bonus to ' + attr + ' of ' + JSON.stringify(artifact.primaryBonus));
        bonuses[attr].push(entry);
      }
      if (('secondaryBonuses' in artifact) && (artifact.secondaryBonuses.length > 0)) {
        artifact.secondaryBonuses.forEach((secondary) => {
          attr = this.attributesByJsonKey[secondary.kind.toLowerCase()].key;
          entry = [secondary, this.artifactTypesByKey[artifact.kind.toLowerCase()].label + ' substat'];
          if (!(attr in bonuses)) {
            bonuses[attr] = [];
          }
          //console.log(' secondary bonus to ' + attr + ' of ' + JSON.stringify(secondary));
          bonuses[attr].push(entry);
        });
      }
    });
    return [bonuses, amplificationBonuses];
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
        if (bonus && bonus.kind === "amplify") {
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

  /**
   * Computes all the info about which mastery bonuses this champ
   * @param {hash} masteryNamesById. Hash table, keys are ids.
   * @param {hash} bonuses the bonuses we have going in:
   * 
   * a hash table, keyed by attribute ('hp', 'atk', etc.).
   * Each entry in the hash table is an array of tuples.
   * First entry is the Bonus to apply.
   * Second entry is a string describing the bonus
   */
  computeMasteryBonusInfo(masteryNamesById, bonuses) {
    masteriesConfig.masteries.some((masterySpec) => {
      if (!(masterySpec.key in masteryNamesById)) {
        return false;
      }
      if (!masterySpec.bonuses || masterySpec.bonuses.length === 0) {
        return false;
      }
      masterySpec.bonuses.forEach((bonus) => {
        var attr = bonus.kind;
        var entry = [bonus, masterySpec.label + ' mastery bonus'];
        if (!(attr in bonuses)) {
          bonuses[attr] = [];
        }
        bonuses[attr].push(entry);
      });
      return true;
    });
    return bonuses;
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
  renderTotalStats() {
    var arenaLabel = this.props.arenaLevel ? (" (" + this.props.arenaLevel.label + ")") : "";

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

    var masteryIdsAsSet = this.masteryNamesById(curChamp.masteries);
    var artifactAndAmplificationBonuses = this.computeArtifactBonusInfo(curChamp.artifacts, masteryIdsAsSet);
    var artBonusInfo = artifactAndAmplificationBonuses[0];
    var masteryBonusInfo = artifactAndAmplificationBonuses[1];
    this.computeMasteryBonusInfo(masteryIdsAsSet, masteryBonusInfo);

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
      var content = (bonusExplanations.length > 0) ? (<ul className="bonus_popover">{bonusExplanations}</ul>) : null;
      rowData['artifacts'] = (bonusExplanations.length > 0) ?
        <Popover content={content} focus="hover"><span className="has_popover">{artAmount}</span></Popover>
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
      // do the above again for amplifications.
      total += artAmount;
      content = (bonusExplanations.length > 0) ? (<ul>{bonusExplanations}</ul>) : null;
      rowData['masteries'] = (bonusExplanations.length > 0) ?
        <Popover content={content} focus="hover"><span className="has_popover">{artAmount}</span></Popover>
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

  renderMastery(mastery) {
    var parts = [];
    if (mastery.img) {
      parts.push(<img className="mastery_icon" alt={mastery.label} src={process.env.PUBLIC_URL + mastery.img} />);
    }
    if (mastery.label) {
      parts.push(mastery.label);
    }
    return (<span>{parts}</span>);
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
      inBranch.push(<img className="mastery_icon" title={spec.label} alt={spec.label} src={process.env.PUBLIC_URL + spec.img} />);
    });
    if (inBranch.length > 0) {
      elements.push(<li key={masterySpecs.length}>
        <b>{prevBranchName}:</b>
        {inBranch}
      </li>);
    }
    return (<div><p><b>Known Masteries:</b></p><ul className="mastery_list">{elements}</ul></div >);
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
    if (champ.marker && champ.marker !== "None") {
      var spec = this.markerFromKey(champ.marker);
      if (spec) {
        parts.push(<span>. Marker: <img className="marker_icon" src={process.env.PUBLIC_URL + spec.icon} alt={spec.label} title={spec.label} /></span>);
      }
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