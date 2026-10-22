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
