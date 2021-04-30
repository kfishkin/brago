import React from 'react';
import { Table } from 'antd';
import Comparer from './Comparer';
import Numberer from './Numberer';
import Formatter from './Formatter';
import ArtifactDimensionChooser from './ArtifactDimensionChooser';
import ArtifactRune from './ArtifactRune';
import ChampionRune from './ChampionRune';

import {
  DIMENSION_NONE,
} from './Comparer';

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
    var comparer = new Comparer();
    this.state = {
      'vpGains': vpGains,
      artifactDimension: DIMENSION_NONE,
      'numberer': new Numberer(),
      'comparer': comparer
    }

  }

  onDimensionChange(newDimension) {
    if (newDimension === this.state.artifactDimension) {
      return;
    }
    this.setState({ artifactDimension: newDimension });
  }

  victoryPointsFor(rank, level) {
    //console.log('rank = ' + rank + ', level = ' + level);
    var row = this.state.vpGains[rank - 1];
    var nextLevel = (level + 3) >> 2;
    var vp = row[nextLevel - 1];
    return vp;
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
    var numberer = new Numberer();
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
        render: (subStats) => (
          <div>{formatter.Substats(subStats)}</div>
        )
      },
      {
        title: 'Wearer',
        dataIndex: 'wearer',
        key: 'wearer',
        render: (champion) => {
          return <ChampionRune champion={champion} />
        },
        sorter: (a, b) => {
          return this.state.comparer.Champions(a.wearer, b.wearer);
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
            subStats: artifact.secondaryBonuses,
            wearer: artifact.wearer,
            artifact: artifact
          };
          vpGain += this.victoryPointsFor(numberer.Rank(artifact.rank), artifact.level);
          dataByRows.push(rowData);
        }
      }

    });
    const paginationConfig = false;
    return (
      <div className="runed_rows">
        <h3>There are {dataByRows.length} artifacts to bump.</h3>
        <p>You could gain <b>{vpGain}</b> VPs if you bump them all.</p>
        <Table pagination={paginationConfig} dataSource={dataByRows} columns={columns} />
      </div>
    );
  }
}

export default ArtifactBumpPage;