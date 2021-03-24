import React from 'react';
import { Row, Col } from 'antd';
import arenaConfig from './config/arena.json';
import Formatter from './Formatter';

class Arena extends React.Component {

    showArenaUI(arenaData) {
        var levels = [];
        const LEVELS_PER_ROW = 4;
        var span_per_level = 24 / LEVELS_PER_ROW; // 24 from Ant.
        var rowCells = [];

        var rowNum = 1;
        arenaConfig.levels.forEach((arenaLevel, index) => {
            var isNow = arenaData != null
                && arenaData.key
                && arenaData.key === arenaLevel.key;
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
                    <div className={className}
                        onClick={() => this.onLevelClick(arenaLevel)}>
                        <img src={arenaLevel.icon} alt={arenaLevel.label} />
                        <br />
                        <span clas="arena_label">{arenaLevel.label}</span>
                    </div ></Col>);

            /*
            levels.push(
                <div className={className}
                    onClick={() => this.onLevelClick(arenaLevel)}>
                    <img src={arenaLevel.icon} alt={arenaLevel.label} />
                    <br />
                    <span clas="arena_label">{arenaLevel.label}</span>
                </div >
            )
            */

        });
        if (rowCells.length > 0) {
            // finish it off.
            levels.push(<Row key={rowNum}>{rowCells} </Row>);
            // and start a new one.
            rowCells = [];
        }
        return (<div><div>{levels}</div><div>{this.showArenaBonuses(arenaData)}</div></div>);
    }

    onLevelClick(newLevel) {
        if (!newLevel) return;
        if (this.props.arenaLevel && this.props.arenaLevel.key
            && this.props.arenaLevel.key === newLevel.key) return;
        this.props.reporter(newLevel);
    }

    showArenaBonuses(arenaLevel) {
        if (!arenaLevel || !arenaLevel.bonuses) {
            return null;
        }
        var bonusText = "Bonuses: ";
        arenaLevel.bonuses.forEach((bonusDict, index) => {
            if (index !== 0) {
                bonusText += ", ";
            }
            var formatter = new Formatter();
            bonusText += formatter.Bonus(bonusDict);
        });
        return (<div><span>{bonusText}</span></div>);
    }

    showArenaHeader(arenaLevel) {
        if (!arenaLevel || !arenaLevel.key) {
            return (<h2>Pick your arena level</h2>);
        }
        return (<div><h2>You are at arena level {arenaLevel.label}</h2>
            {this.showArenaBonuses(arenaLevel)}
        </div>);
    }
    render() {
        return (
            <div>
                {this.showArenaHeader(this.props.arenaLevel)}
                {this.showArenaUI(this.props.arenaLevel)}
            </div>
        );
    }
}

export default Arena;