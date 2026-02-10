import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';

export async function seedDefaultPlan(planRepository: Repository<PlanEntity>) {
  const existing = await planRepository.find({ take: 1 });
  if (existing.length > 0) return;

  const plan = planRepository.create({
    name: 'One-time access',
    selectedName: 'default',
    duration: 365,
    price: 10000, // in UZS
  });

  await planRepository.save(plan);
  // eslint-disable-next-line no-console
  console.log('✅ Default plan seeded (price: 10000 UZS, duration: 365 days)');
}
