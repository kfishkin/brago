// utility class that wraps all the calculation
// (and none of the visuals) around calculating
// the total stats for a champion.
import BonusList from './BonusList';
import arenaConfig from './config/arena.json';
import artifactSetConfig from './config/artifact_sets.json';
import artifactTypesConfig from './config/artifact_types.json';
import attributesConfig from './config/attributes.json';
import greatHallConfig from './config/great_hall.json';
import masteriesConfig from './config/masteries.json';
import Numberer from './Numberer';

export const BASE_COLUMN = "BASE";
export const ARTIFACTS_COLUMN = "ARTIFACTS";
export const GREAT_HALL_COLUMN = "GREAT_HALL";
export const ARENA_COLUMN = "ARENA";
export const MASTERIES_COLUMN = "MASTERIES";
export const TOTALS_COLUMN = "TOTALS";
export const AMPLIFY_BONUS = "amplify";

class TotalStatsCalculator {
    constructor() {
        this.bonuses = [];
        this.numberer = new Numberer();
        // load and store a map from attribute:level
        // to what it's bonuses are.
        this.greatHallBonusMap = {}
        greatHallConfig.columns.forEach((configCol) => {
            var key = configCol.key;
            configCol.bonuses.forEach((bonusEntry) => {
                var level = bonusEntry.level;
                var bonus = {
                    'kind': key.toLowerCase(),
                    'isAbsolute': bonusEntry.isAbsolute,
                    'value': bonusEntry.value
                };
                this.greatHallBonusMap[key + ":" + level] = bonus;
            });
        });
        // map from artifact set kind to set info
        this.artifactSetInfo = {};
        artifactSetConfig.sets.forEach((setConfig) => {
            var set = setConfig.jsonKey;
            this.artifactSetInfo[set] = setConfig;
            this.artifactSetInfo[set.toLowerCase()] = setConfig;
        });
        // map from artifact slot to label
        this.artifactLabelsBySlot = {}
        artifactTypesConfig.artifact_types.forEach((typeConfig) => {
            this.artifactLabelsBySlot[typeConfig.key.toLowerCase()] = typeConfig.label;
        });
    }

    /**
     * Makes the stats, still in unevaluated form.
     * @param {Object} champion - the champion object as in the JSON file
     * @param {string} arenaLeague - the arena league (e.g. 'silveriii') as in the JSON file
     * @param {Object} greatHallLevels - the 'greatHall' hash as found in the JSON file
     * @param {Object} artifactsById - hash from artifact id to artifact info. from the JSON file.
     * 
     * It returns a hash, whose keys are:
     * BASE - the 'base stats'.
     * ARTIFACTS - the 'artifacts' column.
     * GREAT_HALL - the 'great hall' column
     * ARENA - the 'arena' column
     * MASTERIES - the 'masteries' column
     * 
     * Each of these keys points itself to a hash,
     * whose keys are the attributes: "health", "accuracy", etc.
     * Each of _those_ keys points to a value which is of type 'BonusList':
     * an array of Bonuses, augmented to indicate why/how the bonus was computed.
     * For example, if X is the result being returned:
     * X[BASE]["health"] could equal [{kind:'health',isAbsolute: true, value:12000, why:null}]
     *    indicating that the base health is 12000.
     * X[ARTIFACTS]["health"] could then look like
     *   [{kind:'health', isAbsolute: false, value:0.10,why:"from Resilience set bonus"},
     *   {kind:'health', isAbsolute: true, value:480, why: 'from Boots substat'}]
     */
    MakeRaw(champion, arenaLeague, greatHallLevels, artifactsById) {
        var columns = {}
        columns[BASE_COLUMN] = this.computeBaseStats(champion, columns)
        columns[ARENA_COLUMN] = this.computeArenaStats(this.computeArenaData(arenaLeague));
        columns[GREAT_HALL_COLUMN] = this.computeGreatHallStats(champion.element.toLowerCase(), greatHallLevels);
        var setCounts = this.computeSets(champion.artifacts, artifactsById);
        columns[ARTIFACTS_COLUMN] = this.computeSetBonuses(setCounts);
        columns[MASTERIES_COLUMN] = this.computeMasteries(champion.masteries, setCounts);
        this.addPieceBonuses(columns[ARTIFACTS_COLUMN], champion.artifacts, artifactsById);
        return columns;
    }

    /**
     * Takes the output from 'MakeRaw' and "Bakes" it: evaluates every bonus,
     * so all the values are straight numbers as displayed on the 'Total Stats' page in the app.
     * Also computes the 'TOTALS' column.
     * @param {*} champion 
     * @param {*} columnsIn 
     * @returns {Object} the baked columns, plus the totals column.
     */
    Bake(champion, columnsIn) {
        if (!columnsIn) return columnsIn;
        var totalColumn = {};
        var columnsOut = {};
        attributesConfig.attributes.forEach((attrSpec) => {
            var attr = attrSpec.jsonKey;
            var attrLc = attr.toLowerCase();
            var baseVal = (attr in champion) ? champion[attr] : 0;
            totalColumn[attrLc] = new BonusList();
            var totalValue = baseVal;
            // now go through each column....
            Object.keys(columnsIn).some((columnKey) => {
                if (columnKey === TOTALS_COLUMN) {
                    return false; // just in case.
                }
                if (!columnsOut[columnKey]) {
                    columnsOut[columnKey] = {};
                }
                var bonusesIn = columnsIn[columnKey][attrLc];
                if (!bonusesIn) {
                    return false;
                }
                // copy and evaluate.
                totalValue += this.bakeCell(columnsOut, columnsIn, columnKey, attr, baseVal);
                return false;
            });
            totalColumn[attrLc].Add(attrLc, true, totalValue, null);
        });
        columnsOut[TOTALS_COLUMN] = totalColumn;
        return columnsOut;
    }

    /**
     * 'One-stop shop'. You give it all the data affecting total stats,
     * and it returns a 'baked' total stats, where all the total stat
     * values are numbers, not percentages.
     * @param {*} champion 
     * @param {*} arenaLeague 
     * @param {*} greatHallLevels 
     * @param {*} artifactsById 
     */
    MakeAndBake(champion, arenaLeague, greatHallLevels, artifactsById) {
        var rawColumns = this.MakeRaw(champion, arenaLeague, greatHallLevels, artifactsById);
        var bakedColumns = this.Bake(champion, rawColumns);
        return bakedColumns;
    }

    /**
     * Evaluates a cell in the result.
     * @param {*} columnsOut the output table to put the result in
     * @param {*} columnsIn  the input table
     * @param {*} columnKey  the column key
     * @param {*} attr the row key
     * @param {*} baseVal the base value for that attribute
     * @returns the total value for the cell.
     */
    bakeCell(columnsOut, columnsIn, columnKey, attr, baseVal) {
        attr = attr.toLowerCase();
        if (!columnsIn || !columnsOut) return 0;
        if (columnKey === TOTALS_COLUMN) return 0; // just in case
        var listIn = columnsIn[columnKey][attr];
        var listOut = new BonusList();
        if (!listIn) {
            columnsOut[columnKey][attr] = listOut;
            return 0;
        }
        var total = 0;
        listIn.Bonuses().forEach((bonusIn) => {
            // if it's absolute, just copy it....
            if (bonusIn.isAbsolute) {
                listOut.AddBonus(bonusIn, bonusIn.why);
                total += Math.round(this.numberer.EvaluateBonus(0, bonusIn));
            } else {
                var amt = Math.round(this.numberer.EvaluateBonus(baseVal, bonusIn));
                listOut.Add(bonusIn.kind, true, amt, bonusIn.why);
                //console.log('baked relative bonus ', JSON.stringify(bonusIn), ' val = ', amt, 'base = ', baseVal);
                total += amt;
            }
        });
        columnsOut[columnKey][attr] = listOut;
        // kludge: don't count the base column twice.
        if (columnKey === BASE_COLUMN) total = 0;
        //console.log('bakeCell[', columnKey, '][', attr, '], in=', JSON.stringify(columnsIn[columnKey][attr]), ', out=', JSON.stringify(columnsOut[columnKey][attr]), ', tot = ', total);
        return total;
    }

    /**
     * Computes the mastery bonuses
     * @param {array} masteryIds the ids of the champ masteries
     * @param {Object} setCounts armor sets the champion has.
     * @returns the map from attribute to BonusList for masteries
     */
    computeMasteries(masteryIds, setCounts) {
        var column = {}
        if (!masteryIds) return column;
        masteriesConfig.masteries.some((masterySpec) => {
            //console.log(masterySpec.label + ":" + masterySpec.key);
            if (!masterySpec.key) return false;
            if (masteryIds.indexOf(masterySpec.key) === -1) return false;
            if (!masterySpec.bonuses || masterySpec.bonuses.length === 0) {
                return false;
            }
            masterySpec.bonuses.forEach((bonus) => {
                var attr = bonus.kind.toLowerCase();
                if (attr === AMPLIFY_BONUS.toLowerCase()) {
                    // do they have sets that this amplifies?
                    Object.entries(setCounts).some((tuple) => {
                        var setKey = tuple[0];
                        var count = tuple[1];
                        if (count <= 0) return false;
                        if (masterySpec.setBonusFor.indexOf(setKey) === -1) {
                            return false;
                        }
                        var setName = this.artifactSetInfo[setKey].label;
                        this.artifactSetInfo[setKey].bonuses.forEach((setBonus) => {
                            var amplification = setBonus.value * bonus.value;
                            var toAttr = setBonus.kind.toLowerCase();

                            if (!(toAttr in column)) {
                                column[toAttr] = new BonusList();
                            }
                            column[toAttr].Add(setBonus.kind, setBonus.isAbsolute, amplification, masterySpec.label + " bonus to " + setName + " set");
                            //console.log('just added amplification bonus of ', amplification, ' to ', toAttr);
                        });
                        return false;
                    });
                } else {
                    if (!(attr in column)) {
                        column[attr] = new BonusList();
                    }
                    column[attr].AddBonus(bonus, masterySpec.label + ' mastery bonus');
                }
            });
            return false;
        });
        //console.log('masteries column ', JSON.stringify(column));
        return column;
    }

    /**
     * An artifact relative bonus to CR or CD comes in
     * as (isAbsolute:false) and value as a float, e.g. 0.05
     * for a 5% increase. But the base stat itself is stored
     * as a number, e.g. base CR of 60% is stored as (60).
     * Blech. So need to align the 2. Easiest is to align
     * the artifact one to the base one:
     * @param {Bonus} bonusIn the incoming bonus.
     */
    tweakCRCD(bonusIn) {
        var bonusOut = Object.assign({}, bonusIn);
        var kind = bonusIn.kind.toLowerCase();
        if (kind === 'criticalchance' || kind === 'criticaldamage') {
            bonusOut.value = Math.round(bonusOut.value * 100);
            if ('enhancement' in bonusOut) {
                bonusOut.enhancement = Math.round(bonusOut.enhancement * 100);
            }
            bonusOut.isAbsolute = true;
        }
        return bonusOut;
    }

    /**
     * Compute the bonuses from individual artifacts.
     * @param {*} column the artifact column
     * @param {*} artifactIds array of artifacts worn by the champion
     * @param {*} artifactsById maps from artifact ids to artifact info.
     * @return nothing, side-effects into (columns)
     */
    addPieceBonuses(column, artifactIds, artifactsById) {
        if (!column || !artifactIds || !artifactsById) {
            return;
        }
        artifactIds.some((artifactId) => {
            var artifactInfo = artifactsById[artifactId];
            if (!artifactInfo) return false;
            var artifactLabel = this.artifactLabelsBySlot[artifactInfo.kind.toLowerCase()];
            if (artifactInfo.primaryBonus) {
                var attr = artifactInfo.primaryBonus.kind.toLowerCase();
                var asList = (attr in column) ? column[attr] : (new BonusList());
                asList.AddBonus(this.tweakCRCD(artifactInfo.primaryBonus), artifactLabel + " main stat");
                column[attr] = asList;
            }
            if (artifactInfo.secondaryBonuses) {
                artifactInfo.secondaryBonuses.forEach((bonus) => {
                    var attr = bonus.kind.toLowerCase();
                    var asList = (attr in column) ? column[attr] : (new BonusList());
                    asList.AddBonus(this.tweakCRCD(bonus), artifactLabel + " substat");
                    column[attr] = asList;
                });
            }
            return false;
        });
    }

    computeArenaData(arenaLeague) {
        var data = null;
        arenaConfig.levels.some((arenaLevel) => {
            if (arenaLevel.jsonKey === arenaLeague) {
                data = arenaLevel;
                return true;
            }
            return false;
        });
        return data;
    }

    computeArenaStats(arenaData) {
        var column = {};
        if (!arenaData || !arenaData.bonuses) { return column; }
        arenaData.bonuses.some((bonus) => {
            var attr = bonus.kind.toLowerCase();
            if (!(attr in column)) {
                column[attr] = new BonusList();
            }
            column[attr].AddBonus(bonus, null);
            return false;
        });
        return column;
    }

    computeGreatHallStats(affinity, greatHallLevels) {
        var column = {};
        if (!greatHallLevels || !(affinity in greatHallLevels)) return column;
        var levelsByAttr = greatHallLevels[affinity];
        attributesConfig.attributes.forEach((attrSpec) => {
            // great hall levels do _not_ have keys in lower case,
            // but the columns do...
            var attr = attrSpec.jsonKey;
            var attrLc = attr.toLowerCase();
            if (attr in levelsByAttr) {
                var level = levelsByAttr[attr];
                var bonus = this.greatHallBonusMap[attr + ":" + level];
                if (bonus) {
                    var asList = new BonusList();
                    asList.AddBonus(this.tweakCRCD(bonus), null);
                    column[attrLc] = asList;
                }
            }
        });
        return column;
    }

    computeBaseStats(champion) {
        var column = {};
        if (!champion) return column;
        attributesConfig.attributes.forEach((attrSpec) => {
            var attr = attrSpec.jsonKey; // leave case alone.
            var attrLc = attr.toLowerCase();
            var val = (attr in champion) ? champion[attr] : 0;
            if (!(attr in column)) {
                column[attrLc] = new BonusList();
            }
            column[attrLc].Add(attr, true, val, null);
        });
        return column;
    }

    /**
     * Computes which armor sets the champion has, and how many of them.
     * @returns a hash, key is armor set, value is # of those sets. Only
     * populated for values > 1. For example, {"speed":2, "life":1}
     * @param {array} artifactIds array of worn artifact Ids
     * @param {Object} artifactsById hash from id to artifact info.
     */
    computeSets(artifactIds, artifactsById) {
        if (!artifactIds || !artifactsById) {
            return {};
        }
        var counts = {};
        artifactIds.forEach((artifactId) => {
            var artifact = artifactsById[artifactId];
            if (artifact) {
                var set = artifact.setKind;
                if (set && !(set === "None")) {
                    var val = (set in counts) ? counts[set] : 0;
                    counts[set] = val + 1;
                }
            }
        });
        // divide the counts by the amount needed, that tells you
        // how many sets they have.
        Object.keys(counts).forEach((setKind) => {
            var key = setKind;
            var minSize = ('set_size' in this.artifactSetInfo[key]) ?
                this.artifactSetInfo[key].set_size : 4;
            var times = Math.floor(counts[key]) / minSize;
            counts[key] = times;
        });
        //console.log('set counts =', JSON.stringify(counts));
        return counts;
    }

    /**
     * Computes the overall set bonuses (e.g. a 'Perception' set: +40 ACC, SPD+5%
     * for the current champion. 
     * @param {Object} setCounts map from setKind to # times foound
     */
    computeSetBonuses(setCounts) {
        //console.log('setCounts=', JSON.stringify(setCounts));
        var column = {};
        var suffixes = {
            0: '',
            1: ' (2nd set)',
            2: ' (3rd set)'
        };

        Object.entries(setCounts).some((tuple) => {
            var setKind = tuple[0];
            var numSets = tuple[1];
            if (numSets <= 0) {
                return false;
            }
            var setInfo = this.artifactSetInfo[setKind];
            if (!setInfo || !setInfo.bonuses) {
                return false;
            }
            // add them in, if we have them.
            setInfo.bonuses.forEach((bonus) => {
                var attr = bonus.kind.toLowerCase();
                var asList = (attr in column) ? column[attr] : (new BonusList());
                // if you have more than one set, they are applied separately.
                // e.g. two 10% boosts aren't one 20% boost (100 --> 120), they are
                // (10% boost)*(10% boost) (100 --> 121)

                // can never have more than 3 sets...
                for (var i = 0; i < numSets && i < 3; i++) {
                    asList.AddBonus(bonus, setInfo.label + " set bonus" + suffixes[i]);
                }
                column[attr] = asList;
            });
            return false;
        });
        //console.log('set bonuses', JSON.stringify(column));
        return column;
    }
}

export default TotalStatsCalculator;
