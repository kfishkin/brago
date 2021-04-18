
import Numberer from './Numberer';
import {
    DIMENSION_RANK,
    DIMENSION_RARITY,
    DIMENSION_LEVEL,
    DIMENSION_SLOT,
    DIMENSION_FACTION,
    DIMENSION_SETKIND,
    DIMENSION_MAIN_STAT
} from './ArtifactDimensionChooser';
import artifactSetsConfig from './config/artifact_sets.json';

// collects the various comparison methods. DRY.
// these methods are all 'static', they are exported
// and pointed to directly and hence there is no class 'this'.

// hence need the below as a package variable:
var setOrdinalities = {};

class Comparer {
    constructor() {
        setOrdinalities = {};
        var count = 0;
        artifactSetsConfig.sets.forEach((setConfig) => {
            if (setConfig.key)
                setOrdinalities[setConfig.key.toLowerCase()] = setConfig.ordinality;
            if (setConfig.jsonKey)
                setOrdinalities[setConfig.jsonKey.toLowerCase()] = setConfig.ordinality;
            count++;
        });
        // handle 'None' specially:
        setOrdinalities["none"] = count + 1;
    }
    makeArtifactSorters() {
        var artifactSorters = {};
        artifactSorters[DIMENSION_RANK] = this.ArtifactByRank;
        artifactSorters[DIMENSION_LEVEL] = this.ArtifactByLevel;
        artifactSorters[DIMENSION_FACTION] = this.ArtifactByFaction;
        artifactSorters[DIMENSION_RARITY] = this.ArtifactByRarity;
        artifactSorters[DIMENSION_SLOT] = this.ArtifactByKind;
        artifactSorters[DIMENSION_SETKIND] = this.ArtifactBySetKind;
        artifactSorters[DIMENSION_MAIN_STAT] = this.ArtifactByMainStat;
        return artifactSorters;
    }

    ArtifactByFaction(art1, art2) {
        var aFaction = art1.requiredFraction ? art1.requiredFraction : "";
        var bFaction = art2.requiredFraction ? art2.requiredFraction : "";
        return aFaction.localeCompare(bFaction);
    }

    ArtifactByLevel(art1, art2) {
        var v1 = (art1 && ('level' in art1)) ? art1.level : -1;
        var v2 = (art2 && ('level' in art2)) ? art2.level : -1;
        return v1 - v2;
    }

    ArtifactByRank(art1, art2) {
        var numberer = new Numberer();
        var v1 = numberer.Rank(art1.rank);
        var v2 = numberer.Rank(art2.rank);
        return v1 - v2;
    }

    ArtifactByRarity(art1, art2) {
        var numberer = new Numberer();
        var v1 = numberer.Rarity(art1.rarity);
        var v2 = numberer.Rarity(art2.rarity);
        return v1 - v2;
    }

    ArtifactByKind(art1, art2) {
        var numberer = new Numberer();
        var v1 = numberer.ArtifactKind(art1.kind);
        var v2 = numberer.ArtifactKind(art2.kind);
        return v1 - v2;
    }

    ArtifactBySetKind(art1, art2) {
        var v1 = (art1 && art1.setKind) ? art1.setKind.toLowerCase() : null;
        var v2 = (art2 && art2.setKind) ? art2.setKind.toLowerCase() : null;
        if (!v1 && !v2) return 0;
        if (!v1) return 1;
        if (!v2) return -1;
        // can't refer to 'this' here :(
        v1 = setOrdinalities[v1];
        v2 = setOrdinalities[v2];

        return v1 - v2;
    }

    ArtifactByMainStat(art1, art2) {
        var b1 = art1.primary || art1.primaryBonus;
        var b2 = art2.primary || art2.primaryBonus;
        if (!b1 && !b2) return 0;
        if (!b1) return -1;
        if (!b2) return 1;
        var v1 = b1.kind;
        var v2 = b2.kind;
        if (!v1 && !v2) return 0;
        if (!v1) return 1;
        if (!v2) return 1;
        var delta = v1.toLowerCase().localeCompare(v2.toLowerCase());
        if (delta !== 0) {
            return delta;
        }
        // bigger bonus amount wins....
        v1 = b1.value + b1.enhancement;
        v2 = b2.value + b2.enhancement;
        return v1 - v2;
    }

    Champions(c1, c2) {
        // sorting on id works, but is non-intuitive.
        // instead use name.
        var aName = (c1 && c1.name) ? c1.name : "";
        var bName = (c2 && c2.name) ? c2.name : "";
        return aName.localeCompare(bName);
    }

    Marker(m1, m2) {
        if (!m1 && !m2) return 0;
        if (!m1 || m1 === "None") return 1;
        if (!m2 || m2 === "None") return -1;
        return m1.toLowerCase().localeCompare(m2.toLowerCase());

    }


}

export default Comparer;
