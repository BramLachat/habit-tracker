import { habitStore } from "./store.js";

/**
 * +-------------------------+
 * | SHOW LOCAL NOTIFICATION |
 * +-------------------------+
 */
async function showLocalNotification() {
    // 1. Check/Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        // 2. Get the active Service Worker registration
        const registration = await navigator.serviceWorker.ready;

        // 3. Trigger the notification
        registration.showNotification('Habit Tracker', {
            body: "What have you done today?",
            // icon: '/images/icon-192.png',
            tag: 'local-notification', // Prevents duplicates
            vibrate: [200, 100, 200],
        });
    } else {
        console.error('Notification permission denied.');
    }
}

const PAGES = {
    HABITS: "habits",
    DATA: "data"
}

/**
 * +--------------------------------+
 * | UPDATE URL WITHOUT PAGE RELOAD |
 * +--------------------------------+
 */
const updateUrlWithoutPageReload = () => {
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
}

/**
 * +-----------------------------+
 * | OPEN DEFAULT ON HABITS PAGE |
 * +-----------------------------+
 */
const params = new URLSearchParams(window.location.search);
if (!params.get("page")) {
    params.set("page", PAGES.HABITS);
    updateUrlWithoutPageReload();
}

/**
 * +------------------------------+
 * | IS ELEMENT VISIBLE FUNCTIONS |
 * +------------------------------+
 */

const getContentVisibilityValue = (page) => {
    const currentPage = params.get("page");
    if (page === currentPage) {
        return "visible";
    } else {
        return "hidden";
    }
};

/**
 * +-------------------------------+
 * | HANDLE PAGE NAVIGATION EVENTS |
 * +-------------------------------+
 */
const renderNavigatedPageSection = () => {
    const habitsSectionElement = document.getElementById("HABITS_SECTION");
    habitsSectionElement.style.contentVisibility = getContentVisibilityValue(PAGES.HABITS);
    const dataSectionElement = document.getElementById("DATA_SECTION");
    dataSectionElement.style.contentVisibility = getContentVisibilityValue(PAGES.DATA);
};

/**
 * +-----------------------+
 * | GET ALL HABITS SORTED |
 * +-----------------------+
 */
const getAllHabitsSorted = async () => {
    const sortedHabits = [];
    await habitStore.iterate(function(value, key, iterationNumber) {
        sortedHabits.push({ id: key, value: value });
    });
    sortedHabits.sort(function (a, b) {
        return a.value.timestamp.localeCompare(b.value.timestamp);
    });
    return sortedHabits;
}

/**
 * +------------------------+
 * | COPY DATA TO CLIPBOARD |
 * +------------------------+
 */
const copyHabitsAsMarkdownToClipboard = () => {
    getAllHabitsSorted().then(sortedHabits => {
        sortedHabits = sortedHabits.map(habit => habit.value);
        const sortedHabitsGroupedByDate = Object.groupBy(sortedHabits, (habit) => {
            return habit.timestamp.split("T")[0];
        });
        let resultingMarkdown = "";
        for (const dateGroup in sortedHabitsGroupedByDate) {
            resultingMarkdown += "+------------+\n| " + dateGroup + " |\n+------------+\n";
            const habits = sortedHabitsGroupedByDate[dateGroup];
            for (const habit of habits) {
                const date = new Date(habit.timestamp);

                const formattedTime = new Intl.DateTimeFormat("nl", {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).format(date).replace(":", "u");

                resultingMarkdown += "- " + formattedTime + ": " + habit.description + "\n";
            }
        }
        navigator.clipboard.writeText(resultingMarkdown);
    });
}

/**
 * +--------------------------------------+
 * | GLOBAL EVENT LISTENER FOR NAVIGATION |
 * +--------------------------------------+
 */
document.addEventListener('click', (event) => {
    const targetId = event.target.id;
    if (targetId === "DATA_NAVIGATION_BUTTON") {
        params.set("page", PAGES.DATA)
        updateUrlWithoutPageReload();
        renderNavigatedPageSection();
    }
    if (targetId === "HABITS_NAVIGATION_BUTTON") {
        params.set("page", PAGES.HABITS)
        updateUrlWithoutPageReload();
        renderNavigatedPageSection();
    }
    if (targetId === "COPY_TO_CLIPBOARD_BUTTON") {
        copyHabitsAsMarkdownToClipboard();
    }

    /**
     * +--------------+
     * | REMOVE HABIT |
     * +--------------+
     */
    if (targetId?.startsWith(deleteHabitButtonIdPrefix)) {
        const elementId = targetId.split(deleteHabitButtonIdPrefix)[1];
        habitStore.removeItem(elementId).then(() => {
            renderHabitTableRows();
        });
    }

    /**
     * +------------------+
     * | DUPLICATE BUTTON |
     * +------------------+
     */
    if (targetId?.startsWith(duplicateHabitButtonIdPrefix)) {
        const elementId = targetId.split(duplicateHabitButtonIdPrefix)[1];
        habitStore.setItem(self.crypto.randomUUID(), habitEntry).then(() => {
            renderHabitTableRows();
        });
    }

    /**
     * +---------------+
     * | ADD NEW HABIT |
     * +---------------+
     */
    if (targetId?.startsWith(habitButtonIdPrefix)) {
        let buttonValue = habitButtonsMap.get(targetId);
        const habitEntry = {
            timestamp: new Date(Date.now()).toISOString(),
            description: buttonValue
        };
        habitStore.setItem(self.crypto.randomUUID(), habitEntry).then(() => {
            renderHabitTableRows();
        });
    }

    /**
     * +----------------------+
     * | ADD NEW CUSTOM HABIT |
     * +----------------------+
     */
    if (targetId === "CUSTOM_HABIT_SAVE_BUTTON") {
        const textAreaElement = document.getElementById("CUSTOM_HABIT_TEXT_AREA");
        const habitEntry = {
            timestamp: new Date(Date.now()).toISOString(),
            description: textAreaElement.value
        };
        habitStore.setItem(self.crypto.randomUUID(), habitEntry).then(() => {
            renderHabitTableRows();
        });
        textAreaElement.value = "";
    }
});

const deleteHabitButtonIdPrefix = "DELETE_HABIT_BUTTON_";
const duplicateHabitButtonIdPrefix = "DUPLICATE_HABIT_BUTTON_";

/**
 * +---------------------------+
 * | HABIT BUTTONS DEFINITIONS |
 * +---------------------------+
 */
const habitButtonIdPrefix = "HABIT_BUTTON_"
const habitButtonsMap = new Map();
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Wakker")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Glas Water (250 ml)")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Fles Water (500 ml)")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Slappe Kak")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Sterke Kak")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Tanden Gepoetst")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Tas Koffie")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Tas Thee")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Crossfit")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Primerose Pilletje")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Magnesium")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Frisdrank")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Alcohol")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Powernap")
habitButtonsMap.set(habitButtonIdPrefix + self.crypto.randomUUID(), "Slapen")

/**
 * +------------------------------+
 * | DYNAMIC RENDER HABIT BUTTONS |
 * +------------------------------+
 */
const habitButtonsContainer = document.querySelector('#HABIT_BUTTONS');
const habbitButtonsFragment = document.createDocumentFragment();
habitButtonsMap.keys().forEach(habitButtonKey => {
    const buttonElement = document.createElement('button');
    buttonElement.id = habitButtonKey;
    buttonElement.textContent = habitButtonsMap.get(habitButtonKey);
    habbitButtonsFragment.appendChild(buttonElement); // No reflow yet
});
habitButtonsContainer.appendChild(habbitButtonsFragment); // Single reflow here

/**
 * +----------------------------+
 * | RENDER HABIT DATA IN TABLE |
 * +----------------------------+
 */
const habitDataTable = document.querySelector('#HABIT_DATA_TABLE_BODY');

const renderHabitTableRows = () => {
    // cleanup up old rows if present.
    if (habitDataTable.hasChildNodes()) {
        const childElementsToRemove = [];
        for (const tableRow of habitDataTable.children) {
            childElementsToRemove.push(tableRow.id);
        }
        for (const childElementToRemove of childElementsToRemove) {
            habitDataTable.removeChild(document.getElementById(childElementToRemove));
        }
    }

    // render new rows.
    const habitTableFragment = document.createDocumentFragment();
    const sortedHabits = [];
    getAllHabitsSorted().then(sortedHabits => {
        sortedHabits.sort(function(a, b) {
            return a.value.timestamp.localeCompare(b.value.timestamp);
        });
        sortedHabits.forEach(function(habit) {
            const tableRowElement = document.createElement('tr');
            const tableCell_1 = document.createElement('td');
            tableCell_1.textContent = new Date(habit.value.timestamp).toLocaleString("nl");
            tableRowElement.appendChild(tableCell_1);

            const tableCell_2 = document.createElement('td');
            tableCell_2.textContent = habit.value.description;
            tableRowElement.appendChild(tableCell_2);

            const tableCell_3 = document.createElement('td');
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "table_button";
            deleteButton.id = deleteHabitButtonIdPrefix + habit.id;

            const duplicateButton = document.createElement("button");
            duplicateButton.textContent = "Duplicate";
            duplicateButton.className = "table_button";
            duplicateButton.id = duplicateHabitButtonIdPrefix + habit.id;

            tableCell_3.appendChild(deleteButton);
            tableCell_3.appendChild(duplicateButton);
            tableRowElement.appendChild(tableCell_3);
            tableRowElement.id = habit.id;

            habitTableFragment.appendChild(tableRowElement); // No reflow yet
            habitDataTable.appendChild(habitTableFragment); // Single reflow here
        });
    })
};

renderNavigatedPageSection();
renderHabitTableRows()

const TEN_MINUTES_IN_MS = 1000 * 60 * 10;
setInterval(() => {
    // 1. Get the current date and time
    const now = new Date();

    // 2. Extract the current hour (0-23)
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // 3. Define your target hours
    const targetHours = [8, 12, 16, 20];

    // 4. Check if the current hour is in the list
    if (targetHours.includes(currentHour) && currentMinutes < 12) {
        showLocalNotification();
    }
}, TEN_MINUTES_IN_MS)