from enum import Enum
import json
import re
import sys

class State(Enum):
    BEFORE = 1
    DURING = 2
    AFTER = 3


def main():
    cur_state = State.BEFORE
    the_blob = ""
    # have to strip the ending comma from the last line...
    last_line = ""
    for line in sys.stdin:
        # line = line.rstrip()
        if cur_state == State.BEFORE:
            index = line.find('"SkillData":')
            if index != -1:
                cur_state = State.DURING
                last_line = "{ " + line
        elif cur_state == State.DURING:
            index = line.find('"EffectData":')
            if index != -1:
                cur_state = State.AFTER
                the_blob = the_blob + last_line.replace(",","") + " }"
            else:
                if len(last_line) > 0:
                    the_blob = the_blob + last_line
                last_line = line
        else:
            pass
    #print(the_blob)
    as_json = json.loads(the_blob)
    skills = as_json["SkillData"]
    skills = skills["SkillTypes"]
    placeholder_pat = re.compile("Skill\s+\d+\s+name", re.IGNORECASE)
    for skill in skills:
        skill_levels = 0
        name = skill["Name"]["DefaultValue"]
        if placeholder_pat.match(name):
            continue
        if "SkillLevelBonuses" in skill.keys():
            skill_levels = len(skill["SkillLevelBonuses"])
        print('{},{},{}'.format(skill["Id"],
            name,
            skill_levels))
    #print(skills)

if __name__ == "__main__":
    main()
