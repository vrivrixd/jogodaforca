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

// Initialize the audio objects
const correctSound = new Audio('correct.wav');
const wrongSound = new Audio('wrong.wav');
const winSound = new Audio('win.wav');
const loseSound = new Audio('lose.wav');

// Play a sound, interrupting the previous one
function playSound(sound) {
    if (soundToggle.checked) {
        sound.pause();         // Stop the current sound, if it is playing
        sound.currentTime = 0; // Rewind the sound to the start
        sound.play();          // Play the sound again
    }
}

// Load words from words.txt
async function loadWords() {
    try {
        const response = await fetch('words.txt');
        const text = await response.text();
        return text.split('\n').map(word => word.trim().toUpperCase()).filter(word => word);
    } catch (error) {
        console.error('Error loading words:', error);
        return ['ERROR'];
    }
}

// Load correct-guess messages from correct_messages.txt
async function loadCorrectMessages() {
    try {
        const response = await fetch('correct_messages.txt');
        const text = await response.text();
        correctMessages = text.split('\n').map(line => line.trim()).filter(line => line);
        if (!correctMessages.length) throw new Error('Empty file');
    } catch (error) {
        console.error('Error loading correct-guess messages:', error);
        correctMessages = ['You guessed a letter!'];
    }
}

// Load wrong-guess messages from wrong_messages.txt
async function loadWrongMessages() {
    try {
        const response = await fetch('wrong_messages.txt');
        const text = await response.text();
        wrongMessages = text.split('\n').map(line => line.trim()).filter(line => line);
        if (!wrongMessages.length) throw new Error('Empty file');
    } catch (error) {
        console.error('Error loading wrong-guess messages:', error);
        wrongMessages = ['Wrong letter!'];
    }
}

// Show a message in the notification and play a sound if enabled
function showNotification(text, sound) {
    notification.textContent = text;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    notification.focus();
    if (sound) playSound(sound); // Use the playSound function
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
        endMessage.textContent = 'Error loading words.';
        endMessage.classList.remove('hidden');
        return;
    }

    if (!correctMessages.length) await loadCorrectMessages();
    if (!wrongMessages.length) await loadWrongMessages();

    game = {
        word: words[Math.floor(Math.random() * words.length)],
        correctLetters: [],
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
    correctCount.textContent = game.word.split('').filter((char, i) => game.correctLetters[i] !== '_').length;
    wrongCount.textContent = game.wrongLetters.length;
}

// Process a letter guess
function processGuess() {
    const input = letterInput.value.trim();
    letterInput.value = '';

    if (input.toLowerCase() === 'debug') {
        if (game) {
            showNotification(`The word is: ${game.word}`);
        } else {
            showNotification('No game in progress to reveal.');
        }
        return;
    }

    const letter = input.toUpperCase();
    if (!input || input.length > 1 || !/[a-zA-Z]/.test(input)) {
        showNotification('Please enter a single valid letter.');
        return;
    }

    if (game.correctLetters.includes(letter) || game.wrongLetters.includes(letter)) {
        showNotification('You already tried that letter.');
        return;
    }

    if (game.word.includes(letter)) {
        for (let i = 0; i < game.word.length; i++) {
            if (game.word[i] === letter) {
                game.correctLetters[i] = letter;
            }
        }
        const correctMessage = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        showNotification(correctMessage, correctSound);
    } else {
        game.wrongLetters.push(letter);
        game.attempts--;
        const wrongMessage = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
        showNotification(`${wrongMessage} Attempts left: ${game.attempts}.`, wrongSound);
    }

    updateDisplay();
    checkGameEnd();
}

// Check whether the game has ended
function checkGameEnd() {
    if (!game.correctLetters.includes('_')) {
        endMessage.textContent = `Congratulations, you won! The word was ${game.word}.`;
        playSound(winSound); // Use the playSound function
        endGame();
    } else if (game.attempts <= 0) {
        endMessage.textContent = `You lost! The word was ${game.word}.`;
        playSound(loseSound); // Use the playSound function
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
