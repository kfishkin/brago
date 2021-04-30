
import Numberer from './Numberer';
import artifactSetsConfig from './config/artifact_sets.json';
import factionConfig from './config/factions.json';

// collects the various comparison methods. DRY.
// these methods are all 'static', they are exported
// and pointed to directly and hence there is no class 'this'.

// hence need the below as a package variable:
var setOrdinalities = {};

// must start at 0, and go up by 1, and match the order
// of the labels in the chooser.
export const DIMENSION_NONE = 0;
const DIMENSION_RANK = 1;
const DIMENSION_RARITY = 2;
const DIMENSION_LEVEL = 3;
const DIMENSION_SLOT = 4; // for artifacts
const DIMENSION_AFFINITY = 4; // for champions
const DIMENSION_SETKIND = 5; // for artifacts
const DIMENSION_MARKER = 5; // for champions
const DIMENSION_FACTION = 6;
const DIMENSION_MAIN_STAT = 7;

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
        // make the champion sorters - by using lambdas, the functions
        // can refer to member variables.
        var championSorters = {};
        championSorters[DIMENSION_NONE] = (c1, c2) => this.Champions(c1, c2);
        championSorters[DIMENSION_RANK] = (c1, c2) => this.ChampionsByRank(c1, c2);
        championSorters[DIMENSION_RARITY] = (c1, c2) => this.ChampionsByRarity(c1, c2);
        championSorters[DIMENSION_LEVEL] = (c1, c2) => this.ChampionsByLevel(c1, c2);
        championSorters[DIMENSION_AFFINITY] = (c1, c2) => this.ChampionsByAffinity(c1, c2);
        championSorters[DIMENSION_MARKER] = (c1, c2) => this.ChampionsByMarker(c1, c2);
        championSorters[DIMENSION_FACTION] = (c1, c2) => this.ChampionsByFaction(c1, c2);
        this.championSorters = championSorters;
        this.artifactSorters = this.makeArtifactSorters();
        this.numberer = new Numberer();
        // map from faction key to ordinality
        var factionOrdinalities = {};
        factionConfig.factions.forEach((factionSpec) => {
            factionOrdinalities[factionSpec.key.toLowerCase()] = factionSpec.ordinality;

        });
        this.factionOrdinalities = factionOrdinalities;
    }
    makeArtifactSorters() {
        var artifactSorters = {};
        artifactSorters[DIMENSION_RANK] = this.ArtifactByRank.bind(this);
        artifactSorters[DIMENSION_LEVEL] = this.ArtifactByLevel.bind(this);
        artifactSorters[DIMENSION_FACTION] = this.ArtifactByFaction.bind(this);
        artifactSorters[DIMENSION_RARITY] = this.ArtifactByRarity.bind(this);
        artifactSorters[DIMENSION_SLOT] = this.ArtifactByKind.bind(this);
        artifactSorters[DIMENSION_SETKIND] = this.ArtifactBySetKind.bind(this);
        artifactSorters[DIMENSION_MAIN_STAT] = this.ArtifactByMainStat.bind(this);
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

    ArtifactsOn(a1, a2, dimension) {
        var sorter = this.artifactSorters[dimension];
        if (!sorter) {
            return this.ArtifactByMainStat(a1, a2);
        } else {
            return sorter(a1, a2);
        }
    }

    ChampionsOn(c1, c2, dimension) {
        var sorter = this.championSorters[dimension];
        if (!sorter) {
            return this.Champions(c1, c2);
        }
        return sorter(c1, c2);
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
    ChampionsByRank(c1, c2) {
        var numberer = this.numberer;
        var v1 = numberer.RankFromStars(c1.grade);
        var v2 = numberer.RankFromStars(c2.grade);
        return v1 - v2;
    }
    ChampionsByRarity(c1, c2) {
        var numberer = this.numberer;
        var v1 = numberer.Rarity(c1.rarity);
        var v2 = numberer.Rarity(c2.rarity);
        return v1 - v2;
    }
    ChampionsByLevel(c1, c2) {
        var v1 = c1.level;
        var v2 = c2.level;
        return v1 - v2;
    }
    ChampionsByAffinity(c1, c2) {
        var v1 = c1.element;
        var v2 = c2.element;
        return v1.localeCompare(v2);
    }
    ChampionsByMarker(c1, c2) {
        var v1 = c1.marker;
        var v2 = c2.marker;
        return this.Marker(v1, v2);
    }
    ChampionsByFaction(c1, c2) {
        var v1 = (c1.fraction || c1.faction).toLowerCase();
        v1 = (v1 in this.factionOrdinalities) ? this.factionOrdinalities[v1] : v1;
        var v2 = (c2.fraction || c2.faction).toLowerCase();
        v2 = (v2 in this.factionOrdinalities) ? this.factionOrdinalities[v2] : v2;
        return v1 - v2;
    }
}

export default Comparer;
