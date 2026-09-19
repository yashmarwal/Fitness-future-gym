// Exercise list for the workout-plan builder's name picker, the workout
// logger's autocomplete, AND the Muscle Progress XP system's exercise→muscle-
// group matching.
//
// Researched two free exercise-database APIs before deciding on a bundled
// list instead: wger.de's public REST API (no auth needed, but live-tested
// its /exercise-translation search/name-filter query params and they don't
// actually filter server-side — every query returns the full unfiltered
// set) and ExerciseDB (its genuinely-free, no-signup version has largely
// moved to a commercial platform with its own rate limits). Rather than
// build a "plan your workouts" feature on top of a third-party dependency
// that's either flaky or another account to set up — and this app's owner
// has repeatedly asked to keep external dependencies to just WhatsApp +
// Supabase — this is a self-contained exercise list. It works offline,
// instantly, and forever.
//
// `aliases` covers the shorthand/slang a member is likely to actually type
// into the free-text workout logger: gym abbreviations ("bb bench", "ohp"),
// spelling variants, and the Indian/desi names people really use in Indian
// gyms (dand, baithak, gada, mudgar, nal, rassi kood, daud, surya namaskar…),
// written in Roman script since that's how they get typed on a phone.
//
// Matching (see searchExercises / matchExerciseCategory below) is exact →
// prefix → whole-word → Fuse.js fuzzy, so a typo like "mountian climbin" or
// "dumbell pres" still resolves instead of silently earning no XP.
import Fuse from "fuse.js";

export type ExerciseCategory =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Arms"
  | "Core"
  | "Cardio"
  | "Full Body";

export type ExerciseEntry = {
  name: string;
  category: ExerciseCategory;
  aliases?: string[];
};

type Row = [name: string, category: ExerciseCategory, aliases?: string[]];

const ROWS: Row[] = [
  // ───────────── Chest ─────────────
  ["Barbell Bench Press", "Chest", ["bench press", "bench", "barbell bench", "bb bench", "flat bench", "flat bench press", "flat barbell press", "chest press barbell"]],
  ["Incline Barbell Bench Press", "Chest", ["incline bench", "incline bench press", "incline barbell bench", "incline bb bench", "incline barbell press"]],
  ["Decline Barbell Bench Press", "Chest", ["decline bench", "decline bench press", "decline barbell bench", "decline barbell press"]],
  ["Dumbbell Bench Press", "Chest", ["db bench", "dumbbell bench", "dumbbell bench press", "db chest press", "dumbbell chest press", "flat dumbbell press", "flat db press"]],
  ["Incline Dumbbell Press", "Chest", ["incline db press", "incline dumbbell bench", "incline dumbbell press", "incline db bench", "incline dumbbell bench press"]],
  ["Decline Dumbbell Press", "Chest", ["decline db press", "decline dumbbell bench", "decline dumbbell bench press"]],
  ["Dumbbell Flyes", "Chest", ["db flyes", "dumbbell fly", "chest fly", "flyes", "flys", "db fly", "pec fly", "dumbbell flys", "flat fly"]],
  ["Incline Dumbbell Flyes", "Chest", ["incline fly", "incline flyes", "incline db fly", "incline dumbbell fly"]],
  ["Decline Dumbbell Flyes", "Chest", ["decline fly", "decline flyes", "decline db fly"]],
  ["Cable Crossover", "Chest", ["cable fly", "crossover", "cable chest fly", "cable cross", "cable cross over", "cable flyes"]],
  ["Low-to-High Cable Fly", "Chest", ["low cable fly", "upward cable fly", "low to high fly", "upper chest cable fly"]],
  ["High-to-Low Cable Fly", "Chest", ["high cable fly", "downward cable fly", "high to low fly", "lower chest cable fly"]],
  ["Pec Deck Machine", "Chest", ["pec deck", "pec fly machine", "machine fly", "butterfly machine", "butterfly", "pec dec", "chest fly machine"]],
  ["Push-Ups", "Chest", ["pushups", "push ups", "push-up", "pushup", "press up", "press ups", "push up"]],
  ["Hindu Push-Ups (Dand)", "Chest", ["dand", "dands", "dand exercise", "hindu pushup", "hindu push up", "hindu pushups", "pehlwani dand", "pehlwani push up", "dive bomber push up", "dive bomber", "hanuman dand", "desi pushup"]],
  ["Incline Push-Ups", "Chest", ["incline pushup", "incline push up", "incline pushups"]],
  ["Decline Push-Ups", "Chest", ["decline pushup", "decline push up", "feet elevated push up", "feet elevated pushup"]],
  ["Wide Push-Ups", "Chest", ["wide pushup", "wide push up", "wide grip push up"]],
  ["Knee Push-Ups", "Chest", ["knee pushup", "knee push up", "modified push up", "modified pushup"]],
  ["Archer Push-Ups", "Chest", ["archer pushup", "archer push up"]],
  ["Clap Push-Ups", "Chest", ["clap pushup", "clapping push up", "plyo push up", "plyometric push up", "plyo pushup"]],
  ["Spiderman Push-Ups", "Chest", ["spiderman pushup", "spider man push up", "spiderman push up"]],
  ["Dips (Chest Focus)", "Chest", ["chest dips", "dips chest", "parallel bar dips", "weighted chest dips"]],
  ["Machine Chest Press", "Chest", ["chest press machine", "machine press chest", "seated chest press", "seated chest press machine", "chest press"]],
  ["Hammer Strength Chest Press", "Chest", ["hammer chest press", "plate loaded chest press", "hammer strength press"]],
  ["Smith Machine Bench Press", "Chest", ["smith bench", "smith bench press", "smith machine chest press", "smith machine bench"]],
  ["Smith Machine Incline Press", "Chest", ["smith incline", "smith incline press", "smith incline bench"]],
  ["Landmine Press", "Chest", ["landmine chest press", "landmine press"]],
  ["Svend Press", "Chest", ["plate squeeze press", "plate press", "svend press"]],
  ["Floor Press", "Chest", ["dumbbell floor press", "barbell floor press", "db floor press"]],
  ["Dumbbell Pullover", "Chest", ["db pullover", "pullover", "dumbbell pull over", "pull over"]],
  ["Cable Chest Press", "Chest", ["standing cable press", "cable press", "cable bench press"]],
  ["Resistance Band Chest Fly", "Chest", ["band chest fly", "band fly", "resistance band fly"]],
  ["Chest Workout (General)", "Chest", ["chest", "chest day", "chest workout", "chest exercise", "chest exercises", "seena", "seene ki exercise", "seena workout"]],

  // ───────────── Back ─────────────
  ["Deadlift", "Back", ["conventional deadlift", "dl", "barbell deadlift", "deadlifts", "dead lift", "deadlift barbell"]],
  ["Sumo Deadlift", "Back", ["sumo dl", "sumo dead lift", "sumo deads"]],
  ["Trap Bar Deadlift", "Back", ["hex bar deadlift", "trap bar dl", "hex deadlift", "trap bar dead lift"]],
  ["Barbell Row", "Back", ["bent over row", "bb row", "barbell bent over row", "bent-over row", "bent over barbell row", "bent row", "barbell rows"]],
  ["Pendlay Row", "Back", ["pendlay", "pendlay rows"]],
  ["Yates Row", "Back", ["underhand barbell row", "reverse grip row", "reverse grip barbell row", "underhand row"]],
  ["Pull-Ups", "Back", ["pullups", "pull ups", "pull-up", "wide grip pullup", "wide grip pull up", "pullup", "pull up", "wide pullup"]],
  ["Chin-Ups", "Back", ["chinups", "chin ups", "chin-up", "chin up", "chinup", "underhand pull up"]],
  ["Neutral Grip Pull-Ups", "Back", ["neutral pullup", "neutral grip pullup", "hammer grip pull up"]],
  ["Assisted Pull-Ups", "Back", ["assisted pullup", "assisted pullup machine", "pullup machine", "assisted chin up"]],
  ["Lat Pulldown", "Back", ["pulldown", "lat pull down", "cable pulldown", "wide grip lat pulldown", "front lat pulldown", "lat pull", "lats pulldown", "wide grip pulldown"]],
  ["Close-Grip Lat Pulldown", "Back", ["close grip pulldown", "v bar pulldown", "neutral grip pulldown", "close grip lat pulldown"]],
  ["Reverse-Grip Lat Pulldown", "Back", ["underhand pulldown", "reverse grip pulldown", "supinated pulldown"]],
  ["Seated Cable Row", "Back", ["cable row", "seated row", "seated cable row machine", "low row", "low cable row", "cable rows", "seated rows"]],
  ["T-Bar Row", "Back", ["tbar row", "t bar row", "t-bar", "t bar"]],
  ["Chest-Supported Row", "Back", ["incline bench row", "chest supported dumbbell row", "incline dumbbell row", "chest supported row"]],
  ["Seal Row", "Back", ["seal rows", "prone barbell row"]],
  ["Single-Arm Dumbbell Row", "Back", ["db row", "one arm row", "single arm row", "dumbbell row", "one arm dumbbell row", "single arm db row", "dumbbell rows"]],
  ["Kroc Row", "Back", ["kroc rows", "heavy dumbbell row"]],
  ["Meadows Row", "Back", ["meadows rows", "landmine meadows row"]],
  ["Landmine Row", "Back", ["landmine t bar row", "landmine rows"]],
  ["Machine Row", "Back", ["row machine", "hammer strength row", "plate loaded row", "iso lateral row", "seated machine row", "machine rows"]],
  ["Inverted Row", "Back", ["body row", "australian pull up", "australian pullup", "bodyweight row", "ring row", "inverted rows"]],
  ["Renegade Row", "Back", ["renegade rows", "plank row"]],
  ["Face Pull", "Back", ["face pulls", "cable face pull", "rope face pull", "facepull"]],
  ["Straight-Arm Pulldown", "Back", ["straight arm pulldown", "rope pulldown back", "lat prayer", "straight arm pull down"]],
  ["Rack Pull", "Back", ["rack pulls", "block pull", "block pulls"]],
  ["Good Morning", "Back", ["good mornings", "gm", "barbell good morning"]],
  ["Hyperextension", "Back", ["hyperextensions", "back extension", "back extensions", "roman chair extension", "hyper extension", "roman chair back extension"]],
  ["Reverse Hyperextension", "Back", ["reverse hyper", "reverse hypers", "reverse back extension"]],
  ["Superman Hold", "Back", ["superman", "superman exercise", "back raise", "back raises", "lying back extension"]],
  ["Muscle-Up", "Back", ["muscle up", "muscle ups", "bar muscle up", "ring muscle up"]],
  ["Dead Hang", "Back", ["bar hang", "passive hang", "hang from bar", "hanging hold", "active hang"]],
  ["Scapular Pull-Ups", "Back", ["scap pull up", "scapular pullups", "scap pullups"]],
  ["Rope Climb", "Back", ["rope climbing", "climbing rope", "rope climbs", "rassa chadhna"]],
  ["Back Workout (General)", "Back", ["back", "back day", "back workout", "back exercise", "back exercises", "peeth", "pith", "peeth ki exercise"]],

  // ───────────── Shoulders ─────────────
  ["Overhead Barbell Press", "Shoulders", ["ohp", "overhead press", "military press", "barbell shoulder press", "standing press", "shoulder press", "standing barbell press", "barbell overhead press"]],
  ["Seated Barbell Shoulder Press", "Shoulders", ["seated overhead press", "seated military press", "seated barbell press"]],
  ["Behind-the-Neck Press", "Shoulders", ["behind neck press", "bnp", "behind the neck shoulder press"]],
  ["Push Press", "Shoulders", ["push presses", "barbell push press"]],
  ["Seated Dumbbell Shoulder Press", "Shoulders", ["db shoulder press", "seated db press", "dumbbell shoulder press", "seated dumbbell press", "seated db shoulder press"]],
  ["Standing Dumbbell Shoulder Press", "Shoulders", ["standing db press", "standing dumbbell press", "standing db shoulder press"]],
  ["Arnold Press", "Shoulders", ["arnold presses", "arnold dumbbell press"]],
  ["Lateral Raise", "Shoulders", ["side raise", "lateral raises", "db lateral raise", "side lateral raise", "side delt raise", "dumbbell side raise", "dumbbell lateral raise", "side raises", "lat raise"]],
  ["Front Raise", "Shoulders", ["front raises", "db front raise", "plate front raise", "dumbbell front raise", "barbell front raise"]],
  ["Rear Delt Flyes", "Shoulders", ["rear delt fly", "reverse fly", "rear delt raise", "bent over lateral raise", "bent over raise", "reverse pec deck", "rear delt machine", "rear delt flys", "reverse flyes", "rear delts"]],
  ["Cable Lateral Raise", "Shoulders", ["cable side raise", "cable lateral", "single arm cable lateral raise"]],
  ["Cable Rear Delt Fly", "Shoulders", ["cable reverse fly", "cable rear delt", "cable rear delt flyes"]],
  ["Upright Row", "Shoulders", ["upright rows", "barbell upright row", "cable upright row", "ez bar upright row"]],
  ["Shrugs", "Shoulders", ["shrug", "barbell shrug", "dumbbell shrug", "trap shrug", "traps", "trap exercise", "db shrug", "trapezius"]],
  ["Machine Shoulder Press", "Shoulders", ["shoulder press machine", "seated machine shoulder press", "hammer shoulder press"]],
  ["Smith Machine Shoulder Press", "Shoulders", ["smith shoulder press", "smith overhead press", "smith machine overhead press"]],
  ["Landmine Shoulder Press", "Shoulders", ["landmine overhead press", "landmine single arm press"]],
  ["Pike Push-Ups", "Shoulders", ["pike pushup", "pike push up", "shoulder push up", "shoulder pushup"]],
  ["Handstand Push-Ups", "Shoulders", ["hspu", "handstand pushup", "handstand push up", "wall handstand push up", "wall hspu"]],
  ["Handstand Hold", "Shoulders", ["wall handstand", "handstand", "handstand practice", "handstand walk"]],
  ["Cuban Press", "Shoulders", ["cuban rotation", "cuban presses"]],
  ["Y-Raise", "Shoulders", ["y raise", "prone y raise", "incline y raise", "y raises"]],
  ["Neck Curl", "Shoulders", ["neck flexion", "neck exercise", "neck training", "neck workout", "gardan", "gardan ki exercise", "neck harness"]],
  ["Neck Extension", "Shoulders", ["neck extensions", "neck bridge", "wrestlers bridge", "wrestler bridge"]],
  ["Shoulder Workout (General)", "Shoulders", ["shoulder", "shoulders", "shoulder day", "shoulder workout", "shoulder exercise", "shoulder exercises", "delts", "kandha", "kandhe", "kandhe ki exercise"]],

  // ───────────── Legs ─────────────
  ["Barbell Back Squat", "Legs", ["squat", "squats", "back squat", "bb squat", "barbell squat", "squat barbell", "high bar squat", "low bar squat"]],
  ["Front Squat", "Legs", ["front squats", "barbell front squat"]],
  ["Overhead Squat", "Legs", ["overhead squats", "ohs"]],
  ["Zercher Squat", "Legs", ["zercher squats", "zercher"]],
  ["Box Squat", "Legs", ["box squats", "barbell box squat"]],
  ["Pause Squat", "Legs", ["paused squat", "pause squats"]],
  ["Smith Machine Squat", "Legs", ["smith squat", "smith squats", "smith machine squats"]],
  ["Goblet Squat", "Legs", ["goblet squats", "kettlebell goblet squat", "dumbbell goblet squat"]],
  ["Hack Squat", "Legs", ["hack squat machine", "hack squats", "machine hack squat"]],
  ["Leg Press", "Legs", ["leg press machine", "45 degree leg press", "sled leg press", "leg presses", "45 leg press", "seated leg press"]],
  ["Single-Leg Press", "Legs", ["one leg press", "single leg press", "unilateral leg press"]],
  ["Romanian Deadlift", "Legs", ["rdl", "romanian deadlifts", "stiff leg deadlift", "stiff legged deadlift", "romanian dead lift", "rdls"]],
  ["Single-Leg Romanian Deadlift", "Legs", ["single leg rdl", "one leg rdl", "single leg deadlift", "single leg romanian deadlift"]],
  ["Leg Curl", "Legs", ["hamstring curl", "lying leg curl", "seated leg curl", "prone leg curl", "leg curls", "hamstring curls", "hamstring machine"]],
  ["Nordic Hamstring Curl", "Legs", ["nordic curl", "nordics", "nordic hamstring", "nordic curls"]],
  ["Leg Extension", "Legs", ["quad extension", "leg extensions", "quad extensions", "quads machine", "quad machine"]],
  ["Walking Lunges", "Legs", ["lunges", "walking lunge", "db lunges", "lunge", "dumbbell lunges", "barbell lunges", "walking lunges dumbbell"]],
  ["Reverse Lunges", "Legs", ["reverse lunge", "backward lunge", "back lunge", "backward lunges"]],
  ["Forward Lunges", "Legs", ["forward lunge", "static lunge", "static lunges", "split lunge"]],
  ["Lateral Lunges", "Legs", ["side lunge", "side lunges", "lateral lunge"]],
  ["Cossack Squat", "Legs", ["cossack squats", "cossack"]],
  ["Curtsy Lunge", "Legs", ["curtsy lunges", "curtsey lunge", "curtsy squat"]],
  ["Step-Ups", "Legs", ["step up", "step ups", "box step up", "dumbbell step up", "weighted step up"]],
  ["Bulgarian Split Squat", "Legs", ["split squat", "bulgarian squat", "bulgarian split squats", "rear foot elevated split squat", "rfess"]],
  ["Hip Thrust", "Legs", ["hip thrusts", "barbell hip thrust", "glute thrust", "hip thrust machine"]],
  ["Glute Bridge", "Legs", ["glute bridges", "bodyweight hip thrust", "bridge", "hip bridge"]],
  ["Single-Leg Glute Bridge", "Legs", ["single leg bridge", "one leg glute bridge", "single leg hip bridge"]],
  ["Cable Glute Kickback", "Legs", ["cable kickback", "glute kickback", "cable glute kickback", "cable kick back", "kickback machine"]],
  ["Donkey Kicks", "Legs", ["donkey kick", "glute kickback bodyweight", "quadruped kickback"]],
  ["Fire Hydrants", "Legs", ["fire hydrant", "hydrants"]],
  ["Hip Abduction Machine", "Legs", ["abductor", "abductor machine", "outer thigh machine", "hip abductor", "abduction machine"]],
  ["Hip Adduction Machine", "Legs", ["adductor", "adductor machine", "inner thigh machine", "hip adductor", "adduction machine"]],
  ["Standing Calf Raise", "Legs", ["calf raise", "standing calf raises", "calf raises", "calves", "calf", "calf exercise", "smith calf raise"]],
  ["Seated Calf Raise", "Legs", ["seated calf raises", "seated calf machine"]],
  ["Donkey Calf Raise", "Legs", ["donkey calf raises", "donkey calves"]],
  ["Leg Press Calf Raise", "Legs", ["calf press", "leg press calf", "leg press calves"]],
  ["Tibialis Raise", "Legs", ["tib raise", "tibialis raises", "shin raise", "toe raises"]],
  ["Box Jump", "Legs", ["box jumps", "box jumping", "plyo box jump"]],
  ["Jump Squats", "Legs", ["squat jump", "jumping squat", "squat jumps", "jump squat", "jumping squats"]],
  ["Wall Sit", "Legs", ["wall sits", "wall squat", "wall squat hold", "chair pose wall"]],
  ["Sissy Squat", "Legs", ["sissy squats", "sissy"]],
  ["Pistol Squat", "Legs", ["single leg squat", "pistol squats", "one leg squat", "pistols"]],
  ["Sumo Squat", "Legs", ["sumo squats", "plie squat", "wide stance squat", "dumbbell sumo squat"]],
  ["Bodyweight Squat", "Legs", ["air squat", "air squats", "bodyweight squats", "body weight squat", "squats bodyweight", "free squat", "free squats"]],
  ["Hindu Squat (Baithak)", "Legs", ["baithak", "baithaks", "bethak", "bethaks", "hindu squats", "hindu squat", "uthak baithak", "uthak bethak", "utho baitho", "uthak-baithak", "desi squat", "pehlwani baithak", "baithak exercise"]],
  ["Jefferson Squat", "Legs", ["jefferson deadlift", "jefferson squats"]],
  ["Sled Pull", "Legs", ["sled drag", "sled pulls", "backward sled drag", "reverse sled drag"]],
  ["Leg Workout (General)", "Legs", ["legs", "leg day", "leg workout", "leg exercise", "leg exercises", "lower body", "lower body workout", "quads", "hamstrings", "glutes", "pair ki exercise", "taang", "taang ki exercise"]],

  // ───────────── Arms ─────────────
  ["Barbell Curl", "Arms", ["bb curl", "barbell bicep curl", "bicep curl barbell", "barbell biceps curl", "straight bar curl", "barbell curls"]],
  ["EZ-Bar Curl", "Arms", ["ez bar curl", "ez curl", "ez bar bicep curl", "curl bar", "ez bar biceps curl", "ez curls", "e z bar curl"]],
  ["Dumbbell Curl", "Arms", ["db curl", "dumbbell bicep curl", "bicep curl", "biceps curl", "curls", "biceps", "bicep", "bicep exercise", "dumbbell curls", "standing dumbbell curl", "biceps curls", "bicep curls", "dumbell curl"]],
  ["Alternate Dumbbell Curl", "Arms", ["alternating dumbbell curl", "alternate curl", "alternating curl", "alternate db curl", "alternating bicep curl"]],
  ["Hammer Curl", "Arms", ["hammer curls", "db hammer curl", "dumbbell hammer curl", "neutral grip curl"]],
  ["Cross-Body Hammer Curl", "Arms", ["cross body hammer curl", "crossbody curl", "cross body curl", "pinwheel curl"]],
  ["Preacher Curl", "Arms", ["preacher curls", "scott curl", "ez bar preacher curl", "barbell preacher curl", "preacher"]],
  ["Dumbbell Preacher Curl", "Arms", ["db preacher curl", "single arm preacher curl", "one arm preacher curl"]],
  ["Cable Curl", "Arms", ["cable bicep curl", "cable biceps curl", "rope cable curl", "cable curls", "standing cable curl"]],
  ["Incline Dumbbell Curl", "Arms", ["incline curl", "incline db curl", "incline bicep curl", "incline curls"]],
  ["Concentration Curl", "Arms", ["concentration curls", "seated concentration curl"]],
  ["Spider Curl", "Arms", ["spider curls", "prone incline curl"]],
  ["Zottman Curl", "Arms", ["zottman curls", "zotman curl"]],
  ["Reverse Curl", "Arms", ["reverse barbell curl", "reverse grip curl", "reverse curls", "reverse ez bar curl"]],
  ["21s Curl", "Arms", ["21s", "twenty ones", "21 curls", "21s bicep curl", "seven seven seven curl"]],
  ["Drag Curl", "Arms", ["drag curls", "barbell drag curl"]],
  ["Bayesian Curl", "Arms", ["bayesian cable curl", "behind the body cable curl"]],
  ["Machine Bicep Curl", "Arms", ["bicep curl machine", "biceps machine", "machine curl", "machine biceps curl", "preacher machine"]],
  ["Close-Grip Bench Press", "Arms", ["close grip bench", "cgbp", "close grip bench press", "narrow grip bench press", "close grip press"]],
  ["Skull Crushers", "Arms", ["skullcrushers", "lying tricep extension", "french press", "skull crusher", "skullcrusher", "lying triceps extension", "nose breaker"]],
  ["EZ-Bar Skull Crusher", "Arms", ["ez bar skull crusher", "ez skull crusher", "ez skullcrusher", "ez bar skullcrusher"]],
  ["Tricep Pushdown", "Arms", ["pushdown", "tricep pressdown", "rope pushdown", "cable pushdown", "triceps pushdown", "triceps", "tricep", "tricep exercise", "tricep pushdowns", "v bar pushdown", "straight bar pushdown", "pressdown", "triceps pressdown"]],
  ["Reverse-Grip Pushdown", "Arms", ["reverse grip tricep pushdown", "underhand pushdown", "reverse pushdown"]],
  ["Overhead Tricep Extension", "Arms", ["overhead extension", "tricep extension overhead", "db overhead extension", "overhead triceps extension", "dumbbell overhead extension", "overhead tricep", "french press overhead"]],
  ["Cable Overhead Tricep Extension", "Arms", ["rope overhead extension", "cable overhead extension", "cable overhead triceps extension"]],
  ["Tricep Kickback", "Arms", ["kickbacks", "dumbbell kickback", "tricep kickbacks", "triceps kickback", "db kickback"]],
  ["Dips (Tricep Focus)", "Arms", ["tricep dips", "dips triceps", "dips", "dip", "triceps dips", "parallel dips", "bar dips"]],
  ["Bench Dips", "Arms", ["bench dip", "tricep bench dip", "chair dips", "chair dip", "bench tricep dips"]],
  ["Diamond Push-Ups", "Arms", ["diamond pushup", "close grip push up", "triangle push up", "diamond push up", "close grip pushup", "triangle pushup"]],
  ["JM Press", "Arms", ["jm presses", "j m press"]],
  ["Tate Press", "Arms", ["tate presses", "dumbbell tate press"]],
  ["Machine Tricep Extension", "Arms", ["tricep machine", "tricep extension machine", "seated tricep machine", "triceps machine"]],
  ["Single-Arm Cable Pushdown", "Arms", ["single arm pushdown", "one arm pushdown", "single arm tricep pushdown"]],
  ["Wrist Curl", "Arms", ["wrist curls", "forearm curl", "forearm curls", "forearm exercise", "forearms", "wrist roller"]],
  ["Reverse Wrist Curl", "Arms", ["wrist extension", "reverse wrist curls", "forearm extension"]],
  ["Plate Pinch", "Arms", ["plate pinch hold", "pinch grip", "pinch hold", "grip training", "grip strength"]],
  ["Arm Workout (General)", "Arms", ["arms", "arm day", "arm workout", "arm exercise", "arm exercises", "bhuja", "baazu", "bazu", "arms workout", "bicep tricep", "biceps triceps"]],

  // ───────────── Core ─────────────
  ["Plank", "Core", ["planks", "plank hold", "forearm plank", "front plank", "high plank", "elbow plank"]],
  ["Side Plank", "Core", ["side planks", "side plank hold", "lateral plank"]],
  ["Plank Shoulder Taps", "Core", ["shoulder taps", "plank taps", "plank shoulder tap", "shoulder tap plank"]],
  ["Plank Jacks", "Core", ["plank jack", "plank jacks exercise"]],
  ["Reverse Plank", "Core", ["reverse planks", "reverse plank hold"]],
  ["Plank to Push-Up", "Core", ["up down plank", "up-down plank", "plank up down", "plank to pushup"]],
  ["Hanging Leg Raise", "Core", ["hanging leg raises", "leg raises hanging", "hanging leg lift"]],
  ["Hanging Knee Raise", "Core", ["knee raise", "knee raises", "hanging knee raises", "hanging knee tuck"]],
  ["Toes-to-Bar", "Core", ["t2b", "toes to bar", "toe to bar", "toes 2 bar"]],
  ["Captain's Chair Leg Raise", "Core", ["captains chair", "captain chair", "vertical knee raise", "vkr", "captains chair leg raise", "power tower leg raise"]],
  ["Lying Leg Raise", "Core", ["leg raises", "leg raise", "flat leg raise", "lying leg raises", "leg raises lying", "floor leg raise"]],
  ["Flutter Kicks", "Core", ["flutter kick", "flutter", "leg flutters"]],
  ["Scissor Kicks", "Core", ["scissor kick", "scissors", "scissor", "leg scissors"]],
  ["Reverse Crunch", "Core", ["reverse crunches", "reverse crunch machine", "lower ab crunch"]],
  ["Cable Crunch", "Core", ["cable crunches", "kneeling cable crunch", "rope crunch", "cable rope crunch", "kneeling crunch"]],
  ["Crunches", "Core", ["crunch", "ab crunch", "floor crunch", "abs crunches", "abs crunch", "basic crunch", "crunches exercise"]],
  ["Sit-Ups", "Core", ["situps", "sit ups", "sit-up", "situp", "sit up", "bodyweight sit up"]],
  ["Decline Sit-Ups", "Core", ["decline situps", "decline sit ups", "decline bench sit up", "decline bench crunch"]],
  ["V-Ups", "Core", ["v up", "v ups", "v sit up", "v-up", "jackknife", "jack knife", "jackknife sit up"]],
  ["Ab Crunch Machine", "Core", ["ab machine", "machine crunch", "ab crunch machine", "seated ab crunch", "abs machine"]],
  ["Russian Twist", "Core", ["russian twists", "seated twist", "weighted russian twist", "russian twist dumbbell"]],
  ["Ab Wheel Rollout", "Core", ["ab rollout", "ab wheel", "wheel rollout", "ab roller", "ab wheel roll out", "ab roll out", "rollout"]],
  ["Bicycle Crunch", "Core", ["bicycle crunches", "bicycle", "cycle crunch", "bicycle abs", "bicycle kicks"]],
  ["Oblique Crunch", "Core", ["oblique crunches", "side crunch", "side crunches", "oblique twist", "obliques"]],
  ["Side Bend", "Core", ["dumbbell side bend", "oblique side bend", "side bends", "side bend dumbbell", "standing side bend"]],
  ["Woodchopper", "Core", ["wood chopper", "cable woodchopper", "woodchoppers", "cable wood chop", "wood chop", "woodchop"]],
  ["Pallof Press", "Core", ["pallof", "anti rotation press", "pallof presses", "cable pallof press"]],
  ["Dead Bug", "Core", ["dead bugs", "deadbug"]],
  ["Bird Dog", "Core", ["bird dogs", "birddog", "quadruped opposite arm leg"]],
  ["Hollow Body Hold", "Core", ["hollow hold", "hollow body", "hollow rock", "hollow body rock"]],
  ["Dragon Flag", "Core", ["dragon flags", "bruce lee flag"]],
  ["L-Sit", "Core", ["l sit", "l sit hold", "l-sit hold", "lsit"]],
  ["Heel Touches", "Core", ["heel touch", "alternate heel touch", "alternate heel touches", "heel taps", "heel tap"]],
  ["Toe Touches", "Core", ["toe touch", "toe touch crunch", "toe touches crunch", "reach up toe touch"]],
  ["Windshield Wipers", "Core", ["windshield wiper", "wipers", "lying windshield wipers", "hanging windshield wipers"]],
  ["Stomach Vacuum", "Core", ["vacuum", "abdominal vacuum", "vacuum pose", "stomach vaccum"]],
  ["Nauli Kriya", "Core", ["nauli", "nauli kriya", "abdominal churning", "agnisar", "agnisar kriya", "uddiyana bandha", "uddiyan bandha"]],
  ["Medicine Ball Slams", "Core", ["ball slams", "med ball slam", "slam ball", "medicine ball slam", "slam ball slams", "wall slams"]],
  ["Abs Workout (General)", "Core", ["abs", "core", "abs workout", "core workout", "abs day", "ab workout", "abdominal", "abdominals", "six pack", "pet", "pet ki exercise", "pet ki exercises", "stomach exercise", "belly fat exercise"]],

  // ───────────── Cardio ─────────────
  ["Running", "Cardio", ["run", "jog", "jogging", "outdoor run", "road running", "road run", "daud", "dauda", "daudna", "morning run", "morning jog", "ground run", "ground running", "running outdoor", "long run", "easy run"]],
  ["Treadmill Run", "Cardio", ["treadmill", "treadmill running", "tm run", "treadmill jogging", "run on treadmill", "treadmill sprint", "treadmill intervals"]],
  ["Sprints", "Cardio", ["sprint", "sprinting", "sprint intervals", "sprint drills", "100m sprint", "200m sprint", "400m sprint", "dash", "shuttle run", "shuttle runs"]],
  ["Hill Sprints", "Cardio", ["hill run", "hill running", "hill sprint", "hill repeats", "uphill run", "uphill sprint"]],
  ["Walking", "Cardio", ["walk", "brisk walk", "brisk walking", "morning walk", "evening walk", "power walk", "power walking", "walking outdoor", "walking outside", "night walk", "chalna", "pedal walk", "walk karna", "fast walk", "fast walking"]],
  ["Incline Treadmill Walk", "Cardio", ["incline walk", "treadmill walk", "incline walking", "incline treadmill", "12 3 30", "12-3-30", "treadmill incline walk", "treadmill walking"]],
  ["Stationary Bike", "Cardio", ["cycling", "cycle", "spin bike", "exercise bike", "stationary cycle", "bike", "indoor cycling", "upright bike", "recumbent bike"]],
  ["Outdoor Cycling", "Cardio", ["cycling outdoor", "cycle chalana", "bike ride", "bicycle", "cycle ride", "road cycling", "outdoor cycle", "outdoor bike", "bicycling", "cycle chalana", "mountain biking", "mtb"]],
  ["Spin Class", "Cardio", ["spinning", "spin", "spin session", "spinning class", "indoor spin"]],
  ["Assault Bike", "Cardio", ["air bike", "airdyne", "assault bike", "fan bike", "echo bike", "air cycle", "assault air bike"]],
  ["Rowing Machine", "Cardio", ["rowing", "row machine", "erg", "concept 2", "concept2", "rower", "rowing erg", "indoor rowing", "c2 rower"]],
  ["Ski Erg", "Cardio", ["skierg", "ski erg machine", "ski machine"]],
  ["Jump Rope", "Cardio", ["skipping", "rope skipping", "skipping rope", "rassi kood", "rassi kudna", "rassi kudna exercise", "rassi", "jumping rope", "skip rope", "double unders", "double under", "rope jump"]],
  ["Jumping Jacks", "Cardio", ["jumping jack", "star jump", "star jumps", "jumping jacks exercise", "jack jumps"]],
  ["Stair Climber", "Cardio", ["stairmaster", "stair master", "stepper", "stair climbing", "stair machine", "step mill", "stepmill", "stair climb"]],
  ["Stair Running", "Cardio", ["stairs", "stair run", "stairs running", "climbing stairs", "stair repeats", "seedhiyan", "seedhi chadhna", "stadium stairs", "taking stairs"]],
  ["Elliptical Trainer", "Cardio", ["elliptical", "cross trainer", "cross-trainer", "elliptical machine", "elliptical cardio"]],
  ["Battle Ropes", "Cardio", ["battle rope", "rope slams", "battle rope waves", "rope waves", "battle rope slams", "power ropes"]],
  ["Sled Push", "Cardio", ["sled pushes", "prowler push", "prowler", "sled pushing", "prowler pushes"]],
  ["Burpees", "Cardio", ["burpee", "burpees exercise", "burpy", "burpie", "burpees box jump", "chest to floor burpee"]],
  ["High Knees", "Cardio", ["high knee", "high knees run", "running high knees", "knee drives", "high knee run"]],
  ["Butt Kicks", "Cardio", ["butt kick", "butt kickers", "heel kicks", "butt kick run", "glute kicks"]],
  ["Mountain Climbers", "Cardio", ["mountain climber", "mountain climbing", "mountain climb", "mountain climbers exercise", "mountain climbing exercise", "climbers", "plank climbers", "running plank", "plank runners", "mountain climbs", "mountain climber cardio"]],
  ["Skater Jumps", "Cardio", ["skaters", "speed skaters", "skater hops", "skater jump", "lateral skater", "skater exercise", "speed skater"]],
  ["Lateral Shuffle", "Cardio", ["side shuffle", "lateral shuffles", "side shuffles", "defensive shuffle", "shuffle"]],
  ["Ladder Drills", "Cardio", ["agility ladder", "speed ladder", "ladder drill", "agility drills", "cone drills", "agility training", "footwork drills"]],
  ["Bear Crawl", "Cardio", ["bear crawls", "bear walk", "crawling", "animal flow", "crab walk", "crab crawl"]],
  ["Squat Thrusts", "Cardio", ["squat thrust", "half burpee", "thrusters bodyweight"]],
  ["Shadow Boxing", "Cardio", ["shadow box", "shadowboxing", "shadow boxing rounds", "boxing shadow"]],
  ["Heavy Bag Work", "Cardio", ["punching bag", "boxing bag", "bag work", "boxing", "heavy bag", "bag rounds", "boxing rounds", "punch bag", "focus mitts", "mitt work", "pad work"]],
  ["Kickboxing", "Cardio", ["kick boxing", "muay thai", "kickboxing class", "kick boxing bag", "cardio kickboxing", "taekwondo", "karate"]],
  ["Swimming", "Cardio", ["swim", "laps", "swimming laps", "tairaki", "tairna", "pool", "pool workout", "swimming pool", "freestyle swim", "swim laps"]],
  ["Zumba", "Cardio", ["zumba class", "dance cardio", "dance workout", "aerobics", "aerobic", "aerobic dance", "dancing", "dance", "bhangra", "bollywood dance", "bollywood workout", "dance fitness", "step aerobics"]],
  ["HIIT", "Cardio", ["hiit workout", "tabata", "circuit training", "interval training", "hiit cardio", "high intensity interval", "high intensity", "circuit", "amrap", "emom", "metcon", "crossfit wod", "wod", "cardio circuit"]],
  ["Football", "Cardio", ["soccer", "football match", "playing football", "futsal", "football practice"]],
  ["Badminton", "Cardio", ["shuttle", "badminton match", "playing badminton", "shuttlecock"]],
  ["Cricket", "Cardio", ["playing cricket", "cricket match", "cricket practice", "net practice", "bowling practice", "batting practice"]],
  ["Basketball", "Cardio", ["basketball match", "playing basketball", "hoops"]],
  ["Kabaddi", "Cardio", ["kabbadi", "kabaddi practice", "kho kho", "kho-kho", "kabaddi match", "playing kabaddi"]],
  ["Tennis", "Cardio", ["table tennis", "tt", "squash", "tennis match", "padel", "pickleball"]],
  ["Cardio (General)", "Cardio", ["cardio", "cardio session", "cardio workout", "cardio exercise", "cardio day", "cardio machine", "warm up cardio", "cardio karna", "fat burn", "fat burning", "fat loss cardio", "endurance", "conditioning"]],

  // ───────────── Full Body / Olympic / Desi ─────────────
  ["Clean and Jerk", "Full Body", ["clean & jerk", "clean and jerks", "c&j", "clean n jerk", "clean jerk"]],
  ["Snatch", "Full Body", ["snatches", "barbell snatch", "power snatch", "hang snatch", "squat snatch"]],
  ["Power Clean", "Full Body", ["power cleans", "clean", "cleans", "barbell clean", "hang clean", "hang power clean", "hang cleans"]],
  ["Clean and Press", "Full Body", ["clean & press", "clean n press", "clean and press barbell"]],
  ["Kettlebell Swing", "Full Body", ["kb swing", "kettlebell swings", "russian kettlebell swing", "american kettlebell swing", "kettlebell", "kettle bell swing", "kb swings", "girya swing"]],
  ["Kettlebell Snatch", "Full Body", ["kb snatch", "kettlebell snatches", "kettle bell snatch"]],
  ["Kettlebell Clean and Press", "Full Body", ["kb clean and press", "kb clean press", "kettlebell clean press", "kettlebell press", "kettlebell clean"]],
  ["Thruster", "Full Body", ["thrusters", "barbell thruster", "dumbbell thruster", "db thruster"]],
  ["Man Makers", "Full Body", ["man maker", "manmakers", "manmaker", "man makers dumbbell"]],
  ["Devil Press", "Full Body", ["devils press", "devil press dumbbell", "devil presses"]],
  ["Dumbbell Snatch", "Full Body", ["db snatch", "one arm dumbbell snatch", "single arm dumbbell snatch", "dumbbell snatches"]],
  ["Farmer's Carry", "Full Body", ["farmers carry", "farmer carry", "farmers walk", "farmer walk", "farmer's walk", "farmers carries", "loaded carry", "carries"]],
  ["Suitcase Carry", "Full Body", ["one arm farmer carry", "suitcase carries", "single arm carry", "unilateral carry"]],
  ["Turkish Get-Up", "Full Body", ["turkish getup", "tgu", "turkish get up", "turkish getups", "kettlebell getup"]],
  ["Wall Ball", "Full Body", ["wall balls", "wall ball shots", "wallball", "wall ball shot"]],
  ["Medicine Ball Throw", "Full Body", ["med ball throw", "medicine ball throws", "ball throws", "chest pass med ball", "overhead med ball throw"]],
  ["Sandbag Carry", "Full Body", ["sandbag", "sandbag clean", "sandbag training", "sandbag carries", "sand bag", "sandbag lift", "bora uthana"]],
  ["Tire Flip", "Full Body", ["tyre flip", "tire flips", "tyre flips", "tire", "tyre", "tire flipping"]],
  ["Sledgehammer Slam", "Full Body", ["sledgehammer", "hammer slam", "tire hit", "tyre hit", "sledge hammer", "hammer swing", "sledgehammer tire"]],
  ["Surya Namaskar", "Full Body", ["suryanamaskar", "surya namaskar", "sun salutation", "sun salutations", "suraj namaskar", "surya namaskara", "namaskar", "suryanamaskara", "sooryanamaskar"]],
  ["Yoga", "Full Body", ["yog", "asana", "asanas", "yoga session", "hatha yoga", "power yoga", "vinyasa", "vinyasa yoga", "yoga class", "ashtanga", "yoga practice", "pranayam", "pranayama", "yogasana"]],
  ["Stretching", "Full Body", ["stretch", "stretches", "warm up", "warmup", "cool down", "cooldown", "mobility", "flexibility", "mobility work", "foam rolling", "foam roller", "dynamic stretching", "static stretching", "warm-up", "cool-down"]],
  ["Gada Swing (Mace)", "Full Body", ["gada", "gada swing", "gada training", "steel mace", "mace swing", "mace 360", "360 mace", "macebell", "mace bell", "gada exercise", "gadha", "gada 360", "gada swings", "mace"]],
  ["Mudgar Swing (Indian Club)", "Full Body", ["mudgar", "mugdar", "mudgar swing", "indian club", "indian clubs", "club swing", "club swings", "jori", "joris", "jori swing", "meel", "meels", "mudgar exercise", "indian club swing"]],
  ["Nal Lift (Indian Stone Lock)", "Full Body", ["nal", "nal lifting", "stone lifting", "indian stone lift", "atlas stone", "stone lift", "nal exercise", "stone lock", "gar nal", "garnal", "neck ring", "gar nal exercise", "stone ring"]],
  ["Malkhamb", "Full Body", ["mallakhamb", "malkhamb", "mallkhamb", "pole gymnastics", "mallakhamba", "malakhamb", "rope malkhamb"]],
  ["Kushti (Wrestling)", "Full Body", ["kushti", "pehlwani", "wrestling", "akhada", "akhara", "pehlwan training", "grappling", "bjj", "brazilian jiu jitsu", "jiu jitsu", "judo", "mma", "martial arts", "pehalwani", "kusti", "dangal", "wrestling practice"]],
  ["Calisthenics", "Full Body", ["calisthenic", "bodyweight workout", "bodyweight training", "street workout", "body weight workout", "callisthenics", "bodyweight exercise", "bodyweight circuit", "body weight training"]],
  ["Full Body Workout (General)", "Full Body", ["full body", "full body workout", "total body", "total body workout", "full body day", "whole body workout", "poore sharir ki exercise", "full body exercise"]],
];

export const EXERCISE_LIBRARY: ExerciseEntry[] = ROWS.map(([name, category, aliases]) => ({ name, category, aliases }));

// ── Matching ─────────────────────────────────────────────────────────────

// Lowercases and collapses everything that isn't a letter/digit into a single
// space, so "Pull-Ups", "pull ups", "PULLUPS" spacing/punctuation variants and
// "Farmer's Carry" / "farmers carry" all compare equal.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Words that carry no exercise meaning and only get in the way of matching
// ("mountain climbing exercise", "chest workout"). Stripped only as a
// fallback second attempt, never from the original query.
const FILLER_WORDS = new Set(["exercise", "exercises", "workout", "workouts", "training", "the", "a", "my", "some"]);

function stripFiller(normalized: string): string {
  return normalized
    .split(" ")
    .filter((w) => !FILLER_WORDS.has(w))
    .join(" ");
}

type IndexedExercise = {
  entry: ExerciseEntry;
  name: string;
  terms: string[]; // normalized name + aliases
};

const INDEX: IndexedExercise[] = EXERCISE_LIBRARY.map((entry) => ({
  entry,
  name: normalize(entry.name),
  terms: [normalize(entry.name), ...(entry.aliases ?? []).map(normalize)],
}));

// Fuse.js is the typo-tolerant candidate finder: it ranks every exercise by
// how close its name/aliases are to what was typed. Its own threshold is set
// deliberately loose — Fuse alone is too forgiving to trust ("sleep" → "sled",
// "test" → "Tate Press"), so every candidate must also pass typoVerified()
// below before it counts as a match. ignoreLocation because a match can
// legitimately be anywhere in a name or alias.
const fuse = new Fuse(INDEX, {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.45,
  minMatchCharLength: 3,
  // terms already includes the exercise name, so it is the only key — indexing
  // the name twice just doubled the work of every typo search.
  keys: ["terms"],
});

// Optimal-string-alignment edit distance: insert / delete / substitute /
// swap-two-adjacent-letters each cost 1. The swap matters — "sqauts",
// "bnech" and "planck" are the typos people actually make, and plain
// Levenshtein would count each as two errors.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => [i, ...new Array<number>(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
}

// How many typos a query of this many letters may contain. Scales with length
// so short words must be exact (a one-letter slip in "test" or "gym" is far
// more likely a different word than a typo) while long names forgive a couple.
function typoBudget(letterCount: number): number {
  if (letterCount <= 4) return 0;
  if (letterCount <= 8) return 1;
  if (letterCount <= 14) return 2;
  return 3;
}

// Accepts a Fuse candidate only if some name/alias of it is within the typo
// budget of the query, either as one run-together string ("legpress" vs
// "leg press") or word by word, where each typed word may also be just the
// start of a longer word ("climbin" → "climbing", "pres" → "press"). The
// first letter must match: people slip mid-word, rarely on the first letter,
// and requiring it stops real words matching unrelated ones ("dinner" is not a
// typo of "inner thigh machine").
function typoVerified(item: IndexedExercise, q: string): boolean {
  const qWords = q.split(" ");
  const budget = typoBudget(q.replace(/ /g, "").length);
  const qJoined = qWords.join("");

  for (const term of item.terms) {
    const termJoined = term.replace(/ /g, "");
    if (qJoined[0] === termJoined[0] && editDistance(qJoined, termJoined) <= budget) return true;

    const termWords = term.split(" ");
    let total = 0;
    for (const qw of qWords) {
      let bestWord = Infinity;
      for (const tw of termWords) {
        const cost = qw[0] !== tw[0] ? Infinity : qw.length >= 3 && tw.startsWith(qw) ? 0 : editDistance(qw, tw);
        if (cost < bestWord) bestWord = cost;
      }
      total += bestWord;
      if (total > budget) break;
    }
    if (total <= budget) return true;
  }
  return false;
}

type Ranked = { entry: ExerciseEntry; rank: number; sub: number };

// Deterministic tiers, tried before any fuzzy matching:
//   0  exact name/alias
//   1  a name/alias starts with the query (typing "incline be…")
//   2  a name/alias contains the query as whole words
//   3  the query contains a whole-word name/alias ("incline bench press with dumbbells")
//   4  a word in a name/alias starts with the query (typing "climb" → "mountain climbers").
//      Deliberately word-start only, not any substring: "rest" (rest day) must
//      not match "wrestling", "tea" must not match "steam"
function rankTiers(q: string): Ranked[] {
  const padded = ` ${q} `;
  const out: Ranked[] = [];
  for (const item of INDEX) {
    let best = -1;
    for (const term of item.terms) {
      let rank = -1;
      if (term === q) rank = 0;
      else if (term.startsWith(q)) rank = 1;
      else if (` ${term} `.includes(padded)) rank = 2;
      else if (term.length >= 3 && padded.includes(` ${term} `)) rank = 3;
      else if (q.length >= 4 && ` ${term}`.includes(` ${q}`)) rank = 4;
      if (rank !== -1 && (best === -1 || rank < best)) best = rank;
    }
    if (best !== -1) out.push({ entry: item.entry, rank: best, sub: item.name.length });
  }
  return out.sort((a, b) => a.rank - b.rank || a.sub - b.sub);
}

function fuzzy(q: string, limit: number): { entry: ExerciseEntry }[] {
  // Under 5 letters the typo budget is 0, so there is nothing fuzzy to find —
  // those only ever match by the exact tiers above.
  if (q.replace(/ /g, "").length < 5) return [];
  return fuse
    .search(q, { limit: 12 })
    .filter((r) => typoVerified(r.item, q))
    .slice(0, limit)
    .map((r) => ({ entry: r.item.entry }));
}

export function searchExercises(query: string, limit = 8): { name: string; category: ExerciseCategory }[] {
  const raw = normalize(query);
  if (!raw) return [];

  const seen = new Set<string>();
  const results: ExerciseEntry[] = [];
  function add(entry: ExerciseEntry) {
    if (seen.has(entry.name) || results.length >= limit) return;
    seen.add(entry.name);
    results.push(entry);
  }

  for (const attempt of new Set([raw, stripFiller(raw)])) {
    if (!attempt) continue;
    for (const r of rankTiers(attempt)) add(r.entry);
    // Fuzzy is only the typo rescue: it runs when the exact tiers found
    // nothing, so it never adds noise next to real matches ("dand" should
    // not also suggest "Sandbag Carry").
    if (results.length === 0) for (const r of fuzzy(attempt, limit)) add(r.entry);
    if (results.length > 0) break;
  }

  return results.map(({ name, category }) => ({ name, category }));
}

// Resolves any free-text exercise name (whatever a member actually typed
// into WorkoutLogForm.tsx) to a muscle-group category for XP purposes.
// Deterministic tiers first, then Fuse.js so a typo ("mountian climbin",
// "dumbell pres") still counts instead of silently earning nothing. Returns
// null only when nothing is a confident match (a genuinely unknown or custom
// exercise), which callers treat as "don't award XP for this entry" rather
// than guessing wrong.
export function matchExerciseCategory(query: string): ExerciseCategory | null {
  const raw = normalize(query);
  if (!raw) return null;

  for (const attempt of new Set([raw, stripFiller(raw)])) {
    if (!attempt) continue;

    const ranked = rankTiers(attempt);
    if (ranked.length > 0) {
      const bestRank = ranked[0].rank;
      const atBest = ranked.filter((r) => r.rank === bestRank);
      // Exact / prefix / whole-word hits are trusted as-is. Only the loose
      // plain-substring tier can be ambiguous ("press" is Chest AND Shoulders
      // AND Legs) — there, go with the category most of the hits agree on.
      if (bestRank < 4) return atBest[0].entry.category;
      const votes = new Map<ExerciseCategory, number>();
      for (const r of atBest) votes.set(r.entry.category, (votes.get(r.entry.category) ?? 0) + 1);
      return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    const fuzzyHit = fuzzy(attempt, 3)[0];
    if (fuzzyHit) return fuzzyHit.entry.category;
  }
  return null;
}
