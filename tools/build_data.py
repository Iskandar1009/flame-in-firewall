"""Normalize raw NASA PSI records (data/raw) into the JSON the dashboard ships with.

Run:  python3 -I tools/build_data.py
Source of every value: https://psi.nasa.gov (Physical Sciences Informatics), CC0-1.0.
"""
import csv, glob, json, os, re, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "web", "src", "data")
TABLES = os.path.join(RAW, "samples", "experimental_tables")


def read_csv(path):
    for enc in ("utf-8-sig", "cp1252"):
        try:
            with open(path, encoding=enc, newline="") as f:
                rows = list(csv.reader(f))
            break
        except UnicodeDecodeError:
            continue
    rows = [[c.strip() for c in r] for r in rows if any(c.strip() for c in r)]
    return rows[0], rows[1:]


def nums(s):
    return [float(x) for x in re.findall(r"(?<![A-Za-z])\d+\.?\d*", s or "")]


def num(s):
    """First number in a cell; a range like '21.5 - 21.7' becomes its mean."""
    n = nums(s)
    if not n:
        return None
    if len(n) >= 2 and re.search(r"\d\s*-\s*\d", s):
        return round((n[0] + n[1]) / 2, 3)
    return n[0]


def table(psi, contains=""):
    for p in sorted(glob.glob(os.path.join(TABLES, psi, "*.csv"))):
        if contains.lower() in os.path.basename(p).lower():
            return read_csv(p)
    raise FileNotFoundError(psi + " " + contains)


def col(h, *needles):
    for i, c in enumerate(h):
        if all(n.lower() in c.lower() for n in needles):
            return i
    raise KeyError(needles, h)


tests = []


def add(inv, test, fuel, phase, o2, p_atm, **kw):
    if o2 is None or o2 <= 0:
        return
    if p_atm is not None and p_atm <= 0.05:  # blank or zero pressure cell
        p_atm = None
    t = {"inv": inv, "test": str(test), "fuel": fuel, "phase": phase, "o2": round(o2, 2),
         "p": round(p_atm, 3) if p_atm is not None else None}
    t.update({k: v for k, v in kw.items() if v not in (None, "")})
    tests.append(t)


# --- FLEX (PSI-69): liquid droplets, suppression by dilution -----------------
h, rows = table("PSI-69")
def starts(h, prefix):
    return next(i for i, c in enumerate(h) if c.startswith(prefix))


# Gas columns are headed "O initial ambient composition", "CO initial ...", "He initial ..." (subscripts lost),
# so they are matched by exact prefix; a substring match would confuse "CO" with "composition".
iF, iP = col(h, "Fuel"), col(h, "pressure")
iO, iCO2, iHe = starts(h, "O initial"), starts(h, "CO initial"), starts(h, "He initial")
iEnd, iD0 = col(h, "Test end"), col(h, "initial diameter")
for r in rows:
    o, p = num(r[iO]), num(r[iP])
    if o is None or p is None:
        continue
    co2, he = num(r[iCO2]) or 0, num(r[iHe]) or 0
    dil = "CO2" if co2 > 0.01 else "He" if he > 0.01 else "N2"
    add("PSI-69", r[0], r[iF], "liquid droplet", o * 100, p / 760.0, diluent=dil, outcome=r[iEnd] or None, d0=num(r[iD0]))

# --- CFI (PSI-39): droplets, cool flames --------------------------------------
h, rows = table("PSI-39")
iP, iO, iHe, iFu = col(h, "Pressure"), col(h, "Oxygen"), col(h, "Helium"), col(h, "Fuel")
for r in rows:
    o, p = num(r[iO]), num(r[iP])
    if o is None:
        continue
    add("PSI-39", r[0], r[iFu], "liquid droplet", o * 100, p, diluent="He" if (num(r[iHe]) or 0) > 0.01 else "N2")

# --- ACME Flame Design (PSI-10) ----------------------------------------------
h, rows = table("PSI-10", "Normal")
iO, iP, iFu, iT = col(h, "XO2", "init"), col(h, "pmean"), col(h, "Fuel"), col(h, "Test")
for r in rows:
    add("PSI-10", r[iT], r[iFu], "gas", (num(r[iO]) or 0) * 100 or None, num(r[iP]), flame="normal")
h, rows = table("PSI-10", "Inverse")
iO, iP, iT = col(h, "XO2"), col(h, "pmean"), col(h, "Test")
for r in rows:
    add("PSI-10", r[iT], "C2H4", "gas", (num(r[iO]) or 0) * 100 or None, num(r[iP]), flame="inverse", o2Kind="oxidizer stream")

# --- ACME CFI-G (PSI-159) -----------------------------------------------------
BAR = 0.986923
h, rows = table("PSI-159", "Normal")
iO, iP, iFu, iT = col(h, "XO2", "before"), col(h, "approx p"), col(h, "Fuel"), col(h, "Test")
iCool, iHot, iSE = col(h, "Cool flame"), col(h, "Hot ignition"), col(h, "Self")
for r in rows:
    o = num(r[iO])
    add("PSI-159", r[iT], r[iFu], "gas", o * 100 if o else None, (num(r[iP]) or 0) * BAR or None, flame="normal",
        outcome={"SE": "Self-extinguished", "FT": "Flow terminated"}.get(r[iSE].strip()), cool=r[iCool].strip() or None,
        ignited=r[iHot].strip() or None)
h, rows = table("PSI-159", "Inverse")
iO, iP, iFu, iT = col(h, "XO2"), col(h, "approx p"), col(h, "Fuel"), col(h, "Test")
iHot, iSE = col(h, "Hot ignition"), col(h, "Self")
for r in rows:
    o = num(r[iO])
    add("PSI-159", r[iT], r[iFu], "gas", o * 100 if o else None, (num(r[iP]) or 0) * BAR or None, flame="inverse",
        o2Kind="oxidizer stream", outcome={"SE": "Self-extinguished", "FT": "Flow terminated"}.get(r[iSE].strip()),
        ignited=r[iHot].strip() or None)

# --- BASS-II (PSI-25): solids in the MSG flow duct, ISS cabin pressure ---------
h, rows = table("PSI-25")
iO, iM, iT = col(h, "initial O2"), col(h, "Material"), col(h, "Test #")
for r in rows:
    add("PSI-25", r[iT], r[iM], "solid", num(r[iO]), 1.0, pAssumed=True)

# --- Saffire I / II (PSI-98, PSI-99): large-scale solids in Cygnus ------------
for psi in ("PSI-98", "PSI-99"):
    h, rows = table(psi)
    iO, iM, iFl = col(h, "Percent O2"), col(h, "Material"), col(h, "Air Flow")
    for r in rows:
        add(psi, r[0], r[iM], "solid", num(r[iO]), 1.0, pAssumed=True, flow=num(r[iFl]))

# --- ACME BRE (PSI-20): emulated condensed fuels, O2 levels per test day -------
h, rows = table("PSI-20")
iO, iFu = col(h, "Oxygen"), col(h, "Fuel")
for n, r in enumerate(rows):
    for o in nums(r[iO]):
        o = o / 100 if o > 100 else o  # two cells are stored as "3400%" / "2100%" in the PSI table
        add("PSI-20", f"day{n+1}-{o:g}", r[iFu], "gas (emulated solid/liquid)", o, 1.0, pAssumed=True)

# --- FLEX-2 (PSI-68): published test matrix (ranges, not individual tests) -----
h, rows = table("PSI-68")
iO, iP = col(h, "Oxygen"), col(h, "Pressure")
for r in rows:
    for o in nums(r[iO]):
        for p in nums(r[iP]):
            add("PSI-68", f"matrix-{r[0]}-{o:g}-{p:g}", r[0], "liquid droplet", o * 100, p, matrix=True)

json.dump(tests, open(os.path.join(OUT, "tests.json"), "w"), separators=(",", ":"))

# --- Investigation metadata ----------------------------------------------------
def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").replace("\r", "")).strip()


invs = []
for path in glob.glob(os.path.join(RAW, "investigations", "*.json")):
    d = json.load(open(path))
    m = d["metadata"]
    acc = m["accession"]
    cats = {}
    for c in (d.get("files") or {}).get("files", []):
        cats[c.get("displayName", "?")] = len(c.get("files", []))
    mine = [t for t in tests if t["inv"] == acc]
    o2 = [t["o2"] for t in mine]
    pr = [t["p"] for t in mine if t.get("p") and not t.get("pAssumed")]
    pubs = [{"title": clean(p.get("title")), "authors": clean(p.get("authorList")), "doi": clean(p.get("doi"))}
            for p in m.get("publications", []) if clean(p.get("title"))]
    invs.append({
        "id": acc,
        "num": int(acc.split("-")[1]),
        "acronym": clean(m.get("investigationAcronym")),
        "title": clean(m.get("title")),
        "url": f"https://psi.nasa.gov/physci/repo/data/investigations/{acc}",
        "doi": clean(m.get("doi")),
        "subArea": clean(m.get("subResearchArea")),
        "projectType": clean(m.get("projectType")),
        "platform": clean(m.get("flightProgram")),
        "hardware": clean(m.get("experimentHardware")),
        "center": clean(m.get("managingNasaCenter")),
        "start": clean(m.get("investigationStartDate")),
        "end": clean(m.get("investigationEndDate")),
        "pis": sorted({clean(f"{c.get('firstName','')} {c.get('lastName','')}") for c in m.get("contacts", [])
                       if any("principal" in str(r).lower() for r in c.get("roles", []))}),
        "objective": clean(m.get("objective")),
        "hypothesis": clean(m.get("hypothesis")),
        "approach": clean(m.get("approach")),
        "impacts": clean(m.get("researchImpacts")),
        "nPubs": len(pubs),
        "pubs": pubs[:6],
        "nFiles": sum(cats.values()),
        "bytes": int(m.get("totalFileSize") or 0),
        "fileCats": cats,
        "tables": [e["file_name"] for e in m.get("experimentalTable", [])],
        "nTests": len(mine),
        "o2Range": [min(o2), max(o2)] if o2 else None,
        "pRange": [round(min(pr), 2), round(max(pr), 2)] if pr else None,
        "license": clean(m.get("licenseIdentifier")),
    })
invs.sort(key=lambda x: x["num"])
json.dump(invs, open(os.path.join(OUT, "investigations.json"), "w"), indent=1, ensure_ascii=False)

print(len(invs), "investigations;", len(tests), "test points")
for acc, n in sorted(Counter(t["inv"] for t in tests).items()):
    i = next(x for x in invs if x["id"] == acc)
    print(f"  {acc:8s} {i['acronym']:20s} n={n:4d}  O2 {i['o2Range']}  p {i['pRange']}")
print("FLEX outcomes:", Counter(t.get("outcome") for t in tests if t["inv"] == "PSI-69").most_common())
print("PIs sample:", invs[12]["pis"], "| bytes total:", sum(i["bytes"] for i in invs) / 1e12, "TB; files:", sum(i["nFiles"] for i in invs))
