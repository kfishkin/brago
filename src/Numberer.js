

import artifactTypeConfig from './config/artifact_types.json';
import raritiesConfig from './config/rarities.json';

class Numberer {
    // convert from 'Five', 'Three', etc.
    constructor() {
        this.artifactMap = {};
        artifactTypeConfig.artifact_types.forEach((bundle) => {
            this.artifactMap[bundle.key] = bundle.ordinality;
        });
        this.rarityMap = {};
        raritiesConfig.rarities.forEach((spec) => {
            this.rarityMap[spec.key] = spec;
        });
    }
    Rank(rank) {
        if (typeof (rank) === "number") {
            return rank;
        }
        var map = {
            'zero': 0,
            'one': 1,
            'two': 2,
            'three': 3,
            'four': 4,
            'five': 5,
            'six': 6
        };
        if (!rank || !rank.toLowerCase) {
            return 0;
        }
        var key = rank.toLowerCase();
        return (key in map) ? map[key] : key;
    }
    // convert from 'Stars4', 'Stars5', etc.
    RankFromStars(rank) {
        var map = {
            'stars0': 0,
            'stars1': 1,
            'stars2': 2,
            'stars3': 3,
            'stars4': 4,
            'stars5': 5,
            'stars6': 6
        };
        if (!rank || !rank.toLowerCase) {
            return 0;
        }
        var key = rank.toLowerCase();
        return (key in map) ? map[key] : key;
    }
    // convert from 'Common', 'Epic', etc.
    Rarity(rarity) {
        var key = rarity.toLowerCase();
        return (key in this.rarityMap) ? this.rarityMap[key].ordinality : 0;
    }
    // convert from 'Ring', 'Shield' etc. to a sort order.
    // note that Amulets are 'Cloak'
    ArtifactKind(kind) {
        var key = kind.toLowerCase();
        return (key in this.artifactMap) ? this.artifactMap[key] : key;
    }

    // apply a bonus to a given base value.
    EvaluateBonus(base, bonus) {
        if (!bonus) return base;
        var val = ('enhancement' in bonus) ? bonus.enhancement : 0.0;
        val += bonus.value;
        // an increase to crit chance or crit damage _says_ it's relative,
        // but really is absolute and 100*larger: a 0.5 bump to a 10% base
        // is 60%, not 15%. Grrr...
        var grr = {
            'criticalchance': true, 'cr': true,
            'criticaldamage': true, 'cd': true
        };
        var isAbsolute = bonus.isAbsolute;
        if (bonus.kind.toLowerCase() in grr) {
            isAbsolute = true;
            //val *= 100;
        }
        return isAbsolute ? (base + val) : (base * val);
    }

}

export default Numberer;
