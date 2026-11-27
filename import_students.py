# -*- coding: utf-8 -*-
"""Inject list_inscrits.xlsx students into the site's mock DB (fixtures.js)."""
import json
import openpyxl

XLSX = r"C:\Users\pc\Desktop\list_inscrits.xlsx"
FIXTURES = r"C:\Users\pc\Downloads\UNIVERSITE_TISSEMSILT\app\assets\js\api\fixtures\fixtures.js"
PASSWORD = "etudiant2026"
START_ID = 100

def s(v):
    if v is None:
        return None
    if isinstance(v, float):
        if v == int(v):
            return str(int(v))
        return repr(v)
    return str(v).strip()

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
data = rows[1:]

records, passwords = [], []
next_id = START_ID
for r in data:
    num_inscr, matricule, nin, nom, prenom, ddn, lieu, domaine, filiere, niveau, cycle = [s(x) for x in r]
    if not nom and not prenom:
        continue
    rec = {
        "id": next_id,
        "identifiant": matricule or num_inscr,
        "nom": nom or "",
        "prenom": prenom or "",
        # pas d'arabe dans le fichier -> on réutilise les noms latins (évite "undefined")
        "nom_ar": nom or "",
        "prenom_ar": prenom or "",
        "email": None,
        "role": "etudiant",
        "statut": "actif",
        "langue_pref": "fr",
        "faculte_fr": domaine,
        "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير",
        "departement_fr": filiere,
        "departement_ar": "قسم العلوم التجارية",
        "specialite_fr": filiere,
        "specialite_ar": "علوم تجارية",
        "annee_etude": 2 if (niveau or "").startswith("Master") else 1,
        # champs additionnels issus du fichier source
        "num_inscription": num_inscr,
        "nin": nin,
        "date_naissance": ddn,
        "lieu_naissance": lieu,
        "niveau": niveau,
        "cycle": cycle,
    }
    records.append(rec)
    passwords.append((rec["identifiant"], PASSWORD))
    next_id += 1

with open(FIXTURES, encoding="utf-8") as f:
    src = f.read()

# 1) insérer dans export const utilisateurs = [...]
start = src.index("export const utilisateurs = [")
end = src.index("\n];", start)
block = "\n" + ",\n".join(
    "  " + json.dumps(r, ensure_ascii=False) for r in records
)
src = src[:end] + "," + block + src[end:]

# 2) mots de passe démo
pstart = src.index("export const mockPasswords = {")
pend = src.index("\n};", pstart)
pblock = "\n" + ",\n".join(
    "  '%s': '%s'" % (k, v) for k, v in passwords
)
src = src[:pend] + "," + pblock + src[pend:]

with open(FIXTURES, "w", encoding="utf-8", newline="") as f:
    f.write(src)

print("students injected:", len(records))
print("first:", records[0]["identifiant"], records[0]["nom"], records[0]["prenom"])
print("last :", records[-1]["identifiant"], records[-1]["nom"], records[-1]["prenom"])
