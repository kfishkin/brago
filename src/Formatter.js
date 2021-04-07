
import factionConfig from './config/factions.json';
import artifactSetsConfig from './config/artifact_sets.json';

class Formatter {
    constructor(props) {
        var factionsByKey = {};
        factionConfig.factions.forEach((faction) => {
            factionsByKey[faction.key] = faction;
        });
        var setsByJsonKey = {}
        artifactSetsConfig.sets.forEach((setSpec) => {
            if ('jsonKey' in setSpec) {
                setsByJsonKey[setSpec.jsonKey] = setSpec;
            }
        });
        this.state = {
            factionsByKey: factionsByKey,
            setsByJsonKey: setsByJsonKey
        }
    }

    MoreReadableNumber(num) {
        var suffixes = ["thousand", "million", "billion"];
        var suffix = "";
        for (let i = 0; i < suffixes.length; i++) {
            if (num < 1000) break;
            num /= 1000;
            suffix = suffixes[i];
        }
        return [Math.round(num), suffix];
    }

    SetName(setKey) {
        if (setKey in this.state.setsByJsonKey) {
            return this.state.setsByJsonKey[setKey].label;
        } else {
            return setKey;
        }
    }

    Faction(factionKey) {
        var factionDict = this.state.factionsByKey[factionKey];
        if (!factionDict) {
            return factionKey;
        }
        return <img key={factionKey} src={process.env.PUBLIC_URL + factionDict.icon}
            alt={factionDict.label}
            title={factionDict.label} />;
    }

    Attribute(key) {
        var attributeNames = {
            'hp': 'HP',
            'atk': 'ATK',
            'def': 'DEF',
            'cd': 'C.DMG',
            'cr': 'C.RATE',
            'res': 'RES',
            'acc': 'ACC',
            'glyph': ''
        };
        return (key in attributeNames) ? attributeNames[key] : key;

    }

    BonusAmount(isAbsolute, amount) {
        if (isAbsolute) {
            return '+' + amount;
        } else {
            return Math.ceil(amount * 100) + '%';
        }
    }

    // (bonus) is a dict with (kind), (isAbsolute), and (value) keys
    Bonus(bonus) {
        if (!bonus || !('value' in bonus) || (bonus.value === 0)) {
            return "";
        }
        var kind = ('kind' in bonus) ? bonus['kind'] : bonus['what'];
        var prefix = this.Attribute(kind);
        return prefix + ((prefix && prefix.length > 0) ? ' ' : '')
            + this.BonusAmount(bonus.isAbsolute, bonus.value);
    }

    // a Main stat
    Stat(stat) {
        //console.log("stat = " + JSON.stringify(stat));
        var bonus = this.Bonus(stat)
        if (stat.enhancement > 0) {
            var glyphBonus = {
                kind: 'glyph',
                isAbsolute: stat.isAbsolute,
                value: stat.enhancement
            }
            bonus += " +(" + this.Bonus(glyphBonus) + ")";
        }
        return bonus;

    }

    // an array of substats.
    Substats(subStats) {
        if (!subStats || subStats.length === 0) {
            return null;
        }
        if (subStats.length === 1) {
            return this.Stat(subStats[0]);
        }
        var entries = [];
        subStats.forEach(subStat => {
            entries.push(<li>{this.Stat(subStat)}</li>);
        });
        return <ul className="substats">{entries}</ul>;
    }

    // an artifact in short form, for champions page
    ArtifactShort(artifact) {
        if (typeof (artifact) === "string") {
            return artifact;
        }
        return artifact.kind + " "
            + artifact.rank + "*"
            + " (" + artifact.setKind + ")"
            + "," + artifact.level;
    }

    // makes it a litle easier to make an image.
    // you give it:
    // (a) the src attribute - required. Local
    // (b) the alt/label attribute - uses same for both
    // (c) any additional attributes in a hash
    Image(src, label, additional) {
        if (!additional) {
            additional = {};
        }
        return (
            <img src={process.env.PUBLIC_URL + src} title={label} alt={label} {...additional} />
        );
    }
}

export default Formatter;
