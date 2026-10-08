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

  /* ================= 瘦身操 ================= */
  {
    id: 'march', name: '原地踏步', en: 'March in Place', group: '全身', muscles: ['髖屈肌', '股四頭肌', '心肺'],
    difficulty: 1, type: 'time', defaultSeconds: 45, kcalPerMin: 5, demo: 'march', cat: 'aero', quiet: true,
    steps: ['站直，雙腳與髖同寬，核心微收', '交替抬起膝蓋，大腿抬到約與地面呈 45～90 度', '手肘彎曲約 90 度，跟著對側腳前後擺動', '保持節奏與自然呼吸，腳掌輕輕落地'],
    tip: '最適合熱身與緩和；想提高強度就抬高膝蓋、加快節奏。',
  },
  {
    id: 'buttkick', name: '後勾腿', en: 'Butt Kicks', group: '下肢', muscles: ['腿後肌', '小腿', '心肺'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 8, demo: 'buttkick', cat: 'aero',
    steps: ['站直，雙手握拳放在腰側', '原地小跑，腳跟往後勾向臀部', '大腿保持朝下，只有小腿往後踢', '手臂自然前後擺動，前腳掌輕巧著地'],
    tip: '怕吵到樓下可改成不跳的「交替勾腿」：一腳站穩，另一腳往後勾。',
  },
  {
    id: 'kickclap', name: '踢腿拍手', en: 'Kick & Clap', group: '全身', muscles: ['髖屈肌', '股四頭肌', '核心'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 6, demo: 'kickclap', cat: 'aero', quiet: true,
    steps: ['站直，雙手舉高過頭', '一腳往前踢高，膝蓋盡量打直', '雙手同時往下擺，在腿的上方或下方拍手', '放下腳、雙手回到頭頂，換腳交替'],
    tip: '踢腿高度以舒服為主，上半身保持挺直，不要彎腰去追腳。',
  },
  {
    id: 'punch', name: '直拳連擊', en: 'Jab-Cross Punches', group: '上肢', muscles: ['肩部', '三頭肌', '核心'],
    difficulty: 1, type: 'time', defaultSeconds: 40, kcalPerMin: 7, demo: 'punch', cat: 'aero', quiet: true,
    steps: ['雙腳前後站開、膝蓋微彎，雙拳護在下巴前', '前手快速向前出拳，手臂伸直後立刻收回', '換後手出拳，後腳跟可微微轉動帶動身體', '左右交替，出拳吐氣，另一手始終護臉'],
    tip: '出拳時手肘不要完全鎖死；用腹部轉動帶力，打起來更有勁也更燃脂。',
  },
  {
    id: 'uppercut', name: '上勾拳', en: 'Uppercuts', group: '上肢', muscles: ['二頭肌', '肩部', '腹斜肌'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 7, demo: 'uppercut', cat: 'aero', quiet: true,
    steps: ['拳擊站姿，雙拳護在下巴前', '膝蓋微蹲，一手拳頭往下放到腰的高度', '雙腿蹬直，同時由下往上揮拳到下巴高度', '收回護臉，換手交替'],
    tip: '力量從腿和腰往上傳，手肘保持約 90 度彎曲，不要往外甩。',
  },
  {
    id: 'armcircle', name: '手臂繞圈', en: 'Arm Circles', group: '上肢', muscles: ['三角肌', '斜方肌'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 3, demo: 'armcircle', cat: 'aero', quiet: true,
    steps: ['站直，雙腳與肩同寬', '雙手伸直，從身體後方往上、往前畫大圓', '肩膀放鬆不要聳肩，動作連續不停', '做到一半可以換方向（往後繞）'],
    tip: '很適合當熱身，能活動肩關節、讓上半身暖起來。',
  },
  {
    id: 'stepjack', name: '側踏開合', en: 'Step Jacks', group: '全身', muscles: ['肩部', '臀中肌', '心肺'],
    difficulty: 1, type: 'time', defaultSeconds: 40, kcalPerMin: 6, demo: 'stepjack', cat: 'aero', quiet: true,
    steps: ['雙腳併攏站立，雙手放身側', '一腳往側邊踏出，同時雙手從側邊舉過頭頂', '收腳回到中間、雙手放下', '換另一腳往側邊踏，左右交替'],
    tip: '這是不跳躍的開合跳，安靜又護膝；想加強就加快速度或踏得更寬。',
  },
  {
    id: 'steptouch', name: '側併步', en: 'Step Touch', group: '全身', muscles: ['股四頭肌', '大腿內側', '心肺'],
    difficulty: 1, type: 'time', defaultSeconds: 45, kcalPerMin: 5, demo: 'steptouch', cat: 'aero', quiet: true,
    steps: ['雙腳併攏，膝蓋微彎', '右腳往右跨一大步，雙手往兩側打開', '左腳跟上點地，雙手在胸前拍手', '再往左跨步、右腳點地，左右來回'],
    tip: '膝蓋保持微彎、重心放低，跨步越大越燃脂；跟著音樂節奏做最有趣。',
  },
  {
    id: 'sideleg', name: '站姿側抬腿', en: 'Standing Side Leg Raise', group: '下肢', muscles: ['臀中肌', '腹斜肌'],
    difficulty: 1, type: 'time', defaultSeconds: 30, kcalPerMin: 4, demo: 'sideleg', cat: 'aero', quiet: true,
    steps: ['站直，雙手插腰', '一腳伸直往側邊抬起，腳尖朝前', '抬到約 30～45 度，感受臀部外側出力', '慢慢放下，換腳交替'],
    tip: '上半身不要往另一側倒太多；站不穩可以一手扶牆或椅背。',
  },
  {
    id: 'sidecrunch', name: '站姿側提膝', en: 'Standing Side Crunch', group: '核心', muscles: ['腹斜肌', '髖屈肌'],
    difficulty: 2, type: 'time', defaultSeconds: 40, kcalPerMin: 6, demo: 'sidecrunch', cat: 'aero', quiet: true,
    steps: ['雙腳略寬於肩，雙手放在頭後、手肘打開', '一腳膝蓋往側邊抬起', '同時上半身往同側彎，手肘往下靠近膝蓋', '回到站姿，換邊交替'],
    tip: '用側腹的力量去「夾」，不要只是低頭；手輕扶頭部，不要拉脖子。',
  },
  {
    id: 'hula', name: '擺臀扭腰', en: 'Hip Sway', group: '核心', muscles: ['腹斜肌', '腹肌'],
    difficulty: 1, type: 'time', defaultSeconds: 40, kcalPerMin: 4, demo: 'hula', cat: 'aero', quiet: true,
    steps: ['雙腳略寬於肩，膝蓋放鬆微彎', '雙手往兩側打開，像跳草裙舞', '骨盆左右擺動，肩膀盡量保持在中間', '手臂跟著節奏像波浪一樣上下擺動'],
    tip: '動的是腰和骨盆，不是整個身體左右晃；可以加上畫圈擺動。',
  },
  {
    id: 'sidelunge', name: '側弓步', en: 'Side Lunge', group: '下肢', muscles: ['股四頭肌', '臀肌', '大腿內側'],
    difficulty: 2, type: 'time', defaultSeconds: 40, kcalPerMin: 7, demo: 'sidelunge', cat: 'aero', quiet: true,
    steps: ['雙腳打開約兩倍肩寬，腳尖微微朝外', '雙手在胸前合握，重心移到一側', '臀部往後坐、彎曲那側的膝蓋，另一腳伸直', '推回中間，換另一側'],
    tip: '彎曲的膝蓋要對準腳尖，腳跟踩穩；伸直那條腿會感覺大腿內側在拉伸。',
  },
  {
    id: 'skihop', name: '滑雪跳', en: 'Ski Hops', group: '全身', muscles: ['小腿', '股四頭肌', '心肺'],
    difficulty: 2, type: 'time', defaultSeconds: 30, kcalPerMin: 10, demo: 'skihop', cat: 'aero',
    steps: ['雙腳併攏，膝蓋微彎', '雙腳一起往側邊小跳', '落地後馬上往另一側跳回', '手臂像拿滑雪杖一樣跟著擺動'],
    tip: '用前腳掌輕巧落地、膝蓋緩衝；有跳躍，住公寓可換成側併步。',
  },
  {
    id: 'sidebend', name: '站姿側彎', en: 'Standing Side Bend', group: '核心', muscles: ['腹斜肌', '背闊肌'],
    difficulty: 1, type: 'time', defaultSeconds: 40, kcalPerMin: 3, demo: 'sidebend', cat: 'aero', quiet: true,
    steps: ['站直，雙腳與髖同寬，雙手插腰', '一手往上舉高，越過頭頂往另一側延伸', '上半身慢慢側彎，停 2～3 秒感受側腰拉伸', '回到中間，換邊'],
    tip: '適合當緩和收操；彎的時候身體不要往前倒，保持呼吸不要憋氣。',
  },
]

export const EX_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
export const GROUPS = ['全部', '上肢', '核心', '下肢', '全身'] as const
/** library / picker filter chips */
export const FILTERS = ['全部', '瘦身操', '安靜不跳', '上肢', '核心', '下肢', '全身'] as const
export type Filter = (typeof FILTERS)[number]
export function matchFilter(e: Exercise, f: Filter): boolean {
  if (f === '全部') return true
  if (f === '瘦身操') return e.cat === 'aero'
  if (f === '安靜不跳') return e.cat === 'aero' && !!e.quiet
  return e.group === f
}
export const AERO_COUNT = EXERCISES.filter((e) => e.cat === 'aero').length
export const DIFF_LABEL = ['', '入門', '中等', '進階'] as const
