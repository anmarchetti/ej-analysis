#!/usr/bin/env python3
"""
Analizza i rendering Sitecore nel codebase frontend:
- Identifica tutti i rendering (cartelle in components/renderings/)
- Per ogni rendering, trova i componenti importati
- Per ogni componente, identifica le API invocate (da endpoints.ts)
Output: CSV con colonne: Rendering, Components, APIs
"""

import os
import re
import csv
import json
from pathlib import Path
from collections import defaultdict

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
RENDERINGS_DIR = BASE_DIR / "codebase" / "frontend" / "app_" / "src" / "frontend" / "components" / "renderings"
FRONTEND_SRC = BASE_DIR / "codebase" / "frontend" / "app_" / "src"
ENDPOINTS_FILE = BASE_DIR / "codebase" / "frontend" / "app_" / "src" / "code" / "endpoints.ts"
OUTPUT_CSV = BASE_DIR / "analysis" / "renderings_analysis.csv"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_ts_tsx_files(directory: Path) -> list:
    """Restituisce tutti i file .ts e .tsx in una directory (ricorsivo)."""
    files = []
    for ext in ("*.ts", "*.tsx"):
        files.extend(directory.rglob(ext))
    return files


def extract_api_names_from_endpoints(endpoints_path: Path) -> list:
    """
    Estrae i nomi delle funzioni/chiavi di API da endpoints.ts.
    Considera sia le chiavi degli oggetti export (webApiUrls.search, cmsUrls.media, ecc.)
    sia le funzioni esportate standalone.
    """
    if not endpoints_path.exists():
        return []

    content = endpoints_path.read_text(encoding="utf-8", errors="ignore")

    api_names = set()

    # Estrai tutti gli export object names con metodi
    for match in re.finditer(
        r'export\s+const\s+(\w+)\s*(?::\s*\w+\s*)?=\s*\{([^;]+?)\};',
        content,
        re.DOTALL
    ):
        obj_name = match.group(1)
        obj_body = match.group(2)
        # Estrai le chiavi (primo livello)
        for key_match in re.finditer(r'^\s{2,4}(\w+)\s*(?:[:(]|=>)', obj_body, re.MULTILINE):
            key = key_match.group(1)
            if key not in ('const', 'let', 'var', 'return', 'if', 'else', 'for', 'while'):
                api_names.add(f"{obj_name}.{key}")

    # Funzioni standalone esportate
    func_pattern = re.compile(
        r'export\s+(?:const|function|async\s+function)\s+(\w+)',
        re.MULTILINE
    )
    for m in func_pattern.finditer(content):
        name = m.group(1)
        if name not in ('QS_CONFIG',):
            api_names.add(name)

    return sorted(api_names)


def find_imports_in_file(file_path: Path) -> list:
    """Estrae i moduli/componenti importati da un file."""
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    imports = []
    for m in re.finditer(r"import\s+(?:[^'\"]+\s+from\s+)?['\"]([^'\"]+)['\"]", content):
        imports.append(m.group(1))

    return imports


def find_api_usages_in_file(file_path: Path, api_names: list) -> list:
    """
    Cerca nell'intero file quali API (da endpoints.ts) vengono usate.
    """
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    found_apis = set()
    for api in api_names:
        short_name = api.split(".")[-1] if "." in api else api
        full_name = api

        if re.search(r'\b' + re.escape(full_name) + r'\b', content):
            found_apis.add(api)
        elif "." in api:
            obj_name = api.split(".")[0]
            if re.search(r'\b' + re.escape(obj_name) + r'\b', content) and \
               re.search(r'\b' + re.escape(short_name) + r'\b', content):
                found_apis.add(api)

    return sorted(found_apis)


def find_fetch_api_patterns(file_path: Path) -> list:
    """
    Cerca pattern di chiamate HTTP dirette nel file.
    """
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    found = set()

    # fetch(url)
    for m in re.finditer(r'\bfetch\s*\(\s*([^,\)]{1,80})', content):
        arg = m.group(1).strip().strip('"\'`')
        if arg and not arg.startswith('{'):
            found.add(f"fetch({arg[:60]})")

    # axios.method(url)
    for m in re.finditer(r'\baxios\.(get|post|put|delete|patch)\s*\(\s*([^,\)]{1,80})', content):
        method = m.group(1)
        arg = m.group(2).strip().strip('"\'`')
        found.add(f"axios.{method}({arg[:60]})")

    # useQuery / useSWR ecc.
    for m in re.finditer(r'\b(useQuery|useMutation|useSWR|useInfiniteQuery)\s*\(', content):
        hook = m.group(1)
        start = m.start()
        snippet = content[start:start+300]
        url_matches = re.findall(r'(webApiUrls|cmsUrls|userManagementUrls|umApiUrls|getWepApiUri|getUMApiUri)\.\w+', snippet)
        if url_matches:
            for um in set(url_matches):
                found.add(f"{hook}→{um}")
        else:
            found.add(f"{hook}(...)")

    return sorted(found)


def resolve_import_to_component_name(import_path: str):
    """
    Da un percorso di import, estrae il nome del componente.
    """
    patterns = [
        r'frontend/components/(?:renderings/)?(\w+)',
        r'frontend/components/(\w+)',
        r'frontend/hooks/(\w+)',
        r'frontend/services/(\w+)',
        r'\./(\w+)',
        r'\.\./(\w+)',
    ]
    skip = re.compile(r'^(styles|types|utils|hooks|index|constants|helpers|models|mocks|test|interfaces|__)', re.I)

    for p in patterns:
        m = re.match(p, import_path)
        if m:
            name = m.group(1)
            if not skip.match(name):
                return name
    return None


def get_components_used_in_rendering(rendering_dir: Path, all_api_names: list):
    """
    Per una cartella di rendering:
    1. Trova tutti i file .tsx/.ts
    2. Estrae gli import (componenti usati)
    3. Cerca le API usate in tutti i file
    """
    ts_files = list(rendering_dir.rglob("*.tsx")) + list(rendering_dir.rglob("*.ts"))
    ts_files = [f for f in ts_files if ".test." not in f.name]

    all_imports = set()
    all_apis = set()

    for f in ts_files:
        imports = find_imports_in_file(f)
        for imp in imports:
            comp = resolve_import_to_component_name(imp)
            if comp:
                all_imports.add(comp)

        apis = find_api_usages_in_file(f, all_api_names)
        all_apis.update(apis)

        fetch_patterns = find_fetch_api_patterns(f)
        all_apis.update(fetch_patterns)

    return sorted(all_imports), sorted(all_apis)


def get_api_usages_from_single_file(file_path: Path, all_api_names: list):
    """Per rendering a file singolo (.tsx dirette nella cartella renderings)."""
    imports = find_imports_in_file(file_path)
    comps = set()
    for imp in imports:
        comp = resolve_import_to_component_name(imp)
        if comp:
            comps.add(comp)

    apis = find_api_usages_in_file(file_path, all_api_names)
    fetch_patterns = find_fetch_api_patterns(file_path)

    return sorted(comps), sorted(set(apis) | set(fetch_patterns))


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print(f"Analyzing renderings in: {RENDERINGS_DIR}")
    print(f"Loading API names from: {ENDPOINTS_FILE}")

    # 1. Carica i nomi delle API da endpoints.ts
    all_api_names = extract_api_names_from_endpoints(ENDPOINTS_FILE)
    print(f"Found {len(all_api_names)} API definitions in endpoints.ts")

    # 2. Identifica tutti i rendering
    renderings = []

    for item in sorted(RENDERINGS_DIR.iterdir()):
        if item.is_dir():
            renderings.append(("dir", item.name, item))

    for item in sorted(RENDERINGS_DIR.iterdir()):
        if item.is_file() and item.suffix in (".tsx", ".ts") and not item.name.startswith("_"):
            if ".test." not in item.name and ".module." not in item.name:
                rendering_name = item.stem
                renderings.append(("file", rendering_name, item))

    print(f"Found {len(renderings)} renderings total")

    # 3. Per ogni rendering, analizza componenti e API
    rows = []
    for rtype, rname, rpath in renderings:
        if rtype == "dir":
            components, apis = get_components_used_in_rendering(rpath, all_api_names)
        else:
            components, apis = get_api_usages_from_single_file(rpath, all_api_names)

        rows.append({
            "rendering": rname,
            "components": " | ".join(components) if components else "",
            "apis": " | ".join(apis) if apis else "",
            "num_components": len(components),
            "num_apis": len(apis),
        })

        print(f"  {rname}: {len(components)} components, {len(apis)} APIs")

    # 4. Scrivi il CSV
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["rendering", "num_components", "components", "num_apis", "apis"],
            quoting=csv.QUOTE_ALL,
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nCSV saved to: {OUTPUT_CSV}")
    print(f"   Total renderings: {len(rows)}")
    print(f"   Renderings with APIs: {sum(1 for r in rows if r['num_apis'] > 0)}")
    print(f"   Renderings with sub-components: {sum(1 for r in rows if r['num_components'] > 0)}")


if __name__ == "__main__":
    main()
