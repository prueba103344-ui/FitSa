export type ExerciseVideoMap = Record<string, string>;

const videoMap: ExerciseVideoMap = {
  // Upper body
  'press banca': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  'bench press': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  'press de banca': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  'press militar': 'https://www.youtube.com/watch?v=qEwKCR5JCog',
  'overhead press': 'https://www.youtube.com/watch?v=qEwKCR5JCog',
  'dominadas': 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  'pull ups': 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  'remo con barra': 'https://www.youtube.com/watch?v=vT2GjY_Umpw',
  'barbell row': 'https://www.youtube.com/watch?v=vT2GjY_Umpw',
  'curl biceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'bicep curl': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'fondos': 'https://www.youtube.com/watch?v=2z8JmcrW-As',
  'dips': 'https://www.youtube.com/watch?v=2z8JmcrW-As',

  // Lower body
  'sentadilla': 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'squat': 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'peso muerto': 'https://www.youtube.com/watch?v=op9kVnSso6Q',
  'deadlift': 'https://www.youtube.com/watch?v=op9kVnSso6Q',
  'zancadas': 'https://www.youtube.com/watch?v=wrwwXE_x-pQ',
  'lunges': 'https://www.youtube.com/watch?v=wrwwXE_x-pQ',
  'hip thrust': 'https://www.youtube.com/watch?v=LM8XHLYJoYs',

  // Core
  'plancha': 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
  'plank': 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
  'crunch': 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
  'crunches': 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
};

export function getDefaultExerciseVideo(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  // direct match
  if (videoMap[key]) return videoMap[key];

  // fuzzy contains
  const entry = Object.keys(videoMap).find(k => key.includes(k));
  return entry ? videoMap[entry] : undefined;
}
