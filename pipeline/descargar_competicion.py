#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
descargar_competicion.py
========================
Descarga los eventos de TODOS los partidos de una competición/temporada y los
sube comprimidos a Supabase Storage. Uso local directo, sin la cola ni GitHub.

Uso:
    python descargar_competicion.py --competition <COMP_ID> --season <TMCL_ID>

Opciones:
    --limit N        Solo los primeros N partidos (para probar)
    --no-upload      No sube nada (solo comprueba la descarga/slim)

Los IDs se sacan del JSON de un partido:
    competition.id          -> --competition
    tournamentCalendar.id   -> --season  (el tmcl, la temporada)
"""

import argparse
import time

try:
    from dotenv import load_dotenv
    import os
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except Exception:
    pass

import perform_api
from eventos_slim import procesar_partido


def main():
    ap = argparse.ArgumentParser(description='Descarga una competición entera a Storage.')
    ap.add_argument('--competition', required=True, help='ID de competición (competition.id)')
    ap.add_argument('--season', required=True, help='ID de temporada / tmcl (tournamentCalendar.id)')
    ap.add_argument('--limit', type=int, default=0, help='Máximo de partidos (0 = todos)')
    ap.add_argument('--no-upload', action='store_true', help='No subir a Storage')
    args = ap.parse_args()

    print(f'📥 Fixtures de temporada {args.season}...')
    matches = perform_api.fetch_fixtures(args.season)
    match_ids = perform_api.collect_match_ids(matches, args.competition)
    if not match_ids and matches:
        print('   ⚠️ Ningún partido coincide con esa competición; uso todos los de la temporada.')
        match_ids = perform_api.collect_match_ids(matches, None)

    if args.limit:
        match_ids = match_ids[: args.limit]

    total = len(match_ids)
    print(f'   {total} partidos a procesar\n')

    ok, err = 0, 0
    for i, mid in enumerate(match_ids, 1):
        print(f'[{i}/{total}] {mid}')
        try:
            data = perform_api.fetch_match_events(mid)
            procesar_partido(mid, data, subir=not args.no_upload)
            ok += 1
        except Exception as e:  # noqa: BLE001
            err += 1
            print(f'  ⚠️ Error: {e}')
        time.sleep(0.3)  # cortesía con la API

    print(f'\n✅ Terminado: {ok} correctos, {err} con error, de {total}.')


if __name__ == '__main__':
    main()
