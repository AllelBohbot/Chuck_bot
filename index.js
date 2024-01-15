import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import translate from 'translate';

let userLanguage = 'english'; // Default language
const token = '6591656817:AAGW--PLWzXx1yX4trty16SSOOO_V6dX0xw';

const bot = new TelegramBot(token, { polling: true });

// Function to fetch Chuck Norris jokes from the website
async function fetchChuckNorrisJokes() {
    const headers = {
        Accept: 'text/html',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    try {
        const response = await axios.get('https://parade.com/968666/parade/chuck-norris-jokes/', { headers });
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);

        const jokes = [];

        // Modify the selector based on the actual HTML structure
        $('#phxdetail-1 > article > div > div.m-detail--contents.l-content-well > section > div.l-grid--content-body > div.m-detail--body > ol > li').each((index, element) => {
            const jokeText = $(element).text().trim();
            jokes.push(jokeText);
        });

        return jokes;
    } catch (error) {
        console.error('Error parsing Chuck Norris jokes:', error.message);
        return [];
    }
}


// Function to translate text using Azure Translator API
async function translateText(text, targetLanguage) {
    try {
        const translatedText = await translate(text, { from: 'en', to: targetLanguage });
        return translatedText;
    } catch (error) {
        console.error('Error translating text:', error.message);
        return text; // Return the original text if translation fails
    }
}

// Function to fetch Chuck Norris jokes, translate, and send to the user
async function sendTranslatedJoke(chatId, requestedJokeNumber) {
    try {
        const jokes = await fetchChuckNorrisJokes();

        // Check if the requested number is within the valid range
        if (requestedJokeNumber >= 1 && requestedJokeNumber <= jokes.length) {
            const requestedJoke = jokes[requestedJokeNumber - 1]; // Adjust for array indexing

            // Translate the joke to the user's chosen language
            const translatedJoke = await translateText(requestedJoke, userLanguage);

            // Send the translated Chuck Norris joke
            bot.sendMessage(chatId, `${requestedJokeNumber}. ${translatedJoke}`);
        } else {
            // If the number is not within the valid range, notify the user
            bot.sendMessage(chatId, 'Invalid joke number. Please provide a number between 1 and 101.');
        }
    } catch (error) {
        console.error('Error fetching and translating Chuck Norris jokes:', error.message);
    }
}

// Handle set language command
bot.onText(/set language (.+)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const requestedLanguage = match[1].toLowerCase();

    // Set the user's language
    userLanguage = requestedLanguage;

    // Call the async function to handle translation and sending the message
    handleTranslatedMessage(chatId);
});
    
// Async function to handle translation and sending the message
async function handleTranslatedMessage(chatId) {
    try {
        // Translate the response message to the user's selected language
        const responseMessage = await translateText('No problem', userLanguage);

        // Send the translated message to the user
        bot.sendMessage(chatId, responseMessage);
    } catch (error) {
        console.error('Error handling translated message:', error.message);
    }
}


// Handle joke command with a number parameter
bot.onText(/\/?(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const requestedJokeNumber = parseInt(match[1]);
    // Fetch Chuck Norris jokes, translate, and send to the user
    await sendTranslatedJoke(chatId, requestedJokeNumber);
});