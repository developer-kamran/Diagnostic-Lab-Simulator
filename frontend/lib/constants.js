export const MODEL_LABELS = {
  MM1: 'M/M/1',
  MG1: 'M/G/1',
  GG1: 'G/G/1',
};

export const MODEL_DESCRIPTIONS = {
  MM1: 'Exponential arrivals and exponential service times.',
  MG1: 'Exponential arrivals with a general service time distribution.',
  GG1: 'General arrival and service time distributions.',
};

export const DIST_TYPES = {
  EXPONENTIAL: 'Exponential',
  UNIFORM:     'Uniform',
  NORMAL:      'Normal',
  GAMMA:       'Gamma',
};

export const GENERAL_DISTS = [
  { value: 'Uniform', label: 'Uniform' },
  { value: 'Gamma',   label: 'Gamma'   },
  { value: 'Normal',  label: 'Normal'  },
];
