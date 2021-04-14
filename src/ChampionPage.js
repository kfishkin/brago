import React from 'react';
import { Table } from 'antd';
import Comparer from './Comparer';
import Formatter from './Formatter';
import Numberer from './Numberer';

class ChampionPage extends React.Component {
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
  render() {
    var formatter = new Formatter();
    var numberer = new Numberer();
    var comparer = new Comparer();
    if (!this.props.champions || this.props.champions.length === 0) {
      return (<div><span>No champions to show</span></div>);
    }

    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a, b) => comparer.Champions(a, b),
      },
      {
        title: 'Faction',
        dataIndex: 'faction',
        key: 'faction',
        render: (factionKey) => formatter.Faction(factionKey),
        sorter: (a, b) => {
          var aFaction = a.faction ? a.faction : "";
          var bFaction = b.faction ? b.faction : "";
          return aFaction.localeCompare(bFaction);
        }
      },
      {
        title: 'Rank',
        dataIndex: 'grade',
        key: 'grade',
        sorter: (a, b) => a.grade - b.grade,
      },
      {
        title: 'Affinity',
        dataIndex: 'element',
        key: 'element',
        sorter: (a, b) => a.element.localeCompare(b.element)
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        sorter: (a, b) => a.level - b.level,
      },
      {
        title: 'In Vault?',
        dataIndex: 'inStorage',
        key: 'inStorage',
        sorter: (a, b) => a.inStorage - b.inStorage,
        render: (inStorage) => (inStorage ? "YES" : "NO")
      },
      {
        title: 'Artifacts',
        dataIndex: 'artifacts',
        key: 'artifacts',
        render: (artifacts) => this.renderWornArtifacts(artifacts)
      }
    ];
    const dataByRows = [
    ];

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
      //console.log("artifacts = " + artifacts);
      var rowData = {
        key: champion.id,
        id: champion.id,
        // sometimes we get champions with no name, odd
        name: champion.name ? champion.name : "no name: id " + champion.id,
        faction: champion.fraction,
        grade: numberer.RankFromStars(champion.grade),
        element: champion.element,
        level: champion.level,
        inStorage: champion.inStorage,
        artifacts: artifacts
      };

      dataByRows.push(rowData);

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
        <h3>There are {dataByRows.length} Champions.</h3>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div >
    );
  }
}

export default ChampionPage;