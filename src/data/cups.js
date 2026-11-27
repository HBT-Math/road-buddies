// Race cups: 3 per difficulty (one per level step), 3 races each.
// theme: 'sunny' | 'desert' | 'snow'. storyRacer tells the story; goal is said before every race;
// page is the story page the child wins for the sticker album when the cup is finished.
const cup = (id, theme, rivals, storyRacer, title, goal, page, sticker) => ({ id, theme, rivals, storyRacer, title, goal, page, sticker });

export const cups = {
  easy: [
    cup('easy-1', 'sunny', ['pip', 'zippy', 'grumble'], 'pip', 'Sunny Road Cup',
      'Help me find the golden wheel! I lost it on the sunny road!',
      'Pip found the golden wheel under a big sunflower. "Thank you, friend!"', 'goldenWheel'),
    cup('easy-2', 'desert', ['betty', 'pip', 'wheelie'], 'betty', 'Desert Dunes Cup',
      'My shiny mirror is somewhere in the dunes. Can you help me look?',
      'Bolt Betty found her shiny mirror next to a happy cactus.', 'mirror'),
    cup('easy-3', 'snow', ['grumble', 'zippy', 'pip'], 'grumble', 'Snowy Hills Cup',
      'Hmph. My warm scarf blew away up the snowy hills.',
      'Grumble got the warm scarf back and smiled a big truck smile.', 'scarf'),
  ],
  medium: [
    cup('medium-1', 'sunny', ['blaze', 'betty', 'wheelie'], 'blaze', 'Rainbow Road Cup',
      'There is a rainbow at the end of the road! Race me there!',
      'Blaze and friends parked under the rainbow and had a picnic.', 'rainbow'),
    cup('medium-2', 'desert', ['wheelie', 'grumble', 'pip'], 'wheelie', 'Treasure Map Cup',
      'I found an old treasure map! Let us follow it across the desert.',
      'The treasure was a box of shiny new tires for everyone!', 'treasure'),
    cup('medium-3', 'snow', ['pip', 'betty', 'zippy'], 'pip', 'Snowflake Cup',
      'Let us catch the biggest snowflake in the world!',
      'Pip caught a giant sparkly snowflake. It looked like a star!', 'snowflake'),
  ],
  hard: [
    cup('hard-1', 'desert', ['betty', 'zippy', 'grumble'], 'betty', 'Golden Cactus Cup',
      'Only the cleverest racer can find the golden cactus!',
      'The golden cactus had a flower on top. Betty said: "Clever AND fast!"', 'cactus'),
    cup('hard-2', 'snow', ['wheelie', 'grumble', 'zippy'], 'wheelie', 'Mountain Top Cup',
      'Let us race to the very top of the snowy mountain!',
      'From the mountain top you can see the whole race track. Hooray!', 'mountain'),
    cup('hard-3', 'sunny', ['blaze', 'zippy', 'pip'], 'blaze', 'Champion Cup',
      'This is the big one! The Champion Cup!',
      'You won the Champion Cup! All the cars honked: beep beep hooray!', 'trophy'),
  ],
};

export const RACES_PER_CUP = 3;
export const getCup = (difficulty, step) => cups[difficulty]?.[step] || cups.easy[0];
