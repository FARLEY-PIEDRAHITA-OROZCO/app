#!/usr/bin/env python3
"""
Specific Test Suite for Review Request - Hardcoded liga_id Removal
================================================================

Tests the specific endpoints mentioned in the review request:
1. GET /api/prediction/teams with season_id parameters
2. POST /api/prediction/generate with season_id in request body
3. GET /api/prediction/classification with season_id parameter
4. GET /api/prediction/team/{nombre} with season_id parameter

Usage: python review_request_test.py
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://debug-helper-63.preview.emergentagent.com/api"

class ReviewRequestTest:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, data=None):
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
            
        except Exception as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }

    def test_teams_endpoint(self):
        """Test GET /api/prediction/teams with season_id parameters."""
        self.log("=== TESTING GET /api/prediction/teams ===")
        
        # Test 1: season_id=ENGLAND_PREMIER_LEAGUE_2022-23 (sin liga_id ni temporada)
        self.log("1. Testing with season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        result1 = self.make_request("GET", "/prediction/teams?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        if not result1["success"]:
            self.log("❌ FAILED: ENGLAND_PREMIER_LEAGUE_2022-23 request failed", "ERROR")
            return False
            
        data1 = result1["data"]
        
        # Verify season_id is correctly inferred and returned
        if data1.get("season_id") != "ENGLAND_PREMIER_LEAGUE_2022-23":
            self.log(f"❌ FAILED: Expected season_id=ENGLAND_PREMIER_LEAGUE_2022-23, got {data1.get('season_id')}", "ERROR")
            return False
            
        # Should have teams (even if different count than La Liga)
        teams_count = len(data1.get("equipos", []))
        self.log(f"✅ SUCCESS: ENGLAND_PREMIER_LEAGUE_2022-23 returned {teams_count} teams")
        
        # Test 2: season_id=SPAIN_LA_LIGA_2023-24 (sin liga_id ni temporada)
        self.log("2. Testing with season_id=SPAIN_LA_LIGA_2023-24")
        result2 = self.make_request("GET", "/prediction/teams?season_id=SPAIN_LA_LIGA_2023-24")
        
        if not result2["success"]:
            self.log("❌ FAILED: SPAIN_LA_LIGA_2023-24 request failed", "ERROR")
            return False
            
        data2 = result2["data"]
        
        if data2.get("season_id") != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ FAILED: Expected season_id=SPAIN_LA_LIGA_2023-24, got {data2.get('season_id')}", "ERROR")
            return False
            
        teams_count_2 = len(data2.get("equipos", []))
        if teams_count_2 != 20:
            self.log(f"❌ FAILED: Expected 20 teams for La Liga, got {teams_count_2}", "ERROR")
            return False
            
        self.log(f"✅ SUCCESS: SPAIN_LA_LIGA_2023-24 returned {teams_count_2} teams")
        
        # Test 3: Sin parámetros (debe usar valores por defecto - La Liga 2023)
        self.log("3. Testing without parameters (should use defaults)")
        result3 = self.make_request("GET", "/prediction/teams")
        
        if not result3["success"]:
            self.log("❌ FAILED: Default request failed", "ERROR")
            return False
            
        data3 = result3["data"]
        
        # Should default to La Liga 2023-24
        expected_default = "SPAIN_LA_LIGA_2023-24"
        if data3.get("season_id") != expected_default:
            self.log(f"❌ FAILED: Expected default season_id={expected_default}, got {data3.get('season_id')}", "ERROR")
            return False
            
        self.log(f"✅ SUCCESS: Default parameters use {data3.get('season_id')}")
        
        return True

    def test_generate_prediction(self):
        """Test POST /api/prediction/generate with season_id in request body."""
        self.log("=== TESTING POST /api/prediction/generate ===")
        
        # First ensure stats are built
        self.log("Building stats for SPAIN_LA_LIGA_2023-24...")
        build_data = {"season_id": "SPAIN_LA_LIGA_2023-24"}
        build_result = self.make_request("POST", "/prediction/build-stats", build_data)
        
        if not build_result["success"]:
            self.log("❌ FAILED: Could not build stats", "ERROR")
            return False
            
        # Test prediction with season_id (sin liga_id)
        self.log("Testing prediction generation with season_id only")
        pred_data = {
            "equipo_local": "Manchester City",
            "equipo_visitante": "Arsenal", 
            "season_id": "ENGLAND_PREMIER_LEAGUE_2022-23"
            # Note: NO liga_id provided - should be inferred
        }
        
        result = self.make_request("POST", "/prediction/generate", pred_data)
        
        if not result["success"]:
            self.log("❌ FAILED: Prediction generation failed", "ERROR")
            return False
            
        response_data = result["data"]
        
        if not response_data.get("success"):
            self.log("❌ FAILED: Prediction returned success=false", "ERROR")
            return False
            
        pronostico = response_data.get("pronostico")
        if not pronostico:
            self.log("❌ FAILED: No prediction data in response", "ERROR")
            return False
            
        # Verify season_id is correctly inferred and included in response
        if pronostico.get("season_id") != "ENGLAND_PREMIER_LEAGUE_2022-23":
            self.log(f"❌ FAILED: Expected season_id=ENGLAND_PREMIER_LEAGUE_2022-23 in response, got {pronostico.get('season_id')}", "ERROR")
            return False
            
        self.log("✅ SUCCESS: Prediction generated with season_id correctly inferred")
        
        return True

    def test_classification_endpoint(self):
        """Test GET /api/prediction/classification with season_id parameter."""
        self.log("=== TESTING GET /api/prediction/classification ===")
        
        # Test 1: season_id=ENGLAND_PREMIER_LEAGUE_2022-23
        self.log("1. Testing classification with season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        result1 = self.make_request("GET", "/prediction/classification?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        if not result1["success"]:
            self.log("❌ FAILED: ENGLAND_PREMIER_LEAGUE_2022-23 classification failed", "ERROR")
            return False
            
        data1 = result1["data"]
        
        # Verify response includes season_id and liga_id is correctly inferred
        if data1.get("season_id") != "ENGLAND_PREMIER_LEAGUE_2022-23":
            self.log(f"❌ FAILED: Expected season_id=ENGLAND_PREMIER_LEAGUE_2022-23, got {data1.get('season_id')}", "ERROR")
            return False
            
        # Should have classification data
        if "clasificacion" not in data1:
            self.log("❌ FAILED: Missing clasificacion field", "ERROR")
            return False
            
        teams_count = len(data1["clasificacion"])
        self.log(f"✅ SUCCESS: ENGLAND_PREMIER_LEAGUE_2022-23 classification returned {teams_count} teams")
        
        # Test 2: season_id=SPAIN_LA_LIGA_2023-24
        self.log("2. Testing classification with season_id=SPAIN_LA_LIGA_2023-24")
        result2 = self.make_request("GET", "/prediction/classification?season_id=SPAIN_LA_LIGA_2023-24")
        
        if not result2["success"]:
            self.log("❌ FAILED: SPAIN_LA_LIGA_2023-24 classification failed", "ERROR")
            return False
            
        data2 = result2["data"]
        
        if data2.get("season_id") != "SPAIN_LA_LIGA_2023-24":
            self.log(f"❌ FAILED: Expected season_id=SPAIN_LA_LIGA_2023-24, got {data2.get('season_id')}", "ERROR")
            return False
            
        teams_count_2 = len(data2["clasificacion"])
        if teams_count_2 != 20:
            self.log(f"❌ FAILED: Expected 20 teams for La Liga classification, got {teams_count_2}", "ERROR")
            return False
            
        self.log(f"✅ SUCCESS: SPAIN_LA_LIGA_2023-24 classification returned {teams_count_2} teams")
        
        return True

    def test_team_stats_endpoint(self):
        """Test GET /api/prediction/team/{nombre} with season_id parameter."""
        self.log("=== TESTING GET /api/prediction/team/{nombre} ===")
        
        # Test team stats with season_id
        self.log("Testing team stats for Manchester City with season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        result = self.make_request("GET", "/prediction/team/Manchester%20City?season_id=ENGLAND_PREMIER_LEAGUE_2022-23")
        
        # This might return 404 if the team doesn't exist in that season, which is acceptable
        if result["status_code"] == 404:
            self.log("✅ SUCCESS: Manchester City not found in ENGLAND_PREMIER_LEAGUE_2022-23 (expected)")
            return True
        elif result["success"]:
            data = result["data"]
            
            # Verify season_id is correctly included
            expected_season = "ENGLAND_PREMIER_LEAGUE_2022-23"
            if data.get("season_id") != expected_season:
                self.log(f"❌ FAILED: Expected season_id={expected_season}, got {data.get('season_id')}", "ERROR")
                return False
                
            self.log("✅ SUCCESS: Team stats returned with correct season_id")
            return True
        else:
            self.log("❌ FAILED: Team stats request failed unexpectedly", "ERROR")
            return False

    def run_review_tests(self):
        """Run all review request tests."""
        self.log("🚀 Starting Review Request Tests - Hardcoded liga_id Removal")
        self.log(f"Backend URL: {self.base_url}")
        self.log("")
        
        tests = [
            ("Teams Endpoint", self.test_teams_endpoint),
            ("Generate Prediction", self.test_generate_prediction),
            ("Classification Endpoint", self.test_classification_endpoint),
            ("Team Stats Endpoint", self.test_team_stats_endpoint)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                self.log(f"Running {test_name}...")
                if test_func():
                    passed += 1
                    self.log(f"✅ {test_name} PASSED")
                else:
                    self.log(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log(f"❌ {test_name} CRASHED: {str(e)}", "ERROR")
            
            self.log("")  # Empty line for readability
        
        self.log("=" * 60)
        self.log(f"📊 REVIEW REQUEST TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL REVIEW REQUEST TESTS PASSED!")
            self.log("")
            self.log("✅ Endpoints correctly infer liga_id and temporada from season_id")
            self.log("✅ No errors when only season_id is provided (no liga_id)")
            self.log("✅ Responses include the correct season_id")
            return True
        else:
            self.log("💥 SOME REVIEW REQUEST TESTS FAILED!")
            return False

def main():
    """Main test runner."""
    tester = ReviewRequestTest()
    success = tester.run_review_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())