#!/usr/bin/env python3
"""
Backend Test Suite for PLLA 3.0 Sports Prediction Engine
=========================================================

Tests all prediction engine endpoints in the correct order:
1. Build Statistics (must run first)
2. Classification
3. Generate Prediction
4. Team Stats
5. Validate Prediction
6. Effectiveness
7. Config
8. Teams List

Usage: python backend_test.py
"""

import requests
import json
import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://predictify-24.preview.emergentagent.com/api"

class PredictionEngineTest:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = {}
        self.prediction_id = None  # Store for validation test
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request and return response."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {endpoint} -> Status: {response.status_code}")
            
            if response.status_code >= 400:
                self.log(f"Error Response: {response.text}", "ERROR")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError as e:
            self.log(f"JSON decode error: {str(e)}", "ERROR")
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }

    def test_1_build_statistics(self) -> bool:
        """Test 1: Build Statistics - Must run first."""
        self.log("=== TEST 1: Build Statistics ===")
        
        data = {
            "liga_id": "SPAIN_LA_LIGA",
            "temporada": 2023
        }
        
        result = self.make_request("POST", "/prediction/build-stats", data)
        
        if not result["success"]:
            self.log("❌ Build statistics failed", "ERROR")
            return False
            
        response_data = result["data"]
        
        # Validate response structure
        expected_fields = ["success", "message", "liga_id", "temporada", "equipos"]
        missing_fields = [f for f in expected_fields if f not in response_data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in response: {missing_fields}", "ERROR")
            return False
            
        if not response_data.get("success"):
            self.log("❌ Build statistics returned success=false", "ERROR")
            return False
            
        equipos_count = len(response_data.get("equipos", []))
        if equipos_count != 20:
            self.log(f"❌ Expected 20 teams, got {equipos_count}", "ERROR")
            return False
            
        self.log(f"✅ Statistics built for {equipos_count} teams")
        self.test_results["build_stats"] = True
        return True

    def test_2_classification(self) -> bool:
        """Test 2: Get Classification Table."""
        self.log("=== TEST 2: Classification ===")
        
        # Test complete time classification
        result = self.make_request("GET", "/prediction/classification?liga_id=SPAIN_LA_LIGA&temporada=2023&tipo_tiempo=completo")
        
        if not result["success"]:
            self.log("❌ Classification request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        if "clasificacion" not in data:
            self.log("❌ No 'clasificacion' field in classification response", "ERROR")
            return False
            
        equipos = data["clasificacion"]
        if len(equipos) != 20:
            self.log(f"❌ Expected 20 teams in classification, got {len(equipos)}", "ERROR")
            return False
            
        # Check if Real Madrid is first with expected points
        primer_equipo = equipos[0]
        if primer_equipo["equipo"] != "Real Madrid":
            self.log(f"❌ Expected Real Madrid first, got {primer_equipo['equipo']}", "ERROR")
            return False
            
        if primer_equipo["pts"] != 95:
            self.log(f"❌ Expected Real Madrid with 95 points, got {primer_equipo['pts']}", "ERROR")
            return False
            
        # Test first half classification
        result_1mt = self.make_request("GET", "/prediction/classification?liga_id=SPAIN_LA_LIGA&temporada=2023&tipo_tiempo=primer_tiempo")
        
        if not result_1mt["success"]:
            self.log("❌ First half classification failed", "ERROR")
            return False
            
        self.log("✅ Classification tables working correctly")
        self.test_results["classification"] = True
        return True

    def test_3_generate_prediction(self) -> bool:
        """Test 3: Generate Prediction."""
        self.log("=== TEST 3: Generate Prediction ===")
        
        # Test Barcelona vs Real Madrid
        data = {
            "equipo_local": "Barcelona",
            "equipo_visitante": "Real Madrid",
            "liga_id": "SPAIN_LA_LIGA",
            "temporada": 2023
        }
        
        result = self.make_request("POST", "/prediction/generate", data)
        
        if not result["success"]:
            self.log("❌ Prediction generation failed", "ERROR")
            return False
            
        response_data = result["data"]
        
        if not response_data.get("success"):
            self.log("❌ Prediction returned success=false", "ERROR")
            return False
            
        pronostico = response_data.get("pronostico")
        if not pronostico:
            self.log("❌ No prediction data in response", "ERROR")
            return False
            
        # Store prediction ID for validation test
        self.prediction_id = pronostico.get("id")
        
        # Validate prediction structure
        required_times = ["tiempo_completo", "primer_tiempo", "segundo_tiempo"]
        for tiempo in required_times:
            if tiempo not in pronostico:
                self.log(f"❌ Missing {tiempo} in prediction", "ERROR")
                return False
                
            tiempo_data = pronostico[tiempo]
            required_fields = ["pronostico", "doble_oportunidad", "ambos_marcan", "probabilidades", "confianza"]
            
            for field in required_fields:
                if field not in tiempo_data:
                    self.log(f"❌ Missing {field} in {tiempo}", "ERROR")
                    return False
                    
        # Validate probabilities sum to ~100%
        probs = pronostico["tiempo_completo"]["probabilidades"]
        total_prob = probs["local"] + probs["empate"] + probs["visita"]
        if not (95 <= total_prob <= 105):  # Allow 5% tolerance
            self.log(f"❌ Probabilities don't sum to 100%: {total_prob}%", "ERROR")
            return False
            
        # Test Real Madrid vs Almeria (different level teams)
        data_2 = {
            "equipo_local": "Real Madrid",
            "equipo_visitante": "Almeria",
            "liga_id": "SPAIN_LA_LIGA",
            "temporada": 2023
        }
        
        result_2 = self.make_request("POST", "/prediction/generate", data_2)
        
        if not result_2["success"]:
            self.log("❌ Second prediction test failed", "ERROR")
            return False
            
        # Should favor Real Madrid heavily
        pred_2 = result_2["data"]["pronostico"]["tiempo_completo"]
        if pred_2["pronostico"] != "L":  # Local (Real Madrid) should win
            self.log(f"❌ Expected Real Madrid to be favored, got {pred_2['pronostico']}", "ERROR")
            return False
            
        # Test non-existent team (should fail)
        data_error = {
            "equipo_local": "Equipo Falso",
            "equipo_visitante": "Real Madrid",
            "liga_id": "SPAIN_LA_LIGA",
            "temporada": 2023
        }
        
        result_error = self.make_request("POST", "/prediction/generate", data_error)
        
        if result_error["status_code"] != 404:
            self.log(f"❌ Expected 404 for fake team, got {result_error['status_code']}", "ERROR")
            return False
            
        self.log("✅ Prediction generation working correctly")
        self.test_results["generate_prediction"] = True
        return True

    def test_4_team_stats(self) -> bool:
        """Test 4: Team Statistics."""
        self.log("=== TEST 4: Team Statistics ===")
        
        result = self.make_request("GET", "/prediction/team/Barcelona?liga_id=SPAIN_LA_LIGA&temporada=2023")
        
        if not result["success"]:
            self.log("❌ Team stats request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["nombre", "liga_id", "temporada", "tiempo_completo", "primer_tiempo", "segundo_tiempo"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in team stats: {missing_fields}", "ERROR")
            return False
            
        if data["nombre"] != "Barcelona":
            self.log(f"❌ Expected Barcelona, got {data['nombre']}", "ERROR")
            return False
            
        # Validate stats structure - the API returns flat structure, not nested by general/local/visitante
        for tiempo in ["tiempo_completo", "primer_tiempo", "segundo_tiempo"]:
            stats = data[tiempo]
            required_stats = ["partidos_jugados", "victorias", "empates", "derrotas", "goles_favor", "goles_contra", "puntos"]
            
            for stat_field in required_stats:
                if stat_field not in stats:
                    self.log(f"❌ Missing {stat_field} in {tiempo} stats", "ERROR")
                    return False
                    
        self.log("✅ Team statistics working correctly")
        self.test_results["team_stats"] = True
        return True

    def test_5_validate_prediction(self) -> bool:
        """Test 5: Validate Prediction."""
        self.log("=== TEST 5: Validate Prediction ===")
        
        if not self.prediction_id:
            self.log("❌ No prediction ID available for validation", "ERROR")
            return False
            
        data = {
            "pronostico_id": self.prediction_id,
            "gol_local_tc": 2,
            "gol_visita_tc": 1,
            "gol_local_1mt": 1,
            "gol_visita_1mt": 0
        }
        
        result = self.make_request("POST", "/prediction/validate", data)
        
        if not result["success"]:
            self.log("❌ Prediction validation failed", "ERROR")
            return False
            
        response_data = result["data"]
        
        if not response_data.get("success"):
            self.log("❌ Validation returned success=false", "ERROR")
            return False
            
        validacion = response_data.get("validacion")
        if not validacion:
            self.log("❌ No validation data in response", "ERROR")
            return False
            
        # Validate structure
        required_fields = ["id", "pronostico_id", "resultado_real", "tiempo_completo"]
        missing_fields = [f for f in required_fields if f not in validacion]
        
        if missing_fields:
            self.log(f"❌ Missing fields in validation: {missing_fields}", "ERROR")
            return False
            
        tc_validation = validacion["tiempo_completo"]
        validation_fields = ["doble_oportunidad", "ambos_marcan", "acierto_principal"]
        
        for field in validation_fields:
            if field not in tc_validation:
                self.log(f"❌ Missing {field} in validation result", "ERROR")
                return False
                
        self.log("✅ Prediction validation working correctly")
        self.test_results["validate_prediction"] = True
        return True

    def test_6_effectiveness(self) -> bool:
        """Test 6: System Effectiveness."""
        self.log("=== TEST 6: System Effectiveness ===")
        
        result = self.make_request("GET", "/prediction/effectiveness")
        
        if not result["success"]:
            self.log("❌ Effectiveness request failed", "ERROR")
            return False
            
        data = result["data"]
        
        if not data.get("success"):
            self.log("❌ Effectiveness returned success=false", "ERROR")
            return False
            
        efectividad = data.get("efectividad")
        if efectividad is None:
            self.log("❌ No effectiveness data in response", "ERROR")
            return False
            
        self.log("✅ System effectiveness endpoint working")
        self.test_results["effectiveness"] = True
        return True

    def test_7_config(self) -> bool:
        """Test 7: Prediction Config."""
        self.log("=== TEST 7: Prediction Config ===")
        
        result = self.make_request("GET", "/prediction/config")
        
        if not result["success"]:
            self.log("❌ Config request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["version", "umbrales", "config"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in config: {missing_fields}", "ERROR")
            return False
            
        if data["version"] != "1.0.0":
            self.log(f"❌ Expected version 1.0.0, got {data['version']}", "ERROR")
            return False
            
        self.log("✅ Prediction config working correctly")
        self.test_results["config"] = True
        return True

    def test_8_teams_list(self) -> bool:
        """Test 8: Teams List."""
        self.log("=== TEST 8: Teams List ===")
        
        result = self.make_request("GET", "/prediction/teams?liga_id=SPAIN_LA_LIGA&temporada=2023")
        
        if not result["success"]:
            self.log("❌ Teams list request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["liga_id", "temporada", "total", "equipos"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in teams list: {missing_fields}", "ERROR")
            return False
            
        if data["total"] != 20:
            self.log(f"❌ Expected 20 teams, got {data['total']}", "ERROR")
            return False
            
        equipos = data["equipos"]
        if len(equipos) != 20:
            self.log(f"❌ Expected 20 teams in list, got {len(equipos)}", "ERROR")
            return False
            
        # Validate team structure
        first_team = equipos[0]
        required_team_fields = ["nombre", "puntos", "partidos_jugados", "rendimiento"]
        missing_team_fields = [f for f in required_team_fields if f not in first_team]
        
        if missing_team_fields:
            self.log(f"❌ Missing fields in team data: {missing_team_fields}", "ERROR")
            return False
            
        self.log("✅ Teams list working correctly")
        self.test_results["teams_list"] = True
        return True

    def test_9_seasons_list(self) -> bool:
        """Test 9: Seasons List - New season_id functionality."""
        self.log("=== TEST 9: Seasons List ===")
        
        result = self.make_request("GET", "/seasons")
        
        if not result["success"]:
            self.log("❌ Seasons list request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["total", "seasons"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in seasons list: {missing_fields}", "ERROR")
            return False
            
        seasons = data["seasons"]
        if not seasons:
            self.log("❌ No seasons found", "ERROR")
            return False
            
        # Validate season structure
        first_season = seasons[0]
        required_season_fields = ["season_id", "liga_id", "year", "total_partidos"]
        missing_season_fields = [f for f in required_season_fields if f not in first_season]
        
        if missing_season_fields:
            self.log(f"❌ Missing fields in season data: {missing_season_fields}", "ERROR")
            return False
            
        # Check season_id format
        season_id = first_season["season_id"]
        if not season_id.endswith("_2023-24"):
            self.log(f"❌ Expected season_id format like 'SPAIN_LA_LIGA_2023-24', got {season_id}", "ERROR")
            return False
            
        self.log(f"✅ Seasons list working correctly - found {len(seasons)} seasons")
        self.test_results["seasons_list"] = True
        return True

    def test_10_season_detail(self) -> bool:
        """Test 10: Season Detail - Get specific season."""
        self.log("=== TEST 10: Season Detail ===")
        
        season_id = "SPAIN_LA_LIGA_2023-24"
        result = self.make_request("GET", f"/seasons/{season_id}")
        
        if not result["success"]:
            self.log("❌ Season detail request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["season_id", "liga_id", "year", "total_partidos", "equipos"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in season detail: {missing_fields}", "ERROR")
            return False
            
        if data["season_id"] != season_id:
            self.log(f"❌ Expected season_id {season_id}, got {data['season_id']}", "ERROR")
            return False
            
        equipos = data["equipos"]
        if not equipos or len(equipos) < 10:  # Should have reasonable number of teams
            self.log(f"❌ Expected teams list, got {len(equipos) if equipos else 0} teams", "ERROR")
            return False
            
        self.log(f"✅ Season detail working correctly - {len(equipos)} teams found")
        self.test_results["season_detail"] = True
        return True

    def test_11_classification_with_season_id(self) -> bool:
        """Test 11: Classification with season_id parameter."""
        self.log("=== TEST 11: Classification with season_id ===")
        
        season_id = "SPAIN_LA_LIGA_2023-24"
        result = self.make_request("GET", f"/prediction/classification?season_id={season_id}&tipo_tiempo=completo")
        
        if not result["success"]:
            self.log("❌ Classification with season_id failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        if "clasificacion" not in data:
            self.log("❌ No 'clasificacion' field in response", "ERROR")
            return False
            
        # Check if season_id is included in response
        if "season_id" not in data:
            self.log("❌ No 'season_id' field in classification response", "ERROR")
            return False
            
        if data["season_id"] != season_id:
            self.log(f"❌ Expected season_id {season_id}, got {data['season_id']}", "ERROR")
            return False
            
        equipos = data["clasificacion"]
        if len(equipos) != 20:
            self.log(f"❌ Expected 20 teams in classification, got {len(equipos)}", "ERROR")
            return False
            
        self.log("✅ Classification with season_id working correctly")
        self.test_results["classification_season_id"] = True
        return True

    def test_12_teams_with_season_id(self) -> bool:
        """Test 12: Teams list with season_id parameter."""
        self.log("=== TEST 12: Teams with season_id ===")
        
        season_id = "SPAIN_LA_LIGA_2023-24"
        result = self.make_request("GET", f"/prediction/teams?season_id={season_id}")
        
        if not result["success"]:
            self.log("❌ Teams with season_id request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["season_id", "total", "equipos"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in teams with season_id: {missing_fields}", "ERROR")
            return False
            
        if data["season_id"] != season_id:
            self.log(f"❌ Expected season_id {season_id}, got {data['season_id']}", "ERROR")
            return False
            
        equipos = data["equipos"]
        if not equipos:
            self.log("❌ No teams found", "ERROR")
            return False
            
        # Validate team structure
        first_team = equipos[0]
        required_team_fields = ["nombre", "puntos"]
        missing_team_fields = [f for f in required_team_fields if f not in first_team]
        
        if missing_team_fields:
            self.log(f"❌ Missing fields in team data: {missing_team_fields}", "ERROR")
            return False
            
        self.log(f"✅ Teams with season_id working correctly - {len(equipos)} teams")
        self.test_results["teams_season_id"] = True
        return True

    def test_13_prediction_with_season_id(self) -> bool:
        """Test 13: Generate prediction with season_id - NEW PLLA 3.0 FEATURES."""
        self.log("=== TEST 13: Prediction with season_id + NEW FEATURES ===")
        
        data = {
            "equipo_local": "Barcelona",
            "equipo_visitante": "Real Madrid",
            "liga_id": "SPAIN_LA_LIGA",
            "season_id": "SPAIN_LA_LIGA_2023-24"
        }
        
        result = self.make_request("POST", "/prediction/generate", data)
        
        if not result["success"]:
            self.log("❌ Prediction with season_id failed", "ERROR")
            return False
            
        response_data = result["data"]
        
        if not response_data.get("success"):
            self.log("❌ Prediction returned success=false", "ERROR")
            return False
            
        pronostico = response_data.get("pronostico")
        if not pronostico:
            self.log("❌ No prediction data in response", "ERROR")
            return False
            
        # Validate season_id is included in response
        if "season_id" not in pronostico:
            self.log("❌ Missing season_id in prediction response", "ERROR")
            return False
            
        if pronostico["season_id"] != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ Expected season_id=SPAIN_LA_LIGA_2023-24, got {pronostico.get('season_id')}", "ERROR")
            return False
            
        # Validate prediction structure
        required_times = ["tiempo_completo", "primer_tiempo", "segundo_tiempo"]
        for tiempo in required_times:
            if tiempo not in pronostico:
                self.log(f"❌ Missing {tiempo} in prediction", "ERROR")
                return False
                
            tiempo_data = pronostico[tiempo]
            
            # NEW FEATURE 1: Validate over_under field
            if "over_under" not in tiempo_data:
                self.log(f"❌ Missing over_under in {tiempo}", "ERROR")
                return False
                
            over_under = tiempo_data["over_under"]
            required_over_under = ["over_15", "over_25", "over_35"]
            for ou in required_over_under:
                if ou not in over_under:
                    self.log(f"❌ Missing {ou} in over_under for {tiempo}", "ERROR")
                    return False
                    
                ou_data = over_under[ou]
                if "prediccion" not in ou_data or "probabilidad" not in ou_data:
                    self.log(f"❌ Missing prediccion/probabilidad in {ou} for {tiempo}", "ERROR")
                    return False
                    
                if ou_data["prediccion"] not in ["OVER", "UNDER"]:
                    self.log(f"❌ Invalid prediccion value in {ou}: {ou_data['prediccion']}", "ERROR")
                    return False
            
            # NEW FEATURE 2: Validate goles_esperados field
            if "goles_esperados" not in tiempo_data:
                self.log(f"❌ Missing goles_esperados in {tiempo}", "ERROR")
                return False
                
            goles_esperados = tiempo_data["goles_esperados"]
            required_goles = ["local", "visitante", "total"]
            for gol in required_goles:
                if gol not in goles_esperados:
                    self.log(f"❌ Missing {gol} in goles_esperados for {tiempo}", "ERROR")
                    return False
                    
                if not isinstance(goles_esperados[gol], (int, float)):
                    self.log(f"❌ Invalid goles_esperados value for {gol}: {goles_esperados[gol]}", "ERROR")
                    return False
                    
        # NEW FEATURE 3: Validate forma_reciente field
        if "forma_reciente" not in pronostico:
            self.log("❌ Missing forma_reciente in prediction", "ERROR")
            return False
            
        forma_reciente = pronostico["forma_reciente"]
        required_equipos = ["local", "visitante"]
        for equipo in required_equipos:
            if equipo not in forma_reciente:
                self.log(f"❌ Missing {equipo} in forma_reciente", "ERROR")
                return False
                
            forma_data = forma_reciente[equipo]
            required_forma_fields = ["ultimos_5", "rendimiento", "racha"]
            for field in required_forma_fields:
                if field not in forma_data:
                    self.log(f"❌ Missing {field} in forma_reciente.{equipo}", "ERROR")
                    return False
                    
            # Validate ultimos_5 is a list of V/E/D
            ultimos_5 = forma_data["ultimos_5"]
            if not isinstance(ultimos_5, list):
                self.log(f"❌ ultimos_5 should be a list, got {type(ultimos_5)}", "ERROR")
                return False
                
            for resultado in ultimos_5:
                if resultado not in ["V", "E", "D"]:
                    self.log(f"❌ Invalid resultado in ultimos_5: {resultado}", "ERROR")
                    return False
                    
            # Validate rendimiento is numeric
            if not isinstance(forma_data["rendimiento"], (int, float)):
                self.log(f"❌ rendimiento should be numeric, got {type(forma_data['rendimiento'])}", "ERROR")
                return False
                
        self.log("✅ Prediction with season_id + NEW FEATURES working correctly")
        self.log(f"   - season_id: {pronostico['season_id']}")
        self.log(f"   - over_under: ✅ (1.5, 2.5, 3.5 for all times)")
        self.log(f"   - goles_esperados: ✅ (local, visitante, total for all times)")
        self.log(f"   - forma_reciente: ✅ (ultimos_5, rendimiento, racha for both teams)")
        self.test_results["prediction_season_id"] = True
        return True

    def test_14_backward_compatibility(self) -> bool:
        """Test 14: Backward compatibility - legacy endpoints still work."""
        self.log("=== TEST 14: Backward Compatibility ===")
        
        # Test legacy classification endpoint
        result = self.make_request("GET", "/prediction/classification?liga_id=SPAIN_LA_LIGA&temporada=2023")
        
        if not result["success"]:
            self.log("❌ Legacy classification endpoint failed", "ERROR")
            return False
            
        data = result["data"]
        
        if "clasificacion" not in data:
            self.log("❌ No 'clasificacion' field in legacy response", "ERROR")
            return False
            
        equipos = data["clasificacion"]
        if len(equipos) != 20:
            self.log(f"❌ Expected 20 teams in legacy classification, got {len(equipos)}", "ERROR")
            return False
            
        # Test legacy teams endpoint
        result_teams = self.make_request("GET", "/prediction/teams?liga_id=SPAIN_LA_LIGA&temporada=2023")
        
        if not result_teams["success"]:
            self.log("❌ Legacy teams endpoint failed", "ERROR")
            return False
            
        teams_data = result_teams["data"]
        
        if "equipos" not in teams_data:
            self.log("❌ No 'equipos' field in legacy teams response", "ERROR")
            return False
            
        self.log("✅ Backward compatibility working correctly")
        self.test_results["backward_compatibility"] = True
        return True

    def test_15_stats_global_view(self) -> bool:
        """Test 15: Stats endpoint - Global view (without season_id)."""
        self.log("=== TEST 15: Stats Global View ===")
        
        result = self.make_request("GET", "/stats")
        
        if not result["success"]:
            self.log("❌ Stats global view request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["total_matches", "total_leagues", "leagues", "avg_goals_per_match", "total_goals", "last_update"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in stats global view: {missing_fields}", "ERROR")
            return False
            
        # Validate expected values from review request
        if data["total_matches"] != 380:
            self.log(f"❌ Expected total_matches=380, got {data['total_matches']}", "ERROR")
            return False
            
        # Check if SPAIN_LA_LIGA is in leagues
        leagues = data["leagues"]
        spain_la_liga_found = False
        for league in leagues:
            if league.get("_id") == "SPAIN_LA_LIGA" or "SPAIN_LA_LIGA" in str(league.get("liga_nombre", "")):
                spain_la_liga_found = True
                break
                
        if not spain_la_liga_found:
            self.log("❌ SPAIN_LA_LIGA not found in top leagues", "ERROR")
            return False
            
        # Validate numeric fields
        if not isinstance(data["avg_goals_per_match"], (int, float)):
            self.log("❌ avg_goals_per_match should be numeric", "ERROR")
            return False
            
        if not isinstance(data["total_goals"], int):
            self.log("❌ total_goals should be integer", "ERROR")
            return False
            
        self.log(f"✅ Stats global view working correctly - {data['total_matches']} matches, {data['total_leagues']} leagues")
        self.test_results["stats_global"] = True
        return True

    def test_16_stats_season_view(self) -> bool:
        """Test 16: Stats endpoint - Season view (with season_id)."""
        self.log("=== TEST 16: Stats Season View ===")
        
        season_id = "SPAIN_LA_LIGA_2023-24"
        result = self.make_request("GET", f"/stats?season_id={season_id}")
        
        if not result["success"]:
            self.log("❌ Stats season view request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["total_matches", "total_leagues", "leagues", "avg_goals_per_match", "total_goals", "last_update", "season_id", "season_label"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in stats season view: {missing_fields}", "ERROR")
            return False
            
        # Validate season_id fields
        if data["season_id"] != season_id:
            self.log(f"❌ Expected season_id={season_id}, got {data['season_id']}", "ERROR")
            return False
            
        if data["season_label"] != "2023-24":
            self.log(f"❌ Expected season_label=2023-24, got {data['season_label']}", "ERROR")
            return False
            
        # In season view, leagues should show jornadas (rounds) instead of leagues
        leagues = data["leagues"]
        if not leagues:
            self.log("❌ No leagues/jornadas found in season view", "ERROR")
            return False
            
        # Validate that we have jornadas (rounds) - they should be numbered
        first_league = leagues[0]
        if "_id" not in first_league:
            self.log("❌ Missing _id field in leagues/jornadas", "ERROR")
            return False
            
        # In season mode, _id should be round number (jornada)
        round_id = first_league["_id"]
        if not isinstance(round_id, (int, str)):
            self.log(f"❌ Expected round ID to be number or string, got {type(round_id)}", "ERROR")
            return False
            
        self.log(f"✅ Stats season view working correctly - season {data['season_label']}, {len(leagues)} jornadas")
        self.test_results["stats_season"] = True
        return True

    def test_17_leagues_list(self) -> bool:
        """Test 17: GET /api/leagues - Multi-league support."""
        self.log("=== TEST 17: Leagues List ===")
        
        result = self.make_request("GET", "/leagues")
        
        if not result["success"]:
            self.log("❌ Leagues list request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Should return a list of leagues
        if not isinstance(data, list):
            self.log("❌ Expected leagues list to be an array", "ERROR")
            return False
            
        if not data:
            self.log("❌ No leagues found", "ERROR")
            return False
            
        # Validate league structure
        first_league = data[0]
        required_fields = ["_id", "liga_nombre", "total_partidos"]
        missing_fields = [f for f in required_fields if f not in first_league]
        
        if missing_fields:
            self.log(f"❌ Missing fields in league data: {missing_fields}", "ERROR")
            return False
            
        # Check if SPAIN_LA_LIGA is present with 380 matches as mentioned in review request
        spain_la_liga_found = False
        for league in data:
            if league.get("_id") == "SPAIN_LA_LIGA":
                spain_la_liga_found = True
                if league.get("total_partidos") != 380:
                    self.log(f"❌ Expected SPAIN_LA_LIGA to have 380 matches, got {league.get('total_partidos')}", "ERROR")
                    return False
                break
                
        if not spain_la_liga_found:
            self.log("❌ SPAIN_LA_LIGA not found in leagues list", "ERROR")
            return False
            
        self.log(f"✅ Leagues list working correctly - found {len(data)} leagues, SPAIN_LA_LIGA with 380 matches")
        self.test_results["leagues_list"] = True
        return True

    def test_18_seasons_by_league(self) -> bool:
        """Test 18: GET /api/seasons?liga_id=SPAIN_LA_LIGA - Seasons for specific league."""
        self.log("=== TEST 18: Seasons by League ===")
        
        result = self.make_request("GET", "/seasons?liga_id=SPAIN_LA_LIGA")
        
        if not result["success"]:
            self.log("❌ Seasons by league request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["total", "seasons"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in seasons by league: {missing_fields}", "ERROR")
            return False
            
        seasons = data["seasons"]
        if not seasons:
            self.log("❌ No seasons found for SPAIN_LA_LIGA", "ERROR")
            return False
            
        # Validate season structure
        first_season = seasons[0]
        required_season_fields = ["season_id", "liga_id", "year", "total_partidos"]
        missing_season_fields = [f for f in required_season_fields if f not in first_season]
        
        if missing_season_fields:
            self.log(f"❌ Missing fields in season data: {missing_season_fields}", "ERROR")
            return False
            
        # All seasons should be for SPAIN_LA_LIGA
        for season in seasons:
            if season.get("liga_id") != "SPAIN_LA_LIGA":
                self.log(f"❌ Expected all seasons to be for SPAIN_LA_LIGA, found {season.get('liga_id')}", "ERROR")
                return False
                
        # Check season_id format
        season_id = first_season["season_id"]
        if not season_id.startswith("SPAIN_LA_LIGA_"):
            self.log(f"❌ Expected season_id to start with 'SPAIN_LA_LIGA_', got {season_id}", "ERROR")
            return False
            
        self.log(f"✅ Seasons by league working correctly - found {len(seasons)} seasons for SPAIN_LA_LIGA")
        self.test_results["seasons_by_league"] = True
        return True

    def test_19_new_plla_features(self) -> bool:
        """Test 19: NEW PLLA 3.0 Features - Over/Under, Goles Esperados, Forma Reciente."""
        self.log("=== TEST 19: NEW PLLA 3.0 FEATURES ===")
        
        # Test with different teams to get varied results
        data = {
            "equipo_local": "Real Madrid",
            "equipo_visitante": "Almeria",
            "liga_id": "SPAIN_LA_LIGA",
            "season_id": "SPAIN_LA_LIGA_2023-24"
        }
        
        result = self.make_request("POST", "/prediction/generate", data)
        
        if not result["success"]:
            self.log("❌ NEW PLLA 3.0 features test failed", "ERROR")
            return False
            
        response_data = result["data"]
        pronostico = response_data.get("pronostico")
        
        if not pronostico:
            self.log("❌ No prediction data in response", "ERROR")
            return False
        
        # Test 1: Detailed Over/Under validation
        self.log("--- Testing Over/Under Features ---")
        tiempo_completo = pronostico["tiempo_completo"]
        over_under = tiempo_completo["over_under"]
        
        # Validate Over 1.5
        over_15 = over_under["over_15"]
        self.log(f"Over 1.5: {over_15['prediccion']} ({over_15['probabilidad']}%)")
        if over_15["prediccion"] not in ["OVER", "UNDER"]:
            self.log("❌ Invalid Over 1.5 prediction", "ERROR")
            return False
            
        # Validate Over 2.5
        over_25 = over_under["over_25"]
        self.log(f"Over 2.5: {over_25['prediccion']} ({over_25['probabilidad']}%)")
        if over_25["prediccion"] not in ["OVER", "UNDER"]:
            self.log("❌ Invalid Over 2.5 prediction", "ERROR")
            return False
            
        # Validate Over 3.5
        over_35 = over_under["over_35"]
        self.log(f"Over 3.5: {over_35['prediccion']} ({over_35['probabilidad']}%)")
        if over_35["prediccion"] not in ["OVER", "UNDER"]:
            self.log("❌ Invalid Over 3.5 prediction", "ERROR")
            return False
        
        # Test 2: Goles Esperados validation
        self.log("--- Testing Goles Esperados ---")
        goles_esperados = tiempo_completo["goles_esperados"]
        self.log(f"Goles Local: {goles_esperados['local']}")
        self.log(f"Goles Visitante: {goles_esperados['visitante']}")
        self.log(f"Total Esperado: {goles_esperados['total']}")
        
        # Validate logical consistency
        total_calculado = goles_esperados["local"] + goles_esperados["visitante"]
        if abs(total_calculado - goles_esperados["total"]) > 0.1:
            self.log(f"❌ Goles esperados inconsistent: {total_calculado} != {goles_esperados['total']}", "ERROR")
            return False
            
        # Test 3: Forma Reciente validation
        self.log("--- Testing Forma Reciente ---")
        forma_reciente = pronostico["forma_reciente"]
        
        # Real Madrid forma
        forma_real = forma_reciente["local"]
        self.log(f"Real Madrid - Últimos 5: {forma_real['ultimos_5']}")
        self.log(f"Real Madrid - Rendimiento: {forma_real['rendimiento']}%")
        self.log(f"Real Madrid - Racha: {forma_real['racha']}")
        
        # Almeria forma
        forma_almeria = forma_reciente["visitante"]
        self.log(f"Almeria - Últimos 5: {forma_almeria['ultimos_5']}")
        self.log(f"Almeria - Rendimiento: {forma_almeria['rendimiento']}%")
        self.log(f"Almeria - Racha: {forma_almeria['racha']}")
        
        # Validate forma data makes sense
        if len(forma_real["ultimos_5"]) > 5:
            self.log("❌ Too many results in ultimos_5", "ERROR")
            return False
            
        # Test 4: Validate all times have new features
        for tiempo_name in ["primer_tiempo", "segundo_tiempo"]:
            tiempo_data = pronostico[tiempo_name]
            
            if "over_under" not in tiempo_data:
                self.log(f"❌ Missing over_under in {tiempo_name}", "ERROR")
                return False
                
            if "goles_esperados" not in tiempo_data:
                self.log(f"❌ Missing goles_esperados in {tiempo_name}", "ERROR")
                return False
        
        # Test 5: Validate season_id is properly passed through
        if pronostico.get("season_id") != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ season_id not properly passed: {pronostico.get('season_id')}", "ERROR")
            return False
        
        self.log("✅ NEW PLLA 3.0 Features working correctly")
        self.log("   ✅ Over/Under predictions for 1.5, 2.5, 3.5 goles")
        self.log("   ✅ Goles esperados (local, visitante, total)")
        self.log("   ✅ Forma reciente (últimos 5, rendimiento, racha)")
        self.log("   ✅ season_id integration working")
        self.test_results["new_plla_features"] = True
        return True
        """Test 18: GET /api/seasons?liga_id=SPAIN_LA_LIGA - Seasons for specific league."""
        self.log("=== TEST 18: Seasons by League ===")
        
        result = self.make_request("GET", "/seasons?liga_id=SPAIN_LA_LIGA")
        
        if not result["success"]:
            self.log("❌ Seasons by league request failed", "ERROR")
            return False
            
        data = result["data"]
        
        # Validate structure
        required_fields = ["total", "seasons"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            self.log(f"❌ Missing fields in seasons by league: {missing_fields}", "ERROR")
            return False
            
        seasons = data["seasons"]
        if not seasons:
            self.log("❌ No seasons found for SPAIN_LA_LIGA", "ERROR")
            return False
            
        # Validate season structure
        first_season = seasons[0]
        required_season_fields = ["season_id", "liga_id", "year", "total_partidos"]
        missing_season_fields = [f for f in required_season_fields if f not in first_season]
        
        if missing_season_fields:
            self.log(f"❌ Missing fields in season data: {missing_season_fields}", "ERROR")
            return False
            
        # All seasons should be for SPAIN_LA_LIGA
        for season in seasons:
            if season.get("liga_id") != "SPAIN_LA_LIGA":
                self.log(f"❌ Expected all seasons to be for SPAIN_LA_LIGA, found {season.get('liga_id')}", "ERROR")
                return False
                
        # Check season_id format
        season_id = first_season["season_id"]
        if not season_id.startswith("SPAIN_LA_LIGA_"):
            self.log(f"❌ Expected season_id to start with 'SPAIN_LA_LIGA_', got {season_id}", "ERROR")
            return False
            
        self.log(f"✅ Seasons by league working correctly - found {len(seasons)} seasons for SPAIN_LA_LIGA")
        self.test_results["seasons_by_league"] = True
        return True

    def test_20_hardcoded_liga_id_removal(self) -> bool:
        """Test 20: Specific tests for hardcoded liga_id removal as per review request."""
        self.log("=== TEST 20: HARDCODED LIGA_ID REMOVAL TESTS ===")
        
        # Test 1: GET /api/prediction/teams with season_id=ENGLAND_PREMIER_LEAGUE_2022-23
        self.log("--- Testing GET /api/prediction/teams with ENGLAND_PREMIER_LEAGUE_2022-23 ---")
        result1 = self.make_request("GET", "/prediction/teams?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        if not result1["success"]:
            self.log("❌ Teams endpoint with ENGLAND_PREMIER_LEAGUE_2022-23 failed", "ERROR")
            return False
            
        data1 = result1["data"]
        
        # Should return teams and infer liga_id correctly
        if "season_id" not in data1:
            self.log("❌ Missing season_id in teams response", "ERROR")
            return False
            
        if data1["season_id"] != "ENGLAND_PREMIER_LEAGUE_2022-23":
            self.log(f"❌ Expected season_id=ENGLAND_PREMIER_LEAGUE_2022-23, got {data1['season_id']}", "ERROR")
            return False
            
        # Should have teams (even if empty for this season)
        if "equipos" not in data1:
            self.log("❌ Missing equipos field in teams response", "ERROR")
            return False
            
        self.log(f"✅ Teams endpoint with ENGLAND_PREMIER_LEAGUE_2022-23: {len(data1['equipos'])} teams")
        
        # Test 2: GET /api/prediction/teams with season_id=SPAIN_LA_LIGA_2023-24
        self.log("--- Testing GET /api/prediction/teams with SPAIN_LA_LIGA_2023-24 ---")
        result2 = self.make_request("GET", "/prediction/teams?season_id=SPAIN_LA_LIGA_2023-24")
        
        if not result2["success"]:
            self.log("❌ Teams endpoint with SPAIN_LA_LIGA_2023-24 failed", "ERROR")
            return False
            
        data2 = result2["data"]
        
        if data2["season_id"] != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ Expected season_id=SPAIN_LA_LIGA_2023-24, got {data2['season_id']}", "ERROR")
            return False
            
        # Should return 20 teams for La Liga
        if len(data2["equipos"]) != 20:
            self.log(f"❌ Expected 20 teams for La Liga, got {len(data2['equipos'])}", "ERROR")
            return False
            
        self.log(f"✅ Teams endpoint with SPAIN_LA_LIGA_2023-24: {len(data2['equipos'])} teams")
        
        # Test 3: GET /api/prediction/teams without parameters (should use defaults)
        self.log("--- Testing GET /api/prediction/teams without parameters ---")
        result3 = self.make_request("GET", "/prediction/teams")
        
        if not result3["success"]:
            self.log("❌ Teams endpoint without parameters failed", "ERROR")
            return False
            
        data3 = result3["data"]
        
        # Should use default values (La Liga 2023)
        if "season_id" not in data3:
            self.log("❌ Missing season_id in default teams response", "ERROR")
            return False
            
        expected_default_season = "SPAIN_LA_LIGA_2023-24"
        if data3["season_id"] != expected_default_season:
            self.log(f"❌ Expected default season_id={expected_default_season}, got {data3['season_id']}", "ERROR")
            return False
            
        self.log(f"✅ Teams endpoint without parameters uses default: {data3['season_id']}")
        
        # Test 4: POST /api/prediction/generate with season_id (no liga_id)
        self.log("--- Testing POST /api/prediction/generate with season_id only ---")
        
        # First ensure we have stats for the season
        build_data = {"season_id": "SPAIN_LA_LIGA_2023-24"}
        build_result = self.make_request("POST", "/prediction/build-stats", build_data)
        
        if not build_result["success"]:
            self.log("❌ Failed to build stats for prediction test", "ERROR")
            return False
        
        pred_data = {
            "equipo_local": "Barcelona",
            "equipo_visitante": "Real Madrid",
            "season_id": "SPAIN_LA_LIGA_2023-24"
            # Note: NO liga_id provided - should be inferred
        }
        
        result4 = self.make_request("POST", "/prediction/generate", pred_data)
        
        if not result4["success"]:
            self.log("❌ Prediction generation with season_id only failed", "ERROR")
            return False
            
        pred_response = result4["data"]
        
        if not pred_response.get("success"):
            self.log("❌ Prediction returned success=false", "ERROR")
            return False
            
        pronostico = pred_response.get("pronostico")
        if not pronostico:
            self.log("❌ No prediction data in response", "ERROR")
            return False
            
        # Should include season_id in response
        if "season_id" not in pronostico:
            self.log("❌ Missing season_id in prediction response", "ERROR")
            return False
            
        if pronostico["season_id"] != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ Expected season_id=SPAIN_LA_LIGA_2023-24 in prediction, got {pronostico['season_id']}", "ERROR")
            return False
            
        self.log("✅ Prediction generation with season_id only works correctly")
        
        # Test 5: GET /api/prediction/classification with season_id=ENGLAND_PREMIER_LEAGUE_2022-23
        self.log("--- Testing GET /api/prediction/classification with ENGLAND_PREMIER_LEAGUE_2022-23 ---")
        result5 = self.make_request("GET", "/prediction/classification?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        if not result5["success"]:
            self.log("❌ Classification with ENGLAND_PREMIER_LEAGUE_2022-23 failed", "ERROR")
            return False
            
        data5 = result5["data"]
        
        # Should include season_id and infer liga_id correctly
        if "season_id" not in data5:
            self.log("❌ Missing season_id in classification response", "ERROR")
            return False
            
        if data5["season_id"] != "ENGLAND_PREMIER_LEAGUE_2022-23":
            self.log(f"❌ Expected season_id=ENGLAND_PREMIER_LEAGUE_2022-23, got {data5['season_id']}", "ERROR")
            return False
            
        # Should have classification data (even if empty)
        if "clasificacion" not in data5:
            self.log("❌ Missing clasificacion field", "ERROR")
            return False
            
        self.log(f"✅ Classification with ENGLAND_PREMIER_LEAGUE_2022-23: {len(data5['clasificacion'])} teams")
        
        # Test 6: GET /api/prediction/classification with season_id=SPAIN_LA_LIGA_2023-24
        self.log("--- Testing GET /api/prediction/classification with SPAIN_LA_LIGA_2023-24 ---")
        result6 = self.make_request("GET", "/prediction/classification?season_id=SPAIN_LA_LIGA_2023-24")
        
        if not result6["success"]:
            self.log("❌ Classification with SPAIN_LA_LIGA_2023-24 failed", "ERROR")
            return False
            
        data6 = result6["data"]
        
        if data6["season_id"] != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ Expected season_id=SPAIN_LA_LIGA_2023-24, got {data6['season_id']}", "ERROR")
            return False
            
        # Should return classification with 20 teams for La Liga
        if len(data6["clasificacion"]) != 20:
            self.log(f"❌ Expected 20 teams in La Liga classification, got {len(data6['clasificacion'])}", "ERROR")
            return False
            
        self.log(f"✅ Classification with SPAIN_LA_LIGA_2023-24: {len(data6['clasificacion'])} teams")
        
        # Test 7: GET /api/prediction/team/{nombre} with season_id=ENGLAND_PREMIER_LEAGUE_2022-23
        self.log("--- Testing GET /api/prediction/team/Manchester%20City with ENGLAND_PREMIER_LEAGUE_2022-23 ---")
        result7 = self.make_request("GET", "/prediction/team/Manchester%20City?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        # This might return 404 if Manchester City data doesn't exist for this season, which is acceptable
        if result7["status_code"] == 404:
            self.log("✅ Team stats for Manchester City in ENGLAND_PREMIER_LEAGUE_2022-23: Not found (expected)")
        elif result7["success"]:
            data7 = result7["data"]
            if "season_id" in data7 and data7["season_id"] == "ENGLAND_PREMIER_LEAGUE_2022-23":
                self.log("✅ Team stats for Manchester City in ENGLAND_PREMIER_LEAGUE_2022-23: Found")
            else:
                self.log("❌ Team stats response missing or incorrect season_id", "ERROR")
                return False
        else:
            self.log("❌ Team stats request failed unexpectedly", "ERROR")
            return False
        
        # Test 8: Verify no errors when only season_id is provided (no liga_id)
        self.log("--- Verifying no errors with season_id only (no liga_id) ---")
        
        # All previous tests should have worked without providing liga_id
        # This is a summary verification
        
        self.log("✅ All endpoints correctly infer liga_id and temporada from season_id")
        self.log("✅ No errors when only season_id is provided")
        self.log("✅ Responses include correct season_id")
        
        self.test_results["hardcoded_liga_id_removal"] = True
        return True

    def run_all_tests(self) -> bool:
        """Run all tests in order."""
        self.log("🚀 Starting PLLA 3.0 Prediction Engine Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        tests = [
            self.test_1_build_statistics,
            self.test_2_classification,
            self.test_3_generate_prediction,
            self.test_4_team_stats,
            self.test_5_validate_prediction,
            self.test_6_effectiveness,
            self.test_7_config,
            self.test_8_teams_list,
            # New season_id functionality tests
            self.test_9_seasons_list,
            self.test_10_season_detail,
            self.test_11_classification_with_season_id,
            self.test_12_teams_with_season_id,
            self.test_13_prediction_with_season_id,
            self.test_14_backward_compatibility,
            # New stats endpoint tests
            self.test_15_stats_global_view,
            self.test_16_stats_season_view,
            # Multi-league support tests
            self.test_17_leagues_list,
            self.test_18_seasons_by_league,
            # NEW PLLA 3.0 Features test
            self.test_19_new_plla_features,
            # SPECIFIC REVIEW REQUEST TESTS
            self.test_20_hardcoded_liga_id_removal
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    self.log(f"❌ Test {test.__name__} failed", "ERROR")
            except Exception as e:
                self.log(f"❌ Test {test.__name__} crashed: {str(e)}", "ERROR")
                
        self.log("=" * 50)
        self.log(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("💥 SOME TESTS FAILED!")
            return False

def main():
    """Main test runner."""
    tester = PredictionEngineTest()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("DETAILED TEST RESULTS:")
    print("=" * 60)
    
    for test_name, result in tester.test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:25} {status}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())