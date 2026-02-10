"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaultPlan = seedDefaultPlan;
async function seedDefaultPlan(planRepository) {
    const existing = await planRepository.find({ take: 1 });
    if (existing.length > 0)
        return;
    const plan = planRepository.create({
        name: 'One-time access',
        selectedName: 'default',
        duration: 365,
        price: 10000,
    });
    await planRepository.save(plan);
    console.log('✅ Default plan seeded (price: 10000 UZS, duration: 365 days)');
}
//# sourceMappingURL=plan.seeder.js.map