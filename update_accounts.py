# -*- coding: utf-8 -*-
"""Ajoute email + mot de passe personnel à chaque étudiant importé
et écrit le fichier de comptes sur le Bureau."""
import json
import re
import unicodedata
import openpyxl

XLSX = r"C:\Users\pc\Desktop\list_inscrits.xlsx"
FIXTURES = r"C:\Users\pc\Downloads\UNIVERSITE_TISSEMSILT\app\assets\js\api\fixtures\fixtures.js"
OUT = r"C:\Users\pc\Desktop\comptes_etudiants.txt"
DOMAIN = "etu.smartcampus.dz"
OLD_PW = "etudiant2026"

def norm(v):
    """prénom/nom -> segment email propre"""
    if v is None:
        return ""
    t = unicodedata.normalize("NFD", str(v))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")  # sans accents
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", ".", t).strip(".")
    return t

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))[1:]

# --- génération email + mot de passe ---
seen_email, accounts = set(), []
for r in rows:
    num_inscr, matricule, nin, nom, prenom = r[0], r[1], r[2], r[3], r[4]
    mat = str(int(matricule)) if isinstance(matricule, float) else str(matricule).strip()
    local = ".".join(p for p in (norm(prenom), norm(nom)) if p)
    email = f"{local}@{DOMAIN}"
    if email in seen_email:  # doublon -> suffixe matricule
        email = f"{local}.{mat[-4:]}@{DOMAIN}"
    seen_email.add(email)
    pw = "Etud2026" + mat[-4:]           # ex. Etud20264708
    accounts.append({
        "mat": mat, "nom": str(nom).strip(), "prenom": str(prenom).strip(),
        "email": email, "pw": pw,
    })

# mot de passe unique garanti
pws = [a["pw"] for a in accounts]
assert len(set(pws)) == len(pws), "doublon mot de passe"

# --- mise à jour fixtures.js ---
with open(FIXTURES, encoding="utf-8") as f:
    src = f.readlines()

n_email = n_pw = 0
for i, line in enumerate(src):
    m = re.search(r'"identifiant": "(\d+)"', line)
    if not m:
        # entrée mockPasswords : '222238464708': 'etudiant2026',
        mm = re.match(r"\s*'(\d+)': '(.*)',?\s*$", line)
        if mm and mm.group(1) in {a["mat"] for a in accounts}:
            acc = next(a for a in accounts if a["mat"] == mm.group(1))
            src[i] = re.sub(r"': '[^']*'", "': '%s'" % acc["pw"], line)
            n_pw += 1
        continue
    mat = m.group(1)
    acc = next((a for a in accounts if a["mat"] == mat), None)
    if not acc:
        continue
    if '"email": null' in line:
        src[i] = line.replace('"email": null', '"email": "%s"' % acc["email"], 1)
        n_email += 1

with open(FIXTURES, "w", encoding="utf-8", newline="") as f:
    f.writelines(src)

# --- fichier de comptes ---
with open(OUT, "w", encoding="utf-8") as f:
    f.write("COMPTES ÉTUDIANTS — Smart Campus DZ\n")
    f.write("Source : list_inscrits.xlsx — %d étudiants\n" % len(accounts))
    f.write("Connexion : http://127.0.0.1:8081/pages/public/login.html\n")
    f.write("Identifiant = MATRICULE, Mot de passe = MOT DE PASSE\n")
    f.write("=" * 100 + "\n\n")
    for a in accounts:
        f.write("%-16s | %-18s %-18s | %-45s | %s\n"
                % (a["mat"], a["nom"], a["prenom"], a["email"], a["pw"]))

print("emails mis à jour :", n_email, "/", len(accounts))
print("mots de passe mis à jour :", n_pw, "/", len(accounts))
print("fichier :", OUT)
print("exemple :", accounts[0])
