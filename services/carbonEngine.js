/**
 * EcoLife Tensor — Deterministic Carbon Impact Engine
 * Methodology Version: 1.0.0
 * Standard: IPCC / DEFRA Verified Emission Factors
 */

const CarbonEngine = {
  // Emission Factors (kg CO2e per unit)
  EMISSION_FACTORS: {
    // Mobility (per km)
    WALKING_VS_CAR: 0.192,         // Average passenger car offset per km
    TRANSIT_VS_CAR: 0.105,         // Public transport vs single occupancy vehicle
    CYCLING_VS_CAR: 0.192,         // Cycling offset per km

    // Materials / Waste (per item recycled or reused)
    PLASTIC_BOTTLE_REUSE: 0.08,    // 500ml PET bottle lifecycle offset
    PAPER_CARDBOARD_RECYCLING: 0.12,// 1 kg recycled paper vs virgin paper
    ALUMINUM_CAN_RECYCLING: 0.15,  // 330ml Aluminum can vs bauxite extraction
    GLASS_JAR_REUSE: 0.10,         // Glass bottle reuse vs raw glass manufacturing
    E_WASTE_RECYCLING: 0.50,       // Electronic item proper disposal

    // Energy / Household (per kWh or action)
    ENERGY_SAVED_KWH: 0.708,       // Grid electricity carbon intensity (India avg baseline)
    PLANT_BASED_MEAL: 0.50,        // Plant-based vs ruminant meat meal offset
    PLANTED_TREE_ANNUAL: 21.77     // Mature tree annual CO2 absorption (kg/year)
  },

  /**
   * Calculate walking / activity carbon offset
   * @param {number} distanceKm
   * @returns {Object} { co2SavedKg, points, methodology }
   */
  calculateWalkingImpact(distanceKm) {
    const km = Math.max(0, parseFloat(distanceKm) || 0);
    const co2SavedKg = parseFloat((km * this.EMISSION_FACTORS.WALKING_VS_CAR).toFixed(4));
    const points = Math.floor(km * 25); // 25 points per km walked

    return {
      co2SavedKg,
      points,
      methodology: {
        factor: this.EMISSION_FACTORS.WALKING_VS_CAR,
        unit: 'kg CO2e / km',
        baseline: 'Single-occupancy petrol vehicle (192 g/km)',
        version: '1.0.0'
      }
    };
  },

  /**
   * Calculate recycled item carbon impact
   * @param {string} category - 'Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste'
   * @param {number} itemCount
   * @returns {Object} { co2SavedKg, points, methodology }
   */
  calculateWasteImpact(category, itemCount = 1) {
    const count = Math.max(1, parseInt(itemCount) || 1);
    let factor = this.EMISSION_FACTORS.PLASTIC_BOTTLE_REUSE;

    switch ((category || '').toLowerCase()) {
      case 'paper':
        factor = this.EMISSION_FACTORS.PAPER_CARDBOARD_RECYCLING;
        break;
      case 'metal':
        factor = this.EMISSION_FACTORS.ALUMINUM_CAN_RECYCLING;
        break;
      case 'glass':
        factor = this.EMISSION_FACTORS.GLASS_JAR_REUSE;
        break;
      case 'e-waste':
        factor = this.EMISSION_FACTORS.E_WASTE_RECYCLING;
        break;
      default:
        factor = this.EMISSION_FACTORS.PLASTIC_BOTTLE_REUSE;
    }

    const co2SavedKg = parseFloat((count * factor).toFixed(4));
    const points = count * 30; // 30 points per waste item scanned

    return {
      co2SavedKg,
      points,
      methodology: {
        category,
        factor,
        unit: 'kg CO2e / item',
        baseline: 'Virgin material manufacturing offset',
        version: '1.0.0'
      }
    };
  },

  /**
   * Comprehensive Household Footprint Estimation
   * @param {number} transportKmPerWeek
   * @param {number} electricityKwhPerMonth
   * @param {number} meatMealsPerWeek
   * @returns {Object} Breakdown of footprint in kg CO2 per month
   */
  calculateFootprint({ transportKmPerWeek = 50, electricityKwhPerMonth = 150, meatMealsPerWeek = 7 }) {
    const transportCo2Month = (transportKmPerWeek * 4.33) * this.EMISSION_FACTORS.WALKING_VS_CAR;
    const electricityCo2Month = electricityKwhPerMonth * this.EMISSION_FACTORS.ENERGY_SAVED_KWH;
    const meatCo2Month = (meatMealsPerWeek * 4.33) * this.EMISSION_FACTORS.PLANT_BASED_MEAL;

    const totalCo2MonthKg = parseFloat((transportCo2Month + electricityCo2Month + meatCo2Month).toFixed(2));
    const totalCo2YearTons = parseFloat((totalCo2MonthKg * 12 / 1000).toFixed(2));

    return {
      totalCo2MonthKg,
      totalCo2YearTons,
      breakdown: {
        transportCo2Month: parseFloat(transportCo2Month.toFixed(2)),
        electricityCo2Month: parseFloat(electricityCo2Month.toFixed(2)),
        meatCo2Month: parseFloat(meatCo2Month.toFixed(2))
      }
    };
  },

  /**
   * Calculate Multi-Factor Daily Eco Score (0 to 100)
   * @param {Object} params - { todayPoints, streakDays, todayCo2Saved }
   * @returns {Object} { score, tier, tierBadge, breakdown }
   */
  calculateDailyEcoScore({ todayPoints = 0, streakDays = 0, todayCo2Saved = 0 }) {
    const pts = Math.max(0, parseInt(todayPoints) || 0);
    const streak = Math.max(0, parseInt(streakDays) || 0);
    const co2 = Math.max(0, parseFloat(todayCo2Saved) || 0);

    const pointsComponent = Math.min(Math.round(pts / 4), 60); // Max 60 pts from actions
    const streakComponent = Math.min(streak * 2, 20); // Max 20 pts from active streak
    const co2Component = Math.min(Math.round(co2 * 10), 20); // Max 20 pts from CO2 saved

    const rawScore = pointsComponent + streakComponent + co2Component;
    const score = Math.max(0, Math.min(100, rawScore));

    let tier = 'Eco Novice';
    let tierBadge = '🌱';

    if (score >= 76) {
      tier = 'Eco Legend';
      tierBadge = '🏆';
    } else if (score >= 51) {
      tier = 'Eco Guardian';
      tierBadge = '🛡️';
    } else if (score >= 26) {
      tier = 'Eco Advocate';
      tierBadge = '🌿';
    }

    return {
      score,
      tier,
      tierBadge,
      breakdown: {
        pointsComponent,
        streakComponent,
        co2Component
      }
    };
  }
};

if (typeof window !== 'undefined') {
  window.CarbonEngine = CarbonEngine;
}
