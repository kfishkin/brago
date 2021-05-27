
import skillsConfig from './config/skills.json';

// a factory that given champions, spits out their skills

class SkillsFactory {
    constructor() {
        // make a hash table from skill id to data.
        var skillMap = {};
        skillsConfig.skills.forEach((skillSpec) => {
            skillMap[skillSpec.Id] = skillSpec;
        })
        this.skillMap = skillMap;
    }

    /**
     * Returns the skills for a champion
     * @param {*} champ - the champion
     * @returns skills. An array, one per skill. Each entry in the array
     *   is a dictionary with {id, name, level, maxLevel}
     * if (maxLevel) is < 0, then it's unknown.
     */
    SkillsFor(champ) {
        var skills = [];
        if (!champ || !champ.skills) return skills;
        champ.skills.forEach((skillBundle) => {
            var id = skillBundle.typeId;
            var level = skillBundle.level;
            var name = "Skill #" + level;
            var maxLevel = -1;
            if (id in this.skillMap) {
                name = this.skillMap[id].Name;
                maxLevel = this.skillMap[id].Levels + 1;
            }
            skills.push({ id: id, name: name, level: level, maxLevel: maxLevel });
        })
        return skills;
    }
}

export default SkillsFactory;
