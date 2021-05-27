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
    for line in sys.stdin:
        the_blob = the_blob + line
    as_json = json.loads(the_blob)
    skills = as_json["SkillData"]
    skills = skills["SkillTypes"]
    l10n = as_json["StaticDataLocalization"]
    print('{ "skills": [')
    for skill in skills:
        skill_id = 0
        if "Id" in skill.keys():
            skill_id = skill["Id"]
        skill_levels = 0
        if "SkillLevelBonuses" in skill.keys():
            skill_levels = len(skill["SkillLevelBonuses"])
        name = skill["Name"]["DefaultValue"]
        key = skill["Name"]["Key"]
        if key in l10n:
            name = l10n[key]
        print(f'{{ "Id": {skill_id}, "Name": "{name}", "Levels": {skill_levels} }},')
    print(f'{{ "Id": 0, "Name": "", "Levels": 0 }} ] }}')

if __name__ == "__main__":
    main()
