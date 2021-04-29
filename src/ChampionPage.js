import React from 'react';
import Comparer, { DIMENSION_NONE } from './Comparer';
import Formatter from './Formatter';
import Numberer from './Numberer';
import { Col, Row, Switch, Table, Tooltip } from 'antd';
import ArtifactDimensionChooser from './ArtifactDimensionChooser';
import ChampionRune from './ChampionRune';
import BarSpecifier from './BarSpecifier';
import artifactTypeConfig from './config/artifact_types.json';
import attributesConfig from './config/attributes.json';
import markersConfig from './config/markers.json';
import TotalStatsCalculator, { TOTALS_COLUMN } from './TotalStatsCalculator';

const RANK_INTRO = "Rank";
const RANK_KEYS = [1, 2, 3, 4, 5, 6];
const AFFINITY_INTRO = "Affinity";
// not worth it to make a config file out of this, yet:
// in the order shown when 'view by affinity' done in the app
const AFFINITY_KEYS = ["void", "force", "magic", "spirit"];
const AFFINITY_LABELS = {
  void: "Void", force: "Force",
  magic: "Magic", spirit: "Spirit"
};
// the display looks off if you don't give an initial value
const AFFINITY_INITIAL = "force";

const VAULT_INTRO = "Vaulted";
const VAULT_KEYS = ["no", "yes"];
const VAULT_LABELS = { "no": "No", "yes": "Yes" };
const VAULT_INITIAL = "no";

const MARKER_INTRO = "Marker";
const MARKER_INITIAL = "None";

const DONT_DISPLAY = "Uninteresting";

// props:
// newTotalStatsReporter - called when I I compute new total stats.
class ChampionPage extends React.Component {
  constructor(props) {
    super(props);
    const INITIAL_RANK_BAR = 4;
    const STARTING_IS_LOWER_BOUND = true;
    // all the checkers for what to display.
    // a checker is a function that takes a champion JSON blob,
    // and returns a string indicating why to display it - null if not.
    var checkers = [];
    var id = 0;
    var rankLabels = {};
    var formatter = new Formatter();
    RANK_KEYS.forEach((rank) => {
      rankLabels[rank] = formatter.Rank(rank);
    });
    this.state = {
      affinityBar: AFFINITY_INITIAL,
      rankBar: INITIAL_RANK_BAR,
      is_lower_bound: STARTING_IS_LOWER_BOUND,
      vaultBar: VAULT_INITIAL,
      markerBar: MARKER_INITIAL
    };
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        intro: RANK_INTRO,
        reporter: (v, b) => this.onRankBarChange(v, b),
        keys: RANK_KEYS,
        labels: rankLabels,
        // some of the bar attributes must be derived at render-time, not now.
        // do this by making a function, evaluated at render-time, which returns
        // (key, value) attributes for the bar specifier.
        dynamic: () => { return { 'initial': this.state.rankBar, 'is_lower_bound': this.state.is_lower_bound } },
      }),
      fn: this.CheckRank,
    });
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_exact: true,
        reporter: ((v, b) => this.onAffinityBarChange(v, b)),
        intro: AFFINITY_INTRO,
        keys: AFFINITY_KEYS,
        labels: AFFINITY_LABELS,
        dynamic: () => { return { 'initial': this.state.affinityBar } }
      }),
      fn: this.CheckAffinity
    });
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_exact: true,
        reporter: ((v, b) => this.onVaultBarChange(v, b)),
        intro: VAULT_INTRO,
        keys: VAULT_KEYS,
        labels: VAULT_LABELS,
        dynamic: () => { return { 'initial': this.state.vaultBar } }
      }),
      fn: this.CheckVault
    });
    var markerKeys = [];
    var markerLabels = {};
    markersConfig.markers.forEach((markerSpec) => {
      markerKeys.push(markerSpec.key);
      markerLabels[markerSpec.key] = markerSpec.label;
    });
    checkers.push({
      id: id++,
      labelInfo: this.makeLabelInfo({
        is_exact: true,
        reporter: ((v, b) => this.onMarkerBarChange(v, b)),
        intro: MARKER_INTRO,
        keys: markerKeys,
        labels: markerLabels,
        dynamic: () => { return { 'initial': this.state.markerBar } }
      }),
      fn: this.CheckMarker
    });
    checkers.push({
      id: id++, label: "has a dupe",
      labelInfo: this.makeLabelInfo("has a dupe"),
      fn: this.CheckHasDupe
    });
    checkers.push({
      id: id++, label: "under-ascended",
      labelInfo: this.makeLabelInfo("under-ascended"),
      ttip: "fewer ascensions than rank", fn: this.CheckUnderAscended
    });
    checkers.push({
      id: id++, label: "missing armor",
      labelInfo: this.makeLabelInfo("missing armor"),
      ttip: "empty armor slot", fn: this.CheckMissingArmor
    });
    checkers.push({
      id: id++, label: "inferior gear rank",
      labelInfo: this.makeLabelInfo("inferior gear rank"),
      ttip: "gear 2 or more stars below the champion", fn: this.CheckInferiorGear
    });
    checkers.push({
      id: id++, label: "inferior gear rarity",
      labelInfo: this.makeLabelInfo("inferior gear rarity"),
      ttip: "gear < Rare", fn: this.CheckInferiorRarity
    });
    checkers.push({
      id: id++, label: "glyph-able worn artifact",
      labelInfo: this.makeLabelInfo("glyph-able worn artifact"),
      ttip: "worn artifact with an attribute that is glyph-able, but isn't", fn: this.CheckGlyphable
    });
    checkers.push({
      id: id++, label: "missing accessory",
      labelInfo: this.makeLabelInfo("missing accessory"),
      ttip: "fillable accessory slot", fn: this.CheckMissingAccessory
    });


    var checkedByCheckerId = {};
    checkers.forEach((checker) => {
      var v = (checker.fn === this.CheckVault);
      checkedByCheckerId[checker.id] = v;
    });

    var attributesByKey = {};
    attributesConfig.attributes.forEach((attrSpec) => {
      var key = attrSpec.jsonKey;
      attributesByKey[key] = attrSpec;
      attributesByKey[key.toLowerCase()] = attrSpec;
    });
    this.state = Object.assign(this.state, {
      'checkers': checkers,
      'checkedByCheckerId': checkedByCheckerId,
      attributesByKey: attributesByKey,
      includeTotalStats: false,
      championDimension: DIMENSION_NONE
    });
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
    } else {  // assume a BarSpecifier, could add more later.
      return { 'bar': info };
    }
  }

  onRankBarChange(v, is_lower_bound) {
    this.setState({
      rankBar: v,
      is_lower_bound: is_lower_bound
    });
  }

  onAffinityBarChange(v) {
    this.setState({
      affinityBar: v
    });
  }

  onVaultBarChange(v) {
    this.setState({
      vaultBar: v
    });
  }

  onMarkerBarChange(v) {
    this.setState({ markerBar: v });
  }

  // these guys can't refer to 'this', so extra state is passed
  // in 2nd param.
  CheckRank(champion, extra) {
    if (!champion || !champion.grade) return null;
    var numberer = new Numberer();
    var rank = numberer.RankFromStars(champion.grade);
    var rankBar = extra.rankBar;
    var passes = (extra.is_lower_bound) ? (rank >= rankBar) : (rank <= rankBar);
    return passes ? DONT_DISPLAY : null;
  }

  // these guys can't refer to 'this', so extra state is passed
  // in 2nd param.
  CheckAffinity(champion, extra) {
    if (!champion || !champion.element) return null;
    var key = champion.element.toLowerCase();
    var bar = extra.affinityBar;
    if (!bar) {
      return DONT_DISPLAY; // unset affinity bar.
    }
    var passes = (key === bar.toLowerCase());
    return passes ? DONT_DISPLAY : null;
  }

  CheckVault(champion, extra) {
    if (!champion) return null;
    var inStorage = ('inStorage' in champion) && (champion.inStorage === true);
    var bar = extra.vaultBar;
    var passes = (inStorage === (bar === "yes"));
    return passes ? DONT_DISPLAY : null;
  }

  CheckMarker(champion, extra) {
    if (!champion) return null;
    var champKey = champion.marker ? champion.marker.toLowerCase() : "";
    var bar = extra.markerBar;
    var passes = champKey === bar.toLowerCase();
    return passes ? DONT_DISPLAY : null;
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
    return (rank > ascensions) ?
      ("Rank " + rank + ", but only " + ascensions + " ascensions") : null;
  }
  CheckMissingArmor(champion, extra) {
    if (!champion) return null;
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

  CheckGlyphable(champion, extra) {
    if (!champion) return null;
    var artifacts = extra.artifacts;
    var artifactTypeMap = extra.artifactTypeMap;
    var attributesByKey = extra.attributesByKey;
    if (!artifacts) return null;

    var whys = [];
    artifacts.some((artifact) => {
      if (!artifact.secondaryBonuses) return false;
      artifact.secondaryBonuses.forEach((bonus) => {
        var attribute = bonus.kind;
        var attrSpec = attributesByKey[attribute.toLowerCase()];
        if (attrSpec && attrSpec.glyphable && bonus.enhancement < 0.001) {
          var why = artifactTypeMap[artifact.kind.toLowerCase()].label
            + ": unglyphed '"
            + attrSpec.label
            + "' bonus"
          whys.push(why);
        }
      });
      return false;
    });
    if (whys.length === 0) {
      return null;
    } else {
      return whys.join(". ");
    }
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

  CheckInferiorRarity(champion, extra) {
    var numberer = new Numberer();
    var artifacts = extra.artifacts;
    if (!artifacts) return null;
    var why = null;
    artifacts.some((artifact) => {
      var artRarity = numberer.Rarity(artifact.rarity);
      if (artRarity < 2) {
        var artifactTypeMap = extra.artifactTypeMap;
        var label = artifactTypeMap[artifact.kind.toLowerCase()].label;
        why = label + " is only rarity '" + artifact.rarity + "'";
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
      <p><b>Show champions that pass <i>all</i> these checks:</b></p>
      <hr />
      { rows}
      <hr />
    </div >);
  }

  onIncludeTotalStatsChange(checked) {
    var calculator = new TotalStatsCalculator();
    var numCalced = 0;
    var totalStats = this.props.knownChampionTotalStats;
    var t0 = Date.now();
    // takes roughly 0.4 millis per champion, so even with 500
    // champions it's only 0.2 seconds. If this was way longer
    // some notification would be called for.
    if (checked && this.props.champions && totalStats) {
      // fill in all the total stats.
      this.props.champions.some((champion) => {
        if (champion.id in totalStats) {
          return false;
        }
        //console.log('calculating for ', champion.name);
        var newStats = calculator.MakeAndBake(champion, this.props.arenaKey, this.props.greatHallLevels, this.props.artifactsById);
        totalStats[champion.id] = newStats;
        numCalced++;
        return false;
      });
    }
    var t1 = Date.now();
    console.log('computed ', numCalced, ' new stats, took', (t1 - t0), 'millis');
    if (numCalced > 0 && this.props.reportNewTotalStats) {
      this.props.reportNewTotalStats(totalStats);
    }
    this.setState({ includeTotalStats: checked });
  }

  renderDisplayModePart() {
    return (
      <div>
        Show total stats:&nbsp;&nbsp;
        <Switch size="medium" checked={this.state.includeTotalStats} onChange={(checked, e) => { this.onIncludeTotalStatsChange(checked) }}></Switch>
        <hr />
      </div>
    )
  }

  getTotalStat(attrKey, championTotalStats) {
    // if should be there as the 'value' in the first bonus
    // in the (attribte) entry
    if (!championTotalStats) return null;
    var column = championTotalStats[TOTALS_COLUMN];
    if (!column) return null;
    var bonusList = championTotalStats[TOTALS_COLUMN][attrKey.toLowerCase()];
    if (!bonusList) return null;
    return bonusList.Bonuses()[0].value;
  }

  renderTotalStat(attrKey, championTotalStats) {
    var val = this.getTotalStat(attrKey, championTotalStats);
    return val ? val : "--";
  }

  compareTotalStat(key, champ1Stats, champ2Stats) {
    var v1 = this.getTotalStat(key, champ1Stats);
    var v2 = this.getTotalStat(key, champ2Stats);
    if (!v1 && !v2) return 0;
    if (!v1) return 1;
    if (!v2) return -1;
    return v1 - v2;
  }

  addStatsColumnHeaders(columns) {
    if (!columns || !this.state.includeTotalStats) return;
    attributesConfig.attributes.forEach((attrSpec) => {
      var key = attrSpec.jsonKey;
      var headerEntry = {
        title: 'Total ' + attrSpec.label,
        key: key,
        dataIndex: 'champion_total_stats',
        render: (championTotalStats) => this.renderTotalStat(key, championTotalStats),
        sorter: (a, b) => this.compareTotalStat(key, a.champion_total_stats, b.champion_total_stats)
      };
      columns.push(headerEntry);
    });
  }

  onDimensionChange(newDimension) {
    if (newDimension === this.state.championDimension) {
      return;
    }
    this.setState({ championDimension: newDimension });
  }

  championSorter(c1, c2) {
    var comparer = new Comparer();
    return comparer.ChampionsOn(c1, c2, this.state.championDimension)
  }

  render() {
    var numberer = new Numberer();
    if (!this.props.champions || this.props.champions.length === 0) {
      return (<div><span>No champions to show</span></div>);
    }
    // must match the values in Comparer.js:
    var dimensionLabels = [
      "None",
      "Rank",
      "Rarity",
      "Level",
      "Affinity",
      "Marker",
      "Faction"
    ]

    var runeHeader = <ArtifactDimensionChooser initialValue={this.state.championDimension}
      labels={dimensionLabels}
      reporter={(value) => this.onDimensionChange(value)} />;
    var columns = [
      {
        title: runeHeader,
        dataIndex: 'champion',
        key: 'champion',
        render: (champion) => <ChampionRune champion={champion} />,
        sorter: (a, b) => { return this.championSorter(a.champion, b.champion) },
      },
      {
        title: 'Ascensions',
        dataIndex: 'awakenLevel',
        key: 'awakenLevel',
        sorter: (a, b) => a.champion.awakenLevel - b.champion.awakenLevel,
      },
      {
        title: 'In Vault?',
        dataIndex: 'inStorage',
        key: 'inStorage',
        sorter: (a, b) => a.inStorage - b.inStorage,
        render: (inStorage) => (inStorage ? "YES" : "NO")
      }];
    if (this.state.includeTotalStats)
      this.addStatsColumnHeaders(columns);
    columns.push(
      {
        title: 'Why',
        dataIndex: 'why',
        key: 'why'
      });
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
      var extra = {
        artifacts: artifacts,
        championCounts: championCounts,
        artifactTypeMap: artifactTypeMap,
        rankBar: this.state.rankBar,
        is_lower_bound: this.state.is_lower_bound,
        attributesByKey: this.state.attributesByKey,
        affinityBar: this.state.affinityBar,
        vaultBar: this.state.vaultBar,
        markerBar: this.state.markerBar
      }
      var whys = [];
      this.state.checkers.some((checker) => {
        if (this.state.checkedByCheckerId[checker.id]) {
          var why = checker.fn(champion, extra);
          if (!why) {
            passesAll = false;
            return true; // end the loop
          } else {
            if (DONT_DISPLAY !== why) {
              whys.push(why);
            }
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
          champion_total_stats: this.props.knownChampionTotalStats ?
            this.props.knownChampionTotalStats[champion.id] : null,
          why: whys.join(',')
        };
        dataByRows.push(rowData);
      }
    });

    const paginationConfig = false;
    return (
      <div>
        <h3>There are {dataByRows.length} Champions.</h3>
        {this.renderSelectorPart()}
        {this.renderDisplayModePart()}
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div >
    );
  }
}

export default ChampionPage;