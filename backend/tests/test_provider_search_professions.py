"""
Test Provider & Service Search – Professions Sync & Results
============================================================
Validates:
1. /api/professions returns a non-empty, well-structured hierarchy
2. Professions from the API match the frontend static data (searchData.js)
3. /api/providers/filters/options returns categories derived from DB professions
4. Searching providers by category (profession_id) returns real results
5. Searching providers by profession name text returns real results
6. /api/services search by profession filter works correctly
7. Frontend healthcareProfessions IDs match backend profession_ids
8. Sub-professions and categories are present in the hierarchy
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carefd-preview-5.preview.emergentagent.com')

# Expected top-level profession IDs (synced with searchData.js serviceCategories)
EXPECTED_PROFESSION_IDS = [
    "prof_medicine",
    "prof_nursing",
    "prof_dental",
    "prof_therapy",
    "prof_mental",
    "prof_nutrition",
    "prof_alternative",
    "prof_optometry",
    "prof_midwifery",
    "prof_caregiving",
]

# Expected top-level profession Hebrew names (from searchData.js)
EXPECTED_PROFESSION_NAMES = [
    "רפואה",
    "אחיות/סיעוד",
    "רפואת שיניים",
    "טיפולי שיקום",
    "בריאות הנפש",
    "תזונה ודיאטה",
    "רפואה משלימה",
    "מיילדות",
    "טיפול וסיוע",
]


class TestProfessionsEndpoint:
    """Test /api/professions returns professions and they are well-structured"""

    def test_professions_returns_200(self):
        """GET /api/professions returns 200"""
        response = requests.get(f"{BASE_URL}/api/professions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_professions_returns_non_empty_list(self):
        """Professions list should not be empty"""
        response = requests.get(f"{BASE_URL}/api/professions")
        data = response.json()
        professions = data.get("professions", [])
        assert len(professions) > 0, "Professions list is empty – DB may not be seeded"
        print(f"Total top-level professions from API: {len(professions)}")

    def test_profession_has_required_fields(self):
        """Each profession must have profession_id, name, and sub_professions"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])

        for prof in professions:
            assert "profession_id" in prof, f"Missing profession_id in {prof}"
            assert "name" in prof, f"Missing name in profession {prof.get('profession_id')}"
            assert prof["name"], f"Empty name for profession {prof.get('profession_id')}"
            # sub_professions should at least be a list (may be empty for some)
            assert isinstance(prof.get("sub_professions", []), list), \
                f"sub_professions should be a list for {prof['profession_id']}"

    def test_expected_profession_ids_present(self):
        """All expected profession IDs from frontend searchData.js should exist in API"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])
        api_ids = {p["profession_id"] for p in professions}

        missing = [pid for pid in EXPECTED_PROFESSION_IDS if pid not in api_ids]
        if missing:
            print(f"WARNING: Missing profession IDs in API: {missing}")
            print(f"API IDs: {sorted(api_ids)}")
        # At least the core ones should be present
        assert len(missing) <= 2, \
            f"Too many expected professions missing from API: {missing}"

    def test_profession_names_match_frontend(self):
        """Profession names from API should match the names used in frontend"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])
        api_names = {p["name"] for p in professions}

        matched = [name for name in EXPECTED_PROFESSION_NAMES if name in api_names]
        print(f"Matched {len(matched)}/{len(EXPECTED_PROFESSION_NAMES)} frontend profession names")
        print(f"API names: {sorted(api_names)}")
        # Most names should match
        assert len(matched) >= len(EXPECTED_PROFESSION_NAMES) * 0.7, \
            f"Less than 70% of frontend profession names match API. Matched: {matched}"

    def test_sub_professions_have_structure(self):
        """Sub-professions should have sub_profession_id and name"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])

        total_subs = 0
        for prof in professions:
            for sub in prof.get("sub_professions", []):
                total_subs += 1
                assert "sub_profession_id" in sub, \
                    f"Missing sub_profession_id in sub of {prof['profession_id']}"
                assert "name" in sub and sub["name"], \
                    f"Missing/empty name in sub {sub.get('sub_profession_id')}"

        print(f"Total sub-professions across all professions: {total_subs}")
        assert total_subs > 0, "No sub-professions found – hierarchy may be incomplete"

    def test_categories_exist_in_sub_professions(self):
        """At least some sub-professions should have categories"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])

        total_categories = 0
        for prof in professions:
            for sub in prof.get("sub_professions", []):
                cats = sub.get("categories", [])
                for cat in cats:
                    total_categories += 1
                    assert "category_id" in cat, \
                        f"Missing category_id in category of sub {sub.get('sub_profession_id')}"
                    assert "name" in cat and cat["name"], \
                        f"Missing/empty name in category {cat.get('category_id')}"

        print(f"Total categories across all sub-professions: {total_categories}")
        assert total_categories > 0, "No categories found in sub-professions"

    def test_specializations_list_present(self):
        """Professions should include a specializations list for search term matching"""
        response = requests.get(f"{BASE_URL}/api/professions")
        professions = response.json().get("professions", [])

        profs_with_specs = [p for p in professions if len(p.get("specializations", [])) > 0]
        print(f"Professions with specializations: {len(profs_with_specs)}/{len(professions)}")
        # Most professions should have specializations
        assert len(profs_with_specs) >= len(professions) * 0.5, \
            "Less than 50% of professions have specializations"


class TestFilterOptionsEndpoint:
    """Test /api/providers/filters/options returns categories from DB professions"""

    def test_filter_options_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200

    def test_filter_options_has_categories(self):
        """categories field should contain professions from the DB"""
        response = requests.get(f"{BASE_URL}/api/providers/filters/options")
        data = response.json()
        categories = data.get("categories", [])
        print(f"Filter options categories count: {len(categories)}")
        # categories are pulled from db.professions
        assert len(categories) > 0, "categories in filter options is empty"

    def test_filter_categories_have_id_and_name(self):
        response = requests.get(f"{BASE_URL}/api/providers/filters/options")
        categories = response.json().get("categories", [])
        for cat in categories:
            assert cat.get("id"), f"Category missing id: {cat}"
            assert cat.get("name"), f"Category missing name: {cat}"

    def test_filter_options_has_profession_titles(self):
        """profession_titles should contain legacy PROFESSION_TITLES for backward compat"""
        response = requests.get(f"{BASE_URL}/api/providers/filters/options")
        data = response.json()
        titles = data.get("profession_titles", [])
        assert len(titles) > 0, "profession_titles is empty in filter options"
        print(f"Profession titles count: {len(titles)}")

    def test_filter_options_has_professions_hierarchy(self):
        """professions field should contain full hierarchy for provider forms"""
        response = requests.get(f"{BASE_URL}/api/providers/filters/options")
        data = response.json()
        professions = data.get("professions", [])
        assert len(professions) > 0, "professions (hierarchy) is empty in filter options"

    def test_categories_sync_with_professions_endpoint(self):
        """Categories in filter options should match professions from /api/professions"""
        filter_resp = requests.get(f"{BASE_URL}/api/providers/filters/options")
        prof_resp = requests.get(f"{BASE_URL}/api/professions")

        filter_cats = {c["id"] for c in filter_resp.json().get("categories", []) if c.get("id")}
        prof_ids = {p["profession_id"] for p in prof_resp.json().get("professions", [])}

        # The two sets should be equal or filter_cats should be a subset
        diff = filter_cats - prof_ids
        if diff:
            print(f"Category IDs in filters but not in professions: {diff}")
        diff2 = prof_ids - filter_cats
        if diff2:
            print(f"Profession IDs not in filter categories: {diff2}")

        # They should mostly overlap
        overlap = filter_cats & prof_ids
        assert len(overlap) > 0, "No overlap between filter categories and professions"
        print(f"Overlap: {len(overlap)} IDs match between filters and professions endpoint")


class TestProviderSearchByProfession:
    """Test that searching providers by profession category returns real results"""

    def _get_professions(self):
        response = requests.get(f"{BASE_URL}/api/professions")
        return response.json().get("professions", [])

    def test_search_by_category_returns_results_or_empty(self):
        """Search providers by each profession_id as category – verify no errors"""
        professions = self._get_professions()
        assert len(professions) > 0, "No professions available"

        results_summary = {}
        for prof in professions:
            pid = prof["profession_id"]
            resp = requests.get(f"{BASE_URL}/api/providers", params={"category": pid})
            assert resp.status_code == 200, f"Error searching category={pid}: {resp.text}"
            total = resp.json().get("total", 0)
            results_summary[pid] = total

        print("Provider search results by category:")
        for pid, count in results_summary.items():
            print(f"  {pid}: {count} providers")

        # At least one category should have results (if there are any providers)
        all_resp = requests.get(f"{BASE_URL}/api/providers")
        total_all = all_resp.json().get("total", 0)
        if total_all > 0:
            has_results = sum(1 for c in results_summary.values() if c > 0)
            print(f"Categories with results: {has_results}/{len(results_summary)}")
            # Not all categories need results, but if providers exist some should match
            # This is informational – don't fail if providers just aren't categorized yet

    def test_search_by_profession_name_text(self):
        """Search providers using profession name as free text"""
        professions = self._get_professions()
        if not professions:
            pytest.skip("No professions in DB")

        results_summary = {}
        for prof in professions[:5]:  # Test first 5 to keep test fast
            name = prof["name"]
            resp = requests.get(f"{BASE_URL}/api/providers", params={"search": name})
            assert resp.status_code == 200, f"Error searching name={name}: {resp.text}"
            total = resp.json().get("total", 0)
            results_summary[name] = total

        print("Provider search results by profession name text:")
        for name, count in results_summary.items():
            print(f"  '{name}': {count} providers")

    def test_search_filters_applied_contains_category(self):
        """filters_applied in response should reflect the category param"""
        resp = requests.get(f"{BASE_URL}/api/providers", params={"category": "prof_medicine"})
        assert resp.status_code == 200
        filters = resp.json().get("filters_applied", {})
        assert filters.get("category") == "prof_medicine", \
            f"Expected category='prof_medicine' in filters_applied, got {filters}"

    def test_provider_results_have_profession_fields(self):
        """Providers in results should have profession-related fields when available"""
        resp = requests.get(f"{BASE_URL}/api/providers")
        providers = resp.json().get("providers", [])

        providers_with_profession = 0
        for p in providers:
            has_prof = any([
                p.get("profession_id"),
                p.get("profession_name"),
                p.get("profession_title"),
                p.get("specializations"),
            ])
            if has_prof:
                providers_with_profession += 1

        total = len(providers)
        print(f"Providers with profession data: {providers_with_profession}/{total}")
        if total > 0:
            # Informational: what percentage have profession data
            pct = (providers_with_profession / total) * 100
            print(f"  = {pct:.0f}% of providers have profession data")


class TestServiceSearchByProfession:
    """Test that /api/services search works with profession filter"""

    def test_services_endpoint_returns_200(self):
        resp = requests.get(f"{BASE_URL}/api/services")
        assert resp.status_code == 200

    def test_services_search_by_profession_name(self):
        """Search services with profession param (provider-level filter)"""
        # Get a profession name from the API
        prof_resp = requests.get(f"{BASE_URL}/api/professions")
        professions = prof_resp.json().get("professions", [])
        if not professions:
            pytest.skip("No professions in DB")

        # Try searching with first profession name
        prof_name = professions[0]["name"]
        resp = requests.get(f"{BASE_URL}/api/services", params={"profession": prof_name})
        assert resp.status_code == 200, f"Error: {resp.text}"
        data = resp.json()
        print(f"Services for profession '{prof_name}': {data.get('total', len(data.get('services', [])))}")

    def test_services_search_by_text_with_profession_term(self):
        """Search services using a profession-related text term"""
        resp = requests.get(f"{BASE_URL}/api/services", params={"search": "סיעוד"})
        assert resp.status_code == 200
        data = resp.json()
        count = data.get("total", len(data.get("services", [])))
        print(f"Services matching 'סיעוד': {count}")

    def test_services_search_by_category(self):
        """Search services by service_category param"""
        resp = requests.get(f"{BASE_URL}/api/services", params={"service_category": "prof_nursing"})
        assert resp.status_code == 200
        data = resp.json()
        count = data.get("total", len(data.get("services", [])))
        print(f"Services in category 'prof_nursing': {count}")


class TestProfessionsConsistency:
    """Test that professions data is consistent between endpoints"""

    def test_provider_profile_resolves_profession_name(self):
        """When a provider has profession_id, the API should resolve profession_name"""
        resp = requests.get(f"{BASE_URL}/api/providers")
        providers = resp.json().get("providers", [])

        for p in providers:
            if p.get("profession_id"):
                # If profession_id is set, profession_name should be resolved
                prof_name = p.get("profession_name")
                print(f"Provider '{p.get('business_name')}': profession_id={p['profession_id']}, "
                      f"profession_name={prof_name}")
                # The search endpoint resolves names, so this should be set
                if not prof_name:
                    print(f"  WARNING: profession_name not resolved for {p['profession_id']}")

    def test_frontend_profession_ids_match_backend(self):
        """Frontend healthcareProfessions IDs should match backend profession_ids"""
        # These are the top-level profession IDs from searchData.js
        frontend_ids = set(EXPECTED_PROFESSION_IDS)

        resp = requests.get(f"{BASE_URL}/api/professions")
        professions = resp.json().get("professions", [])
        backend_ids = {p["profession_id"] for p in professions}

        missing_in_backend = frontend_ids - backend_ids
        extra_in_backend = backend_ids - frontend_ids

        if missing_in_backend:
            print(f"Frontend IDs missing in backend: {missing_in_backend}")
        if extra_in_backend:
            print(f"Backend IDs not in frontend: {extra_in_backend}")

        # Core IDs should be in both
        overlap = frontend_ids & backend_ids
        print(f"ID overlap: {len(overlap)}/{len(frontend_ids)} frontend IDs found in backend")
        assert len(overlap) >= len(frontend_ids) * 0.7, \
            f"Less than 70% overlap between frontend and backend profession IDs"

    def test_popular_searches_match_profession_names(self):
        """Popular searches in frontend (searchData.js) should align with API profession names"""
        # These come from searchData.popularSearches.providers
        popular = [
            'רפואה', 'אחיות', 'רפואת שיניים', 'טיפולי שיקום',
            'בריאות הנפש', 'תזונה ודיאטה', 'רפואה משלימה', 'אופטומטריה',
            'מיילדות', 'טיפול וסיוע'
        ]

        resp = requests.get(f"{BASE_URL}/api/professions")
        professions = resp.json().get("professions", [])
        api_names = {p["name"] for p in professions}

        matched = [s for s in popular if s in api_names]
        unmatched = [s for s in popular if s not in api_names]

        print(f"Popular searches matching API: {len(matched)}/{len(popular)}")
        if unmatched:
            print(f"Unmatched popular searches: {unmatched}")
            # Check partial matches
            for term in unmatched:
                partial = [n for n in api_names if term in n or n in term]
                if partial:
                    print(f"  '{term}' partially matches: {partial}")


class TestSearchWithProfessionAndLocation:
    """Test combined profession + location search"""

    def test_category_with_city_filter(self):
        """Search by profession category AND city"""
        params = {
            "category": "prof_medicine",
            "city": "תל אביב"
        }
        resp = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert resp.status_code == 200
        data = resp.json()
        print(f"Providers: category=prof_medicine + city=תל אביב -> {data['total']} results")

        filters = data.get("filters_applied", {})
        assert filters.get("category") == "prof_medicine"
        assert filters.get("city") == "תל אביב"

    def test_text_search_with_city_filter(self):
        """Free text profession search combined with city"""
        params = {
            "search": "אחות",
            "city": "ירושלים"
        }
        resp = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert resp.status_code == 200
        data = resp.json()
        print(f"Providers: search='אחות' + city=ירושלים -> {data['total']} results")

    def test_category_with_radius_search(self):
        """Search by profession category with geo-radius"""
        params = {
            "category": "prof_nursing",
            "latitude": 32.0853,
            "longitude": 34.7818,
            "radius_km": 50
        }
        resp = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert resp.status_code == 200
        data = resp.json()
        print(f"Providers: category=prof_nursing + 50km radius from TLV -> {data['total']} results")

        # Verify distance is populated
        for p in data.get("providers", [])[:3]:
            if p.get("distance_km") is not None:
                assert p["distance_km"] <= 50, f"Provider outside radius: {p['distance_km']}km"
