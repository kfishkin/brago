// the return values when deciding whether to filter an artifact
export const FILTER_MAYBE = 0; // it's ok by me.
export const FILTER_IN = 1; // it's in, ignore everyone else.
export const FILTER_OUT = 2; // it's out. trumped by _IN.

// most filters will use either (OUT) or (MAYBE).
// (IN) is used if you want it in _no matter what_.

// the things you can filter on. Done so you can dedup filter
// functions.
export const FILTER_OUT_JEWELRY_BY_FACTION = "jewelry_by_faction";
export const FILTER_IN_CURRENT_GEAR = "current_gear";
export const FILTER_OUT_BY_WEARER = "by_wearer";
export const FILTER_OUT_BY_SLOT = "by_slot";
export const FILTER_OUT_BY_RANK = "by_rank";
export const FILTER_OUT_BY_SET = "by_set";

/**
 * Handles pre-filtering of artifacts before optimization.
 */
class ArtifactFilterer {
    // convert from 'Five', 'Three', etc.
    constructor() {
        // the filterers, keyed by id
        this.filterers = {};

    }
    SetFilterer(key, func) {
        if (func) {
            this.filterers[key] = func;
        } else {
            delete this.filterers[key];
        }
    }

    /**
     * Checks an artifact as to whether it could be worn
     * by the current champ.
     * @param {object} artifact the artifact to check
     * @returns {bool} whether its viable
     */
    IsWearable(artifact) {
        if (!artifact) return false;
        if (!this.filterers) return true;
        var returnVal = true;
        // NO votes trump YES votes.
        Object.entries(this.filterers).some((tuple) => {
            //var key = tuple[0];
            var filterFunc = tuple[1];
            var code = filterFunc(artifact);
            if (code === FILTER_IN) {
                returnVal = true;
                return false; // keep looking for a 'no'.
            } else if (code === FILTER_OUT) {
                returnVal = false;
                return true; // could get a FILTER_IN later.
            } else {
                return false; // keep going.
            }
        });
        return returnVal;
    }

    /**
     * Indicates whether artifact 'a1' is shadowed by artifact 'a2'.
     * i.e. isn't as good as.
     * a1 is shadowed by a2 iff:
     * 1) a1 is the same kind as a2.
     * 2) a1's primary bonus is shadowed by a2's.
     * 3) all a1's secondary bonuses are shadowed by a2's.
     * 
     * A _bonus_ b1 is shadowed by bonus b2 iff
     * 1) it affects the same stat.
     * 2) either
     *     2.1) b1's bonus is flat and b2's bonus is %, or
     *     2.2) b1's bonus is the same type as b2, and b2's is >=.
     * @param {artifact} a1 
     * @param {artifact} a2 
     */
    IsShadowedBy(a1, a2) {
        if (!a1) return true;
        if (!a2) return false;
        if (a1.kind !== a2.kind) return false;
        if (!this.BonusIsShadowedBy(a1.primaryBonus, a2.primaryBonus)) return false;
        if (!a1.secondaryBonuses || a1.secondaryBonuses.length === 0) return true;
        if (!a2.secondaryBonuses || a2.secondaryBonuses.length < a1.secondaryBonuses.length) return false;
        a1.secondaryBonuses.forEach((a1Bonus) => {
            var secondaryIsShadowed = false;
            a2.secondaryBonuses.some((a2Bonus) => {
                if (a1Bonus.kind !== a2Bonus.kind) return false;
                if (this.BonusIsShadowedBy(a1Bonus, a2Bonus)) {
                    secondaryIsShadowed = true;
                    return true;
                }
                return false;
            });
            if (!secondaryIsShadowed) return false;

        });
        //console.log(JSON.stringify(a1) + ' is shadowed by ' + JSON.stringify(a2));
        return true;
    }

    BonusIsShadowedBy(b1, b2) {
        if (!b1) return true;
        if (!b2) return false;
        if (b1.kind !== b2.kind) return false;
        if (b1.isAbsolute && !b2.isAbsolute) return true;
        if (!b1.isAbsolute && b2.isAbsolute) return false;
        var v1 = b1.value;
        if ('enhancement' in b1) v1 += b1.enhancement;
        var v2 = b2.value;
        if ('enhancement' in b2) v2 += b2.enhancement;
        return v1 <= v2;
    }

}

export default ArtifactFilterer;
