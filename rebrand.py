# -*- coding: utf-8 -*-
"""Rebranding : Université de Tissemsilt -> Smart Campus DZ (plateforme publique)."""
import os
import re
import shutil

ROOT = r"C:\Users\pc\Downloads\UNIVERSITE_TISSEMSILT\app"

MAPPING = [
    ("Université de Tissemsilt — Ahmed Ben Yahia El-Wancharissi",
     "Smart Campus DZ — La plateforme algérienne intelligente pour la vie universitaire"),
    ("University of Tissemsilt — Ahmed Ben Yahia El-Wancharissi",
     "Smart Campus DZ — The smart Algerian platform for university life"),
    ("جامعة تيسمسيلت — أحمد بن يحيى الونشريسي",
     "سمارت كامبس دي زي — المنصة الجزائرية الذكية للحياة الجامعية"),
    ("Université de Tissemsilt", "Smart Campus DZ"),
    ("University of Tissemsilt", "Smart Campus DZ"),
    ("جامعة تيسمسيلت", "سمارت كامبس دي زي"),
    ("univ-tissemsilt.dz", "smartcampus.dz"),
    ("Route Bougara, Tissemsilt 38000, Algérie", "Alger, Algérie"),
    ("طريق بوقارة، تيسمسيلت 38000، الجزائر", "الجزائر العاصمة، الجزائر"),
]

# Textes génériques de présentation (remplacent l'historique de l'université)
NEW_TEXTS = {
    "ar.js": {
        "presentation_intro": "تعرّف على سمارت كامبس دي زي، المنصة الجزائرية الذكية للحياة الجامعية، وخدماتها وقيمها",
        "presentation_history_body": "سمارت كامبس دي زي منصة رقمية جزائرية مخصصة للحياة الجامعية. تجمع خدمات الطلبة والطلبات الإدارية والموارد البيداغوجية والأخبار الجامعية في فضاء موحد.",
        "presentation_mission_body": "تهدف سمارت كامبس دي زي إلى تسهيل الإجراءات الجامعية وتيسير وصول الطلبة والموظفين إلى الخدمات، مع دعم الابتكار والجودة.",
    },
    "fr.js": {
        "presentation_intro": "Découvrez Smart Campus DZ, la plateforme algérienne intelligente pour la vie universitaire, ses services et ses valeurs",
        "presentation_history_body": "Smart Campus DZ est une plateforme numérique algérienne dédiée à la vie universitaire. Elle rassemble les services étudiants, les demandes administratives, les ressources pédagogiques et les actualités universitaires dans un espace unique.",
        "presentation_mission_body": "Smart Campus DZ accompagne les étudiants et les personnels universitaires en simplifiant les démarches, en améliorant l'accès aux services et en encourageant l'innovation.",
    },
    "en.js": {
        "presentation_intro": "Discover Smart Campus DZ, the smart Algerian platform for university life, its services and values",
        "presentation_history_body": "Smart Campus DZ is an Algerian digital platform dedicated to university life. It brings together student services, administrative requests, learning resources and university news in one place.",
        "presentation_mission_body": "Smart Campus DZ supports students and university staff by simplifying procedures, improving access to services and encouraging innovation.",
    },
}

# 1) Remplacements sur tous les fichiers texte
changed = []
for dirpath, _, names in os.walk(ROOT):
    for name in names:
        if not name.endswith((".js", ".html", ".css", ".json")):
            continue
        p = os.path.join(dirpath, name)
        with open(p, encoding="utf-8") as f:
            txt = f.read()
        before = txt
        for old, new in MAPPING:
            txt = txt.replace(old, new)
        # sous-titres indépendants (carte de connexion / badge du hero)
        txt = txt.replace(
            "isAr ? 'أحمد بن يحيى الونشريسي' : 'Ahmed Ben Yahia El-Wancharissi'",
            "isAr ? 'المنصة الجزائرية الذكية للحياة الجامعية' : 'Smart Campus DZ'")
        # textes de présentation
        if name in NEW_TEXTS:
            for key, value in NEW_TEXTS[name].items():
                pat = re.compile(r"^([ \t]*%s:[ \t]*')(?:[^'\\]|\\.)*('.*)$" % re.escape(key), re.M)
                value = value.replace("'", "\\'")
                txt, n = pat.subn(lambda m: m.group(1) + value + m.group(2), txt)
                if n == 0:
                    print("WARN clé introuvable:", name, key)
        if txt != before:
            with open(p, "w", encoding="utf-8", newline="") as f:
                f.write(txt)
            changed.append(os.path.relpath(p, ROOT))

# 2) Titre racine explicite
idx = os.path.join(ROOT, "index.html")
with open(idx, encoding="utf-8") as f:
    t = f.read()
t = t.replace("<title>منصة الخدمات الجامعية — سمارت كامبس دي زي</title>",
              "<title>Smart Campus DZ — المنصة الجزائرية الذكية للحياة الجامعية</title>")
with open(idx, "w", encoding="utf-8", newline="") as f:
    f.write(t)

# 3) Image d'accueil : photo d'université étrangère (Unsplash)
imgdir = os.path.join(ROOT, "assets", "images")
src = r"C:\Users\pc\Downloads\UNIVERSITE_TISSEMSILT\new-hero.jpg"
for target in ("campus-hero-v2.jpg", "campus-hero.jpg"):
    shutil.copyfile(src, os.path.join(imgdir, target))

# 4) Suppression des anciennes images propres à l'établissement
for old in ("ut-seal.jpg", "ut-facade.jpg", "ut-gate.jpg", "campus-aerial.jpg"):
    p = os.path.join(imgdir, old)
    if os.path.exists(p):
        os.remove(p)

# 5) Fichier de comptes sur le Bureau
out = r"C:\Users\pc\Desktop\comptes_etudiants.txt"
if os.path.exists(out):
    with open(out, encoding="utf-8") as f:
        t = f.read()
    for old, new in MAPPING:
        t = t.replace(old, new)
    t = t.replace("COMPTES ÉTUDIANTS - Smart Campus DZ",
                  "COMPTES ÉTUDIANTS - Smart Campus DZ")
    with open(out, "w", encoding="utf-8", newline="") as f:
        f.write(t)

print("fichiers modifiés:", len(changed))
for c in changed:
    print(" -", c)
