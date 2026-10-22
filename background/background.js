/*
 * AdBlocker - Background Service Worker
 *
 * Reads the popup's settings from chrome.storage.local and
 * applies them to Chrome's blocking rules:
 *   blockingEnabled : boolean  -> turns the ad_rules ruleset on/off
 *   disabledSites   : string[] -> allow-all rule for those sites
 */

const RULESET_ID = "ad_rules";
const ALLOW_SITES_RULE_ID = 1;

const DEFAULT_SETTINGS = {
    blockingEnabled: true,
    disabledSites: []
};

// Apply the saved settings to the blocking rules
async function applySettings() {

    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);

    // Global ON/OFF: enable or disable the static ruleset
    if (settings.blockingEnabled) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: [RULESET_ID]
        });
    } else {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: [RULESET_ID]
        });
    }

    // Per-site: one rule that allows everything on disabled sites.
    // Its priority is higher than the block rules (priority 1).
    const addRules = [];

    if (settings.disabledSites.length > 0) {
        addRules.push({
            id: ALLOW_SITES_RULE_ID,
            priority: 2,
            action: { type: "allowAllRequests" },
            condition: {
                requestDomains: settings.disabledSites,
                resourceTypes: ["main_frame", "sub_frame"]
            }
        });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ALLOW_SITES_RULE_ID],
        addRules: addRules
    });
}

// Save defaults on first install, then apply
chrome.runtime.onInstalled.addListener(async function () {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    await chrome.storage.local.set(settings);
    await applySettings();
});

// Re-apply when the browser starts
chrome.runtime.onStartup.addListener(applySettings);

// Re-apply whenever the popup changes a setting
chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" &&
        ("blockingEnabled" in changes || "disabledSites" in changes)) {
        applySettings();
    }
});

/*
 * Ad counter
 *   tabCounts    (storage.session) : { tabId: count } for the current page
 *   totalBlocked (storage.local)   : running total since install
 *
 * Note: onRuleMatchedDebug only fires for unpacked extensions
 * (loaded with "Load unpacked" in chrome://extensions).
 */

let counts = null;              // in-memory copy, loaded on first use
let queue = Promise.resolve();  // keeps updates in order

async function loadCounts() {
    if (counts === null) {
        const session = await chrome.storage.session.get({ tabCounts: {} });
        const local = await chrome.storage.local.get({ totalBlocked: 0 });
        counts = {
            tabCounts: session.tabCounts,
            totalBlocked: local.totalBlocked
        };
    }
}

function updateCounts(change) {
    queue = queue.then(async function () {
        await loadCounts();
        change(counts);
        await chrome.storage.session.set({ tabCounts: counts.tabCounts });
        await chrome.storage.local.set({ totalBlocked: counts.totalBlocked });
    }).catch(console.error);
}

// Count every request blocked by the ad rules
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(function (info) {

        if (info.rule.rulesetId !== RULESET_ID) {
            return;
        }

        const tabId = info.request.tabId;

        updateCounts(function (c) {
            c.totalBlocked += 1;
            if (tabId >= 0) {
                c.tabCounts[tabId] = (c.tabCounts[tabId] || 0) + 1;
            }
        });
    });
}

// Reset a tab's count when it loads a new page
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.status === "loading") {
        updateCounts(function (c) {
            delete c.tabCounts[tabId];
        });
    }
});

// Forget closed tabs
chrome.tabs.onRemoved.addListener(function (tabId) {
    updateCounts(function (c) {
        delete c.tabCounts[tabId];
    });
});
