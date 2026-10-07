import type { Plan } from '../types'

export const BUILTIN_PLANS: Plan[] = [
  {
    id: 'beginner', name: '新手全身', builtIn: true, hue: 18,
    description: '適合剛開始運動的你，從基礎動作建立全身肌力。',
    items: [
      { exerciseId: 'jack', sets: 1, seconds: 30, rest: 20 },
      { exerciseId: 'squat', sets: 3, reps: 12, rest: 30 },
      { exerciseId: 'pushup', sets: 3, reps: 8, rest: 30 },
      { exerciseId: 'bridge', sets: 2, reps: 15, rest: 25 },
      { exerciseId: 'plank', sets: 2, seconds: 25, rest: 25 },
    ],
  },
  {
    id: 'core', name: '核心強化', builtIn: true, hue: 265,
    description: '腹部、側腹到下背一次練到，打造穩定核心。',
    items: [
      { exerciseId: 'crunch', sets: 2, reps: 20, rest: 20 },
      { exerciseId: 'bicycle', sets: 2, reps: 20, rest: 20 },
      { exerciseId: 'plank', sets: 2, seconds: 40, rest: 20 },
      { exerciseId: 'sideplank', sets: 2, seconds: 25, rest: 15 },
      { exerciseId: 'birddog', sets: 2, reps: 10, rest: 20 },
      { exerciseId: 'superman', sets: 2, reps: 12, rest: 20 },
    ],
  },
  {
    id: 'legs', name: '下肢燃脂', builtIn: true, hue: 340,
    description: '大肌群高強度組合，心跳飆升、燃脂效率高。',
    items: [
      { exerciseId: 'highknees', sets: 1, seconds: 30, rest: 20 },
      { exerciseId: 'squat', sets: 3, reps: 15, rest: 25 },
      { exerciseId: 'lunge', sets: 3, reps: 12, rest: 25 },
      { exerciseId: 'jumpsquat', sets: 3, reps: 10, rest: 30 },
      { exerciseId: 'wallsit', sets: 2, seconds: 40, rest: 30 },
      { exerciseId: 'bridge', sets: 2, reps: 15, rest: 20 },
    ],
  },
  {
    id: 'hiit7', name: '7 分鐘 HIIT', builtIn: true, hue: 200,
    description: '經典 7 分鐘高強度間歇：每個動作 30 秒、休息 10 秒。',
    items: [
      { exerciseId: 'jack', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'wallsit', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'pushup', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'crunch', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'climber', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'squat', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'dips', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'plank', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'highknees', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'lunge', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'pushup', sets: 1, seconds: 30, rest: 10 },
      { exerciseId: 'sideplank', sets: 1, seconds: 30, rest: 10 },
    ],
  },
]
