import React from 'react';
import { Col, Row, Switch, Table, Tooltip } from 'antd';
import Comparer from './Comparer';
import Numberer from './Numberer';
import Formatter from './Formatter';
import ArtifactDimensionChooser from './ArtifactDimensionChooser';
import ArtifactRune from './ArtifactRune';
import ChampionRune from './ChampionRune';

import {
  DIMENSION_NONE,
} from './ArtifactDimensionChooser';

class ArtifactSellPage extends React.Component {
  constructor(props) {
    super(props);
    // all the checkers for what to sell.
    // a checker is a function that takes an artifact JSON blob,
    // and returns null/empty string if the artifact isn't recommended for sale by this checker,
    // a 'why' string if it is.
    var checkers = [];
    var id = 0;
    checkers.push({ id: id++, label: "Atk% Gloves", fn: this.SellAtkPercentGloves });
    checkers.push({ id: id++, label: "> 2 substats, none SPD", fn: this.SellThreeSubstatsNoSpeed });
    checkers.push({
      id: id++, label: "top row w/2 bad substats", fn: this.SellTopRowWith2BadSubstats,
      ttip: "A 'bad' substat is flat ATK,DEF,RES, or HP"
    });
    checkers.push({ id: id++, label: "Epic Non-Speed Boots", fn: this.SellEpicNonSpeedBoots });
    checkers.push({
      id: id++, label: "CD Gloves w/o CR or SPD", fn: this.SellMostCDGloves,
      ttip: "Crit Damage gloves without either a Crit Rate or Speed substat"
    });
    checkers.push({ id: id++, label: "Defensive Boots Without SPD substat", fn: this.SellDefensiveBootsWithoutSpeed });
    checkers.push({ id: id++, label: "Attack Amulets", fn: this.SellAttackAmulets });
    checkers.push({
      id: id++, label: "Defense Rings w/o 2 good substats", fn: this.SellDefenseRingWithoutTwoGoodSubstats,
      ttip: "Ring of Defense without 2 substats that are either % boost, or Spd"
    });
    checkers.push({
      id: id++, label: "Defensive Rings w/o Defensive substat", fn: this.SellDefensiveRingWithoutDefensiveSubstats,
      ttip: "Ring of DEF or HP with no substat of HP%, DEF%, or Speed"
    });
    checkers.push({
      id: id++, label: "Non-Lego ring w/2 bad substats", fn: this.SellNonLegoRingWith2BadSubstats,
      ttip: "Non-Legendary ring with 2 substats that are flat and not Speed"
    });
    checkers.push({ id: id++, label: "Under 5 stars", fn: this.SellUnder5Stars });
    checkers.push({ id: id++, label: "bottom row flat HP/ATK/DEF", fn: this.SellBottomRowFlatMainStat });
    // map from checkerid to whether enabled. Not an array to be fancy:
    var checkedByCheckerId = {};
    checkers.forEach((checker) => {
      checkedByCheckerId[checker.id] = false;
    });
    var comparer = new Comparer();
    var artifactSorters = comparer.makeArtifactSorters();
    this.state = {
      'checkWornGear': false, // doesn't count against the limit
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId,
      'numberer': new Numberer(),
      'artifactSorters': artifactSorters,
      'artifactDimension': DIMENSION_NONE,
      'comparer': comparer
    }
  }

  SellAtkPercentGloves(artifact) {
    if (!artifact) return null;
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "gloves")) return null;
    if (!("attack" === artifact.primaryBonus.kind.toLowerCase())) return null;
    if (artifact.primaryBonus.isAbsolute) return null;
    return "Atk% gloves";
  }

  SellThreeSubstatsNoSpeed(artifact) {
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

  SellEpicNonSpeedBoots(artifact) {
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

  SellDefensiveBootsWithoutSpeed(artifact) {
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

  SellAttackAmulets(artifact) {
    if (!artifact) return null;
    if (!artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    if (!(artifact.kind.toLowerCase() === "cloak")) return null;
    var main = artifact.primaryBonus;
    if (main.kind.toLowerCase() !== "attack") return null;
    return "Attack Amulet";
  }

  SellDefenseRingWithoutTwoGoodSubstats(artifact) {
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
      return "Defense Ring Without " + goodNeeded + " good substats";
    }
    return null;
  }

  SellDefensiveRingWithoutDefensiveSubstats(artifact) {
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
      return "Defensive Ring Without " + goodNeeded + " good defensive substats";
    }
    return null;
  }

  SellNonLegoRingWith2BadSubstats(artifact) {
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
      return "Non-Legendary ring with " + numBad + " bad substats";
    }
  }

  SellTopRowWith2BadSubstats(artifact) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.kind) return null;
    var topKinds = ["weapon", "helmet", "shield"];
    if (topKinds.indexOf(artifact.kind.toLowerCase()) === -1) return null;
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
      return "Top-row, " + bads.length + " bad substats"
        + ": " + bads.join(", ");
    }
  }

  SellMostCDGloves(artifact) {
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

  SellUnder5Stars(artifact, numberer) {
    if (!artifact) return null;
    if (artifact.requiredFraction) return null; // accessory
    if (!artifact.rank) return null;
    var asNum = numberer.Rank(artifact.rank);
    if (asNum < 5) {
      var prefix = artifact.wearer ? "Only" : "Unworn, and only";
      return prefix + " has " + asNum + " stars";
    }
    return null;
  }
  SellBottomRowFlatMainStat(artifact) {
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
      <p><b>Checks to Run:</b></p>
      <hr />
      { rows}
      <hr />
    </div >);
  }

  onWornChange(val) {
    this.setState({ checkWornGear: val });
  }

  renderModePart() {
    return (
      <div>
        <Switch checked={this.state.checkWornGear} onChange={(checked, e) => { this.onWornChange(checked) }}></Switch>&nbsp;Check worn gear?
      </div >
    );
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

    this.props.artifacts.forEach((artifact) => {
      var toCheck = artifact.isSeen;
      if (!this.state.checkWornGear && artifact.wearer) toCheck = false;

      if (toCheck) {
        this.state.checkers.forEach((checker) => {
          if (this.state.checkedByCheckerId[checker.id]) {
            var why = checker.fn(artifact, numberer);
            if (why) {
              var rowData = {
                key: artifact.id + why, // an art. can fail > 1 check
                artifact: artifact,
                subStats: artifact.secondaryBonuses,
                wearer: artifact.wearer,
                why: why

              };
              dataByRows.push(rowData);
            }
          }
        });
      }

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
        {this.renderModePart()}
        {this.renderSelectorPart()}
        <h3>There are {dataByRows.length} artifacts to possibly sell.</h3>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div>
    );
  }
}

export default ArtifactSellPage;