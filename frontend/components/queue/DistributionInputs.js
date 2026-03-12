'use client';

import { DIST_TYPES } from '@/lib/constants';

/**
 * Renders the correct inputs based on selected distribution type.
 * Used for both arrival and service sections.
 *
 * Props:
 *  - prefix: string  ('arrival' | 'service') — used to build field names
 *  - dist:   string  — current distribution type value
 *  - values: object  — current form field values
 *  - onChange: fn    — (name, value) => void
 */
export default function DistributionInputs({ prefix, dist, values, onChange }) {
  const field = (name) => `${prefix}_${name}`;

  const inputClass =
    'w-full bg-[#0a0e1a] border border-[#1e2d45] rounded-lg px-3 py-2.5 text-white text-sm ' +
    'placeholder-[#b0b5c0]/50 focus:border-[#00d4ff] focus:outline-none transition-colors';

  const labelClass =
    'block text-xs font-semibold text-[#b0b5c0] uppercase tracking-wider mb-1.5';

  if (dist === DIST_TYPES.UNIFORM) {
    return (
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className={labelClass}>Minimum (min)</label>
          <input
            type='number'
            placeholder='e.g. 2'
            className={inputClass}
            value={values[field('min')] ?? ''}
            onChange={(e) => onChange(field('min'), e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Maximum (min)</label>
          <input
            type='number'
            placeholder='e.g. 8'
            className={inputClass}
            value={values[field('max')] ?? ''}
            onChange={(e) => onChange(field('max'), e.target.value)}
          />
        </div>
      </div>
    );
  }

  // Normal or Gamma — both use Mean + Variance
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div>
        <label className={labelClass}>Mean (min)</label>
        <input
          type='number'
          placeholder='e.g. 5'
          className={inputClass}
          value={values[field('mean')] ?? ''}
          onChange={(e) => onChange(field('mean'), e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Variance (min²)</label>
        <input
          type='number'
          placeholder='e.g. 4'
          className={inputClass}
          value={values[field('variance')] ?? ''}
          onChange={(e) => onChange(field('variance'), e.target.value)}
        />
      </div>
    </div>
  );
}
