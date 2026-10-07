import type { Exercise } from '../types'

export const EXERCISES: Exercise[] = [
  {
    id: 'pushup', name: '伏地挺身', en: 'Push-up', group: '上肢', muscles: ['胸大肌', '三頭肌', '前三角肌'],
    difficulty: 2, type: 'reps', defaultReps: 12, kcalPerMin: 8, demo: 'pushup',
    steps: ['雙手略寬於肩撐地，手指朝前', '身體從頭到腳跟呈一直線，收緊核心與臀部', '吸氣，彎曲手肘讓胸口降到離地約一個拳頭', '吐氣，用胸部與手臂力量推回起始位置'],
    tip: '手肘與身體約呈 45 度，不要往外打開；做不了可改成跪姿。',
  },
  {
    id: 'squat', name: '深蹲', en: 'Squat', group: '下肢', muscles: ['股四頭肌', '臀大肌', '腿後肌'],
    difficulty: 1, type: 'reps', defaultReps: 15, kcalPerMin: 7, demo: 'squat',
    steps: ['雙腳與肩同寬，腳尖微微朝外', '挺胸收腹，臀部往後坐，像要坐椅子', '下蹲至大腿約與地面平行，雙手可往前平舉保持平衡', '腳跟踩穩，臀部發力站起'],
    tip: '膝蓋方向與腳尖一致，避免膝蓋內夾；全程腳跟不離地。',
  },
  {
    id: 'lunge', name: '弓箭步', en: 'Lunge', group: '下肢', muscles: ['股四頭肌', '臀大肌', '小腿'],
    difficulty: 2, type: 'reps', defaultReps: 12, kcalPerMin: 7, demo: 'lunge',
    steps: ['站直，雙手叉腰', '一腳向前跨一大步', '身體垂直下降，前後膝蓋都約呈 90 度', '前腳發力推回起始位置，左右交替'],
    tip: '上半身保持直立，前膝不要明顯超過腳尖太多、也不要內倒。',
  },
  {
    id: 'plank', name: '平板支撐', en: 'Plank', group: '核心', muscles: ['腹直肌', '腹橫肌', '肩部穩定肌群'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 4, demo: 'plank',
    steps: ['前臂撐地，手肘位於肩膀正下方', '雙腳向後伸直，腳尖撐地', '收緊腹部與臀部，身體呈一直線', '保持自然呼吸，維持指定時間'],
    tip: '不要塌腰或把屁股翹太高，眼睛看向雙手前方地面。',
  },
  {
    id: 'burpee', name: '波比跳', en: 'Burpee', group: '全身', muscles: ['全身', '心肺'],
    difficulty: 3, type: 'reps', defaultReps: 10, kcalPerMin: 12, demo: 'burpee',
    steps: ['站姿開始，蹲下雙手撐地', '雙腳往後跳成高棒式', '雙腳跳回手的附近', '向上跳起，雙手舉過頭頂'],
    tip: '先求動作流暢再求速度；想加強可在棒式時加一下伏地挺身。',
  },
  {
    id: 'climber', name: '登山者', en: 'Mountain Climber', group: '全身', muscles: ['核心', '髖屈肌', '肩部', '心肺'],
    difficulty: 2, type: 'time', defaultSeconds: 30, kcalPerMin: 10, demo: 'climber',
    steps: ['高棒式準備，雙手在肩膀正下方', '收緊核心，將一側膝蓋快速拉向胸口', '換腳，像在原地跑步', '維持臀部高度穩定，持續交替'],
    tip: '肩膀保持在手腕正上方，臀部不要上下晃動。',
  },
  {
    id: 'bridge', name: '臀橋', en: 'Glute Bridge', group: '下肢', muscles: ['臀大肌', '腿後肌', '下背'],
    difficulty: 1, type: 'reps', defaultReps: 15, kcalPerMin: 5, demo: 'bridge',
    steps: ['仰躺，屈膝雙腳踩地，與髖同寬', '雙手放身體兩側', '臀部夾緊，把骨盆往上推到肩膀、髖、膝成一直線', '頂端停 1 秒，再慢慢放下'],
    tip: '用臀部出力而不是腰；腳跟踩地可以更有感。',
  },
  {
    id: 'situp', name: '仰臥起坐', en: 'Sit-up', group: '核心', muscles: ['腹直肌', '髖屈肌'],
    difficulty: 2, type: 'reps', defaultReps: 15, kcalPerMin: 6, demo: 'situp',
    steps: ['仰躺屈膝，雙腳踩地', '雙手交叉放胸前', '吐氣，用腹部力量捲起上半身直到坐起', '吸氣，慢慢一節一節躺回地面'],
    tip: '不要用手拉脖子或甩動身體借力。',
  },
  {
    id: 'crunch', name: '捲腹', en: 'Crunch', group: '核心', muscles: ['上腹', '腹直肌'],
    difficulty: 1, type: 'reps', defaultReps: 20, kcalPerMin: 5, demo: 'crunch',
    steps: ['仰躺屈膝，雙腳踩地', '雙手輕放胸前或耳側', '吐氣，捲起上背讓肩胛離地', '頂端停一下，慢慢放回'],
    tip: '下背始終貼地，動作幅度小但要感受腹部收縮。',
  },
  {
    id: 'jack', name: '開合跳', en: 'Jumping Jack', group: '全身', muscles: ['心肺', '小腿', '肩部'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 9, demo: 'jack',
    steps: ['雙腳併攏站立，雙手放身側', '跳起時雙腳向外打開，雙手由側邊舉過頭頂', '再跳回併腳、雙手放下', '保持節奏連續進行'],
    tip: '用前腳掌輕巧落地，膝蓋微彎緩衝。',
  },
  {
    id: 'superman', name: '超人式', en: 'Superman', group: '核心', muscles: ['豎脊肌', '臀大肌', '後肩'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 4, demo: 'superman',
    steps: ['俯臥，雙手向前伸直', '吸氣，同時抬起雙手、胸口與雙腿', '在最高點停留 1–2 秒', '吐氣，慢慢放下'],
    tip: '脖子保持中立，眼睛看地面，不要過度抬頭。',
  },
  {
    id: 'sideplank', name: '側棒式', en: 'Side Plank', group: '核心', muscles: ['腹斜肌', '臀中肌', '肩部'],
    difficulty: 2, type: 'time', defaultSeconds: 30, kcalPerMin: 4, demo: 'sideplank',
    steps: ['側躺，下方手肘撐在肩膀正下方', '雙腳伸直疊放', '抬起臀部，身體呈一直線', '上方手可插腰或伸向天空，維持時間後換邊'],
    tip: '臀部不要往後坐或下沉，想像身體被夾在兩片玻璃之間。',
  },
  {
    id: 'dips', name: '椅子撐體', en: 'Chair Dip', group: '上肢', muscles: ['三頭肌', '前三角肌', '胸部'],
    difficulty: 2, type: 'reps', defaultReps: 12, kcalPerMin: 6, demo: 'dips',
    steps: ['背對穩固的椅子，雙手撐在椅緣，手指朝前', '雙腳往前伸，臀部離開椅子', '彎曲手肘讓身體下降至上臂約與地面平行', '用三頭肌把身體推回'],
    tip: '肩膀不要聳起，臀部貼近椅子；椅子務必穩固不滑動。',
  },
  {
    id: 'highknees', name: '高抬腿', en: 'High Knees', group: '全身', muscles: ['心肺', '髖屈肌', '小腿'],
    difficulty: 2, type: 'time', defaultSeconds: 30, kcalPerMin: 10, demo: 'highknees',
    steps: ['站直，雙手放在腰部高度', '原地快速交替抬膝，膝蓋抬至髖部高度', '手臂跟著前後擺動', '保持上身挺直與節奏'],
    tip: '用前腳掌著地，核心收緊，不要往後仰。',
  },
  {
    id: 'wallsit', name: '靠牆坐', en: 'Wall Sit', group: '下肢', muscles: ['股四頭肌', '臀大肌'],
    difficulty: 2, type: 'time', defaultSeconds: 40, kcalPerMin: 5, demo: 'wallsit',
    steps: ['背靠牆站立，雙腳往前約一步', '背部貼牆向下滑，直到大腿與地面平行', '膝蓋約 90 度、在腳踝正上方', '維持姿勢並保持呼吸'],
    tip: '整個背部貼牆，重心放在腳跟，膝蓋不要內夾。',
  },
  {
    id: 'pullup', name: '引體向上', en: 'Pull-up', group: '上肢', muscles: ['背闊肌', '二頭肌', '後三角肌'],
    difficulty: 3, type: 'reps', defaultReps: 6, kcalPerMin: 8, demo: 'pullup',
    steps: ['正手握單槓，雙手略寬於肩', '身體懸空，肩胛先往下收', '用背部力量把身體拉高，直到下巴超過單槓', '有控制地慢慢放下到手臂伸直'],
    tip: '避免晃動借力；拉不上去可先做離心（慢慢放下）或彈力帶輔助。',
  },
  {
    id: 'diamond', name: '鑽石伏地挺身', en: 'Diamond Push-up', group: '上肢', muscles: ['三頭肌', '內側胸肌'],
    difficulty: 3, type: 'reps', defaultReps: 8, kcalPerMin: 8, demo: 'diamond',
    steps: ['雙手在胸口下方併攏，拇指與食指圍成鑽石形', '身體呈一直線，收緊核心', '彎曲手肘讓胸口靠近雙手', '用手臂力量推回起始位置'],
    tip: '手肘貼近身體往後彎，比一般伏地挺身更強調三頭肌。',
  },
  {
    id: 'jumpsquat', name: '跳蹲', en: 'Jump Squat', group: '下肢', muscles: ['股四頭肌', '臀大肌', '心肺'],
    difficulty: 2, type: 'reps', defaultReps: 12, kcalPerMin: 11, demo: 'jumpsquat',
    steps: ['雙腳與肩同寬站立', '下蹲至大腿約與地面平行', '爆發力向上跳起，雙手往下擺', '落地時屈膝緩衝，直接接下一下'],
    tip: '落地要輕、膝蓋對齊腳尖；膝蓋不適可改回一般深蹲。',
  },
  {
    id: 'birddog', name: '鳥狗式', en: 'Bird Dog', group: '核心', muscles: ['核心', '下背', '臀部'],
    difficulty: 1, type: 'reps', defaultReps: 10, kcalPerMin: 4, demo: 'birddog',
    steps: ['四足跪姿，手在肩膀下方、膝蓋在髖部下方', '收緊核心，同時伸直右手與左腳', '身體保持穩定不旋轉，停 2 秒', '收回後換邊，左右算一下'],
    tip: '想像背上放了一杯水，動作慢而穩。',
  },
  {
    id: 'bicycle', name: '捲腹腳踏車', en: 'Bicycle Crunch', group: '核心', muscles: ['腹斜肌', '腹直肌'],
    difficulty: 2, type: 'reps', defaultReps: 20, kcalPerMin: 7, demo: 'bicycle',
    steps: ['仰躺，雙手輕放耳側，雙腳抬離地面', '捲起上背，右手肘轉向左膝，同時伸直右腳', '換邊，左手肘轉向右膝', '像踩腳踏車一樣持續交替'],
    tip: '重點是軀幹的旋轉，不是用手拉頭；下背貼地。',
  },
]

export const EX_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
export const GROUPS = ['全部', '上肢', '核心', '下肢', '全身'] as const
export const DIFF_LABEL = ['', '入門', '中等', '進階'] as const
