

// utility class that bundles a list of bonuses.
// each bonus is a hash table, with keys (from the JSON file) of
// kind - what attribute it's a bonus for, e.g. "speed".
//   the pseudo-data value 'AMPLIFY' is a bonus derived
// as an amplification of another (Lore of Steel).
// isAbsolute - boolean. Is this an absolute increase?
// value - the amount of the bonus
// why - string describing the source of the bonus. optional,
// used for display in the total stats display.

class BonusList {
    constructor() {
        this.bonuses = [];
    }
    Bonuses() {
        return this.bonuses;
    }
    Add(kind, isAbsolute, value, why) {
        var bundle = {
            kind: kind,
            isAbsolute: isAbsolute,
            value: value,
            why: why
        }
        this.bonuses.push(bundle);
    }
    AddBonus(bonus, why) {
        var bundle = Object.assign({}, bonus, { why: why });
        this.bonuses.push(bundle);
    }
}

export default BonusList;
