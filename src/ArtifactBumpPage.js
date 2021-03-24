import React from 'react';
import { Table } from 'antd';
import Numberer from './Numberer';
import Formatter from './Formatter';

class ArtifactBumpPage extends React.Component {
  constructor(props) {
    super(props);
    // the VP gains. 2D array
    // 1st D: the index is the (number of stars) -1.
    // 2nd D: the index is the (new level / 4) - 1.
    var vpGains = [
      [1, 2, 3, 20], // 1 star
      [1, 2, 4, 80], // 2 star
      [1, 3, 15, 165], // 3 star
      [1, 3, 30, 215], // 4 star
      [2, 5, 40, 270], // 5 star
      [3, 10, 65, 340] // 6 star
    ];
    this.state = {
      'vpGains': vpGains
    }
  }

  victoryPointsFor(rank, level) {
    //console.log('rank = ' + rank + ', level = ' + level);
    var row = this.state.vpGains[rank - 1];
    var nextLevel = (level + 3) >> 2;
    var vp = row[nextLevel - 1];
    return vp;
  }

  render() {
    if (!this.props.artifacts || this.props.artifacts.length === 0) {
      return (<div><span>No artifacts to show</span></div>);
    }
    var numberer = new Numberer();
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
      }

    ];
    const dataByRows = [
    ];
    var vpGain = 0;

    this.props.artifacts.forEach((artifact) => {
      if (artifact.isSeen) {
        if ((artifact.level % 4) !== 0) {
          var rowData = {
            key: artifact.id,
            rank: numberer.Rank(artifact.rank),
            rarity: artifact.rarity,
            kind: artifact.kind,
            setKind: formatter.SetName(artifact.setKind),
            level: artifact.level,
            requiredFraction: artifact.requiredFraction,
            primary: artifact.primaryBonus,
            subStats: artifact.secondaryBonuses,
            wearer: artifact.wearer

          };
          vpGain += this.victoryPointsFor(rowData.rank, rowData.level);
          dataByRows.push(rowData);
        }
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
        <h3>There are {dataByRows.length} artifacts to bump.</h3>
        <p>You could gain <b>{vpGain}</b> VPs if you bump them all.</p>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div>
    );
  }
}

export default ArtifactBumpPage;