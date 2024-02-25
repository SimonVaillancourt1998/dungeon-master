

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let character = {};

function promptForAttribute(attributeName) {
  return new Promise((resolve) => {
    rl.question(`Enter your character's ${attributeName}: `, (answer) => {
      character[attributeName] = answer;
      resolve();
    });
  });
}

export async function createCharacter() {
  console.log('Welcome to character creation!');

  await promptForAttribute('name');
  await promptForAttribute('gender');
  await promptForAttribute('race');
  await promptForAttribute('background');

  console.log('Character creation complete:');
  console.log(character);

  saveCharacter();
  startGame();
}

function saveCharacter() {
  fs.writeFileSync('character.json', JSON.stringify(character), 'utf8');
}

export function loadCharacter() {
  if (fs.existsSync('character.json')) {
    const characterData = fs.readFileSync('character.json', 'utf8');
    character = JSON.parse(characterData);
    console.log('Character loaded:');
    console.log(character);
  } else {
    console.log('No character data found.');
  }
}

