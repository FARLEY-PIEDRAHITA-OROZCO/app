#!/bin/bash

# Script para ejecutar el módulo API-Futbol

cd /app/backend

echo "===================================="
echo "MÓDULO API-FUTBOL"
echo "===================================="
echo ""
echo "Opciones:"
echo "1. Ejecutar tests"
echo "2. Procesar todas las ligas"
echo "3. Procesar 5 ligas (modo prueba)"
echo "4. Procesar una liga específica"
echo "5. Ver estadísticas de la BD"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo ""
        echo "Ejecutando tests..."
        python test_api_football.py
        ;;
    2)
        echo ""
        read -p "¿Estás seguro? Esto puede tomar varias horas (s/n): " confirm
        if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
            python -m api_football.main
        else
            echo "Operación cancelada"
        fi
        ;;
    3)
        echo ""
        echo "Procesando 5 ligas en modo prueba..."
        python -m api_football.main --limit 5
        ;;
    4)
        echo ""
        read -p "Ingresa el ID de la liga (ej: 140 para La Liga): " league_id
        python -m api_football.main --league-id $league_id
        ;;
    5)
        echo ""
        echo "Obteniendo estadísticas..."
        python -c "
from api_football.db_manager import DatabaseManager

db = DatabaseManager()
if db.connect():
    stats = db.get_statistics()
    print(f'\nTotal partidos: {stats.get(\"total_partidos\", 0)}')
    print(f'Total ligas: {stats.get(\"total_ligas\", 0)}')
    print('\nTop 10 ligas con más partidos:')
    for i, liga in enumerate(stats.get('partidos_por_liga', [])[:10], 1):
        print(f'  {i}. {liga.get(\"liga_nombre\", \"N/A\")} ({liga.get(\"_id\", \"N/A\")}): {liga.get(\"count\", 0)} partidos')
    db.close()
"
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac
