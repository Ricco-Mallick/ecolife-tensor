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
    const transportMonthlyKg = (transportKmPerWeek * 4) * 0.192;
    const energyMonthlyKg = electricityKwhPerMonth * 0.708;
    const foodMonthlyKg = (meatMealsPerWeek * 4) * 1.5;

    const totalMonthlyKg = transportMonthlyKg + energyMonthlyKg + foodMonthlyKg;

    return {
      transportMonthlyKg: parseFloat(transportMonthlyKg.toFixed(1)),
      energyMonthlyKg: parseFloat(energyMonthlyKg.toFixed(1)),
      foodMonthlyKg: parseFloat(foodMonthlyKg.toFixed(1)),
      totalMonthlyKg: parseFloat(totalMonthlyKg.toFixed(1)),
      totalAnnualTons: parseFloat((totalMonthlyKg * 12 / 1000).toFixed(2)),
      breakdownPct: {
        transport: Math.round((transportMonthlyKg / totalMonthlyKg) * 100) || 0,
        energy: Math.round((energyMonthlyKg / totalMonthlyKg) * 100) || 0,
        food: Math.round((foodMonthlyKg / totalMonthlyKg) * 100) || 0
      }
    };
  }
};

if (typeof window !== 'undefined') {
  window.CarbonEngine = CarbonEngine;
}
