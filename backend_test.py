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
BACKEND_URL = "https://futbol-predict-9.preview.emergentagent.com/api"

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
            self.test_8_teams_list
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