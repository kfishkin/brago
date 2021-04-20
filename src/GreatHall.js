import React from 'react';
import { Table } from 'antd';
import greatHallConfig from './config/great_hall.json';
import Formatter from './Formatter';

// props:
// greatHallLevels - hash maps from affinities to hash maps from attributes to values.
// 
class GreatHall extends React.Component {
    // the GreatHall owns the column specs
    constructor(props) {
        super(props);
        this.state = {
            columns: [],
            formatter: new Formatter(),
            // transform the color scheme depending on level:
            levelFilters: [
                "hue-rotate(177deg) saturate(1.00) brightness(0.55)", // black
                "none", // keep brown brown
                "none",
                "none",
                "hue-rotate(183deg) saturate(2.57) brightness(0.78)", // blue
                "hue-rotate(183deg) saturate(2.57) brightness(0.78)",
                "hue-rotate(183deg) saturate(2.57) brightness(0.78)",
                "hue-rotate(39deg) saturate(2.93) brightness(1.37)", // gold
                "hue-rotate(39deg) saturate(2.93) brightness(1.37)",
                "hue-rotate(39deg) saturate(2.93) brightness(1.37)",
                "hue-rotate(39deg) saturate(2.93) brightness(1.37)"
            ]
        }

    }
    componentDidMount() {
        // initialize the great hall columns from the config data.
        // each column has these fields:
        // title: the header text
        // dataIndex: field in (dataByRows) to reference
        // render: knows how to render that column for that data.
        const columns = [
            {
                title: 'Affinity',
                dataIndex: 'icon',
                key: 'icon',
                render: (imgName, record) => (
                    this.state.formatter.Image(imgName, record.label)
                )
            }
        ];
        greatHallConfig.columns.forEach((columnSpec) => {
            columns.push(
                {
                    key: columnSpec.key,
                    title: columnSpec.label,
                    dataIndex: columnSpec.key,
                    render: (value) => this.renderHallRune(columnSpec, value)
                }
            )
        });
        this.setState({ columns: columns });

    }

    renderHallRune(columnSpec, value) {
        var bonus = (columnSpec.bonuses && value >= 1) ? columnSpec.bonuses[value - 1] : null;
        var bonusMsg = bonus ? this.state.formatter.BonusAmount(bonus.isAbsolute, bonus.value) : null;
        var filterText = this.state.levelFilters[value];
        return (
            <div className="great_hall_rune">
                <div className="container">
                    {this.state.formatter.Image(columnSpec.icon, value,
                        { className: "great_hall_icon", style: { "filter": filterText } })}
                    <div className="floats_above hall_level_overlay">{value}/10</div>
                    <div className="floats_above hall_bonus_overlay">{bonusMsg}</div>
                </div>
            </div>
        )
    }

    showBonus(colKey, value) {
        var colSpec = null;
        greatHallConfig.columns.some((aColSpec) => {
            if (aColSpec.key === colKey) {
                colSpec = aColSpec;
                return true;
            }
            return false;
        });
        if (colSpec === null) {
            return (null);
        }
        var bonus = null;


        colSpec.bonuses.some((aBonus) => {
            if (aBonus.level === value) {
                bonus = aBonus;
                return true;
            }
            return false;
        });
        if (bonus === null) {
            return (null);
        }
        var formatter = new Formatter();
        var txt = formatter.BonusAmount(bonus.isAbsolute, bonus.value);
        return (<span><i>&nbsp;{txt}</i></span>);
    }

    // return the row data
    makeRowData() {
        // each row of data has these fields:
        // icon - used at the left edge.
        // <X> - value of attribute X (hp, def, etc.).
        // label - alt text in first column.
        // then (n) fields, one for each attribute.
        const dataByRows = [
        ];
        var levels = this.props.greatHallLevels;
        greatHallConfig.rows.forEach((bundle, index) => {
            var affinity = bundle.key;
            var rowData = {
                key: bundle.key,
                icon: bundle.icon,
                label: bundle.label
            };
            greatHallConfig.columns.forEach((colBundle) => {
                var attr = colBundle.key;
                var level = (levels && levels[affinity]) ? levels[affinity][attr] : 0;
                rowData[attr] = level;
            });
            dataByRows.push(rowData);
        });
        return dataByRows;
    }

    dumpAsTable() {
        return (<Table pagination={false} dataSource={this.makeRowData()} columns={this.state.columns} />);

    }
    render() {
        return (
            <div>
                {this.dumpAsTable()}
            </div>
        );
    }
}

export default GreatHall;
