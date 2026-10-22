/*
 * AdBlocker - User Interface
 * Person 4
 *
 * Saves user preferences and updates
 * the popup interface.
 *
 * Settings are kept in chrome.storage.local so the
 * background and content scripts can read them:
 *   blockingEnabled : boolean  (global ON/OFF)
 *   disabledSites   : string[] (hostnames where blocking is off)
 */

// Get elements from the HTML
const adToggle = document.getElementById("adToggle");
const statusText = document.getElementById("statusText");
const adsCount = document.getElementById("adsCount");
const websiteToggle = document.getElementById("websiteToggle");
const currentWebsite = document.getElementById("currentWebsite");

// Used when popup.html is opened directly (not as an extension)
const DEMO_HOSTNAME = "example.com";

const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage !== undefined &&
    chrome.tabs !== undefined;

// Storage wrapper: chrome.storage in the extension,
// localStorage when previewing popup.html on its own.
const storage = {
    get(defaults) {
        if (isExtension) {
            return chrome.storage.local.get(defaults);
        }
        const result = {};
        for (const key in defaults) {
            const saved = localStorage.getItem(key);
            result[key] = saved === null ? defaults[key] : JSON.parse(saved);
        }
        return Promise.resolve(result);
    },

    set(items) {
        if (isExtension) {
            return chrome.storage.local.set(items);
        }
        for (const key in items) {
            localStorage.setItem(key, JSON.stringify(items[key]));
        }
        return Promise.resolve();
    }
};

// Current state
let blockingEnabled = true;
let disabledSites = [];
let hostname = null; // null = page where blocking doesn't apply (chrome://, etc.)

// Get the hostname of the active tab ("www." removed so
// youtube.com and www.youtube.com count as one site)
async function getCurrentHostname() {
    if (!isExtension) {
        return DEMO_HOSTNAME;
    }

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab || !tab.url) {
        return null;
    }

    try {
        const url = new URL(tab.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null;
        }
        return url.hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

// Update the interface
function updateUI() {

    const websiteDisabled =
        hostname !== null && disabledSites.includes(hostname);

    // Protection is active only when both
    // global and website protection are enabled.
    const protectionActive =
        blockingEnabled && !websiteDisabled;

    if (protectionActive) {
        statusText.textContent = "Protection is ON";
        statusText.style.color = "#4ade80";
    } else {
        statusText.textContent = "Protection is OFF";
        statusText.style.color = "#f87171";
    }

    // Main switch reflects global protection
    adToggle.checked = blockingEnabled;

    // Current website + website-specific button
    if (hostname === null) {
        currentWebsite.textContent = "Not available on this page";
        websiteToggle.textContent = "Not available on this page";
        websiteToggle.disabled = true;
    } else {
        currentWebsite.textContent = isExtension
            ? hostname
            : "Demo: " + hostname;
        websiteToggle.textContent = websiteDisabled
            ? "Enable on this website"
            : "Disable on this website";
        websiteToggle.disabled = false;
    }
}

// Handle the ON/OFF switch
adToggle.addEventListener("change", function () {

    blockingEnabled = adToggle.checked;

    // Save the new setting
    storage.set({ blockingEnabled: blockingEnabled });

    updateUI();
});

// Handle website-specific button
websiteToggle.addEventListener("click", function () {

    if (hostname === null) {
        return;
    }

    if (disabledSites.includes(hostname)) {
        disabledSites = disabledSites.filter(function (site) {
            return site !== hostname;
        });
    } else {
        disabledSites.push(hostname);
    }

    // Save the new setting
    storage.set({ disabledSites: disabledSites });

    updateUI();
});

// Placeholder until real ad counter is connected
adsCount.textContent = "0";

// Load saved settings, then initialize the interface
async function init() {
    hostname = await getCurrentHostname();

    const saved = await storage.get({
        blockingEnabled: true,
        disabledSites: []
    });

    blockingEnabled = saved.blockingEnabled;
    disabledSites = saved.disabledSites;

    updateUI();
}

init();
