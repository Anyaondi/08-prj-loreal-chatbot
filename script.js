
/* ==========================
   L'OREAL BEAUTY ASSISTANT
   ========================== */

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");

// Cloudflare Worker URL
const API_URL =
  "https://loreal-beauty-api.anyaondi-tsatenawa.workers.dev/";

// Conversation history
const conversationHistory = [];

// Display messages
function displayMessage(message, sender) {
  const messageBubble = document.createElement("div");

  messageBubble.classList.add("message", sender);
  messageBubble.textContent = message;

  chatWindow.appendChild(messageBubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Welcome message
displayMessage(
  "👋 Bonjour! Welcome to L'Oréal Beauty Assistant! " +
  "Ask me about skincare, makeup, haircare, " +
  "fragrances, or personalized beauty routines.",
  "bot"
);

// Handle messages
chatForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const message = userInput.value.trim();

  if (!message) return;

  displayMessage(message, "user");
  userInput.value = "";

  sendButton.disabled = true;

  // Show temporary loading message
  const loadingBubble = document.createElement("div");
  loadingBubble.classList.add("message", "bot");
  loadingBubble.textContent = "Thinking... 💭";
  chatWindow.appendChild(loadingBubble);

  try {
    // Send conversation to Cloudflare
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          ...conversationHistory,
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    const aiResponse =
      data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No AI response received");
    }

    // Remove loading message
    loadingBubble.remove();

    // Display AI response
    displayMessage(aiResponse, "bot");

    // Save successful exchange
    conversationHistory.push(
      {
        role: "user",
        content: message
      },
      {
        role: "assistant",
        content: aiResponse
      }
    );

    // Keep history within Worker limit
    if (conversationHistory.length > 18) {
      conversationHistory.splice(
        0,
        conversationHistory.length - 18
      );
    }

  } catch (error) {
    console.error("Chatbot Error:", error);

    loadingBubble.remove();

    displayMessage(
      "Sorry! I'm having trouble connecting. " +
      "Please try again.",
      "bot"
    );

  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
});
