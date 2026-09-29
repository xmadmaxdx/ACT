/* Manual gaps bank: 100 hand-written passages for PIN-free offline play.
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
  {
    title: "Hardware Store",
    text: "Every aisle holds a small kingdom of metal drawers. He walks in for one washer and leaves planning a project. Shelves hide screws sorted by size and head. A retired clerk fixes flat tires for free. Advice arrives faster than the desired part. The receipt reads like a small essay. He returns on Sunday for tape.",
  },
  {
    title: "Thrift Store",
    text: "Racks of donated coats smell faintly of other wardrobes. She checks every seam before trying anything on. A hand mixer costs less than the new model. Children ignore the toys section completely. Patience is the only currency this place accepts. Some things deserve a second owner. She carries four bags to the car.",
  },
  {
    title: "Post Office",
    text: "The lobby smells of ink and old paper. Senders argue quietly about lost packages. A clerk tapes every box twice for safety. Christmas queues begin before the doors open. Postage machines reject foreign addresses kindly. Somebody always mails a letter to themselves. The wall of yellow PO boxes tells small local histories.",
  },
  {
    title: "Dry Cleaner",
    text: "Fresh plastic covers every finished coat. Hangers squeak along a long metal rail. Starch and heat make the whole shop smell warm. Customers track winter mud across the tile. Each garment receives a numbered tag. Wrinkles vanish under a heavy iron. They hand back your life pressed and folded.",
  },
  {
    title: "Pharmacy",
    text: "Bright rows of boxes line the walls in perfect grids. A tired clerk swipes plastic cards without looking up. The queue moves at exactly one patient per minute. Vitamins promise energy in large friendly letters. Insurance paperwork decides who waits longer. Cold medicine tastes like blue sugar. Everyone leaves holding a small plastic bag.",
  },
  {
    title: "Gas Station",
    text: "Fluorescent lights make everyone look slightly ill. The coffee machine hums beside a rack of stale doughnuts. An attendant washes a windshield without being asked. Highway noise makes speech feel impossible. Ice pellets rattle the bucket in the corner. Payment happens faster than the coffee finishes. The car smells faintly of paper air fresheners.",
  },
  {
    title: "Bike Lane",
    text: "Commuters pedal past with helmets and tote bags. Delivery riders weave the gaps between parked cars. Drivers brake harder than physics would suggest. Children practice balance on the painted symbols. A dog walker crosses whenever the light allows. The lane belongs to everyone on a weekday evening. Nobody speeds through this particular stretch.",
  },
  {
    title: "Tailor Fitting",
    text: "She stands on a small wooden riser while fabric speaks. Pins prick gently at her hip. A mirror shows the garment from every tired angle. The tailor hums while measuring without hurry. Trousers need shortening by two inches exactly. Steam rises from the iron at the end. She walks out feeling newly assembled.",
  },
  {
    title: "Corner Deli",
    text: "Cold cuts shine under fluorescent light behind glass. The counter man knows the regular order by heart. Mustard spreads unevenly on thick rye bread. Conversation runs to sports and weather again. Chairs scrape loudly on the tile floor. Coffee refills cost nothing if you ask politely. Lunch crowds out the quiet by noon.",
  },
  {
    title: "Record Shop",
    text: "Crate diggers flip albums with careful fingers. A tester needle drops before every listening sample. Owner knowledge supplies the better recommendation. Jazz sits near the window for some reason. Every used sleeve carries the previous owner's initials. Silence falls somewhere after the third track. Bagpipes ruin about one album per decade.",
  },
  {
    title: "Toy Store",
    text: "Plastic horses cast small shadows on the carpet. A child tests every keyboard twice before deciding. Bright blocks stack badly and perfectly both. The assistant wears a name badge and infinite patience. Birthday lists start arriving in January. Gift wrapping adds silver ribbons everywhere. Nobody leaves without buying a spare battery.",
  },
  {
    title: "Locksmith",
    text: "Tiny screws rest in a magnetic tray. The old lock was simpler than anything modern. He explains each step without rushing his hands. A key blank gets filed by patient strokes. The new cylinder turns with a satisfying click. Lockouts happen at the worst hours. Trust is the biggest part of the job.",
  },
  {
    title: "Art Supply Store",
    text: "Colours march in strict order along the wall. Watercolours bleed into each other in the display tray. The clerk recommends a brush handle for small hands. Cheap paper buckles under heavy water. Mixing jars smell faintly of plastic. Every serious artist owns far more pigment than canvas.",
  },
  {
    title: "Furniture Store",
    text: "Room settings pretend that nobody actually cooks. Mattresses get raked with a wooden stage prop. Somebody naps on every display sofa within minutes. Delivery dates slide quietly across calendars. Assembly instructions are famously unusable. Drawer slides squeak forever if ignored. Nobody buys the rug in the corner display.",
  },
  {
    title: "Shoe Repair",
    text: "Leather smells strongly near the window seats. The cobbler draws stitches before he cuts anything. A heel cap goes on crooked and comes back straighter. Customers bring boots that survived real weather. Glue dries overnight under heavy weight. Money changes hands in coins and small bills. The shop closes early on rainy days.",
  },
  {
    title: "Book Fair",
    text: "Long tables hold stacks sorted by nothing in particular. Authors queue beside their own novels. Readers bend spines before buying anything. Someone always asks for the entire plot of a novel. Balloons mark the correct table from far away. Signing lines stretch around the corner. Popular titles disappear before lunch.",
  },
  {
    title: "Seasonal Market",
    text: "Plastic crates vanish under mounds of orange fruit. A chalkboard lists prices that change by the pound. Customers argue gently about which peach variety ripens faster. Bees investigate every opened box. Scales sit slightly level despite constant use. Autumn arrives in plastic bags. Vendors wave goodbye long before the light fades.",
  },
  {
    title: "Rooftop Garden",
    text: "Raised beds fill the roof above busy traffic. Bees work the purple flowers in patient circles. Wind up here arrives faster than expected. Someone waters everything twice on hot days. The city looks almost peaceful from up here. Lunch breaks happen against the low gray wall. The elevator smells faintly of rosemary.",
  },
  {
    title: "Rehearsal Room",
    text: "Chairs scrape into a rough half circle every time. The director speaks softly so everyone leans inward. Sheet music litters every flat surface. Warmups involve grumbling and much stretching. Someone forgets the blocking entirely. Applause from outside echoes down the hallway. Runners end with cold water and loud complaints.",
  },
  {
    title: "Open Mic Night",
    text: "A hand-lettered sign claims six minutes per reader. The room fills slowly with nervous laughter. Someone plays a song without announcing the title. Chairs scrape when the applause starts. The host reads the next name kindly. A poem about a train lands better than expected. The lights come up far too early.",
  },
  {
    title: "Community Choir",
    text: "Music stands hide most of the folding chairs. The director stops everyone with two fingers raised. Breath marks arrive at completely different times. Section leaders keep time with expressive hands. Someone always enters one bar early. The final chord hangs longer than strictly necessary. Sheet music gets collected in silent stacks.",
  },
  {
    title: "Piano Lesson",
    text: "Sheet music gathers dust above the closed lid. A metronome counts beside the window. Fingers hesitate over keys they have forgotten. The teacher plays the phrase properly once. Practice scales turn into mindless repetition. Coffee helps more than talent at this hour. The window reflects everything happening inside the room.",
  },
  {
    title: "Dance Studio",
    text: "Mirrors multiply every stretch across the wood. They make every mistake visible and useful. Counted steps echo off high ceilings. Sneakers squeak during the fast combinations. Hair ties live permanently in pockets. The pianist repeats difficult music on request. Nobody notices the whole hour flying past.",
  },
  {
    title: "Bicycle Mechanic",
    text: "Chains lie coiled across an old towel. The stand holds the frame at a helpful height. Bearings click when the wheels turn. Grease collects under every fingernail anyway. Cables fray where frames flex most. The shop dog sleeps under a stack of rims. Every repair teaches something new and costs almost nothing.",
  },
  {
    title: "First Snow",
    text: "Overnight the world turned white and quiet. Footprints cross the fresh blanket toward school. Nobody drives faster than the plows. Salt stains the sidewalks grey. Breath becomes visible in large clouds. A neighbour shovels the whole block alone. Children stand in the road refusing to move.",
  },
  {
    title: "Ice Fishing",
    text: "The lake holds a silence that feels earned. Drilled holes reveal black water below. Frost builds on every exposed glove. Small fish come up mostly out of curiosity. The shelter blocks wind and daylight together. Thermos coffee freezes in an hour. Nobody mentions phones for the whole afternoon.",
  },
  {
    title: "Bonfire Night",
    text: "Driftwood stands in a tall careful pyramid. Newspaper catches sparks from a single match. The smoke drifts toward the parked cars. Marshmallows burn gold at the perfect edge. Voices compete with the crackling wood. Embers glow red long after the flames collapse. Someone always relights the fire near midnight.",
  },
  {
    title: "Hiking Boots",
    text: "Blisters form where the seams meet the ankle. New leather needs breaking in slowly. Socks matter more than shoes most days. The trail gains height in quiet increments. Water bottles run lower than expected. Ridgelines reward every boring step before them. Blisters heal and the boots get quieter.",
  },
  {
    title: "Camping Coffee",
    text: "The pot sits in the coals until it sings. Grounds bubble in that first awkward minute. Cold mountain air makes the steam rise straight up. Everyone stands closer than the fire deserves. A camp mug tastes like a small luxury. Fingers warm around the metal handle. The first day always feels long.",
  },
  {
    title: "Birdfeeder",
    text: "The hanging feeder swings gently in the wind. Cardinals arrive first and bully the sparrows. Squirrels ignore the bird rules completely. Sunflower seeds disappear into the small crowd. A plastic roof keeps the seed dry. Cats watch from an alarming distance nearby. The feeder gets refilled more often than planned.",
  },
  {
    title: "Kite Flying",
    text: "Windy days are the only honest test of a kite. String tangles the instant attention lapses. The tail steadies the whole flight path. Gulls investigate the bright plastic. A neighbour lends a stronger line. Kids run until arms give out. The kite lands in an impossible tree. Somebody else throws a stone.",
  },
  {
    title: "Puddle Jump",
    text: "Boots splash through the long shallow puddles. Rain gutters after the sudden downpour. Puddles form in every available low corner. A stranger's umbrella shelters two extra children. Sidewalks turn into small rivers. Shoes squeak and squish the whole way home. Nobody remembers which socks stayed dry.",
  },
  {
    title: "Neighborhood Cookout",
    text: "A long table appears on the closed street. Burgers flip while somebody guards the corn. Kids organize elaborate games in the street. Neighbors exchange plates they claim to have too much of. A speaker plays somebody's uncle's playlist. Chairs migrate as the sun moves. Nobody cleans up until long after dark.",
  },
  {
    title: "Fireworks Show",
    text: "Blankets cover the hill before the sun goes down. Small illegal sparks always start the evening early. The first real shell wakes the whole valley. Boom echoes return from the far ridge. Dogs hide somewhere under the furniture. Red paper drifts down hours after the sky empties. Nobody gets a good photo of any of it.",
  },
  {
    title: "Lighthouse Museum",
    text: "Ship logs fill glass cases along the narrow corridor. Ink fades differently on every old page. A lens polished this big took hours. Visitors descend the same iron steps. The fog signal still works on the weekends. Donations pay for rust prevention slowly. The spiral staircase turns people dizzy near the top.",
  },
  {
    title: "Pier Fishing",
    text: "Bait buckets rattle against the rail all morning. Seagulls steal bait with zero shame. The water works a small swell below. Rods point out at wildly different angles. An old man catches nothing and stays anyway. Children count boats instead of fish. Sunset empties the pier completely.",
  },
  {
    title: "Quaint Harbor",
    text: "Ropes stay coiled out of habit not necessity. Gulls patrol the dock at low tide. Fresh paint covers almost every hull now. Cafes serve coffee to fishermen with heavy hands. The chandlery sells nothing except essential supplies. Fog horns sound twice each morning. The town measures days by tides instead of hours.",
  },
  {
    title: "Seaside Gift Cart",
    text: "Small gifts hang from every available hook. Postcards sell best in cloudy weather. A windbreak shelters the whole cart. Sand works its way into everything eventually. Children ask about the smallest prices. Coins clink in a dented bucket. Everything smells faintly of sunscreen and salt. The cart closes early when weather turns.",
  },
  {
    title: "Boardwalk Arcade",
    text: "Old machines blink along the narrow walk. Plastic tokens fill one pocket with weight. Presto machines never pay out and keep smiling. A teenager racks up another perfect score. Skee-ball rolls tilt toward the edge forever. Salt air rusts every hinge outside. The claw machine takes cash very seriously.",
  },
  {
    title: "Beach Cleanup",
    text: "Gloves come in bright plastic pairs by the dozen. Plastic fragments collect in wide grey buckets. Volunteers comb the sand in careful rows. A child holds up a crushed bottle proudly. Sharp items go straight into special containers. The tally fills a clipboard page by page. The water looks cleaner by afternoon.",
  },
];
