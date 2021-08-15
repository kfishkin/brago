import React from 'react';
import arenaConfig from './config/arena.json';
import Formatter from './Formatter';

//
// props:
// arenaKey key into the various arena levels.
class Arena extends React.Component {

    showArenaUI(arenaKey) {
        var levels = [];
        arenaConfig.levels.some((arenaLevel) => {
            var isNow = (arenaKey === arenaLevel.jsonKey);
            if (!isNow) {
                return false;
            }
            var className = isNow ? "arena_current_level" : "arena_level"
            levels.push(
                <div className={className}>
                    <img src={arenaLevel.icon} alt={arenaLevel.label} />
                    <br />
                    <span className="arena_label">{arenaLevel.label}</span>
                </div >);
            return true;
        });
        return (<div>{levels}<div>{this.showArenaBonuses(arenaKey)}</div></div>);
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
            bonusText += formatter.Bonus(bonusDict, 0);
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