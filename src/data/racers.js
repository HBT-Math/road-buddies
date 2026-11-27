// The talking rival cars. Fully original characters: edit names, colours, shapes and lines freely.
// shape: 'zippy' (small and round) | 'sports' (low with a wing) | 'truck' (big and boxy)
//        | 'bug' (tiny dome) | 'classic' (tall, round fenders, little flag) | 'racer' (long and low, tall tail fin)
// pace:  how they drive. start / end multiply their speed early and late in the race.
// lines: always kind. intro, cheer (you got nitro), passYou (they pass you), youPass (you pass them),
//        win (they finish ahead), lose (you finish ahead). Spoken aloud and shown in bubbles.
export const racers = [
  {
    id: 'zippy', name: 'Zippy', shape: 'zippy',
    color: '#FF8C1A', dark: '#C2600A', eyes: '#2B2140',
    voiceStyle: { pitch: 1.5, rate: 1.15 },
    pace: { start: 1.12, end: 0.97 },
    catchphrase: 'Catch me if you can!',
    lines: {
      intro: ['Zoom zoom! I am the fastest little car in town!'],
      cheer: ['Whoa, nitro! Nice one!', 'Hey, wait for me!'],
      passYou: ['Catch me if you can!', 'Beep beep, coming through!'],
      youPass: ['Hey! How did you do that?', 'Wow, you are quick!'],
      win: ['Zoom! I won this time. Race me again!'],
      lose: ['You beat me! Okay, okay, you are fast too!'],
    },
  },
  {
    id: 'betty', name: 'Bolt Betty', shape: 'sports',
    color: '#8E5CD9', dark: '#5F3AA0', eyes: '#2B2140',
    voiceStyle: { pitch: 1.25, rate: 1.0 },
    pace: { start: 1.04, end: 1.02 },
    catchphrase: 'Shiny paint, super speed!',
    lines: {
      intro: ['Look at my shiny paint! Ready to race?'],
      cheer: ['Ooh, sparkly nitro! Nice!'],
      passYou: ['Shiny paint, super speed!', 'Watch me shine!'],
      youPass: ['Hmm, you are pretty shiny too!', 'Good move, superstar!'],
      win: ['Ta-da! What a race! You were great too.'],
      lose: ['You won! That was super speedy!'],
    },
  },
  {
    id: 'grumble', name: 'Grumble', shape: 'truck',
    color: '#3E9B57', dark: '#2A6E3C', eyes: '#2B2140',
    voiceStyle: { pitch: 0.6, rate: 0.85 },
    pace: { start: 0.9, end: 1.08 },
    catchphrase: 'Hmph. Slow and steady.',
    lines: {
      intro: ['Hmph. Big races make my engine grumble.'],
      cheer: ['Hmph. That was good math.', 'Nice nitro, little one.'],
      passYou: ['Hmph. Slow and steady.', 'Excuse me, big truck coming!'],
      youPass: ['Hmph. Well done.', 'Go on then, zoom!'],
      win: ['Hmph. I won. You raced very well though.'],
      lose: ['Hmph... you won. I am proud of you.'],
    },
  },
  {
    id: 'pip', name: 'Pip', shape: 'bug',
    color: '#FFD23F', dark: '#C9A100', eyes: '#2B2140',
    voiceStyle: { pitch: 1.7, rate: 1.1 },
    pace: { start: 0.98, end: 1.0 },
    catchphrase: 'Yay, let us go!',
    lines: {
      intro: ['Hi hi hi! Can we be friends? Let us race!'],
      cheer: ['Yay! Super nitro!', 'You did it! Woo-hoo!', 'Go go go!'],
      passYou: ['Beep! Sorry! Let us go together!'],
      youPass: ['Yay! You passed me! Go go go!', 'Woo-hoo, so fast!'],
      win: ['I won? Yay! But you were amazing!'],
      lose: ['You won! I knew you could do it!'],
    },
  },
  {
    id: 'wheelie', name: 'Captain Wheelie', shape: 'classic',
    color: '#3A86FF', dark: '#1F5BC0', eyes: '#2B2140',
    voiceStyle: { pitch: 0.85, rate: 0.9 },
    pace: { start: 1.0, end: 1.0 },
    catchphrase: 'Steady wheels, clever mind!',
    lines: {
      intro: ['Welcome to the big race! Answer the gates to get nitro.'],
      cheer: ['Well done! Clever mind, fast wheels!', 'Excellent thinking!'],
      passYou: ['Steady wheels, clever mind!', 'Keep going, you can catch me!'],
      youPass: ['Bravo! Fine driving!', 'Ha ha! Well done!'],
      win: ['A fine race! Practice makes perfect.'],
      lose: ['Splendid! You are a true racer!'],
    },
  },
  {
    id: 'blaze', name: 'Blaze', shape: 'racer',
    color: '#F2607E', dark: '#B33A55', eyes: '#2B2140',
    voiceStyle: { pitch: 1.05, rate: 1.05 },
    pace: { start: 1.06, end: 1.03 },
    catchphrase: 'Ready, steady, Blaze!',
    lines: {
      intro: ['Ready, steady, Blaze! I am the star of the track!'],
      cheer: ['Now that is star-power nitro!', 'Ooh, you are shining today!'],
      passYou: ['Ready, steady, Blaze!', 'Star racer coming through!'],
      youPass: ['Whoa! You are a star racer too!', 'Hey, that was my move!'],
      win: ['Star finish! But you raced like a champion.'],
      lose: ['You beat the star of the track! Amazing!'],
    },
  },
];

export const getRacer = (id) => racers.find((r) => r.id === id) || racers[0];
export const pickLine = (racer, kind, rnd = Math.random) => {
  const list = racer.lines[kind] || [];
  return list[Math.floor(rnd() * list.length)] || '';
};
