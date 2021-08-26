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
import RangeSpecifier from './RangeSpecifier';
import substatsConfig from './config/substats.json';

import {
  DIMENSION_NONE,
} from './Comparer';


const DONT_DISPLAY = "Uninteresting";
const MAX_TO_SHOW = 500;
const RANK_INTRO = "Ranks: ";
const SLOT_INTRO = "Slot"
const WORN_INTRO = "Worn";
const WORN_KEYS = ["no", "yes"];
const WORN_LABELS = { "no": "No", "yes": "Yes" };
const WORN_INITIAL = "no";

const SUBSTAT_INTRO = "has Substat";

const ROLLS_INITIAL = "1";

class ArtifactSellPage extends React.Component {
  constructor(props) {
    super(props);
    var slotLabels = {};
    var slotKeys = [];
    artifactTypesConfig.artifact_types.forEach((typeConfig) => {
      slotKeys.push(typeConfig.key.toLowerCase());
      slotLabels[typeConfig.key] = typeConfig.label;
    });

    var substatLabels = {};
    var substatKeys = [];
    var substatsByKey = {};
    substatsConfig.substats.forEach((substatConfig) => {
      var key = substatConfig.key.toLowerCase();
      substatKeys.push(key);
      substatLabels[key] = substatConfig.label;
      substatsByKey[key] = substatConfig;
    });

    // all the checkers for what to sell.
    // a checker is a function that takes an artifact JSON blob,
    // and returns null/empty string if the artifact isn't recommended for sale by this checker,
    // a 'why' string if it is.
    var checkers = [];
    var id = 0;
    // make the marks for ranks
    const MIN_RANK = 1;
    const MAX_RANK = 6;
    var marks = {};
    for (let i = MIN_RANK; i <= MAX_RANK; i++) {
      marks[i] = "" + i;
    }
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_range: true,
        intro: RANK_INTRO,
        reporter: (v) => this.onRankRangeChange(v),
        dynamic: () => { return { 'value': this.state.rankRange } },
        opts: {
          defaultValue: [MIN_RANK, MAX_RANK],
          min: MIN_RANK,
          max: MAX_RANK,
          step: 1,
          marks: marks
        }
      }),
      fn: this.CheckByRankRange,
    });

    const MIN_RARITY = 0;
    const MAX_RARITY = 4;
    const RARITY_LABELS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_range: true,
        intro: "Rarities: ",
        reporter: (v) => this.onRarityRangeChange(v),
        dynamic: () => { return { 'value': this.state.rarityRange } },
        opts: {
          defaultValue: [MIN_RARITY, MAX_RARITY],
          min: MIN_RARITY,
          max: MAX_RARITY,
          step: 1,
          //marks: marks,
          tipFormatter: (v) => { return <span style={{ 'font-size': 'smaller' }}>{RARITY_LABELS[v]}</span> },
          tooltipVisible: true
        }
      }),
      fn: this.CheckByRarityRange,
    });
    const MIN_LEVEL = 1;
    const MAX_LEVEL = 16;
    marks = {};
    for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
      // only mark some, gets too cluttered otherwise.
      if ((i % 4) === 0)
        marks[i] = "" + i;
    }
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_range: true,
        intro: "Levels: ",
        reporter: (v) => this.onLevelRangeChange(v),
        opts: {
          defaultValue: [MIN_LEVEL, MAX_LEVEL],
          min: MIN_LEVEL,
          max: MAX_LEVEL,
          step: 1,
          marks: marks
        },
        dynamic: () => { return { 'value': this.state.levelRange } },
      }),
      fn: this.CheckByLevelRange,
    });
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        intro: SLOT_INTRO,
        is_exact: true,
        reporter: (v, b) => this.onSlotBarChange(v, b),
        keys: slotKeys,
        labels: slotLabels,
        dynamic: () => { return { 'initial': this.state.slotBar } },
      }),
      fn: this.CheckBySlot,
    });
    var substatCheckerId = id;
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        intro: SUBSTAT_INTRO,
        is_exact: true,
        reporter: (v, b) => this.onSubstatBarChange(v, b),
        keys: substatKeys,
        labels: substatLabels,
        dynamic: () => { return { 'initial': this.state.substatBar } },
      }),
      fn: this.CheckBySubstat,
    });
    const MIN_ROLL = 0;
    const MAX_ROLL = 4;
    marks = {};
    for (let i = MIN_ROLL; i <= MAX_ROLL; i++) {
      marks[i] = "" + i;
    }
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_range: true,
        intro: "Rolls: ",
        reporter: (v) => this.onRollRangeChange(v),
        dynamic: () => { return { 'value': this.state.rollRange } },
        opts: {
          defaultValue: [MIN_ROLL, MAX_ROLL],
          min: MIN_ROLL,
          max: MAX_ROLL,
          step: 1,
          marks: marks
        }
      }),
      fn: this.CheckByRollRange,
    });

    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_exact: true,
        reporter: ((v, b) => this.onWornBarChange(v, b)),
        intro: WORN_INTRO,
        keys: WORN_KEYS,
        labels: WORN_LABELS,
        dynamic: () => { return { 'initial': this.state.wornBar } }
      }),
      fn: this.CheckWorn
    });
    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("Attack Amulets"), fn: this.CheckAttackAmulets });
    checkers.push({
      id: id++, labelInfo: this.makeLabelInfo("Defense Rings w/o 2 good substats"), fn: this.CheckDefenseRingWithoutTwoGoodSubstats,
      ttip: "Ring of Defense without 2 substats that are either % boost, or Spd"
    });
    checkers.push({
      id: id++, labelInfo: this.makeLabelInfo("Defensive Rings w/o Defensive substat"), fn: this.CheckDefensiveRingWithoutDefensiveSubstats,
      ttip: "Ring of DEF or HP with no substat of HP%, DEF%, or Speed"
    });
    checkers.push({
      id: id++, labelInfo: this.makeLabelInfo("Non-Lego ring w/2 bad substats"), fn: this.CheckNonLegoRingWith2BadSubstats,
      ttip: "Non-Legendary ring with 2 substats that are flat and not Speed"
    });
    checkers.push({
      id: id++, labelInfo: this.makeLabelInfo("top row w/2 bad substats"), fn: this.CheckTopRowWith2BadSubstats,
      ttip: "A 'bad' substat is flat ATK,DEF,RES, or HP"
    });

    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("Atk% Gloves"), fn: this.CheckAtkPercentGloves });
    checkers.push({
      id: id++, labelInfo: this.makeLabelInfo("CD Gloves w/o CR or SPD"), fn: this.CheckMostCDGloves,
      ttip: "Crit Damage gloves without either a Crit Rate or Speed substat"
    });
    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("Non-Lego Non-Speed Boots"), fn: this.CheckNonLegoNonSpeedBoots });
    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("Defensive Boots Without SPD substat"), fn: this.CheckDefensiveBootsWithoutSpeed });
    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("> 2 substats, none SPD"), fn: this.CheckThreeSubstatsNoSpeed });


    checkers.push({ id: id++, labelInfo: this.makeLabelInfo("bottom row flat HP/ATK/DEF"), fn: this.CheckBottomRowFlatMainStat });
    // map from checkerid to whether enabled. Not an array, to be fancy:
    var checkedByCheckerId = {};
    checkers.forEach((checker, index) => {
      checkedByCheckerId[checker.id] = (checker.fn === this.CheckUnwornGear);
    });
    var comparer = new Comparer();
    this.state = {
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId,
      'numberer': new Numberer(),
      'artifactDimension': DIMENSION_NONE,
      'comparer': comparer,
      'rankRange': [MIN_RANK, MAX_RANK],
      'rarityRange': [MIN_RARITY, MAX_RARITY],
      'levelRange': [MIN_LEVEL, MAX_LEVEL],
      'rollRange': [MIN_ROLL, MAX_ROLL],
      slotBar: "boots",
      substatBar: "spd",
      wornBar: WORN_INITIAL,
      rollBar: ROLLS_INITIAL,
      roll_is_lower_bound: true,
      substatsByKey: substatsByKey,
      substatCheckerId: substatCheckerId
    }
  }

  /**
   * Helper proc to make the label info.
   * If 'info' is a string, returns info for making a string label.
   * Else, it's a dict, it's for making a 'BarSpecifier'.
   * @param {*} info 
   */
  makeLabelInfo(info) {
    if (typeof (info) === "string") {
      return { 'text': info };
    } else if ("is_range" in info) {  // assume a BarSpecifier
      return { 'range': info };
    } else {
      return { 'bar': info };
    }
  }

  onWornBarChange(v) {
    this.setState({
      wornBar: v
    });
  }

  onRankRangeChange(v) {
    //console.log('onRankRangeChange', v);
    this.setState({
      rankRange: v
    });
  }

  onRarityRangeChange(v) {
    //console.log('onRarityRangeChange', v);
    this.setState({
      rarityRange: v
    });
  }

  onLevelRangeChange(v) {
    this.setState({
      levelRange: v
    });
  }


  onSlotBarChange(v, is_lower_bound) {
    this.setState({
      slotBar: v
    });
  }

  onSubstatBarChange(v, is_lower_bound) {
    //console.log('onSubstatBarChange:', v);
    this.setState({
      substatBar: v
    });
  }

  onRollRangeChange(v) {
    this.setState({
      rollRange: v
    });
  }


  CheckWorn(artifact, extra) {
    if (!artifact) return null;
    var worn = !!(artifact && artifact.wearer);
    var bar = extra.wornBar;
    var passes = (worn === (bar === "yes"));
    return passes ? DONT_DISPLAY : null;
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

  CheckNonLegoNonSpeedBoots(artifact) {
    if (!artifact) return null;
    if (!artifact.rarity) return null;
    if (artifact.requiredFraction) return null; // accessory
    var lc = artifact.rarity.toLowerCase();
    if (lc === "legendary") return null;
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "boots")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() === "speed") return null;
    return DONT_DISPLAY;
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

  CheckByRankRange(artifact, extra) {
    if (!artifact || !artifact.rank) return null;
    var asNum = extra.numberer.Rank(artifact.rank);
    var bounds = extra.rankRange || [1, 6];
    return (asNum >= bounds[0] && asNum <= bounds[1]) ? DONT_DISPLAY : null;
  }

  CheckBySlot(artifact, extra) {
    var bar = extra.slotBar;
    return (bar === artifact.kind.toLowerCase()) ? DONT_DISPLAY : null;
  }

  CheckBySubstat(artifact, extra) {
    var substatKey = extra.substatBar;
    var substats = artifact.secondaryBonuses;
    if (!substats) return null;
    var substatConfig = extra.substatsByKey[substatKey];
    if (!substatConfig) return null;
    // do they have a substat whose 'kind' is equal
    // to substatConfig.key, and whose 'isAbsolute' matches.
    var found = false;
    var lc = substatConfig.attrKey.toLowerCase();
    artifact.secondaryBonuses.some((substat) => {
      if (substat.kind.toLowerCase() === lc
        && substat.isAbsolute === substatConfig.isAbsolute) {
        found = true;
        return true;
      }
      return false;
    });
    return found ? DONT_DISPLAY : null;
  }

  CheckByRollRange(artifact, extra) {
    if (!artifact || !artifact.secondaryBonuses) return null;
    // a kludge. We need to look into the substat filter
    // and find out which substat we care about. Otherwise
    // use any substat.
    // kludge is to look into the global state for that checker
    // and whether it's on, and if so to what value.
    var attrKey = null;
    var attrIsAbsolute = null;
    var substatCheckerId = extra.substatCheckerId;
    if (extra.checkedByCheckerId[substatCheckerId]) {
      // yup, it's on
      var substatKey = extra.substatBar;
      var substatConfig = extra.substatsByKey[substatKey];
      attrKey = substatConfig.attrKey.toLowerCase();
      attrIsAbsolute = substatConfig.isAbsolute;
    }
    var bounds = extra.rollRange;
    // ok, now each secondary bonus (substat) must pass two
    // tests:
    // (1) # rolls (the 'level' field) <= or >= the 'rollBar'
    // (2) is the substat filter is on, for that substat.
    var whys = null;
    artifact.secondaryBonuses.some((substat) => {
      var passes = substat.level >= bounds[0] && substat.level <= bounds[1];
      if (!passes) {
        return false;
      }
      // check the substat type
      if (attrKey != null) {
        if (substat.kind.toLowerCase() !== attrKey) {
          return false;
        }
        if (substat.isAbsolute !== attrIsAbsolute) {
          return false;
        }
      }
      var msg = substat.level + " rolls on " + substat.kind;
      whys = whys ? (whys + ". " + msg) : msg;

      return false;
    });
    return whys;
  }

  CheckByRarityRange(artifact, extra) {
    if (!artifact || !artifact.rarity) return null;
    var asNum = extra.numberer.Rarity(artifact.rarity);
    var bounds = extra.rarityRange;
    return (asNum >= bounds[0] && asNum <= bounds[1]) ? DONT_DISPLAY : null;
  }

  CheckByLevelRange(artifact, extra) {
    if (!artifact || !('level' in artifact)) return null;
    var asNum = artifact.level;
    var bounds = extra.levelRange;
    return (asNum >= bounds[0] && asNum <= bounds[1]) ? DONT_DISPLAY : null;
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
    var body = checker.label;
    if (checker.labelInfo) {
      if ('text' in checker.labelInfo) {
        body = checker.labelInfo.text;
      } else if ('bar' in checker.labelInfo) {
        var props = checker.labelInfo.bar;
        /**
         * This took me forever to find. If I'm making a BarSpecifier,
         * the 'initial' value must be set _at render time_. So not
         * in the constructor. not anywhere else. Otherwise, React won't know
         * to re-render the component when the appropriate state variable changes.
         * So the 'labelInfo', for a BarSpecifier, has 'dynamic', a *function* that
         * is called at run-time to evaluate any non-static values.
         */
        var dynamicProps = ('dynamic' in props) ? props.dynamic() : {};
        //console.log('dynamicProps =', JSON.stringify(dynamicProps));
        // put dynamicProps last here so it 'trumps' static values.
        var stamped = Object.assign({}, props, dynamicProps);
        // the bar specifier
        body = <BarSpecifier {...stamped} />;
      } else if ('range' in checker.labelInfo) {
        props = checker.labelInfo.range;
        dynamicProps = ('dynamic' in props) ? props.dynamic() : {};
        //console.log('dynamicProps =', JSON.stringify(dynamicProps));
        // put dynamicProps last here so it 'trumps' static values.
        stamped = Object.assign({}, props, dynamicProps);
        body = <RangeSpecifier {...stamped} />;
      }
    }
    return checker.ttip ?
      (<Tooltip title={checker.ttip}>{body}</Tooltip>)
      : body;
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
      {rows}
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
    return this.state.comparer.ArtifactsOn(art1, art2, dimension);
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
    var extra = Object.assign({
      numberer: numberer,
    },
      this.state
    );
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
        {this.renderSelectorPart()}
        <h3>{shown >= MAX_TO_SHOW ? "at least " : ""} {dataByRows.length} artifacts pass the checks.</h3>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div >
    );
  }
}

export default ArtifactSellPage;