
/*
 * AdBlocker - User Interface
 * Person 4
 *
 * Saves user preferences and updates
 * the popup interface.
 */

// Get elements from the HTML
const adToggle = document.getElementById("adToggle");
const statusText = document.getElementById("statusText");
const adsCount = document.getElementById("adsCount");
const websiteToggle = document.getElementById("websiteToggle");

// Load previously saved settings
let blockingEnabled =
    localStorage.getItem("blockingEnabled") !== "false";

let websiteDisabled =
    localStorage.getItem("websiteDisabled") === "true";

// Update the interface
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

// Handle the ON/OFF switch
adToggle.addEventListener("change", function () {

    blockingEnabled = adToggle.checked;

    // Save the new setting
    localStorage.setItem(
        "blockingEnabled",
        String(blockingEnabled)
    );

    updateUI();
});

// Handle website-specific button
websiteToggle.addEventListener("click", function () {

    websiteDisabled = !websiteDisabled;

    // Save the new setting
    localStorage.setItem(
        "websiteDisabled",
        String(websiteDisabled)
    );

    updateUI();
});

// Placeholder until real ad counter is connected
adsCount.textContent = "0";

// Initialize the interface
updateUI();
