import { chefBatch001 } from './chefBatch001';
import { chefBatch002 } from './chefBatch002';
import { chefBatch003 } from './chefBatch003.js';
import { chefBatch004 } from './chefBatch004.js';
import { chefBatch005 } from './chefBatch005.js';
import { chefBatch006 } from './chefBatch006.js';
import { chefBatch007 } from './chefBatch007.js';
import { chefBatch008 } from './chefBatch008.js';
import { chefBatch009 } from './chefBatch009.js';
import { chefBatch010 } from './chefBatch010.js';
import { chefBatch011 } from './chefBatch011.js';
import { chefBatch012 } from './chefBatch012.js';
import { chefBatch013 } from './chefBatch013.js';
import { chefBatch014 } from './chefBatch014.js';
import { chefBatch015 } from './chefBatch015.js';
import { chefBatch016 } from './chefBatch016.js';
import { chefBatch017 } from './chefBatch017.js';
import { chefBatch018 } from './chefBatch018.js';
import { chefBatch019 } from './chefBatch019.js';
import { chefBatch020 } from './chefBatch020.js';
import { chefBatch021 } from './chefBatch021.js';
import { chefBatch022 } from './chefBatch022.js';
import { chefBatch023 } from './chefBatch023.js';

export const chefBatches = [chefBatch001, chefBatch002, chefBatch003, chefBatch004, chefBatch005, chefBatch006, chefBatch007, chefBatch008, chefBatch009, chefBatch010, chefBatch011, chefBatch012, chefBatch013, chefBatch014, chefBatch015, chefBatch016, chefBatch017, chefBatch018, chefBatch019, chefBatch020, chefBatch021, chefBatch022, chefBatch023].map(recipes => ({
  id: recipes[0].batchId, label: recipes[0].batchLabel, recipes,
}));
