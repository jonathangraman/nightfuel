import { chefBatch001 } from './chefBatch001';
import { chefBatch002 } from './chefBatch002';

export const chefBatches = [chefBatch001, chefBatch002].map(recipes => ({
  id: recipes[0].batchId, label: recipes[0].batchLabel, recipes,
}));
