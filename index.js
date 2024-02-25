import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import readline from 'readline';
import fs from 'fs/promises';

dotenv.config();

const openAI = new OpenAI({
  apiKey: process.env.ROLEPLAY_CHATGPT_KEY,
});

const conversationHistory = [];
let character = {};

// A flag to control whether to include conversation history when sending messages to the AI
let includeHistory = false;

// ANSI escape code to change text color (in this case, to green)
const textColorGreen = '\x1b[32m';

// ANSI escape code to reset text color
const textColorReset = '\x1b[0m';

const sendMessage = async (message) => {
  if (includeHistory) {
    conversationHistory.push({ role: 'user', content: message });
  }

  // Check if the message includes a reference to the character
  if (message.toLowerCase().includes('character')) {
    // Include character information in the conversation history
    conversationHistory.push({ role: 'user', content: `${textColorGreen}Character: ${JSON.stringify(character)}${textColorReset}` });
  }

  const response = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a character in an interactive roleplay scenario.' },
      ...conversationHistory,
    ],
  });

  const aiMessage = response.choices[0].message.content;

  if (includeHistory) {
    conversationHistory.push({ role: 'assistant', content: aiMessage });
  }

  return aiMessage;
};

const startRoleplay = async () => {
  // Check if there is a saved character
  const hasSavedCharacter = await checkSavedCharacter();

  if (hasSavedCharacter) {
    if (await askToUseSavedCharacter()) {
      // Load and use the saved character
      character = await loadCharacter();
    } else {
      // Create a new character
      includeHistory = false;
      await createCharacter();
      includeHistory = true;
    }
  } else {
    // If no saved character, create a new character
    await createCharacter();
  }

  // Save the character information immediately after creating it
  await saveCharacter();

  console.log(await sendMessage('Begin roleplay'));

  while (true) {
    const userInput = await getUserInput();

    conversationHistory.push({ role: 'user', content: `${textColorGreen}${userInput}${textColorReset}` });

    const aiResponse = await sendMessage(userInput);

    console.log(aiResponse);

    if (isRoleplayFinished(aiResponse)) {
      console.log('Roleplay finished.');
      break;
    }
  }

  // Save the character information (either loaded or newly created)
  await saveCharacter();
};

const getUserInput = async () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Your turn: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const isRoleplayFinished = (response) => {
  return response.includes('The end');
};

const checkSavedCharacter = async () => {
  try {
    await fs.access('character.json');
    return true; // Character file exists
  } catch (error) {
    return false; // Character file doesn't exist
  }
};

const askToUseSavedCharacter = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Do you want to use a saved character? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

const loadCharacter = async () => {
  try {
    const characterJSON = await fs.readFile('character.json', 'utf8');
    return JSON.parse(characterJSON);
  } catch (error) {
    console.error('Error loading character:', error);
    return {};
  }
};

const createCharacter = async () => {
  console.log('Create a new character:');

  character.name = await promptUser('Name: ');
  character.age = await promptUser('Age: ');
  character.description = await promptUser('Description: ');

};

const promptUser = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const saveCharacter = async () => {
  const characterJSON = JSON.stringify(character, null, 2);

  await fs.writeFile('character.json', characterJSON);

  console.log('Character saved to character.json');
};

startRoleplay();
