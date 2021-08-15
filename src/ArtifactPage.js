import React from 'react';
import { Table } from 'antd';
import Comparer from './Comparer';
import Numberer from './Numberer';
import Formatter from './Formatter';

class ArtifactPage extends React.Component {
  render() {
    if (!this.props.artifacts || this.props.artifacts.length === 0) {
      return (<div><span>No artifacts to show</span></div>);
    }
    var numberer = new Numberer();
    var formatter = new Formatter();
    var comparer = new Comparer();
    const columns = [
      {
        title: 'Rank',
        dataIndex: 'rank',
        key: 'rank',
        sorter: (a, b) => comparer.ArtifactByRank(a, b),
      },
      {
        title: 'Rarity',
        dataIndex: 'rarity',
        key: 'rarity',
        sorter: (a, b) => comparer.ArtifactByRarity(a, b),
      },
      {
        title: 'Kind',
        dataIndex: 'kind',
        key: 'kind',
        sorter: (a, b) => comparer.ArtifactByKind(a, b)
      },
      {
        title: 'Set',
        dataIndex: 'setKind',
        key: 'setKind',
        sorter: (a, b) => comparer.ArtifactBySetKind(a, b)
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
      },
      {
        title: 'Main Stat',
        dataIndex: 'primary',
        key: 'primary',
        render: (stats, record, index) => (
          <div>{formatter.Stat(stats, 0)}</div>
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
          return comparer.Champions(a.wearer, b.wearer);
        }
      }

    ];
    const dataByRows = [
    ];

    this.props.artifacts.forEach((artifact) => {
      var rowData = {
        key: artifact.id,
        rank: numberer.Rank(artifact.rank),
        rarity: artifact.rarity,
        kind: artifact.kind,
        setKind: artifact.setKind,
        level: artifact.level,
        requiredFraction: artifact.requiredFraction,
        primary: artifact.primaryBonus,
        subStats: artifact.secondaryBonuses,
        wearer: artifact.wearer

      };
      if (artifact.isSeen) {
        dataByRows.push(rowData);
      }

    });
    const paginationConfig = false;
    return (
      <div className="runed_rows">
        <h3>There are {dataByRows.length} artifacts.</h3>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div>
    );
  }
}

export default ArtifactPage;