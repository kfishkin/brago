import React from 'react';
import Formatter from './Formatter';
import { Button, Select } from 'antd';

const { Option } = Select;

/**
 * Lets the user specify a rank.
 * 
 * props:
 * initial - initial value.
 * is_lower_bound - is this a lower bound?
 * reporter - F(new value, new is_lower), called when value changes.
 */


class RankSpecifier extends React.Component {
    onSelect(value) {
        if (this.props.reporter) {
            this.props.reporter(value, this.props.is_lower_bound);
        }
    }

    onChangeBound() {
        if (this.props.reporter) {
            this.props.reporter(this.props.initial, !this.props.is_lower_bound);
        }
    }

    render() {
        var formatter = new Formatter();
        var options = [];
        for (let rank = 1; rank <= 6; rank++) {
            options.push(<Option key={rank} value={rank}>{formatter.Rank(rank)}</Option>);
        }
        // stop propagation to keep clicking from changing the sort order.
        var initialAsNum = parseInt(this.props.initial);
        // >= and <=, respectively
        var ch = String.fromCharCode(this.props.is_lower_bound ? 8805 : 8804);
        return (
            <div style={{ display: 'inline-block' }}>
                <span>
                    Rank
                </span>

                <Button className="is_lower_bound" type="text"
                    onClick={(e) => {
                        e.stopPropagation();
                        this.onChangeBound();
                    }}>
                    {ch}
                </Button>
                <Select className="rank_specifier" onClick={(e) => {
                    e.stopPropagation();
                }} defaultValue={initialAsNum} onSelect={(value) => this.onSelect(value)}>
                    {options}
                </Select>
            </div>
        )
    }
}

export default RankSpecifier;