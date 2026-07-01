#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
worker.py
=========
Consume la cola `ingestion_jobs` de Supabase y procesa los trabajos:

  - job_type = 'competition' → resuelve la temporada, lista los partidos de la
    competición y, para cada uno, descarga eventos crudos → slim → gzip → sube
    a Storage (bucket 'match-events').
  - job_type = 'match_events' → hace lo mismo para un único partido.

Diseñado para correr en GitHub Actions (cron / manual). Usa la service_role key,
que salta RLS para poder actualizar el estado de los trabajos.

Variables de entorno necesarias:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SDAPI_OUTLET_KEY (opcional)
"""

import os
import time
import traceback
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except Exception:
    pass

from supabase import create_client

import perform_api
from eventos_slim import procesar_partido


def _now():
    return datetime.now(timezone.utc).isoformat()


def get_client():
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
        raise RuntimeError('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.')
    return create_client(url, key)


def claim_pending_jobs(client, limit=5):
    """Devuelve los trabajos pendientes más antiguos."""
    resp = (
        client.table('ingestion_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', desc=False)
        .limit(limit)
        .execute()
    )
    return resp.data or []


def update_job(client, job_id, **fields):
    client.table('ingestion_jobs').update(fields).eq('id', job_id).execute()


import metrics_calculator

def process_match(client, match_id):
    """Descarga eventos de un partido, los adelgaza, los sube a Storage, y calcula métricas."""
    match_data = perform_api.fetch_match_events(match_id)
    procesar_partido(match_id, match_data, subir=True)
    
    # 2. Calcular y guardar métricas analíticas
    try:
        metrics_calculator.calculate_and_save(match_data, client, match_id)
    except Exception as e:
        print(f"  ⚠️ Error al calcular métricas para {match_id}: {e}")


def process_competition(client, job):
    """Procesa todos los partidos de una competición/temporada."""
    competition_id = job.get('competition_id')
    # Preferimos el tmcl (season_id) que viene en el job; el endpoint que
    # resuelve la temporada a partir de la competición no es fiable con esta key.
    season_id = job.get('season_id') or perform_api.get_season_id(competition_id)
    if not season_id:
        raise RuntimeError(
            'Falta el ID de temporada (tmcl). Indícalo en el trabajo '
            f'(competición {competition_id}).'
        )

    matches = perform_api.fetch_fixtures(season_id)
    match_ids = perform_api.collect_match_ids(matches, competition_id)
    # Si el filtro por competición deja 0 (p.ej. ID mal puesto) pero la
    # temporada sí trae partidos, procesamos todos los de esa temporada.
    if not match_ids and matches:
        match_ids = perform_api.collect_match_ids(matches, None)
    total = len(match_ids)
    update_job(client, job['id'], matches_total=total)
    print(f'  Competición {competition_id}: {total} partidos')

    processed = 0
    errores = 0
    for i, mid in enumerate(match_ids, 1):
        # Cada 10 partidos comprobamos si el trabajo fue cancelado en la DB
        if i % 10 == 1:
            try:
                db_job = client.table('ingestion_jobs').select('status').eq('id', job['id']).execute()
                if db_job.data and db_job.data[0]['status'] == 'cancelled':
                    raise RuntimeError("Trabajo cancelado por el usuario.")
                elif not db_job.data:
                    raise RuntimeError("Trabajo borrado de la base de datos.")
            except RuntimeError:
                raise
            except Exception as e:
                print(f"  ⚠️ Error al comprobar estado del job: {e}")

        try:
            process_match(client, mid)
            processed += 1
        except Exception as e:  # noqa: BLE001
            errores += 1
            print(f'  ⚠️ Partido {mid} falló: {e}')
        # Progreso en vivo cada partido (barato) para que el panel lo vea.
        update_job(client, job['id'], matches_processed=processed)
        time.sleep(0.3)  # cortesía con la API

    msg = f'{processed}/{total} partidos procesados'
    if errores:
        msg += f' ({errores} con error)'
    return processed, total, msg


def handle_job(client, job):
    job_id = job['id']
    print(f"▶️  Job {job_id} ({job['job_type']})")
    update_job(client, job_id, status='processing', started_at=_now(), message=None)
    try:
        if job['job_type'] == 'competition':
            processed, total, msg = process_competition(client, job)
        elif job['job_type'] == 'match_events':
            process_match(client, job['match_id'])
            processed, total, msg = 1, 1, 'Partido procesado'
        else:
            raise RuntimeError(f"Tipo de trabajo desconocido: {job['job_type']}")

        update_job(
            client,
            job_id,
            status='done',
            finished_at=_now(),
            matches_processed=processed,
            matches_total=total,
            message=msg,
        )
        print(f'✅ Job {job_id}: {msg}')
    except Exception as e:  # noqa: BLE001
        traceback.print_exc()
        update_job(
            client,
            job_id,
            status='error',
            finished_at=_now(),
            message=str(e)[:500],
        )
        print(f'❌ Job {job_id}: {e}')


def main():
    client = get_client()
    print("Iniciando Worker en modo continuo... (Presiona Ctrl+C para salir)")
    while True:
        jobs = claim_pending_jobs(client)
        if not jobs:
            time.sleep(5)
            continue
            
        print(f'{len(jobs)} trabajo(s) pendiente(s).')
        for job in jobs:
            handle_job(client, job)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nWorker detenido manualmente.")
