import React from 'react';
import { Col, Row, Switch, Table, Tooltip } from 'antd';
import Comparer from './Comparer';
import Numberer from './Numberer';
import Formatter from './Formatter';
import ArtifactDimensionChooser from './ArtifactDimensionChooser';
import ArtifactRune from './ArtifactRune';
import artifactTypesConfig from './config/artifact_types.json';
import ChampionRune from './ChampionRune';
import BarSpecifier from './BarSpecifier';

import {
  DIMENSION_NONE,
} from './Comparer';


const DONT_DISPLAY = "Uninteresting";
const MAX_TO_SHOW = 500;
const RANK_INTRO = "Rank"
const RANK_KEYS = [1, 2, 3, 4, 5, 6];
const RARITY_INTRO = "Rarity"
const RARITY_KEYS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
const SLOT_INTRO = "Slot"

class ArtifactSellPage extends React.Component {
  constructor(props) {
    super(props);
    const INITIAL_RANK_BAR = 4;
    const STARTING_RANK_IS_LOWER_BOUND = false;
    const INITIAL_RARITY_BAR = "Epic";
    const STARTING_RARITY_IS_LOWER_BOUND = false;
    var rankLabels = {};
    var formatter = new Formatter();
    RANK_KEYS.forEach((key) => {
      rankLabels[key] = formatter.Rank(key);
    });
    var rarityLabels = {};
    RARITY_KEYS.forEach((key) => {
      rarityLabels[key] = key;
    });
    var slotLabels = {};
    var slotKeys = [];
    artifactTypesConfig.artifact_types.forEach((typeConfig) => {
      slotKeys.push(typeConfig.key.toLowerCase());
      slotLabels[typeConfig.key] = typeConfig.label;
    });
    // all the checkers for what to sell.
    // a checker is a function that takes an artifact JSON blob,
    // and returns null/empty string if the artifact isn't recommended for sale by this checker,
    // a 'why' string if it is.
    var checkers = [];
    var id = 0;
    var barSpecifierId = id;
    checkers.push({ id: id++, label: <BarSpecifier intro={RANK_INTRO} initial={INITIAL_RANK_BAR} is_lower_bound={STARTING_RANK_IS_LOWER_BOUND} reporter={(v, b) => this.onMinRankChange(v, b)} labels={rankLabels} keys={RANK_KEYS} />, fn: this.CheckByRank });
    var rarityBarSpecifierId = id;
    checkers.push({
      id: id++, label: <BarSpecifier intro={RARITY_INTRO}
        initial={INITIAL_RARITY_BAR} is_lower_bound={STARTING_RARITY_IS_LOWER_BOUND} reporter={(v, b) => this.onRarityBarChange(v, b)} labels={rarityLabels} keys={RARITY_KEYS} />, fn: this.CheckByRarity
    });
    var slotBarSpecifierId = id;
    checkers.push({
      id: id++, label: <BarSpecifier intro={SLOT_INTRO}
        initial="boots" is_exact={true} reporter={(v, b) => this.onSlotBarChange(v, b)} labels={slotLabels} keys={slotKeys} />, fn: this.CheckBySlot
    });

    checkers.push({ id: id++, label: " unworn gear", fn: this.CheckUnwornGear })
    checkers.push({ id: id++, label: "Attack Amulets", fn: this.CheckAttackAmulets });
    checkers.push({
      id: id++, label: "Defense Rings w/o 2 good substats", fn: this.CheckDefenseRingWithoutTwoGoodSubstats,
      ttip: "Ring of Defense without 2 substats that are either % boost, or Spd"
    });
    checkers.push({
      id: id++, label: "Defensive Rings w/o Defensive substat", fn: this.CheckDefensiveRingWithoutDefensiveSubstats,
      ttip: "Ring of DEF or HP with no substat of HP%, DEF%, or Speed"
    });
    checkers.push({
      id: id++, label: "Non-Lego ring w/2 bad substats", fn: this.CheckNonLegoRingWith2BadSubstats,
      ttip: "Non-Legendary ring with 2 substats that are flat and not Speed"
    });
    checkers.push({
      id: id++, label: "top row w/2 bad substats", fn: this.CheckTopRowWith2BadSubstats,
      ttip: "A 'bad' substat is flat ATK,DEF,RES, or HP"
    });

    checkers.push({ id: id++, label: "Atk% Gloves", fn: this.CheckAtkPercentGloves });
    checkers.push({
      id: id++, label: "CD Gloves w/o CR or SPD", fn: this.CheckMostCDGloves,
      ttip: "Crit Damage gloves without either a Crit Rate or Speed substat"
    });
    checkers.push({ id: id++, label: "Epic Non-Speed Boots", fn: this.CheckEpicNonSpeedBoots });
    checkers.push({ id: id++, label: "Defensive Boots Without SPD substat", fn: this.CheckDefensiveBootsWithoutSpeed });
    checkers.push({ id: id++, label: "> 2 substats, none SPD", fn: this.CheckThreeSubstatsNoSpeed });


    checkers.push({ id: id++, label: "bottom row flat HP/ATK/DEF", fn: this.CheckBottomRowFlatMainStat });
    // map from checkerid to whether enabled. Not an array, to be fancy:
    var checkedByCheckerId = {};
    checkers.forEach((checker, index) => {
      checkedByCheckerId[checker.id] = (checker.fn === this.CheckUnwornGear);
    });
    var comparer = new Comparer();
    var artifactSorters = comparer.makeArtifactSorters();
    this.state = {
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId,
      'numberer': new Numberer(),
      'artifactSorters': artifactSorters,
      'artifactDimension': DIMENSION_NONE,
      'comparer': comparer,
      'rankBar': INITIAL_RANK_BAR,
      'is_lower_bound': STARTING_RANK_IS_LOWER_BOUND,
      barSpecifierId: barSpecifierId,
      rankLabels: rankLabels,
      rarityBar: INITIAL_RARITY_BAR,
      rarity_is_lower_bound: STARTING_RARITY_IS_LOWER_BOUND,
      rarityBarSpecifierId: rarityBarSpecifierId,
      rarityLabels: rarityLabels,
      slotBar: "boots",
      slotBarSpecifierId: slotBarSpecifierId,
      slotLabels: slotLabels,
      slotKeys: slotKeys
    }
  }
  onMinRankChange(v, is_lower_bound) {
    //console.log('onMinRankChange: v from ' + this.state.rankBar + " to " + v + ", is_lower from " + this.state.is_lower_bound + " to " + is_lower_bound);
    var checkers = this.state.checkers;
    // because 'checkers' was set in the constructor, before 'this.state' was set,
    // React doesn't know to change the checker when (v) or (is_lower_ changes). Have to do that myself:
    var barSpecifierId = this.state.barSpecifierId;
    checkers[barSpecifierId] = {
      id: barSpecifierId,
      label: <BarSpecifier intro={RANK_INTRO} initial={v} is_lower_bound={is_lower_bound} reporter={(v, b) => this.onMinRankChange(v, b)} labels={this.state.rankLabels} keys={RANK_KEYS} />, fn: this.CheckByRank
    };
    this.setState({
      rankBar: v,
      is_lower_bound: is_lower_bound,
      checkers: checkers
    });
  }

  onRarityBarChange(v, is_lower_bound) {
    //console.log('onMinRankChange: v from ' + this.state.rankBar + " to " + v + ", is_lower from " + this.state.is_lower_bound + " to " + is_lower_bound);
    var checkers = this.state.checkers;
    // because 'checkers' was set in the constructor, before 'this.state' was set,
    // React doesn't know to change the checker when (v) or (is_lower_ changes). Have to do that myself:
    var barSpecifierId = this.state.rarityBarSpecifierId;
    checkers[barSpecifierId] = {
      id: barSpecifierId,
      label: <BarSpecifier intro={RARITY_INTRO} initial={v} is_lower_bound={is_lower_bound} reporter={(v, b) => this.onRarityBarChange(v, b)} labels={this.state.rarityLabels} keys={RARITY_KEYS} />,
      fn: this.CheckByRarity
    };
    this.setState({
      rarityBar: v,
      rarity_is_lower_bound: is_lower_bound,
      checkers: checkers
    });
  }

  onSlotBarChange(v, is_lower_bound) {
    //console.log('onSlotBarChange: v from ' + this.state.slotBar + " to " + v);
    var checkers = this.state.checkers;
    var slotSpecifierId = this.state.slotBarSpecifierId;
    checkers[slotSpecifierId] = {
      id: slotSpecifierId,
      label: <BarSpecifier intro={SLOT_INTRO} initial={v} is_exact={true} reporter={(v, b) => this.onSlotBarChange(v, b)} labels={this.state.slotLabels} keys={this.state.slotKeys} />,
      fn: this.CheckBySlot
    };
    this.setState({
      slotBar: v,
      checkers: checkers
    });
  }

  CheckUnwornGear(artifact) {
    return (artifact && !artifact.wearer) ? DONT_DISPLAY : null;
  }

  CheckAtkPercentGloves(artifact) {
    if (!artifact) return null;
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "gloves")) return null;
    if (!("attack" === artifact.primaryBonus.kind.toLowerCase())) return null;
    if (artifact.primaryBonus.isAbsolute) return null;
    return "Atk% gloves";
  }

  CheckThreeSubstatsNoSpeed(artifact) {
    if (!artifact) return null;
    if (!artifact.rarity) return null;
    if (artifact.requiredFraction) return null; // accessory
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() === "speed") return null;
    var secondaries = artifact.secondaryBonuses;
    if (!secondaries || secondaries.length < 3) return null;
    var hasInSecondary = secondaries.some((bonus) => {
      return bonus.kind.toLowerCase() === "speed";
    });
    if (!hasInSecondary) {
      return "no Speed substat";
    }
  }

  CheckEpicNonSpeedBoots(artifact) {
    if (!artifact) return null;
    if (!artifact.rarity) return null;
    if (artifact.requiredFraction) return null; // accessory
    var lc = artifact.rarity.toLowerCase();
    if (!(lc === "epic")) return null;
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "boots")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() === "speed") return null;
    return "Epic non-SPD boots";
  }

  CheckDefensiveBootsWithoutSpeed(artifact) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "boots")) return null;
    var main = artifact.primaryBonus;
    var mainKind = main.kind.toLowerCase();
    if (mainKind !== "health" && mainKind !== "defense") return null;
    var secondaries = artifact.secondaryBonuses;
    if (!secondaries) {
      return "Defensive Boots with no SPD substat";
    }
    var hasInSecondary = secondaries.some((bonus) => {
      var kind = bonus.kind.toLowerCase();
      return kind === "speed";
    });
    if (!hasInSecondary) {
      return "Defensive Boots with no SPD substat (" + artifact.id + ")";
    }
    return null;
  }

  CheckAttackAmulets(artifact) {
    if (!artifact) return null;
    if (!artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "cloak")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() !== "attack") return null;
    return "Attack Amulet";
  }

  CheckDefenseRingWithoutTwoGoodSubstats(artifact) {
    // a 'good' substat is a % stat, or SPD
    if (!artifact) return null;
    if (!artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "ring")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() !== "defense") return null;
    var numGood = 0;
    var goodNeeded = 2;
    var secondaries = artifact.secondaryBonuses;
    if (secondaries) {
      secondaries.forEach((bonus) => {
        if (!bonus.isAbsolute) numGood++;
        var kind = ('kind' in bonus) ? bonus['kind'] : bonus['what'];
        if (kind && (kind.toLowerCase() === "speed")) numGood++;
      });

    }
    if (numGood < goodNeeded) {
      return DONT_DISPLAY;
    }
    return null;
  }

  CheckDefensiveRingWithoutDefensiveSubstats(artifact) {
    if (!artifact) return null;
    if (!artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "ring")) return null;
    var main = artifact.primaryBonus;
    var kind = main.kind.toLowerCase();
    if (kind !== "defense" && kind !== "health") return null;
    // good substats are HP%, DEF %
    var numGood = 0;
    var goodNeeded = 1;
    var secondaries = artifact.secondaryBonuses;
    if (secondaries) {
      secondaries.forEach((bonus) => {
        var kind = ('kind' in bonus) ? bonus['kind'] : bonus['what'];
        kind = kind.toLowerCase();
        if (kind === "speed") numGood++;
        if (kind === "health" || kind === "defense") {
          if (!bonus.isAbsolute) numGood++;
        }
      });
    }
    if (numGood < goodNeeded) {
      return DONT_DISPLAY;
    }
    return null;
  }

  CheckNonLegoRingWith2BadSubstats(artifact) {
    if (!artifact) return null;
    if (!artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "ring")) return null;
    var lc = artifact.rarity.toLowerCase();
    if (lc === "legendary") return null;
    var numBad = 0;
    var badNeeded = 2;
    var secondaries = artifact.secondaryBonuses;
    if (secondaries) {
      secondaries.forEach((bonus) => {
        var kind = ('kind' in bonus) ? bonus['kind'] : bonus['what'];
        kind = kind.toLowerCase();
        if (bonus.isAbsolute && !(kind === "speed")) numBad++;
      });
    }
    if (numBad >= badNeeded) {
      return DONT_DISPLAY;
    }
  }

  CheckTopRowWith2BadSubstats(artifact) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    var topKinds = ["weapon", "helmet", "shield"];
    var index = topKinds.indexOf(artifact.kind.toLowerCase());
    if (index === -1) return null;
    var badNeeded = 2;
    var badSubs = ["attack", "defense", "resistance", "health"];
    var secondaries = artifact.secondaryBonuses;
    var bads = [];
    if (secondaries) {
      secondaries.forEach((bonus) => {
        var kind = ('kind' in bonus) ? bonus['kind'] : bonus['what'];
        var kindLc = kind.toLowerCase();
        if (bonus.isAbsolute && (badSubs.indexOf(kindLc) !== -1)) {
          bads.push(kind);
        }
      });
    }
    if (bads.length >= badNeeded) {
      return topKinds[index] + " has " + bads.length + " bad substats"
        + ": " + bads.join(", ");
    }
  }

  CheckMostCDGloves(artifact) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "gloves")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() !== "criticaldamage") return null;
    var secondaries = artifact.secondaryBonuses;
    if (!secondaries) {
      return "CD gloves with no SPD or CR substat";
    }
    var hasInSecondary = secondaries.some((bonus) => {
      var kind = bonus.kind.toLowerCase();
      return kind === "speed" || kind === "criticalchance";
    });
    if (!hasInSecondary) {
      return "CD gloves with no SPD or CR substat";
    }
    return null;
  }

  CheckByRank(artifact, extra) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.rank) return null;
    var bar = extra.rankBar;
    var is_lower_bound = extra.is_lower_bound;
    var asNum = extra.numberer.Rank(artifact.rank);
    var passed = (is_lower_bound) ? (asNum >= bar) : (asNum <= bar);
    if (passed) {
      return DONT_DISPLAY;
    }
    return null;
  }

  CheckBySlot(artifact, extra) {
    var bar = extra.slotBar;
    return (bar === artifact.kind.toLowerCase()) ? DONT_DISPLAY : null;
  }

  CheckByRarity(artifact, extra) {
    if (!artifact || !artifact.rarity) return null;
    var bar = extra.numberer.Rarity(extra.rarityBar);
    var is_lower_bound = extra.rarity_is_lower_bound;
    var asNum = extra.numberer.Rarity(artifact.rarity);
    var passed = (is_lower_bound) ? (asNum >= bar) : (asNum <= bar);
    if (passed) {
      return DONT_DISPLAY;
    }
    return null;
  }

  CheckBottomRowFlatMainStat(artifact) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    var kind = artifact.kind;
    if (!kind) return null;
    kind = kind.toLowerCase();
    if (!(kind === "gloves" || kind === "chest" || kind === "boots")) return null;
    var main = artifact.primaryBonus;
    var mainKind = main.kind.toLowerCase();
    // speed is flat, but gets an exemption...
    if (mainKind === "speed") return null;
    // (added later) same thing with acc and res
    if (mainKind === "accuracy" || mainKind === "resistance") return null;
    if (!main.isAbsolute) return null;
    return "bottom row flat main stat";
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
      <p><b>Show Artifacts that pass <i>all</i> of these checks:</b></p>
      <hr />
      { rows}
      <hr />
    </div >);
  }

  onDimensionChange(newDimension) {
    if (newDimension === this.state.artifactDimension) {
      return;
    }
    this.setState({ artifactDimension: newDimension });
  }

  compareArtifacts(art1, art2) {
    if (!art1 && !art2) return 0;
    if (!art1) return 1;
    if (!art2) return -1;
    var dimension = this.state.artifactDimension;
    if (!(dimension in this.state.artifactSorters)) {
      return 0;
    }
    return this.state.artifactSorters[dimension](art1, art2)
  }

  render() {
    if (!this.props.artifacts || this.props.artifacts.length === 0) {
      return (<div><span>No artifacts to show</span></div>);
    }
    var numberer = this.state.numberer;
    var formatter = new Formatter();
    var runeHeader = <ArtifactDimensionChooser initialValue={this.state.artifactDimension}
      reporter={(value) => this.onDimensionChange(value)} />;
    const columns = [
      {
        title: runeHeader,
        dataIndex: 'artifact',
        key: 'artifact',
        sorter: (a, b) => this.compareArtifacts(a.artifact, b.artifact),
        render: (artifact) => {
          return <ArtifactRune artifact={artifact} />;
        },
      },
      {
        title: 'SubStats',
        dataIndex: 'subStats',
        key: 'subStats',
        render: (subStats, record, index) => (
          <div>{formatter.Substats(subStats)}</div>
        )
      },
      {
        title: 'Wearer',
        dataIndex: 'wearer',
        key: 'wearer',
        render: (champion) => <ChampionRune champion={champion} />,
        sorter: (a, b) => {
          return this.state.comparer.Champions(a.wearer, b.wearer)
        }
      },
      {
        title: 'Why',
        dataIndex: 'why',
        key: 'why',
        sorter: (a, b) => {
          //console.log(a.why + "..." + b.why)
          return a.why.toLowerCase().localeCompare(b.why.toLowerCase());
        }
      },

    ];
    const dataByRows = [
    ];

    var extra = {
      numberer: numberer,
      rankBar: this.state.rankBar,
      is_lower_bound: this.state.is_lower_bound,
      rarityBar: this.state.rarityBar,
      rarity_is_lower_bound: this.state.rarity_is_lower_bound,
      slotBar: this.state.slotBar
    };
    var shown = 0;
    this.props.artifacts.some((artifact) => {
      var toCheck = artifact.isSeen;
      //if (!this.state.checkWornGear && artifact.wearer) toCheck = false;

      if (toCheck) {
        var passesAll = true;
        var whys = [];
        this.state.checkers.some((checker) => {
          if (this.state.checkedByCheckerId[checker.id]) {
            var why = checker.fn(artifact, extra);
            if (why) {
              if (DONT_DISPLAY !== why) {
                whys.push(why);
              }
              return false; // keep checking
            } else {
              passesAll = false;
              return true; // stop checking
            }
          }
          return false;
        });
        if (passesAll) {
          var rowData = {
            key: artifact.id,
            artifact: artifact,
            subStats: artifact.secondaryBonuses,
            wearer: artifact.wearer,
            why: whys.join(',')

          };
          dataByRows.push(rowData);
          shown++;
        }
      }
      return (shown >= MAX_TO_SHOW);
    });

    /*
    const paginationConfig = {
      defaultPageSize: 50,
      hideOnSinglePage: true,
      pageSize: 50
    }
    */
    const paginationConfig = false;
    return (
      <div>
        { this.renderSelectorPart()}
        <h3>{shown >= MAX_TO_SHOW ? "at least " : ""} {dataByRows.length} artifacts pass the checks.</h3>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div >
    );
  }
}

export default ArtifactSellPage;