#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
eventos_slim.py
===============
Convierte los eventos crudos de Opta/Performfeeds de un partido en el formato
"slim" que consume el <PitchMap/> del frontend, los comprime con gzip y los
sube a Supabase Storage (bucket 'match-events') como {match_id}/events.json.gz.

El JSON de Opta es muy repetitivo → comprime ~15-20x, así que miles de partidos
caben en el 1 GB gratuito de Storage. Los campogramas se dibujan en el navegador
descargando este .gz (nunca se guardan imágenes).

Uso:
    # desde un fichero local de eventos crudos
    python eventos_slim.py --match-id 8m6p1z --file data/.../8m6p1z.json

    # o pasando el JSON crudo por stdin
    cat eventos.json | python eventos_slim.py --match-id 8m6p1z
"""

import os
import io
import gzip
import json
import argparse
import sys

# Carga .env del repo si python-dotenv está disponible (para uso local).
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except Exception:
    pass

# ── Qualifiers Opta relevantes ──
Q_PASS_END_X = 140
Q_PASS_END_Y = 141

# ── typeId Opta → nombre legible (para tooltips en el frontend) ──
TYPE_NAMES = {
    1: 'Pase',
    2: 'Pase en fuera de juego',
    3: 'Regate',
    7: 'Entrada',
    8: 'Intercepción',
    12: 'Despeje',
    13: 'Tiro fuera',
    14: 'Al palo',
    15: 'Tiro a puerta',
    16: 'Gol',
    49: 'Recuperación',
    74: 'Pase bloqueado',
}

# Solo estos tipos viajan al frontend (los que dibuja el PitchMap).
# Reduce aún más el tamaño frente a subir los ~1200 eventos completos.
KEEP_TYPES = set(TYPE_NAMES.keys())


def _qualifier_float(event, qual_id):
    for q in event.get('qualifier', []):
        if q.get('qualifierId') == qual_id:
            try:
                return float(q.get('value'))
            except (TypeError, ValueError):
                return None
    return None


def build_slim_events(match_data):
    """Transforma el JSON crudo de la API en una lista de eventos slim."""
    events = match_data.get('liveData', {}).get('event', [])
    slim = []
    for ev in events:
        type_id = ev.get('typeId')
        if type_id not in KEEP_TYPES:
            continue

        item = {
            'type': type_id,
            'typeName': TYPE_NAMES.get(type_id),
            'x': ev.get('x'),
            'y': ev.get('y'),
        }

        # Destino del pase (qualifiers 140/141)
        if type_id in (1, 2):
            end_x = _qualifier_float(ev, Q_PASS_END_X)
            end_y = _qualifier_float(ev, Q_PASS_END_Y)
            if end_x is not None:
                item['endX'] = end_x
            if end_y is not None:
                item['endY'] = end_y

        if ev.get('playerId'):
            item['playerId'] = ev['playerId']
        if ev.get('playerName'):
            item['playerName'] = ev['playerName']
        if ev.get('contestantId'):
            item['teamId'] = ev['contestantId']
        if ev.get('outcome') is not None:
            item['outcome'] = ev['outcome']
        if ev.get('timeMin') is not None:
            item['min'] = ev['timeMin']
        if ev.get('timeSec') is not None:
            item['sec'] = ev['timeSec']

        slim.append(item)
    return slim


def gzip_json(payload) -> bytes:
    """Serializa a JSON compacto y comprime con gzip."""
    raw = json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=9) as gz:
        gz.write(raw)
    return buf.getvalue(), len(raw)


def upload_to_storage(match_id, gz_bytes):
    """Sube el .gz al bucket 'match-events' de Supabase (upsert)."""
    from supabase import create_client

    url = (
        os.environ.get('SUPABASE_URL')
        or os.environ.get('VITE_SUPABASE_URL')
        or ''
    ).strip().strip('"').strip("'")
    key = (
        os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        or os.environ.get('SUPABASE_KEY')
        or ''
    ).strip().strip('"').strip("'")

    if not url or not key:
        raise RuntimeError('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.')

    client = create_client(url, key)
    path = f'{match_id}/events.json.gz'
    client.storage.from_('match-events').upload(
        path,
        gz_bytes,
        {
            'content-type': 'application/gzip',
            'content-encoding': 'gzip',
            'x-upsert': 'true',
        },
    )
    return path


def procesar_partido(match_id, match_data, subir=True):
    """Pipeline completo para un partido: slim → gzip → (upload)."""
    slim = build_slim_events(match_data)
    gz_bytes, raw_len = gzip_json(slim)
    ratio = raw_len / max(1, len(gz_bytes))
    print(
        f'  {match_id}: {len(slim)} eventos slim · '
        f'{raw_len // 1024} KB → {len(gz_bytes) // 1024} KB gzip (x{ratio:.1f})'
    )
    if subir:
        path = upload_to_storage(match_id, gz_bytes)
        print(f'  ✅ Subido a Storage: match-events/{path}')
    return slim, gz_bytes


def main():
    ap = argparse.ArgumentParser(description='Genera y sube eventos slim de un partido.')
    ap.add_argument('--match-id', required=True, help='ID del partido')
    ap.add_argument('--file', help='Ruta al JSON crudo de eventos (si no, se lee de stdin)')
    ap.add_argument('--from-api', action='store_true',
                    help='Descargar los eventos crudos desde la API de Opta')
    ap.add_argument('--no-upload', action='store_true', help='Solo generar, sin subir a Storage')
    ap.add_argument('--out', help='Guardar el .gz también en local (ruta)')
    args = ap.parse_args()

    if args.from_api:
        import perform_api
        match_data = perform_api.fetch_match_events(args.match_id)
    elif args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            match_data = json.load(f)
    else:
        match_data = json.load(sys.stdin)

    slim, gz_bytes = procesar_partido(
        args.match_id, match_data, subir=not args.no_upload
    )

    if args.out:
        with open(args.out, 'wb') as f:
            f.write(gz_bytes)
        print(f'  💾 Guardado local: {args.out}')


if __name__ == '__main__':
    main()
