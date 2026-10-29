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
    steps: ['站直，雙腳與肩同寬，膝蓋微彎', '雙手往兩側平舉到肩膀高度，手肘伸直但不鎖死', '由肩膀帶動，雙手往前大幅度繞圈（約 40–50 公分），每圈約 1 秒，不要甩太快', '繞 4 圈後換方向往後繞，身體保持穩定、肩膀放鬆'],
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
  // ---------------- 啞鈴 (dumbbells) ----------------
  {
    id: 'dbgoblet', name: '啞鈴高腳杯深蹲', en: 'Goblet Squat', group: '下肢', muscles: ['股四頭肌', '臀大肌', '核心'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 8, demo: 'dbgoblet', cat: 'db',
    steps: ['雙手捧住一個啞鈴的一端，貼在胸前', '雙腳略寬於肩，腳尖微朝外', '挺胸，臀部往後往下坐到大腿約與地面平行', '腳跟踩穩發力站起，啞鈴始終貼近胸口'],
    tip: '手肘往下指、在膝蓋內側；背不要拱，膝蓋跟著腳尖方向。',
  },
  {
    id: 'dbrdl', name: '啞鈴羅馬尼亞硬舉', en: 'Romanian Deadlift', group: '下肢', muscles: ['腿後肌', '臀大肌', '下背'],
    difficulty: 2, type: 'reps', defaultReps: 10, kcalPerMin: 7, demo: 'dbrdl', cat: 'db',
    steps: ['雙手各握一個啞鈴垂在大腿前，膝蓋微彎', '臀部往後推、上身前傾，啞鈴沿著大腿往下滑', '降到小腿中段、感覺大腿後側拉緊', '臀部往前推回站直，頂端夾臀'],
    tip: '背部全程打直、肩膀往後收；這是「推臀」不是「蹲」，膝蓋角度幾乎不變。',
  },
  {
    id: 'dbrow', name: '啞鈴俯身划船', en: 'Bent-over Row', group: '上肢', muscles: ['背闊肌', '後三角肌', '二頭肌'],
    difficulty: 2, type: 'reps', defaultReps: 10, kcalPerMin: 6, demo: 'dbrow', cat: 'db',
    steps: ['雙手各握啞鈴，膝蓋微彎、上身前傾約 45 度', '手臂自然垂下，背打直', '手肘往後上方拉，把啞鈴拉到腰側', '停一下夾緊背部，再慢慢放下'],
    tip: '用手肘帶動而不是用手腕甩；拉的時候肩膀不要聳到耳朵。',
  },
  {
    id: 'dbfloorpress', name: '啞鈴地板臥推', en: 'Floor Press', group: '上肢', muscles: ['胸大肌', '三頭肌', '前三角肌'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 6, demo: 'dbfloorpress', cat: 'db',
    steps: ['仰躺屈膝，雙手各握啞鈴，上臂貼地、前臂垂直', '吐氣，把啞鈴往天花板推直', '在頂端稍停，啞鈴不要互撞', '吸氣，慢慢放下直到上臂輕觸地面'],
    tip: '沒有臥推椅的好選擇；手肘與身體約呈 45 度，不要完全打開成 T 字。',
  },
  {
    id: 'dbpress', name: '啞鈴站姿肩推', en: 'Shoulder Press', group: '上肢', muscles: ['三角肌', '三頭肌', '核心'],
    difficulty: 2, type: 'reps', defaultReps: 10, kcalPerMin: 6, demo: 'dbpress', cat: 'db',
    steps: ['站直，雙手握啞鈴停在肩膀高度，掌心相對', '收緊腹部與臀部', '吐氣，把啞鈴往上推到手臂接近伸直', '慢慢放回肩膀高度'],
    tip: '推的時候不要後仰塌腰；肋骨往下收，頭在雙臂之間。',
  },
  {
    id: 'dblateral', name: '啞鈴側平舉', en: 'Lateral Raise', group: '上肢', muscles: ['三角肌', '斜方肌'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 5, demo: 'dblateral', cat: 'db',
    steps: ['站直，雙手各握輕啞鈴垂在身側，手肘微彎', '手臂往兩側舉起，帶動的是手肘', '舉到約與肩同高、身體呈 T 字', '慢慢放下，不要甩'],
    tip: '重量選輕一點；肩膀不要聳起，舉到肩高就好。',
  },
  {
    id: 'dbcurl', name: '啞鈴二頭彎舉', en: 'Biceps Curl', group: '上肢', muscles: ['二頭肌', '前臂'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 4, demo: 'dbcurl', cat: 'db',
    steps: ['站直，雙手握啞鈴垂在身側', '上臂貼住身體不動', '彎曲手肘把啞鈴舉到肩前', '停一下，慢慢放下到手臂伸直'],
    tip: '身體不要前後晃動借力；放下時控制速度效果更好。',
  },
  {
    id: 'dbhammer', name: '啞鈴錘式彎舉', en: 'Hammer Curl', group: '上肢', muscles: ['二頭肌', '前臂'],
    difficulty: 1, type: 'reps', defaultReps: 10, kcalPerMin: 4, demo: 'dbhammer', cat: 'db',
    steps: ['站直，雙手握啞鈴、掌心朝內像握鐵鎚', '上臂貼身', '左右交替彎曲手肘把啞鈴舉到肩前', '慢慢放下再換手'],
    tip: '次數以單手計；掌心全程朝內，手腕不要彎。',
  },
  {
    id: 'dbtricep', name: '啞鈴過頭三頭伸展', en: 'Overhead Triceps Extension', group: '上肢', muscles: ['三頭肌'],
    difficulty: 2, type: 'reps', defaultReps: 12, kcalPerMin: 4, demo: 'dbtricep', cat: 'db',
    steps: ['站直或坐著，雙手捧住一個啞鈴舉過頭頂', '上臂靠近耳朵固定不動', '彎曲手肘讓啞鈴慢慢降到頭後方', '伸直手肘把啞鈴推回頭頂'],
    tip: '手肘朝前、不要往外開；腹部收緊避免腰往後凹。',
  },
  {
    id: 'dbrevlunge', name: '啞鈴後跨弓箭步', en: 'Reverse Lunge', group: '下肢', muscles: ['股四頭肌', '臀大肌', '腿後肌'],
    difficulty: 2, type: 'reps', defaultReps: 10, kcalPerMin: 7, demo: 'dbrevlunge', cat: 'db',
    steps: ['雙手各握啞鈴垂在身側，站直', '一腳往後跨一大步，腳尖著地', '身體垂直往下，前後膝蓋約 90 度', '前腳踩穩發力站回原位，左右交替'],
    tip: '比前跨弓箭步更護膝；重心放在前腳，上身保持直立。',
  },
  {
    id: 'dbrenegade', name: '啞鈴叛逆者划船', en: 'Renegade Row', group: '全身', muscles: ['背闊肌', '核心', '肩部穩定肌群'],
    difficulty: 3, type: 'reps', defaultReps: 8, kcalPerMin: 8, demo: 'dbrenegade', cat: 'db',
    steps: ['雙手握啞鈴撐地成高棒式，雙腳打開比肩寬', '身體呈一直線，收緊核心', '一手把啞鈴往腰側拉起，另一手撐穩', '放回地面再換手，臀部不要左右扭'],
    tip: '次數以單手計；用六角或平底啞鈴比較穩，腳打開越寬越容易。',
  },
  {
    id: 'dbfarmer', name: '啞鈴農夫走路', en: "Farmer's Carry", group: '全身', muscles: ['前臂', '斜方肌', '核心'],
    difficulty: 1, type: 'time', defaultSeconds: 40, kcalPerMin: 6, demo: 'dbfarmer', cat: 'db', quiet: true,
    steps: ['雙手各提一個握得穩的啞鈴，手臂自然垂在身側', '站直、收緊核心，肩膀保持自然穩定', '用小步向前走，轉身時分幾步調整方向再返回', '保持身體穩定，避免提肩、左右歪斜或甩動啞鈴'],
    tip: '選擇平坦、無障礙的短距離來回走；空間不足可改做站立負重持握，握不住就先放下休息。',
  },
  {
    id: 'dbcalf', name: '啞鈴提踵', en: 'Calf Raise', group: '下肢', muscles: ['小腿'],
    difficulty: 1, type: 'reps', defaultReps: 15, kcalPerMin: 4, demo: 'dbcalf', cat: 'db', quiet: true,
    steps: ['雙手各握啞鈴垂在身側，雙腳與髖同寬', '腳跟慢慢往上踮到最高', '在頂端停 1 秒', '慢慢放下腳跟'],
    tip: '踮起時重心在大拇趾球；可以站在台階邊緣增加幅度。',
  },
  {
    id: 'dbbridge', name: '啞鈴臀橋', en: 'Dumbbell Glute Bridge', group: '下肢', muscles: ['臀大肌', '腿後肌', '核心'],
    difficulty: 1, type: 'reps', defaultReps: 12, kcalPerMin: 5, demo: 'dbbridge', cat: 'db', quiet: true,
    steps: ['仰躺屈膝，雙腳踩地與髖同寬', '雙手把一個啞鈴壓在髖骨上', '腳跟發力把臀部推高，身體從肩到膝呈直線', '頂端夾臀停 1 秒，慢慢放下'],
    tip: '用臀部而不是腰出力；頂端不要過度挺腰。',
  },
]

export const EX_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
export const GROUPS = ['全部', '上肢', '核心', '下肢', '全身'] as const
/** library / picker filter chips */
export const FILTERS = ['全部', '瘦身操', '安靜不跳', '啞鈴', '上肢', '核心', '下肢', '全身'] as const
export type Filter = (typeof FILTERS)[number]
export function matchFilter(e: Exercise, f: Filter): boolean {
  if (f === '全部') return true
  if (f === '瘦身操') return e.cat === 'aero'
  if (f === '安靜不跳') return e.cat === 'aero' && !!e.quiet
  if (f === '啞鈴') return e.cat === 'db'
  return e.group === f
}
export const DB_COUNT = EXERCISES.filter((e) => e.cat === 'db').length
export const AERO_COUNT = EXERCISES.filter((e) => e.cat === 'aero').length
export const DIFF_LABEL = ['', '入門', '中等', '進階'] as const
