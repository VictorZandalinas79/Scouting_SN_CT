#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except Exception:
    pass

from supabase import create_client

def get_client():
    url = (os.environ.get('SUPABASE_URL') or os.environ.get('VITE_SUPABASE_URL') or '').strip().strip('"').strip("'")
    key = (os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY') or '').strip().strip('"').strip("'")
    if not url or not key:
        raise RuntimeError('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.')
    return create_client(url, key)

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'opta_leagues.json')
    if not os.path.exists(json_path):
        print(f"No se encuentra {json_path}")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    print(f"Cargadas {len(data)} competiciones desde JSON.")

    client = get_client()

    # Prepara records asegurando el mapeo con la DB
    records = []
    for item in data:
        records.append({
            'competition_id': item['competitionId'],
            'season_id': item['seasonId'],
            'name': item['name'],
            'country': item['country'],
            'season_name': item['seasonName'],
            'is_active': item['isActive']
        })

    print("Insertando en Supabase (lotes de 5000)...")
    
    # Insert in batches to avoid payload limits
    batch_size = 5000
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            client.table('opta_competitions').upsert(batch).execute()
            print(f"Insertados registros del {i} al {i + len(batch)}")
        except Exception as e:
            print(f"Error insertando lote {i}: {e}")
        time.sleep(1) # Be nice to the DB

    print("✅ Subida completada.")

if __name__ == '__main__':
    main()
