# -*- coding: utf-8 -*-
p = r"C:\Users\pc\Desktop\comptes_etudiants.txt"
t = open(p, encoding="utf-8").read()
print("oldDomain:", "univ-tissemsilt" in t)
print("newDomainLines:", t.count("@etu.smartcampus.dz"))
print("sample:", t.splitlines()[6].strip())
