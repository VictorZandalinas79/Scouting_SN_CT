#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
perform_api.py
==============
Cliente mínimo de la API de Opta/Performfeeds (formato JSONP), portado de los
scripts existentes. Lo usa el worker para descargar fixtures y eventos.
"""

import os
import json
import time
from pathlib import Path

import requests

SDAPI_OUTLET_KEY = os.environ.get('SDAPI_OUTLET_KEY', 'ft1tiv1inq7v1sk3y9tv12yh5')

BASE = 'https://api.performfeeds.com/soccerdata'


def load_headers():
    """Headers desde headers/headers.json si existe; si no, unos por defecto."""
    headers_path = Path('headers/headers.json')
    if headers_path.exists():
        try:
            with open(headers_path, 'r', encoding='utf-8') as f:
                headers = json.load(f)
            headers = {k: v for k, v in headers.items() if not k.startswith(':')}
            for k in ['Host', 'Authority', 'authority', 'host']:
                headers.pop(k, None)
            return headers
        except Exception:
            pass
    return {
        'Referer': 'https://www.scoresway.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }


def _parse_jsonp(text):
    """Extrae el JSON de una respuesta JSONP (callback({...}))."""
    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1:
        return None
    return json.loads(text[start:end + 1])


def _get(url, headers=None, timeout=20):
    res = requests.get(url, headers=headers or load_headers(), timeout=timeout)
    res.raise_for_status()
    data = _parse_jsonp(res.text)
    if data is None:
        raise RuntimeError('Respuesta JSONP malformada')
    if 'errorCode' in data:
        raise RuntimeError(f"Error de API: {data.get('errorCode')} {data.get('errorMessage', '')}")
    return data


def get_season_id(competition_id):
    """Resuelve la temporada actual (tmcl) de una competición."""
    url = f'{BASE}/competitions/{SDAPI_OUTLET_KEY}/?_fmt=jsonp&_rt=c&_lcl=en&sps=widgets&_clbk=callback'
    data = _get(url)
    for comp in data.get('competition', []):
        if comp.get('id') == competition_id:
            cs = comp.get('currentSeason', {})
            if cs.get('id'):
                return cs['id']
            seasons = comp.get('seasons', [])
            if seasons:
                return seasons[0].get('id')
    return None


def fetch_fixtures(season_id):
    """Lista de partidos de una temporada. Devuelve los objetos 'match' crudos."""
    url = (
        f'{BASE}/match/{SDAPI_OUTLET_KEY}/'
        f'?_fmt=jsonp&_rt=c&tmcl={season_id}&live=yes&_pgSz=400&_lcl=en'
        f'&sps=widgets&_clbk=callback'
    )
    data = _get(url)
    return data.get('match', [])


def collect_match_ids(matches, competition_id=None):
    """Extrae los IDs de partido de la lista de fixtures (opcionalmente filtrando por competición)."""
    ids = []
    for m in matches:
        info = m.get('matchInfo', {})
        if competition_id and info.get('competition', {}).get('id') != competition_id:
            continue
        mid = info.get('id')
        if mid:
            ids.append(mid)
    return ids


def fetch_match_events(match_id, retries=2):
    """Descarga el JSON crudo de eventos de un partido."""
    url = (
        f'{BASE}/matchevent/{SDAPI_OUTLET_KEY}/{match_id}'
        f'?_fmt=jsonp&_rt=c&_lcl=en&sps=widgets&_clbk=callback'
    )
    last_err = None
    for attempt in range(retries + 1):
        try:
            return _get(url)
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise last_err
