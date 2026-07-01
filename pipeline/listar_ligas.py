#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
listar_ligas.py
===============
Busca competiciones disponibles para tu clave y muestra su `competition` y su
`tmcl` (temporada) para usarlos con descargar_competicion.py.

Uso:
    python listar_ligas.py --buscar "España"
    python listar_ligas.py --buscar "premier"
    python listar_ligas.py --buscar "Hungría" --todas-temporadas
"""

import argparse

import perform_api as api


def fetch_calendars():
    url = (
        f'{api.BASE}/tournamentcalendar/{api.SDAPI_OUTLET_KEY}/authorized'
        f'?_fmt=jsonp&_rt=c&_lcl=en&_clbk=callback'
    )
    return api._get(url).get('competition', [])


def main():
    ap = argparse.ArgumentParser(description='Busca ligas y sus IDs de temporada.')
    ap.add_argument('--buscar', default='', help='Filtro por nombre de liga o país')
    ap.add_argument('--todas-temporadas', action='store_true',
                    help='Mostrar todas las temporadas (por defecto solo la activa/última)')
    args = ap.parse_args()

    q = args.buscar.strip().lower()
    comps = fetch_calendars()

    filas = []
    for comp in comps:
        name = comp.get('name', '')
        country = comp.get('country', '')
        if q and q not in name.lower() and q not in country.lower():
            continue

        cals = comp.get('tournamentCalendar', []) or []
        if not args.todas_temporadas:
            # Preferimos la temporada activa; si no, la más reciente por fecha.
            activa = [c for c in cals if c.get('active') == 'yes']
            cals = activa or (sorted(cals, key=lambda c: c.get('startDate', ''), reverse=True)[:1])

        for c in cals:
            filas.append((country, name, comp.get('id'), c.get('id'), c.get('name'),
                          c.get('active') == 'yes'))

    if not filas:
        print(f'Sin resultados para "{args.buscar}". Prueba otro término.')
        return

    filas.sort(key=lambda r: (r[0], r[1], r[4] or ''))
    print(f'\n{len(filas)} resultado(s):\n')
    print(f'{"PAÍS":18} {"LIGA":30} {"TEMPORADA":12} {"COMPETITION ID":26} {"TMCL (temporada)":26}')
    print('-' * 116)
    for country, name, cid, tmcl, season, activa in filas:
        marca = ' ●' if activa else ''
        print(f'{country[:17]:18} {name[:29]:30} {(season or "")[:11]:12} {cid:26} {tmcl:26}{marca}')
    print('\n● = temporada activa. Copia COMPETITION ID + TMCL en descargar_competicion.py')


if __name__ == '__main__':
    main()
