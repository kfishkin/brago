import React from 'react';
import { Col, Row, Switch, Table } from 'antd';
import Numberer from './Numberer';
import Formatter from './Formatter';

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
    checkers.push({ id: id++, label: "top row w/2 bad substats", fn: this.SellTopRowWith2BadSubstats });
    checkers.push({ id: id++, label: "Epic Non-Speed Boots", fn: this.SellEpicNonSpeedBoots });
    checkers.push({ id: id++, label: "Check CD Gloves", fn: this.SellMostCDGloves });
    checkers.push({ id: id++, label: "Defensive Boots Without SPD substat", fn: this.SellDefensiveBootsWithoutSpeed });
    checkers.push({ id: id++, label: "Attack Amulets", fn: this.SellAttackAmulets });
    checkers.push({ id: id++, label: "Defensive Rings w/o 2 good substats", fn: this.SellDefenseRingWithoutTwoGoodSubstats });
    checkers.push({ id: id++, label: "Defensive Rings w/o Defensive substats", fn: this.SellDefensiveRingWithoutDefensiveSubstats });
    checkers.push({ id: id++, label: "Non-Lego ring w/2 bad substats", fn: this.SellNonLegoRingWith2BadSubstats });
    checkers.push({ id: id++, label: "Under 5 stars", fn: this.SellUnder5Stars });
    checkers.push({ id: id++, label: "bottom row flat HP/ATK/DEF", fn: this.SellBottomRowFlatMainStat });
    // map from checkerid to whether enabled. Not an array to be fancy:
    var checkedByCheckerId = {};
    checkers.forEach((checker) => {
      checkedByCheckerId[checker.id] = false;
    });
    this.state = {
      'checkWornGear': false, // doesn't count against the limit
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId,
      'numberer': new Numberer()
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
        <div><Switch size="small" checked={cur} onChange={(checked, e) => { this.onFilterChange(checked, checker) }}></Switch>&nbsp;{checker.label ? checker.label : checker.id}</div>
      </Col>)
    });
    if (curCols.length > 0) {
      rows.push(<Row>{curCols}</Row>);
    }

    const divStyle = { "text-align": "left" };
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

  render() {
    if (!this.props.artifacts || this.props.artifacts.length === 0) {
      return (<div><span>No artifacts to show</span></div>);
    }
    var numberer = this.state.numberer;
    var formatter = new Formatter();
    const columns = [
      {
        title: 'Rank',
        dataIndex: 'rank',
        key: 'rank',
        sorter: (a, b) => a.rank - b.rank,
      },
      {
        title: 'Rarity',
        dataIndex: 'rarity',
        key: 'rarity',
        sorter: (a, b) => numberer.Rarity(a.rarity) - numberer.Rarity(b.rarity),
      },
      {
        title: 'Kind',
        dataIndex: 'kind',
        key: 'kind',
        sorter: (a, b) => numberer.ArtifactKind(a.kind) - numberer.ArtifactKind(b.kind)
      },
      {
        title: 'Set',
        dataIndex: 'setKind',
        key: 'setKind',
        sorter: (a, b) => a.setKind.localeCompare(b.setKind)
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        sorter: (a, b) => a.level - b.level
      },
      {
        title: 'Main Stat',
        dataIndex: 'primary',
        key: 'primary',
        render: (stats, record, index) => (
          <div>{formatter.Stat(stats)}</div>
        )
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
        title: 'Faction',
        dataIndex: 'requiredFraction',
        key: 'faction',
        render: (factionKey) => formatter.Faction(factionKey),
        sorter: (a, b) => {
          var aFaction = a.requiredFraction ? a.requiredFraction : "";
          var bFaction = b.requiredFraction ? b.requiredFraction : "";
          return aFaction.localeCompare(bFaction);
        }
      },
      {
        title: 'Wearer',
        dataIndex: 'wearer',
        key: 'wearer',
        render: (champion) => (champion && champion.name) ? champion.name : '',
        sorter: (a, b) => {
          if (!a.wearer && !b.wearer) return 0;
          // sorting on id works, but is non-intuitive.
          // instead use name.
          var aName = (a && a.wearer && a.wearer.name) ? a.wearer.name : "";
          var bName = (b && b.wearer && b.wearer.name) ? b.wearer.name : "";
          return aName.localeCompare(bName);
        }
      },
      {
        title: 'Why',
        dataIndex: 'why',
        key: 'why',
        sorter: (a, b) => {
          console.log(a.why + "..." + b.why)
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
                rank: numberer.Rank(artifact.rank),
                rarity: artifact.rarity,
                kind: artifact.kind,
                setKind: formatter.SetName(artifact.setKind),
                level: artifact.level,
                requiredFraction: artifact.requiredFraction,
                primary: artifact.primaryBonus,
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