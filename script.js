// Shared game code for every language.
// Each language has its own folder (pt/, en/...) with index.html, which defines TEXTS,
// and the files words.txt, correct_messages.txt and wrong_messages.txt.
// Those files are loaded relative to the page; the sounds are shared and live next to this script.

let game = null;
let correctMessages = [];
let wrongMessages = [];

const noGameMessage = document.getElementById('no-game-message');
const gameActiveSection = document.getElementById('game-active');
const correctCount = document.getElementById('correct-count');
const wrongCount = document.getElementById('wrong-count');
const wordDisplay = document.getElementById('word-display');
const letterInput = document.getElementById('letter-input');
const guessButton = document.getElementById('guess-button');
const newGameButton = document.getElementById('new-game-button');
const endMessage = document.getElementById('end-message');
const notification = document.getElementById('notification');
const soundToggle = document.getElementById('sound-toggle');

// Fill {name} placeholders in a text from TEXTS
function format(text, values) {
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match));
}

// Initialize the audio objects (shared by all languages)
const scriptUrl = document.currentScript.src;
const correctSound = new Audio(new URL('correct.wav', scriptUrl));
const wrongSound = new Audio(new URL('wrong.wav', scriptUrl));
const winSound = new Audio(new URL('win.wav', scriptUrl));
const loseSound = new Audio(new URL('lose.wav', scriptUrl));

// Play a sound, interrupting the previous one
function playSound(sound) {
    if (soundToggle.checked) {
        sound.pause();         // Stop the current sound, if it is playing
        sound.currentTime = 0; // Rewind the sound to the start
        sound.play();          // Play the sound again
    }
}

// Letter without accents, so that typing A also finds Ã, Á, Â... and C finds Ç
function baseLetter(char) {
    return char.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Load a text file from the language folder, one entry per line
async function loadLines(file) {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    const text = await response.text();
    return text.split('\n').map(line => line.trim()).filter(line => line);
}

// Load words from words.txt
async function loadWords() {
    try {
        return (await loadLines('words.txt')).map(word => word.toUpperCase());
    } catch (error) {
        console.error('Error loading words:', error);
        return [];
    }
}

// Load correct-guess messages from correct_messages.txt
async function loadCorrectMessages() {
    try {
        correctMessages = await loadLines('correct_messages.txt');
        if (!correctMessages.length) throw new Error('Empty file');
    } catch (error) {
        console.error('Error loading correct-guess messages:', error);
        correctMessages = [TEXTS.defaultCorrectMessage];
    }
}

// Load wrong-guess messages from wrong_messages.txt
async function loadWrongMessages() {
    try {
        wrongMessages = await loadLines('wrong_messages.txt');
        if (!wrongMessages.length) throw new Error('Empty file');
    } catch (error) {
        console.error('Error loading wrong-guess messages:', error);
        wrongMessages = [TEXTS.defaultWrongMessage];
    }
}

// Show a message in the notification and play a sound if enabled
function showNotification(text, sound) {
    notification.textContent = text;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    notification.focus();
    if (sound) playSound(sound);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
            if (game && !letterInput.disabled) letterInput.focus();
        }, 500);
    }, 3000);
}

// Start a new game
async function startNewGame() {
    const words = await loadWords();
    if (!words.length) {
        endMessage.textContent = TEXTS.errorLoadingWords;
        endMessage.classList.remove('hidden');
        return;
    }

    if (!correctMessages.length) await loadCorrectMessages();
    if (!wrongMessages.length) await loadWrongMessages();

    game = {
        word: words[Math.floor(Math.random() * words.length)],
        correctLetters: [],
        triedLetters: [],
        wrongLetters: [],
        attempts: 7
    };

    for (let i = 0; i < game.word.length; i++) {
        game.correctLetters.push('_');
    }

    noGameMessage.classList.add('hidden');
    gameActiveSection.classList.remove('hidden');
    endMessage.classList.add('hidden');
    updateDisplay();
    letterInput.disabled = false;
    guessButton.disabled = false;
    letterInput.focus();
}

// Update the game display
function updateDisplay() {
    wordDisplay.textContent = game.correctLetters.join('');
    correctCount.textContent = game.correctLetters.filter(char => char !== '_').length;
    wrongCount.textContent = game.wrongLetters.length;
}

// Process a letter guess
function processGuess() {
    const input = letterInput.value.trim();
    letterInput.value = '';

    if (input.toLowerCase() === 'debug') {
        if (game) {
            showNotification(format(TEXTS.wordIs, { word: game.word }));
        } else {
            showNotification(TEXTS.noGameToReveal);
        }
        return;
    }

    if (!game || letterInput.disabled) return;

    if (!/^\p{L}$/u.test(input)) {
        showNotification(TEXTS.invalidLetter);
        return;
    }

    const letter = baseLetter(input.toUpperCase());
    if (game.triedLetters.includes(letter)) {
        showNotification(TEXTS.alreadyTried);
        return;
    }
    game.triedLetters.push(letter);

    let found = false;
    for (let i = 0; i < game.word.length; i++) {
        if (baseLetter(game.word[i]) === letter) {
            game.correctLetters[i] = game.word[i]; // show the letter as written, with its accent
            found = true;
        }
    }

    if (found) {
        const correctMessage = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        showNotification(correctMessage, correctSound);
    } else {
        game.wrongLetters.push(letter);
        game.attempts--;
        const wrongMessage = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
        showNotification(`${wrongMessage} ${format(TEXTS.attemptsLeft, { attempts: game.attempts })}`, wrongSound);
    }

    updateDisplay();
    checkGameEnd();
}

// Check whether the game has ended
function checkGameEnd() {
    if (!game.correctLetters.includes('_')) {
        endMessage.textContent = format(TEXTS.won, { word: game.word });
        playSound(winSound);
        endGame();
    } else if (game.attempts <= 0) {
        endMessage.textContent = format(TEXTS.lost, { word: game.word });
        playSound(loseSound);
        endGame();
    }
}

// End the game
function endGame() {
    letterInput.disabled = true;
    guessButton.disabled = true;
    gameActiveSection.classList.add('hidden');
    noGameMessage.classList.remove('hidden');
    endMessage.classList.remove('hidden');
}

// Event listeners
guessButton.addEventListener('click', processGuess);
newGameButton.addEventListener('click', startNewGame);
letterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processGuess();
});
