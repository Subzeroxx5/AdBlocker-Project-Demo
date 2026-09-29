
/*
 * AdBlocker Popup
 * User Interface - Person 4
 *
 * Handles the popup controls and displays
 * the current protection status.
 */

// Get the elements from popup.html
const adToggle = document.getElementById("adToggle");
const statusText = document.getElementById("statusText");
const adsCount = document.getElementById("adsCount");
const websiteToggle = document.getElementById("websiteToggle");

// Temporary UI state for testing
let blockingEnabled = true;
let websiteDisabled = false;

// Update the popup display
function updateUI() {

    // Update the protection status
    if (blockingEnabled) {
        statusText.textContent = "Protection is ON";
        statusText.style.color = "#4ade80";
    } else {
        statusText.textContent = "Protection is OFF";
        statusText.style.color = "#f87171";
    }

    // Update the ON/OFF switch
    adToggle.checked = blockingEnabled;

    // Update the website button
    if (websiteDisabled) {
        websiteToggle.textContent =
            "Enable on this website";
    } else {
        websiteToggle.textContent =
            "Disable on this website";
    }
}

// Handle the main ON/OFF switch
adToggle.addEventListener("change", function () {

    blockingEnabled = adToggle.checked;

    updateUI();
});

// Handle the website-specific button
websiteToggle.addEventListener("click", function () {

    websiteDisabled = !websiteDisabled;

    updateUI();
});

// Display the initial ad counter
adsCount.textContent = "0";

// Initialize the popup
updateUI();