import React from 'react';
import { InputNumber, Table } from 'antd';
import greatHallConfig from './config/great_hall.json';
import Formatter from './Formatter';

// props:
// reporter - call to report new data
// 
class GreatHall extends React.Component {
    // the GreatHall owns the column specs
    constructor(props) {
        super(props);
        this.state = {
            columns: [],
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
                render: (imgName, record, index) => (
                    <img alt={record.label} src={process.env.PUBLIC_URL + imgName} />
                )
            }
        ];
        greatHallConfig.columns.forEach((columnSpec) => {
            columns.push(
                {
                    key: columnSpec.key,
                    title: columnSpec.label,
                    dataIndex: columnSpec.key,
                    render: (value, record, index) => (
                        <div><InputNumber min={0} max={10} precision={0} value={value}
                            onChange={(value) => this.handleCellChange(value, columnSpec.key, record.key)} />
                            {this.showBonus(columnSpec.key, value)}</div>
                    )
                }
            )
        });
        this.setState({ columns: columns });

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
    handleCellChange(value, attr, affinity) {
        this.props.reporter(affinity, attr, value);
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
        greatHallConfig.rows.forEach((bundle, index) => {
            var rowData = {
                key: bundle.key,
                icon: bundle.icon,
                label: bundle.label
            };
            greatHallConfig.columns.forEach((colBundle) => {
                var attr = colBundle.key;
                if (this.props.greatHallData && this.props.greatHallData.length > index) {
                    var rowDataIn = this.props.greatHallData[index];
                    rowData[attr] = (attr in rowDataIn) ?
                        rowDataIn[attr] : 0;
                } else {
                    rowData[attr] = 0;
                }
            });
            dataByRows.push(rowData);
        });
        // squirrel this away:
        //this.setState({ dataByRows: dataByRows });
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
