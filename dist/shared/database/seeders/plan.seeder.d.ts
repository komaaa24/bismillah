import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';
export declare function seedDefaultPlan(planRepository: Repository<PlanEntity>): Promise<void>;
