/* Manual gaps bank: 60 hand-written passages for PIN-free offline play.
   Full passages (~100+ words each) with titles. Every sentence is
   gap-capable (content words length 4+, no mid-sentence proper nouns),
   enforced by scripts/verify-gaps.cjs — fix sentences there, never weaken
   the check. Single mode samples random sentences bank-wide; passage mode
   plays one random passage. */

export const GAPS_BANK = [
  {
    title: "Morning Coffee",
    text: "The alarm rings before the sun comes up. She shuffles to the kitchen in worn slippers and fills the kettle with cold water. While it heats, she grinds dark beans until the whole room smells rich and warm. She pours slow circles over the grounds and watches the steam curl upward. The first sip always tastes better than she expects. By the second cup the house feels awake and the day seems manageable.",
  },
  {
    title: "Rainy Commute",
    text: "Rain hammered the bus windows all the way downtown. He pressed his forehead against the cold glass and watched the streets turn silver. Traffic crawled past flooded curbs and blinking signals. A woman shared her umbrella at the crowded stop without a word. He arrived soaked through his socks but weirdly cheerful. Some mornings the city feels almost kind.",
  },
  {
    title: "City Park",
    text: "The old park wakes slowly on Sunday mornings. Joggers circle the pond while pigeons scatter across the damp grass. A vendor opens his cart and the smell of roasted nuts drifts everywhere. Children chase each other screaming between the tall oaks. An old man feeds ducks from a bench he has claimed for years. Nobody hurries anywhere before noon.",
  },
  {
    title: "Corner Bakery",
    text: "Flour dust hangs in the warm morning air. The baker slides long loaves into the glowing oven with steady hands. Customers line up before the doors even open. The bell above the entrance rings every few minutes. Nobody leaves without something wrapped in brown paper. The day-old shelf empties first, always.",
  },
  {
    title: "Quiet Library",
    text: "Dust floats in the tall shafts of afternoon light. She runs her finger along the cracked spines until one title stops her cold. The chair by the window creaks when she settles into it. Pages turn softly all around her like dry leaves. Hours pass before she notices the closing bell. She checks out three books she may never finish.",
  },
  {
    title: "Beach Walk",
    text: "Cold foam curls around her bare ankles. She collects smooth shells in a dented tin pail. Gulls argue loudly over a dropped crust of bread. A dog sprints past chasing nothing with total commitment. The sun drops lower and paints everything gold. She stays until the light goes thin and blue.",
  },
  {
    title: "Night Market",
    text: "Lanterns sway above the crowded narrow lanes. Steam rises from sizzling pans while vendors call out prices. She tastes sweet cakes she cannot name. Her bag grows heavy long before her wallet feels light. A musician plays the same three songs on a battered guitar. She leaves when the lanterns start going dark.",
  },
  {
    title: "Mountain Trail",
    text: "Pine needles cushion every step of the climbing path. The air grows thinner as the slope turns steeper. Sweat stings their eyes despite the cold wind. At the ridge the whole valley opens below them. They sit in silence until their legs stop shaking. The way down always feels shorter than the way up.",
  },
  {
    title: "Science Fair",
    text: "The gym buzzes with nervous excited chatter. Her volcano model trembles every time someone bumps the table. Judges pause, nod politely, and scribble quick notes. She answers each question better than she rehearsed. The robot demo next door steals half her audience. She wins second place and pretends it was the goal.",
  },
  {
    title: "Grandparents Visit",
    text: "The porch swing creaks under their combined weight. He tells the same fishing story with fresh pride every time. Warm pie cools untouched on the wooden railing. Crickets tune up as the sky turns purple. Nobody checks the time until the streetlights flicker on. Goodbyes take almost as long as the visit.",
  },
  {
    title: "Power Outage",
    text: "The lights died halfway through dinner without warning. They lit thick candles and ate by their jumping glow. Shadows stretched tall across the kitchen walls. The fridge hummed back to silence. The quiet felt strange at first, then oddly peaceful. When power returned, nobody moved to turn the lamps on.",
  },
  {
    title: "Community Garden",
    text: "Tomato vines climb crooked sticks behind the rusted fence. Neighbors trade seedlings across the narrow dirt paths. The soil smells dark and rich after morning rain. Bees work the squash blossoms from dawn until dusk. Every plot tells a different story about patience. The gate never locks, only sticks.",
  },
  {
    title: "Train Ride",
    text: "Fields blur past the rattling window in green waves. She unwraps a sandwich and watches small towns drift by. A child kicks the seat in a sleepy rhythm. The conductor calls stops nobody seems to hear. Rain starts streaking the glass halfway through. She arrives rested without quite sleeping.",
  },
  {
    title: "Grocery Run",
    text: "The list says milk, eggs, bread, and nothing else. He drifts past bright displays he never planned to see. The cart fills with small bright promises. A toddler wails somewhere near the cereal aisle. Checkout always costs more than simple math allows. The bags barely fit the trunk.",
  },
  {
    title: "Autumn Leaves",
    text: "Red leaves spiral down onto the empty sidewalk. She kicks through crunchy drifts just to hear them crackle. The air smells sharp like apples and smoke. Squirrels race along the fence with urgent purpose. Lawns disappear under gold and rust. Winter waits politely around the corner.",
  },
  {
    title: "Snow Morning",
    text: "Snow buried the fence posts overnight without a sound. Footprints from some early animal crossed the clean yard. He breathed steam and stamped warmth back into his toes. Branches bent low under heavy white weight. The whole street glittered under pale light. Shoveling could wait one more coffee.",
  },
  {
    title: "Spring Cleaning",
    text: "She dragged every box from the dusty closet floor. Forgotten letters surfaced under folded winter coats. Some things went straight into black bags. Dust rose in clouds and settled everywhere again. Donations piled by the door for weeks. The room felt larger by dinner time.",
  },
  {
    title: "Office Lunch",
    text: "The break room hums with tired midday chatter. He microwaves leftovers that smell better than they look. Colleagues trade weekend stories across sticky tables. The clock above the door moves slower than physics allows. Someone always burns popcorn around two. He eats at his desk to escape the noise.",
  },
  {
    title: "Gym Session",
    text: "Iron plates clang against the rubber floor. She counts breaths between burning sets of ten. Sweat stings her eyes near the final rep. The music pounds a little too loud for thinking. Cold water from the fountain tastes metallic and perfect. The cold shower afterward feels like a small reward.",
  },
  {
    title: "Dog Walk",
    text: "The leash jerks hard toward every interesting smell. He follows the eager nose around familiar blocks. Squirrels mock them safely from low branches. Mud finds the clean socks within minutes. Home feels farther than the outward mile suggested. The dog sleeps before dinner is served.",
  },
  {
    title: "Cat Nap",
    text: "Sunlight pools warm across the worn rug. The cat kneads the blanket with slow sleepy paws. Her breathing deepens into soft tiny snores. Dust drifts lazily through the bright beam. Nobody dares move until she wakes herself. Even the phone stays mercifully silent.",
  },
  {
    title: "Bird Watching",
    text: "Dawn fog hangs low over the still marsh. A heron stands frozen like a gray statue. Binoculars fog each time he breathes too fast. Reeds shiver though no wind blows. The first call echoes before any bird appears. He lowers the glasses with stiff cold fingers.",
  },
  {
    title: "River Fishing",
    text: "Mist curls off the slow green water. His line arcs out and lands with a soft plop. Dragonflies stitch patterns above the still pools. Hours slide past between gentle tugs. The one that got away grows bigger every retelling. He keeps the smallest one and releases the rest.",
  },
  {
    title: "Desert Sunset",
    text: "Heat shimmers off the cracked red earth. Long shadows stretch from scattered dry bushes. Lizards dart between stones seeking cooler shade. The sun sinks fast and sets the clouds burning. Night air arrives cool and sudden. Stars crowd a sky with no city glow.",
  },
  {
    title: "Farm Visit",
    text: "Roosters shouted long before the alarm had a chance. Goats crowded the fence for morning grain. The barn smelled of hay, dust, and warm milk. Hens complained loudly about nothing in particular. Breakfast tasted better earned than bought. Mud caked every boot by noon.",
  },
  {
    title: "Orchard Harvest",
    text: "Ladders lean against heavy bending branches. Apples thump softly into canvas picking bags. Bees work the fallen fruit without bothering anyone. The truck bed fills faster than legs tire. Cider presses run sweet and sticky all afternoon. Stems stain every fingertip brown.",
  },
  {
    title: "Lighthouse",
    text: "Waves smash white against the black rocks below. The lamp turns slowly through thickening fog. Gulls ride the wind past the high gallery. Paint peels from the iron door in salty curls. Keepers once logged every ship by hand. The stairs wind tighter near the top.",
  },
  {
    title: "Island Ferry",
    text: "The deck vibrates under worn rubber shoes. Salt spray sticks to lips and eyelashes alike. The island grows from a smudge into green hills. Cars wait in neat lines to drive ashore. Children press noses against salt-streaked windows. The crossing takes exactly one good nap.",
  },
  {
    title: "Small Town",
    text: "One main street holds every shop that matters. The diner serves pie that locals defend fiercely. Friday games fill the bleachers with familiar faces. News travels faster than the morning paper. The water tower watches over everything patiently. Strangers get waved at twice.",
  },
  {
    title: "Big City",
    text: "Taxis honk in five overlapping rhythms below. Steam curls from vents between hurrying crowds. Neon signs buzz awake as daylight fades. Street carts send up smoke that smells like dinner. Nobody walks slowly without a good reason. The city never fully sleeps, only blinks.",
  },
  {
    title: "Museum Day",
    text: "Marble halls swallow footsteps whole. She stands before huge canvases until her neck aches. Each room smells faintly of old wood and polish. Guards nod from corners they never leave. The gift shop always wins in the end. Her feet complain all the way home.",
  },
  {
    title: "Concert Night",
    text: "Bass thumps through the floor into tired legs. Lights sweep across a sea of raised hands. The singer holds one long note past reason. Confetti sticks to sweaty foreheads everywhere. Ears ring happily all the way home. Setlists litter the sticky floor.",
  },
  {
    title: "Theater Play",
    text: "The curtain rises on a dim empty kitchen. Actors speak softly enough to lean toward. Gasps ripple through the dark rows twice. A phone rings once, earning a hundred glares. Applause starts before the lights return. Programs rustle during every quiet scene.",
  },
  {
    title: "Book Club",
    text: "Wine glasses sweat rings onto the low table. Everyone finished except one honest member. Debate over the ending runs past midnight. The host refills bowls nobody touches. Next month's pick already causes trouble. Someone always spoils one chapter early. The host already picked a longer book for spring.",
  },
  {
    title: "Cooking Class",
    text: "Onions hiss as they hit the hot oil. The teacher corrects grips with patient firm hands. Flour coats every surface within an hour. Knives flash in practiced arcs. Everyone eats standing up at the end. Recipes go home stained and splendid.",
  },
  {
    title: "Picnic",
    text: "Ants discover the blanket within ten minutes. Sandwiches taste better eaten on grass. Clouds take their time crossing the blue sky. A frisbee lands in the potato salad twice. Someone always forgets the bottle opener. The walk back feels longer and happier.",
  },
  {
    title: "Camping Trip",
    text: "Tent poles tangled into hopeless knots at first. Fire smoke curled straight into every face. Sparks rose to join the early stars. Marshmallows burned black on every side. Stars crowded the black sky after midnight. Morning coffee never tasted so earned.",
  },
  {
    title: "Stargazing",
    text: "The field fell dark enough to see the band of the galaxy. Satellites crawled steady between bright stars. Necks ached deliciously from looking straight up. Someone named constellations with total confidence. Nobody wanted to be first inside. Dew soaked every blanket by midnight.",
  },
  {
    title: "Bicycle Repair",
    text: "Grease worked deep under his fingernails within minutes. The chain slipped back on with a satisfying click. He spun the wheel and watched it run true. Brakes squealed once, then went quiet. The test ride felt faster than before. His hands stayed black through dinner.",
  },
  {
    title: "Swimming Pool",
    text: "Chlorine stings the eyes on the first dive. Lanes fill with steady splashing regulars. The lifeguard whistle cuts through echoing noise. Towels steam faintly on hot concrete. Kids cannonball where signs forbid it. Goggles fog at the worst moments. Lap swimmers claim the early lanes without discussion.",
  },
  {
    title: "Tennis Match",
    text: "New balls bounce higher than expected off the hard court. Rallies stretch long under bright noon sun. The tiebreak turns on one brave second serve. Sweat darkens shirts into strange maps. Handshakes at the net feel genuinely warm. Losers blame the wind first.",
  },
  {
    title: "Soccer Practice",
    text: "Cones dot the damp evening grass in crooked rows. Cleats tear little divots with every sprint. The coach shouts encouragement through cupped hands. Water breaks taste like small victories. Scrimmage teams get picked unfairly fast. Everyone sprints harder near the end.",
  },
  {
    title: "Basketball Court",
    text: "Sneakers squeak sharp against the polished wood. The ball spins off the rim twice before dropping. Pickup games ignore fouls everyone clearly saw. Winners stay on until somebody beats them. Losers sit out one game only. The lights buzz out at ten sharp.",
  },
  {
    title: "Yoga Class",
    text: "Mats unroll in neat silent rows. Breathing slows until the room feels shared. Balances wobble, tip, then somehow hold. Muscles tremble in poses that looked easy. The final rest feels shorter than a minute. Everyone leaves moving slower. Mats stack neatly against the back wall.",
  },
  {
    title: "Meditation",
    text: "Thoughts queue up loudly the moment silence starts. She returns attention gently to each breath. Shoulders drop an inch without permission. The timer bell sounds impossibly soon. Ten minutes pass like a held ocean wave. The room looks slightly brighter after.",
  },
  {
    title: "Tea House",
    text: "Steam fogs the low windows within minutes. Small cups burn fingertips just enough to notice. Conversation slows to match the pouring ritual. Refills arrive before anyone asks. Time pools instead of passing here. The bill always surprises with smallness. Regulars greet the owner by name every visit.",
  },
  {
    title: "Coffee Shop",
    text: "Milk steamers hiss behind the scarred wooden counter. Laptops glow in every corner seat. Strangers share tables without sharing words. The playlist loops before closing time. Rain streaks the tall front windows. Nobody finishes as fast as planned. Outlets hide under every second table.",
  },
  {
    title: "Bookstore",
    text: "New paper smells sharp near the front tables. Staff picks wear handwritten little cards. Aisles narrow toward the dusty back room. A cat sleeps on the warm biography shelf. She leaves with three books instead of one. Receipts bookmark the first pages.",
  },
  {
    title: "Flower Shop",
    text: "Cool mist hangs over buckets of bright stems. Petals litter the wet stone floor. The owner trims thorns with quick sure snips. Ribbons curl around practiced fingers. Every bouquet leaves smelling faintly sweet. Closing means hosing everything down. Morning deliveries smell strongest of all.",
  },
  {
    title: "Barber Shop",
    text: "Clippers buzz steady against warm necks. Talk drifts from sports to weather to nothing. Mirrors show the slow transformation twice. Capes snap open with practiced flair. The hot towel at the end seals the deal. Appointments run late by tradition.",
  },
  {
    title: "Tailor Shop",
    text: "Chalk marks bloom across dark wool sleeves. Pins glint in rows along the thick cushion. The sewing machine rattles through heavy seams. Tape measures drape every neck in sight. Fittings take three visits, never two. Good work cannot be hurried.",
  },
  {
    title: "Bus Stop",
    text: "Rain patters on the scratched plastic shelter roof. Schedules lie politely behind cracked glass. Strangers stand spaced exactly apart. Headlights smear through the wet dark. The bus arrives full and sighing. Windows fog within seconds. The route map flaps loose in the wind.",
  },
  {
    title: "Subway Ride",
    text: "Doors chime and swallow another crowd whole. Poles offer balance to swaying strangers. Tunnel lights strobe past sooty windows. A musician squeezes surprising sweetness from battered strings. Everyone reads over someone else's shoulder. Stops blur together after midnight. Someone always misses their stop while reading.",
  },
  {
    title: "Airport Wait",
    text: "Departure boards flip with soft electric clicks. Shoes squeak across endless polished floors. Announcements blur into soothing background noise. Coffee costs twice what it should. Boarding always starts somewhere else first. Windows frame planes nosing to gates. Children press noses against the tall glass.",
  },
  {
    title: "Road Trip",
    text: "Gas station coffee scalds eager tongues. License plates blur into a private counting game. Rest stops smell of hot asphalt and pine. Playlists die somewhere past the state line. Home feels farther with every mile marker. Motels glow like promises at dusk.",
  },
  {
    title: "Motel Night",
    text: "The ice machine groans down the dim hallway. Thin walls carry neighboring television dramas. The mattress dips exactly in the middle. A neon sign buzzes pink through thin curtains. Checkout comes cruelly early. The shower runs hot for ninety seconds.",
  },
  {
    title: "Rainy Window",
    text: "Drops race crooked paths down the cold pane. Thunder rolls somewhere beyond the hills. Blankets pile higher as the room darkens. Tea cools untouched on the wide sill. Books wait patiently on the low shelf. Naps win every argument today.",
  },
  {
    title: "Kitchen Garden",
    text: "Basil perfumes fingers after the lightest touch. Worms turn the dark beds without pay. Cherry tomatoes split sweetly in warm sun. Mint threatens to conquer the whole corner. Dinner starts right outside the door. Weeds return faster than plans. Harvest baskets fill the porch rail.",
  },
  {
    title: "Laundry Day",
    text: "Machines thump their steady uneven rhythm. Warm sheets smell faintly of summer wind. Socks vanish into some warm dimension. Dryer sheets cling with static mischief. Folding takes longer than the wash itself. Clean piles topple by evening. The lost sock drawer overflows quietly.",
  },
  {
    title: "Evening Run",
    text: "Streetlights buzz awake one by one. Breath clouds briefly in the cooling air. Legs find their rhythm near the second mile. Dogs bark encouragement from dark yards. Porch lights guide the easy way home. Stretches hurt in the best way.",
  },
];
