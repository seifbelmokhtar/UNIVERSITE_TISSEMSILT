# -*- coding: utf-8 -*-
"""Aligne la langue par défaut des étudiants importés sur 'ar' (défaut du site)."""
import re
p = r"C:\Users\pc\Downloads\UNIVERSITE_TISSEMSILT\app\assets\js\api\fixtures\fixtures.js"
lines = open(p, encoding="utf-8").readlines()
n = 0
for i, line in enumerate(lines):
    m = re.search(r'"id": (\d+)', line)
    if m and int(m.group(1)) >= 100 and '"identifiant":' in line:
        if '"langue_pref": "fr"' in line:
            lines[i] = line.replace('"langue_pref": "fr"', '"langue_pref": "ar"')
            n += 1
open(p, "w", encoding="utf-8", newline="").writelines(lines)
print("updated:", n)
