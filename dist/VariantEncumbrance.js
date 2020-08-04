/**
 * This is your JavaScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */

// Import JavaScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { DND5E } from "../../systems/dnd5e/module/config.js";
import ActorSheet5e from "../../systems/dnd5e/module/actor/sheets/base.js";
import ActorSheet5eCharacter from "../../systems/dnd5e/module/actor/sheets/character.js";

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
	console.log('VariantEncumbrance | Initializing VariantEncumbrance');

	// Assign custom classes and constants here

	// Register custom module settings
	registerSettings();
	DND5E.encumbrance.strMultiplier = game.settings.get("VariantEncumbrance", "heavyMultiplier");
	DND5E.encumbrance.currencyPerWeight = game.settings.get("VariantEncumbrance", "currencyWeight");
	CONFIG.debug.hooks = true;
	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	// Do anything after initialization but before
	// ready

});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	// Do anything once the module is ready
});

Hooks.on('renderActorSheet', function (actorSheet, htmlElement, actorObject) {
	if (actorObject.isCharacter) {
		var encumbranceElements;
		var encumbranceContainer;
		var speedElements;
		var speedDecrease = 0;
		if (htmlElement[0].tagName == "FORM" && htmlElement[0].id == "") {
			console.log(htmlElement.find('.encumbrance'));
			encumbranceElements = htmlElement.find('.encumbrance')[0].children;
			encumbranceContainer = htmlElement.find('.encumbrance')[0];
			console.log(htmlElement.find('[name="data.attributes.speed.value"]'));
			speedElements = htmlElement.find('[name="data.attributes.speed.value"]')[0].parentElement.parentElement;
			//encumbranceElements = pageElement[0].offsetParent.children[1].children[0].children[2].children[1].children[2].children;
			//encumbranceContainer = pageElement[0].offsetParent.children[1].children[0].children[2].children[1].children[2];
			//speedElements = pageElement[0].offsetParent.children[1].children[0].children[0].children[1].children[3].children[4].children;
		} else {
			console.log(htmlElement.find('.encumbrance'));
			encumbranceElements = htmlElement.find('.encumbrance')[0].children;
			encumbranceContainer = htmlElement.find('.encumbrance')[0];
			console.log(htmlElement.find('[name="data.attributes.speed.value"]'));
			speedElements = htmlElement.find('[name="data.attributes.speed.value"]')[0].parentElement.parentElement;
			// encumbranceElements = htmlElement[0].children[1].children[0].children[2].children[1].children[2].children;
			// encumbranceContainer = htmlElement[0].children[1].children[0].children[2].children[1].children[2];
			// speedElements = htmlElement[0].children[1].children[0].children[0].children[1].children[3].children[4].children
		}
		var totalWeight = 0;
		var strengthScore = actorObject.data.abilities.str.value;
		var lightMax = game.settings.get("VariantEncumbrance", "lightMultiplier") * strengthScore;
		var mediumMax = game.settings.get("VariantEncumbrance", "mediumMultiplier") * strengthScore;
		var heavyMax = game.settings.get("VariantEncumbrance", "heavyMultiplier") * strengthScore;

		actorObject.inventory.forEach(category => {
			category.items.forEach(item => {
				var appliedWeight = item.totalWeight;
				if (item.data.equipped) {
					if (item.data.proficient) {
						appliedWeight *= game.settings.get("VariantEncumbrance", "profEquippedMultiplier");
					} else {
						appliedWeight *= game.settings.get("VariantEncumbrance", "equippedMultiplier");
					}
				}
				totalWeight += appliedWeight;
			});
		});

		encumbranceElements[2].style.left = (lightMax / heavyMax * 100) + "%";
		encumbranceElements[3].style.left = (lightMax / heavyMax * 100) + "%";
		encumbranceElements[4].style.left = (mediumMax / heavyMax * 100) + "%";
		encumbranceElements[5].style.left = (mediumMax / heavyMax * 100) + "%";
		encumbranceElements[0].style.cssText = "width: " + Math.min(Math.max((totalWeight / heavyMax * 100), 0), 99.8) + "%;";
		encumbranceElements[1].textContent = totalWeight + " lbs.";

		encumbranceElements[0].classList.remove("medium");
		encumbranceElements[0].classList.remove("heavy");

		if (totalWeight >= lightMax && totalWeight < mediumMax) {
			encumbranceElements[0].classList.add("medium");
			speedDecrease = 10;
		}
		if (totalWeight >= mediumMax && totalWeight < heavyMax) {
			encumbranceElements[0].classList.add("heavy");
			speedDecrease = 20;
		}
		if (totalWeight >= heavyMax) {
			encumbranceElements[0].classList.add("max");
		}

		$('.encumbrance-breakpoint.encumbrance-33.arrow-down').parent().css("margin-bottom", "16px");
		$('.encumbrance-breakpoint.encumbrance-33.arrow-down').append(`<div class="encumbrance-breakpoint-label VELabel">${lightMax}<div>`);
		$('.encumbrance-breakpoint.encumbrance-66.arrow-down').append(`<div class="encumbrance-breakpoint-label VELabel">${mediumMax}<div>`);
		encumbranceElements[1].insertAdjacentHTML('afterend', `<span class="VELabel" style="right:0%">${heavyMax}</span>`);
		encumbranceElements[1].insertAdjacentHTML('afterend', `<span class="VELabel">0</span>`);

		if (game.settings.get("VariantEncumbrance", "useVariantEncumbrance")) {
			console.log(actorObject.data.attributes.speed.value);
			var newSpeed = actorObject.data.attributes.speed.value.split(" ")[0];
			if (isNaN(newSpeed)) {
				newSpeed = "?"
			} else {
				if (totalWeight >= heavyMax) {
					newSpeed = 0;
				} else {
					newSpeed -= speedDecrease;
				}
			}
			$('[name="data.attributes.speed.value"]').before(`<span class="VESpeed">${newSpeed} /</span>`);
			$('[name="data.attributes.speed.value"]').addClass(`DnDSpeed`);
			$('[name="data.attributes.speed.value"]').parent().css("width", "100%");
			$('[name="data.attributes.speed.value"]').parent().css("display", "flex");
		}

		console.log([totalWeight, lightMax, mediumMax, heavyMax]);
		console.log(encumbranceContainer);
	}
})

// Add any additional hooks if necessary
