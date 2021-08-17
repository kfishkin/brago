import React from 'react';
import { Slider } from 'antd';


/**
 * Lets the user specify a 'Range' of values.
 * A thin wrapper around the ant 'slider'.
 * 
 * props:
 * intro - text to put to the left of the widget.
 * opts - a dictionary, expanded into properties for the
 * widget as per https://ant.design/components/slider/
 * reporter - F([new_min, new_max]), called when value changes.
 */


class RangeSpecifier extends React.Component {
    onChange(value) {
        //console.log('rangeSpecifier', value);
        if (this.props.reporter) {
            this.props.reporter(value);
        }
    }

    render() {
        var options = this.props.opts ? this.props.opts : {};
        return (
            <div style={{ display: 'inline-block', height: '1.75em' }}>
                <span>
                    {this.props.intro}
                </span>
                <Slider className="range_specifier" onChange={(v) => {
                    this.onChange(v)
                }} range
                    {...options} />
            </div>
        )
    }
}

export default RangeSpecifier;