interface CommissionSlab {
  id: string
  minAmount: number
  maxAmount: number | null
  rate: number
}

export interface CommissionCalculationResult {
  totalCommission: number
  appliedRate: number
  slabId: string | null
  breakdown: {
    slabId: string
    range: string
    amount: number
    rate: number
    commission: number
  }[]
}

export function calculateCommission(
  dealValue: number,
  slabs: CommissionSlab[]
): CommissionCalculationResult {
  if (!slabs || slabs.length === 0 || !dealValue || dealValue <= 0) {
    return {
      totalCommission: 0,
      appliedRate: 0,
      slabId: null,
      breakdown: []
    }
  }

  // Sort slabs by minAmount
  const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount)
  
  let totalCommission = 0
  let appliedSlabId: string | null = null
  let appliedRate = 0
  const breakdown: CommissionCalculationResult['breakdown'] = []

  for (const slab of sortedSlabs) {
    const slabMin = slab.minAmount
    const slabMax = slab.maxAmount

    // Check if deal value falls in this slab
    if (dealValue >= slabMin && (slabMax === null || dealValue <= slabMax)) {
      // Simple approach: use the rate of the matching slab for the entire amount
      totalCommission = (dealValue * slab.rate) / 100
      appliedRate = slab.rate
      appliedSlabId = slab.id

      breakdown.push({
        slabId: slab.id,
        range: slabMax ? `$${slabMin} - $${slabMax}` : `$${slabMin}+`,
        amount: dealValue,
        rate: slab.rate,
        commission: totalCommission
      })

      break
    }
  }

  return {
    totalCommission,
    appliedRate,
    slabId: appliedSlabId,
    breakdown
  }
}

export function calculateTieredCommission(
  dealValue: number,
  slabs: CommissionSlab[]
): CommissionCalculationResult {
  if (!slabs || slabs.length === 0) {
    return {
      totalCommission: 0,
      appliedRate: 0,
      slabId: null,
      breakdown: []
    }
  }

  // Sort slabs by minAmount
  const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount)
  
  let totalCommission = 0
  let remainingAmount = dealValue
  let lastSlabId: string | null = null
  const breakdown: CommissionCalculationResult['breakdown'] = []

  for (let i = 0; i < sortedSlabs.length; i++) {
    const slab = sortedSlabs[i]
    const slabMin = slab.minAmount
    const slabMax = slab.maxAmount
    const nextSlabMin = i < sortedSlabs.length - 1 ? sortedSlabs[i + 1].minAmount : null

    if (remainingAmount <= 0) break

    // Calculate the amount that falls in this slab
    let amountInThisSlab = 0

    if (dealValue >= slabMin) {
      if (slabMax === null) {
        // Unlimited upper range
        amountInThisSlab = remainingAmount
      } else {
        // Limited range
        const effectiveMax = nextSlabMin ? Math.min(slabMax, nextSlabMin - 0.01) : slabMax
        amountInThisSlab = Math.min(remainingAmount, effectiveMax - slabMin + 0.01)
      }

      if (amountInThisSlab > 0) {
        const commissionForThisSlab = (amountInThisSlab * slab.rate) / 100
        totalCommission += commissionForThisSlab
        remainingAmount -= amountInThisSlab
        lastSlabId = slab.id

        breakdown.push({
          slabId: slab.id,
          range: slabMax ? `$${slabMin} - $${slabMax}` : `$${slabMin}+`,
          amount: amountInThisSlab,
          rate: slab.rate,
          commission: commissionForThisSlab
        })
      }
    }
  }

  // Calculate weighted average rate
  const appliedRate = dealValue > 0 ? (totalCommission / dealValue) * 100 : 0

  return {
    totalCommission,
    appliedRate,
    slabId: lastSlabId,
    breakdown
  }
}
