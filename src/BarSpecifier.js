import React from 'react';
import { Button, Select } from 'antd';

const { Option } = Select;

/**
 * Lets the user specify a 'bar' that things should be <= or >= to.
 * 
 * props:
 * intro - text to put to the left of the widget.
 * initial - initial value.
 * is_lower_bound - is this a lower bound?
 * labels - maps from key to label to show
 * reporter - F(new value, new is_lower), called when value changes.
 */


class BarSpecifier extends React.Component {
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
        var options = [];
        this.props.keys.forEach((key) => {
            options.push(<Option key={key} value={key}>{this.props.labels[key]}</Option>);
        })
        // stop propagation to keep clicking from changing the sort order.
        var initialAsNum = parseInt(this.props.initial);
        // >= and <=, respectively
        var ch = String.fromCharCode(this.props.is_lower_bound ? 8805 : 8804);
        return (
            <div style={{ display: 'inline-block', height: '1.75em' }}>
                <span>
                    {this.props.intro}
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
                }} value={initialAsNum} onSelect={(value) => this.onSelect(value)}>
                    {options}
                </Select>
            </div>
        )
    }
}

export default BarSpecifier;