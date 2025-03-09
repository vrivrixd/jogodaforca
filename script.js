let game = null;
let mensagensAcerto = [];
let mensagensErro = [];

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

// Carrega palavras do arquivo palavras.txt
async function loadWords() {
    try {
        const response = await fetch('palavras.txt');
        const text = await response.text();
        return text.split('\n').map(word => word.trim().toUpperCase()).filter(word => word);
    } catch (error) {
        console.error('Erro ao carregar palavras:', error);
        return ['ERRO']; // Palavra padrão
    }
}

// Carrega mensagens de acerto do arquivo mensagens_acerto.txt
async function loadAcertoMessages() {
    try {
        const response = await fetch('mensagens_acerto.txt');
        const text = await response.text();
        mensagensAcerto = text.split('\n').map(line => line.trim()).filter(line => line);
        if (!mensagensAcerto.length) throw new Error('Arquivo vazio');
    } catch (error) {
        console.error('Erro ao carregar mensagens de acerto:', error);
        mensagensAcerto = ['Você acertou uma letra!']; // Mensagem padrão
    }
}

// Carrega mensagens de erro do arquivo mensagens_erro.txt
async function loadErroMessages() {
    try {
        const response = await fetch('mensagens_erro.txt');
        const text = await response.text();
        mensagensErro = text.split('\n').map(line => line.trim()).filter(line => line);
        if (!mensagensErro.length) throw new Error('Arquivo vazio');
    } catch (error) {
        console.error('Erro ao carregar mensagens de erro:', error);
        mensagensErro = ['Letra incorreta!']; // Mensagem padrão
    }
}

// Exibe mensagem na notificação
function showNotification(text) {
    notification.textContent = text;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    notification.focus(); // Garante que o leitor de tela anuncie
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
            if (game && !letterInput.disabled) letterInput.focus(); // Retorna o foco se o jogo ainda estiver ativo
        }, 500); // Tempo para transição
    }, 3000); // Notificação visível por 3 segundos
}

// Inicia um novo jogo
async function startNewGame() {
    const words = await loadWords();
    if (!words.length) {
        endMessage.textContent = 'Erro ao carregar palavras.';
        endMessage.classList.remove('hidden');
        return;
    }

    if (!mensagensAcerto.length) await loadAcertoMessages();
    if (!mensagensErro.length) await loadErroMessages();

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

// Atualiza a exibição do jogo
function updateDisplay() {
    wordDisplay.textContent = game.correctLetters.join('');
    correctCount.textContent = game.word.split('').filter((char, i) => game.correctLetters[i] !== '_').length;
    wrongCount.textContent = game.wrongLetters.length;
}

// Processa a tentativa de uma letra
function processGuess() {
    const input = letterInput.value.trim();
    letterInput.value = '';

    // Verifica se é o comando "debug" (case insensitive)
    if (input.toLowerCase() === 'debug') {
        if (game) {
            showNotification(`A palavra é: ${game.word}`);
        } else {
            showNotification('Nenhum jogo em andamento para revelar.');
        }
        return;
    }

    // Validação de entrada (case insensitive)
    const letter = input.toUpperCase();
    if (!input || input.length > 1 || !/[a-zA-Z]/.test(input)) {
        showNotification('Por favor, insira uma única letra válida.');
        return;
    }

    if (game.correctLetters.includes(letter) || game.wrongLetters.includes(letter)) {
        showNotification('Você já tentou essa letra.');
        return;
    }

    if (game.word.includes(letter)) {
        for (let i = 0; i < game.word.length; i++) {
            if (game.word[i] === letter) {
                game.correctLetters[i] = letter;
            }
        }
        const mensagemAcerto = mensagensAcerto[Math.floor(Math.random() * mensagensAcerto.length)];
        showNotification(mensagemAcerto);
    } else {
        game.wrongLetters.push(letter);
        game.attempts--;
        const mensagemErro = mensagensErro[Math.floor(Math.random() * mensagensErro.length)];
        showNotification(`${mensagemErro} Tentativas restantes: ${game.attempts}.`);
    }

    updateDisplay();
    checkGameEnd();
}

// Verifica se o jogo terminou
function checkGameEnd() {
    if (!game.correctLetters.includes('_')) {
        endMessage.textContent = `Parabéns, você ganhou! A palavra era ${game.word}.`;
        endGame();
    } else if (game.attempts <= 0) {
        endMessage.textContent = `Você perdeu! A palavra era ${game.word}.`;
        endGame();
    }
}

// Finaliza o jogo
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

// Não inicia o jogo automaticamente