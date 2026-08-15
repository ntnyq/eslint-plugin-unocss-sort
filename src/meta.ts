import { name, version } from '../package.json' with { type: 'json' }

/**
 * Package metadata exposed through the ESLint plugin contract
 */
export const meta = {
  name,
  version,
}
