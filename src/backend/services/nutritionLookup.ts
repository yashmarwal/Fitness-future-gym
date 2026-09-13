import "server-only";

// USDA FoodData Central — free, US government nutrition database, no signup
// required to start (the shared DEMO_KEY works out of the box, just with a
// low shared rate limit). For real production use, get a free personal key
// at https://fdc.nal.usda.gov/api-key-signup and set USDA_FDC_API_KEY (free
// forever, 1,000 requests/hour). Researched against wger.de and ExerciseDB
// too for the workout side of this feature — see exerciseLibrary.ts for why
// that one's a bundled list instead of a live API call.
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// Foundation/SR Legacy/Survey are USDA's generic reference-food datasets
// (values per 100g, one clean entry per food) — filtering to these instead
// of the full index avoids "Branded" results (packaged products with
// inconsistent per-serving-size values) dominating a plain search like
// "banana" with protein bars and snack products.
const PREFERRED_DATA_TYPES = "Foundation,SR Legacy,Survey (FNDDS)";

type UsdaFoodNutrient = {
  nutrientName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  dataType: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

export type NutritionSearchResult = {
  fdcId: number;
  description: string;
  servingInfo: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

function extractNutrient(nutrients: UsdaFoodNutrient[] | undefined, name: string): number | null {
  const match = nutrients?.find((n) => n.nutrientName === name);
  if (match?.value == null) return null;
  return Math.round(match.value * 10) / 10;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// USDA's edge (nginx, in front of the actual API) intermittently 400s
// perfectly valid, correctly-encoded requests under bursty traffic —
// confirmed by hand: the exact same URL failed once and then succeeded
// three times in a row immediately after, with nothing about the request
// itself changing. One quick retry absorbs that instead of surfacing a
// false "lookup failed" to the member typing a food name.
async function fetchWithRetry(url: string, attempts = 2): Promise<Response> {
  let lastRes: Response | undefined;
  for (let i = 0; i < attempts; i++) {
    lastRes = await fetch(url);
    if (lastRes.ok) return lastRes;
    if (i < attempts - 1) await sleep(250);
  }
  return lastRes!;
}

export async function searchFoods(query: string): Promise<NutritionSearchResult[]> {
  const apiKey = process.env.USDA_FDC_API_KEY || "DEMO_KEY";
  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "8");
  url.searchParams.set("dataType", PREFERRED_DATA_TYPES);
  url.searchParams.set("api_key", apiKey);

  const res = await fetchWithRetry(url.toString());
  if (!res.ok) {
    throw new Error(`USDA FoodData Central error (${res.status})`);
  }

  const data: UsdaSearchResponse = await res.json();

  return (data.foods ?? []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    servingInfo: food.servingSize ? `per ${food.servingSize}${food.servingSizeUnit ?? "g"}` : "per 100g",
    calories: extractNutrient(food.foodNutrients, "Energy"),
    proteinG: extractNutrient(food.foodNutrients, "Protein"),
    carbsG: extractNutrient(food.foodNutrients, "Carbohydrate, by difference"),
    fatG: extractNutrient(food.foodNutrients, "Total lipid (fat)"),
  }));
}
