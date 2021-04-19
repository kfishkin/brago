import React from 'react';
import { Row, Col } from 'antd';
import arenaConfig from './config/arena.json';
import Formatter from './Formatter';

//
// props:
// arenaKey key into the various arena levels.
class Arena extends React.Component {

    showArenaUI(arenaKey) {
        var levels = [];
        const LEVELS_PER_ROW = 4;
        var span_per_level = 24 / LEVELS_PER_ROW; // 24 from Ant.
        var rowCells = [];

        var rowNum = 1;
        arenaConfig.levels.forEach((arenaLevel) => {
            var isNow = (arenaKey === arenaLevel.jsonKey);
            var className = isNow ? "arena_current_level" : "arena_level"

            if (rowCells.length >= LEVELS_PER_ROW) {
                // finish it off.
                levels.push(<Row key={rowNum}>{rowCells} </Row>);
                // and start a new one.
                rowCells = [];
                rowNum++;
            }
            rowCells.push(
                <Col span={span_per_level} key={arenaLevel.key}>
                    <div className={className}>
                        <img src={arenaLevel.icon} alt={arenaLevel.label} />
                        <br />
                        <span clas="arena_label">{arenaLevel.label}</span>
                    </div ></Col>);
        });
        if (rowCells.length > 0) {
            // finish it off.
            levels.push(<Row key={rowNum}>{rowCells} </Row>);
            // and start a new one.
            rowCells = [];
        }
        return (<div><div>{levels}</div><div>{this.showArenaBonuses(arenaKey)}</div></div>);
    }

    showArenaBonuses(arenaKey) {
        if (!arenaKey) {
            return null;
        }
        var bonuses = [];
        arenaConfig.levels.some((arenaLevel) => {
            if (arenaLevel.jsonKey === arenaKey) {
                bonuses = arenaLevel.bonuses;
                return true;
            }
            return false;
        });
        if (!bonuses) return null;
        var bonusText = "Bonuses: ";
        bonuses.forEach((bonusDict, index) => {
            if (index !== 0) {
                bonusText += ", ";
            }
            var formatter = new Formatter();
            bonusText += formatter.Bonus(bonusDict);
        });
        return (<div><span>{bonusText}</span></div>);
    }

    showArenaHeader(arenaKey, arenaLabel) {
        if (!arenaKey) {
            return (<h2>No arena level specified.</h2>);
        }
        return (<div><h2>You are at arena level {arenaLabel}</h2>
            {this.showArenaBonuses(arenaKey)}
        </div>);
    }
    render() {
        var arenaKey = null;
        var arenaLabel = null;
        var keyIn = this.props.arenaKey.toLowerCase();
        arenaConfig.levels.some((arenaLevel) => {
            if (arenaLevel.jsonKey === keyIn) {
                arenaKey = keyIn;
                arenaLabel = arenaLevel.label;
                return true;
            }
            return false;
        });
        return (
            <div>
                {this.showArenaHeader(arenaKey, arenaLabel)}
                {this.showArenaUI(arenaKey)}
            </div>
        );
    }
}

export default Arena;