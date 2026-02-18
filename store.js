/**
 * +------------------------+
 * | LOCALFORAGE STORE INIT |
 * +------------------------+
 */
const habitStore = localforage.createInstance({
    name: "habits", // database name
    storeName: "habits" // table name
});

/**
 * +------------------------------------------+
 * | KEEP TRACK OF CURRENT HABIT BEING EDITED |
 * +------------------------------------------+
 */
const habitDraftStore = localforage.createInstance({
    name: "habits", // database name
    storeName: "habit_draft" // table name
});

export { habitStore, habitDraftStore }