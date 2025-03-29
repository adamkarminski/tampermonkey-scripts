// ==UserScript==
// @name         Jira Backlog Sprint Navigation
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Navigate, move, and toggle Jira sprints using keyboard shortcuts
// @author       Adam Karmiński (karminski.dev)
// @match        *://*.atlassian.net/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let sprints = [];
    let focusedIndex = 0;
    const focusClass = 'tm-focused-sprint';
    let currentSprintId = null;
    let blurInProgress = false;

    const isBacklogPage = () => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent.toLowerCase().includes('backlog');
    };

    const addFocusStyle = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .${focusClass} {
                box-shadow: 0 0 0 3px #2196f3;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    };

    const updateSprints = () => {
        sprints = Array.from(document.querySelectorAll('[data-testid^="software-backlog.card-list.container"]'));
    };

    const getFocusedSprint = () => {
        return sprints.find(s => s.classList.contains(focusClass)) || null;
    };

    const getSprintId = (sprint) => {
        return sprint?.getAttribute('data-testid') || null;
    };

    const clearNativeFocus = () => {
        blurInProgress = true;
        requestAnimationFrame(() => {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            blurInProgress = false;
        });
    };

    const clearHighlight = () => {
        sprints.forEach(el => el.classList.remove(focusClass));
        focusedIndex = 0;
        currentSprintId = null;
        clearNativeFocus();
    };

    const focusSprint = (indexOrId) => {
        if (sprints.length === 0) return;

        let newIndex = -1;
        if (typeof indexOrId === 'number') {
            newIndex = (indexOrId + sprints.length) % sprints.length;
        } else {
            newIndex = sprints.findIndex(s => getSprintId(s) === indexOrId);
        }

        if (newIndex === -1) return;

        sprints.forEach(el => el.classList.remove(focusClass));
        focusedIndex = newIndex;
        const focusedSprint = sprints[focusedIndex];
        currentSprintId = getSprintId(focusedSprint);
        focusedSprint.classList.add(focusClass);
        focusedSprint.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearNativeFocus();
    };

    const triggerMenuClick = (sprint) => {
        const menuButton = sprint?.querySelector('[data-testid^="software-backlog.card-list.sprints-menu"]');
        if (menuButton) {
            menuButton.focus();
            menuButton.click();
        }
    };

    const clickMenuOption = (testid) => {
        setTimeout(() => {
            const option = document.querySelector(`[data-testid="${testid}"]`);
            if (option) {
                option.click();
                setTimeout(() => {
                    updateSprints();
                    focusSprint(currentSprintId);
                }, 200);
            }
        }, 50);
    };

    const toggleSprint = (sprint) => {
        const chevron = sprint?.querySelector('[aria-label="expand"], [aria-label="collapse"]');
        if (chevron) chevron.click();
    };

    const handleKeydown = (e) => {
        if (!isBacklogPage()) return;
        if (blurInProgress) return;

        updateSprints();
        if (sprints.length === 0) return;

        if (e.key === 'z' && !e.shiftKey) {
            focusSprint(focusedIndex - 1);
            return;
        } else if (e.key === 'x' && !e.shiftKey) {
            focusSprint(focusedIndex + 1);
            return;
        }

        const sprint = getFocusedSprint();
        if (e.key === 'n' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            clearHighlight();
            return;
        }

        if (!sprint) return;

        currentSprintId = getSprintId(sprint);

        if (e.key === 'ArrowUp' && !e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-move-up');
        } else if (e.key === 'ArrowDown' && !e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-move-down');
        } else if (e.key === 'ArrowUp' && e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-move-to-top');
        } else if (e.key === 'ArrowDown' && e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-move-to-bottom');
        } else if (e.key === 'E' && e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-edit');
        } else if ((e.key === 'Backspace' || e.key === 'Delete') && e.shiftKey) {
            triggerMenuClick(sprint);
            clickMenuOption('software-backlog.card-list.sprints-menu.sprint-delete');
        } else if (e.key === 'a' && !e.shiftKey) {
            toggleSprint(sprint);
        }
    };

    window.addEventListener('keydown', handleKeydown);
    addFocusStyle();
    updateSprints();
    focusSprint(0);
})();