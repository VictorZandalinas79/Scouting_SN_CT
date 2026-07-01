import collections
import json
from datetime import datetime

class MetricsCalculator:
    def __init__(self, match_id, match_data):
        self.match_id = match_id
        self.match_data = match_data
        self.events = self.match_data.get('liveData', {}).get('event', [])
        
        # player_id -> { metric_name: value }
        self.player_metrics = collections.defaultdict(lambda: collections.defaultdict(int))
        self.player_teams = {}

    def run(self):
        self._parse_lineups()
        self._calculate_events()
        self._calculate_p90s()
        return self._format_for_db()

    def _parse_lineups(self):
        # A veces el lineup viene en match_data, si no, lo extraemos de los eventos
        lineups = self.match_data.get('liveData', {}).get('lineUp', [])
        for team in lineups:
            team_id = team.get('contestantId')
            for player in team.get('player', []):
                pid = player.get('playerId')
                if not pid:
                    continue
                self.player_teams[pid] = team_id
                
                # Obtener minutos si existen
                mins = 90 # Por defecto asuminos 90 min si no hay stat real
                for stat in player.get('stat', []):
                    if stat.get('type') == 'minsPlayed':
                        mins = int(stat.get('value', 0))
                
                self.player_metrics[pid]['minutes_played'] = mins

    def _calculate_events(self):
        for ev in self.events:
            pid = ev.get('playerId')
            if not pid:
                continue
            
            # Guardamos equipo si no estaba en el lineup
            if pid not in self.player_teams:
                self.player_teams[pid] = ev.get('contestantId')
                
            type_id = ev.get('typeId')
            qualifiers = {q.get('qualifierId'): q.get('value') for q in ev.get('qualifier', [])}
            outcome = ev.get('outcome', 1)
            
            metrics = self.player_metrics[pid]
            
            # Recuperaciones (Ball Recovery = typeId 49)
            if type_id == 49:
                metrics['def_recuperaciones'] += 1
                
            # Entradas (Tackle = typeId 7)
            if type_id == 7:
                metrics['entradas_totales'] += 1
                if outcome == 1:
                    metrics['entradas_exitosas'] += 1
                    
            # Duelos Aéreos (typeId 44)
            if type_id == 44:
                # 212: Own Half
                if outcome == 1 and 212 in qualifiers:
                    metrics['def_aereos_ganados_propio'] += 1
                    
            # Lanzador Corner (Corner = Pass typeId 1 con qualifier 5)
            if type_id == 1 and 5 in qualifiers:
                metrics['abp_lanzador_corner'] += 1
                
            # Aseguramos que haya un valor de minutos (fallback a 90 min)
            if 'minutes_played' not in metrics:
                metrics['minutes_played'] = 90

    def _calculate_p90s(self):
        for pid, metrics in self.player_metrics.items():
            mins = metrics.get('minutes_played', 90)
            if mins > 0:
                metrics['def_recuperaciones_p90'] = round(metrics.get('def_recuperaciones', 0) / mins * 90, 2)
                metrics['def_aereos_ganados_propio_p90'] = round(metrics.get('def_aereos_ganados_propio', 0) / mins * 90, 2)
                metrics['abp_lanzador_corner_p90'] = round(metrics.get('abp_lanzador_corner', 0) / mins * 90, 2)
                
            tot = metrics.get('entradas_totales', 0)
            if tot > 0:
                metrics['precision_entradas_pct'] = round(metrics.get('entradas_exitosas', 0) / tot * 100, 2)
            else:
                metrics['precision_entradas_pct'] = 0.0

    def _format_for_db(self):
        rows = []
        for pid, metrics in self.player_metrics.items():
            team_id = self.player_teams.get(pid, 'Unknown')
            
            native_cols = [
                'minutes_played',
                'def_aereos_ganados_propio',
                'def_aereos_ganados_propio_p90',
                'def_recuperaciones',
                'def_recuperaciones_p90',
                'entradas_totales',
                'entradas_exitosas',
                'precision_entradas_pct',
                'abp_lanzador_corner',
                'abp_lanzador_corner_p90'
            ]
            
            row = {
                'match_id': str(self.match_id),
                'player_id': str(pid),
                'team_id': str(team_id)
            }
            
            for col in native_cols:
                row[col] = metrics.pop(col, 0)
                
            row['metrics'] = metrics
            
            rows.append(row)
        return rows

def calculate_and_save(match_data, client, match_id):
    calc = MetricsCalculator(match_id, match_data)
    rows = calc.run()
    
    if not rows:
        return
        
    try:
        # Hacemos upsert usando la restricción única (match_id, player_id)
        # Asegurándonos de que exista el constraint para el upsert.
        # supabase-py upsert no requiere on_conflict explícito a menos que haya varias claves únicas.
        client.table('player_match_metrics').upsert(rows).execute()
        # print(f"  ✅ {len(rows)} métricas guardadas en DB")
    except Exception as e:
        print(f"  ❌ Error guardando métricas en Supabase: {e}")
